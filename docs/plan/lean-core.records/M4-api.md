# M4 API worker：本地无能力兼容层

2026-10-01。供主集成应用 118 补丁并运行真实扩展宿主 fixture。本记录仅涵盖 API factory、ExtensionContext、common/node DI 和退休 API commands；协议、main-thread/customer、converters、普通消费者、product/prune 由主集成交付。

## 交付与快照

- 持久补丁：`patches/118-light-disabled-ai-api.patch`，50,003 bytes，SHA256 `9568e9e289963f2ce977d854905af24d831d0dccdc91957d20157080e9de36c5`。
- 根 HEAD：`f1961b7546139a6aa722ff0b8a001296d3041e33`；上游 vscode HEAD：`08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。两者均为生成树复制时的提交，不代表生成树无既有补丁。
- 独立源码：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m4-api-p381m5v2/source`。从当前 prepared `vscode/` 复制后应用 114。排除 `.git`、`node_modules`、根 `/out*`、准确名称的 `out`/`dist`/`*-out` 和 `.build`；没有使用全树 `out*`，普通 `vscode/src/vs/editor/contrib/documentSymbols/browser/outlineModel.ts`/output 前缀 源码在复制范围内。根、build、extensions 的 node_modules 是指向原安装的只读使用 symlink；没有安装或写入依赖。
- 私有 git 基线 `b3e49965dbca075f7a61d56394f51e803e9d5ec5` 只跟踪分配的五个前置源文件。114 不改变这些文件；115/116/117 也不改变这些文件。补丁不包含生成 bundle。共享 `vscode/`、既有 app、root 计划及其他 patch 没有由本 worker 修改。
- 真实宿主 fixture：`dev/test-fixtures/lean-core/package.json`、`dev/test-fixtures/lean-core/extension.js`、`dev/test-fixtures/lean-core/run.js`。它是开发测试扩展，不是内置发布扩展；默认 manifest 没有 enabledApiProposals。

| 补丁文件（均相对生成源码根） | 动作 |
| --- | --- |
| `src/vs/workbench/api/common/extHostDisabledAi.ts` | 新建本地对象、never event、惰性 Disposable、空查询及错误 helper |
| `src/vs/workbench/api/common/extHost.api.impl.ts` | 去 AI service import/access/actor 构造；稳定接口转本地对象；退休 proposal 先检查权限再 unavailable |
| `src/vs/workbench/api/common/extHostExtensionService.ts` | 去 LM DI，Context 每次创建本地 access information |
| `src/vs/workbench/api/common/extHost.common.services.ts` | 去 Eager LM/MCP 注册和 import |
| `src/vs/workbench/api/node/extHost.node.services.ts` | 去 Node MCP 注册和 import |
| `src/vs/workbench/api/common/extHostApiCommands.ts` | 去 inlineChat/prompt commands、专属参数类型和 import |

## 稳定 API 行为

`extHostDisabledAi.ts:11` 的 Disposable 不接受 provider/tool 参数，因此不保存、读取 getter 或订阅用户 provider。`neverEvent:15` 忽略 listener/thisArgs，返回新 Disposable 并按 Event 约定加入调用方传入的 disposables 数组，始终不调用 callback。

| 接口 | 最终行为及证据 |
| --- | --- |
| `chat.createChatParticipant` | 工厂转到 `extHostDisabledAi.ts:46`。id 为只读稳定接口；handler 可读写且 setter 验证 function；iconPath/followupProvider 可读写，feedback 是 never event。dispose 幂等，清 followup；服务不执行 handler/followup |
| `lm.selectChatModels` | 本地 `Promise.resolve([])`，忽略 selector，不发现模型；未创建伪 LanguageModelChat |
| `lm.onDidChangeChatModels` / access info `onDidChange` | 相同 never event；监听、解除均无 RPC |
| `lm.tools` | 固定 `Object.freeze([])`，注册前后是同一个数组 |
| `registerTool` / `registerLanguageModelChatProvider` / `registerMcpServerDefinitionProvider` | 本地惰性 Disposable，不保留 provider/tool、不读 getter、不订阅、不执行 |
| 稳定 string `lm.invokeTool` | 不同步 throw；Promise reject 实际 `LanguageModelError.NotFound`，name=`LanguageModelError`，code=`NotFound`，message=`Language model tools are unavailable in this product.` |
| `ExtensionContext.languageModelAccessInformation` | `extHostExtensionService.ts:526` 创建本地对象；`canSendRequest(...)` 返回 undefined，事件不发，不索取 consent |
| 纯数据构造/枚举 | factory 类型返回区保留；没有编辑 extHostTypes。测试使用真实 LM message/text/result/error、MCP stdio/http 数据构造；构造不启动命令或 HTTP |

`LanguageFeatures`、`Languages`、普通 Comments、文件系统、认证、终端、Tasks、Webview 等 actor 与普通 API 继续保留。`AISearchKeyword` 来自 searchExtTypes 的纯 enum，按数据保留边界留住；`workspace.registerAITextSearchProvider` 的能力入口已 unavailable。Browser API/actor 不在 118 删除范围，交给 M5。

## 退休 proposed 入口与权限边界

所有下列入口先调用原 `checkProposedApiEnabled`，授权后才进入本地 unavailable。未授权保留实际权限失败，不把权限错误吞成空结果。异步返回值使用 rejected Promise；原本 async 的 computeEmbeddings 保持 async，权限失败仍是 reject。多数原同步 wrapper 的权限检查继续同步抛出，获权后的异步能力拒绝不会同步抛出。没有修改 product allowlist。

| proposal | 入口 | 获权后的失败 |
| --- | --- | --- |
| `agentEditorComments` | window.createAgentEditorComments | 同步 unavailable |
| `chatStatusItem` | window.createChatStatusItem | 同步 |
| `chatParticipantPrivate` | window.activeChatPanelSessionResource / onDidChangeActiveChatPanelSessionResource；chat.createDynamicChatParticipant / registerChatParticipantDetectionProvider / onDidDisposeChatSession / updateQuotas；lm.registerLanguageModelProxyProvider / registerIgnoredFileProvider；participant.supportIssueReporting get/set | 同步 |
| `agentSessionsWorkspace` | workspace.isAgentSessionsWorkspace | 同步 |
| `aiTextSearchProvider` **和** `textSearchProvider2` | workspace.registerAITextSearchProvider | 保留两个原检查，之后同步 |
| `interactive` | interactive.transferActiveChat | Promise reject |
| `aiRelatedInformation` | ai.getRelatedInformation；registerRelatedInformationProvider / registerEmbeddingVectorProvider | 查询 Promise reject，注册同步 |
| `aiSettingsSearch` | ai.registerSettingsSearchProvider | 同步 |
| `mappedEditsProvider` | chat.registerMappedEditsProvider / registerMappedEditsProvider2 | 同步，包括原本返回 noop 的已废弃入口 |
| `chatSessionsProvider` | chat.registerChatSessionItemProvider / createChatSessionItemController / registerChatSessionContentProvider | 同步；不再发 AI-only deprecation telemetry |
| `chatOutputRenderer` | chat.registerChatOutputRenderer | 同步 |
| `chatContextProvider` | registerChatWorkspaceContextProvider / registerChatAttachContextProvider / registerChatTabContextProvider / registerChatExplicitContextProvider / registerChatResourceContextProvider | 同步；包括原本 noop 入口 |
| `chatPromptFiles` | chat.registerCustomAgentProvider / registerInstructionsProvider / registerPromptFileProvider / registerSkillProvider / registerHookProvider；getCustomAgents / getInstructions / getSkills / getSlashCommands / getHooks / getPlugins；六项 onDidChange* | 六项查询 Promise reject；注册/事件同步 |
| `chatDebug` | chat.registerChatDebugLogProvider / onDidReceiveChatDebugEvent | 同步 |
| `chatSessionCustomizationProvider` | chat.registerChatSessionCustomizationProvider | 同步 |
| `chatInputNotification` | chat.createInputNotification | 同步 |
| `languageModelProxy` | lm.isModelProxyAvailable / onDidChangeModelProxyAvailability / getModelProxy | getModelProxy Promise reject；其他同步 |
| `embeddings` | lm.embeddingModels / onDidChangeEmbeddingModels / registerEmbeddingsProvider / computeEmbeddings | computeEmbeddings Promise reject；其他同步 |
| `languageModelToolSupportsModel` | lm.registerToolDefinition | 同步；检查由原 actor 移至工厂 |
| `chatParticipantAdditions` | 对象 overload lm.invokeTool；lm.fileIsIgnored / onDidChangeChatRequestTools；participant.participantVariableProvider get/set / onDidPerformAction / onDidChangePauseState | invokeTool/fileIsIgnored Promise reject；其他同步。string overload 不要求 proposal |
| `mcpServerDefinitions` | lm.onDidChangeMcpServerDefinitions / mcpServerDefinitions / startMcpGateway | startMcpGateway Promise reject；其他同步 |
| `speech` | speech.registerSpeechProvider | 同步 |
| `defaultChatParticipant` | participant.helpTextPrefix / helpTextPostfix / additionalWelcomeMessage / titleProvider / summarizer get/set | 同步；不保存这些专属 provider |

错误消息精确为 `<API 名称> is unavailable in this product.`。participant 提议属性由本地权限回调检查后失败；不借读取/设置恢复服务。

AgentEditorComments 的实际链路是 `vscode/src/vs/workbench/api/browser/mainThreadAgentEditorComments.ts` → `IAgentEditorCommentsBridge` → sessions provider。普通 Markdown Editor 原本在 `extensions/markdown-language-features/src/preview/markdownEditorProvider.ts:683` 无条件创建此 bridge；主集成已收到这一具体入边，必须先解绑该调用及内置 manifest proposal。118 不编辑 Markdown；只应用 118 会使这个旧消费者明确失败，不能声称普通 Markdown 已验收。

## 工厂与 DI 删除

从 factory 删 ExtHostChatProvider、ChatOutputRenderer、LanguageModelTools、ChatSessions、ChatAgents2、ChatContext、ChatDebug、AiRelatedInformation、AiEmbeddingVector、AiSettingsSearch、Speech、Embeddings、ChatQuota、CodeMapper、AgentEditorComments、Mcp 的注册/获取/构造，以及 ChatStatus、ChatInputNotification 非 actor 对象。common/node eager LM/MCP 注册与 import 同步撤销。ExtensionContext 不再注入 IExtHostLanguageModels。

工厂仍执行原始全集 `Object.values<ProxyIdentifier<any>>(ExtHostContext)` 与 `rpcProtocol.assertRegistered(expected)`（生成后 factory:236–237）；没有 assert 过滤、Null service 或替代 RPC。这个私有快照的 protocol 尚未与主集成缩减的 34 IDs/Shapes 合并，因此不能拿进程内 API 通过代替 factory 注册全集通过；未实际启动该快照宿主，也没有伪造 Missing proxy/Unknown service 的成功结果。

API command 表去 `vscode.editorChat.start` → inlineChat.start 和 `vscode.extensionPromptFileProvider` → _listExtensionPromptFiles；删除只服务这两个命令的 InlineChat 参数类型、ISelection/PromptsType/IExtensionPromptFileResult import。普通 commands 不动。

## 已执行检查

沿用 M3 中已绿且本次未影响的 Mermaid/UI 构建检查，不重复运行。以下为新增/受影响检查。

| 检查 | 实际结果与边界 |
| --- | --- |
| 全图 noEmit | `vscode/node_modules/@typescript/native/bin/tsc --noEmit -p /var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m4-api-p381m5v2/source/src/tsconfig.json`，最终 exit 0；`/tmp/lean-m4-tsc-final.log` 为 0 bytes。不写 out，未改 skipLibCheck/tsconfig。该快照未删 AI 源目录，完整删除后的编译由主集成执行 |
| JS fixture syntax | `node --check dev/test-fixtures/lean-core/run.js` / extension.js，exit 0 |
| 实际 API 模块与工厂方法 | `node /tmp/lean-m4-headless.mjs`，exit 0。unauthorized/authorized 各稳定 contract + 80 proposed paths passed；授权异步入口检查不 sync throw 并必须 reject。使用持久 fixture 的 checkStable/checkProposed |
| 运行图 | esbuild metafile 89 个实际 runtime inputs；无 contrib/chat、contrib/mcp、extHostChat/LanguageModels/LanguageModelTools/Mcp/Speech/Embedding 或 agentHost runtime inputs。type-only 导入不产生运行依赖 |
| patch 重放 | 私有 git HEAD archive 恢复前置五文件，`git apply --check` 和 `git apply` 均 exit 0，六个最终文件逐字节一致 |
| diff 格式 | 私有源码 `git diff --check`，exit 0 |

Headless 测试装配 位于临时脚本 `/tmp/lean-m4-headless.mjs`：从实际 extHost.api.impl.ts 读取完整 chat/lm/ai/interactive/speech namespace 和涉及的 window/workspace 方法，直接 bundle 实际 extHostDisabledAi、extHostTypes、URI、CancellationTokenSource 和原 checkProposedApiEnabled。输出均在私有根 `actual-factory-entry.ts` / `actual-factory.cjs` / `actual-factory-metafile.json`。它没有运行整个工厂或 DI/actor 初始化，也没有打开 Webview、执行 ordinary findFiles2；这些留给真实宿主。

首轮进程内授权测试发现 computeEmbeddings 错误 API 消息为 lm.async；已修为 lm.computeEmbeddings 并重跑两种权限模式通过。另检查工厂时修正 stable string invokeTool 的权限检查，使该检查仅在对象 overload 内。最终固定 name/code 的稳定 invokeTool 已由两种模式实测。

## 真实宿主 fixture 的集成用法与未验收项

Fixture `run()` 依赖真实 vscode，要求环境变量 `LEAN_TEST_WORKSPACE` 是独占绝对工作区，`LEAN_TEST_RUN_ID` 是当前 run 唯一标识。在工作区写 lean-core-results.json（运行时生成），先写 running，结束写 passed/failed、时间、checks 和错误；失败重新 throw。每次运行必须核对结果文件的 runId 与 passed，不能仅凭 mac CLI exit 0 判定。

无权限模式使用持久默认 manifest 和不带授权的独立 extension-development profile。获权模式必须复制这三文件到临时扩展目录，把 run.js 导出的 proposals 写入临时 package.json#enabledApiProposals，设置 `LEAN_TEST_PROPOSALS=authorized`，使用 `--enable-proposed-api lean-tests.lean-core-fixture` 或正常扩展 development 授权。仅改临时 manifest，不改持久 product allowlist。proposals 包含普通 `findFiles2` 控制项：无权限应仍被拒；获权创建隔离工作区文件并经真实 search 返回它。aiTextSearchProvider 双权限都在授权清单，主集成如只授权其中之一还应观察第二项正常权限失败。

两种运行均覆盖：stable participant/LM/MCP 的惰性与数据对象、80 条 proposal 路径（含 AgentEditorComments 及 participant get/set）、普通 command/document/status bar、退休 command 不在注册表；普通 Webview ready→ping→pong 是有超时和 runId 校验的真实消息链。fixture 不发送网络请求，不启动 MCP command。

[TODO] 主集成应用 118 与协议/customer/普通消费者补丁后，以真实 Electron 可等待进程执行两种模式，并核对结果文件。118 worker 未运行真实宿主、未验收普通 Markdown、真实 Webview、完整 factory 注册或最终 AI source prune；不能把这些列为通过。沿用已经绿色且未受影响的基线检查，只对本次变化和失败新增验证。
