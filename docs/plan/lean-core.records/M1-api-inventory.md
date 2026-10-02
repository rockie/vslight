# M1 · Chat / LM / MCP / Speech / agentHost API 与入边调查

- 对应计划：[lean-core.md](../lean-core.md) §4、§5.4、M1。
- 最近更新：2026-10-01 21:13 +1000。
- 状态：只读调查已落盘；这是 M1 API 子任务记录，不表示 M1 构建、实机或契约验收已通过。
- root HEAD：`f1961b7546139a6aa722ff0b8a001296d3041e33`；调查开始 root 工作树干净。当前记录为本子任务唯一新文件。
- vscode HEAD：`08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。生成树有 5777 条 tracked/untracked 状态记录，已有补丁和 prune 已施加；`git diff --binary HEAD` SHA256：`046ee0eae8404f9a03d600fc4ce6c121f1f48f3bfd548215c1316bf2c9224fb5`。SHA 是生成态标识，不能冒充最终 app source commit。调查未修改 vscode、patch、prune 或构建资源。
- 扫描范围：当前实际存在的 `vscode/src/**/*.(ts|js|json|html|css)`，共 8377 文件；逐个解析引号字符串，对相对路径做 `normpath(parent/path)` 后判断目标删除域，同时扫服务、DTO、类型和命令/资源字符串。全量外部路径入边为 469 文件 / 1776 条，其中生产 320 文件、测试 149 文件；详细入边及引用索引见后文。删除域内部 2080 文件按域整体退役，不把域内 import 当作待解绑普通消费者。

## 处置与验证编码

每个具体入边都继承其源文件表头的处置和验证编码；同一文件中只删除对应 AI 分支，保留其余功能。行号来自本次生成树，应用补丁后应按符号检索。

| 编码 | 动作和原因 |
| --- | --- |
| U-A | 解绑 API runtime 导入/DI/actor/客户注册；稳定 API 接到纯本地无能力对象；proposed 入口权限检查后 unavailable。普通扩展宿主必须初始化。 |
| U-C | 删除专属 runtime converter/DTO 和调用者；保留普通 Command/URI/Markdown/Notebook/Terminal converter。类型构造本身不用后台 converter。 |
| P-D | 保留稳定 API 纯数据；移除指向 Chat 服务的类型 import，确需 proposed 纯数据时在 API 层定义最小字面量类型。 |
| U-N | 删除本文件 AI import、DI、订阅、分支/菜单/帮助；保留普通路径，不注入 Null Chat/MCP 服务。 |
| U-R | 撤工作台/main/shared/CLI 服务及 IPC 注册和声明；保留普通平台注册。 |
| D-S | `sessions/**` 是专属 Agents 应用源码，删除该专属源码及入口/构建/test 依赖；当前全量 src typecheck 仍包含它。禁止为它保留 Chat/agentHost 实现。集成人必须连同其外部入边收口后执行。 |
| D-X | 删除专属适配/工具/账户动作/插件解析模块及注册；普通终端、认证、扩展市场保留。 |
| D-B | 与 M5 删除 BrowserView 专属实现一起退役；不会因此修改普通 Webview。 |
| D-O | 既有 Notebook/Debug/Interactive/remoteCodingAgents 裁剪域残留，按现有保留边界删除专属源码及相应入口/测试；不能只关闭 runtime 后让它们继续 import 已删服务。 |
| D-T | 删除退役功能的专属测试/组件 fixture 与 import；新增无能力真实宿主 fixture 承担稳定 API 兼容验收。 |
| U-T | 混合/通用测试删除 AI fixture/mock/断言和参数，保留普通测试；若该文件全部测试仅属退休功能则删文件，不能 tsconfig exclude 掩盖。 |

| 验证 | 实施后需要执行；本次未执行 |
| --- | --- |
| T-A | §4.1 真扩展宿主 fixture：普通 API 可激活；空模型/tools；never-fired Event 与 thisArgs/disposables；provider 方法和 getter/事件订阅计数均 0；参与者可读写；dispose 幂等；invokeTool 是异步 reject，name=LanguageModelError/code=NotFound；accessInfo undefined；授权退休 proposal 仍不可用。 |
| T-C | 全图 `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`；重放补丁+prune；所有剩余 actor 继续 `assertRegistered`。不能只编单文件、改 any 或 exclude。 |
| T-N | 终端普通 profile/tabs/布局/过滤、命令落盘；task 运行/停止及错误通知；无未知 DI/actor。 |
| T-V | §9.3 编辑器/终端 Accessibility Help、终端/hover Accessible View，读内容并验证关闭焦点回归。 |
| T-H | 普通测试 provider 的 session/get/remove、账户菜单、secret 往返；不读取真实 token，不删除原历史/凭据。 |
| T-P | 本地字符串/TF-IDF 搜索、普通 JSON 设置诊断/编辑；AI/MCP 分组/迁移 code action 不再注册。 |
| T-E | 文件/符号/命令搜索、普通编辑和 language hint、SCM diff/stage/commit/Problems、市场 enablement、Welcome/Issue 手填路径。 |
| T-R | 冷启动/Reload logs 无 DI/customer/RPC 失败；命令/设置/菜单/快捷键/视图/viewsWelcome/walkthrough 分别枚举；app 无常驻 agent/MCP/speech 进程或下载。 |

## API 工厂、context 与 actors 冻结

| 路径/符号 | 具体动作 | 原因 / 验证 |
| --- | --- | --- |
| `workbench/api/common/extHost.api.impl.ts:createApiFactoryAndRegisterActors` L177–178/L202/L254–270/L281–282 | 删 `accessor.get(IExtHostLanguageModels)`、两次 `IExtHostMpcService` 获取，以及全部 Chat/LM/MCP/Speech/Ai/CodeMapper actor 构造、`rpcProtocol.set` 和私有状态对象；stable namespace 接新 `extHostDisabledAi`。 | 普通扩展工厂无条件执行；已有拼写是 **Mpc**，不要误按 Mcp 搜索。T-A/T-C。 |
| 同文件 L273–275；`extHostRpcService.ts`；`api/browser/mainThreadExtensionService.ts` 的 customer 完整性检查 | 保留 `Object.values(ExtHostContext)` 和 `rpcProtocol.assertRegistered(expected)`；双方删除 proxy identifier 与客户注册后，校验剩余全集。 | 不能用关闭校验让普通 Webview/terminal/command actor 漏注册。T-C/T-R。 |
| `api/common/extHost.common.services.ts` L32/L35/L47/L72；`api/node/extHost.node.services.ts` L30–31/L65 | 删除 LM/MCP eager singleton 与 Node MCP override；不要保留 eager Null service。 | 无能力对象不需要 DI。T-A/T-C。 |
| `api/common/extHostExtensionService.ts` L37/L139/L527/L556 | 去 constructor 的 `IExtHostLanguageModels`；`_loadExtensionContext` 在本地构造 accessInfo，保留 context getter。 | 当前每个扩展都生成 accessInfo；原 `extHostLanguageModels.ts:createLanguageModelAccessInformation` L674 恒 true，不符合无模型语义。T-A。 |
| `api/browser/extensionHost.contribution.ts` L22–25/L60/L94–104 | 删除 16 个专属 MainThread 模块副作用 import（包括 AI settings/related/embedding 和 code mapper）。 | import 会注册客户，即使无 UI 也在宿主初始化触发。T-C/T-R。 |
| `api/browser/mainThreadWebviewManager.ts` L14/L36–37 | 删除 renderer import、createInstance 和 `context.set(MainThreadChatOutputRenderer)`；保留 MainThreadWebviews/Panels/Views/CustomEditors。 | 同一个 Chat actor 还有独立 Webview manager 创建入口。T-A + 普通双向 Webview fixture。 |
| `api/browser/mainThreadEditorTabs.ts` L19/L201–206；`api/common/extHostEditorTabs.ts`；protocol `TabInputKind.ChatEditorInput`/`ChatEditorInputDto`/`AnyInputDto` | 删退休 runtime `instanceof ChatEditorInput` 分支；普通 tab DTO 和 tab 事件继续；纯 `ChatEditorTabInput`/TabInputChat 数据可留 API 层。 | 退休 serializer 不需要重造 editor。protocol numeric discriminator 若删除须显式固定其余值，不因自增枚举删项而改 wire 值。T-A/T-C + 混合 tab 恢复测试。 |
| `api/common/extHostApiCommands.ts` L25–26/L539–590 | 删除 `vscode.editorChat.start` → `inlineChat.start` 转接、prompt-file 命令参数转换和其专属声明；保留普通 `ApiCommandArgument` 注册。 | 不留下不可见执行入口。T-E/T-C。 |
| `api/browser/mainThreadAuthentication.ts` L33/L36/L207/L713–739 | 去 MCP enterprise IdP 配置、per-resource MCP client secret 提示/键分支；保留普通 OAuth provider/session/secret 路径。 | 认证不是整域退休；MCP secret 数据原地留存。T-H/T-C。 |

本表路径统一相对 `vscode/src/vs/`。下面的 actor 名称直接取自当前 protocol；Main/Ext 必须成组删除相应 Shape、DTO imports、代理请求和 actor 文件。`agentHost` 不属于这里的 extension RPC actor；它经 platform/workbench DI、IPC 和 terminal 适配运行，不能因无对应 proxy 名就认为闭包已结束。

| Protocol 行 | proxy key / Shape | wire 名称 | 处置/验证 |
| --- | --- | --- | --- |
| 4048 | `MainThreadLanguageModels` / `MainThreadLanguageModelsShape` | `'MainThreadLanguageModels'` | 删除专属 RPC；T-A/T-C |
| 4050 | `MainThreadChatAgents2` / `MainThreadChatAgentsShape2` | `'MainThreadChatAgents2'` | 删除专属 RPC；T-A/T-C |
| 4051 | `MainThreadCodeMapper` / `MainThreadCodeMapperShape` | `'MainThreadCodeMapper'` | 删除专属 RPC；T-A/T-C |
| 4052 | `MainThreadLanguageModelTools` / `MainThreadLanguageModelToolsShape` | `'MainThreadChatSkills'` | 删除专属 RPC；T-A/T-C |
| 4084 | `MainThreadSpeech` / `MainThreadSpeechShape` | `'MainThreadSpeechProvider'` | 删除专属 RPC；T-A/T-C |
| 4120 | `MainThreadMcp` / `MainThreadMcpShape` | `'MainThreadMcpShape'` | 删除专属 RPC；T-A/T-C |
| 4121 | `MainThreadAiRelatedInformation` / `MainThreadAiRelatedInformationShape` | `'MainThreadAiRelatedInformation'` | 删除专属 RPC；T-A/T-C |
| 4122 | `MainThreadAiEmbeddingVector` / `MainThreadAiEmbeddingVectorShape` | `'MainThreadAiEmbeddingVector'` | 删除专属 RPC；T-A/T-C |
| 4123 | `MainThreadChatStatus` / `MainThreadChatStatusShape` | `'MainThreadChatStatus'` | 删除专属 RPC；T-A/T-C |
| 4124 | `MainThreadChatQuota` / `MainThreadChatQuotaShape` | `'MainThreadChatQuota'` | 删除专属 RPC；T-A/T-C |
| 4125 | `MainThreadChatInputNotification` / `MainThreadChatInputNotificationShape` | `'MainThreadChatInputNotification'` | 删除专属 RPC；T-A/T-C |
| 4126 | `MainThreadAiSettingsSearch` / `MainThreadAiSettingsSearchShape` | `'MainThreadAiSettingsSearch'` | 删除专属 RPC；T-A/T-C |
| 4128 | `MainThreadChatSessions` / `MainThreadChatSessionsShape` | `'MainThreadChatSessions'` | 删除专属 RPC；T-A/T-C |
| 4129 | `MainThreadChatOutputRenderer` / `MainThreadChatOutputRendererShape` | `'MainThreadChatOutputRenderer'` | 删除专属 RPC；T-A/T-C |
| 4130 | `MainThreadChatContext` / `MainThreadChatContextShape` | `'MainThreadChatContext'` | 删除专属 RPC；T-A/T-C |
| 4131 | `MainThreadChatDebug` / `MainThreadChatDebugShape` | `'MainThreadChatDebug'` | 删除专属 RPC；T-A/T-C |
| 4136 | `ExtHostCodeMapper` / `ExtHostCodeMapperShape` | `'ExtHostCodeMapper'` | 删除专属 RPC；T-A/T-C |
| 4180 | `ExtHostChatOutputRenderer` / `ExtHostChatOutputRendererShape` | `'ExtHostChatOutputRenderer'` | 删除专属 RPC；T-A/T-C |
| 4191 | `ExtHostChatAgents2` / `ExtHostChatAgentsShape2` | `'ExtHostChatAgents'` | 删除专属 RPC；T-A/T-C |
| 4192 | `ExtHostLanguageModelTools` / `ExtHostLanguageModelToolsShape` | `'ExtHostChatSkills'` | 删除专属 RPC；T-A/T-C |
| 4193 | `ExtHostChatProvider` / `ExtHostLanguageModelsShape` | `'ExtHostChatProvider'` | 删除专属 RPC；T-A/T-C |
| 4194 | `ExtHostChatContext` / `ExtHostChatContextShape` | `'ExtHostChatContext'` | 删除专属 RPC；T-A/T-C |
| 4195 | `ExtHostChatDebug` / `ExtHostChatDebugShape` | `'ExtHostChatDebug'` | 删除专属 RPC；T-A/T-C |
| 4196 | `ExtHostSpeech` / `ExtHostSpeechShape` | `'ExtHostSpeech'` | 删除专属 RPC；T-A/T-C |
| 4198 | `ExtHostAiRelatedInformation` / `ExtHostAiRelatedInformationShape` | `'ExtHostAiRelatedInformation'` | 删除专属 RPC；T-A/T-C |
| 4199 | `ExtHostAiEmbeddingVector` / `ExtHostAiEmbeddingVectorShape` | `'ExtHostAiEmbeddingVector'` | 删除专属 RPC；T-A/T-C |
| 4200 | `ExtHostAiSettingsSearch` / `ExtHostAiSettingsSearchShape` | `'ExtHostAiSettingsSearch'` | 删除专属 RPC；T-A/T-C |
| 4211 | `ExtHostMcp` / `ExtHostMcpShape` | `'ExtHostMcp'` | 删除专属 RPC；T-A/T-C |
| 4213 | `ExtHostChatSessions` / `ExtHostChatSessionsShape` | `'ExtHostChatSessions'` | 删除专属 RPC；T-A/T-C |
| 4214 | `ExtHostChatQuota` / `ExtHostChatQuotaShape` | `'ExtHostChatQuota'` | 删除专属 RPC；T-A/T-C |

Actor 表已逐项复核，仅 30 个明确属于 AI 的 proxy key 退役。以下普通语言 actors 必须保留，其 Shape、工厂、客户注册和对应模块也保留：

| 必须保留的 proxy key | 代码证据与行为 |
| --- | --- |
| MainThreadLanguages / ExtHostLanguages | `mainThreadLanguages.ts`、`extHostLanguages.ts`；factory L233 创建 ExtHostLanguages，普通 language ID/diagnostics 等 API 需要它。 |
| MainThreadLanguageFeatures / ExtHostLanguageFeatures | `mainThreadLanguageFeatures.ts`、`extHostLanguageFeatures.ts`；factory L234 创建普通 provider bridge，completion/hover/definition/code action 等需要它。 |

`LanguageModels` 与 `Languages/LanguageFeatures` 是不同服务；禁止用 `Language.*` 正则决定源码或 actor 删除。初版 actor 自动提取误把这 4 项列为删除，已纠正；本记录的路径入边删除域从始至终使用 `LanguageModels?`/`LanguageModelTools` 精确范围，未把普通语言源码纳入删除域。普通 URI/Command/IconPath/NotebookEdit/TerminalQuickFix 与诊断数据亦保留；历史补全性能语料 `api/test/browser/extHostDocumentData.test.perf-data.ts` 内路径/AI 字样属于数据，不据此删除普通性能测试。

特别易漏：`MainThreadLanguageModelTools` 的 wire 字符串是 `MainThreadChatSkills`，`ExtHostLanguageModelTools` 是 `ExtHostChatSkills`；speech Main 的 wire 字符串是 `MainThreadSpeechProvider`。删服务时按 proxy key、Shape、wire 三者检索，不能只搜类名。

## 稳定类型与常量保留清单

- `src/vscode-dts/vscode.d.ts` L19598–21212 及 context L8575 的稳定声明原样保留，namespace `chat`/`lm` 不能变为 undefined；不实例化 `LanguageModelChat`、不伪造 `sendRequest/countTokens`。
- `api/common/extHostTypes.ts`：稳定 `ChatRequestTurn`、`ChatResponseTurn`、`ChatResultFeedbackKind`、`ChatResponseMarkdownPart`、`ChatResponseFileTreePart`、`ChatResponseAnchorPart`、`ChatResponseProgressPart`、`ChatResponseReferencePart`、`ChatResponseCommandButtonPart`；`LanguageModelChatMessageRole`、`LanguageModelChatMessage`、`LanguageModelError`、`LanguageModelChatToolMode`、`LanguageModelToolCallPart`、`LanguageModelToolResultPart`、`LanguageModelTextPart`、`LanguageModelPromptTsxPart`、`LanguageModelToolResult`、`LanguageModelDataPart`；`McpStdioServerDefinition`、`McpHttpServerDefinition`。保持 constructor 参数、静态工厂、`instanceof`、name/code/toJSON 的既有数据语义；类型测试继续覆盖这些。
- d.ts 的 `ChatParticipant/Handler/FollowupProvider/Context/Result/Request/ResponseStream`、`LanguageModelChatProvider/Information/Capabilities/Selector/AccessInformation/Tool*`、`McpServerDefinition/Provider` 等 interface/type 继续保留。返回本地 participant 必须有 id、requestHandler、iconPath、followupProvider、onDidReceiveFeedback 和重复可调用 dispose；不保存/订阅注册 provider，不调用 handler。
- `api/common/extHostTypes.ts:LanguageModelError` L4174–4203 保留 `NotFound/NoPermissions/Blocked/tryDeserialize`；invokeTool 使用 NotFound，错误 name 固定 `LanguageModelError`，code 为 `NotFound`，方法调用不同步抛错。
- `base/common/marshallingIds.ts` 的 LM data/result/text/prompt/thinking IDs 是纯 serialization 常量，可原值保留；普通 `Uri/Scm*/Comment*/TerminalContext/Test*/Date` 也完整保留。不要删自增枚举中间项造成后续 ID 漂移。仅被删除 runtime 使用的 Chat/Agent IDs 可保留作未使用数字占位或固定其余值后删除；不是服务保留。
- `api/common/extHostTypes.ts` L33 只有 `HookTypeValue` 一个 Chat-domain type import，使用于 proposed `ChatResponseHookPart` L3262/L3266。如果保留该纯 constructor，在 API 层定义最小 union：`SessionStart | SessionEnd | UserPromptSubmit | PreToolUse | PostToolUse | PreCompact | SubagentStart | SubagentStop | Stop | ErrorOccurred`；删 import，不迁移 `HOOKS_BY_TARGET`、Target、localized metadata 或整个 prompt parser。它不是稳定契约必需项；删除 proposed constructor 也不影响 stable fixture。
- `base/common/network.ts:Schemas.vscodeChat* / sessionsChatInput / chatEditing*` 只是 scheme 常量，去运行 consumers 后可按常量引用清单删；不得用保留 scheme 常量理由恢复 agentHost resource provider。普通 `file/http/https/vscodeTerminal/vscodeUserData` 等保持。
- `api/common/extHostTypes.ts` 其余 proposed Chat/LM/MCP/Speech 纯 constructor/enum 可保留用于 TS API object shape，但不承诺运行能力；若删须一起修改 factory 暴露和相关 tests。下节逐项说明退休行为入口。保留纯类型不等于保留对应 converters/服务。

## Proposed 入口与声明冻结

`extHost.api.impl.ts` 的 `interactive.transferActiveChat`、`ai.*`、`chat.*` proposed、`lm.*` proposed、`speech.*`、`window.createChatStatusItem/activeChatPanelSessionResource/onDidChangeActiveChatPanelSessionResource` 先维持现有 `checkProposedApiEnabled` 语义，授权后明确 unavailable；返回 Thenable 的入口必须 rejected Promise。不能残留成功 no-op 的 `registerMappedEditsProvider` 来暗示能力。下表是工厂直接检查集；仅供数据形状/事件能力附加的 proposal 文件另见扫描表。

| Proposal | 当前入口或依赖 | 动作/验证 |
| --- | --- | --- |
| interactive | transferActiveChat | 权限检查后 rejected Promise；保留其他无关 proposal；T-A |
| aiRelatedInformation / aiSettingsSearch | ai.getRelatedInformation/registerRelatedInformationProvider/registerEmbeddingVectorProvider/registerSettingsSearchProvider | 退休查询与注册；T-A |
| mappedEditsProvider | chat.registerMappedEditsProvider/2 + CodeMapper actors | unavailable，删除 code mapping runtime；T-A/T-C |
| chatParticipantPrivate | dynamic participant/detection/dispose session/quotas/LM proxy provider/ignoredFileProvider、window activeChatPanelSessionResource/onDidChangeActiveChatPanelSessionResource | unavailable，不执行 provider；T-A |
| chatSessionsProvider | session item provider/controller/content provider | unavailable，不创建 session；T-A |
| chatOutputRenderer / chatContextProvider | renderer、workspace/attach/tab/explicit/resource context | unavailable，不注册 Webview Chat renderer；T-A |
| chatPromptFiles | custom agent/instructions/prompt/skill/hook providers与get*/onDidChange* | unavailable，异步入口 reject；不要导入 PromptsType 或保留 prompt scanner；T-A |
| chatDebug / chatSessionCustomizationProvider / chatInputNotification | debug provider/events、customization provider、notification | unavailable；T-A |
| chatStatusItem / chatParticipantAdditions | window.createChatStatusItem；invokeTool(info)/onDidChangeChatRequestTools、fileIsIgnored | 只退休 proposed overload/入口，稳定 invokeTool(string) 继续异步 NotFound；T-A |
| languageModelProxy / embeddings | model proxy availability/provider；embedding models/events/provider/compute | unavailable，异步 reject；T-A |
| mcpServerDefinitions / speech | MCP definitions/events/gateway；registerSpeechProvider | unavailable，无 MCP gateway/语音 provider；T-A |
| languageModelToolSupportsModel | registerToolDefinition（当前工厂未显式 check） | 补对应 check 后 unavailable；不要把它误记稳定注册；T-A |

额外核对：`lm.fileIsIgnored` 位于 `vscode.proposed.chatParticipantAdditions.d.ts`，`lm.registerIgnoredFileProvider` 位于 private proposal；当前工厂没有直接权限 check，靠 runtime 内部判断。退休后不能因为删除 actor 而绕过权限检查。稳定 `registerLanguageModelChatProvider` 在 vscode.d.ts L20847、MCP provider L20838，必须返回本地惰性 Disposable，不应当按 proposed 异常处理。

## Converter 删除冻结

`api/common/extHostTypeConverters.ts` 删除下列专属 namespace，以及仅被这些 namespace 消费的私有 helper/import/DTO：

- L2299 `ChatFollowup`：删除 runtime 转换；T-A/T-C。
- L2320 `LanguageModelChatMessageRole`：删除 runtime 转换；T-A/T-C。
- L2339 `LanguageModelChatMessage`：删除 runtime 转换；T-A/T-C。
- L2466 `LanguageModelChatMessage2`：删除 runtime 转换；T-A/T-C。
- L2613 `ChatResponseMarkdownPart`：删除 runtime 转换；T-A/T-C。
- L2625 `ChatResponseCodeblockUriPart`：删除 runtime 转换；T-A/T-C。
- L2639 `ChatResponseMarkdownWithVulnerabilitiesPart`：删除 runtime 转换；T-A/T-C。
- L2652 `ChatResponseConfirmationPart`：删除 runtime 转换；T-A/T-C。
- L2664 `ChatResponseQuestionCarouselPart`：删除 runtime 转换；T-A/T-C。
- L2719 `ChatResponseFilesPart`：删除 runtime 转换；T-A/T-C。
- L2758 `ChatResponseMultiDiffPart`：删除 runtime 转换；T-A/T-C。
- L2787 `ChatResponseAnchorPart`：删除 runtime 转换；T-A/T-C。
- L2817 `ChatResponseProgressPart`：删除 runtime 转换；T-A/T-C。
- L2829 `ChatResponseThinkingProgressPart`：删除 runtime 转换；T-A/T-C。
- L2843 `ChatResponseHookPart`：删除 runtime 转换；T-A/T-C。
- L2858 `ChatResponseVoiceProgressPart`：删除 runtime 转换；T-A/T-C。
- L2868 `ChatResponseAutoModeResolutionPart`：删除 runtime 转换；T-A/T-C。
- L2888 `ChatResponseWarningPart`：删除 runtime 转换；T-A/T-C。
- L2900 `ChatResponseInfoPart`：删除 runtime 转换；T-A/T-C。
- L2912 `ChatResponseExtensionsPart`：删除 runtime 转换；T-A/T-C。
- L2921 `ChatResponsePullRequestPart`：删除 runtime 转换；T-A/T-C。
- L2949 `ChatResponseMovePart`：删除 runtime 转换；T-A/T-C。
- L2962 `ChatToolInvocationPart`：删除 runtime 转换；T-A/T-C。
- L3228 `ChatTask`：删除 runtime 转换；T-A/T-C。
- L3237 `ChatTaskResult`：删除 runtime 转换；T-A/T-C。
- L3246 `ChatResponseCommandButtonPart`：删除 runtime 转换；T-A/T-C。
- L3261 `ChatResponseTextEditPart`：删除 runtime 转换；T-A/T-C。
- L3303 `ChatResponseNotebookEditPart`：删除 runtime 转换；T-A/T-C。
- L3314 `ChatResponseWorkspaceEditPart`：删除 runtime 转换；T-A/T-C。
- L3326 `ChatResponseReferencePart`：删除 runtime 转换；T-A/T-C。
- L3373 `ChatResponseCodeCitationPart`：删除 runtime 转换；T-A/T-C。
- L3384 `ChatResponsePart`：删除 runtime 转换；T-A/T-C。
- L3471 `ChatAgentRequest`：删除 runtime 转换；T-A/T-C。
- L3563 `ChatLocation`：删除 runtime 转换；T-A/T-C。
- L3583 `ChatSessionCustomizationType`：删除 runtime 转换；T-A/T-C。
- L3601 `ChatPromptReference`：删除 runtime 转换；T-A/T-C。
- L3696 `ChatLanguageModelToolReference`：删除 runtime 转换；T-A/T-C。
- L3710 `ChatLanguageModelToolReferences`：删除 runtime 转换；T-A/T-C。
- L3726 `ChatRequestModeInstructions`：删除 runtime 转换；T-A/T-C。
- L3764 `ChatAgentCompletionItem`：删除 runtime 转换；T-A/T-C。
- L3780 `ChatAgentResult`：删除 runtime 转换；T-A/T-C。
- L3831 `ChatAgentUserActionEvent`：删除 runtime 转换；T-A/T-C。
- L4011 `LanguageModelToolSource`：删除 runtime 转换；T-A/T-C。
- L4023 `LanguageModelToolResult`：删除 runtime 转换；T-A/T-C。
- L4168 `AiSettingsSearch`：删除 runtime 转换；T-A/T-C。
- L4191 `McpServerDefinition`：删除 runtime 转换；T-A/T-C。
- L4261 `ChatRequestHooksConverter`：删除 runtime 转换；T-A/T-C。
- L4283 `ChatHookCommand`：删除 runtime 转换；T-A/T-C。
- L4298 `ChatSessionItem`：删除 runtime 转换；T-A/T-C。

保留 `NotebookEdit`（即使夹在 Chat converter 中间）、`TerminalQuickFix/TerminalCompletion*`、`Command`、`IconPath`、Markdown/URI/ordinary language converter。`ChatAgentResult` 内嵌 LM part revive 同属删除分支。`McpServerDefinition` 转换会调用服务 DTO；保留的是 extHostTypes 中数据 constructor，不是这个 converter。`extHost.protocol.ts` 的专属 DTO/Shape 也删除；普通 Dto、SerializableObjectWithBuffers、URI marshalling 不动。独立 converter 测试移除专属 namespace case 并保留普通验证。

## 普通消费者的冻结接缝

| 实际路径/符号（相对 src/vs/） | 动作和必须保留的行为 | 验证 |
| --- | --- | --- |
| `workbench/contrib/preferences/browser/settingsEditor2.ts`、`preferencesSearch.ts`、`preferencesRenderers.ts:McpSettingsRenderer`、`settingsLayout.ts`、`preferences/common/preferences.ts` | 去 entitlement/IAiSettingsSearchService ranking、MCP marker/codeAction/sidebar，保留本地搜索/JSON render；supportedKeys 中的旧 `mcp` 若仅为容忍既有 JSON，可改本地字面量而不 import MCP 服务，并记录旧数据容忍语义。 | T-P/T-C |
| `workbench/contrib/extensions/browser/extensions.contribution.ts`、`extensionsActions.ts`、`extensionsViewlet.ts`；`services/extensionManagement/browser/extensionEnablementService.ts` | 删除 LM tool/plugin install、AI migration/unification、@mcp/@agent 分流；普通市场 enablement/install 保留。`common/searchExtensionsTool.ts`、`installExtensionsTool.ts` 删除。 | T-E/T-C |
| `services/authentication/browser/authenticationQueryService.ts`、`authentication/common/authenticationQuery.ts`；`contrib/authentication/browser/authentication.contribution.ts`、`actions/manageAccountsAction.ts` | 去 AccountMcpServer(s)/ProviderMcpServer/McpServerQuery、MCP DI/events/账户快捷动作；普通 Account/Provider/ExtensionQuery 保留。删除专属 authenticationMcp{Access,Usage,Service} 文件、注册和专属 action；不删 secret storage。 | T-H/T-C |
| `workbench/browser/parts/globalCompositeBar.ts` | 去 createCodexAccountMenuActions/ICodexAccountService/shouldShowCodexAccount，保留普通账户 composite。 | T-H |
| `contrib/terminal/terminal.all.ts`、`browser/terminalTabbedView.ts`、`browser/terminal.ts`、`browser/terminalMenus.ts`、`terminalContribExports.ts`、`common/terminal.ts` | 去专属 import、ITerminalChatService、chatEntry 高度/布局、tools 隐藏终端过滤、speech 菜单和 chat command skip 列表；保留普通 terminal instance/tabs/filter/drop/layout 和快捷键。 | T-N/T-C |
| `contrib/terminal/browser/terminal.contribution.ts`、`terminalProfileResolverService.ts`、`agentHostPty.ts`、`agentHostTerminalService.ts`、`agentHostOutputChannel.ts`、`ahpTerminalCommandSource.ts`、`chatTerminalCommandMirror.ts`、`terminalTabsChatEntry.ts` | 删除 agent pty/profile/output/source/chat mirror/entry 实现和注册/allowAgentHostShell 选项；保留 node-pty 与普通 resolver。wrapper 本地 imports 必须一起收口，不能仅删 direct domain import。 | T-N/T-C |
| `terminal/browser/xterm/decorationAddon.ts`；`terminalContrib/inlineHint/browser/terminal.initialHint.contribution.ts` | 删除 terminal-to-chat attachments、agent hint 与 entitlement；普通命令 decoration、链接、初始提示继续。 | T-N/T-E |
| `contrib/tasks/browser/abstractTaskService.ts`、`tasks/electron-browser/taskService.ts` | 去 IChatService/IChatAgentService ctor 和 super 参数；去 Fix with AI 和 Chat error prompt；普通错误通知/输出、运行/停止保留。ChatAgent 来源标签仅无消费者后删，注意数值枚举。 | T-N/T-C |
| `contrib/search/browser/{anythingQuickAccess,symbolsQuickAccess,searchChatContext}.ts`、`contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess.ts` | 去 Ask/quickchat/attachments/ChatOutline，保留普通文件/符号/outline 导航。专属 searchChatContext 删除。 | T-E |
| `contrib/quickaccess/browser/commandsQuickAccess.ts` | 去 AI related-information/TF-IDF+LM blending 和 Ask 命令分支，保留本地命令模糊/TF-IDF ranking。 | T-E/T-C |
| `contrib/codeEditor/browser/emptyTextEditorHint/emptyTextEditorHint.ts`、`codeEditor.contribution.ts`、`dictation/editorDictation.ts` | 删 Chat DI/subscription 和生成提示、听写 contribution；普通 language hint 保留，不能移除全部 empty editor hint。 | T-E |
| `contrib/scm/browser/{scmInput,scm.contribution,quickDiffModel,scmHistoryChatContext}.ts` | 去 AI commit/setup/chat context；quickDiffModel 去 editingSessionsObs/ModifiedFileEntryState 分支，普通 SCM original baseline/diff/stage/commit 保留。 | T-E/T-C |
| `contrib/markers/browser/markersChatContext.ts`、`markers.contribution.ts` | 删除 Chat Problems context picker 和注册；普通问题列表完整。 | T-E |
| `contrib/accessibility/browser/{accessibleView,accessibility.contribution,accessibilityConfiguration,editorAccessibilityHelp}.ts`；`terminalContrib/accessibility/browser/terminalAccessibilityHelp.ts` | 去 IChatCodeBlockContextProviderService/speech 注入、code block context/hints/voice设置；普通 View provider/navigation/help/terminal/hover content/focus 恢复保留。 | T-V/T-C |
| `contrib/issue/electron-browser/issueReporterEditorPane.ts`；`issue/browser/issueReporterOverlay.ts` | 去 ILanguageModelsService、生成标题按钮/事件/注入；手填标题、复制、提交保留。 | T-E |
| `browser/actions/developerActions.ts`；`services/workspaces/common/workspaceTrust.ts`；`editTelemetry/browser/telemetry/{editSourceTrackingFeature,editSourceTrackingImpl,editTracker}.ts` | 去 agentHost diagnostics/virtual trust exception/marker/flush correlation；普通诊断/信任/edit tracking 保留，通用 ai 统计标签可留，无后台服务。 | T-E/T-C |
| `contrib/inlineCompletions/browser/inlineCompletionLanguageStatusBarContribution.ts`；`editTelemetry/browser/editTelemetryContribution.ts` | 去 Chat entitlement gating；普通第三方 inline completion 与普通统计服务不因 host Chat 退休失效。 | T-E/T-C |
| `contrib/update/browser/updateTitleBarEntry.ts` | 去 IChatService/onDidChangeProgress/update chatInProgress context；普通更新标题栏行为保留。 | T-E/T-C |
| `services/assignment/common/assignmentFilters.ts` | 去两处 entitlement DI 和 Chat subscription/plan filter；保留普通 assignment/filter 服务，纯扩展版本字符串不是运行服务，不以此误删整个模块。 | T-E/T-C |
| `services/policies/browser/accountPolicyGateContribution.ts`、`policies/common/accountPolicyService.ts` | 此 account gate 源于 Chat entitlement；撤 Chat quota/account gate contribution/context，普通 enterprise policy service和 settings policy 不动。 | T-E/T-C |
| `browser/actions/quickAccessActions.ts`、`browser/layout.ts`、`browser/parts/titlebar/commandCenterControl.ts` | 去 ChatAIDisabledSettingId gating；普通 command center/layout/action 保留。不要改成另一套固定 AI flag。 | T-E/T-C |
| `contrib/welcomeGettingStarted/browser/{gettingStarted,gettingStarted.contribution}.ts`、`common/gettingStartedContent.ts` | 去 Agents banner/entitlement/welcome page转向、dictation walkthrough 链接与 Chat accessibility 文案，保留普通 onboarding 和可访问性引导。 | T-E/T-R |

所有具体入边见下一节。普通功能 wrappers 的 AI 引用即使没有直接域 import 也包含在补充符号扫描中；implementation 不能只照前一张概览表裁剪。

## 全部外部路径入边

每行含源文件/行、规范化目标、原语句。覆盖静态 import、export-from、动态 import、资源与文档字符串；文档/注释行不会被当作运行调用删除，只随退休域文档整理。生产/测试分开，处置编码继承源文件小节。路径规范化不会依赖字符串中是否包含 `contrib`（因此 `../../chat/...` 也进入表）。

### 生产路径入边

#### `vscode/src/vs/code/electron-main/app.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 50 | `vscode/src/vs/platform/sandbox/electron-main/sandboxHelperService.js` | `import { ISandboxHelperMainService } from '../../platform/sandbox/electron-main/sandboxHelperService.js';` |
| 51 | `vscode/src/vs/platform/sandbox/node/sandboxHelper.js` | `import { SandboxHelperService } from '../../platform/sandbox/node/sandboxHelper.js';` |
| 137 | `vscode/src/vs/platform/mcp/common/nativeMcpDiscoveryHelper.js` | `import { INativeMcpDiscoveryHelperService, NativeMcpDiscoveryHelperChannelName } from '../../platform/mcp/common/nativeMcpDiscoveryHelper.js';` |
| 138 | `vscode/src/vs/platform/mcp/node/nativeMcpDiscoveryHelperService.js` | `import { NativeMcpDiscoveryHelperService } from '../../platform/mcp/node/nativeMcpDiscoveryHelperService.js';` |
| 139 | `vscode/src/vs/platform/mcp/common/mcpGateway.js` | `import { IMcpGatewayService, McpGatewayChannelName } from '../../platform/mcp/common/mcpGateway.js';` |
| 140 | `vscode/src/vs/platform/mcp/node/mcpGatewayService.js` | `import { McpGatewayService } from '../../platform/mcp/node/mcpGatewayService.js';` |
| 141 | `vscode/src/vs/platform/mcp/node/mcpGatewayChannel.js` | `import { McpGatewayChannel } from '../../platform/mcp/node/mcpGatewayChannel.js';` |
| 142 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { IWebContentExtractorService } from '../../platform/webContentExtractor/common/webContentExtractor.js';` |
| 143 | `vscode/src/vs/platform/webContentExtractor/electron-main/webContentExtractorService.js` | `import { NativeWebContentExtractorService } from '../../platform/webContentExtractor/electron-main/webContentExtractorService.js';` |
| 144 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { AgentNetworkFilterService, IAgentNetworkFilterService } from '../../platform/networkFilter/common/networkFilterService.js';` |
| 145 | `vscode/src/vs/platform/sandbox/common/terminalSandboxService.js` | `import { ITerminalSandboxService, NullTerminalSandboxService } from '../../platform/sandbox/common/terminalSandboxService.js';` |

#### `vscode/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 125 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { ISharedWebContentExtractorService } from '../../../platform/webContentExtractor/common/webContentExtractor.js';` |
| 126 | `vscode/src/vs/platform/webContentExtractor/node/sharedWebContentExtractorService.js` | `import { SharedWebContentExtractorService } from '../../../platform/webContentExtractor/node/sharedWebContentExtractorService.js';` |
| 127 | `vscode/src/vs/platform/mcp/node/mcpManagementService.js` | `import { McpManagementService } from '../../../platform/mcp/node/mcpManagementService.js';` |
| 128 | `vscode/src/vs/platform/mcp/common/mcpManagement.js` | `import { IAllowedMcpServersService, IMcpGalleryService, IMcpManagementService } from '../../../platform/mcp/common/mcpManagement.js';` |
| 129 | `vscode/src/vs/platform/mcp/common/mcpResourceScannerService.js` | `import { IMcpResourceScannerService, McpResourceScannerService } from '../../../platform/mcp/common/mcpResourceScannerService.js';` |
| 130 | `vscode/src/vs/platform/mcp/common/mcpGalleryService.js` | `import { McpGalleryService } from '../../../platform/mcp/common/mcpGalleryService.js';` |
| 131 | `vscode/src/vs/platform/mcp/common/mcpManagementIpc.js` | `import { McpManagementChannel } from '../../../platform/mcp/common/mcpManagementIpc.js';` |
| 132 | `vscode/src/vs/platform/mcp/common/allowedMcpServersService.js` | `import { AllowedMcpServersService } from '../../../platform/mcp/common/allowedMcpServersService.js';` |
| 133 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifest.js` | `import { IMcpGalleryManifestService } from '../../../platform/mcp/common/mcpGalleryManifest.js';` |
| 134 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifestServiceIpc.js` | `import { McpGalleryManifestIPCService } from '../../../platform/mcp/common/mcpGalleryManifestServiceIpc.js';` |
| 138 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { AgentNetworkFilterService } from '../../../platform/networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/code/node/cliProcessMain.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 68 | `vscode/src/vs/platform/mcp/common/mcpManagementCli.js` | `import { McpManagementCli } from '../../platform/mcp/common/mcpManagementCli.js';` |
| 71 | `vscode/src/vs/platform/mcp/common/mcpManagement.js` | `import { IAllowedMcpServersService, IMcpGalleryService, IMcpManagementService } from '../../platform/mcp/common/mcpManagement.js';` |
| 72 | `vscode/src/vs/platform/mcp/node/mcpManagementService.js` | `import { McpManagementService } from '../../platform/mcp/node/mcpManagementService.js';` |
| 73 | `vscode/src/vs/platform/mcp/common/mcpResourceScannerService.js` | `import { IMcpResourceScannerService, McpResourceScannerService } from '../../platform/mcp/common/mcpResourceScannerService.js';` |
| 74 | `vscode/src/vs/platform/mcp/common/mcpGalleryService.js` | `import { McpGalleryService } from '../../platform/mcp/common/mcpGalleryService.js';` |
| 75 | `vscode/src/vs/platform/mcp/common/allowedMcpServersService.js` | `import { AllowedMcpServersService } from '../../platform/mcp/common/allowedMcpServersService.js';` |
| 76 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifest.js` | `import { IMcpGalleryManifestService } from '../../platform/mcp/common/mcpGalleryManifest.js';` |
| 77 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifestService.js` | `import { McpGalleryManifestService } from '../../platform/mcp/common/mcpGalleryManifestService.js';` |

#### `vscode/src/vs/platform/agentPlugins/common/pluginParsers.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/mcp/common/mcpPlatformTypes.js` | `import { IMcpRemoteServerConfiguration, IMcpServerConfiguration, IMcpStdioServerConfiguration, McpServerType } from '../../mcp/common/mcpPlatformTypes.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationType, McpServerStatus, type AgentCustomization, type HookCustomization, type McpServerCustomization, type RuleCustomization, type SkillCustomization } from '../../agentHost/common/state/protocol/state.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/mcpAppDefaults.js` | `import { DEFAULT_MCP_APP } from '../../agentHost/common/state/protocol/mcpAppDefaults.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { customizationId } from '../../agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/platform/browserView/node/playwrightChannel.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/platform/browserView/node/playwrightService.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/platform/browserView/node/playwrightTab.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/sessions/browser/accountTitleBarState.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatSentiment, IQuotaSnapshot } from '../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/browser/actions/vscodeActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../platform/agentHost/common/agentHostUri.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/browser/openInVSCodeUtils.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, IRemoteAgentHostSSHConnection, RemoteAgentHostEntryType } from '../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/browser/parts/chatGroupView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/chat/common/sessionArchiveActions.js` | `import { getChatSessionArchiveActionPresentation, getChatSessionArchiveActionWording } from '../../../platform/chat/common/sessionArchiveActions.js';` |

#### `vscode/src/vs/sessions/browser/parts/mobile/mobileTitlebarPart.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, ChatEntitlementService, IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/browser/sessionsAuthGate.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AgentHostAllowSignedOutWhenUsableSettingId } from '../../platform/agentHost/common/agentService.js';` |

#### `vscode/src/vs/sessions/browser/sessionsSetUpService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlementContext, IChatEntitlementService } from '../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/common/agentHostSessionWorkspace.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import type { ISessionGitState } from '../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/common/agentHostSessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AuthenticateParams, AuthenticateResult, IAgentConnection } from '../../platform/agentHost/common/agentService.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostConnectionStatus } from '../../platform/agentHost/common/remoteAgentHostService.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult, SessionConfigValueItem } from '../../platform/agentHost/common/state/protocol/commands.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { AgentCustomization, Customization, McpServerStatus, RootConfigState, type CustomizationEnablement, type McpServerState, type RootState } from '../../platform/agentHost/common/state/protocol/state.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/customizationEnablement.js` | `import { type CustomizationDisabledReason } from '../../platform/agentHost/common/customizationEnablement.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/agentMerge.js` | `import type { AgentMergeSessionOverrides, AgentMergeSessionState } from '../../platform/agentHost/common/agentMerge.js';` |

#### `vscode/src/vs/sessions/common/sessionConfig.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { ResolveSessionConfigResult } from '../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/common/sessionsTelemetry.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostConnectionStatus } from '../../platform/agentHost/common/remoteAgentHostService.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/sshRemoteAgentHost.js` | `import { isSSHHostKeyDeniedError } from '../../platform/agentHost/common/sshRemoteAgentHost.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/state/protocol/version/registry.js` | `import { PROTOCOL_VERSION } from '../../platform/agentHost/common/state/protocol/version/registry.js';` |

#### `vscode/src/vs/sessions/contrib/accountMenu/browser/account.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chatStatus/media/chatStatus.css` | `import '../../../../workbench/contrib/chat/browser/chatStatus/media/chatStatus.css';` |
| 33 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, ChatEntitlementService, getChatPlanName, getQuotaReset, getQuotaUsage, IChatEntitlementService, IQuotaSnapshot, QuotaUsageKind } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/chatStatus/chatStatusDashboard.js` | `import { ChatStatusDashboard, IChatStatusDashboardOptions } from '../../../../workbench/contrib/chat/browser/chatStatus/chatStatusDashboard.js';` |
| 47 | `vscode/src/vs/workbench/services/agentHost/browser/codexAccountService.js` | `import { createCodexAccountMenuActions, hasSignedInCodexChatGPTAccount, ICodexAccountService, shouldShowCodexAccount } from '../../../../workbench/services/agentHost/browser/codexAccountService.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { MANAGE_CHAT_COMMAND_ID } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementCommands } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 55 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AgentHostCodexAgentEnabledSettingId } from '../../../../platform/agentHost/common/agentService.js';` |
| 56 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |
| 57 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_SETUP_ACTION_ID } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 60 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { CHAT_PET_OPEN_ACHIEVEMENTS_COMMAND_ID } from '../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |

#### `vscode/src/vs/sessions/contrib/accountMenu/browser/chatPetAchievementBadges.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievementPreview.js` | `import { CHAT_PET_ACHIEVEMENT_PREVIEW_SIZE, renderChatPetAchievementPreview } from '../../../../workbench/contrib/chat/browser/chatPetAchievementPreview.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { chatPetAchievements, ChatPetAchievementId, IChatPetAchievement } from '../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { ChatPetVariant, IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentEditorCommentsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js` | `import { IPlanReviewFeedbackService } from '../../../../workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedback.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js` | `import { IChatAttachmentWidgetRegistry } from '../../../../workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackAttachment.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackAttachmentEntry.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/meta/agentFeedbackAnnotations.js` | `import { authorForFeedbackKind } from '../../../../platform/agentHost/common/meta/agentFeedbackAnnotations.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackAttachmentWidget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackContextView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackEditorActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js` | `import { IPlanReviewFeedbackService } from '../../../../workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackEditorInputContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackEditorUtils.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackEditorWidgetContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackItemsBackend.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../platform/agentHost/common/agentService.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/common/actions.js` | `import { ActionType } from '../../../../platform/agentHost/common/state/protocol/common/actions.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { Annotation, AnnotationEntry, AnnotationsState, StateComponents, StringOrMarkdown } from '../../../../platform/agentHost/common/state/sessionState.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/protocol/common/state.js` | `import { TextRange } from '../../../../platform/agentHost/common/state/protocol/common/state.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/meta/agentFeedbackAnnotations.js` | `import { authorForFeedbackKind, feedbackAnnotationEntryMeta, FEEDBACK_ANNOTATION_META_KEY, readFeedbackAnnotationMeta, resolveFeedbackEntryAuthor, type AgentFeedbackKindValue, type AgentFeedbackStateValue, type IFeedbackAnnotationMeta } from '../../../../platform/agentHost/common/meta/agentFeedbackAnnotations.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackModel.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/meta/agentFeedbackAnnotations.js` | `import type { AgentFeedbackAuthorValue } from '../../../../platform/agentHost/common/meta/agentFeedbackAnnotations.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackReviewCommands.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { AgentFeedbackReviewCommandId, IChatAgentFeedbackReviewComment } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService } from '../../../../workbench/contrib/chat/common/editing/chatEditingService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/sessionResourceMatching.js` | `import { editingEntriesContainResource } from '../../../../workbench/contrib/chat/browser/sessionResourceMatching.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/aiCustomizationTreeView/browser/aiCustomizationOverviewView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementSection, AI_CUSTOMIZATION_MANAGEMENT_EDITOR_ID } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js` | `import { AICustomizationManagementEditorInput } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js` | `import { agentIcon, instructionsIcon, mcpServerIcon, pluginIcon, skillIcon, toolsIcon } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../../workbench/contrib/mcp/common/mcpTypes.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.js` | `import { IAgentPluginService } from '../../../../workbench/contrib/chat/common/plugins/agentPluginService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js` | `import { AGENT_HOST_COPILOT_CLI_SESSION_TYPE, countEnabledCustomizationTools, IAgentHostToolSetEnablementService } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js';` |

#### `vscode/src/vs/sessions/contrib/aiCustomizationTreeView/browser/aiCustomizationTreeView.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService, PromptsStorage } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |

#### `vscode/src/vs/sessions/contrib/aiCustomizationTreeView/browser/aiCustomizationTreeViewViews.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService, PromptsStorage, IAgentSkill, IPromptPath } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js` | `import { agentIcon, extensionIcon, instructionsIcon, mcpServerIcon, pluginIcon, promptIcon, skillIcon, userIcon, workspaceIcon, builtinIcon } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementSection } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js` | `import { AICustomizationManagementEditorInput } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js` | `import { AICustomizationManagementEditor } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationSource, AICustomizationSources, IAICustomizationWorkspaceService } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |

#### `vscode/src/vs/sessions/contrib/applyCommitsToParentRepo/browser/applyChangesToParentRepo.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationDialog.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationInterval } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/common/automations/schedule.js` | `import { DAYS_OF_WEEK } from '../../../../workbench/contrib/chat/common/automations/schedule.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../workbench/contrib/chat/common/languageModels.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, isChatPermissionLevel } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionTarget } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, ISessionTypePickerDelegate } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 51 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.js` | `import { ChatInputPart, IChatInputPartOptions, IChatInputStyles } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputPart.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.js` | `import { isModeConsideredBuiltIn } from '../../../../workbench/contrib/chat/browser/widget/input/modePickerActionItem.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationDialogService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationTarget, IAutomationSchedule } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogResult, IAutomationDialogService, IShowAutomationDialogOptions } from '../../../../workbench/contrib/chat/common/automations/automationDialogService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { ICreateAutomationOptions, IUpdateAutomationOptions } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationRunner.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationRunTrigger, IAutomationDescriptor, IAutomationRun } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunDispatch, IAutomationRunner, IAutomationRunOperation } from '../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationTelemetry.js` | `import { publishAutomationRun, publishAutomationRunError } from '../../../../workbench/contrib/chat/common/automations/automationTelemetry.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationScheduler.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunner } from '../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { CHAT_AUTOMATIONS_ENABLED_SETTING, CHAT_AUTOMATIONS_RUN_TIMEOUT_MINUTES_SETTING, DEFAULT_AUTOMATIONS_RUN_TIMEOUT_MINUTES } from '../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationRunTrigger, AutomationTarget, AutomationWorkspaceIsolation, IAutomationDescriptor, IAutomationRun, } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { type AutomationMutationGuard, IAutomationRunClaim, IAutomationService, ICreateAutomationOptions, IGuardedAutomationUpdateResult, serializeAutomationEditableState, IUpdateAutomationOptions, IAutomationStore, IUpdateAutomationRunOptions, } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationTelemetry.js` | `import { publishAutomationCreated, publishAutomationDeleted, publishAutomationUpdated } from '../../../../workbench/contrib/chat/common/automations/automationTelemetry.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/automations/schedule.js` | `import { computeNextRunAt } from '../../../../workbench/contrib/chat/common/automations/schedule.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatPermissionLevel, isChatPermissionLevel } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automationTools.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/channels-chat/state.js` | `import { ConfirmationOptionKind } from '../../../../platform/agentHost/common/state/protocol/channels-chat/state.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationInterval, AutomationTarget, AutomationWorkspaceIsolation, IAutomationDescriptor, IAutomationRun, IAutomationSchedule } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunDispatch, IAutomationRunner } from '../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { type AutomationMutationGuard, ConfigureAutomationToolReferenceName, IAutomationService, ICreateAutomationOptions, IUpdateAutomationOptions, serializeAutomationEditableState } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext, CHAT_AUTOMATIONS_ENABLED_SETTING } from '../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatAutomationConfiguredData } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatModeKind, ChatPermissionLevel } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { CountTokensCallback, ILanguageModelToolsService, IPreparedToolInvocation, IToolData, IToolImpl, IToolInvocation, IToolInvocationPreparationContext, IToolResult, ToolDataSource, ToolProgress } from '../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/automations.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogService } from '../../../../workbench/contrib/chat/common/automations/automationDialogService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunner } from '../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext, CHAT_AUTOMATIONS_ENABLED_SETTING, CHAT_AUTOMATIONS_RUN_TIMEOUT_MINUTES_SETTING, DEFAULT_AUTOMATIONS_RUN_TIMEOUT_MINUTES } from '../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |

#### `vscode/src/vs/sessions/contrib/automations/browser/providerAutomationService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor, IAutomationRun, AutomationRunTrigger } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { AutomationMutationGuard, IAutomationRunClaim, IAutomationService, ICreateAutomationOptions, IGuardedAutomationUpdateResult, IUpdateAutomationOptions, IUpdateAutomationRunOptions } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/changesEditorLabels.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/changesMultiDiffSourceResolver.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/changesView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 57 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 58 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/changesViewRenderer.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { ModifiedFileEntryState } from '../../../../workbench/contrib/chat/common/editing/chatEditingService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/changesViewService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/agentHostChangesetOperationService.js` | `import { AGENT_HOST_MERGE_CHANGESET_OPERATION_ID } from '../../../../platform/agentHost/common/agentHostChangesetOperationService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/checksActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/sessions/contrib/changes/browser/sessionChangesEditor.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/agentHostDelegation.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { CHAT_DELEGATE_TO_AGENT_HOST_SESSION_COMMAND_ID, IAgentHostDelegationRequest } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/agentHostInputCompletions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/platform/agentHost/common/meta/agentCompletionAttachmentMeta.js` | `import { getCommandArgumentHint, getCompletionAction, type IAgentHostCompletionAction } from '../../../../platform/agentHost/common/meta/agentCompletionAttachmentMeta.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { AgentHostCompletionReferenceKind, getAgentHostCompletionReferenceKind, IChatRequestVariableEntry, isAgentHostCompletionVariableEntry, isPastedTextArtifact, toAgentHostCompletionVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatInputCompletionItem, IChatSessionsService, isAgentHostTarget } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/requestParser/chatParserTypes.js` | `import { chatVariableLeader } from '../../../../workbench/contrib/chat/common/requestParser/chatParserTypes.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/agentHostInputCompletionsBase.js` | `import { AgentHostInputCompletionsBase } from '../../../../workbench/contrib/chat/browser/widget/input/editor/agentHostInputCompletionsBase.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/chatInputPlaceholderDecoration.js` | `import { getInputPlaceholderColor, getRangeForPlaceholder } from '../../../../workbench/contrib/chat/browser/widget/input/editor/chatInputPlaceholderDecoration.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/agentHostCompletionAction.js` | `import { applyAgentHostCompletionAction, isPolicyBlockedCompletionAction } from '../../../../workbench/contrib/chat/browser/agentHostCompletionAction.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/aiCustomizationWorkspaceService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService, AICustomizationManagementSection } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IChatPromptSlashCommand, IPromptsService } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/customizationCreatorService.js` | `import { CustomizationCreatorService } from '../../../../workbench/contrib/chat/browser/aiCustomization/customizationCreatorService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME } from '../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/branchChatSessionAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { ChatTreeItem, IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { ChatModel, ISerializableChatData } from '../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { isRequestVM, isResponseVM } from '../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/btwSlashCommand.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatSlashCommands.js` | `import { IChatSlashCommandService } from '../../../../workbench/contrib/chat/common/participants/chatSlashCommands.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/chatSideChat.js` | `import { captureSideChatSelection } from '../../../../workbench/contrib/chat/browser/chatSideChat.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/chat.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { IChatResponseFileChangesService } from '../../../../workbench/contrib/chat/browser/chatResponseFileChangesService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/chatPetAchievements.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds, hasChatPetImageAttachment } from '../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/chatView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.js` | `import { IMicCaptureService } from '../../../../workbench/contrib/chat/browser/voiceClient/micCaptureService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js` | `import { ITtsPlaybackService } from '../../../../workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatWidget.js` | `import { ChatWidget } from '../../../../workbench/contrib/chat/browser/widget/chatWidget.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { setModelPreservingInputTypedWhileLoading } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatModelReference, IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { isChatTranscriptContextVariableEntry, IChatRequestTranscriptContextVariableEntry, IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel } from '../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService, localChatSessionType } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/chatViewStateService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { CHAT_WIDGET_VIEW_STATE_CACHE_LIMIT, IChatWidgetViewState } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/chatWidgetUtils.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/copilotConfigSlashSubmitHandler.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/platform/agentHost/common/agentHostSlashCommand.js` | `import { parseLeadingSlashCommand } from '../../../../platform/agentHost/common/agentHostSlashCommand.js';` |
| 8 | `vscode/src/vs/platform/agentHost/common/copilotConfigSlashCommands.js` | `import { resolveCopilotConfigSlashCommandOnSend } from '../../../../platform/agentHost/common/copilotConfigSlashCommands.js';` |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js` | `import { IChatSubmitRequestHandlerService, type IChatSubmitRequest } from '../../../../workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/agentHostCompletionAction.js` | `import { applyAgentHostCompletionAction } from '../../../../workbench/contrib/chat/browser/agentHostCompletionAction.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/customizationHarnessService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { CustomizationHarnessServiceBase, IHarnessDescriptor } from '../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/customizationsDebugLog.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService, PromptsStorage, IPromptPath } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementSection } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 16 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../../workbench/contrib/mcp/common/mcpTypes.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/externalSessionBanner.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatExternalSessionsMode } from '../../../../platform/chat/common/chatSettings.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/mobile/mobileSessionTypePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/sessionTypeAvailability.js` | `import { getSessionTypeAvailability, getSessionTypeUnavailableLabel, SessionTypeAvailability } from '../../../../../workbench/contrib/chat/browser/agentSessions/sessionTypeAvailability.js';` |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotificationService } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/modelPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js` | `import { IChatInputPickerOptions } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modelPicker/modelPickerActionItem.js` | `import { IModelPickerDelegate, ModelPickerActionItem } from '../../../../workbench/contrib/chat/browser/widget/input/modelPicker/modelPickerActionItem.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds, didExplicitlySwitchChatPetModel } from '../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |
| 19 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatContextAttachments.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.js` | `import { IChatImageCarouselService } from '../../../../workbench/contrib/chat/browser/chatImageCarouselService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatImageExtraction.js` | `import { coerceImageBuffer } from '../../../../workbench/contrib/chat/common/chatImageExtraction.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry, isAgentHostCompletionVariableEntry, isPastedTextArtifact, OmittedState } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/chatImageUtils.js` | `import { resizeImage } from '../../../../workbench/contrib/chat/browser/chatImageUtils.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgets.js` | `import { createImageHoverContent, openPastedTextArtifact } from '../../../../workbench/contrib/chat/browser/attachments/chatAttachmentWidgets.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/chatPasteProviders.js` | `import { imageToHash, isImage } from '../../../../workbench/contrib/chat/browser/widget/input/editor/chatPasteProviders.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatInSessionWidget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js` | `import { ChatInputNoticeLane } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.js` | `import { ChatInputNoticeVariant, ChatInputNoticeWidget } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackClass, chatInputStackSlotClass, ChatInputStackSlot, setChatInputStackSlot } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatInput.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 54 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatDragAndDrop.js` | `import { ChatDragAndDrop } from '../../../../workbench/contrib/chat/browser/widget/chatDragAndDrop.js';` |
| 73 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/micButtonHovers.js` | `import { getDictationHoverMarkdown } from '../../../../workbench/contrib/chat/browser/speechToText/micButtonHovers.js';` |
| 74 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/micButtonMenuActions.js` | `import { addMicButtonContextMenuListener, getDictationContextMenuActions } from '../../../../workbench/contrib/chat/browser/speechToText/micButtonMenuActions.js';` |
| 79 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModelInputState } from '../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 80 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry, isExplicitFileOrImageVariableEntry, toFileVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 81 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 82 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 83 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.js` | `import { ChatHistoryNavigator } from '../../../../workbench/contrib/chat/common/widget/chatWidgetHistoryService.js';` |
| 88 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationWidget.js` | `import { ChatInputNotificationWidget } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNotificationWidget.js';` |
| 89 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js` | `import { ChatInputNoticeHost, ChatInputNoticeLane } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js';` |
| 90 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputOnboardingHosts.js` | `import { registerChatInputOnboardingHosts } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputOnboardingHosts.js';` |
| 91 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.js` | `import { IChatInputNoticeHubService } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.js';` |
| 92 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackClass, chatInputStackSlotClass, ChatInputStackSlot, refreshChatInputStack, setChatInputStackSlot } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |
| 93 | `vscode/src/vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js` | `import { IChatSubmitRequestHandlerService } from '../../../../workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js';` |
| 99 | `vscode/src/vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService.js` | `import { IChatStatusItemService } from '../../../../workbench/contrib/chat/browser/chatStatus/chatStatusItemService.js';` |
| 100 | `vscode/src/vs/workbench/contrib/chat/browser/chatTerminalCommandPaste.js` | `import { handleTerminalCommandPaste, isTerminalCommandInput } from '../../../../workbench/contrib/chat/browser/chatTerminalCommandPaste.js';` |
| 101 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatPasteTargetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 103 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 104 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, DictationSettingId, IChatSpeechToTextService } from '../../../../workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js';` |
| 105 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationMicGlow.js` | `import { setupDictationMicGlow } from '../../../../workbench/contrib/chat/browser/speechToText/dictationMicGlow.js';` |
| 106 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.js` | `import { IDictationOnboardingService } from '../../../../workbench/contrib/chat/browser/speechToText/dictationOnboarding.js';` |
| 107 | `vscode/src/vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputModeActionViewItem.js` | `import { ChatVoiceInputModeAction, VoiceInputModeActionViewItem } from '../../../../workbench/contrib/chat/browser/voiceInputMode/voiceInputModeActionViewItem.js';` |
| 108 | `vscode/src/vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js` | `import { IVoiceInputModeService } from '../../../../workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js';` |
| 110 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatSpeechToTextActions.js` | `import { runDictationShortcut } from '../../../../workbench/contrib/chat/browser/actions/chatSpeechToTextActions.js';` |
| 111 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationSession.js` | `import { isDictationActiveForEditor, notifyDictationSubmitted, onDidChangeDictationEditor } from '../../../../workbench/contrib/chat/browser/speechToText/dictationSession.js';` |
| 112 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceInputUtils.js` | `import { combineVoiceInput } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceInputUtils.js';` |
| 113 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 114 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationDownloadRing.js` | `import { DictationDownloadRing, getDictationDownloadHoverMarkdown, getDictationPreparingLabel } from '../../../../workbench/contrib/chat/browser/speechToText/dictationDownloadRing.js';` |
| 115 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 116 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatPetWidgetService.js` | `import { IChatPetWidgetService } from '../../../../workbench/contrib/chat/browser/widget/chatPetWidgetService.js';` |
| 117 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.js` | `import { IVoiceModeOnboardingService } from '../../../../workbench/contrib/agentsVoice/browser/voiceModeOnboarding.js';` |
| 118 | `vscode/src/vs/workbench/contrib/agentsVoice/common/agentsVoice.js` | `import { AGENTS_VOICE_ENABLED } from '../../../../workbench/contrib/agentsVoice/common/agentsVoice.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatInputPasteTarget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatPasteTarget } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chatTerminalCommandPaste.js` | `import { isTerminalCommandPaste } from '../../../../workbench/contrib/chat/browser/chatTerminalCommandPaste.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariables.js` | `import { IDynamicVariable } from '../../../../workbench/contrib/chat/common/attachments/chatVariables.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatVoice.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputModeContextKeys.js` | `import { SegmentedVoiceInputModePillInactive } from '../../../../workbench/contrib/chat/browser/voiceInputMode/voiceInputModeContextKeys.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.js` | `import { IMicCaptureService } from '../../../../workbench/contrib/chat/browser/voiceClient/micCaptureService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js` | `import { ITtsPlaybackService } from '../../../../workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 27 | `vscode/src/vs/workbench/contrib/agentsVoice/common/agentsVoice.js` | `import { AgentsVoiceSettingId, AGENTS_VOICE_ENABLED } from '../../../../workbench/contrib/agentsVoice/common/agentsVoice.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceModeActionViewItem.js` | `import { VoiceModeActionViewItem } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceModeActionViewItem.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newChatWidget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputTipPresenter.js` | `import { ChatInputTipPresenter } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputTipPresenter.js';` |
| 44 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackClass, ChatInputStackSlot, setChatInputStackSlot } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/browser/chatTipService.js` | `import { IChatTipService } from '../../../../workbench/contrib/chat/browser/chatTipService.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatModeKind } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newSession.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionProviderOptionGroup, IChatSessionProviderOptionItem } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newSessionFolderQuickPickAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/newSessionPromptOptions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { ChatInputStackSlot, setChatInputStackSlot } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/nullInlineChatSessionService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSession, IInlineChatSessionService } from '../../../../workbench/contrib/inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/openSessionLinkOpener.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/openSessionLink.js` | `import { AGENT_HOST_SESSION_LINK_PATTERN, AgentSessionLinkStatus, createAgentSessionLinkPresentation, parseOpenSessionLinkChatId, parseOpenSessionLinkUri } from '../../../../platform/agentHost/common/openSessionLink.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/promptsService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.js` | `import { SKILL_FILENAME } from '../../../../workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IAgentSkill, IBuiltinPromptPath, PromptsStorage } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl.js` | `import { PromptsService } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/requestOriginProvider.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/chatRequestOrigin.js` | `import { IChatRequestOriginService } from '../../../../workbench/contrib/chat/common/chatRequestOrigin.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/responseSelectionResolver.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel, isResponseVM } from '../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/responseSelectionSideChatController.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/runScriptAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionArtifacts.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { openChatTurnFile, previewKind } from '../../../../workbench/contrib/chat/browser/widget/chatTurnPills.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionChatInputToolbar.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { IChatResponseFileChangesService } from '../../../../workbench/contrib/chat/browser/chatResponseFileChangesService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { CHAT_TURN_ARTIFACT_PILL_ID, CHAT_TURN_CHANGES_PILL_ID, ChatTurnPillsProvider, diffStatsEqual, EMPTY_DIFF_STATS, IChatTurnPillsModel, IDiffStats, observeTurnStatusPillsEnabled } from '../../../../workbench/contrib/chat/browser/widget/chatTurnPills.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionChatInputToolbarDebug.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { IDiffStats } from '../../../../workbench/contrib/chat/browser/widget/chatTurnPills.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionCustomizations.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementCommands, AICustomizationManagementSection } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionModelPickerState.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../workbench/contrib/chat/common/languageModels.js';` |
| 7 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { IPendingModelSelection } from '../../../../workbench/contrib/chat/common/modelSelection.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionModelSelection.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputModelSelectionController.js` | `import { ChatInputModelSelectionController, IChatInputModelSelectionRuntime } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputModelSelectionController.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatModelSelectionDiagnostics.js` | `import { ChatModelSelectionDiagnostics } from '../../../../workbench/contrib/chat/browser/widget/input/chatModelSelectionDiagnostics.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/chatSelectedModel.js` | `import { getSelectedModelStorageKey, getStoredSelectedModel, storeSelectedModel } from '../../../../workbench/contrib/chat/common/chatSelectedModel.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../workbench/contrib/chat/common/languageModels.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IntendedModelSlot } from '../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { IPendingModelSelection, isInConversationModelChoice, ModelSelectionReason, RestoredModelReason } from '../../../../workbench/contrib/chat/common/modelSelection.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionReferenceCompletions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/copilotCliEventsUri.js` | `import { getCopilotCliSessionRawId } from '../../../../workbench/contrib/chat/browser/copilotCliEventsUri.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionTurnChanges.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { AbstractChatResponseFileChangesService, IChatResponseFileChangesOpenContext } from '../../../../workbench/contrib/chat/browser/chatResponseFileChangesService.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IEditSessionEntryDiff } from '../../../../workbench/contrib/chat/common/editing/chatEditingService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionTypePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../workbench/contrib/chat/common/languageModels.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/sessionTypeAvailability.js` | `import { getSessionTypeAvailability, getSessionTypePickerAvailability, getSessionTypeUnavailableDescription, getSessionTypeUnavailableHover, SessionTypeAvailability } from '../../../../workbench/contrib/chat/browser/agentSessions/sessionTypeAvailability.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSdkSetupNotification.js` | `import { hasAgentSdkSetupNotification } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSdkSetupNotification.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotificationService } from '../../../../workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 31 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionWorkspacePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus, RemoteAgentHostsEnabledSettingId } from '../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 23 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { TUNNEL_ADDRESS_PREFIX } from '../../../../platform/agentHost/common/tunnelAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sessionsOpenerParticipant.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { IAgentSession } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsOpener.js` | `import { ISessionOpenerParticipant, ISessionOpenOptions, sessionOpenerRegistry } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsOpener.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/sideChatProvider.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { isRequestVM } from '../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatSideChatService.js` | `import { IChatSideChatOrigin, IChatSideChatProvider, IChatSideChatSelection, IChatSideChatService } from '../../../../workbench/contrib/chat/common/chatSideChatService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/slashCommands.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementCommands, AICustomizationManagementSection } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js` | `import { IChatSubmitRequestHandlerService, type IChatSubmitRequest, type IChatSubmitRequestHandler } from '../../../../workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IChatPromptSlashCommand } from '../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isAgentHostTarget } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/variableCompletions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { isSupportedChatFileScheme } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/voiceBridge.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceInputUtils.js` | `import { combineVoiceInput } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceInputUtils.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService.js` | `import { IVoiceModelSelectionResult, resolveVoiceModel } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/voiceInputDecorations.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceInputDecorations.js` | `export { setupVoiceInputDecorations } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceInputDecorations.js';` |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceInputDecorations.js` | `export type { IVoiceInputDecorationsOptions, IVoiceInputDecorationsServices } from '../../../../workbench/contrib/chat/browser/voiceClient/voiceInputDecorations.js';` |

#### `vscode/src/vs/sessions/contrib/chat/browser/webWorkspacePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/electron-browser/chat.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/agentHostByokLm.js` | `import { IAgentHostByokLmHandler } from '../../../../platform/agentHost/common/agentHostByokLm.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostByokLmHandler.js` | `import { AgentHostByokLmHandler } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostByokLmHandler.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds } from '../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/codeReview/browser/codeReview.contributions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/github/browser/createSessionFromPullRequestAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/github/browser/githubApiClient.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/githubEndpoints.js` | `import { deriveGitHubEndpoints, IGitHubEndpoints } from '../../../../platform/agentHost/common/githubEndpoints.js';` |

#### `vscode/src/vs/sessions/contrib/github/browser/pullRequestPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestTranscriptContextVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { ISessionGitHubState, withSessionGitHubState } from '../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/newSessionViewTourTrigger.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/newSessionViewV2TourContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/newSessionViewV3TourContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/tours/newSessionTour.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/tours/newSessionViewTour.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/browser/tours/newSessionViewTourShared.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 11 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlementContextKeys } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/policyBlocked/browser/policyBlocked.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostAgentPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/customAgents.js` | `import { agentHostAgentPickerStorageKey, resolveAgentHostAgent } from '../../../../../platform/agentHost/common/customAgents.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeyExprs, ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { ChatMode, IChatMode } from '../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { logChangesToStateModel } from '../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatModeKind } from '../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostClaudePermissionModePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/claudeSessionConfigKeys.js` | `import { ClaudeSessionConfigKey } from '../../../../../platform/agentHost/common/claudeSessionConfigKeys.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostCodexApprovalsPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/browser/codexApprovalsPicker.js` | `import { getCodexApprovalsPickerListOptions } from '../../../../../platform/agentHost/browser/codexApprovalsPicker.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/codexSessionConfigKeys.js` | `import { CodexSessionConfigKey } from '../../../../../platform/agentHost/common/codexSessionConfigKeys.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostDiffs.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { SessionStatus as ProtocolSessionStatus, type ChangesetFile } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { ISessionFileDiff } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/fileEditDiff.js` | `import { normalizeFileEdit } from '../../../../../platform/agentHost/common/fileEditDiff.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/sessionDbUri.js` | `import { canonicalizeSessionDbUri } from '../../../../../platform/agentHost/common/sessionDbUri.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange2, isIChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/meta/agentChangesetFileMeta.js` | `import { readChangesetFileMeta } from '../../../../../platform/agentHost/common/meta/agentChangesetFileMeta.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostForkActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatForkActions.js` | `import { ForkConversationAction } from '../../../../../workbench/contrib/chat/browser/actions/chatForkActions.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionRequestHistoryItem } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostModePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostPermissionPickerActionItem.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js` | `import { IChatInputPickerOptions } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/permissionPickerActionItem.js` | `import { PermissionPickerActionItem } from '../../../../../workbench/contrib/chat/browser/widget/input/permissionPickerActionItem.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostPermissionPickerDelegate.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AgentHostSdkSandboxEnabledSettingId, AgentHostSdkSandboxWindowsEnabledSettingId, getAgentHostCopilotSandboxSettingId } from '../../../../../platform/agentHost/common/agentService.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/copilotCliConfig.js` | `import { AgentHostCustomTerminalToolEnabledSettingId } from '../../../../../platform/agentHost/common/copilotCliConfig.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { KNOWN_AUTO_APPROVE_VALUES, SessionConfigKey } from '../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/claudeSessionConfigKeys.js` | `import { narrowClaudePermissionMode } from '../../../../../platform/agentHost/common/claudeSessionConfigKeys.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/codexSessionConfigKeys.js` | `import { narrowCodexPermissionsPreset } from '../../../../../platform/agentHost/common/codexSessionConfigKeys.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel, isChatPermissionLevel } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/agentHostConfigPolicy.js` | `import { isAssistedPermissionsEnabled, isPermissionLevelVisible } from '../../../../../workbench/contrib/chat/common/agentHostConfigPolicy.js';` |
| 24 | `vscode/src/vs/platform/sandbox/common/settings.js` | `import { AgentSandboxSettingId } from '../../../../../platform/sandbox/common/settings.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionArtifacts.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/platform/agentHost/common/githubIssueReferences.js` | `import { parseGitHubIssueUrl } from '../../../../../platform/agentHost/common/githubIssueReferences.js';` |
| 8 | `vscode/src/vs/platform/agentHost/common/sessionArtifacts.js` | `import { readSessionArtifacts, SessionArtifactType, type ISessionArtifact as IProtocolSessionArtifact } from '../../../../../platform/agentHost/common/sessionArtifacts.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import type { SessionMeta } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionChangesets.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostWorkingDirectories.js` | `import { isMultiRootSession } from '../../../../../platform/agentHost/common/agentHostWorkingDirectories.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/protocol/channels-changeset/commands.js` | `import { ChangesetOperationTargetKind } from '../../../../../platform/agentHost/common/state/protocol/channels-changeset/commands.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { ChangesetOperation, ChangesetOperationScope, type ChangesetFile, ChangesetOperationStatus } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { buildDefaultChatUri, ChangesetStatus, Changeset, StateComponents, type ChangesetState, type ChatState, type ChatSummary, type SessionState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionConfigPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { SessionConfigPropertySchema, SessionConfigValueItem } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, isChatPermissionLevel } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/chatPermissionWarnings.js` | `import { maybeConfirmElevatedPermissionLevel } from '../../../../../workbench/contrib/chat/common/chatPermissionWarnings.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeyExprs, ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js` | `import { type IChatInputPickerOptions } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputPickerActionItem.js';` |
| 55 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 57 | `vscode/src/vs/platform/agentHost/common/claudeSessionConfigKeys.js` | `import { ClaudeSessionConfigKey } from '../../../../../platform/agentHost/common/claudeSessionConfigKeys.js';` |
| 59 | `vscode/src/vs/workbench/contrib/chat/common/agentHostConfigPolicy.js` | `import { isAutoApproveValuePolicyRestricted } from '../../../../../workbench/contrib/chat/common/agentHostConfigPolicy.js';` |
| 60 | `vscode/src/vs/platform/agentHost/common/codexSessionConfigKeys.js` | `import { CodexSessionConfigKey } from '../../../../../platform/agentHost/common/codexSessionConfigKeys.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionCustomizations.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { CustomizationType, ResponsePartKind, ToolCallContributorKind, ToolCallStatus, getInlineToolInput, type ChildCustomization, type Customization, type ToolCallState, type Turn, } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionFiles.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/fileEditDiff.js` | `import { normalizeFileEdit } from '../../../../../platform/agentHost/common/fileEditDiff.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import type { FileEdit } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { CustomizationType, ResponsePartKind, ToolCallContributorKind, ToolCallStatus, getInlineToolInput, type ChildCustomization, type Customization, type ToolCallState, type Turn, } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSettingsFileSystemProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { RootConfigState } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSettingsShared.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js` | `import { AbstractAgentHostConfigFileSystemProvider, AbstractAgentHostConfigSchemaRegistrar, } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js` | `import { AbstractAgentHostConfigFileSystemProvider, AbstractAgentHostConfigSchemaRegistrar, } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js` | `import { AbstractAgentHostConfigFileSystemProvider, AbstractAgentHostConfigSchemaRegistrar, } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostConfigEditor.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSkillButtons.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { ChatSendResult, IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentMergeActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentMerge.js` | `import { AgentMergeAction, AgentMergeConfiguration, AgentMergeSessionOverrides, AgentMergeSettingId, defaultAgentMergeConfiguration, resolveAgentMergeConfiguration } from '../../../../../platform/agentHost/common/agentMerge.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentSessionSettingsFileSystemProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/baseAgentHostSessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession, AuthenticateParams, AuthenticateResult, IAgentSessionMetadata, protectedResourcesRequireGitHubCopilotSignIn } from '../../../../../platform/agentHost/common/agent.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/agentMerge.js` | `import { AgentMergeSessionOverrides, AgentMergeSessionState, readAgentMergeSessionState } from '../../../../../platform/agentHost/common/agentMerge.js';` |
| 22 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 23 | `vscode/src/vs/platform/agentHost/common/customizationEnablement.js` | `import { getCustomizationDisabledReason, isCustomizationEnabled, withCustomizationEnablement } from '../../../../../platform/agentHost/common/customizationEnablement.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/annotationsUri.js` | `import { buildAnnotationsUri } from '../../../../../platform/agentHost/common/annotationsUri.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/githubIssueReferences.js` | `import { parseGitHubIssueUrl } from '../../../../../platform/agentHost/common/githubIssueReferences.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/customAgents.js` | `import { getEffectiveAgents } from '../../../../../platform/agentHost/common/customAgents.js';` |
| 27 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { KNOWN_MODE_VALUES, SessionConfigKey } from '../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 28 | `vscode/src/vs/platform/agentHost/common/agentHostSchema.js` | `import { migrateLegacyAutopilotConfig } from '../../../../../platform/agentHost/common/agentHostSchema.js';` |
| 29 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import type { IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 30 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult, type SessionConfigPropertySchema } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 31 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { AgentCustomization, ChangesSummary, ChatInteractivity as ProtocolChatInteractivity, ChatOriginKind as ProtocolChatOriginKind, type ClientPluginCustomization, Customization, CustomizationEnablementKind, CustomizationType, type CustomizationEnablement, ModelSelection, SessionStatus as ProtocolSessionStatus, RootConfigState, RootState, SessionState, SessionSummary, type Changeset } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 32 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, isChatAction, isSessionAction, NotificationType } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 33 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { AgentCapabilities, AgentInfo, buildChatUri, buildDefaultChatUri, DEFAULT_CHAT_ID, getSessionChatResource, getSessionRelatedPullRequestUrls, isDefaultChatUri, isSessionStatusArchived, isSessionStatusRead, parseChatUri, readSessionEhcliAdoptable, readSessionExternal, readSessionGitHubState, readSessionGitState, readSessionMultiRootMetadata, readSessionSourceControlState, readSessionWorkspaceless, ROOT_STATE_URI, SESSION_META_MULTI_ROOT_KEY, SessionMeta, SessionSourceControlOutcome, StateComponents, withSessionExternal, withSessionGitHubState, withSessionMultiRootMetadata, withSessionStatusFlag, withSessionWorkspaceless, type ChatState, type ChatSummary, type ISessionGitHubState, type ISessionGitState, type ISessionMultiRootMetadata } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostDownloadProgress.js` | `import { AgentHostDownloadProgress } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostDownloadProgress.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentCustomizationScope, IAgentHostActiveClientService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { ChatMode } from '../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatSendRequestOptions, IChatService, type IChatModelReference } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange, IChatSessionFileChange2, IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration, ChatModeKind, ChatPermissionLevel, getChatPermissionLevelFromDefaultConfiguration, isChatPermissionLevel, type IChatDefaultConfiguration } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/agentHostConfigPolicy.js` | `import { isAutoApprovePolicyRestricted, normalizeSessionConfigValue } from '../../../../../workbench/contrib/chat/common/agentHostConfigPolicy.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadata, ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { getRegisteredLanguageModels, resolveConfiguredModel, resolveModelIdentifier, resolveModelIdentifierFromLanguageModels } from '../../../../../workbench/contrib/chat/common/modelSelection.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/codexCustomizationSettings.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { CODEX_AGENT_PROVIDER_ID } from '../../../../../platform/agentHost/common/agent.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementSectionRegistry.js` | `import { aiCustomizationManagementSectionRegistry } from '../../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementSectionRegistry.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/agentGlobalConfigurationSettingsWidget.js` | `import { AHPAgentSettingsWidget, type IAgentGlobalConfigurationSettingsTarget } from '../../../../../workbench/contrib/chat/browser/aiCustomization/agentGlobalConfigurationSettingsWidget.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/exportDebugLogsAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { AGENT_HOST_ENABLED_CONTEXT_KEY } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { DEFAULT_CHAT_ID } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js` | `import { exportAgentHostDebugLogs, IActiveAgentHostSessionForExport } from '../../../../../workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/localAgentHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostChatContribution.js` | `import { AgentHostContribution } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostChatContribution.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js` | `import { IAgentHostSessionWorkingDirectoryResolver } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostTerminalContribution.js` | `import { AgentHostTerminalContribution } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostTerminalContribution.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAllowSignedOutWhenUsableContribution.js` | `import { AgentHostAllowSignedOutWhenUsableContribution } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAllowSignedOutWhenUsableContribution.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSdkSetupNotification.js` | `import { AgentHostSdkSetupNotificationContribution } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSdkSetupNotification.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSignedOutModelsNotification.js` | `import { AgentHostSignedOutModelsNotificationContribution } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSignedOutModelsNotification.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/localAgentHostSessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { LOCAL_AGENT_HOST_AUTHORITY, toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { type IAgentSessionMetadata } from '../../../../../platform/agentHost/common/agent.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { affectsAgentHostProviderPreference, IAgentConnection, IAgentHostService, shouldSurfaceLocalAgentHostProvider } from '../../../../../platform/agentHost/common/agentService.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import type { ISessionGitState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/copilotCliEventsUri.js` | `import { getCopilotCliSessionRawId, migratedCopilotCliResource } from '../../../../../workbench/contrib/chat/browser/copilotCliEventsUri.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLegacyMigration.js` | `import { adoptLegacyCopilotCliResource, LEGACY_MIGRATION_RESTORE_TIMEOUT_MS, LEGACY_MIGRATION_TIMEOUT_MS } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLegacyMigration.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/mobile/mobileAgentHostModePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../../workbench/contrib/chat/browser/chat.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js` | `import { IChatPhoneInputPresenter } from '../../../../../../workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds, didExplicitlySwitchChatPetModel } from '../../../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/mobile/mobileChatInputConfigPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { type ILanguageModelChatMetadataAndIdentifier } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js` | `import { IChatPhoneInputPresenter } from '../../../../../../workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modelPicker/modelProviderIcons.js` | `import { getModelProviderIcon } from '../../../../../../workbench/contrib/chat/browser/widget/input/modelPicker/modelProviderIcons.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds, didExplicitlySwitchChatPetModel } from '../../../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/mobile/mobileChatPhoneInputPresenter.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatExecuteActions.js` | `import { IToggleChatModeArgs, ToggleAgentModeActionId } from '../../../../../../workbench/contrib/chat/browser/actions/chatExecuteActions.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js` | `import { ChatPhoneInputPresenterRequest, IChatPhoneInputPresenter, IChatPhoneInputSessionContext, IChatPhonePresenterImpl } from '../../../../../../workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modePickerActionItem.js` | `import { IModePickerDelegate } from '../../../../../../workbench/contrib/chat/browser/widget/input/modePickerActionItem.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modelPicker/modelPickerActionItem.js` | `import { IModelPickerDelegate } from '../../../../../../workbench/contrib/chat/browser/widget/input/modelPicker/modelPickerActionItem.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/modelPicker/modelProviderIcons.js` | `import { getModelProviderIcon } from '../../../../../../workbench/contrib/chat/browser/widget/input/modelPicker/modelProviderIcons.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { IChatMode } from '../../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/mobile/mobileChatPhoneInputTarget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js` | `import { IChatPhoneInputSessionContext } from '../../../../../../workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/openAgentHostStateFileAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/actions/openAgentHostStateFileAction.js` | `import { openAgentHostStateFile } from '../../../../../workbench/contrib/chat/browser/actions/openAgentHostStateFileAction.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/openSubagentChat.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { parseChatUri, parseSubagentSessionUri } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { CHAT_OPEN_AGENT_HOST_CHAT_COMMAND_ID } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatSubagentOpenChat.js` | `import { OpenSubagentChatActionViewItem, shouldShowSubagentModel, subagentChatOpenerRegistry } from '../../../../../workbench/contrib/chat/browser/widget/chatContentParts/chatSubagentOpenChat.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/browser/sessionGitHubInfo.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { readSessionGitState, SessionMeta } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/electron-browser/agentHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/electron-browser/actions/debugAgentHostAction.js` | `import { DebugAgentHostInDevToolsAction } from '../../../../../workbench/contrib/chat/electron-browser/actions/debugAgentHostAction.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/electron-browser/actions/exportAgentHostDebugLogsService.js` | `import '../../../../../workbench/contrib/chat/electron-browser/actions/exportAgentHostDebugLogsService.js';` |
| 9 | `vscode/src/vs/workbench/contrib/chat/electron-browser/actions/profileAgentHostAction.js` | `import { ProfileAgentHostAction, StopAgentHostProfileAction } from '../../../../../workbench/contrib/chat/electron-browser/actions/profileAgentHostAction.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/electron-browser/actions/restartAgentHostAction.js` | `import { RestartLocalAgentHostAction } from '../../../../../workbench/contrib/chat/electron-browser/actions/restartAgentHostAction.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/electron-browser/localAgentHostLifecycle.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/electron-browser/chatLifecycle.js` | `import { confirmSessionShutdown, getEffectiveSessionShutdownReason } from '../../../../../workbench/contrib/chat/electron-browser/chatLifecycle.js';` |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsChangesets.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { getAgentSessionPullRequestUri, IAgentSession } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.js` | `import { getRepositoryName } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders, AgentSessionTarget } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService, IChatSendRequestOptions } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatResponseModel } from '../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { ChatSessionStatus, IChatSessionsService, IChatSessionProviderOptionGroup, IChatSessionProviderOptionItem, SessionType } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration, ChatModeKind, ChatPermissionLevel, isChatPermissionLevel } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { ChatMode, IChatMode, IChatModeService, isBuiltinChatMode } from '../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier, ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { getRegisteredLanguageModels, resolveModelIdentifier, resolveModelIdentifierFromLanguageModels } from '../../../../../workbench/contrib/chat/common/modelSelection.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 45 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 55 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 56 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { isCloudSandboxEnabled } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/mobilePermissionPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel } from '../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/modePicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { ChatMode, IChatMode, IChatModes, IChatModeService } from '../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatModeTelemetry.js` | `import { reportChatModeChange } from '../../../../../workbench/contrib/chat/common/chatModeTelemetry.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { Target } from '../../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementCommands } from '../../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/permissionPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/platform/sandbox/common/settings.js` | `import { AgentSandboxEnabledSettingValue, AgentSandboxEnabledValue, isAgentSandboxEnabledValue } from '../../../../../platform/sandbox/common/settings.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/chatPermissionWarnings.js` | `import { maybeConfirmElevatedPermissionLevel } from '../../../../../workbench/contrib/chat/common/chatPermissionWarnings.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel, isChatPermissionLevel } from '../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/sandboxPicker.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId, isCloudSandboxEnabled } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { ICloudSandboxAgentHostService, ICloudSandboxApiService } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHostContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_PROVIDER, CLOUD_SANDBOX_SESSION_SCHEME, CloudSandboxEnabledSettingId, cloudSandboxAddress, ICloudSandboxAgentHostService, ICloudSandboxApiService, isCloudSandboxEnabled, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveryResult, } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 31 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession, type IAgentSessionMetadata } from '../../../../../platform/agentHost/common/agent.js';` |
| 32 | `vscode/src/vs/platform/agentHost/common/taskEventReplay.js` | `import { IReplayedTaskHistory } from '../../../../../platform/agentHost/common/taskEventReplay.js';` |
| 33 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { agentHostAuthority } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 34 | `vscode/src/vs/platform/agentHost/common/agentHostSessionType.js` | `import { findRemoteAgentHostSessionTypeAuthority, remoteAgentHostSessionTypeId } from '../../../../../platform/agentHost/common/agentHostSessionType.js';` |
| 35 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { ChatSessionsExtensions, IAsyncChatSessionActivationRegistry, IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHostService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/state/sessionTransport.js` | `import { IProtocolTransport } from '../../../../../platform/agentHost/common/state/sessionTransport.js';` |
| 11 | `vscode/src/vs/platform/agentHost/browser/agentHostProtocolClient.js` | `import { AgentHostProtocolClient } from '../../../../../platform/agentHost/browser/agentHostProtocolClient.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostClientInfo.js` | `import { editorWindowAgentHostClientInfo } from '../../../../../platform/agentHost/common/agentHostClientInfo.js';` |
| 13 | `vscode/src/vs/platform/agentHost/browser/webPubSubRelayTransport.js` | `import { WebPubSubRelayTransport } from '../../../../../platform/agentHost/browser/webPubSubRelayTransport.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { GITHUB_COPILOT_PROTECTED_RESOURCE } from '../../../../../platform/agentHost/common/agentService.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_PROVIDER, CLOUD_SANDBOX_SESSION_SCHEME, CloudSandboxEnabledSettingId, cloudSandboxAddress, ICloudSandboxAgentHostService, ICloudSandboxApiService, isCloudSandboxEnabled, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveryResult, } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus, RemoteAgentHostEntryType, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/state/protocol/version/registry.js` | `import { PROTOCOL_VERSION } from '../../../../../platform/agentHost/common/state/protocol/version/registry.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxApiService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_PROVIDER, CLOUD_SANDBOX_SESSION_SCHEME, CloudSandboxEnabledSettingId, cloudSandboxAddress, ICloudSandboxAgentHostService, ICloudSandboxApiService, isCloudSandboxEnabled, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveryResult, } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/githubEndpoints.js` | `import { GITHUB_DOT_COM_COPILOT_API_BASE_URI, deriveGitHubEndpoints } from '../../../../../platform/agentHost/common/githubEndpoints.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/taskEventReplay.js` | `import { IReplayedTaskHistory, parseTaskEventsResponse, replayTaskAhpEvents, TaskEventReplayError } from '../../../../../platform/agentHost/common/taskEventReplay.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxConnectionCustomization.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_PROVIDER, CLOUD_SANDBOX_SESSION_SCHEME, CloudSandboxEnabledSettingId, cloudSandboxAddress, ICloudSandboxAgentHostService, ICloudSandboxApiService, isCloudSandboxEnabled, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveryResult, } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js` | `import { IAgentHostAuthenticateRequest } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxCredentialRefresh.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_PROVIDER, CLOUD_SANDBOX_SESSION_SCHEME, CloudSandboxEnabledSettingId, cloudSandboxAddress, ICloudSandboxAgentHostService, ICloudSandboxApiService, isCloudSandboxEnabled, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveryResult, } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxReadOnlySessionHandler.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession } from '../../../../../platform/agentHost/common/agent.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { ICloudSandboxApiService } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/taskEventReplay.js` | `import { IReplayedTaskHistory } from '../../../../../platform/agentHost/common/taskEventReplay.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.js` | `import { activeTurnToProgress, messageToRequestOrigin, messageToVariableData, turnsToHistory } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/stateToProgressAdapter.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSession, IChatSessionContentProvider, IChatSessionHistoryItem } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxTelemetry.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxRequestError } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/manageRemoteAgentHosts.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { TUNNEL_ADDRESS_PREFIX } from '../../../../../platform/agentHost/common/tunnelAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/managedReconnectAgentHostContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/state/protocol/version/registry.js` | `import { PROTOCOL_VERSION } from '../../../../../platform/agentHost/common/state/protocol/version/registry.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { agentHostAuthority } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 14 | `vscode/src/vs/platform/agentHost/browser/agentHostProtocolClient.js` | `import { AgentHostProtocolClient } from '../../../../../platform/agentHost/browser/agentHostProtocolClient.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { type AgentProvider, type AuthenticateParams, type AuthenticateResult } from '../../../../../platform/agentHost/common/agent.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { type IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostConnectionInfo, IRemoteAgentHostEntry, IRemoteAgentHostService, type IRemoteAgentHostSSHConnection, RemoteAgentHostAutoConnectSettingId, RemoteAgentHostConnectionStatus, RemoteAgentHostEntryType, RemoteAgentHostsEnabledSettingId, RemoteAgentHostsSettingId, getEntryAddress } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { TunnelAgentHostsSettingId } from '../../../../../platform/agentHost/common/tunnelAgentHost.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId } from '../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 20 | `vscode/src/vs/platform/agentHost/common/state/protocol/version/registry.js` | `import { PROTOCOL_VERSION } from '../../../../../platform/agentHost/common/state/protocol/version/registry.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/agentHostResourceService.js` | `import { AgentHostLocalFilePermissionsSettingId } from '../../../../../platform/agentHost/common/agentHostResourceService.js';` |
| 22 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { type ProtectedResourceMetadata } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 23 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { type AgentInfo, type RootState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { NotificationType, type INotification } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js` | `import { authenticateProtectedResources, AgentHostAuthenticationRecovery, AgentHostAuthTokenCache, resolveAuthenticationInteractively } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLanguageModelProvider.js` | `import { AgentHostLanguageModelProvider, agentHostProviderSupportsAutoModel } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostLanguageModelProvider.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.js` | `import { AgentHostSessionHandler } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { ChatSessionsExtensions, IAsyncChatSessionActivationRegistry, IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 42 | `vscode/src/vs/workbench/services/agentHost/common/agentHostFileSystemService.js` | `import { IAgentHostFileSystemService } from '../../../../../workbench/services/agentHost/common/agentHostFileSystemService.js';` |
| 46 | `vscode/src/vs/platform/agentHost/common/agentHostSessionType.js` | `import { findRemoteAgentHostSessionTypeAuthority, isRemoteAgentHostSessionType, remoteAgentHostSessionTypeId } from '../../../../../platform/agentHost/common/agentHostSessionType.js';` |
| 53 | `vscode/src/vs/platform/agentHost/common/sshRemoteAgentHost.js` | `import { computeSSHConnectionKey, isSSHHostKeyDeniedError, ISSHRemoteAgentHostService, SSHAuthMethod } from '../../../../../platform/agentHost/common/sshRemoteAgentHost.js';` |
| 1227 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js` | `import { AgentCustomizationItemProvider } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/tunnelHost.js` | `import { ITunnelHostService } from '../../../../../workbench/contrib/chat/common/tunnelHost.js';` |
| 28 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, parseRemoteAgentHostInput, RemoteAgentHostConnectionStatus, RemoteAgentHostEntryType, RemoteAgentHostInputValidationError, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 29 | `vscode/src/vs/platform/agentHost/common/sshRemoteAgentHost.js` | `import { ISSHRemoteAgentHostService, isSSHHostKeyDeniedError, SSHAuthMethod, type ISSHAgentHostConfig, type ISSHAgentHostConnection, type ISSHResolvedConfig } from '../../../../../platform/agentHost/common/sshRemoteAgentHost.js';` |
| 30 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { isTunnelHosted, ITunnelAgentHostService, TUNNEL_ADDRESS_PREFIX, type ITunnelInfo } from '../../../../../platform/agentHost/common/tunnelAgentHost.js';` |
| 31 | `vscode/src/vs/platform/agentHost/common/wslRemoteAgentHost.js` | `import { IWSLRemoteAgentHostService, WSL_INSTALL_DOCS_URL, type IWSLDistro } from '../../../../../platform/agentHost/common/wslRemoteAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostConnectionCustomization.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js` | `import { IAgentHostAuthenticateRequest } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostCustomizationHarness.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/agentHostCustomizationConfig.js` | `import { AgentHostConfigKey, getAgentHostConfiguredCustomizations } from '../../../../../platform/agentHost/common/agentHostCustomizationConfig.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/agentHostFileSystemProvider.js` | `import { agentHostUri } from '../../../../../platform/agentHost/common/agentHostFileSystemProvider.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import type { IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { ROOT_STATE_URI, customizationId, type Customization } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection, IAICustomizationWorkspaceService } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationSyncProvider, type IHarnessDescriptor, type ICustomizationItemAction } from '../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js` | `import { AgentCustomizationItemProvider } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationType } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostLogForwarder.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/otlp/otlpLogEmitter.js` | `import { iterateOtlpLogRecords, logLevelToOtlpLevelName, severityNumberToLogLevel, type IOtlpLogRecord, type OtlpLogLevelName } from '../../../../../platform/agentHost/common/otlp/otlpLogEmitter.js';` |
| 12 | `vscode/src/vs/platform/agentHost/browser/agentHostProtocolClient.js` | `import { AgentHostClientState, type AgentHostProtocolClient } from '../../../../../platform/agentHost/browser/agentHostProtocolClient.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { remoteAgentHostLogOutputChannelId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { formatHostBuildInfo, readHostBuildInfo } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostSessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/agentHostFileSystemProvider.js` | `import { agentHostUri } from '../../../../../platform/agentHost/common/agentHostFileSystemProvider.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, agentHostAuthority, fromAgentHostUri, toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession, type IAgentSessionMetadata } from '../../../../../platform/agentHost/common/agent.js';` |
| 20 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { type IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 22 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import type { ISessionGitState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 42 | `vscode/src/vs/platform/agentHost/common/agentHostSessionType.js` | `import { remoteAgentHostSessionTypeId } from '../../../../../platform/agentHost/common/agentHostSessionType.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostTerminal.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteHostOptions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { TUNNEL_ADDRESS_PREFIX } from '../../../../../platform/agentHost/common/tunnelAgentHost.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreference.js` | `import { IRemoteAgentHostLocationPreferenceService } from '../../../../../platform/agentHost/common/remoteAgentHostLocationPreference.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreferenceDialog.js` | `import { promptRemoteAgentHostLocationPreference } from '../../../../../platform/agentHost/common/remoteAgentHostLocationPreferenceDialog.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/syncedCustomizationBundler.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.js` | `export { SyncedCustomizationBundler } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.js';` |
| 9 | `vscode/src/vs/workbench/services/agentHost/common/agentHostFileSystemService.js` | `export { SYNCED_CUSTOMIZATION_SCHEME } from '../../../../../workbench/services/agentHost/common/agentHostFileSystemService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/wslAgentHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostAutoConnectSettingId, RemoteAgentHostConnectionStatus, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/wslRemoteAgentHost.js` | `import { IWSLRemoteAgentHostService, WSL_ADDRESS_PREFIX } from '../../../../../platform/agentHost/common/wslRemoteAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/electron-browser/forgetSSHHostKeyCommand.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/sshHostKeyTrust.js` | `import { ISSHHostKeyTrustService, type ISSHTrustedHost } from '../../../../../platform/agentHost/common/sshHostKeyTrust.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_CATEGORY } from '../../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/sessionInputBanners/browser/sessionInputBanners.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../workbench/contrib/chat/browser/chat.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/aiCustomizationShortcutsWidget.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../../workbench/contrib/mcp/common/mcpTypes.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js` | `import { IAICustomizationItemsModel } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/blockedSessionsCIFixModel.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { ChatSendResult, IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/blockedSessionsIndicatorModel.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalKind, AgentSessionApprovalModel, agentSessionApprovalId } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/blockedSessionsList.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalModel } from '../../../../workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/customizationsToolbar.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js` | `import { AICustomizationManagementEditor } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js` | `import { AICustomizationManagementEditorInput } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js` | `import { IAICustomizationItemsModel, ItemsModelSection } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js';` |
| 20 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../../workbench/contrib/mcp/common/mcpTypes.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js` | `import { AGENT_HOST_COPILOT_CLI_SESSION_TYPE, countEnabledCustomizationTools, IAgentHostToolSetEnablementService } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js` | `import { agentIcon, instructionsIcon, mcpServerIcon, pluginIcon, skillIcon, hookIcon, toolsIcon } from '../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationIcons.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/sessionDetailsAction.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/sessionHoverContent.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatColors.js` | `import { chatLinesAddedForeground, chatLinesRemovedForeground } from '../../../../workbench/contrib/chat/common/widget/chatColors.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/sessionsTelemetry.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { isChatRequestFileEntry, isImageVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/sessionsWindowNotifier.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatNotificationMode } from '../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/views/automationsAccessibility.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor, IAutomationRun } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/automations/schedule.js` | `import { DAYS_OF_WEEK } from '../../../../../workbench/contrib/chat/common/automations/schedule.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/views/automationsView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import type { IAutomationDescriptor, IAutomationRun, AutomationTarget } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { CHAT_AUTOMATIONS_ENABLED_SETTING, ChatAutomationsEnabledContext } from '../../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunner } from '../../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogService } from '../../../../../workbench/contrib/chat/common/automations/automationDialogService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/automations/schedule.js` | `import { DAYS_OF_WEEK } from '../../../../../workbench/contrib/chat/common/automations/schedule.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalModel } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/views/sessionsList.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 47 | `vscode/src/vs/platform/chat/common/sessionArchiveActions.js` | `import { ChatSessionArchiveActionWording, ChatSessionArchiveActionWordingSettingId, getChatSessionArchivedSectionLabel, getChatSessionArchiveActionWording } from '../../../../../platform/chat/common/sessionArchiveActions.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalModel, agentSessionApprovalId, IAgentSessionApprovalInfo } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../../workbench/contrib/chat/common/voicePlaybackService.js';` |
| 79 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 88 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext } from '../../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 89 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/views/sessionsView.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/platform/chat/common/sessionArchiveActions.js` | `import { ChatSessionArchiveActionWordingSettingId, getChatSessionArchivedSectionLabel, getChatSessionArchiveActionWording } from '../../../../../platform/chat/common/sessionArchiveActions.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/browser/views/sessionsViewActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 34 | `vscode/src/vs/platform/chat/common/sessionArchiveActions.js` | `import { ChatSessionArchiveActionWording, ChatSessionArchiveActionWordingSettingId, getChatSessionArchiveActionPresentation, getChatSessionArchiveActionWording } from '../../../../../platform/chat/common/sessionArchiveActions.js';` |
| 35 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { AGENT_HOST_ENABLED_CONTEXT_KEY } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/externalSessionsFilterMenu.js` | `import { registerExternalSessionsFilterMenu } from '../../../../../workbench/contrib/chat/browser/agentSessions/externalSessionsFilterMenu.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/contrib/terminal/browser/agentHostSessionTaskRunner.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/sessions/contrib/terminal/browser/sessionsTerminalContribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/sessions/contrib/tunnelHost/browser/webTunnelHostService.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/common/tunnelHost.js` | `import { ITunnelHostService } from '../../../../workbench/contrib/chat/common/tunnelHost.js';` |

#### `vscode/src/vs/sessions/contrib/tunnelHost/browser/webTunnelHostService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { ITunnelHostInfo } from '../../../../platform/agentHost/common/tunnelAgentHost.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/tunnelHost.js` | `import { ITunnelHostService } from '../../../../workbench/contrib/chat/common/tunnelHost.js';` |

#### `vscode/src/vs/sessions/contrib/tunnelHost/electron-browser/tunnelHost.contribution.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/tunnelHost.js` | `import { ITunnelHostService } from '../../../../workbench/contrib/chat/common/tunnelHost.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/electron-browser/toggleRemoteConnectionsActionViewItem.js` | `import { ToggleRemoteConnectionsActionViewItem } from '../../../../workbench/contrib/chat/electron-browser/toggleRemoteConnectionsActionViewItem.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/electron-browser/tunnelHost.contribution.js` | `import { TOGGLE_SHARING_ID, TUNNEL_HOST_SHARING_KEY } from '../../../../workbench/contrib/chat/electron-browser/tunnelHost.contribution.js';` |

#### `vscode/src/vs/sessions/electron-browser/actions/vscodeActions.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../platform/agentHost/common/agentHostUri.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/services/agentHost/browser/agentHostCustomizationService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js` | `import { IAgentHostCustomizationService, AbstractAgentHostCustomizationService, type IAgentHostCustomizationTarget } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { AgentCustomization, CustomizationType } from '../../../../platform/agentHost/common/state/sessionState.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { type CustomizationEnablement } from '../../../../platform/agentHost/common/state/protocol/state.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |

#### `vscode/src/vs/sessions/services/agentHostFilter/browser/agentHostFilterService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/services/configuration/browser/configurationService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/sessions/services/sessions/browser/sessionReference.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/services/sessions/browser/sessionsManagementService.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { agentHostAuthority } from '../../../../platform/agentHost/common/agentHostUri.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../workbench/contrib/chat/common/constants.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.js` | `import { IChatWidgetHistoryService } from '../../../../workbench/contrib/chat/common/widget/chatWidgetHistoryService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/copilotCliEventsUri.js` | `import { buildHostLocalEventsPath, dedupeMigratedCopilotCliSessions, getCopilotCliSessionRawId } from '../../../../workbench/contrib/chat/browser/copilotCliEventsUri.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/services/sessions/browser/worktreeTrust.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/platform/agentHost/common/worktreePaths.js` | `import { isWorktreeUnderRepository } from '../../../../platform/agentHost/common/worktreePaths.js';` |

#### `vscode/src/vs/sessions/services/sessions/common/session.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange, IChatSessionFileChange2, isIChatSessionFileChange2 } from '../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/services/sessions/common/sessionsProvider.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../workbench/contrib/chat/common/languageModels.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { ModelIdentifierResolution } from '../../../../workbench/contrib/chat/common/modelSelection.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor, IAutomationRun } from '../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationStore } from '../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/sessions.common.main.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 66 | `vscode/src/vs/platform/mcp/common/mcpResourceScannerService.js` | `import '../platform/mcp/common/mcpResourceScannerService.js';` |
| 80 | `vscode/src/vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.js` | `import '../workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.js';` |
| 81 | `vscode/src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService.js` | `import '../workbench/services/aiRelatedInformation/common/aiRelatedInformationService.js';` |
| 82 | `vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearchService.js` | `import '../workbench/services/aiSettingsSearch/common/aiSettingsSearchService.js';` |
| 143 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import '../workbench/services/chat/common/chatEntitlementService.js';` |
| 145 | `vscode/src/vs/workbench/services/agentHost/common/agentHostResourceService.js` | `import '../workbench/services/agentHost/common/agentHostResourceService.js';` |
| 146 | `vscode/src/vs/platform/agentHost/browser/agentHostConnectionsService.js` | `import '../platform/agentHost/browser/agentHostConnectionsService.js';` |
| 147 | `vscode/src/vs/platform/agentHost/browser/agentHostEnablementService.js` | `import '../platform/agentHost/browser/agentHostEnablementService.js';` |
| 173 | `vscode/src/vs/platform/mcp/common/mcpManagement.js` | `import { IAllowedMcpServersService, IMcpGalleryService } from '../platform/mcp/common/mcpManagement.js';` |
| 174 | `vscode/src/vs/platform/mcp/common/mcpGalleryService.js` | `import { McpGalleryService } from '../platform/mcp/common/mcpGalleryService.js';` |
| 175 | `vscode/src/vs/platform/mcp/common/allowedMcpServersService.js` | `import { AllowedMcpServersService } from '../platform/mcp/common/allowedMcpServersService.js';` |
| 221 | `vscode/src/vs/workbench/contrib/speech/browser/speech.contribution.js` | `import '../workbench/contrib/speech/browser/speech.contribution.js';` |
| 224 | `vscode/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.js` | `import '../workbench/contrib/chat/browser/chat.shared.contribution.js';` |
| 225 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChat.contribution.js` | `//import '../workbench/contrib/inlineChat/browser/inlineChat.contribution.js';` |
| 226 | `vscode/src/vs/workbench/contrib/mcp/browser/mcp.contribution.js` | `import '../workbench/contrib/mcp/browser/mcp.contribution.js';` |
| 227 | `vscode/src/vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution.js` | `import '../workbench/contrib/chat/browser/chatSessions/chatSessions.contribution.js';` |
| 228 | `vscode/src/vs/workbench/contrib/chat/browser/contextContrib/chatContext.contribution.js` | `import '../workbench/contrib/chat/browser/contextContrib/chatContext.contribution.js';` |
| 232 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution.js` | `import '../workbench/contrib/agentsVoice/browser/agentsVoice.contribution.js';` |

#### `vscode/src/vs/sessions/sessions.desktop.main.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 59 | `vscode/src/vs/workbench/services/mcp/electron-browser/mcpGalleryManifestService.js` | `import '../workbench/services/mcp/electron-browser/mcpGalleryManifestService.js';` |
| 60 | `vscode/src/vs/workbench/services/mcp/electron-browser/mcpWorkbenchManagementService.js` | `import '../workbench/services/mcp/electron-browser/mcpWorkbenchManagementService.js';` |
| 95 | `vscode/src/vs/platform/sandbox/electron-browser/sandboxHelperService.js` | `import '../platform/sandbox/electron-browser/sandboxHelperService.js';` |
| 96 | `vscode/src/vs/platform/webContentExtractor/electron-browser/webContentExtractorService.js` | `import '../platform/webContentExtractor/electron-browser/webContentExtractorService.js';` |
| 100 | `vscode/src/vs/workbench/services/localTranscription/electron-browser/localTranscriptionService.js` | `import '../workbench/services/localTranscription/electron-browser/localTranscriptionService.js';` |
| 105 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../platform/agentHost/common/remoteAgentHostService.js';` |
| 106 | `vscode/src/vs/platform/agentHost/browser/remoteAgentHostServiceImpl.js` | `import { AgentsWindowRemoteAgentHostService } from '../platform/agentHost/browser/remoteAgentHostServiceImpl.js';` |
| 107 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreference.js` | `import { IRemoteAgentHostLocationPreferenceService } from '../platform/agentHost/common/remoteAgentHostLocationPreference.js';` |
| 108 | `vscode/src/vs/platform/agentHost/browser/remoteAgentHostLocationPreferenceService.js` | `import { RemoteAgentHostLocationPreferenceService } from '../platform/agentHost/browser/remoteAgentHostLocationPreferenceService.js';` |
| 109 | `vscode/src/vs/platform/agentHost/common/sshHostKeyTrust.js` | `import { ISSHHostKeyTrustService } from '../platform/agentHost/common/sshHostKeyTrust.js';` |
| 110 | `vscode/src/vs/platform/agentHost/browser/sshHostKeyTrustService.js` | `import { SSHHostKeyTrustService } from '../platform/agentHost/browser/sshHostKeyTrustService.js';` |
| 112 | `vscode/src/vs/workbench/contrib/chat/common/plugins/pluginGitService.js` | `import { IPluginGitService } from '../workbench/contrib/chat/common/plugins/pluginGitService.js';` |
| 113 | `vscode/src/vs/workbench/contrib/chat/electron-browser/pluginGitCommandService.js` | `import { NativePluginGitCommandService } from '../workbench/contrib/chat/electron-browser/pluginGitCommandService.js';` |
| 213 | `vscode/src/vs/workbench/contrib/mcp/electron-browser/mcp.contribution.js` | `import '../workbench/contrib/mcp/electron-browser/mcp.contribution.js';` |
| 229 | `vscode/src/vs/workbench/services/agentHost/electron-browser/agentHostService.js` | `import '../workbench/services/agentHost/electron-browser/agentHostService.js';` |
| 230 | `vscode/src/vs/platform/agentHost/electron-browser/sshRemoteAgentHostService.js` | `import '../platform/agentHost/electron-browser/sshRemoteAgentHostService.js';` |
| 231 | `vscode/src/vs/platform/agentHost/electron-browser/wslRemoteAgentHostService.js` | `import '../platform/agentHost/electron-browser/wslRemoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/sessions.web.main.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 51 | `vscode/src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.js` | `import '../workbench/services/mcp/browser/mcpWorkbenchManagementService.js';` |
| 79 | `vscode/src/vs/workbench/services/localTranscription/browser/localTranscriptionService.js` | `import '../workbench/services/localTranscription/browser/localTranscriptionService.js';` |
| 80 | `vscode/src/vs/platform/sandbox/browser/sandboxHelperService.js` | `import '../platform/sandbox/browser/sandboxHelperService.js';` |
| 105 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { IWebContentExtractorService, NullWebContentExtractorService, ISharedWebContentExtractorService, NullSharedWebContentExtractorService } from '../platform/webContentExtractor/common/webContentExtractor.js';` |
| 106 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifest.js` | `import { IMcpGalleryManifestService } from '../platform/mcp/common/mcpGalleryManifest.js';` |
| 107 | `vscode/src/vs/workbench/services/mcp/browser/mcpGalleryManifestService.js` | `import { WorkbenchMcpGalleryManifestService } from '../workbench/services/mcp/browser/mcpGalleryManifestService.js';` |
| 109 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../platform/agentHost/common/remoteAgentHostService.js';` |
| 110 | `vscode/src/vs/platform/agentHost/browser/remoteAgentHostServiceImpl.js` | `import { AgentsWindowRemoteAgentHostService } from '../platform/agentHost/browser/remoteAgentHostServiceImpl.js';` |
| 111 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreference.js` | `import { IRemoteAgentHostLocationPreferenceService } from '../platform/agentHost/common/remoteAgentHostLocationPreference.js';` |
| 112 | `vscode/src/vs/platform/agentHost/browser/remoteAgentHostLocationPreferenceService.js` | `import { RemoteAgentHostLocationPreferenceService } from '../platform/agentHost/browser/remoteAgentHostLocationPreferenceService.js';` |
| 113 | `vscode/src/vs/platform/agentHost/common/sshRemoteAgentHost.js` | `import { ISSHRemoteAgentHostService } from '../platform/agentHost/common/sshRemoteAgentHost.js';` |
| 114 | `vscode/src/vs/platform/agentHost/browser/nullSshRemoteAgentHostService.js` | `import { NullSSHRemoteAgentHostService } from '../platform/agentHost/browser/nullSshRemoteAgentHostService.js';` |
| 115 | `vscode/src/vs/platform/agentHost/common/wslRemoteAgentHost.js` | `import { IWSLRemoteAgentHostService } from '../platform/agentHost/common/wslRemoteAgentHost.js';` |
| 116 | `vscode/src/vs/platform/agentHost/browser/nullWslRemoteAgentHostService.js` | `import { NullWSLRemoteAgentHostService } from '../platform/agentHost/browser/nullWslRemoteAgentHostService.js';` |
| 117 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../platform/agentHost/common/agentService.js';` |
| 118 | `vscode/src/vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.js` | `import { EditorRemoteAgentHostServiceClient } from '../workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.js';` |
| 119 | `vscode/src/vs/workbench/services/agentHost/browser/webAgentHostEnablementService.js` | `import '../workbench/services/agentHost/browser/webAgentHostEnablementService.js';` |
| 120 | `vscode/src/vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js` | `import { BrowserAgentHostDebugLogsExportService, IAgentHostDebugLogsExportService } from '../workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js';` |

#### `vscode/src/vs/workbench/api/browser/extensionHost.contribution.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/workbench/api/browser/mainThreadLanguageModels.js` | `import './mainThreadLanguageModels.js';` |
| 23 | `vscode/src/vs/workbench/api/browser/mainThreadChatAgents2.js` | `import './mainThreadChatAgents2.js';` |
| 24 | `vscode/src/vs/workbench/api/browser/mainThreadChatCodeMapper.js` | `import './mainThreadChatCodeMapper.js';` |
| 25 | `vscode/src/vs/workbench/api/browser/mainThreadLanguageModelTools.js` | `import './mainThreadLanguageModelTools.js';` |
| 60 | `vscode/src/vs/workbench/api/browser/mainThreadSpeech.js` | `import './mainThreadSpeech.js';` |
| 94 | `vscode/src/vs/workbench/api/browser/mainThreadAiRelatedInformation.js` | `import './mainThreadAiRelatedInformation.js';` |
| 95 | `vscode/src/vs/workbench/api/browser/mainThreadAiEmbeddingVector.js` | `import './mainThreadAiEmbeddingVector.js';` |
| 96 | `vscode/src/vs/workbench/api/browser/mainThreadAiSettingsSearch.js` | `import './mainThreadAiSettingsSearch.js';` |
| 97 | `vscode/src/vs/workbench/api/browser/mainThreadMcp.js` | `import './mainThreadMcp.js';` |
| 98 | `vscode/src/vs/workbench/api/browser/mainThreadChatContext.js` | `import './mainThreadChatContext.js';` |
| 99 | `vscode/src/vs/workbench/api/browser/mainThreadChatDebug.js` | `import './mainThreadChatDebug.js';` |
| 100 | `vscode/src/vs/workbench/api/browser/mainThreadChatStatus.js` | `import './mainThreadChatStatus.js';` |
| 101 | `vscode/src/vs/workbench/api/browser/mainThreadChatQuota.js` | `import './mainThreadChatQuota.js';` |
| 102 | `vscode/src/vs/workbench/api/browser/mainThreadChatInputNotification.js` | `import './mainThreadChatInputNotification.js';` |
| 103 | `vscode/src/vs/workbench/api/browser/mainThreadChatOutputRenderer.js` | `import './mainThreadChatOutputRenderer.js';` |
| 104 | `vscode/src/vs/workbench/api/browser/mainThreadChatSessions.js` | `import './mainThreadChatSessions.js';` |

#### `vscode/src/vs/workbench/api/browser/mainThreadAuthentication.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 33 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { mcpOAuthClientSecretStorageKey } from '../../contrib/mcp/common/mcpTypes.js';` |
| 36 | `vscode/src/vs/workbench/contrib/mcp/common/mcpConfiguration.js` | `import { IMcpEnterpriseManagedAuthIdpConfig, mcpEnterpriseManagedAuthIdpSection } from '../../contrib/mcp/common/mcpConfiguration.js';` |

#### `vscode/src/vs/workbench/api/browser/mainThreadEditorTabs.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditorInput.js` | `import { ChatEditorInput } from '../../contrib/chat/browser/widgetHosts/editor/chatEditorInput.js';` |

#### `vscode/src/vs/workbench/api/browser/mainThreadWebviewManager.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/api/browser/mainThreadChatOutputRenderer.js` | `import { MainThreadChatOutputRenderer } from './mainThreadChatOutputRenderer.js';` |

#### `vscode/src/vs/workbench/api/common/extHost.api.impl.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 34 | `vscode/src/vs/workbench/api/common/extHostAiRelatedInformation.js` | `import { ExtHostRelatedInformation } from './extHostAiRelatedInformation.js';` |
| 35 | `vscode/src/vs/workbench/api/common/extHostAiSettingsSearch.js` | `import { ExtHostAiSettingsSearch } from './extHostAiSettingsSearch.js';` |
| 40 | `vscode/src/vs/workbench/api/common/extHostChatAgents2.js` | `import { ExtHostChatAgents2 } from './extHostChatAgents2.js';` |
| 41 | `vscode/src/vs/workbench/api/common/extHostChatOutputRenderer.js` | `import { ExtHostChatOutputRenderer } from './extHostChatOutputRenderer.js';` |
| 42 | `vscode/src/vs/workbench/api/common/extHostChatSessions.js` | `import { ExtHostChatSessions } from './extHostChatSessions.js';` |
| 43 | `vscode/src/vs/workbench/api/common/extHostChatStatus.js` | `import { ExtHostChatStatus } from './extHostChatStatus.js';` |
| 44 | `vscode/src/vs/workbench/api/common/extHostChatQuota.js` | `import { ExtHostChatQuota } from './extHostChatQuota.js';` |
| 45 | `vscode/src/vs/workbench/api/common/extHostChatInputNotification.js` | `import { ExtHostChatInputNotification } from './extHostChatInputNotification.js';` |
| 48 | `vscode/src/vs/workbench/api/common/extHostCodeMapper.js` | `import { ExtHostCodeMapper } from './extHostCodeMapper.js';` |
| 64 | `vscode/src/vs/workbench/api/common/extHostEmbeddingVector.js` | `import { ExtHostAiEmbeddingVector } from './extHostEmbeddingVector.js';` |
| 74 | `vscode/src/vs/workbench/api/common/extHostLanguageModelTools.js` | `import { ExtHostLanguageModelTools } from './extHostLanguageModelTools.js';` |
| 75 | `vscode/src/vs/workbench/api/common/extHostLanguageModels.js` | `import { IExtHostLanguageModels } from './extHostLanguageModels.js';` |
| 80 | `vscode/src/vs/workbench/api/common/extHostMcp.js` | `import { IExtHostMpcService } from './extHostMcp.js';` |
| 99 | `vscode/src/vs/workbench/api/common/extHostSpeech.js` | `import { ExtHostSpeech } from './extHostSpeech.js';` |
| 125 | `vscode/src/vs/workbench/api/common/extHostChatContext.js` | `import { ExtHostChatContext } from './extHostChatContext.js';` |
| 126 | `vscode/src/vs/workbench/api/common/extHostChatDebug.js` | `import { ExtHostChatDebug } from './extHostChatDebug.js';` |

#### `vscode/src/vs/workbench/api/common/extHost.common.services.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 32 | `vscode/src/vs/workbench/api/common/extHostLanguageModels.js` | `import { ExtHostLanguageModels, IExtHostLanguageModels } from './extHostLanguageModels.js';` |
| 35 | `vscode/src/vs/workbench/api/common/extHostMcp.js` | `import { ExtHostMcpService, IExtHostMpcService } from './extHostMcp.js';` |

#### `vscode/src/vs/workbench/api/common/extHost.protocol.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 60 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentMetadata, IChatAgentRequest, IChatAgentResult, UserSelectedTools } from '../../contrib/chat/common/participants/chatAgents.js';` |
| 61 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatCodeMapperService.js` | `import { ICodeMapperRequest, ICodeMapperResult } from '../../contrib/chat/common/editing/chatCodeMapperService.js';` |
| 62 | `vscode/src/vs/workbench/contrib/chat/common/contextContrib/chatContext.js` | `import { IChatContextItem } from '../../contrib/chat/common/contextContrib/chatContext.js';` |
| 63 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatProgressHistoryResponseContent, IChatRequestModeInstructions, IChatRequestVariableData } from '../../contrib/chat/common/model/chatModel.js';` |
| 64 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { ChatResponseClearToPreviousToolInvocationReason, IChatContentInlineReference, IChatExternalEditsDto, IChatFollowup, IChatMultiDiffData, IChatMultiDiffDataSerialized, IChatNotebookEdit, IChatProgress, IChatTask, IChatTaskDto, IChatUserActionEvent, IChatVoteAction } from '../../contrib/chat/common/chatService/chatService.js';` |
| 65 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionItem, IChatSessionProviderOptionGroup, IChatSessionProviderOptionItem } from '../../contrib/chat/common/chatSessionsService.js';` |
| 66 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariables.js` | `import { IChatRequestVariableValue } from '../../contrib/chat/common/attachments/chatVariables.js';` |
| 67 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../contrib/chat/common/constants.js';` |
| 68 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { IChatMessage, IChatResponsePart, ILanguageModelChatInfoOptions, ILanguageModelChatMetadataAndIdentifier, ILanguageModelChatRequestOptions, ILanguageModelChatSelector } from '../../contrib/chat/common/languageModels.js';` |
| 69 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IPreparedToolInvocation, IStreamedToolInvocation, IToolInvocation, IToolInvocationPreparationContext, IToolInvocationStreamContext, IToolProgressStep, IToolResult, ToolDataSource } from '../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 70 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptFileContext, IPromptFileResource } from '../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 72 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { McpCollectionDefinition, McpConnectionState, McpServerDefinition, McpServerLaunch } from '../../contrib/mcp/common/mcpTypes.js';` |
| 81 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { IKeywordRecognitionEvent, ISpeechProviderMetadata, ISpeechToTextEvent, ITextToSpeechEvent } from '../../contrib/speech/common/speechService.js';` |
| 85 | `vscode/src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.js` | `import { RelatedInformationResult, RelatedInformationType } from '../../services/aiRelatedInformation/common/aiRelatedInformation.js';` |
| 86 | `vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.js` | `import { AiSettingsSearchProviderOptions, AiSettingsSearchResult } from '../../services/aiSettingsSearch/common/aiSettingsSearch.js';` |
| 104 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../contrib/chat/common/promptSyntax/promptTypes.js';` |

#### `vscode/src/vs/workbench/api/common/extHostApiCommands.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/chatPromptFilesContribution.js` | `import type { IExtensionPromptFileResult } from '../../contrib/chat/common/promptSyntax/chatPromptFilesContribution.js';` |

#### `vscode/src/vs/workbench/api/common/extHostExtensionService.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 37 | `vscode/src/vs/workbench/api/common/extHostLanguageModels.js` | `import { IExtHostLanguageModels } from './extHostLanguageModels.js';` |

#### `vscode/src/vs/workbench/api/common/extHostTypeConverters.ts` · U-C / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentRequest, IChatAgentResult } from '../../contrib/chat/common/participants/chatAgents.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatRequestModeInstructions } from '../../contrib/chat/common/model/chatModel.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatAgentMarkdownContentWithVulnerability, IChatAutoModeResolutionPart, IChatCodeCitation, IChatCommandButton, IChatConfirmation, IChatContentInlineReference, IChatContentReference, IChatExtensionsContent, IChatExternalToolInvocationUpdate, IChatFollowup, IChatHookPart, IChatMarkdownContent, IChatMoveMessage, IChatMultiDiffDataSerialized, IChatProgressMessage, IChatPullRequestContent, IChatQuestionCarousel, IChatResponseCodeblockUriPart, IChatTaskDto, IChatTaskResult, IChatTerminalToolInvocationData, IChatTextEdit, IChatThinkingPart, IChatToolInvocationSerialized, IChatTreeData, IChatUserActionEvent, IChatVoiceProgressPart, IChatWarningMessage, IChatInfoMessage, IChatWorkspaceEdit } from '../../contrib/chat/common/chatService/chatService.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { LocalChatSessionUri } from '../../contrib/chat/common/model/chatUri.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { ChatRequestToolReferenceEntry, IChatRequestVariableEntry, isElementVariableEntry, isImageVariableEntry, isPromptFileVariableEntry, isPromptTextVariableEntry } from '../../contrib/chat/common/attachments/chatVariableEntries.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/chatImageExtraction.js` | `import { coerceImageBuffer } from '../../contrib/chat/common/chatImageExtraction.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { ChatSessionStatus, IChatSessionItem } from '../../contrib/chat/common/chatSessionsService.js';` |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../contrib/chat/common/constants.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/hookSchema.js` | `import { ChatRequestHooks, resolveEffectiveCommand } from '../../contrib/chat/common/promptSyntax/hookSchema.js';` |
| 54 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IToolInvocationContext, IToolResult, IToolResultInputOutputDetails, IToolResultOutputDetails, ToolDataSource, ToolInvocationPresentation } from '../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 55 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import * as chatProvider from '../../contrib/chat/common/languageModels.js';` |
| 56 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { IChatMessageDataPart, IChatResponseDataPart, IChatResponsePromptTsxPart, IChatResponseTextPart } from '../../contrib/chat/common/languageModels.js';` |
| 58 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { McpServerDefinition as McpServerDefinitionType, McpServerLaunch, McpServerTransportType } from '../../contrib/mcp/common/mcpTypes.js';` |
| 66 | `vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.js` | `import { AiSettingsSearchResult, AiSettingsSearchResultKind } from '../../services/aiSettingsSearch/common/aiSettingsSearch.js';` |

#### `vscode/src/vs/workbench/api/common/extHostTypes.ts` · P-D / T-A

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/hookTypes.js` | `import { HookTypeValue } from '../../contrib/chat/common/promptSyntax/hookTypes.js';` |

#### `vscode/src/vs/workbench/api/node/extHost.node.services.ts` · U-A / T-A+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/workbench/api/common/extHostMcp.js` | `import { IExtHostMpcService } from '../common/extHostMcp.js';` |
| 31 | `vscode/src/vs/workbench/api/node/extHostMcpNode.js` | `import { NodeExtHostMpcService } from './extHostMcpNode.js';` |

#### `vscode/src/vs/workbench/browser/actions/developerActions.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 62 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../../../platform/agentHost/common/agentService.js';` |
| 63 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../platform/agentHost/common/agentHostEnablementService.js';` |

#### `vscode/src/vs/workbench/browser/actions/quickAccessActions.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/browser/layout.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/browser/parts/globalCompositeBar.ts` · U-N / T-H+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 52 | `vscode/src/vs/workbench/services/agentHost/browser/codexAccountService.js` | `import { createCodexAccountMenuActions, ICodexAccountService, shouldShowCodexAccount } from '../../services/agentHost/browser/codexAccountService.js';` |

#### `vscode/src/vs/workbench/browser/parts/titlebar/commandCenterControl.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/contrib/accessibility/browser/accessibility.contribution.ts` · U-N / T-V+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/speech/browser/speechAccessibilitySignal.js` | `import { SpeechAccessibilitySignalContribution } from '../../speech/browser/speechAccessibilitySignal.js';` |

#### `vscode/src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts` · U-N / T-V+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { AccessibilityVoiceSettingId, ISpeechService, SPEECH_LANGUAGES } from '../../speech/common/speechService.js';` |

#### `vscode/src/vs/workbench/contrib/accessibility/browser/accessibleView.ts` · U-N / T-V+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 48 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatCodeBlockContextProviderService } from '../../chat/browser/chat.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/codeBlockPart.js` | `import { ICodeBlockActionContext } from '../../chat/browser/widget/chatContentParts/codeBlockPart.js';` |

#### `vscode/src/vs/workbench/contrib/accessibility/browser/editorAccessibilityHelp.ts` · U-N / T-V+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 17 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { HasSpeechProvider } from '../../speech/common/speechService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingEditorContextKeys.js` | `import { ctxHasEditorModification, ctxHasRequestInProgress } from '../../chat/browser/chatEditing/chatEditingEditorContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../mcp/common/mcpTypes.js';` |

#### `vscode/src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../chat/common/actions/chatContextKeys.js';` |
| 21 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpService } from '../../../mcp/common/mcpTypes.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/common/browserView.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 62 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../platform/networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../chat/common/constants.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditorInput.js` | `import { ChatEditorInput } from '../../chat/browser/widgetHosts/editor/chatEditorInput.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../chat/browser/chat.js';` |
| 39 | `vscode/src/vs/platform/agentHost/common/copilotHome.js` | `import { getCopilotRootPaths } from '../../../../platform/agentHost/common/copilotHome.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { localChatSessionType } from '../../chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../chat/browser/chat.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../chat/common/chatService/chatService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../chat/common/attachments/chatVariableEntries.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../chat/common/actions/chatContextKeys.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatDynamicVariables.js` | `import { ChatDynamicVariableModel } from '../../../chat/browser/attachments/chatDynamicVariables.js';` |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariables.js` | `import { toAttachedContextDynamicVariable } from '../../../chat/common/attachments/chatVariables.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds, shouldUnlockChatPetIntegratedBrowserShare } from '../../../chat/browser/chatPetAchievements.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../chat/browser/chatPetService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/features/browserWelcomeFeature.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/browserToolHelpers.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../../platform/networkFilter/common/networkFilterService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IToolInvocation, IToolResult } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../../platform/networkFilter/common/networkFilterService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.js` | `import { IChatContextService } from '../../../chat/browser/contextContrib/chatContextService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../chat/common/chatService/chatService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService, ToolDataSource, ToolSet } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/clickBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/dragElementTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/handleDialogBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/hoverElementTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/listBrowserPagesTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../../platform/networkFilter/common/networkFilterService.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { CountTokensCallback, IToolData, IToolImpl, IToolInvocation, IToolResult, ToolDataSource, ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/navigateBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |
| 13 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../../platform/networkFilter/common/networkFilterService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { IAgentNetworkFilterService } from '../../../../../platform/networkFilter/common/networkFilterService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatQuestion, IChatQuestionAnswers, IChatService, IChatSingleSelectAnswer } from '../../../chat/common/chatService/chatService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel } from '../../../chat/common/constants.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatQuestionCarouselData.js` | `import { ChatQuestionCarouselData } from '../../../chat/common/model/chatProgressTypes/chatQuestionCarouselData.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatRequestModel } from '../../../chat/common/model/chatModel.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserToolNonAgentic.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/readBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/runPlaywrightCodeTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/screenshotBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/typeBrowserTool.ts` · D-B / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ToolDataSource, type CountTokensCallback, type IPreparedToolInvocation, type IToolData, type IToolImpl, type IToolInvocation, type IToolInvocationPreparationContext, type IToolResult, type ToolProgress } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/codeEditor/browser/dictation/editorDictation.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { HasSpeechProvider, ISpeechService, SpeechToTextInProgress, SpeechToTextStatus } from '../../../speech/common/speechService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../chat/common/actions/chatContextKeys.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, IChatSpeechToTextService } from '../../../chat/browser/speechToText/chatSpeechToTextService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationSession.js` | `import { activeDictationEditor, isDictating, startDictation, stopDictation } from '../../../chat/browser/speechToText/dictationSession.js';` |

#### `vscode/src/vs/workbench/contrib/codeEditor/browser/emptyTextEditorHint/emptyTextEditorHint.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../chat/common/participants/chatAgents.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../chat/common/constants.js';` |
| 32 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSessionService } from '../../../inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { ChatOutline, IChatWidget, IChatWidgetService } from '../../../chat/browser/chat.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { ISymbolVariableEntry } from '../../../chat/common/attachments/chatVariableEntries.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { isRequestVM } from '../../../chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/workbench/contrib/debug/browser/debugChatIntegration.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../chat/browser/chat.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { ChatContextPick, IChatContextPicker, IChatContextPickerItem, IChatContextPickService } from '../../chat/browser/attachments/chatContextPickService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestFileEntry, IChatRequestVariableEntry, IDebugVariableEntry } from '../../chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/workbench/contrib/debug/browser/debugCommands.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/debug/browser/debugEditorActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/editTelemetry/browser/editTelemetry.contribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/agentHostSchema.js` | `import { AgentHostEditTelemetryEnabledConfigKey } from '../../../../platform/agentHost/common/agentHostSchema.js';` |

#### `vscode/src/vs/workbench/contrib/editTelemetry/browser/editTelemetryContribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/common/actions.js` | `import { ActionType } from '../../../../../platform/agentHost/common/state/protocol/common/actions.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { ToolResultContentType } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/fileEditAttribution.js` | `import { buildCancelEditAttributionResource, buildCommitEditAttributionResource, buildPrepareEditAttributionResource, createFileEditContentDigest, getFileEditAttributionMarker, IEditAttributionCoverageGapAcknowledgement, IEditAttributionFlushResult, IPreparedEditAttributionFlush, ITrackedFileEditAttributionMarker } from '../../../../../platform/agentHost/common/fileEditAttribution.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |

#### `vscode/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 65 | `vscode/src/vs/workbench/contrib/chat/common/plugins/pluginInstallService.js` | `import { IPluginInstallService } from '../../chat/common/plugins/pluginInstallService.js';` |
| 66 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/extensions/browser/extensionsActions.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/contrib/extensions/common/installExtensionsTool.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { CountTokensCallback, IPreparedToolInvocation, IToolData, IToolImpl, IToolInvocation, IToolInvocationPreparationContext, IToolResult, ToolDataSource, ToolProgress } from '../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/extensions/common/searchExtensionsTool.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { CountTokensCallback, IToolData, IToolImpl, IToolInvocation, IToolResult, ToolDataSource, ToolProgress } from '../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/inlineCompletions/browser/inlineCompletionLanguageStatusBarContribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/interactive/browser/interactive.contribution.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 63 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../inlineChat/browser/inlineChatController.js';` |

#### `vscode/src/vs/workbench/contrib/interactive/browser/interactiveEditor.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 67 | `vscode/src/vs/workbench/contrib/inlineChat/common/inlineChat.js` | `import { INLINE_CHAT_ID } from '../../inlineChat/common/inlineChat.js';` |

#### `vscode/src/vs/workbench/contrib/issue/electron-browser/issueReporterEditorPane.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 38 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ChatMessageRole, ILanguageModelsService, getTextResponseFromStream } from '../../chat/common/languageModels.js';` |

#### `vscode/src/vs/workbench/contrib/markers/browser/markersChatContext.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickerItem, IChatContextPickerPickItem, IChatContextPickService, IChatContextPicker, picksWithPromiseFn } from '../../chat/browser/attachments/chatContextPickService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IDiagnosticVariableEntryFilterData } from '../../chat/common/attachments/chatVariableEntries.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../chat/browser/chat.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/cellDiagnostics/cellDiagnosticEditorContrib.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../../chat/common/participants/chatAgents.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/cellDiagnostics/cellDiagnosticsActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../../../inlineChat/browser/inlineChatController.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../chat/browser/chat.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/cellDiagnostics/diagnosticCellStatusBarContrib.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../../chat/common/participants/chatAgents.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/chat/notebookChatUtils.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { INotebookOutputVariableEntry } from '../../../../chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../../chat/common/participants/chatAgents.js';` |
| 12 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSessionService } from '../../../../inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/contrib/navigation/arrow.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../../../inlineChat/browser/inlineChatController.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/controller/chat/cellChatActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/inlineChat/common/inlineChat.js` | `import { CTX_INLINE_CHAT_REQUEST_IN_PROGRESS, CTX_INLINE_CHAT_VISIBLE } from '../../../../inlineChat/common/inlineChat.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../chat/common/actions/chatContextKeys.js';` |
| 26 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../../../inlineChat/browser/inlineChatController.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/controller/chat/notebook.chat.contribution.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../chat/browser/chat.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPicker, IChatContextPickerItem, IChatContextPickerPickItem, IChatContextPickService } from '../../../../chat/browser/attachments/chatContextPickService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatDynamicVariables.js` | `import { ChatDynamicVariableModel } from '../../../../chat/browser/attachments/chatDynamicVariables.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/chatInputCompletionUtils.js` | `import { computeCompletionRanges } from '../../../../chat/browser/widget/input/editor/chatInputCompletionUtils.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../../chat/common/participants/chatAgents.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../chat/common/actions/chatContextKeys.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/requestParser/chatParserTypes.js` | `import { chatVariableLeader } from '../../../../chat/common/requestParser/chatParserTypes.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/controller/editActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../../inlineChat/browser/inlineChatController.js';` |
| 30 | `vscode/src/vs/workbench/contrib/inlineChat/common/inlineChat.js` | `import { CTX_INLINE_CHAT_FOCUSED } from '../../../inlineChat/common/inlineChat.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/controller/executeActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/inlineChat/common/inlineChat.js` | `import { CTX_INLINE_CHAT_FOCUSED } from '../../../inlineChat/common/inlineChat.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalModelRefFactory.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IModifiedFileEntry } from '../../../../chat/common/editing/chatEditingService.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/diff/notebookDiffActions.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingEditorContextKeys.js` | `import { ctxHasEditorModification, ctxHasRequestInProgress } from '../../../chat/browser/chatEditing/chatEditingEditorContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/viewModel/baseCellViewModel.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 28 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSessionService } from '../../../inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSessionService } from '../../../inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.js` | `import { IInlineChatSessionService } from '../../../inlineChat/browser/inlineChatSessionService.js';` |

#### `vscode/src/vs/workbench/contrib/preferences/browser/preferencesRenderers.ts` · U-N / T-P+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 49 | `vscode/src/vs/workbench/contrib/mcp/common/mcpConfiguration.js` | `import { mcpConfigurationSection } from '../../mcp/common/mcpConfiguration.js';` |
| 50 | `vscode/src/vs/workbench/contrib/mcp/common/mcpCommandIds.js` | `import { McpCommandIds } from '../../mcp/common/mcpCommandIds.js';` |

#### `vscode/src/vs/workbench/contrib/preferences/browser/preferencesSearch.ts` · U-N / T-P+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.js` | `import { IAiSettingsSearchService } from '../../../services/aiSettingsSearch/common/aiSettingsSearch.js';` |

#### `vscode/src/vs/workbench/contrib/preferences/browser/settingsEditor2.ts` · U-N / T-P+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 54 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/preferences/browser/settingsLayout.ts` · U-N / T-P+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/contrib/preferences/common/preferences.ts` · U-N / T-P+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/quickaccess/browser/commandsQuickAccess.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 33 | `vscode/src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.js` | `import { CommandInformationResult, IAiRelatedInformationService, RelatedInformationType } from '../../../services/aiRelatedInformation/common/aiRelatedInformation.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_OPEN_ACTION_ID } from '../../chat/browser/actions/chatActions.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatQuickInputActions.js` | `import { ASK_QUICK_QUESTION_ACTION_ID } from '../../chat/browser/actions/chatQuickInputActions.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../chat/common/participants/chatAgents.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts` · D-O / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 40 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatController.js` | `import { InlineChatController } from '../../inlineChat/browser/inlineChatController.js';` |

#### `vscode/src/vs/workbench/contrib/scm/browser/quickDiffModel.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService, ModifiedFileEntryState } from '../../chat/common/editing/chatEditingService.js';` |

#### `vscode/src/vs/workbench/contrib/scm/browser/scm.contribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_SETUP_SUPPORT_ANONYMOUS_ACTION_ID } from '../../chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../chat/browser/chat.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickerItem, IChatContextPickerPickItem, IChatContextPickService, picksWithPromiseFn } from '../../chat/browser/attachments/chatContextPickService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { ISCMHistoryItemChangeVariableEntry, ISCMHistoryItemVariableEntry } from '../../chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/workbench/contrib/scm/browser/scmInput.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 71 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 73 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_SETUP_SUPPORT_ANONYMOUS_ACTION_ID } from '../../chat/browser/actions/chatActions.js';` |

#### `vscode/src/vs/workbench/contrib/search/browser/anythingQuickAccess.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 57 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatQuickInputActions.js` | `import { ASK_QUICK_QUESTION_ACTION_ID } from '../../chat/browser/actions/chatQuickInputActions.js';` |
| 58 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService, IQuickChatService } from '../../chat/browser/chat.js';` |

#### `vscode/src/vs/workbench/contrib/search/browser/searchChatContext.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickService } from '../../chat/browser/attachments/chatContextPickService.js';` |

#### `vscode/src/vs/workbench/contrib/search/browser/symbolsQuickAccess.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../chat/browser/chat.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { ISymbolVariableEntry } from '../../chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../chat/common/constants.js';` |
| 88 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_OPEN_ACTION_ID } from '../../chat/browser/actions/chatActions.js';` |
| 89 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../chat/common/participants/chatAgents.js';` |
| 90 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/workbench/contrib/tasks/electron-browser/taskService.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../chat/common/chatService/chatService.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../chat/common/participants/chatAgents.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/agentHostOutputChannel.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../platform/agentHost/common/agentService.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { TerminalLifecycleStatus, type TerminalState } from '../../../../platform/agentHost/common/state/protocol/state.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { StateComponents } from '../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../platform/agentHost/common/agentService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, fromAgentHostUri } from '../../../../platform/agentHost/common/agentHostUri.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, ActionEnvelope } from '../../../../platform/agentHost/common/state/sessionActions.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { TerminalClaimKind, type TerminalContentPart, type TerminalState } from '../../../../platform/agentHost/common/state/protocol/state.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { StateComponents } from '../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../platform/agentHost/common/agentService.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import type { IChatTerminalToolInvocationData } from '../../chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/terminal.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 38 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import type { ToolConfirmationAction } from '../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/terminalMenus.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { HasSpeechProvider } from '../../speech/common/speechService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/browser/xterm/decorationAddon.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickService } from '../../../chat/browser/attachments/chatContextPickService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../chat/browser/chat.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatContext.js` | `import { TerminalContext } from '../../../chat/browser/actions/chatContext.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/terminal.all.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/terminal.chatAgentTools.contribution.js` | `import '../terminalContrib/chatAgentTools/browser/terminal.chatAgentTools.contribution.js';` |
| 22 | `vscode/src/vs/workbench/contrib/terminalContrib/chat/browser/terminal.chat.contribution.js` | `import '../terminalContrib/chat/browser/terminal.chat.contribution.js';` |
| 39 | `vscode/src/vs/workbench/contrib/terminalContrib/voice/browser/terminal.voice.contribution.js` | `import '../terminalContrib/voice/browser/terminal.voice.contribution.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/terminalContribChatExports.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/terminalContrib/chat/browser/terminalChat.js` | `export { MENU_CHAT_TERMINAL_TOOL_PROGRESS, TerminalChatContextKeys } from '../terminalContrib/chat/browser/terminalChat.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/terminalContribExports.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/terminalContrib/chat/browser/terminalChat.js` | `import { TerminalChatCommandId, TerminalChatContextKeyStrings } from '../terminalContrib/chat/browser/terminalChat.js';` |
| 12 | `vscode/src/vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalChatAgentToolsConfiguration.js` | `import { terminalChatAgentToolsConfiguration, TerminalChatAgentToolsSettingId } from '../terminalContrib/chatAgentTools/common/terminalChatAgentToolsConfiguration.js';` |
| 13 | `vscode/src/vs/platform/sandbox/common/settings.js` | `import { AgentSandboxSettingId } from '../../../platform/sandbox/common/settings.js';` |

#### `vscode/src/vs/workbench/contrib/terminalContrib/accessibility/browser/terminalAccessibilityHelp.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/workbench/contrib/speech/common/speechService.js` | `import { HasSpeechProvider } from '../../../speech/common/speechService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/workbench/contrib/terminalContrib/inlineHint/browser/terminal.initialHint.contribution.ts` · U-N / T-N+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgent, IChatAgentService } from '../../../chat/common/participants/chatAgents.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../chat/common/constants.js';` |
| 32 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/testing/common/testingChatAgentTool.ts` · D-X / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { CountTokensCallback, ILanguageModelToolsService, IPreparedToolInvocation, IToolData, IToolImpl, IToolInvocation, IToolInvocationPreparationContext, IToolResult, ToolDataSource, ToolProgress, } from '../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 35 | `vscode/src/vs/workbench/contrib/welcomeAgentSessions/browser/agentSessionsWelcome.js` | `import { AgentSessionsWelcomePage } from '../../welcomeAgentSessions/browser/agentSessionsWelcome.js';` |
| 36 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 72 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsBanner.js` | `import { canShowAgentsBanner, createAgentsBanner } from '../../chat/browser/agentSessions/agentSessionsBanner.js';` |
| 73 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/assignment/common/assignmentFilters.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../platform/chat/common/chatSettings.js';` |
| 37 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlementService, IChatEntitlementService } from '../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 22 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/workspaces/common/workspaceTrust.ts` · U-N / T-E+T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME } from '../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/workbench/workbench.common.main.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 60 | `vscode/src/vs/platform/mcp/common/mcpResourceScannerService.js` | `import '../platform/mcp/common/mcpResourceScannerService.js';` |
| 74 | `vscode/src/vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.js` | `import './services/aiEmbeddingVector/common/aiEmbeddingVectorService.js';` |
| 75 | `vscode/src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService.js` | `import './services/aiRelatedInformation/common/aiRelatedInformationService.js';` |
| 76 | `vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearchService.js` | `import './services/aiSettingsSearch/common/aiSettingsSearchService.js';` |
| 138 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import './services/chat/common/chatEntitlementService.js';` |
| 139 | `vscode/src/vs/workbench/services/agentHost/common/agentHostResourceService.js` | `import './services/agentHost/common/agentHostResourceService.js';` |
| 140 | `vscode/src/vs/platform/agentHost/browser/agentHostConnectionsService.js` | `import '../platform/agentHost/browser/agentHostConnectionsService.js';` |
| 166 | `vscode/src/vs/platform/mcp/common/mcpManagement.js` | `import { IAllowedMcpServersService, IMcpGalleryService } from '../platform/mcp/common/mcpManagement.js';` |
| 167 | `vscode/src/vs/platform/mcp/common/mcpGalleryService.js` | `import { McpGalleryService } from '../platform/mcp/common/mcpGalleryService.js';` |
| 168 | `vscode/src/vs/platform/mcp/common/allowedMcpServersService.js` | `import { AllowedMcpServersService } from '../platform/mcp/common/allowedMcpServersService.js';` |
| 218 | `vscode/src/vs/workbench/contrib/speech/browser/speech.contribution.js` | `import './contrib/speech/browser/speech.contribution.js';` |
| 221 | `vscode/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.js` | `import './contrib/chat/browser/chat.shared.contribution.js';` |
| 222 | `vscode/src/vs/workbench/contrib/chat/browser/chat.contribution.js` | `import './contrib/chat/browser/chat.contribution.js';` |
| 223 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHost.contribution.js` | `import './contrib/chat/browser/agentSessions/agentHost/agentHost.contribution.js';` |
| 224 | `vscode/src/vs/workbench/contrib/chat/browser/chat.view.contribution.js` | `import './contrib/chat/browser/chat.view.contribution.js';` |
| 225 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChat.contribution.js` | `import './contrib/inlineChat/browser/inlineChat.contribution.js';` |
| 228 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution.js` | `import './contrib/agentsVoice/browser/agentsVoice.contribution.js';` |
| 229 | `vscode/src/vs/workbench/contrib/mcp/browser/mcp.contribution.js` | `import './contrib/mcp/browser/mcp.contribution.js';` |
| 230 | `vscode/src/vs/workbench/contrib/mcp/browser/mcp.view.contribution.js` | `import './contrib/mcp/browser/mcp.view.contribution.js';` |
| 231 | `vscode/src/vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution.js` | `import './contrib/chat/browser/chatSessions/chatSessions.contribution.js';` |
| 232 | `vscode/src/vs/workbench/contrib/chat/browser/contextContrib/chatContext.contribution.js` | `import './contrib/chat/browser/contextContrib/chatContext.contribution.js';` |

#### `vscode/src/vs/workbench/workbench.desktop.main.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 57 | `vscode/src/vs/workbench/services/mcp/electron-browser/mcpGalleryManifestService.js` | `import './services/mcp/electron-browser/mcpGalleryManifestService.js';` |
| 58 | `vscode/src/vs/workbench/services/mcp/electron-browser/mcpWorkbenchManagementService.js` | `import './services/mcp/electron-browser/mcpWorkbenchManagementService.js';` |
| 61 | `vscode/src/vs/workbench/services/localTranscription/electron-browser/localTranscriptionService.js` | `import './services/localTranscription/electron-browser/localTranscriptionService.js';` |
| 91 | `vscode/src/vs/platform/sandbox/electron-browser/sandboxHelperService.js` | `import '../platform/sandbox/electron-browser/sandboxHelperService.js';` |
| 92 | `vscode/src/vs/platform/webContentExtractor/electron-browser/webContentExtractorService.js` | `import '../platform/webContentExtractor/electron-browser/webContentExtractorService.js';` |
| 93 | `vscode/src/vs/workbench/services/agentHost/electron-browser/agentHostService.js` | `import './services/agentHost/electron-browser/agentHostService.js';` |
| 94 | `vscode/src/vs/platform/agentHost/electron-browser/remoteAgentHostService.js` | `import '../platform/agentHost/electron-browser/remoteAgentHostService.js';` |
| 179 | `vscode/src/vs/workbench/contrib/chat/electron-browser/chat.contribution.js` | `import './contrib/chat/electron-browser/chat.contribution.js';` |
| 188 | `vscode/src/vs/workbench/contrib/mcp/electron-browser/mcp.contribution.js` | `import './contrib/mcp/electron-browser/mcp.contribution.js';` |

#### `vscode/src/vs/workbench/workbench.web.main.ts` · U-R / T-C+T-R

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 46 | `vscode/src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.js` | `import './services/mcp/browser/mcpWorkbenchManagementService.js';` |
| 74 | `vscode/src/vs/workbench/services/localTranscription/browser/localTranscriptionService.js` | `import './services/localTranscription/browser/localTranscriptionService.js';` |
| 75 | `vscode/src/vs/platform/sandbox/browser/sandboxHelperService.js` | `import '../platform/sandbox/browser/sandboxHelperService.js';` |
| 101 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { IWebContentExtractorService, NullWebContentExtractorService, ISharedWebContentExtractorService, NullSharedWebContentExtractorService } from '../platform/webContentExtractor/common/webContentExtractor.js';` |
| 102 | `vscode/src/vs/platform/mcp/common/mcpGalleryManifest.js` | `import { IMcpGalleryManifestService } from '../platform/mcp/common/mcpGalleryManifest.js';` |
| 103 | `vscode/src/vs/workbench/services/mcp/browser/mcpGalleryManifestService.js` | `import { WorkbenchMcpGalleryManifestService } from './services/mcp/browser/mcpGalleryManifestService.js';` |
| 105 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../platform/agentHost/common/agentService.js';` |
| 106 | `vscode/src/vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.js` | `import { EditorRemoteAgentHostServiceClient } from './services/agentHost/browser/editorRemoteAgentHostServiceClient.js';` |
| 107 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, NullRemoteAgentHostService } from '../platform/agentHost/common/remoteAgentHostService.js';` |
| 108 | `vscode/src/vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js` | `import { BrowserAgentHostDebugLogsExportService, IAgentHostDebugLogsExportService } from './contrib/chat/browser/actions/exportAgentHostDebugLogsAction.js';` |
| 109 | `vscode/src/vs/workbench/services/agentHost/browser/webAgentHostEnablementService.js` | `import './services/agentHost/browser/webAgentHostEnablementService.js';` |

### 测试路径入边

#### `vscode/src/vs/platform/agentPlugins/test/common/pluginParsers.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/mcp/common/mcpPlatformTypes.js` | `import { McpServerType } from '../../../mcp/common/mcpPlatformTypes.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationType, McpServerStatus, type McpServerCustomization } from '../../../agentHost/common/state/protocol/state.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/protocol/mcpAppDefaults.js` | `import { DEFAULT_MCP_APP } from '../../../agentHost/common/state/protocol/mcpAppDefaults.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { customizationId } from '../../../agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/platform/browserView/test/node/playwrightTab.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { AgentNetworkFilterService } from '../../../networkFilter/common/networkFilterService.js';` |
| 12 | `vscode/src/vs/platform/networkFilter/common/settings.js` | `import { AgentNetworkDomainSettingId } from '../../../networkFilter/common/settings.js';` |

#### `vscode/src/vs/sessions/contrib/accountMenu/test/browser/account.contribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/actions/chatActions.js` | `import { CHAT_SETUP_ACTION_ID } from '../../../../../workbench/contrib/chat/browser/actions/chatActions.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementIds } from '../../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |

#### `vscode/src/vs/sessions/contrib/accountMenu/test/browser/accountTitleBarState.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentEditorCommentsProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js` | `import { IPlanReviewFeedbackService } from '../../../../../workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackAttachment.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackEditorActions.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackItemsBackend.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { createAgentHostResourceUriMapper } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/meta/agentFeedbackAnnotations.js` | `import { FEEDBACK_ANNOTATION_META_KEY } from '../../../../../platform/agentHost/common/meta/agentFeedbackAnnotations.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, ClientAnnotationsAction } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { AnnotationsState, ComponentToState, StateComponents } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackReviewCommands.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { AgentFeedbackReviewCommandId } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService } from '../../../../../workbench/contrib/chat/common/editing/chatEditingService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService, IChatAcceptInputOptions, IChatWidgetViewModelChangeEvent } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IAgentFeedbackVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/automations/test/browser/automationDialog.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadata, ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/automations/test/browser/automationRunner.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationTarget, AutomationWorkspaceIsolation, IAutomationSchedule } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |

#### `vscode/src/vs/sessions/contrib/automations/test/browser/automationScheduler.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunDispatch, IAutomationRunner, IAutomationRunOperation } from '../../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationRunTrigger, AutomationTarget, IAutomationDescriptor, IAutomationSchedule } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |

#### `vscode/src/vs/sessions/contrib/automations/test/browser/automationService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationRunTrigger, AutomationTarget, AutomationWorkspaceIsolation, IAutomationRun, IAutomationSchedule } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |

#### `vscode/src/vs/sessions/contrib/automations/test/browser/automationTools.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/state/protocol/channels-chat/state.js` | `import { ConfirmationOptionKind } from '../../../../../platform/agentHost/common/state/protocol/channels-chat/state.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { AutomationRunTrigger, AutomationTarget, IAutomationDescriptor, IAutomationRun, IAutomationSchedule } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunDispatch, IAutomationRunner, IAutomationRunOperation } from '../../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService, ICreateAutomationOptions, IGuardedAutomationUpdateResult, IUpdateAutomationOptions } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext, CHAT_AUTOMATIONS_ENABLED_SETTING } from '../../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IToolImpl, IToolInvocation, IToolResult, ToolProgress } from '../../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/sessions/contrib/changes/test/browser/changesEditorLabels.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_LABEL_FORMATTER, toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/sessions/contrib/changes/test/browser/changesetReviewActions.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/agentHostInputCompletions.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry, toAgentHostCompletionVariableEntry, AgentHostCompletionReferenceKind } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/btwSlashCommandContribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { toPasteVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel, IChatRequestModel } from '../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatSlashCommands.js` | `import { IChatSlashCallback, IChatSlashCommandService, IChatSlashData } from '../../../../../workbench/contrib/chat/common/participants/chatSlashCommands.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/chatPetAchievements.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAchievementId, ChatPetAchievementIds } from '../../../../../workbench/contrib/chat/browser/chatPetAchievements.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../../workbench/contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/chatView.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { CHAT_WIDGET_VIEW_STATE_CACHE_LIMIT } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js` | `import { ChatInputNoticeHost, ChatInputNoticeLane } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeHost.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { isChatInputStackSlotShowing } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestTranscriptContextVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/customizationHarnessService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/externalSessionBanner.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatExternalSessionsMode } from '../../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/externalSessionBanner.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatExternalSessionsMode } from '../../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/modelPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/newChatInput.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, IChatSpeechToTextService } from '../../../../../workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js` | `import { IVoiceInputModeService, VoiceInputMode } from '../../../../../workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js` | `import { ITtsPlaybackService } from '../../../../../workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.js` | `import { IMicCaptureService } from '../../../../../workbench/contrib/chat/browser/voiceClient/micCaptureService.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.js` | `import { ChatInputNoticeVariant, ChatInputNoticeWidget } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackClass, chatInputStackSlotClass, ChatInputStackSlot, setChatInputStackSlot } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputStack.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/newChatInputPaste.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatPasteTarget, IChatPasteTargetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/chatPasteProviders.js` | `import { PasteTextProvider, pastedTextArtifactDefaultMinLength } from '../../../../../workbench/contrib/chat/browser/widget/input/editor/chatPasteProviders.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry, isPastedTextArtifact } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/newChatVoiceTarget.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatViewModel } from '../../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/newChatWidget.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/chatTipService.js` | `import { IChatTipService } from '../../../../../workbench/contrib/chat/browser/chatTipService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, IChatSpeechToTextService } from '../../../../../workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.js` | `import { IMicCaptureService } from '../../../../../workbench/contrib/chat/browser/voiceClient/micCaptureService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js` | `import { ITtsPlaybackService } from '../../../../../workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js` | `import { IVoiceInputModeService, VoiceInputMode } from '../../../../../workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/openSessionLinkOpener.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/openSessionLink.js` | `import { buildOpenSessionLinkUri } from '../../../../../platform/agentHost/common/openSessionLink.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/responseSelectionResolver.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel } from '../../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/responseSelectionSideChatController.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel } from '../../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionChatInputToolbar.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { CHAT_TURN_ARTIFACT_PILL_ID, CHAT_TURN_CHANGES_PILL_ID } from '../../../../../workbench/contrib/chat/browser/widget/chatTurnPills.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionModelSelection.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/chatSelectedModel.js` | `import { getSelectedModelStorageKey, storeSelectedModel } from '../../../../../workbench/contrib/chat/common/chatSelectedModel.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration } from '../../../../../workbench/contrib/chat/common/constants.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/modelSelection.js` | `import { isInConversationModelChoice, resolveModelIdentifier } from '../../../../../workbench/contrib/chat/common/modelSelection.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/test/browser/widget/input/modelSelectionConformance.js` | `import { conformanceInputs, IModelSelectionConformanceScenario, ModelSelectionConformanceModel, modelSelectionConformanceScenarios } from '../../../../../workbench/contrib/chat/test/browser/widget/input/modelSelectionConformance.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionTurnChanges.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionTypePicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotificationService } from '../../../../../workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 25 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionWorkspacePicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostConnectionStatus, IRemoteAgentHostService, RemoteAgentHostsEnabledSettingId } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sessionsOpenerParticipant.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsOpener.js` | `import { openSessionByResource } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsOpener.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/sideChatProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { ChatTreeItem, IChatWidget, IChatWidgetService, IChatWidgetViewModelChangeEvent } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/chatSideChatService.js` | `import { IChatSideChatProvider, IChatSideChatService } from '../../../../../workbench/contrib/chat/common/chatSideChatService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel, IChatRequestModel } from '../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatRequestViewModel, IChatViewModel } from '../../../../../workbench/contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/sessions/contrib/chat/test/browser/voiceBridge.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../../workbench/contrib/chat/browser/voiceClient/voiceSessionController.js';` |

#### `vscode/src/vs/sessions/contrib/codeReview/test/browser/codeReviewService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange, IChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/contrib/github/test/browser/pullRequestPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { readSessionGitHubState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/onboardingTours/test/browser/newSessionViewTourTrigger.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService } from '../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHost/agentHostPermissionPickerDelegate.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult, SessionConfigPropertySchema } from '../../../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { getAgentHostCopilotSandboxSettingId } from '../../../../../../../platform/agentHost/common/agentService.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/copilotCliConfig.js` | `import { AgentHostCustomTerminalToolEnabledSettingId } from '../../../../../../../platform/agentHost/common/copilotCliConfig.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import type { RootConfigState } from '../../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel } from '../../../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHost/agentHostSessionConfigPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult, SessionConfigPropertySchema, SessionConfigValueItem } from '../../../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostAgentPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationType, type AgentCustomization } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/customAgents.js` | `import { agentHostAgentPickerStorageKey, resolveAgentHostAgent } from '../../../../../../platform/agentHost/common/customAgents.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostAgents.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationEnablementKind, CustomizationLoadStatus, CustomizationType, type AgentCustomization, type ClientPluginCustomization, type Customization } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/customAgents.js` | `import { getEffectiveAgents, getEffectiveClientAgents } from '../../../../../../platform/agentHost/common/customAgents.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostClaudePermissionModePicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ResolveSessionConfigResult } from '../../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostSessionChangesets.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange2 } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostSessionCustomizations.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { CustomizationType, ResponsePartKind, ToolCallContributorKind, ToolCallStatus, type Customization, type ResponsePart } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostSessionFiles.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { FileEditKind, ResponsePartKind, ToolCallConfirmationReason, ToolCallStatus, ToolResultContentType, type ResponsePart, } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostSettingsFileSystemProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import type { RootConfigState } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentSessionSettingsFileSystemProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { ResolveSessionConfigResult } from '../../../../../../platform/agentHost/common/state/protocol/commands.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/localAgentHostSessionsProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession, type IAgentCreateChatOptions, type IAgentCreateSessionConfig, type IAgentSessionMetadata } from '../../../../../../platform/agentHost/common/agent.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AgentHostCodexAgentEnabledSettingId, IAgentHostService } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 20 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import type { IAgentSubscription } from '../../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { ResolveSessionConfigResult } from '../../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 22 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { ChatInteractivity as ProtocolChatInteractivity, ChatOriginKind as ProtocolChatOriginKind, CustomizationEnablementKind, CustomizationLoadStatus, CustomizationType, McpServerStatus, MessageKind, SessionLifecycle, type AgentCustomization, type AgentInfo, type ChangesSummary, type Customization, type RootState, type SessionActiveClient, type SessionConfigState, type SessionState, type SessionSummary } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 23 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { buildChatUri, buildDefaultChatUri, buildSubagentChatUri, ChangesetStatus, ResponsePartKind, SessionSourceControlOutcome, SessionStatus as ProtocolSessionStatus, StateComponents, ToolCallConfirmationReason, ToolCallStatus, ToolResultContentType, TurnState, withSessionEhcliAdoptable, withSessionGitHubState, withSessionGitState, withSessionMultiRootMetadata, withSessionSourceControlState, withSessionWorkspaceless, type ChangesetState, type ChatState, type ChatSummary } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |
| 24 | `vscode/src/vs/platform/agentHost/common/sessionArtifacts.js` | `import { SessionArtifactType, withSessionArtifacts } from '../../../../../../platform/agentHost/common/sessionArtifacts.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, NotificationType, type ActionEnvelope, type IRootConfigChangedAction, type ChatAction, type SessionAction, type TerminalAction, type INotification, type ClientAnnotationsAction } from '../../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/sessionConfigKeys.js` | `import { SessionConfigKey } from '../../../../../../platform/agentHost/common/sessionConfigKeys.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../../workbench/contrib/chat/browser/chat.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService, type ChatSendResult, type IChatModelReference, type IChatSendRequestOptions } from '../../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService, isIChatSessionFileChange2 } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatModeKind } from '../../../../../../workbench/contrib/chat/common/constants.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService, type ILanguageModelChatMetadata } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import type { IChatModel, IChatModelInputState, IInputModel } from '../../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentCustomizationScope, IAgentHostActiveClientService } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/openAgentHostStateFile.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 11 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import type { IAgentConnection } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostConnectionInfo, RemoteAgentHostConnectionStatus } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/actions/openAgentHostStateFileAction.js` | `import { openAgentHostStateFile, OpenAgentHostStateFileAction as WorkbenchOpenAgentHostStateFileAction } from '../../../../../../workbench/contrib/chat/browser/actions/openAgentHostStateFileAction.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/copilotCliEventsUri.js` | `import { buildLocalCopilotLogsUri, buildRemoteCopilotLogsUri, getCopilotCliSessionRawId, resolveEventsUri } from '../../../../../../workbench/contrib/chat/browser/copilotCliEventsUri.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/openSubagentChat.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/sessionGitHubInfo.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { SessionMeta } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/sessionTypeAuthRequirement.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { GITHUB_COPILOT_PROTECTED_RESOURCE } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 9 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import type { AgentInfo } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |
| 10 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import type { ProtectedResourceMetadata } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSignedOutModelsNotification.js` | `import { areLocalModelsLoaded, getSignedOutModelsNotificationState, SignedOutModelsNotificationState } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSignedOutModelsNotification.js';` |

#### `vscode/src/vs/sessions/contrib/providers/agentHost/test/electron-browser/localAgentHostLifecycle.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../../../../workbench/services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/test/browser/copilotChatSessionsProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { IAgentSession, IAgentSessionsModel } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService, ChatSendResult, IChatSendRequestData, IChatSendRequestOptions } from '../../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { ChatSessionStatus, IChatSessionProviderOptionGroup, IChatSessionsService, SessionType } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../../workbench/contrib/chat/browser/chat.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadata, ILanguageModelsService } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatResponseModel } from '../../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentData } from '../../../../../../workbench/contrib/chat/common/participants/chatAgents.js';` |
| 39 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId, type ICloudSandboxCreateSessionRequest } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 40 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostsEnabledSettingId } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatPermissionLevel } from '../../../../../../workbench/contrib/chat/common/constants.js';` |
| 50 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../../platform/agentHost/common/agentHostEnablementService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/test/browser/modePicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { IChatModeService, IChatModes, ChatMode, CustomChatMode } from '../../../../../../workbench/contrib/chat/common/chatModes.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel, IChatRequestModel } from '../../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { PromptsStorage } from '../../../../../../workbench/contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { Target } from '../../../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/test/browser/permissionPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatPermissionLevel } from '../../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/test/browser/sandboxPicker.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { RemoteAgentHostsEnabledSettingId } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/cloudSandboxAgentHostContribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession } from '../../../../../../platform/agentHost/common/agent.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentSessionMetadata } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId, ICloudSandboxAgentHostService, ICloudSandboxApiService, cloudSandboxAddress, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveredSession, type ICloudSandboxDiscoveryResult, } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostsEnabledSettingId } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/cloudSandboxApiService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CLOUD_SANDBOX_AGENT_SLUG, CLOUD_SANDBOX_ON_DEMAND_ENVIRONMENT_ID } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/cloudSandboxCredentialRefresh.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxEnabledSettingId, ICloudSandboxAgentHostService, ICloudSandboxApiService, cloudSandboxAddress, type ICloudSandboxConnectOptions, type ICloudSandboxCreateSessionRequest, type ICloudSandboxCreatedSession, type ICloudSandboxDiscoveredSession, type ICloudSandboxDiscoveryResult, } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/cloudSandboxTelemetry.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/platform/agentHost/common/cloudSandboxAgentHost.js` | `import { CloudSandboxRequestError } from '../../../../../../platform/agentHost/common/cloudSandboxAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/remoteAgentHost.contribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js` | `import { AgentHostAuthenticationRecovery, AgentHostAuthTokenCache } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { type IAgentConnection } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostSSHConnection, RemoteAgentHostEntryType } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/sshRemoteAgentHost.js` | `import { SSHHostKeyDeniedError } from '../../../../../../platform/agentHost/common/sshRemoteAgentHost.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { AuthRequiredReason, NotificationType, type INotification } from '../../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { type ProtectedResourceMetadata } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/remoteAgentHostCustomizationHarness.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { type IAgentConnection } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, isSessionAction, type ActionEnvelope, type INotification, type StateAction } from '../../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationEnablementKind, CustomizationLoadStatus, CustomizationType, type AgentCustomization, type AgentInfo, type Customization, type RootState, type SessionState } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { StateComponents, type ComponentToState } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionReducers.js` | `import { sessionReducer } from '../../../../../../platform/agentHost/common/state/sessionReducers.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { type IAgentSubscription } from '../../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../../../workbench/contrib/chat/common/promptSyntax/promptTypes.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 26 | `vscode/src/vs/workbench/services/agentHost/common/agentHostFileSystemService.js` | `import { SYNCED_CUSTOMIZATION_SCHEME } from '../../../../../../workbench/services/agentHost/common/agentHostFileSystemService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { CustomizationHarnessServiceBase, IHarnessDescriptor } from '../../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/test/common/promptSyntax/service/mockPromptsService.js` | `import { MockPromptsService } from '../../../../../../workbench/contrib/chat/test/common/promptSyntax/service/mockPromptsService.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js` | `import { IAgentHostCustomizationService } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js` | `import { AgentCustomizationItemProvider } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentCustomizationItemProvider.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/remoteAgentHostSessionsProvider.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/platform/agentHost/common/agent.js` | `import { AgentSession, type IAgentSessionMetadata } from '../../../../../../platform/agentHost/common/agent.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { type IAgentConnection } from '../../../../../../platform/agentHost/common/agentService.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { ResolveSessionConfigResult } from '../../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { MessageKind, SessionLifecycle, type AgentInfo, type RootState, type SessionConfigState, type SessionState } from '../../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 20 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionType, NotificationType, type ActionEnvelope, type IRootConfigChangedAction, type SessionAction, type TerminalAction, type INotification, type ClientAnnotationsAction } from '../../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { buildDefaultChatUri, SessionStatus as ProtocolSessionStatus, StateComponents } from '../../../../../../platform/agentHost/common/state/sessionState.js';` |
| 22 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import type { IAgentSubscription } from '../../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../../../workbench/contrib/chat/browser/chat.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService, type ChatSendResult, type IChatSendRequestOptions } from '../../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |

#### `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/test/browser/remoteHostOptions.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../../../platform/agentHost/common/remoteAgentHostService.js';` |
| 12 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreference.js` | `import { IRemoteAgentHostLocationPreferenceService, RemoteAgentHostLocationPreference } from '../../../../../../platform/agentHost/common/remoteAgentHostLocationPreference.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/aiCustomizationShortcutsWidget.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpServer, IMcpService } from '../../../../../workbench/contrib/mcp/common/mcpTypes.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.js` | `import { IAgentPluginService } from '../../../../../workbench/contrib/chat/common/plugins/agentPluginService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService, IToolSet } from '../../../../../workbench/contrib/chat/common/tools/languageModelToolsService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js` | `import { IAgentHostToolSetEnablementService, IToolEnablementState } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js` | `import { IAICustomizationItemsModel, ItemsModelSection } from '../../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService, IHarnessDescriptor } from '../../../../../workbench/contrib/chat/common/customizationHarnessService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType } from '../../../../../workbench/contrib/chat/common/model/chatUri.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../../../../workbench/contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.js` | `import { IAICustomizationListItem } from '../../../../../workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/automationsView.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor, IAutomationRun } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogService } from '../../../../../workbench/contrib/chat/common/automations/automationDialogService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext } from '../../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunner } from '../../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../../workbench/contrib/chat/common/voicePlaybackService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/automationsView.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationDescriptor, IAutomationRun, IAutomationSchedule, AutomationRunTrigger, AutomationTarget } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogResult, IAutomationDialogService, IShowAutomationDialogOptions } from '../../../../../workbench/contrib/chat/common/automations/automationDialogService.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationsEnabled.js` | `import { ChatAutomationsEnabledContext } from '../../../../../workbench/contrib/chat/common/automations/automationsEnabled.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunDispatch, IAutomationRunner, IAutomationRunOperation } from '../../../../../workbench/contrib/chat/common/automations/automationRunner.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { AutomationMutationGuard, IAutomationRunClaim, IAutomationService, ICreateAutomationOptions, IGuardedAutomationUpdateResult, IUpdateAutomationOptions, IUpdateAutomationRunOptions } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../../workbench/contrib/chat/common/voicePlaybackService.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/blockedSessionsIndicatorModel.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalKind, AgentSessionApprovalModel, agentSessionApprovalId, IAgentSessionApprovalInfo } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsList.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/automations/automation.js` | `import { IAutomationRun } from '../../../../../workbench/contrib/chat/common/automations/automation.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../../workbench/contrib/chat/common/automations/automationService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsListTestUtils.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../../workbench/contrib/chat/common/voicePlaybackService.js';` |

#### `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsWindowNotifier.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ChatNotificationMode } from '../../../../../workbench/contrib/chat/common/constants.js';` |

#### `vscode/src/vs/sessions/contrib/terminal/test/browser/agentHostSessionTaskRunner.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME, toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/sessions/contrib/terminal/test/browser/sessionsTerminalContribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentSessions.js';` |

#### `vscode/src/vs/sessions/contrib/tunnelHost/test/browser/webTunnelHostService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/platform/agentHost/common/tunnelAgentHost.js` | `import { isTunnelHosted } from '../../../../../platform/agentHost/common/tunnelAgentHost.js';` |

#### `vscode/src/vs/sessions/contrib/tunnelHost/test/electron-browser/tunnelHost.contribution.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../../workbench/contrib/chat/common/actions/chatContextKeys.js';` |

#### `vscode/src/vs/sessions/services/agentHost/test/browser/agentHostCustomizationService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { CustomizationType, McpServerStatus, type Customization, type McpServerCustomization, type PluginCustomization } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js` | `import { IAgentHostActiveClientService } from '../../../../../workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.js';` |

#### `vscode/src/vs/sessions/services/agentHostFilter/test/browser/agentHostFilterService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostService, RemoteAgentHostConnectionStatus } from '../../../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/services/sessions/test/browser/sessionsManagementService.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { ChatViewPaneTarget, IChatWidget, IChatWidgetService } from '../../../../../workbench/contrib/chat/browser/chat.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IChatRequestVariableEntry } from '../../../../../workbench/contrib/chat/common/attachments/chatVariableEntries.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatModelReference, IChatRequestSubmittedEvent, IChatService } from '../../../../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel } from '../../../../../workbench/contrib/chat/common/model/chatModel.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditor.js` | `import { IChatEditorOptions } from '../../../../../workbench/contrib/chat/browser/widgetHosts/editor/chatEditor.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.js` | `import { IChatWidgetHistoryService } from '../../../../../workbench/contrib/chat/common/widget/chatWidgetHistoryService.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../../workbench/contrib/chat/common/languageModels.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/browser/copilotCliEventsUri.js` | `import { COPILOT_CLI_EH_SCHEME, COPILOT_CLI_LOCAL_AH_SCHEME } from '../../../../../workbench/contrib/chat/browser/copilotCliEventsUri.js';` |

#### `vscode/src/vs/sessions/services/sessions/test/common/session.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange, IChatSessionFileChange2 } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/services/sessions/test/common/sessionContextKeys.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionFileChange } from '../../../../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/sessions/test/browser/resolveRemoteAuthority.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/platform/agentHost/common/remoteAgentHostService.js` | `import { IRemoteAgentHostEntry, IRemoteAgentHostService, getEntryAddress, RemoteAgentHostEntryType } from '../../../platform/agentHost/common/remoteAgentHostService.js';` |

#### `vscode/src/vs/sessions/test/web.test.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService, IChatSentiment } from '../../workbench/services/chat/common/chatEntitlementService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService, IChatAgentData, IChatAgentImplementation } from '../../workbench/contrib/chat/common/participants/chatAgents.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../workbench/contrib/chat/common/constants.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatProgress } from '../../workbench/contrib/chat/common/chatService/chatService.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService, IChatSessionItem, IChatSessionFileChange, ChatSessionStatus, IChatSessionHistoryItem, IChatSessionItemsDelta } from '../../workbench/contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/workbench/api/test/browser/mainThreadChatAgents2.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../contrib/chat/browser/chat.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatProgress, IChatService } from '../../../contrib/chat/common/chatService/chatService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../contrib/chat/common/chatSessionsService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../contrib/chat/common/constants.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel } from '../../../contrib/chat/common/model/chatModel.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentImplementation, IChatAgentData, IChatAgentRequest, IChatAgentService } from '../../../contrib/chat/common/participants/chatAgents.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.js` | `import { IAgentPluginService } from '../../../contrib/chat/common/plugins/agentPluginService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../contrib/chat/common/customizationHarnessService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.js` | `import { MockChatService } from '../../../contrib/chat/test/common/chatService/mockChatService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/test/common/mockChatSessionsService.js` | `import { MockChatSessionsService } from '../../../contrib/chat/test/common/mockChatSessionsService.js';` |
| 37 | `vscode/src/vs/workbench/api/browser/mainThreadChatAgents2.js` | `import { MainThreadChatAgents2 } from '../../browser/mainThreadChatAgents2.js';` |

#### `vscode/src/vs/workbench/api/test/browser/mainThreadChatInputNotification.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { ChatInputNotificationActionKind, ChatInputNotificationSeverity, IChatInputNotification, IChatInputNotificationService } from '../../../contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 12 | `vscode/src/vs/workbench/api/browser/mainThreadChatInputNotification.js` | `import { MainThreadChatInputNotification } from '../../browser/mainThreadChatInputNotification.js';` |
| 13 | `vscode/src/vs/workbench/api/common/extHostChatInputNotification.js` | `import { ExtHostChatInputNotification } from '../../common/extHostChatInputNotification.js';` |

#### `vscode/src/vs/workbench/api/test/browser/mainThreadChatSessions.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { IAgentSessionsModel } from '../../../contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution.js` | `import { ChatSessionsService } from '../../../contrib/chat/browser/chatSessions/chatSessions.contribution.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatProgress, IChatProgressMessage, IChatService } from '../../../contrib/chat/common/chatService/chatService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionProviderOptionGroup, IChatSessionItem, IChatSessionRequestHistoryItem, IChatSessionsService } from '../../../contrib/chat/common/chatSessionsService.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../contrib/chat/common/constants.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { LocalChatSessionUri } from '../../../contrib/chat/common/model/chatUri.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentRequest, IChatAgentResult } from '../../../contrib/chat/common/participants/chatAgents.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.js` | `import { MockChatService } from '../../../contrib/chat/test/common/chatService/mockChatService.js';` |
| 41 | `vscode/src/vs/workbench/api/browser/mainThreadChatSessions.js` | `import { MainThreadChatSessions, ObservableChatSession } from '../../browser/mainThreadChatSessions.js';` |
| 44 | `vscode/src/vs/workbench/api/common/extHostChatSessions.js` | `import { ExtHostChatSessions } from '../../common/extHostChatSessions.js';` |
| 46 | `vscode/src/vs/workbench/api/common/extHostLanguageModels.js` | `import { ExtHostLanguageModels } from '../../common/extHostLanguageModels.js';` |

#### `vscode/src/vs/workbench/api/test/browser/mainThreadLanguageModels.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/ignoredFiles.js` | `import { ILanguageModelIgnoredFilesService } from '../../../contrib/chat/common/ignoredFiles.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatProvider, ILanguageModelsService, IChatMessage } from '../../../contrib/chat/common/languageModels.js';` |
| 20 | `vscode/src/vs/workbench/api/browser/mainThreadLanguageModels.js` | `import { MainThreadLanguageModels } from '../../browser/mainThreadLanguageModels.js';` |

#### `vscode/src/vs/workbench/api/test/browser/mainThreadMcp.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 19 | `vscode/src/vs/workbench/contrib/mcp/common/mcpGatewayService.js` | `import { IWorkbenchMcpGatewayService } from '../../../contrib/mcp/common/mcpGatewayService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/mcp/common/mcpRegistryTypes.js` | `import { IMcpHostDelegate, IMcpRegistry } from '../../../contrib/mcp/common/mcpRegistryTypes.js';` |
| 21 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { McpCollectionDefinition, McpCollectionSortOrder, McpConnectionState, McpServerDefinition, McpServerLaunch, McpServerTransportType, McpServerTrust } from '../../../contrib/mcp/common/mcpTypes.js';` |
| 28 | `vscode/src/vs/workbench/api/browser/mainThreadMcp.js` | `import { IMcpServerAuthContext, MainThreadMcp, McpServerAuthTracker } from '../../browser/mainThreadMcp.js';` |

#### `vscode/src/vs/workbench/api/test/common/extHostChatAgents2.test.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../contrib/chat/common/constants.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentRequest } from '../../../contrib/chat/common/participants/chatAgents.js';` |
| 15 | `vscode/src/vs/workbench/api/common/extHostChatAgents2.js` | `import { ChatAgentResponseStream } from '../../common/extHostChatAgents2.js';` |

#### `vscode/src/vs/workbench/api/test/common/extHostMcp.test.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/api/common/extHostMcp.js` | `import { createAuthMetadata, CommonResponse, IAuthMetadata } from '../../common/extHostMcp.js';` |

#### `vscode/src/vs/workbench/api/test/common/extHostTypeConverters.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.js` | `import { IElementVariableEntry } from '../../../contrib/chat/common/attachments/chatVariableEntries.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatRequestModeInstructions } from '../../../contrib/chat/common/model/chatModel.js';` |

#### `vscode/src/vs/workbench/api/test/node/extHostMcpNode.test.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/api/node/extHostMcpNode.js` | `import { escapeCmdArg } from '../../node/extHostMcpNode.js';` |

#### `vscode/src/vs/workbench/contrib/browserView/test/electron-browser/tools/openBrowserTool.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/platform/networkFilter/common/networkFilterService.js` | `import { AgentNetworkFilterService } from '../../../../../../platform/networkFilter/common/networkFilterService.js';` |
| 14 | `vscode/src/vs/platform/networkFilter/common/settings.js` | `import { AgentNetworkDomainSettingId } from '../../../../../../platform/networkFilter/common/settings.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../chat/common/chatService/chatService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IToolInvocation, ToolProgress } from '../../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../../../../../platform/agentHost/common/agentService.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/agentHostConnectionsService.js` | `import { IAgentHostConnectionsService } from '../../../../../platform/agentHost/common/agentHostConnectionsService.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { toAgentHostUri } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/fileEditAttribution.js` | `import { createFileEditContentDigest, EditAttributionFlushOutcome, FILE_EDIT_ATTRIBUTION_PROPERTY, IEditAttributionCoverageGapAcknowledgement, IFileEditAttributionMarker, parseEditAttributionResource } from '../../../../../platform/agentHost/common/fileEditAttribution.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/protocol/common/actions.js` | `import { ActionType } from '../../../../../platform/agentHost/common/state/protocol/common/actions.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import { ContentEncoding } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 20 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import { ActionEnvelope } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 21 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { ToolResultContentType, ToolResultFileEditContent } from '../../../../../platform/agentHost/common/state/sessionState.js';` |

#### `vscode/src/vs/workbench/contrib/extensions/test/electron-browser/extensionsActions.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/platform/chat/common/chatSettings.js` | `import { ChatAIDisabledSettingId } from '../../../../../platform/chat/common/chatSettings.js';` |

#### `vscode/src/vs/workbench/contrib/notebook/test/browser/contrib/notebookCellDiagnostics.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgent, IChatAgentData, IChatAgentService } from '../../../../chat/common/participants/chatAgents.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostPty.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { AgentHostDebugLogsArtifactKind, IAgentConnection, IAgentCreateSessionConfig, IAgentHostDebugLogsArtifact, IAgentHostDebugLogsChunk, IAgentHostManagedSettingsDiagnostics, IAgentHostNetworkDiagnosticsInfo, IAgentHostNetworkFetchResult, IAgentResolveSessionConfigParams, IAgentSessionConfigCompletionsParams, IAgentSessionMetadata, AuthenticateParams, AuthenticateResult } from '../../../../../platform/agentHost/common/agentService.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/actions.js` | `import { ActionType, StateAction } from '../../../../../platform/agentHost/common/state/protocol/actions.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { RootState, TerminalClaimKind, TerminalLifecycleStatus, type TerminalState } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 17 | `vscode/src/vs/platform/agentHost/common/state/protocol/commands.js` | `import type { CompletionsParams, CompletionsResult, CreateTerminalParams, ResolveSessionConfigResult, SessionConfigCompletionsResult } from '../../../../../platform/agentHost/common/state/protocol/commands.js';` |
| 18 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import type { ActionEnvelope, IRootConfigChangedAction, SessionAction, TerminalAction, INotification, ClientAnnotationsAction } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |
| 19 | `vscode/src/vs/platform/agentHost/common/state/sessionProtocol.js` | `import type { ResourceCopyParams, ResourceCopyResult, ResourceDeleteParams, ResourceDeleteResult, ResourceListResult, ResourceMoveParams, ResourceMoveResult, ResourceReadResult, ResourceResolveParams, ResourceResolveResult, ResourceWriteParams, ResourceWriteResult, CreateResourceWatchParams, CreateResourceWatchResult, ResourceMkdirParams, ResourceMkdirResult } from '../../../../../platform/agentHost/common/state/sessionProtocol.js';` |
| 25 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IActiveSubscriptionInfo, IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 26 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { StateComponents } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 27 | `vscode/src/vs/platform/agentHost/common/state/protocol/reducers.js` | `import { terminalReducer } from '../../../../../platform/agentHost/common/state/protocol/reducers.js';` |
| 28 | `vscode/src/vs/platform/agentHost/common/agentHostFileSystemProvider.js` | `import type { IRemoteWatchHandle } from '../../../../../platform/agentHost/common/agentHostFileSystemProvider.js';` |
| 29 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { identityAgentHostResourceUriMapper } from '../../../../../platform/agentHost/common/agentHostUri.js';` |
| 42 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `readonly onMcpNotification: Event<import('../../../../../platform/agentHost/common/agentService.js').IMcpNotification> = Event.None;` |
| 43 | `vscode/src/vs/platform/agentHost/common/state/protocol/common/commands.js` | `readonly initializeResult: IObservable<import('../../../../../platform/agentHost/common/state/protocol/common/commands.js').InitializeResult &#124; undefined> = constObservable(undefined);` |

#### `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostTerminalService.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentConnection } from '../../../../../platform/agentHost/common/agentService.js';` |
| 13 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 14 | `vscode/src/vs/platform/agentHost/common/state/protocol/actions.js` | `import { ActionType } from '../../../../../platform/agentHost/common/state/protocol/actions.js';` |
| 15 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { TerminalClaimKind } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 16 | `vscode/src/vs/platform/agentHost/common/state/sessionActions.js` | `import type { ClientAnnotationsAction, IRootConfigChangedAction, SessionAction, TerminalAction } from '../../../../../platform/agentHost/common/state/sessionActions.js';` |

#### `vscode/src/vs/workbench/contrib/terminalContrib/inlineHint/test/browser/terminalInitialHint.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgent } from '../../../../chat/common/participants/chatAgents.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatModeKind } from '../../../../chat/common/constants.js';` |

#### `vscode/src/vs/workbench/contrib/testing/test/common/testingChatAgentTool.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { IToolInvocation, IToolInvocationPreparationContext, IToolProgressStep } from '../../../chat/common/tools/languageModelToolsService.js';` |

#### `vscode/src/vs/workbench/services/assignment/test/common/assignmentFilters.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 45 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlementContext, IChatEntitlementService } from '../../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/policies/test/browser/accountPolicyGateContribution.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 21 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../../chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/services/workspaces/test/common/workspaceTrust.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 24 | `vscode/src/vs/platform/agentHost/common/agentHostUri.js` | `import { AGENT_HOST_SCHEME } from '../../../../../platform/agentHost/common/agentHostUri.js';` |

#### `vscode/src/vs/workbench/test/browser/aiCustomizationManagementSectionRegistry.test.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementSectionRegistry.js` | `import { aiCustomizationManagementSectionRegistry } from '../../contrib/chat/browser/aiCustomization/aiCustomizationManagementSectionRegistry.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { AICustomizationManagementSection } from '../../contrib/chat/common/aiCustomizationWorkspaceService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/agentsVoice/voiceModeOnboarding.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.js` | `import { VoiceModeOnboardingBanner } from '../../../../contrib/agentsVoice/browser/voiceModeOnboarding.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController, VoiceState } from '../../../../contrib/chat/browser/voiceClient/voiceSessionController.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackSlotClass } from '../../../../contrib/chat/browser/widget/input/chatInputStack.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../contrib/chat/browser/chat.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.js` | `import { IChatToolRiskAssessmentService } from '../../../../contrib/chat/browser/tools/chatToolRiskAssessmentService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import { IChatContentPartRenderContext, InlineTextModelCollection } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js` | `import { IChatMarkdownAnchorService } from '../../../../contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationCarouselPart.js` | `import { ChatToolConfirmationCarouselPart, ToolInvocationPartFactory } from '../../../../contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationCarouselPart.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationPart.js` | `import { ChatToolInvocationPart } from '../../../../contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationPart.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { AgentFeedbackReviewCommandId, IChatAgentFeedbackReviewComment, IChatAgentFeedbackReviewConfirmationData } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.js` | `import { ChatToolInvocation } from '../../../../contrib/chat/common/model/chatProgressTypes/chatToolInvocation.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatTodoListService.js` | `import { IChatTodoListService } from '../../../../contrib/chat/common/tools/chatTodoListService.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService, IToolData, ToolDataSource } from '../../../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatConfirmationWidget.css` | `import '../../../../contrib/chat/browser/widget/chatContentParts/media/chatConfirmationWidget.css';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatAgentFeedbackReviewConfirmation.css` | `import '../../../../contrib/chat/browser/widget/chatContentParts/media/chatAgentFeedbackReviewConfirmation.css';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatToolConfirmationCarousel.css` | `import '../../../../contrib/chat/browser/widget/chatContentParts/media/chatToolConfirmationCarousel.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatArtifacts.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatArtifactsWidget.js` | `import { ChatArtifactsWidget } from '../../../../contrib/chat/browser/widget/chatArtifactsWidget.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.js` | `import { IChatImageCarouselService } from '../../../../contrib/chat/browser/chatImageCarouselService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.js` | `import { IChatArtifact, IChatArtifacts, IChatArtifactsService, IArtifactSourceGroup } from '../../../../contrib/chat/common/tools/chatArtifactsService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/feedbackSurvey/chatModelFeedbackSurveyService.js` | `import { IChatModelFeedbackSurveyService } from '../../../../contrib/chat/browser/feedbackSurvey/chatModelFeedbackSurveyService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/test/browser/feedbackSurvey/mockChatModelFeedbackSurveyService.js` | `import { MockChatModelFeedbackSurveyService } from '../../../../contrib/chat/test/browser/feedbackSurvey/mockChatModelFeedbackSurveyService.js';` |
| 24 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { ISharedWebContentExtractorService } from '../../../../../platform/webContentExtractor/common/webContentExtractor.js';` |
| 37 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService } from '../../../../services/chat/common/chatEntitlementService.js';` |
| 42 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../../../../../platform/agentHost/common/agentService.js';` |
| 43 | `vscode/src/vs/platform/agentHost/common/agentHostEnablementService.js` | `import { IAgentHostEnablementService } from '../../../../../platform/agentHost/common/agentHostEnablementService.js';` |
| 44 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 45 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { RootState, StateComponents } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.js` | `import { IAgentHostUntitledProvisionalSessionService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js` | `import { IAgentHostSessionWorkingDirectoryResolver } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.js` | `import { IAgentHostNewSessionFolderService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js` | `import { IAgentHostCustomizationService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js';` |
| 51 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.js` | `import { IVoiceModeOnboardingService } from '../../../../contrib/agentsVoice/browser/voiceModeOnboarding.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatAccessibilityService, IChatWidget, IChatWidgetService } from '../../../../contrib/chat/browser/chat.js';` |
| 53 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { IChatResponseFileChangesService } from '../../../../contrib/chat/browser/chatResponseFileChangesService.js';` |
| 54 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../contrib/chat/browser/chatPetService.js';` |
| 55 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatPetWidgetService.js` | `import { ChatPetWidgetService, IChatPetWidgetService } from '../../../../contrib/chat/browser/widget/chatPetWidgetService.js';` |
| 56 | `vscode/src/vs/workbench/contrib/chat/browser/chatOutputItemRenderer.js` | `import { IChatOutputRendererService } from '../../../../contrib/chat/browser/chatOutputItemRenderer.js';` |
| 59 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.js` | `import { IChatAttachmentResolveService } from '../../../../contrib/chat/browser/attachments/chatAttachmentResolveService.js';` |
| 60 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js` | `import { IChatAttachmentWidgetRegistry } from '../../../../contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js';` |
| 61 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickService } from '../../../../contrib/chat/browser/attachments/chatContextPickService.js';` |
| 62 | `vscode/src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.js` | `import { IChatContextService } from '../../../../contrib/chat/browser/contextContrib/chatContextService.js';` |
| 63 | `vscode/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.js` | `import { IChatImageCarouselService } from '../../../../contrib/chat/browser/chatImageCarouselService.js';` |
| 64 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotification, IChatInputNotificationService } from '../../../../contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 65 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, IChatSpeechToTextService } from '../../../../contrib/chat/browser/speechToText/chatSpeechToTextService.js';` |
| 66 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.js` | `import { IDictationOnboardingService } from '../../../../contrib/chat/browser/speechToText/dictationOnboarding.js';` |
| 67 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.js` | `import { IChatInputNoticeHubService } from '../../../../contrib/chat/browser/widget/input/chatInputNoticeHub.js';` |
| 68 | `vscode/src/vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.js` | `import { ChatSubmitRequestHandlerService, IChatSubmitRequestHandlerService } from '../../../../contrib/chat/browser/chatSubmitRequestHandlerService.js';` |
| 69 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js` | `import { IChatMarkdownAnchorService } from '../../../../contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js';` |
| 70 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.js` | `import { IChatWidgetHistoryService } from '../../../../contrib/chat/common/widget/chatWidgetHistoryService.js';` |
| 71 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { IChatModeService } from '../../../../contrib/chat/common/chatModes.js';` |
| 72 | `vscode/src/vs/workbench/contrib/chat/test/common/mockChatModeService.js` | `import { MockChatModeService } from '../../../../contrib/chat/test/common/mockChatModeService.js';` |
| 73 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 74 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 75 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { Target } from '../../../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 76 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../contrib/chat/common/languageModels.js';` |
| 77 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { ChatAgentService, IChatAgent, IChatAgentNameService, IChatAgentService } from '../../../../contrib/chat/common/participants/chatAgents.js';` |
| 78 | `vscode/src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.js` | `import { MockChatService } from '../../../../contrib/chat/test/common/chatService/mockChatService.js';` |
| 79 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 80 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.js` | `import { IArtifactSourceGroup, IChatArtifacts, IChatArtifactsService } from '../../../../contrib/chat/common/tools/chatArtifactsService.js';` |
| 81 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatTodoListService.js` | `import { IChatTodo, IChatTodoListService } from '../../../../contrib/chat/common/tools/chatTodoListService.js';` |
| 82 | `vscode/src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.js` | `import { IChatToolRiskAssessmentService } from '../../../../contrib/chat/browser/tools/chatToolRiskAssessmentService.js';` |
| 83 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.js` | `import { IVoiceSessionController } from '../../../../contrib/chat/browser/voiceClient/voiceSessionController.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { ChatEditingSessionState, IChatEditingSession, IModifiedFileEntry, ModifiedFileEntryState } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatRequestDisablement } from '../../../../contrib/chat/common/model/chatModel.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatTodoListService.js` | `import { IChatTodo } from '../../../../contrib/chat/common/tools/chatTodoListService.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier } from '../../../../contrib/chat/common/languageModels.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../contrib/chat/common/constants.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { ChatInputNotificationSeverity, IChatInputNotification } from '../../../../contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatInputNotice.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.js` | `import { ChatInputNoticeVariant, ChatInputNoticeWidget } from '../../../../contrib/chat/browser/widget/input/chatInputNoticeWidget.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.js` | `import { chatInputStackClass, chatInputStackSlotClass, ChatInputStackSlot, setChatInputStackSlot } from '../../../../contrib/chat/browser/widget/input/chatInputStack.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatPetAccessoryRig.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { allChatPetAccessories, chatPetAccessories, ChatPetAccessoryIds, getChatPetAccessory, type ChatPetAccessoryId, type IChatPetAccessory } from '../../../../contrib/chat/browser/chatPetAchievements.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatPetAccessoryRenderer.js` | `import { drawChatPetComposite, drawChatPetEyeAccessory, getChatPetAccessoryImageSource, hasChatPetAccessoryImageDimensions, hasChatPetBodyImageDimensions } from '../../../../contrib/chat/browser/widget/chatPetAccessoryRenderer.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatPetWidget.js` | `import { getChatPetFrameDurations, getChatPetSpriteName, doesChatPetStateTrackCursor, CHAT_PET_SING_FIXED_ORIENTATION_DECORATIONS, drawChatPetAchievementStar, type ChatPetState } from '../../../../contrib/chat/browser/widget/chatPetWidget.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatPetAccessoryRig.js` | `import { getChatPetReducedMotionRigFrame } from '../../../../contrib/chat/browser/widget/chatPetAccessoryRig.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatPetAchievementsEditor.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievementsEditor.js` | `import { ChatPetAchievementsEditor } from '../../../../contrib/chat/browser/chatPetAchievementsEditor.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievementsEditorInput.js` | `import { ChatPetAchievementsEditorInput } from '../../../../contrib/chat/browser/chatPetAchievementsEditorInput.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { chatPetAchievements, ChatPetAccessoryIds, ChatPetAchievementIds } from '../../../../contrib/chat/browser/chatPetAchievements.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatPetFixtureUtils.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { ChatPetAccessoryId, ChatPetAchievementId } from '../../../../contrib/chat/browser/chatPetAchievements.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { ChatPetVariant, IChatPetService } from '../../../../contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatProgressContentPart.js` | `import { ChatProgressContentPart } from '../../../../contrib/chat/browser/widget/chatContentParts/chatProgressContentPart.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentMarkdownRenderer.js` | `import { ChatContentMarkdownRenderer } from '../../../../contrib/chat/browser/widget/chatContentMarkdownRenderer.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import { IChatContentPartRenderContext, InlineTextModelCollection } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js` | `import { IChatMarkdownAnchorService } from '../../../../contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatProgressMessage } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |
| 138 | `Reading `src/vs/workbench/contrib/chat/browser/chatWidget.ts`` | `createProgressMessage('Reading &#96;src/vs/workbench/contrib/chat/browser/chatWidget.ts&#96;'),` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 8 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatQuestion, IChatQuestionCarousel } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.js` | `import { ChatQuestionCarouselPart, IChatQuestionCarouselOptions } from '../../../../contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import { IChatContentPartRenderContext, InlineTextModelCollection } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatRequestViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatQuestionCarousel.css` | `import '../../../../contrib/chat/browser/widget/chatContentParts/media/chatQuestionCarousel.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatReadOnlyBanner.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 6 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatReadOnlyBanner.js` | `import { ChatReadOnlyBanner } from '../../../../contrib/chat/browser/widget/chatReadOnlyBanner.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatRichLink.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatRichLink.js` | `import { ChatRichLink, IChatLinkPresentation } from '../../../../contrib/chat/browser/widget/chatContentParts/chatRichLink.js';` |
| 127 | `src/vs/workbench/contrib/chat` | `{ kind: 'file', title: 'chatRichLink.ts', detail: 'src/vs/workbench/contrib/chat' },` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatTerminalCollapsible.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import type { IChatContentPartRenderContext, InlineTextModelCollection } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import type { IChatResponseViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.js` | `import { ChatTerminalThinkingCollapsibleWrapper } from '../../../../contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatToolRiskBadge.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 9 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/toolRiskBadgeWidget.js` | `import { ToolRiskBadgeWidget } from '../../../../contrib/chat/browser/widget/chatContentParts/toolInvocationParts/toolRiskBadgeWidget.js';` |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.js` | `import { IToolRiskAssessment, ToolRiskLevel } from '../../../../contrib/chat/browser/tools/chatToolRiskAssessmentService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 11 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IEditSessionEntryDiff } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 12 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { IChatResponseFileChangesService, IChatResponseFileEdit } from '../../../../contrib/chat/browser/chatResponseFileChangesService.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTurnPillsPart.js` | `import { ChatTurnPillsContentPart } from '../../../../contrib/chat/browser/widget/chatContentParts/chatTurnPillsPart.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import { IChatContentPartRenderContext } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../contrib/chat/common/constants.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { ChatTurnStatusPillsSetting } from '../../../../contrib/chat/browser/widget/chatTurnPills.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatTurnPillsPart } from '../../../../contrib/chat/common/model/chatViewModel.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 14 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentMarkdownRenderer.js` | `import { ChatContentMarkdownRenderer } from '../../../../contrib/chat/browser/widget/chatContentMarkdownRenderer.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentCodePools.js` | `import { DiffEditorPool, EditorPool } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentCodePools.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.js` | `import { IChatContentPartDiffData, IChatContentPartRenderContext, InlineTextModelCollection } from '../../../../contrib/chat/browser/widget/chatContentParts/chatContentParts.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.js` | `import { ChatThinkingContentPart } from '../../../../contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatThinkingPart } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration, ThinkingDisplayMode } from '../../../../contrib/chat/common/constants.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { IChatResponseViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/requestParser/chatParserTypes.js` | `import { ChatRequestTextPart } from '../../../../contrib/chat/common/requestParser/chatParserTypes.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { ChatModel } from '../../../../contrib/chat/common/model/chatModel.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/model/chatViewModel.js` | `import { ChatViewModel } from '../../../../contrib/chat/common/model/chatViewModel.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatListWidget.js` | `import { ChatListWidget } from '../../../../contrib/chat/browser/widget/chatListWidget.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatWidget.js` | `import { chatFloatingPersistentContentClass, chatPersistentContentHeightVariable } from '../../../../contrib/chat/browser/widget/chatWidget.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.js` | `import { ChatInputPart, IChatInputPartOptions, IChatInputStyles } from '../../../../contrib/chat/browser/widget/input/chatInputPart.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../../../contrib/chat/browser/chat.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { ElicitationState, IChatService } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 26 | `vscode/src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatElicitationRequestPart.js` | `import { ChatElicitationRequestPart } from '../../../../contrib/chat/common/model/chatProgressTypes/chatElicitationRequestPart.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.js` | `import { ChatToolInvocation } from '../../../../contrib/chat/common/model/chatProgressTypes/chatToolInvocation.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService, IToolData, ToolDataSource } from '../../../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.js` | `import { IChatToolRiskAssessmentService, IToolRiskAssessment, ToolRiskLevel } from '../../../../contrib/chat/browser/tools/chatToolRiskAssessmentService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration, ChatModeKind } from '../../../../contrib/chat/common/constants.js';` |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IEditSessionEntryDiff } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.js` | `import { IChatResponseFileChangesService, IChatResponseFileEdit } from '../../../../contrib/chat/browser/chatResponseFileChangesService.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.js` | `import { MockChatService } from '../../../../contrib/chat/test/common/chatService/mockChatService.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.js` | `import { ChatTurnStatusPillsSetting, isChatTurnStatusPillsEnabled } from '../../../../contrib/chat/browser/widget/chatTurnPills.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/permissionPickerList.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/promptFilePickers.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/promptSyntax/pickers/promptFilePickers.js` | `import { PromptFilePickers } from '../../../../contrib/chat/browser/promptSyntax/pickers/promptFilePickers.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { AgentInstructionFileType, IExtensionPromptPath, IPromptPath, IPromptsService, PromptsStorage, IAgentInstructionFile } from '../../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 27 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.js` | `import { ParsedPromptFile } from '../../../../contrib/chat/common/promptSyntax/promptFileParser.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget } from '../../../../contrib/chat/browser/chat.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { SessionType } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.js` | `import { ChatInputPart, IChatInputPartOptions, IChatInputStyles } from '../../../../contrib/chat/browser/widget/input/chatInputPart.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.js` | `import { IArtifactSourceGroup } from '../../../../contrib/chat/common/tools/chatArtifactsService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotification } from '../../../../contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingSession } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatTodoListService.js` | `import { IChatTodo } from '../../../../contrib/chat/common/tools/chatTodoListService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelChatMetadataAndIdentifier, ILanguageModelsService } from '../../../../contrib/chat/common/languageModels.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation, ChatConfiguration } from '../../../../contrib/chat/common/constants.js';` |
| 24 | `vscode/src/vs/platform/sandbox/common/settings.js` | `import { AgentSandboxEnabledValue, AgentSandboxSettingId } from '../../../../../platform/sandbox/common/settings.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/chat/voiceGlow.fixture.ts` · D-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceGlow.js` | `import { resolveVoiceGlowColors, VoiceGlowState } from '../../../../contrib/chat/browser/voiceClient/voiceGlow.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/voiceClient/voiceGlowController.js` | `import { createVoiceGlowController } from '../../../../contrib/chat/browser/voiceClient/voiceGlowController.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatAffordanceWidget.js` | `import { InlineChatAffordanceWidget } from '../../../../contrib/inlineChat/browser/inlineChatAffordanceWidget.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/actions/chatContextKeys.js` | `import { ChatContextKeys } from '../../../../contrib/chat/common/actions/chatContextKeys.js';` |
| 22 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatActions.js` | `import '../../../../contrib/inlineChat/browser/inlineChatActions.js';` |
| 25 | `vscode/src/vs/workbench/contrib/inlineChat/browser/media/inlineChatEditorAffordance.css` | `import '../../../../contrib/inlineChat/browser/media/inlineChatEditorAffordance.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 28 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, IChatEntitlementService } from '../../../../services/chat/common/chatEntitlementService.js';` |
| 29 | `vscode/src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.js` | `import { IVoiceModeOnboardingService } from '../../../../contrib/agentsVoice/browser/voiceModeOnboarding.js';` |
| 30 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.js` | `import { IChatInputNotificationService } from '../../../../contrib/chat/browser/widget/input/chatInputNotificationService.js';` |
| 31 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.js` | `import { IDictationOnboardingService } from '../../../../contrib/chat/browser/speechToText/dictationOnboarding.js';` |
| 32 | `vscode/src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.js` | `import { ChatSpeechToTextState, IChatSpeechToTextService } from '../../../../contrib/chat/browser/speechToText/chatSpeechToTextService.js';` |
| 33 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.js` | `import { IChatInputNoticeHubService } from '../../../../contrib/chat/browser/widget/input/chatInputNoticeHub.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService, IChatAccessibilityService } from '../../../../contrib/chat/browser/chat.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.js` | `import { IChatContextPickService } from '../../../../contrib/chat/browser/attachments/chatContextPickService.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.js` | `import { IChatAttachmentResolveService } from '../../../../contrib/chat/browser/attachments/chatAttachmentResolveService.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js` | `import { IChatAttachmentWidgetRegistry } from '../../../../contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.js` | `import { IChatContextService } from '../../../../contrib/chat/browser/contextContrib/chatContextService.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.js` | `import { IChatImageCarouselService } from '../../../../contrib/chat/browser/chatImageCarouselService.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/browser/chatTipService.js` | `import { IChatTipService } from '../../../../contrib/chat/browser/chatTipService.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../../../contrib/chat/common/constants.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/common/chatModes.js` | `import { IChatModeService, ChatMode } from '../../../../contrib/chat/common/chatModes.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/common/languageModels.js` | `import { ILanguageModelsService } from '../../../../contrib/chat/common/languageModels.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatAgents.js` | `import { IChatAgentService } from '../../../../contrib/chat/common/participants/chatAgents.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/participants/chatSlashCommands.js` | `import { IChatSlashCommandService } from '../../../../contrib/chat/common/participants/chatSlashCommands.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.js` | `import { ILanguageModelToolsService } from '../../../../contrib/chat/common/tools/languageModelToolsService.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.js` | `import { IChatArtifacts, IChatArtifactsService, IArtifactSourceGroup } from '../../../../contrib/chat/common/tools/chatArtifactsService.js';` |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/tools/chatTodoListService.js` | `import { IChatTodoListService } from '../../../../contrib/chat/common/tools/chatTodoListService.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/common/chatDebugService.js` | `import { IChatDebugService } from '../../../../contrib/chat/common/chatDebugService.js';` |
| 53 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService } from '../../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 54 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.js` | `import { IChatWidgetHistoryService } from '../../../../contrib/chat/common/widget/chatWidgetHistoryService.js';` |
| 55 | `vscode/src/vs/workbench/contrib/chat/common/widget/chatLayoutService.js` | `import { IChatLayoutService } from '../../../../contrib/chat/common/widget/chatLayoutService.js';` |
| 56 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 57 | `vscode/src/vs/platform/agentHost/common/agentService.js` | `import { IAgentHostService } from '../../../../../platform/agentHost/common/agentService.js';` |
| 58 | `vscode/src/vs/platform/agentHost/common/state/agentSubscription.js` | `import { IAgentSubscription } from '../../../../../platform/agentHost/common/state/agentSubscription.js';` |
| 59 | `vscode/src/vs/platform/agentHost/common/state/sessionState.js` | `import { RootState } from '../../../../../platform/agentHost/common/state/sessionState.js';` |
| 60 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.js` | `import { IAgentHostUntitledProvisionalSessionService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.js';` |
| 61 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js` | `import { IAgentHostSessionWorkingDirectoryResolver } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.js';` |
| 62 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.js` | `import { IAgentHostNewSessionFolderService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.js';` |
| 63 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js` | `import { IAgentHostCustomizationService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js';` |
| 72 | `vscode/src/vs/platform/webContentExtractor/common/webContentExtractor.js` | `import { ISharedWebContentExtractorService } from '../../../../../platform/webContentExtractor/common/webContentExtractor.js';` |
| 78 | `vscode/src/vs/workbench/contrib/inlineChat/browser/inlineChatZoneWidget.js` | `import { InlineChatZoneWidget } from '../../../../contrib/inlineChat/browser/inlineChatZoneWidget.js';` |
| 79 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { ChatModel } from '../../../../contrib/chat/common/model/chatModel.js';` |
| 80 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 81 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { Target } from '../../../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 82 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService } from '../../../../contrib/chat/common/customizationHarnessService.js';` |
| 86 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/editor/chatInputEditorContrib.js` | `import '../../../../contrib/chat/browser/widget/input/editor/chatInputEditorContrib.js';` |
| 89 | `vscode/src/vs/workbench/contrib/inlineChat/browser/media/inlineChat.css` | `import '../../../../contrib/inlineChat/browser/media/inlineChat.css';` |
| 90 | `vscode/src/vs/workbench/contrib/chat/browser/widget/media/chat.css` | `import '../../../../contrib/chat/browser/widget/media/chat.css';` |
| 93 | `vscode/src/vs/workbench/contrib/chat/test/common/mockChatModeService.js` | `import { MockChatModeService } from '../../../../contrib/chat/test/common/mockChatModeService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 63 | `vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.js` | `import { IChatPhoneInputPresenter } from '../../../contrib/chat/browser/widget/input/chatPhoneInputPresenter.js';` |
| 64 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatPasteTargetService } from '../../../contrib/chat/browser/chat.js';` |
| 65 | `vscode/src/vs/workbench/contrib/chat/browser/attachments/chatPasteTargetService.js` | `import { ChatPasteTargetService } from '../../../contrib/chat/browser/attachments/chatPasteTargetService.js';` |
| 103 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService } from '../../../contrib/chat/common/editing/chatEditingService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 20 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.js` | `import { AgentSessionRenderer, AgentSessionSectionRenderer, IAgentSessionRendererOptions } from '../../../../contrib/chat/browser/agentSessions/agentSessionsViewer.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../contrib/chat/common/voicePlaybackService.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { AgentSessionStatus, IAgentSession, AgentSessionSection, IAgentSessionSection } from '../../../../contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.js` | `import { AgentSessionProviders } from '../../../../contrib/chat/browser/agentSessions/agentSessions.js';` |
| 25 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalKind, AgentSessionApprovalModel, IAgentSessionApprovalInfo } from '../../../../contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |
| 29 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/media/agentsessionsviewer.css` | `import '../../../../contrib/chat/browser/agentSessions/media/agentsessionsviewer.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 16 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService, IHarnessDescriptor, createVSCodeHarnessDescriptor } from '../../../../contrib/chat/common/customizationHarnessService.js';` |
| 17 | `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.js` | `import { IAgentPluginService } from '../../../../contrib/chat/common/plugins/agentPluginService.js';` |
| 18 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 19 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType, LocalChatSessionUri } from '../../../../contrib/chat/common/model/chatUri.js';` |
| 20 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptsType } from '../../../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService, AgentInstructionFileType, PromptsStorage, IPromptPath, IAgentInstructionFile } from '../../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 22 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementSection } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 23 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js` | `import { AICustomizationItemsModel, IAICustomizationItemsModel } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js';` |
| 24 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.js` | `import { AICustomizationListWidget } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationListWidget.js';` |
| 28 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.js` | `import { ParsedPromptFile, PromptHeader } from '../../../../contrib/chat/common/promptSyntax/promptFileParser.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 35 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidgetService } from '../../../../contrib/chat/browser/chat.js';` |
| 43 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService, AICustomizationManagementSection, AICustomizationSource } from '../../../../contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 44 | `vscode/src/vs/workbench/contrib/chat/common/customizationHarnessService.js` | `import { ICustomizationHarnessService, ICustomizationItem, ICustomizationItemProvider, ICustomizationSourceFolder, IHarnessDescriptor, createVSCodeHarnessDescriptor } from '../../../../contrib/chat/common/customizationHarnessService.js';` |
| 45 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { IChatSessionsService } from '../../../../contrib/chat/common/chatSessionsService.js';` |
| 46 | `vscode/src/vs/workbench/contrib/chat/common/model/chatUri.js` | `import { getChatSessionType, LocalChatSessionUri } from '../../../../contrib/chat/common/model/chatUri.js';` |
| 47 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IPromptsService, AgentInstructionFileType, PromptsStorage, IAgentSkill, IChatPromptSlashCommand, IAgentInstructionFile } from '../../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 48 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.js` | `import { IResolvedPromptSourceFolder } from '../../../../contrib/chat/common/promptSyntax/config/promptFileLocations.js';` |
| 49 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.js` | `import { ParsedPromptFile, PromptFileParser } from '../../../../contrib/chat/common/promptSyntax/promptFileParser.js';` |
| 50 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.js` | `import { PromptFileSource, PromptsType } from '../../../../contrib/chat/common/promptSyntax/promptTypes.js';` |
| 51 | `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.js` | `import { IAgentPluginService, IAgentPlugin } from '../../../../contrib/chat/common/plugins/agentPluginService.js';` |
| 52 | `vscode/src/vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.js` | `import { IPluginMarketplaceService, IMarketplacePlugin, MarketplaceType, PluginSourceKind } from '../../../../contrib/chat/common/plugins/pluginMarketplaceService.js';` |
| 53 | `vscode/src/vs/workbench/contrib/chat/common/plugins/marketplaceReference.js` | `import { MarketplaceReferenceKind } from '../../../../contrib/chat/common/plugins/marketplaceReference.js';` |
| 54 | `vscode/src/vs/workbench/contrib/chat/common/plugins/pluginInstallService.js` | `import { IPluginInstallService } from '../../../../contrib/chat/common/plugins/pluginInstallService.js';` |
| 55 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js` | `import { AICustomizationManagementEditor } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.js';` |
| 56 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/customizationMigrationCategories.js` | `import { CustomizationMigrationCategoryId } from '../../../../contrib/chat/browser/aiCustomization/customizationMigrationCategories.js';` |
| 57 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.js` | `import { IAICustomizationItemSource, IAICustomizationListItem } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationItemSource.js';` |
| 58 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js` | `import { AICustomizationItemsModel, IAICustomizationItemsModel, ItemsModelSection } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.js';` |
| 59 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/embeddedMcpServerDetail.js` | `import { EmbeddedMcpServerDetail } from '../../../../contrib/chat/browser/aiCustomization/embeddedMcpServerDetail.js';` |
| 60 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/embeddedAgentPluginDetail.js` | `import { EmbeddedAgentPluginDetail } from '../../../../contrib/chat/browser/aiCustomization/embeddedAgentPluginDetail.js';` |
| 61 | `vscode/src/vs/workbench/contrib/chat/browser/agentPluginEditor/agentPluginItems.js` | `import { AgentPluginItemKind, IAgentPluginItem } from '../../../../contrib/chat/browser/agentPluginEditor/agentPluginItems.js';` |
| 62 | `vscode/src/vs/workbench/contrib/chat/common/enablement.js` | `import { ContributionEnablementState } from '../../../../contrib/chat/common/enablement.js';` |
| 63 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js` | `import { AICustomizationManagementEditorInput } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.js';` |
| 66 | `vscode/src/vs/platform/mcp/common/mcpManagement.js` | `import { mcpAccessConfig, McpAccessValue } from '../../../../../platform/mcp/common/mcpManagement.js';` |
| 67 | `vscode/src/vs/platform/mcp/common/mcpPlatformTypes.js` | `import { McpServerType } from '../../../../../platform/mcp/common/mcpPlatformTypes.js';` |
| 68 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../contrib/chat/common/constants.js';` |
| 69 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationDialogService.js` | `import { IAutomationDialogService } from '../../../../contrib/chat/common/automations/automationDialogService.js';` |
| 70 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationRunner.js` | `import { IAutomationRunner } from '../../../../contrib/chat/common/automations/automationRunner.js';` |
| 71 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../contrib/chat/common/automations/automationService.js';` |
| 72 | `vscode/src/vs/workbench/contrib/mcp/common/mcpTypes.js` | `import { IMcpWorkbenchService, IWorkbenchMcpServer, IMcpService, McpConnectionState, McpServerInstallState } from '../../../../contrib/mcp/common/mcpTypes.js';` |
| 73 | `vscode/src/vs/workbench/contrib/mcp/common/mcpRegistryTypes.js` | `import { IMcpRegistry } from '../../../../contrib/mcp/common/mcpRegistryTypes.js';` |
| 74 | `vscode/src/vs/workbench/services/mcp/common/mcpWorkbenchManagementService.js` | `import { IWorkbenchLocalMcpServer, LocalMcpServerScope } from '../../../../services/mcp/common/mcpWorkbenchManagementService.js';` |
| 75 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/mcpListWidget.js` | `import { McpListWidget } from '../../../../contrib/chat/browser/aiCustomization/mcpListWidget.js';` |
| 76 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/pluginListWidget.js` | `import { PluginListWidget } from '../../../../contrib/chat/browser/aiCustomization/pluginListWidget.js';` |
| 78 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js` | `import { IAgentHostCustomizationService } from '../../../../contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.js';` |
| 79 | `vscode/src/vs/platform/agentHost/common/state/protocol/state.js` | `import { McpAuthRequiredReason, McpServerStatus } from '../../../../../platform/agentHost/common/state/protocol/state.js';` |
| 85 | `vscode/src/vs/workbench/contrib/chat/common/editing/chatEditingService.js` | `import { IChatEditingService } from '../../../../contrib/chat/common/editing/chatEditingService.js';` |
| 86 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 93 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css` | `import '../../../../contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.js` | `import { IChatPromptSlashCommand } from '../../../../contrib/chat/common/promptSyntax/service/promptsService.js';` |
| 13 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.js` | `import { AICustomizationManagementSection } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationManagement.js';` |
| 14 | `vscode/src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.js` | `import { IAICustomizationWorkspaceService } from '../../../../contrib/chat/common/aiCustomizationWorkspaceService.js';` |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationWelcomePage.js` | `import { AICustomizationWelcomePage } from '../../../../contrib/chat/browser/aiCustomization/aiCustomizationWelcomePage.js';` |
| 21 | `vscode/src/vs/workbench/contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css` | `import '../../../../contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 34 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../contrib/chat/common/voicePlaybackService.js';` |
| 35 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 36 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel } from '../../../../contrib/chat/common/model/chatModel.js';` |
| 37 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { IAgentSession, IAgentSessionsModel } from '../../../../contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalKind, AgentSessionApprovalModel, IAgentSessionApprovalInfo } from '../../../../contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 23 | `vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.js` | `import { isIChatSessionFileChange2 } from '../../../../contrib/chat/common/chatSessionsService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/chatPetAchievementBadges.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 7 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetAchievements.js` | `import { chatPetAchievements, ChatPetAchievementIds } from '../../../../contrib/chat/browser/chatPetAchievements.js';` |
| 8 | `vscode/src/vs/workbench/contrib/chat/browser/chatPetService.js` | `import { IChatPetService } from '../../../../contrib/chat/browser/chatPetService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 12 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatConfiguration } from '../../../../contrib/chat/common/constants.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 37 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.js` | `import { IAgentSessionsService } from '../../../../contrib/chat/browser/agentSessions/agentSessionsService.js';` |
| 38 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.js` | `import { IAgentSession, IAgentSessionsModel } from '../../../../contrib/chat/browser/agentSessions/agentSessionsModel.js';` |
| 39 | `vscode/src/vs/workbench/contrib/chat/common/automations/automationService.js` | `import { IAutomationService } from '../../../../contrib/chat/common/automations/automationService.js';` |
| 40 | `vscode/src/vs/workbench/contrib/chat/common/chatService/chatService.js` | `import { IChatService } from '../../../../contrib/chat/common/chatService/chatService.js';` |
| 41 | `vscode/src/vs/workbench/contrib/chat/common/model/chatModel.js` | `import { IChatModel } from '../../../../contrib/chat/common/model/chatModel.js';` |
| 42 | `vscode/src/vs/workbench/contrib/chat/common/voicePlaybackService.js` | `import { IVoicePlaybackService } from '../../../../contrib/chat/common/voicePlaybackService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/sessionsSignInDialog.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 10 | `vscode/src/vs/workbench/contrib/chat/browser/chatSetup/chatSetupRunner.js` | `import { ChatSetupDialog, getChatSetupDialogButtons, getChatSetupDialogFooter } from '../../../../contrib/chat/browser/chatSetup/chatSetupRunner.js';` |
| 11 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement } from '../../../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts` · D-S / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 15 | `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.js` | `import { AgentSessionApprovalKind, AgentSessionApprovalModel, IAgentSessionApprovalInfo } from '../../../../contrib/chat/browser/agentSessions/agentSessionApprovalModel.js';` |

#### `vscode/src/vs/workbench/test/browser/workbenchTestServices.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 135 | `vscode/src/vs/workbench/contrib/chat/browser/chat.js` | `import { IChatWidget, IChatWidgetService } from '../../contrib/chat/browser/chat.js';` |
| 136 | `vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditor.js` | `import { IChatEditorOptions } from '../../contrib/chat/browser/widgetHosts/editor/chatEditor.js';` |
| 137 | `vscode/src/vs/workbench/contrib/chat/common/constants.js` | `import { ChatAgentLocation } from '../../contrib/chat/common/constants.js';` |
| 147 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { IChatEntitlementService } from '../../services/chat/common/chatEntitlementService.js';` |

#### `vscode/src/vs/workbench/test/common/workbenchTestServices.ts` · U-T / T-C

| 行 | 目标 | 源语句/符号 |
| --- | --- | --- |
| 36 | `vscode/src/vs/workbench/services/chat/common/chatEntitlementService.js` | `import { ChatEntitlement, ChatEntitlementContext, IChatEntitlementService } from '../../services/chat/common/chatEntitlementService.js';` |

## 无直接域路径的服务、DTO、常量与注册扫描

以下为没有上节直接路径入边但仍命中 AI 符号/命令/配置字符串的实际文件。表格的行号—符号列保存全部命中行；并非每个命中都属于活跃服务（稳定 d.ts、普通历史 telemetry 标签、注释、用户扩展 ID 合法存在）。这是直接入边之外的语义复核队列：U-N 文件删除退休能力分支，保留纯历史数据/通用标签；d.ts/API 数据按上文保留，测试按 U-T 调整。不要用“字符串为零”代替闭包验证。

| 文件 | 处置/验证 | 命中行—符号或字符串 |
| --- | --- | --- |
| `vscode/src/vs/base/common/marshallingIds.ts` | 纯常量/模型数据按保留清单复核；普通数据语义保留 / T-C | 25: ChatViewContext; 26: LanguageModelToolResult; 27: LanguageModelTextPart; 28: LanguageModelThinkingPart; 29: LanguageModelPromptTsxPart; 30: LanguageModelDataPart; 32: ChatResponsePullRequestPart |
| `vscode/src/vs/base/common/policy.ts` | 纯常量/模型数据按保留清单复核；普通数据语义保留 / T-C | 53: Chat |
| `vscode/src/vs/base/common/product.ts` | 纯常量/模型数据按保留清单复核；普通数据语义保留 / T-C | 40: IChatSessionRecommendation; 272: IAiGeneratedWorkspaceTrust; 276: IChatSessionRecommendation; 415: IAiGeneratedWorkspaceTrust |
| `vscode/src/vs/base/test/browser/ui/toolbar/toolbar.test.ts` | U-T / T-C | 57: 'workbench.action.chat.attachContext'; 58: 'workbench.action.chat.openModePicker'; 59: 'workbench.action.chat.openModelPicker'; 60: 'workbench.action.chat.configureTools'; 100: 'workbench.action.chat.attachContext'; 101: 'workbench.action.chat.openModePicker'; 102: 'workbench.action.chat.openModelPicker'; 103: 'workbench.action.chat.configureTools'; 109: 'workbench.action.chat.attachContext'; 110: 'workbench.action.chat.openModePicker'; 111: 'workbench.action.chat.openModelPicker'; 123: 'workbench.action.chat.openModelPicker'; 129: 'workbench.action.chat.attachContext'; 130: 'workbench.action.chat.openModePicker'; 131: 'workbench.action.chat.openModelPicker'; 141: 'workbench.action.chat.attachContext'; 142: 'workbench.action.chat.openModePicker'; 143: 'workbench.action.chat.openModelPicker'; 183: 'workbench.action.chat.attachContext'; 184: 'workbench.action.chat.openModePicker'; 185: 'workbench.action.chat.openModelPicker'; 191: 'workbench.action.chat.openModelPicker'; 194: 'workbench.action.chat.openModePicker'; 198: 'workbench.action.chat.attachContext'; 199: 'workbench.action.chat.openModePicker' |
| `vscode/src/vs/base/test/common/filters.perf.data.js` | U-T / T-C | 6: SpeechSynthesis, SpeechSynthesisEvent, SpeechSynthesisEventInit, SpeechSynthesisEventMap, SpeechSynthesisUtterance, SpeechSynthesisUtteranceEventMap, SpeechSynthesisVoice, Speech_SetGlobalStealthRead |
| `vscode/src/vs/base/test/common/naturalLanguage/korean.test.ts` | U-T / T-C | 209: 'inlineChat' |
| `vscode/src/vs/base/test/common/oauth.test.ts` | U-T / T-C | 2269: 'mcp.access'; 2280: 'todos.read mcp.access'; 2304: 'mcp.access'; 2312: 'todos.read mcp.access' |
| `vscode/src/vs/editor/common/standaloneStrings.ts` | 纯常量/模型数据按保留清单复核；普通数据语义保留 / T-C | 39: '<keybinding:workbench.action.quickchat.toggle>'; 40: '<keybinding:inlineChat.start>'; 45: "The editor contains pending modifications that have been made by chat."; 46: "The editor is currently waiting for modifications to be made by chat."; 48: "Start or stop dictation in the editor{0}." |
| `vscode/src/vs/editor/common/textModelEditSource.ts` | 纯常量/模型数据按保留清单复核；普通数据语义保留 / T-C | 78: 'inlineChat.applyEdits'; 79: Chat; 111: 'agentHost'; 115: Chat; 143: 'agentHost'; 148: Chat; 149: Chat; 176: 'inlineChat.applyEdits' |
| `vscode/src/vs/editor/contrib/codeAction/browser/codeActionCommands.ts` | U-N / T-E+T-C | 84: InlineChatEditorAffordance |
| `vscode/src/vs/editor/contrib/codeAction/browser/codeActionController.ts` | U-N / T-E+T-C | 151: 'inlineChat.start' |
| `vscode/src/vs/editor/test/common/services/editorWebWorker.test.ts` | U-T / T-C | 260: Chat |
| `vscode/src/vs/editor/test/node/diffing/fixtures/noise-2/advanced.expected.diff.json` | U-T / T-C | 3: ChatModel, ChatProviderInvokedClassification, ChatProviderInvokedEvent, ChatService, IChatProgress, IChatProvider, IChatReplyFollowup, IChatService; 7: ChatMessageRole, ChatModel, ChatProviderInvokedClassification, ChatProviderInvokedEvent, ChatService, IChatMessage, IChatProgress, IChatProvider, IChatReplyFollowup, IChatResponse, IChatService, IChatSlashFragment |
| `vscode/src/vs/editor/test/node/diffing/fixtures/noise-2/legacy.expected.diff.json` | U-T / T-C | 3: ChatModel, ChatProviderInvokedClassification, ChatProviderInvokedEvent, ChatService, IChatProgress, IChatProvider, IChatReplyFollowup, IChatService; 7: ChatMessageRole, ChatModel, ChatProviderInvokedClassification, ChatProviderInvokedEvent, ChatService, IChatMessage, IChatProgress, IChatProvider, IChatReplyFollowup, IChatResponse, IChatService, IChatSlashFragment |
| `vscode/src/vs/platform/accessibility/browser/accessibleView.ts` | U-N / T-V+T-C | 18: TerminalChat; 23: ChatTerminalOutput; 24: ChatThinking; 25: 'inlineChat', InlineChat; 48: ChatFindHelp; 55: ChatPetAchievements |
| `vscode/src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.ts` | U-N / T-E+T-C | 584: Chat; 586: Chat; 591: Chat; 595: Chat; 600: Chat; 709: Chat; 711: Chat |
| `vscode/src/vs/platform/actions/common/actions.ts` | U-N / T-E+T-C | 261: ChatContext; 262: ChatCodeBlock, ChatCodeblock; 263: ChatCompareBlock; 264: ChatMessageTitle; 265: ChatWelcomeContext; 266: ChatMessageFooter; 267: ChatSubagentContent; 268: ChatExecute; 269: ChatExecuteQueue; 270: ChatInput; 271: ChatInputSecondary; 272: ChatInputStatus; 273: ChatInputSide; 275: ChatModePicker; 276: ChatEditingWidgetToolbar; 277: ChatEditingSessionChangesToolbar; 278: ChatEditingSessionTitleToolbar; 279: ChatEditingSessionChangesVersionsSubmenu; 280: ChatEditingSessionChangesFileHeaderToolbar; 281: ChatEditingSessionChangesFileHeaderRightToolbar; 282: ChatEditingEditorContent; 283: ChatEditingEditorHunk; 284: ChatEditingDeletedNotebookCell; 285: ChatInputAttachmentToolbar; 286: ChatEditingWidgetModifiedFilesToolbar; 287: ChatInputResourceAttachmentContext; 288: ChatInputSymbolAttachmentContext; 289: ChatInlineResourceAnchorContext; 290: ChatInlineSymbolAnchorContext; 291: ChatMessageCheckpoint; 292: ChatMessageRestoreCheckpoint; 293: ChatNewMenu; 294: ChatEditingCodeBlockContext; 295: ChatTitleBarMenu; 296: ChatAttachmentsContext; 297: ChatTipContext; 298: ChatTipToolbar; 299: ChatToolOutputResourceToolbar; 300: ChatTextEditorMenu; 301: ChatToolOutputResourceContext; 302: ChatMultiDiffContext; 303: ChatConfirmationMenu; 304: ChatEditorInlineGutter, ChatEditorInlineMenu; 305: ChatEditorInlineExecute, ChatEditorInputExecute; 306: ChatEditorInlineInputSide, ChatEditorInputSide; 307: InlineChatEditorAffordance; 332: ChatViewSessionTitleNavigationToolbar; 333: ChatViewSessionTitleToolbar; 334: ChatContextUsageActions |
| `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.ts` | D-X / T-C | 12: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json' |
| `vscode/src/vs/platform/browserView/common/browserView.ts` | D-B / T-C | 46: Chat |
| `vscode/src/vs/platform/browserView/electron-browser/preload-browserView.ts` | D-B / T-C | 363: Chat; 2080: Chat; 2246: Chat |
| `vscode/src/vs/platform/browserView/electron-main/browserViewFrameInspector.ts` | D-B / T-C | 159: Chat |
| `vscode/src/vs/platform/browserView/electron-main/browserViewMainService.ts` | D-B / T-C | 603: Chat |
| `vscode/src/vs/platform/configuration/common/configurationRegistry.ts` | U-N / T-E+T-C | 49: IAgentHostConfigurationSync; 64: AgentHostConfigurationSyncScope; 65: AgentHostConfigurationSyncScope; 68: AgentHostConfigurationSyncScope; 166: IAgentHostConfigurationSync; 171: IAgentHostConfigurationSync; 291: IAgentHostConfigurationSync; 293: IAgentHostConfigurationSync; 416: IAgentHostConfigurationSync; 452: IAgentHostConfigurationSync; 930: IAgentHostConfigurationSync; 1144: 'config.agentHost.duplicate' |
| `vscode/src/vs/platform/diagnostics/node/diagnosticsService.ts` | U-N / T-E+T-C | 60: 'mcp.json' |
| `vscode/src/vs/platform/dnd/browser/dnd.ts` | U-N / T-E+T-C | 515: ChatReferenceTransferData; 523: IChat; 539: ChatReferenceTransferData; 544: ChatReferenceTransferData; 558: ChatReferenceTransferData; 559: ChatReferenceTransferData; 562: ChatReferenceTransferData |
| `vscode/src/vs/platform/environment/node/argv.ts` | U-N / T-E+T-C | 55: "The prompt to use as chat." |
| `vscode/src/vs/platform/extensionManagement/common/extensionGalleryService.ts` | U-N / T-E+T-C | 1997: Chat |
| `vscode/src/vs/platform/extensions/common/extensions.ts` | U-N / T-E+T-C | 176: IChatParticipantContribution; 200: IMcpCollectionContribution; 206: IChatFileContribution; 241: IChatParticipantContribution; 242: IChatFileContribution; 243: IChatFileContribution; 244: IChatFileContribution; 245: IChatFileContribution; 246: IChatFileContribution; 249: IMcpCollectionContribution; 285: Chat |
| `vscode/src/vs/platform/extensions/common/extensionsApiProposals.ts` | U-N / T-E+T-C | 433: 'https://raw.githubusercontent.com/microsoft/vscode/main/src/vscode-dts/vscode.proposed.speech.d.ts' |
| `vscode/src/vs/platform/github/common/githubHostCapabilitiesService.ts` | U-N / T-E+T-C | 26: AgentHostGitHubCapabilities |
| `vscode/src/vs/platform/github/common/githubQueryServiceImpl.ts` | U-N / T-E+T-C | 68: AgentHostListPullRequests; 78: AgentHostSearchPullRequests; 89: AgentHostRecentAssignedIssues; 96: AgentHostRecentAuthoredPullRequests; 110: AgentHostPullRequestReviewThreadSummary; 482: AgentHostIssueLinkage |
| `vscode/src/vs/platform/github/common/pullRequestMutationService.ts` | U-N / T-E+T-C | 72: AgentHostAddPullRequestReviewThreadReply; 78: AgentHostResolvePullRequestReviewThread; 84: AgentHostEnqueuePullRequest; 90: AgentHostEnablePullRequestAutoMerge |
| `vscode/src/vs/platform/github/common/pullRequestQueryService.ts` | U-N / T-E+T-C | 52: AgentHostPullRequestReviewThreads; 71: AgentHostPullRequestReviewThreadComments; 83: AgentHostPullRequestChecks; 115: AgentHostPullRequestExpectedCheckSuites; 130: AgentHostPullRequestMergeability |
| `vscode/src/vs/platform/github/test/node/githubQueryService.test.ts` | U-T / T-C | 412: AgentHostListPullRequests; 423: AgentHostSearchPullRequests; 428: AgentHostSearchPullRequests; 648: AgentHostRecentAssignedIssues; 654: AgentHostRecentAuthoredPullRequests; 668: AgentHostPullRequestReviewThreadSummary; 681: AgentHostPullRequestReviewThreadSummary; 695: AgentHostIssueLinkage; 753: AgentHostRecentAssignedIssues; 775: AgentHostRecentAssignedIssues; 779: AgentHostRecentAssignedIssues; 783: AgentHostRecentAssignedIssues |
| `vscode/src/vs/platform/github/test/node/pullRequestMutationService.test.ts` | U-T / T-C | 205: AgentHostEnablePullRequestAutoMerge; 309: AgentHostAddPullRequestReviewThreadReply; 333: AgentHostAddPullRequestReviewThreadReply; 337: AgentHostResolvePullRequestReviewThread; 371: AgentHostAddPullRequestReviewThreadReply; 372: AgentHostResolvePullRequestReviewThread; 397: AgentHostAddPullRequestReviewThreadReply; 405: AgentHostResolvePullRequestReviewThread; 409: AgentHostResolvePullRequestReviewThread; 462: AgentHostAddPullRequestReviewThreadReply; 474: AgentHostAddPullRequestReviewThreadReply; 778: AgentHostEnqueuePullRequest |
| `vscode/src/vs/platform/github/test/node/pullRequestQueryService.test.ts` | U-T / T-C | 162: AgentHostPullRequestReviewThreads; 186: AgentHostPullRequestReviewThreadComments; 198: AgentHostPullRequestReviewThreads; 266: AgentHostPullRequestReviewThreads; 280: AgentHostPullRequestReviewThreads; 324: AgentHostPullRequestChecks; 331: AgentHostPullRequestChecks; 335: AgentHostPullRequestExpectedCheckSuites; 337: AgentHostPullRequestChecks; 341: AgentHostPullRequestExpectedCheckSuites; 384: AgentHostPullRequestChecks; 387: AgentHostPullRequestExpectedCheckSuites; 389: AgentHostPullRequestChecks; 393: AgentHostPullRequestExpectedCheckSuites; 423: AgentHostPullRequestChecks; 434: AgentHostPullRequestChecks; 445: AgentHostPullRequestExpectedCheckSuites; 465: AgentHostPullRequestExpectedCheckSuites; 486: AgentHostPullRequestMergeability; 567: AgentHostPullRequestMergeability; 610: AgentHostPullRequestMergeability |
| `vscode/src/vs/platform/otel/common/genAiAttributes.ts` | U-N / T-E+T-C | 73: 'copilot_chat.turn.index'; 74: 'copilot_chat.time_to_first_token'; 76: 'copilot_chat.chat_session_id'; 78: 'copilot_chat.hook_type'; 80: 'copilot_chat.hook_input'; 82: 'copilot_chat.hook_output'; 84: 'copilot_chat.hook_result_kind' |
| `vscode/src/vs/platform/otel/test/node/otlp/otlpJsonDecode.test.ts` | U-T / T-C | 54: 'copilot_chat.streaming'; 97: 'copilot_chat.streaming' |
| `vscode/src/vs/platform/policy/common/copilotManagedSettings.ts` | U-N / T-E+T-C | 77: 'chat.customizations.strictPluginOnlyCustomization'; 80: 'chat.mcp.allowManagedServersOnly'; 83: 'chat.hooks.allowManagedOnly' |
| `vscode/src/vs/platform/policy/test/common/fileManagedSettingsService.test.ts` | U-T / T-C | 121: ChatDefaultModel |
| `vscode/src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts` | U-T / T-C | 21: ChatToolsAutoApprove |
| `vscode/src/vs/platform/quickinput/common/quickAccess.ts` | U-N / T-E+T-C | 35: Chat |
| `vscode/src/vs/platform/remoteTunnel/node/tunnelProcessCoordinator.ts` | U-N / T-E+T-C | 21: 'agentHost'; 26: IAgentHostSharingRequest; 93: IAgentHostSharingRequest; 103: 'agentHost'; 128: IAgentHostSharingRequest; 177: IAgentHostSharingRequest; 314: 'agentHost'; 321: 'agentHost' |
| `vscode/src/vs/platform/remoteTunnel/test/node/remoteTunnelService.test.ts` | U-T / T-C | 20: IAgentHostSharingRequest; 51: IAgentHostSharingRequest |
| `vscode/src/vs/platform/remoteTunnel/test/node/tunnelProcessCoordinator.test.ts` | U-T / T-C | 16: IAgentHostSharingRequest; 61: IAgentHostSharingRequest; 110: 'agentHost' |
| `vscode/src/vs/platform/request/common/request.ts` | U-N / T-E+T-C | 13: AgentHostConfigurationSyncScope; 277: AgentHostConfigurationSyncScope; 289: AgentHostConfigurationSyncScope; 296: AgentHostConfigurationSyncScope |
| `vscode/src/vs/platform/storage/test/electron-main/storageMainService.test.ts` | U-T / T-C | 48: 'mcp.json' |
| `vscode/src/vs/platform/telemetry/common/editTelemetry.ts` | U-N / T-E+T-C | 41: 'The chat conversation identifier when the edit source comes from chat. Sourced from the chat edit session id.'; 42: 'The chat request identifier when the edit source comes from chat.'; 74: 'agentHostStandalone' |
| `vscode/src/vs/platform/telemetry/common/languageModelToolTelemetry.ts` | U-N / T-E+T-C | 8: LanguageModelToolTelemetryData; 15: LanguageModelToolTelemetryClassification; 22: LanguageModelToolInvokedEvent, LanguageModelToolTelemetryData; 33: LanguageModelToolInvokedClassification, LanguageModelToolTelemetryClassification; 34: LanguageModelTool |
| `vscode/src/vs/platform/terminal/common/terminal.ts` | U-N / T-N+T-C | 33: 'terminal.integrated.agentHostProfile.linux', AgentHostProfileLinux; 34: 'terminal.integrated.agentHostProfile.osx', AgentHostProfileMacOs; 35: 'terminal.integrated.agentHostProfile.windows', AgentHostProfileWindows |
| `vscode/src/vs/platform/terminal/common/terminalPlatformConfiguration.ts` | U-N / T-N+T-C | 171: AgentHostProfileLinux; 173: 'terminal.integrated.agentHostProfile.linux'; 190: AgentHostProfileMacOs; 192: 'terminal.integrated.agentHostProfile.osx'; 209: AgentHostProfileWindows; 211: 'terminal.integrated.agentHostProfile.windows' |
| `vscode/src/vs/platform/userDataProfile/common/userDataProfile.ts` | U-N / T-E+T-C | 45: Mcp; 46: LanguageModels; 203: 'mcp.json' |
| `vscode/src/vs/platform/userDataSync/common/mcpSync.ts` | U-N / T-E+T-C | 17: IMcpSyncContent; 23: IMcpSyncContent; 31: McpSynchroniser; 47: 'mcp.json', Mcp; 54: IMcpSyncContent |
| `vscode/src/vs/platform/userDataSync/common/userDataSync.ts` | U-N / T-E+T-C | 175: Mcp; 181: Mcp |
| `vscode/src/vs/platform/userDataSync/common/userDataSyncResourceProvider.ts` | U-N / T-E+T-C | 149: Mcp; 228: Mcp; 250: Mcp; 521: 'mcp.json'; 528: 'mcp.json' |
| `vscode/src/vs/platform/userDataSync/common/userDataSyncService.ts` | U-N / T-E+T-C | 30: McpSynchroniser; 743: Mcp, McpSynchroniser; 896: Mcp |
| `vscode/src/vs/platform/userDataSync/test/common/mcpSync.test.ts` | U-T / T-C | 13: McpSynchroniser; 17: McpSync; 22: McpSynchroniser; 33: Mcp, McpSynchroniser; 42: Mcp; 55: Mcp; 60: Mcp; 86: Mcp; 111: Mcp; 141: Mcp; 160: Mcp; 172: Mcp; 196: Mcp; 209: Mcp; 234: Mcp; 248: Mcp; 273: Mcp; 294: Mcp; 328: Mcp; 348: Mcp; 387: Mcp; 408: Mcp; 436: Mcp; 457: Mcp; 478: Mcp; 489: Mcp; 504: Mcp; 517: Mcp; 541: Mcp |
| `vscode/src/vs/platform/userDataSync/test/common/promptsSync.test.ts` | U-T / T-C | 421: 'chat.prompt.md'; 429: 'chat.prompt.md'; 441: 'chat.prompt.md' |
| `vscode/src/vs/platform/window/common/window.ts` | U-N / T-E+T-C | 111: ChatTitleBar; 112: ChatHandoff; 123: ChatTitleBar; 124: ChatHandoff |
| `vscode/src/vs/sessions/browser/chatDashboardService.ts` | D-S / T-C | 10: IChatDashboardService; 12: IChatDashboardService; 22: IChatDashboardService; 27: IChatDashboardService |
| `vscode/src/vs/sessions/browser/dnd.ts` | D-S / T-C | 119: IChat |
| `vscode/src/vs/sessions/browser/parts/chatCompositeBar.ts` | D-S / T-C | 32: ChatInteractivity, IChat; 39: '../../common/agentHostSessionsProvider.js'; 44: IChatTab; 45: IChat; 51: ChatCompositeBar; 52: ChatGroupView; 56: IChatCompositeBarDelegate; 66: IChat; 98: IChatCompositeBarDelegate; 101: ChatCompositeBar; 111: IChatTab; 116: IChatTab; 117: IChatCompositeBarDelegate; 160: Chats; 171: Chat; 215: ChatCompositeBar; 222: ChatCompositeBar; 236: IChatCompositeBarDelegate; 275: IChat; 298: IChat; 325: ChatInteractivity; 398: IChatTab; 458: Chat; 483: Chat; 538: IChat; 551: IChatTab |
| `vscode/src/vs/sessions/browser/parts/chatGroupDropTarget.ts` | D-S / T-C | 18: ChatDropZone; 24: IChatGroupDropTargetDelegate; 33: ChatDropZone; 39: ChatGroupDropOverlay; 46: ChatDropZone; 56: ChatDropZone; 68: ChatGroupDropOverlay; 164: ChatDropZone; 183: ChatDropZone; 226: ChatGroupsView; 229: ChatGroupDropTarget; 231: ChatGroupDropOverlay; 237: IChatGroupDropTargetDelegate; 246: ChatGroupDropOverlay; 292: ChatGroupDropOverlay; 295: ChatDropZone |
| `vscode/src/vs/sessions/browser/parts/chatGroupsView.ts` | D-S / T-C | 19: IChat; 22: IChatViewOptions; 23: ChatGroupView, IChatGroupContext; 24: ChatDropZone, ChatGroupDropTarget, IChatGroupDropTargetDelegate; 29: ChatGroupView; 34: IChat; 35: IChat; 60: Chats; 70: ChatGroupsView; 80: ChatGroupView; 89: IChatViewOptions; 122: IChatViewOptions; 163: IChatGroupDropTargetDelegate; 170: ChatGroupDropTarget; 176: ChatGroupView; 191: ChatGroupView; 198: ChatGroupView; 207: ChatGroupView; 264: IChat; 267: IChat; 290: ChatGroupView; 297: IChatGroupContext; 426: ChatDropZone; 485: ChatDropZone; 585: ChatDropZone; 685: ChatGroupView; 775: ChatDropZone; 880: ChatGroupsView; 905: ChatGroupsView |
| `vscode/src/vs/sessions/browser/parts/chatView.ts` | D-S / T-C | 15: IChat; 21: ChatViewKind; 26: IChatViewOptions; 43: ChatView; 45: IChatViewFactory; 70: ChatViewKind; 74: ChatView; 77: IChat; 116: ChatView |
| `vscode/src/vs/sessions/browser/parts/customViewNode.ts` | D-S / T-C | 19: ChatPillActionViewItem; 84: ChatPillActionViewItem |
| `vscode/src/vs/sessions/browser/parts/mobile/contributions/mobileChangesView.ts` | D-S / T-C | 61: IChatSessionFileChange2; 62: IChatSessionFileChange |
| `vscode/src/vs/sessions/browser/parts/mobile/mobileChatShell.css` | D-S / T-C | 261: Chat; 327: Chat; 336: Chat; 647: Chat |
| `vscode/src/vs/sessions/browser/parts/sessionHeader.ts` | D-S / T-C | 34: ChatCompositeBar; 269: Chat |
| `vscode/src/vs/sessions/browser/parts/sessionView.ts` | D-S / T-C | 17: IChatViewOptions; 18: ChatGroupsView; 27: IChatViewFactory; 33: IChatViewOptions; 41: ChatGroupsView; 59: ChatGroupsView; 89: IChatViewFactory; 129: ChatGroupsView |
| `vscode/src/vs/sessions/browser/sessionConversationGroups.ts` | D-S / T-C | 10: ChatOriginKind, IChat; 39: IChat; 40: ChatOriginKind; 41: ChatOriginKind |
| `vscode/src/vs/sessions/browser/workbench.ts` | D-S / T-C | 1630: Chat; 1738: Chat |
| `vscode/src/vs/sessions/common/contextkeys.ts` | D-S / T-C | 33: Chats; 34: Chats; 37: 's active chat can be closed (hidden) from the tab strip, i.e. it is not the main chat. Includes read-only subagent chats. Used to scope the close-chat keybinding so it closes the tab instead of the session"; 57: Chat; 100: 'agentHostSessionTypesAvailable', AgentHostSessionTypesAvailableContext |
| `vscode/src/vs/sessions/common/theme.ts` | D-S / T-C | 109: Chat |
| `vscode/src/vs/sessions/contrib/accountMenu/browser/media/accountWidget.css` | D-S / T-C | 77: Chat |
| `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackEditorOverlay.ts` | D-S / T-C | 136: 'chat.agentFeedback.editorOverlay' |
| `vscode/src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackPRReviewSeeder.ts` | D-S / T-C | 10: '../../../common/agentHostSessionsProvider.js' |
| `vscode/src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackPRReviewSeeder.test.ts` | D-S / T-C | 14: '../../../../common/agentHostSessionsProvider.js' |
| `vscode/src/vs/sessions/contrib/aiCustomizationTreeView/browser/aiCustomizationTreeView.ts` | D-S / T-C | 27: Chat; 38: Chat |
| `vscode/src/vs/sessions/contrib/automations/browser/automationLeaderElection.ts` | D-S / T-C | 13: 'chat.automations.leader' |
| `vscode/src/vs/sessions/contrib/automations/browser/media/automationDialog.css` | D-S / T-C | 227: ChatInputPart; 321: ChatInput |
| `vscode/src/vs/sessions/contrib/automations/common/automationStorageService.ts` | D-S / T-C | 8: 'chat.automations.ledger' |
| `vscode/src/vs/sessions/contrib/automations/test/browser/automationLeaderElection.test.ts` | D-S / T-C | 84: 'chat.automations.leader'; 96: 'chat.automations.leader'; 115: 'chat.automations.leader'; 131: 'chat.automations.leader'; 147: 'chat.automations.leader' |
| `vscode/src/vs/sessions/contrib/changes/browser/changesActions.ts` | D-S / T-C | 29: ChatPillActionViewItem; 252: ChatPillActionViewItem |
| `vscode/src/vs/sessions/contrib/chat/browser/media/chatView.css` | D-S / T-C | 6: Chat; 117: Chat; 135: Chat |
| `vscode/src/vs/sessions/contrib/chat/browser/media/chatWidget.css` | D-S / T-C | 78: Chat; 174: Chat |
| `vscode/src/vs/sessions/contrib/chat/browser/promptTemplatePlaceholder.ts` | D-S / T-C | 16: 'sessions.chat.replacePromptTemplatePlaceholder' |
| `vscode/src/vs/sessions/contrib/chat/browser/repoPicker.ts` | D-S / T-C | 17: 'github.copilot.chat.cloudSessions.openRepository' |
| `vscode/src/vs/sessions/contrib/chat/browser/sessionBackgroundActivitiesControl.ts` | D-S / T-C | 11: IChatDropdownPillOptions; 12: IChatPillEntry, IChatPillSection; 14: ChatOriginKind, IChat; 21: IChatDropdownPillOptions; 37: IChatPillSection; 45: IChat; 74: IChat, IChatPillEntry; 77: ChatOriginKind; 84: IChat, IChatPillEntry |
| `vscode/src/vs/sessions/contrib/chat/browser/sessionBrowsersControl.ts` | D-S / T-C | 13: IChatDropdownPillOptions; 14: IChatPillEntry, IChatPillSection; 16: ChatOriginKind, IChat; 21: IChatDropdownPillOptions; 50: IChatPillSection; 63: IChat; 128: IChat; 131: ChatOriginKind; 149: IChat, IChatPillEntry; 158: IChat; 169: IChat |
| `vscode/src/vs/sessions/contrib/chat/browser/sessionMetadataPills.ts` | D-S / T-C | 16: ChatPillActionViewItem, IChatPill; 26: IChatPill; 70: ChatPillActionViewItem; 72: IChatPill |
| `vscode/src/vs/sessions/contrib/chat/browser/sessionsChatAccessibilityHelp.ts` | D-S / T-C | 37: "When you first open a session created in another application, a banner appears at the top of the chat. Use Tab to reach its external-session picker, choose an option, and activate Save. The Close action dismisses the banner without changing the setting. Saving or closing permanently dismisses the banner."; 42: Chat; 48: Chat, Chats; 54: "When dictation is configured, dictate your message into the input{0}. Tap to start and stop, or hold to dictate only while pressed. If the speech-to-text model is still preparing, activate the dictation control again to cancel.", '<keybinding:sessions.action.chat.toggleDictation>', 'sessionsChat.dictation'; 56: "To choose a microphone or turn off dictation or Voice Mode, focus the microphone button in the input toolbar and open its context menu (for example Shift+F10)."; 61: Chat; 62: 's edge to open the subagent beside the current chat. With the keyboard, focus a subagent pill and press Alt+Enter to open it beside the current chat."; 63: Chats; 64: Chats; 65: Chat; 67: '<keybinding:workbench.action.chat.find>', '<keybinding:workbench.action.chat.findNext>', '<keybinding:workbench.action.chat.findPrevious>', Chat; 77: '<keybinding:workbench.action.chat.focusAgentSessionsViewer>', Chat; 78: Chat |
| `vscode/src/vs/sessions/contrib/chat/browser/sessionsChatHistory.ts` | D-S / T-C | 6: 'chat.agentSessions.scopedInputHistory' |
| `vscode/src/vs/sessions/contrib/chat/browser/sideChatOrchestration.ts` | D-S / T-C | 9: IChat; 18: IChat; 39: IChat |
| `vscode/src/vs/sessions/contrib/chat/browser/worktreeCreatedTaskDispatcher.ts` | D-S / T-C | 11: '../../../common/agentHostSessionsProvider.js'; 23: 'chat.agentHost.runWorktreeCreatedTasks' |
| `vscode/src/vs/sessions/contrib/chat/test/browser/sessionBackgroundActivitiesControl.test.ts` | D-S / T-C | 12: ChatOriginKind, IChat; 31: IChat; 36: IChat; 40: ChatOriginKind |
| `vscode/src/vs/sessions/contrib/chat/test/browser/sessionBrowsersControl.test.ts` | D-S / T-C | 15: ChatOriginKind, IChat; 41: IChat; 46: IChat; 50: ChatOriginKind; 52: IChat |
| `vscode/src/vs/sessions/contrib/chat/test/browser/sessionsTaskService.test.ts` | D-S / T-C | 19: ChatInteractivity, IChat; 37: IChat; 49: ChatInteractivity; 53: IChat |
| `vscode/src/vs/sessions/contrib/chat/test/browser/workbenchSessionTaskRunner.test.ts` | D-S / T-C | 18: IChat; 36: IChat |
| `vscode/src/vs/sessions/contrib/chat/test/browser/worktreeCreatedTaskDispatcher.test.ts` | D-S / T-C | 17: '../../../../common/agentHostSessionsProvider.js'; 18: IChat; 55: IChat |
| `vscode/src/vs/sessions/contrib/chatDebug/browser/chatDebug.contribution.ts` | D-S / T-C | 39: Chat; 74: Chat |
| `vscode/src/vs/sessions/contrib/configuration/browser/configuration.contribution.ts` | D-S / T-C | 41: 'chat.customizationsMenu.userStoragePath'; 42: 'github.copilot.chat.claudeCode.enabled' |
| `vscode/src/vs/sessions/contrib/editor/test/browser/editor.contribution.test.ts` | D-S / T-C | 187: Chats |
| `vscode/src/vs/sessions/contrib/github/browser/issueActions.ts` | D-S / T-C | 27: ChatPillActionViewItem; 123: ChatPillActionViewItem |
| `vscode/src/vs/sessions/contrib/github/browser/pullRequestActions.ts` | D-S / T-C | 29: ChatPillActionViewItem; 185: ChatPillActionViewItem |
| `vscode/src/vs/sessions/contrib/github/test/browser/githubContribution.test.ts` | D-S / T-C | 23: ChatInteractivity, IChat, IChatCheckpoints; 312: IChat; 313: IChat; 348: IChatCheckpoints; 350: IChat; 363: ChatInteractivity; 368: IChat |
| `vscode/src/vs/sessions/contrib/github/test/browser/githubReferenceActionViewItems.test.ts` | D-S / T-C | 12: ChatPillActionViewItem; 35: ChatPillActionViewItem |
| `vscode/src/vs/sessions/contrib/layout/browser/singlePane/singlePaneDockedTabsCoordinator.ts` | D-S / T-C | 149: Chat |
| `vscode/src/vs/sessions/contrib/layout/browser/singlePane/singlePaneQuickChatStrategy.ts` | D-S / T-C | 19: Chat |
| `vscode/src/vs/sessions/contrib/layout/test/browser/desktopSessionLayoutController.test.ts` | D-S / T-C | 1929: Chat; 2032: Chat |
| `vscode/src/vs/sessions/contrib/layout/test/browser/layoutControllerTestUtils.ts` | D-S / T-C | 33: ChatInteractivity, IChat; 65: IChat; 78: ChatInteractivity |
| `vscode/src/vs/sessions/contrib/layout/test/browser/singlePaneStrategies.test.ts` | D-S / T-C | 298: Chat; 339: Chat; 383: Chat; 415: Chat |
| `vscode/src/vs/sessions/contrib/onboardingTours/browser/agentHostReadinessContext.ts` | D-S / T-C | 9: '../../../common/agentHostSessionsProvider.js'; 10: AgentHostSessionTypesAvailableContext; 13: AgentHostReadinessContextContribution; 14: 'sessions.contrib.onboardingTours.agentHostReadinessContext'; 23: AgentHostSessionTypesAvailableContext; 35: AgentHostReadinessContextContribution |
| `vscode/src/vs/sessions/contrib/onboardingTours/browser/newSessionViewV3Prompt.ts` | D-S / T-C | 22: '../../../common/agentHostSessionsProvider.js'; 77: AgentHostRepositoryResolution; 750: AgentHostRepositoryResolution; 754: AgentHostRepositoryResolution |
| `vscode/src/vs/sessions/contrib/onboardingTours/browser/onboardingTours.contribution.ts` | D-S / T-C | 11: './agentHostReadinessContext.js' |
| `vscode/src/vs/sessions/contrib/onboardingTours/test/browser/agentHostReadinessContext.test.ts` | D-S / T-C | 13: AgentHostSessionTypesAvailableContext; 16: '../../browser/agentHostReadinessContext.js', AgentHostReadinessContextContribution; 18: AgentHostReadinessContextContribution; 29: AgentHostReadinessContextContribution; 30: AgentHostSessionTypesAvailableContext; 34: AgentHostSessionTypesAvailableContext; 38: AgentHostSessionTypesAvailableContext; 42: AgentHostSessionTypesAvailableContext |
| `vscode/src/vs/sessions/contrib/onboardingTours/test/browser/newSessionViewV2Tour.test.ts` | D-S / T-C | 9: AgentHostSessionTypesAvailableContext; 91: AgentHostSessionTypesAvailableContext |
| `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSessionBranchActions.ts` | D-S / T-C | 11: '../../../../common/agentHostSessionsProvider.js'; 19: 'sessionsViewPane.agentHost.copySessionBranchName' |
| `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentHostSettings.contribution.ts` | D-S / T-C | 19: './agentHostSettingsFileSystemProvider.js', AgentHostSettingsFileSystemProvider, AgentHostSettingsSchemaRegistrar; 20: '../../../../common/agentHostSessionsProvider.js'; 23: AgentHostSettingsFileSystemProvider; 26: AgentHostSettingsContribution; 28: 'sessions.contrib.agentHostSettingsContribution'; 37: AgentHostSettingsSchemaRegistrar; 38: AgentHostSettingsFileSystemProvider; 44: 'agentHostSettings.label'; 51: AgentHostSettingsContribution |
| `vscode/src/vs/sessions/contrib/providers/agentHost/browser/agentSessionSettings.contribution.ts` | D-S / T-C | 19: '../../../../common/agentHostSessionsProvider.js' |
| `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/agentHostSkillButtons.test.ts` | D-S / T-C | 17: ChatInteractivity, IChat; 22: '../../browser/agentHostSkillButtons.js'; 41: ChatInteractivity; 45: IChat; 112: 'agentHostSkillButtons - IsAgentHostSession context key'; 172: 'agentHostSkillButtons - menu registration' |
| `vscode/src/vs/sessions/contrib/providers/agentHost/test/browser/mobileChatPhoneInputTarget.test.ts` | D-S / T-C | 11: IChat; 22: IChat |
| `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/branchPicker.ts` | D-S / T-C | 44: 'github.copilot.chat.cli.isolationOption.enabled'; 47: 'github.copilot.chat.cli.isolationOption.enabled'; 48: 'github.copilot.chat.cli.isolationOption.enabled' |
| `vscode/src/vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessions.contribution.ts` | D-S / T-C | 23: Chat |
| `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/hostFilter.contribution.ts` | D-S / T-C | 18: '../../../../services/agentHostFilter/common/agentHostFilter.js', IAgentHostFilterService; 22: 'sessions.agentHostFilter.pick'; 30: AgentHostShortcutsWidget; 39: 'agentHostFilter.pick'; 82: AgentHostFilterContribution; 84: 'sessions.contrib.agentHostFilter'; 87: IAgentHostFilterService; 126: AgentHostFilterContribution; 127: AgentHostFilterContribution |
| `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/hostFilterActionViewItem.ts` | D-S / T-C | 23: '../../../../services/agentHostFilter/common/agentHostFilter.js', AgentHostFilterConnectionStatus, IAgentHostFilterEntry, IAgentHostFilterService; 33: AgentHostShortcutsWidget; 58: IAgentHostFilterService; 272: 'agentHostFilter.searching'; 273: 'agentHostFilter.none'; 324: 'agentHostFilter.aria.selected'; 326: 'agentHostFilter.aria.retry'; 327: 'agentHostFilter.aria.none'; 331: 'agentHostFilter.hover.searching'; 332: 'agentHostFilter.hover.retry'; 333: 'agentHostFilter.hover'; 346: 'agentHostFilter.aria.singleSelected'; 347: 'agentHostFilter.aria.none'; 354: IAgentHostFilterEntry; 373: 'agentHostFilter.hover.searching'; 374: 'agentHostFilter.hover.retry'; 400: AgentHostFilterConnectionStatus; 403: 'agentHostFilter.status.connected'; 405: AgentHostFilterConnectionStatus; 408: 'agentHostFilter.status.connecting'; 410: AgentHostFilterConnectionStatus; 414: 'agentHostFilter.status.disconnected'; 447: AgentHostFilterConnectionStatus; 478: AgentHostFilterConnectionStatus; 480: AgentHostFilterConnectionStatus; 481: 'agentHostFilter.hostConnecting'; 482: 'agentHostFilter.hostDisconnected' |
| `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/mobileHostFilterActionViewItem.ts` | D-S / T-C | 17: '../../../../services/agentHostFilter/common/agentHostFilter.js', AgentHostFilterConnectionStatus, IAgentHostFilterEntry, IAgentHostFilterService; 38: IAgentHostFilterService; 84: 'agentHostFilter.sheet.aria'; 109: 'agentHostFilter.sheet.title'; 111: 'agentHostFilter.sheet.close'; 123: 'agentHostFilter.sheet.subtitle'; 185: 'agentHostFilter.sheet.searching'; 186: 'agentHostFilter.sheet.empty'; 191: 'agentHostFilter.sheet.available'; 202: IAgentHostFilterEntry; 215: AgentHostFilterConnectionStatus; 218: AgentHostFilterConnectionStatus; 247: AgentHostFilterConnectionStatus; 249: AgentHostFilterConnectionStatus; 250: 'agentHostFilter.sheet.status.connected'; 251: AgentHostFilterConnectionStatus; 252: 'agentHostFilter.sheet.status.connecting'; 253: AgentHostFilterConnectionStatus; 255: 'agentHostFilter.sheet.status.disconnected'; 262: 'agentHostFilter.sheet.rediscover.aria'; 274: 'agentHostFilter.sheet.rediscovering'; 275: 'agentHostFilter.sheet.rediscover' |
| `vscode/src/vs/sessions/contrib/sessions/browser/agentHostShortcutsWidget.ts` | D-S / T-C | 6: './media/agentHostToolbar.css'; 15: IAgentHostShortcutsWidgetOptions; 27: AgentHostShortcutsWidget; 31: IAgentHostShortcutsWidgetOptions; 39: IAgentHostShortcutsWidgetOptions |
| `vscode/src/vs/sessions/contrib/sessions/browser/media/sessionsList.css` | D-S / T-C | 443: Chats |
| `vscode/src/vs/sessions/contrib/sessions/browser/sessions.contribution.ts` | D-S / T-C | 68: Chats |
| `vscode/src/vs/sessions/contrib/sessions/browser/sessionsActions.ts` | D-S / T-C | 30: '../../../common/agentHostSessionsProvider.js'; 34: ChatOriginKind, IChat; 365: Chat; 385: Chat; 405: Chat; 420: Chat; 435: Chat; 450: Chat; 526: Chat; 533: Chat; 540: Chat; 605: Chat; 625: Chat; 643: IChatTabContext; 645: IChatTabContext; 647: IChat; 654: Chat; 678: IChatTabContext; 706: Chats; 746: Chat; 758: Chat; 796: Chat; 823: Chat; 853: Chat; 867: ChatsPickerScopeContext; 882: IChatPickItem; 883: IChat; 886: IChat, IChatPickItem; 887: Chat; 896: Chats; 905: ChatOriginKind; 914: IChatPickItem; 930: IChatPickItem; 968: Chat; 991: Chat; 997: ChatsPickerScopeContext; 1012: Chat; 1018: ChatsPickerScopeContext; 1066: Chat; 1272: Chats; 1313: IChat; 1315: Chat; 1350: Chat; 1351: Chat; 1367: Chats |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/agentHostShortcutsWidget.test.ts` | D-S / T-C | 21: '../../browser/agentHostShortcutsWidget.js', AgentHostShortcutsWidget; 67: AgentHostShortcutsWidget; 71: AgentHostShortcutsWidget |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionDetails.test.ts` | D-S / T-C | 45: Chat; 60: Chat |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsActions.test.ts` | D-S / T-C | 18: Chat; 29: Chat; 36: Chat; 47: Chat; 69: Chat, Chats |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsLifecycleTracker.test.ts` | D-S / T-C | 13: IChat; 51: IChat; 52: IChat |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsReopenKeybinding.test.ts` | D-S / T-C | 24: Chat; 52: Chat |
| `vscode/src/vs/sessions/contrib/sessions/test/browser/sessionsTelemetry.contribution.test.ts` | D-S / T-C | 23: ChatInteractivity, IChat; 86: Chat; 96: ChatInteractivity; 99: IChat |
| `vscode/src/vs/sessions/contrib/workspace/test/browser/workspaceFolderManagement.test.ts` | D-S / T-C | 19: ChatInteractivity, IChat; 27: Chat; 37: ChatInteractivity; 40: IChat |
| `vscode/src/vs/sessions/services/agentHostFilter/common/agentHostFilter.ts` | D-S / T-C | 13: AgentHostFilterConnectionStatus; 22: IAgentHostFilterEntry; 30: AgentHostFilterConnectionStatus; 33: 'agentHostFilterService', IAgentHostFilterService; 41: IAgentHostFilterService; 54: IAgentHostFilterEntry |
| `vscode/src/vs/sessions/services/chatView/browser/chatViewFactory.ts` | D-S / T-C | 7: IChatViewOptions; 9: IChatViewFactory; 17: IChatViewFactory; 25: IChatViewOptions |
| `vscode/src/vs/sessions/services/sessions/browser/closedItemHistory.ts` | D-S / T-C | 17: Chat; 23: Chat; 79: Chat; 128: Chat |
| `vscode/src/vs/sessions/services/sessions/browser/sessionsService.ts` | D-S / T-C | 20: ChatInteractivity, ChatOriginKind, IChat; 80: Chats; 195: IChat; 548: ChatInteractivity; 733: IChat; 753: IChat; 774: IChat; 781: ChatOriginKind; 950: Chat; 1035: Chat; 1075: IChat |
| `vscode/src/vs/sessions/services/sessions/browser/visibleSessions.ts` | D-S / T-C | 11: ChatInteractivity, ChatOriginKind, IChat; 32: IChat; 33: IChat; 53: IChat; 54: IChat; 55: IChat; 56: IChat; 61: IChat; 65: IChat; 85: ChatOriginKind; 99: ChatInteractivity; 116: ChatOriginKind; 128: IChat; 132: IChat; 141: ChatOriginKind; 172: IChat; 174: ChatOriginKind; 202: IChat; 204: ChatInteractivity; 206: ChatOriginKind; 210: IChat; 382: IChat; 744: IChat; 752: IChat; 760: IChat |
| `vscode/src/vs/sessions/services/sessions/common/sessionContextKeys.ts` | D-S / T-C | 38: ChatOriginKind; 205: Chats; 209: ChatOriginKind; 234: ChatOriginKind; 238: ChatOriginKind |
| `vscode/src/vs/sessions/services/sessions/common/sessionsManagement.ts` | D-S / T-C | 11: IChat; 84: ChatModeKind; 91: ChatPermissionLevel; 150: IChat; 174: IChat; 186: IChat; 189: IChat; 192: IChat; 199: IChat; 221: IChatSessionItem; 257: IChat; 376: Chat; 431: IChat; 442: IChat; 454: IChat; 507: IChat |
| `vscode/src/vs/sessions/services/sessions/test/browser/sessionGroupsService.test.ts` | D-S / T-C | 15: IChat; 40: IChat; 41: IChat |
| `vscode/src/vs/sessions/services/sessions/test/browser/sessionNavigation.test.ts` | D-S / T-C | 16: ChatInteractivity, IChat; 25: Chat; 35: ChatInteractivity; 40: IChat; 44: Chat; 54: ChatInteractivity; 60: IChat; 122: IChat; 129: IChat; 146: IChat; 149: IChat; 170: IChat; 220: IChat; 221: IChat; 222: IChat; 229: IChat; 560: IChat |
| `vscode/src/vs/sessions/services/sessions/test/browser/sessionsListModelService.test.ts` | D-S / T-C | 13: IChat; 40: IChat; 41: IChat |
| `vscode/src/vs/sessions/services/sessions/test/browser/visibleSessions.test.ts` | D-S / T-C | 15: ChatInteractivity, ChatOriginKind, IChat; 17: IChat; 20: Chat; 30: ChatInteractivity; 976: IChat; 980: ChatInteractivity, IChat; 984: IChat; 985: IChat; 989: IChat; 993: IChat; 1138: ChatInteractivity; 1139: ChatInteractivity; 1140: ChatInteractivity; 1155: ChatOriginKind, IChat; 1165: IChat; 1175: ChatOriginKind; 1186: ChatOriginKind; 1205: ChatOriginKind; 1219: ChatOriginKind; 1231: ChatOriginKind, IChat; 1241: IChat; 1253: Chat; 1265: ChatOriginKind; 1273: ChatOriginKind; 1284: ChatOriginKind; 1292: IChat; 1321: ChatOriginKind, IChat; 1331: IChat; 1333: IChat; 1340: ChatOriginKind; 1349: ChatOriginKind; 1366: ChatOriginKind; 1392: ChatOriginKind, IChat; 1402: IChat; 1403: IChat; 1411: ChatOriginKind; 1412: ChatOriginKind; 1433: ChatOriginKind; 1434: ChatOriginKind; 1457: IChat |
| `vscode/src/vs/sessions/test/browser/chatCompositeBar.test.ts` | D-S / T-C | 19: ChatCompositeBar, IChatCompositeBarDelegate; 25: ChatInteractivity, IChat; 45: IChat; 47: IChat; 52: ChatInteractivity; 56: IChat; 62: IChat; 63: IChat; 64: IChat; 65: IChat; 67: IChat; 68: IChat; 76: IChatCompositeBarHarness; 81: ChatCompositeBar; 86: IChatCompositeBarHarness; 91: Chat; 92: Chat; 106: ChatCompositeBar; 107: IChatCompositeBarDelegate; 125: ChatCompositeBar; 142: Chat; 143: Chat; 149: Chat |
| `vscode/src/vs/sessions/test/browser/chatGroupsView.test.ts` | D-S / T-C | 17: ChatViewKind; 18: ChatGroupsView; 19: IChatViewFactory; 23: ChatInteractivity, ChatOriginKind, IChat; 30: ChatViewKind; 49: IChatViewFactory; 60: ChatViewKind; 67: IChat; 69: IChat; 71: ChatOriginKind; 75: ChatInteractivity; 83: IChat; 84: IChat; 85: IChat; 86: IChat; 87: IChat; 88: IChat; 90: IChat; 96: IChat; 148: IChatGroupsHarness; 152: ChatGroupsView; 155: IChatGroupsHarness; 160: IChatViewFactory; 171: ChatGroupsView; 178: ChatGroupsView; 294: Chat; 378: Chat; 379: Chat |
| `vscode/src/vs/sessions/test/browser/sessionConversationGroups.test.ts` | D-S / T-C | 12: ChatOriginKind, IChat, IChatOrigin; 14: IChat, IChatOrigin; 15: IChat; 28: ChatOriginKind; 29: ChatOriginKind; 30: ChatOriginKind |
| `vscode/src/vs/sessions/test/browser/sessionHeader.test.ts` | D-S / T-C | 21: IChat; 43: IChat; 44: Chat; 56: IChat; 57: IChat; 58: IChat; 59: IChat; 60: IChat; 61: IChat |
| `vscode/src/vs/sessions/test/browser/workbench.test.ts` | D-S / T-C | 2639: Chat |
| `vscode/src/vs/sessions/test/common/agentHostSessionsProvider.test.ts` | D-S / T-C | 8: '../../common/agentHostSessionsProvider.js'; 9: ChatInteractivity; 56: ChatInteractivity; 57: ChatInteractivity; 58: ChatInteractivity; 59: ChatInteractivity; 60: ChatInteractivity; 61: ChatInteractivity; 64: ChatInteractivity; 65: ChatInteractivity; 66: ChatInteractivity; 67: ChatInteractivity; 68: ChatInteractivity; 69: ChatInteractivity |
| `vscode/src/vs/sessions/test/e2e/extensions/sessions-e2e-mock/extension.js` | D-S / T-C | 107: 'github.copilot.chat.createPullRequestCopilotCLIAgentSession.createPR'; 116: 'github.copilot.chat.openPullRequestCopilotCLIAgentSession.openPR'; 125: 'github.copilot.chat.mergeCopilotCLIAgentSessionChanges.merge'; 134: 'github.copilot.chat.mergeCopilotCLIAgentSessionChanges.mergeAndSync'; 143: 'github.copilot.chat.applyCopilotCLIAgentSessionChanges.apply'; 152: 'github.copilot.chat.checkoutPullRequestReroute'; 161: 'github.copilot.chat.updateCopilotCLIAgentSessionChanges.update' |
| `vscode/src/vs/sessions/test/e2e/extensions/sessions-e2e-mock/package.json` | D-S / T-C | 29: "github.copilot.chat.applyCopilotCLIAgentSessionChanges.apply"; 34: "github.copilot.chat.checkoutPullRequestReroute"; 39: "github.copilot.chat.openPullRequestCopilotCLIAgentSession.openPR"; 44: "github.copilot.chat.mergeCopilotCLIAgentSessionChanges.merge"; 49: "github.copilot.chat.mergeCopilotCLIAgentSessionChanges.mergeAndSync"; 54: "github.copilot.chat.createPullRequestCopilotCLIAgentSession.createPR"; 59: "github.copilot.chat.updateCopilotCLIAgentSessionChanges.update"; 67: "github.copilot.chat.applyCopilotCLIAgentSessionChanges.apply"; 72: "github.copilot.chat.checkoutPullRequestReroute"; 77: "github.copilot.chat.openPullRequestCopilotCLIAgentSession.openPR"; 84: "github.copilot.chat.mergeCopilotCLIAgentSessionChanges.merge"; 89: "github.copilot.chat.mergeCopilotCLIAgentSessionChanges.mergeAndSync"; 94: "github.copilot.chat.createPullRequestCopilotCLIAgentSession.createPR"; 99: "github.copilot.chat.updateCopilotCLIAgentSessionChanges.update" |
| `vscode/src/vs/sessions/test/e2e/scenarios/generated/01-chat-response.commands.json` | D-S / T-C | 8: Chat; 15: Chat |
| `vscode/src/vs/sessions/test/e2e/scenarios/generated/02-chat-with-changes.commands.json` | D-S / T-C | 2: Chat; 9: Chat; 16: Chat |
| `vscode/src/vs/sessions/test/e2e/scenarios/generated/03-session-in-sidebar.commands.json` | D-S / T-C | 9: Chat; 16: Chat |
| `vscode/src/vs/sessions/test/e2e/scenarios/generated/04-navigate-sessions.commands.json` | D-S / T-C | 8: Chat; 15: Chat; 34: Chat; 41: Chat |
| `vscode/src/vs/sessions/test/e2e/scenarios/generated/05-full-workflow.commands.json` | D-S / T-C | 8: Chat; 105: Chat |
| `vscode/src/vs/workbench/api/browser/mainThreadLanguageFeatures.ts` | U-A / T-A+T-C | 40: IAiEditTelemetryService; 1335: IAiEditTelemetryService |
| `vscode/src/vs/workbench/api/common/configurationExtensionPoint.ts` | U-A / T-A+T-C | 331: 'agentHost', 'config.property.agentHost.unsupported'; 436: 'workspaceConfig.mcp.description' |
| `vscode/src/vs/workbench/api/common/extHostEditorTabs.ts` | U-A / T-A+T-C | 14: ChatEditorTabInput; 24: ChatEditorTabInput; 101: ChatEditorInput; 102: ChatEditorTabInput |
| `vscode/src/vs/workbench/api/test/browser/extHostAuthentication.test.ts` | U-T / T-C | 94: 'https://mcp.example.com'; 96: 'https://mcp.example.com'; 98: 'https://mcp.example.com/token'; 100: 'https://mcp.example.com/resource' |
| `vscode/src/vs/workbench/api/test/browser/extHostDocumentData.test.perf-data.ts` | U-T / T-C | 6: SpeechGrammar, SpeechGrammarList, SpeechRecognition, SpeechRecognitionAlternative, SpeechRecognitionEvent, SpeechRecognitionResult, SpeechRecognitionResultList, SpeechSynthesis, SpeechSynthesisErrorEvent, SpeechSynthesisEvent, SpeechSynthesisUtterance, SpeechSynthesisVoice |
| `vscode/src/vs/workbench/api/test/browser/extHostTypeConverter.test.ts` | U-T / T-C | 9: ChatAgentResult, LanguageModelChatMessage2; 76: LanguageModelChatMessage2; 81: LanguageModelToolResultPart; 82: LanguageModelTextPart; 83: LanguageModelDataPart; 85: LanguageModelChatMessage2; 87: LanguageModelChatMessage2; 88: LanguageModelToolResultPart; 89: LanguageModelDataPart; 100: LanguageModelDataPart; 181: ChatAgentResult; 185: LanguageModelDataPart; 187: LanguageModelDataPart; 190: ChatAgentResult; 191: LanguageModelDataPart; 193: LanguageModelDataPart; 198: LanguageModelDataPart; 200: LanguageModelDataPart; 205: ChatAgentResult; 206: LanguageModelDataPart; 208: LanguageModelDataPart; 213: LanguageModelDataPart; 215: LanguageModelDataPart; 220: ChatAgentResult |
| `vscode/src/vs/workbench/api/test/browser/extHostTypes.test.ts` | U-T / T-C | 786: LanguageModelChatMessage, LanguageModelChatMessageRole; 789: LanguageModelTextPart |
| `vscode/src/vs/workbench/browser/actions/helpActions.ts` | U-N / T-E+T-C | 353: 'workbench.action.chat.open' |
| `vscode/src/vs/workbench/browser/chatChangesPill.ts` | U-N / T-E+T-C | 16: ChatPillActionViewItemBase; 19: IChatChangesStats; 25: IChatChangesStats; 27: IChatChangesStats; 36: ChatChangesPillActionViewItem, ChatPillActionViewItemBase; 46: IChatChangesStats; 78: IChatChangesStats |
| `vscode/src/vs/workbench/browser/chatDropdownPill.ts` | U-N / T-E+T-C | 20: ChatPillActionViewItem, IChatPill, IChatPillEntry, IChatPillSection; 21: ChatResourcePillActionViewItem; 25: ChatDropdownPillActionViewItem; 26: IChatDropdownPillOptions; 49: ChatDropdownPillActionViewItem, ChatPillActionViewItem; 57: IChatPillSection; 58: IChatDropdownPillOptions; 102: IChatPillEntry; 161: IChatPillEntry; 176: IChatPillEntry; 196: IChatPillEntry; 236: IChatPillSection; 237: IChatDropdownPillOptions; 240: IChatPill; 241: IChatPillEntry; 250: IChatPill; 251: ChatResourcePillActionViewItem; 252: ChatDropdownPillActionViewItem |
| `vscode/src/vs/workbench/browser/chatPills.ts` | U-N / T-E+T-C | 26: ChatPillsWidget; 29: IChatPill; 34: ChatPillsWidget; 35: IChatPillsModel; 36: IChatPill; 41: IChatPillEntry; 61: IChatPillSection; 63: IChatPillEntry; 66: IChatPillEntry, IChatPillSection; 70: IChatPillsWidgetOptions; 83: ChatPillsWidget; 91: IChatPill; 92: IChatPill; 93: ChatPillActionViewItemBase; 96: IChatPillsModel; 97: IChatPillsWidgetOptions; 104: Chat; 108: ChatPillActionViewItem; 109: ChatPillActionViewItemBase; 144: IChatPill; 154: 'chat.list.background'; 161: ChatPillActionViewItemBase; 281: ChatPillActionViewItem, ChatPillActionViewItemBase |
| `vscode/src/vs/workbench/browser/chatResourcePill.ts` | U-N / T-E+T-C | 13: ChatPillActionViewItemBase, IChatPillEntry; 20: ChatPillActionViewItemBase, ChatResourcePillActionViewItem; 28: IChatPillEntry |
| `vscode/src/vs/workbench/browser/workbench.contribution.ts` | U-R / T-C+T-R | 529: Chat; 530: Chat; 536: Chat |
| `vscode/src/vs/workbench/contrib/accessibility/browser/accessibleViewActions.ts` | U-N / T-V+T-C | 59: InlineChat; 85: InlineChat |
| `vscode/src/vs/workbench/contrib/authentication/browser/authentication.contribution.ts` | U-N / T-H+T-C | 175: IMcpRegistry |
| `vscode/src/vs/workbench/contrib/codeEditor/browser/codeEditor.contribution.ts` | U-N / T-E+T-C | 28: './dictation/editorDictation.js' |
| `vscode/src/vs/workbench/contrib/comments/browser/simpleCommentEditor.ts` | U-N / T-E+T-C | 16: '../../codeEditor/browser/dictation/editorDictation.js' |
| `vscode/src/vs/workbench/contrib/debug/test/browser/debugConfigurationManager.test.ts` | U-T / T-C | 143: '/remote/mcp.json' |
| `vscode/src/vs/workbench/contrib/editSessions/test/browser/editSessions.test.ts` | U-T / T-C | 164: 'mcp.json' |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsChart.ts` | U-N / T-E+T-C | 72: IAiStatsChartOptions; 78: IAiStatsChartOptions |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsFeature.ts` | U-N / T-E+T-C | 65: Chat |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/editStats/aiStatsStatusBar.ts` | U-N / T-E+T-C | 128: IAiStatsHoverData; 134: IAiStatsHoverOptions; 135: IAiStatsHoverData; 139: IAiStatsHoverOptions |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/helpers/documentWithAnnotatedEdits.ts` | U-N / T-E+T-C | 123: Chat; 124: 'agentHost'; 125: AgentHostEditSource; 126: ChatEditSource; 127: 'inlineChat.applyEdits'; 128: ChatEditSource; 139: AgentHostEditSource, ChatEditSource; 156: ChatEditSource; 168: AgentHostEditSource; 169: 'agentHost' |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.ts` | U-N / T-E+T-C | 10: IAiEditTelemetryService; 12: IAiEditTelemetryService; 29: 'inlineChat' |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryServiceImpl.ts` | U-N / T-E+T-C | 10: IAiEditTelemetryService; 13: IAiEditTelemetryService; 32: 'inlineChat'; 108: 'inlineChat'; 194: 'inlineChat' |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/arcTelemetrySender.ts` | U-N / T-E+T-C | 13: IAiEditTelemetryService; 108: IAiEditTelemetryService; 115: 'inlineChat.applyEdits', Chat; 126: 'inlineChat'; 127: Chat; 133: 'inlineChat'; 167: 'inlineChat.applyEdits', Chat |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingFeature.ts` | U-N / T-E+T-C | 30: './agentHostEditMarkerService.js', AgentHostEditMarkerService; 72: AgentHostEditMarkerService |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingImpl.ts` | U-N / T-E+T-C | 24: './agentHostEditMarkerService.js', AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError, IAgentHostEditMarkerService; 28: 'agentHost'; 39: 'agentHost'; 53: IAgentHostEditMarkerService; 79: IAgentHostEditMarkerService; 230: AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError; 242: AgentHostEditAttributionUnknownOutcomeError; 245: AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editTracker.ts` | U-N / T-E+T-C | 13: './agentHostEditMarkerService.js' |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/editSourceTrackingImpl.test.ts` | U-T / T-C | 26: IAiEditTelemetryService; 28: '../../browser/telemetry/agentHostEditMarkerService.js', AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError, IAgentHostEditMarkerService; 171: IAgentHostEditMarkerService; 221: 'source:Chat.applyEdits-$modelId:gpt-5-$harness:copilotcli-$origin:agentHost'; 222: 'source:Chat.applyEdits-$harness:copilotcli-$origin:agentHost'; 223: 'agentHost'; 234: 'source:Chat.applyEdits-$modelId:gpt-5-$harness:copilotcli-$origin:agentHost'; 235: 'source:Chat.applyEdits-$harness:copilotcli-$origin:agentHost'; 236: 'agentHost'; 272: IAgentHostEditMarkerService; 309: IAgentHostEditMarkerService; 350: IAgentHostEditMarkerService; 412: IAgentHostEditMarkerService; 472: IAgentHostEditMarkerService; 519: IAgentHostEditMarkerService; 550: IAgentHostEditMarkerService; 573: Chat; 581: IAgentHostEditMarkerService; 622: IAgentHostEditMarkerService; 654: IAgentHostEditMarkerService; 676: Chat; 684: IAgentHostEditMarkerService; 719: IAgentHostEditMarkerService; 728: AgentHostEditAttributionDeferredError; 758: IAgentHostEditMarkerService; 770: AgentHostEditAttributionUnknownOutcomeError; 811: IAgentHostEditMarkerService; 849: IAgentHostEditMarkerService; 921: IAiEditTelemetryService |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/editTelemetry.test.ts` | U-T / T-C | 25: IAiEditTelemetryService; 52: 'inlineChat'; 79: IAiEditTelemetryService; 147: Chat; 149: Chat; 151: Chat; 152: Chat; 153: Chat; 154: Chat; 155: Chat; 157: "agentHostModifiedCount\"; 158: Chat; 160: "agentHostModifiedCount\" |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/editTracker.test.ts` | U-T / T-C | 17: '../../browser/telemetry/agentHostEditMarkerService.js'; 198: 'source:Chat.applyEdits-$modelId:gpt-5-$harness:copilotcli-$origin:agentHost'; 201: 'agentHost' |
| `vscode/src/vs/workbench/contrib/files/browser/fileActions.contribution.ts` | U-N / T-E+T-C | 766: Chat; 768: ChatAttachmentsContext; 775: ChatAttachmentsContext; 782: ChatAttachmentsContext; 789: ChatAttachmentsContext; 796: Chat; 798: ChatInlineResourceAnchorContext, ChatInputResourceAttachmentContext |
| `vscode/src/vs/workbench/contrib/files/electron-browser/fileActions.contribution.ts` | U-N / T-E+T-C | 102: ChatAttachmentsContext; 111: ChatInlineResourceAnchorContext |
| `vscode/src/vs/workbench/contrib/imageCarousel/browser/imageCarousel.contribution.ts` | U-N / T-E+T-C | 46: 'imageCarousel.chat.enabled'; 49: 'imageCarousel.chat.enabled'; 118: 'workbench.action.chat.openImageInCarousel' |
| `vscode/src/vs/workbench/contrib/modernUI/browser/media/fontRamp.css` | U-N / T-E+T-C | 155: Chat; 167: Chat |
| `vscode/src/vs/workbench/contrib/modernUI/browser/media/padding.css` | U-N / T-E+T-C | 30: ChatViewPane |
| `vscode/src/vs/workbench/contrib/notebook/browser/media/notebook.css` | D-O / T-C | 682: Chat |
| `vscode/src/vs/workbench/contrib/notebook/browser/notebook.contribution.ts` | D-O / T-C | 72: './controller/chat/notebook.chat.contribution.js' |
| `vscode/src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` | D-O / T-C | 911: ChatInput |
| `vscode/src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` | D-O / T-C | 816: Chat; 818: Chat |
| `vscode/src/vs/workbench/contrib/notebook/browser/view/cellParts/cellStatusPart.ts` | D-O / T-C | 153: ChatInput; 154: ChatInput |
| `vscode/src/vs/workbench/contrib/performance/browser/perfviewEditor.ts` | U-N / T-E+T-C | 279: 'code/agentHost/'; 282: 'code/agentHost/' |
| `vscode/src/vs/workbench/contrib/policyExport/test/node/extensionPolicyFixture.json` | U-T / T-C | 9: "github.copilot.chat.reviewSelection.enabled"; 15: "github.copilot.chat.reviewAgent.enabled"; 21: "github.copilot.chat.claudeAgent.enabled"; 26: "github.copilot.chat.otel.enabled"; 31: "github.copilot.chat.otel.exporterType"; 36: "github.copilot.chat.otel.protocol"; 41: "github.copilot.chat.otel.otlpEndpoint"; 46: "github.copilot.chat.otel.captureContent"; 51: "github.copilot.chat.otel.serviceName"; 56: "github.copilot.chat.otel.resourceAttributes"; 61: "github.copilot.chat.otel.headers"; 66: "github.copilot.chat.otel.outfile" |
| `vscode/src/vs/workbench/contrib/preferences/browser/settingsTreeModels.ts` | U-N / T-P+T-C | 499: Chat |
| `vscode/src/vs/workbench/contrib/relauncher/browser/relauncher.contribution.ts` | U-N / T-E+T-C | 70: 'chat.extensionUnification.enabled'; 71: 'chat.agentHost.claudeAgent.enabled'; 72: 'chat.editor.codex.preferAgentHost'; 73: 'chat.agentHost.otel.enabled'; 74: 'chat.agentHost.otel.exporterType'; 75: 'chat.agentHost.otel.otlpEndpoint'; 76: 'chat.agentHost.otel.captureContent'; 77: 'chat.agentHost.otel.outfile'; 78: 'chat.agentHost.otel.dbSpanExporter.enabled' |
| `vscode/src/vs/workbench/contrib/relauncher/test/browser/relauncher.test.ts` | U-T / T-C | 73: 'prompts to restart when chat.agentHost.claudeAgent.enabled changes'; 76: 'chat.agentHost.claudeAgent.enabled'; 84: 'does not prompt to restart when chat.agentHost.codexAgent.enabled changes'; 87: 'chat.agentHost.codexAgent.enabled'; 95: 'does not prompt to restart when chat.agentHost.byokModels.enabled changes'; 98: 'chat.agentHost.byokModels.enabled'; 106: 'prompts to restart when chat.editor.codex.preferAgentHost changes'; 109: 'chat.editor.codex.preferAgentHost'; 120: 'chat.agentHost.claudeAgent.enabled'; 131: 'chat.agentHost.claudeAgent.enabled' |
| `vscode/src/vs/workbench/contrib/tasks/common/tasks.ts` | U-N / T-N+T-C | 1260: ChatAgent |
| `vscode/src/vs/workbench/contrib/telemetry/browser/telemetry.contribution.ts` | U-N / T-E+T-C | 462: 'chat.agent.sandbox' |
| `vscode/src/vs/workbench/contrib/terminal/browser/ahpTerminalCommandSource.ts` | U-N / T-N+T-C | 13: './agentHostPty.js', AgentHostPty, IAgentHostPtyCommandExecutedEvent, IAgentHostPtyCommandFinishedEvent; 165: AgentHostPty; 191: AgentHostPty; 216: AgentHostPty; 225: IAgentHostPtyCommandExecutedEvent; 240: IAgentHostPtyCommandFinishedEvent |
| `vscode/src/vs/workbench/contrib/terminal/browser/terminal.contribution.ts` | U-N / T-N+T-C | 49: './agentHostTerminalService.js', AgentHostTerminalService, IAgentHostTerminalService; 60: AgentHostTerminalService, IAgentHostTerminalService |
| `vscode/src/vs/workbench/contrib/terminal/browser/terminalTabbedView.ts` | U-N / T-N+T-C | 11: ITerminalChatService; 80: ITerminalChatService; 147: ChatHasHiddenTerminals |
| `vscode/src/vs/workbench/contrib/terminal/browser/terminalTabsChatEntry.ts` | U-N / T-N+T-C | 13: ITerminalChatService; 33: ITerminalChatService; 57: 'workbench.action.terminal.chat.viewHiddenChatTerminals' |
| `vscode/src/vs/workbench/contrib/terminal/common/terminal.ts` | U-N / T-N+T-C | 651: 'workbench.action.terminal.chat.start'; 652: 'workbench.action.terminal.chat.close'; 653: 'workbench.action.terminal.chat.discard'; 654: 'workbench.action.terminal.chat.makeRequest'; 655: 'workbench.action.terminal.chat.cancel'; 656: 'workbench.action.terminal.chat.feedbackHelpful'; 657: 'workbench.action.terminal.chat.feedbackUnhelpful'; 658: 'workbench.action.terminal.chat.feedbackReportIssue'; 659: 'workbench.action.terminal.chat.runCommand'; 660: 'workbench.action.terminal.chat.insertCommand'; 661: 'workbench.action.terminal.chat.viewInChat' |
| `vscode/src/vs/workbench/contrib/terminal/common/terminalContextKey.ts` | U-N / T-N+T-C | 150: ChatHasHiddenTerminals |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/ahpTerminalCommandSource.test.ts` | U-T / T-C | 11: '../../browser/agentHostPty.js', AgentHostPty, IAgentHostPtyCommandExecutedEvent, IAgentHostPtyCommandFinishedEvent; 96: IAgentHostPtyCommandExecutedEvent; 97: IAgentHostPtyCommandFinishedEvent; 102: IAgentHostPtyCommandExecutedEvent; 103: IAgentHostPtyCommandFinishedEvent; 133: IAgentHostPtyCommandExecutedEvent; 134: IAgentHostPtyCommandFinishedEvent; 164: AgentHostPty; 172: AgentHostPty; 364: AgentHostPty |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/chatTerminalCommandMirror.test.ts` | U-T / T-C | 36: ChatTerminalCommandMirror |
| `vscode/src/vs/workbench/contrib/update/common/updateInfoParser.ts` | U-N / T-E+T-C | 66: "workbench.action.chat.open" |
| `vscode/src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditor.ts` | U-N / T-E+T-C | 889: Mcp |
| `vscode/src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditorModel.ts` | U-N / T-E+T-C | 25: McpProfileResource, McpResourceTreeItem; 255: Mcp; 263: Mcp; 302: Mcp; 303: McpResourceTreeItem; 689: Mcp; 707: Mcp; 723: Mcp; 845: Mcp; 847: McpProfileResource |
| `vscode/src/vs/workbench/contrib/userDataSync/browser/userDataSync.ts` | U-N / T-E+T-C | 607: Mcp; 608: Mcp |
| `vscode/src/vs/workbench/contrib/webview/browser/webview.ts` | U-N / T-E+T-C | 87: ChatOutputItem |
| `vscode/src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts` | U-N / T-E+T-C | 402: 'dictation'; 403: "Use dictation to write code and text in the editor and terminal", 'gettingStarted.dictation.title'; 404: "Dictation allows you to write code and text using your voice. It can be activated with the Voice: Start Dictation in Editor command.\n{0}\n For dictation in the terminal, use the Voice: Start Dictation in Terminal and Voice: Stop Dictation in Terminal commands.\n{1}\n{2}", 'gettingStarted.dictation.description.interpolated' |
| `vscode/src/vs/workbench/services/accounts/browser/defaultAccount.ts` | U-N / T-E+T-C | 75: IMcpRegistryProvider; 87: IMcpRegistryResponse; 88: IMcpRegistryProvider; 872: IMcpRegistryProvider; 882: IMcpRegistryProvider; 905: IMcpRegistryResponse |
| `vscode/src/vs/workbench/services/accounts/test/browser/managedSettings.test.ts` | U-T / T-C | 100: 'https://mcp.example.com/*'; 105: "https://mcp.example.com/*" |
| `vscode/src/vs/workbench/services/actions/common/menusExtensionPoint.ts` | U-N / T-E+T-C | 148: ChatInputStatus; 482: ChatTextEditorMenu; 483: Chat; 489: ChatEditingSessionChangesToolbar; 490: Chat; 495: ChatEditingSessionTitleToolbar; 496: Chat; 503: Chat; 523: ChatMultiDiffContext; 524: Chat; 531: Chat; 538: Chat; 544: ChatEditorInlineMenu; 551: ChatContextUsageActions; 557: ChatNewMenu; 558: Chat |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.ts` | U-N / T-H+T-C | 53: IMcpService; 62: IAuthenticationMcpAccessService; 63: IAuthenticationMcpAccessService; 98: IAuthenticationMcpAccessService; 221: IAuthenticationMcpAccessService |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.ts` | U-N / T-H+T-C | 17: IAuthenticationMcpAccessService; 18: IAuthenticationMcpUsageService; 37: IAuthenticationMcpService; 38: IAuthenticationMcpService; 95: IAuthenticationMcpService; 114: IAuthenticationMcpUsageService; 115: IAuthenticationMcpAccessService; 560: IAuthenticationMcpService |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.ts` | U-N / T-H+T-C | 15: IAuthenticationMcpUsage; 22: IAuthenticationMcpUsageService; 23: IAuthenticationMcpUsageService; 39: IAuthenticationMcpUsage; 56: IAuthenticationMcpUsageService; 100: IAuthenticationMcpUsage; 103: IAuthenticationMcpUsage; 160: IAuthenticationMcpUsageService |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationQueryService.ts` | U-N / T-H+T-C | 23: IMcpServerQuery; 29: IAuthenticationMcpUsageService; 31: IAuthenticationMcpAccessService; 32: IAuthenticationMcpService; 737: IMcpServerQuery, McpServerQuery; 817: IAuthenticationMcpUsageService; 819: IAuthenticationMcpAccessService; 821: IAuthenticationMcpService; 866: IMcpServerQuery; 867: McpServerQuery |
| `vscode/src/vs/workbench/services/authentication/common/authenticationQuery.ts` | U-N / T-H+T-C | 435: IMcpServerQuery; 503: IMcpServerQuery |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationMcpAccessService.test.ts` | U-T / T-C | 12: IAuthenticationMcpAccessService; 20: IAuthenticationMcpAccessService; 451: 'persists agentHost metadata and preserves it when a later toggle omits it'; 453: ', agentHost: { authority: ' |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts` | U-T / T-C | 16: IAuthenticationMcpUsageService; 18: IAuthenticationMcpAccessService; 19: IAuthenticationMcpService; 64: IAuthenticationMcpUsageService; 66: IAuthenticationMcpAccessService; 68: IAuthenticationMcpService; 1098: 'getAllowedMcpServers method exposes agentHost metadata'; 1103: ', allowed: true, agentHost: { authority: ' |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryServiceMocks.ts` | U-T / T-C | 10: IAuthenticationMcpUsageService; 12: IAuthenticationMcpAccessService; 13: IAuthenticationMcpService; 134: IAuthenticationMcpUsageService; 203: IAuthenticationMcpAccessService; 293: IAuthenticationMcpService |
| `vscode/src/vs/workbench/services/configuration/test/browser/configurationEditing.test.ts` | U-T / T-C | 346: 'mcp.service.testSetting' |
| `vscode/src/vs/workbench/services/extensions/test/browser/extensionUrlHandler.test.ts` | U-T / T-C | 27: Chat |
| `vscode/src/vs/workbench/services/inlineCompletions/common/inlineCompletionsUnification.ts` | U-N / T-E+T-C | 43: 'chat.extensionUnification.enabled' |
| `vscode/src/vs/workbench/services/policies/browser/policyTelemetry.contribution.ts` | U-N / T-E+T-C | 14: ChatDefaultModel; 15: ChatToolsAutoApprove; 16: ChatEnabledPlugins; 17: ChatExtraMarketplaces; 18: ChatStrictMarketplaces; 19: ChatApprovedAccountOrganizations |
| `vscode/src/vs/workbench/services/policies/common/accountPolicyService.ts` | U-N / T-E+T-C | 23: ChatApprovedAccountOrganizations; 45: ChatAccountPolicyGateActiveContext |
| `vscode/src/vs/workbench/services/policies/test/browser/policyTelemetryContribution.test.ts` | U-T / T-C | 80: ChatDefaultModel; 81: ChatToolsAutoApprove; 82: ChatEnabledPlugins; 83: ChatExtraMarketplaces; 84: ChatStrictMarketplaces; 85: ChatApprovedAccountOrganizations; 115: ChatStrictMarketplaces |
| `vscode/src/vs/workbench/services/preferences/browser/preferencesService.ts` | U-N / T-P+T-C | 583: 'chat.agent.maxRequests' |
| `vscode/src/vs/workbench/services/storage/test/browser/storageService.test.ts` | U-T / T-C | 45: 'mcp.json' |
| `vscode/src/vs/workbench/services/themes/common/workbenchThemeService.ts` | U-N / T-E+T-C | 90: 'chat.slashCommandBackground'; 91: 'chat.slashCommandForeground'; 92: 'chat.editedFileForeground'; 232: 'chat.slashCommandBackground'; 233: 'chat.slashCommandForeground'; 234: 'chat.editedFileForeground' |
| `vscode/src/vs/workbench/services/userDataProfile/browser/mcpProfileResource.ts` | U-N / T-E+T-C | 17: IMcpResourceContent; 21: McpResourceInitializer; 31: IMcpResourceContent; 40: McpProfileResource; 53: IMcpResourceContent; 59: IMcpResourceContent; 82: McpResourceTreeItem; 84: Mcp; 85: Mcp; 114: McpProfileResource; 119: McpProfileResource |
| `vscode/src/vs/workbench/services/userDataProfile/browser/userDataProfileInit.ts` | U-N / T-E+T-C | 19: McpResourceInitializer; 85: Mcp, McpResourceInitializer |
| `vscode/src/vs/workbench/services/userDataSync/common/userDataSync.ts` | U-N / T-E+T-C | 63: Mcp |
| `vscode/src/vs/workbench/services/workingCopy/test/electron-browser/workingCopyBackupService.test.ts` | U-T / T-C | 50: 'mcp.json' |
| `vscode/src/vs/workbench/test/browser/componentFixtures/aiStats.fixture.ts` | U-T / T-C | 7: IAiStatsHoverData; 24: IAiStatsHoverData; 65: IAiStatsHoverData; 74: IAiStatsHoverData |
| `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts` | D-S / T-C | 10: ChatInteractivity, ChatOriginKind, IChat; 16: ChatCompositeBar, IChatCompositeBarDelegate; 30: ChatInteractivity; 33: IChat; 35: IChat; 40: ChatInteractivity; 44: IChat; 48: IChat; 49: IChat; 50: IChat; 52: ChatOriginKind; 55: IChat; 56: IChat; 63: IChat, IChatCompositeBarDelegate; 80: IChat; 105: ChatCompositeBar; 163: Chat |
| `vscode/src/vscode-dts/vscode.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8573: LanguageModelChat; 8575: LanguageModelAccessInformation; 19598: ChatRequestTurn; 19602: ChatRequestTurn; 19604: ChatCommand, ChatParticipant; 19615: ChatCommand; 19622: ChatPromptReference; 19627: ChatLanguageModelToolReference; 19632: ChatLanguageModelToolReference, ChatPromptReference; 19638: ChatResponseTurn; 19642: ChatResponseAnchorPart, ChatResponseCommandButtonPart, ChatResponseFileTreePart, ChatResponseMarkdownPart; 19647: ChatResult; 19662: ChatResponseAnchorPart, ChatResponseCommandButtonPart, ChatResponseFileTreePart, ChatResponseMarkdownPart, ChatResult; 19668: ChatContext; 19672: ChatRequestTurn, ChatResponseTurn; 19678: ChatErrorDetails; 19693: ChatResult; 19697: ChatErrorDetails; 19708: ChatResultFeedbackKind; 19723: ChatResultFeedback; 19725: ChatResult; 19728: ChatResult; 19733: ChatResultFeedbackKind; 19739: ChatFollowup; 19765: ChatFollowupProvider; 19773: ChatContext, ChatFollowup, ChatResult; 19779: ChatContext, ChatRequest, ChatRequestHandler, ChatResponseStream, ChatResult; 19783: ChatParticipant; 19785: ChatParticipant; 19799: ChatRequestHandler; 19804: ChatFollowupProvider; 19810: ChatResultFeedback; 19813: ChatResultFeedback; 19824: ChatPromptReference; 19831: ChatRequest; 19852: ChatRequest; 19856: ChatRequest; 19858: ChatCommand, ChatParticipant; 19864: ChatCommand; 19877: ChatPromptReference; 19883: LanguageModelChatToolMode; 19887: ChatLanguageModelToolReference; 19893: ChatParticipantToolToken; 19899: LanguageModelChat; 19903: ChatResponseStream; 19905: ChatResponsePart, ChatResponseStream; 19907: ChatResponseStream; 19910: ChatResponseMarkdownPart; 19912: ChatResponseStream; 19919: ChatResponseAnchorPart; 19929: ChatResponseCommandButtonPart; 19937: ChatResponseFileTreePart; 19942: ChatResponseFileTree; 19946: ChatResponseProgressPart; 19954: ChatResponseReferencePart; 19968: ChatResponsePart; 19974: ChatResponseMarkdownPart; 19981: ChatResponseMarkdownPart; 19991: ChatResponseFileTree; 20000: ChatResponseFileTree; 20006: ChatResponseFileTreePart; 20010: ChatResponseFileTree; 20018: ChatResponseFileTreePart; 20022: ChatResponseFileTree; 20028: ChatResponseAnchorPart; 20040: ChatResponseAnchorPart; 20050: ChatResponseProgressPart; 20057: ChatResponseProgressPart; 20066: ChatResponseReferencePart; 20078: ChatResponseReferencePart; 20088: ChatResponseCommandButtonPart; 20095: ChatResponseCommandButtonPart; 20104: ChatResponseAnchorPart, ChatResponseFileTreePart, ChatResponseMarkdownPart, ChatResponsePart; 20105: ChatResponseCommandButtonPart, ChatResponseProgressPart, ChatResponseReferencePart; 20110: Chat; 20111: ChatResponseStream; 20115: ChatParticipant; 20121: ChatParticipant, ChatRequestHandler; 20127: LanguageModelChatMessageRole; 20142: LanguageModelChatMessage; 20150: LanguageModelChatMessage, LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolResultPart; 20158: LanguageModelChatMessage, LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolCallPart; 20163: LanguageModelChatMessageRole; 20169: LanguageModelInputPart; 20183: LanguageModelChatMessageRole, LanguageModelInputPart; 20189: ChatRequest; 20191: LanguageModelChatResponse; 20195: LanguageModelTextPart; 20196: LanguageModelToolCallPart; 20197: LanguageModelChatRequestOptions; 20211: LanguageModelTextPart; 20213: LanguageModelToolCallPart; 20224: LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolCallPart; 20227: LanguageModelChatResponse; 20229: LanguageModelChatResponse; 20239: LanguageModelChat; 20279: LanguageModelAccessInformation; 20285: LanguageModelError; 20286: LanguageModelError; 20287: LanguageModelError; 20288: LanguageModelError; 20291: LanguageModelChatRequestOptions, LanguageModelToolCallPart; 20297: LanguageModelChatResponse; 20299: LanguageModelChatMessage, LanguageModelChatRequestOptions, LanguageModelChatResponse; 20308: LanguageModelChatMessage; 20316: LanguageModelChatSelector; 20320: LanguageModelChat; 20326: LanguageModelChat; 20332: LanguageModelChat; 20338: LanguageModelChat; 20347: LanguageModelError; 20351: LanguageModelError; 20357: LanguageModelError; 20362: LanguageModelError; 20367: LanguageModelError; 20372: LanguageModelError; 20382: LanguageModelChat; 20384: LanguageModelChatRequestOptions; 20401: LanguageModelToolCallPart; 20402: LanguageModelChatResponse; 20405: LanguageModelChatMessage; 20406: LanguageModelToolCallPart, LanguageModelToolResultPart; 20408: LanguageModelChatTool; 20411: LanguageModelChatToolMode; 20413: LanguageModelChatToolMode; 20417: McpStdioServerDefinition; 20422: McpStdioServerDefinition; 20468: McpHttpServerDefinition; 20471: McpHttpServerDefinition; 20504: McpServerDefinitionProvider; 20506: McpHttpServerDefinition, McpServerDefinition, McpStdioServerDefinition; 20513: McpServerDefinition, McpServerDefinitionProvider; 20550: LanguageModelChatRequestOptions; 20562: LanguageModelToolCallPart; 20563: LanguageModelChatResponse; 20566: LanguageModelChatMessage; 20567: LanguageModelToolCallPart, LanguageModelToolResultPart; 20569: LanguageModelChatTool; 20574: LanguageModelChatToolMode; 20578: LanguageModelChatProvider; 20580: LanguageModelChatInformation; 20610: LanguageModelChatSelector; 20628: LanguageModelChatCapabilities; 20632: LanguageModelChatInformation; 20634: LanguageModelChatCapabilities; 20649: LanguageModelChatMessage; 20651: LanguageModelChatRequestMessage; 20655: LanguageModelChatMessageRole; 20661: LanguageModelInputPart; 20670: LanguageModelChatProvider; 20672: LanguageModelDataPart, LanguageModelResponsePart, LanguageModelTextPart, LanguageModelToolCallPart, LanguageModelToolResultPart; 20675: LanguageModelChat, LanguageModelChatProvider; 20677: LanguageModelDataPart, LanguageModelInputPart, LanguageModelTextPart, LanguageModelToolCallPart, LanguageModelToolResultPart; 20680: LanguageModelChat, LanguageModelChatProvider; 20683: LanguageModelChatInformation, LanguageModelChatProvider; 20700: LanguageModelChatProvider; 20708: LanguageModelChatRequestMessage, LanguageModelResponsePart; 20717: LanguageModelChatRequestMessage; 20721: LanguageModelChatProvider; 20742: LanguageModelChatSelector; 20766: LanguageModelChat, LanguageModelChatSelector; 20769: LanguageModelTool; 20771: LanguageModelChatRequestOptions; 20774: LanguageModelTool; 20780: LanguageModelToolInformation; 20790: LanguageModelToolInvocationOptions; 20791: ChatRequest; 20794: LanguageModelTextPart, LanguageModelToolResult; 20795: LanguageModelPromptTsxPart; 20797: LanguageModelChat, LanguageModelToolResultPart; 20800: ChatResult; 20801: ChatResponseTurn; 20808: LanguageModelToolInvocationOptions, LanguageModelToolResult; 20829: McpServerDefinitionProvider; 20838: McpServerDefinitionProvider; 20841: LanguageModelChatProvider; 20847: LanguageModelChatProvider; 20853: LanguageModelAccessInformation; 20869: LanguageModelChat; 20873: LanguageModelChatRequestOptions; 20876: LanguageModelChatTool; 20896: LanguageModelChatToolMode; 20910: LanguageModelChatResponse; 20911: LanguageModelChatMessage; 20913: LanguageModelToolCallPart; 20930: LanguageModelToolCallPart; 20940: LanguageModelToolCallPart; 20943: LanguageModelToolResultPart; 20947: LanguageModelToolCallPart; 20954: LanguageModelDataPart, LanguageModelPromptTsxPart, LanguageModelTextPart; 20960: LanguageModelDataPart, LanguageModelPromptTsxPart, LanguageModelTextPart; 20964: LanguageModelChatResponse; 20966: LanguageModelTextPart; 20981: LanguageModelToolResult; 20983: LanguageModelPromptTsxPart; 20999: LanguageModelToolResult; 21005: LanguageModelDataPart, LanguageModelPromptTsxPart, LanguageModelTextPart; 21008: LanguageModelToolResult; 21011: LanguageModelDataPart, LanguageModelPromptTsxPart, LanguageModelTextPart; 21015: LanguageModelChatResponse; 21016: LanguageModelChatMessage, LanguageModelToolResult; 21018: LanguageModelDataPart; 21020: LanguageModelDataPart; 21024: LanguageModelDataPart; 21027: LanguageModelDataPart; 21035: LanguageModelDataPart; 21038: LanguageModelDataPart; 21044: LanguageModelDataPart; 21067: ChatParticipantToolToken; 21072: LanguageModelToolInvocationOptions; 21074: ChatParticipant; 21076: ChatRequest; 21085: ChatParticipantToolToken; 21089: LanguageModelToolInformation; 21097: LanguageModelToolTokenizationOptions; 21103: LanguageModelToolTokenizationOptions; 21121: LanguageModelToolInformation; 21145: LanguageModelTool; 21147: LanguageModelToolInvocationPrepareOptions; 21155: LanguageModelChat; 21157: LanguageModelTool; 21161: LanguageModelToolInvocationOptions; 21163: LanguageModelToolInvocationOptions, LanguageModelToolResult; 21173: LanguageModelToolInvocationPrepareOptions; 21180: LanguageModelToolConfirmationMessages; 21193: LanguageModelTool; 21205: LanguageModelToolConfirmationMessages; 21212: ChatLanguageModelToolReference; 21219: ChatRequest |
| `vscode/src/vscode-dts/vscode.proposed.chatContextProvider.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 26: ChatWorkspaceContextProvider; 38: ChatAttachContextProvider; 56: ChatTabContextProvider; 65: ChatContextItem; 101: ChatGlobalContextProvider; 102: ChatContextItem, ChatWorkspaceContextProvider; 119: ChatAttachContextProvider, ChatContextItem; 123: Chat; 136: ChatContextItem; 139: ChatContextItem, ChatTabContextProvider; 143: Chat; 152: ChatTab; 161: ChatContextItem |
| `vscode/src/vscode-dts/vscode.proposed.chatDebug.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 10: ChatDebugLogLevel; 20: ChatDebugToolCallResult; 29: ChatDebugToolCallEvent; 76: ChatDebugToolCallResult; 84: ChatDebugToolCallEvent; 95: ChatDebugModelTurnEvent; 193: ChatDebugModelTurnEvent; 203: ChatDebugGenericEvent; 239: ChatDebugLogLevel; 247: ChatDebugGenericEvent; 252: ChatDebugLogLevel; 258: ChatDebugSubagentStatus; 268: ChatDebugSubagentInvocationEvent; 304: ChatDebugSubagentStatus; 322: ChatDebugSubagentInvocationEvent; 333: ChatDebugUserMessageEvent; 365: ChatDebugMessageSection; 368: ChatDebugUserMessageEvent; 379: ChatDebugAgentResponseEvent; 411: ChatDebugMessageSection; 414: ChatDebugAgentResponseEvent; 425: ChatDebugMessageSection; 437: ChatDebugMessageSection; 447: ChatDebugEventTextContent; 454: ChatDebugEventTextContent; 463: ChatDebugMessageContentType; 472: ChatDebugEventMessageContent; 476: ChatDebugMessageContentType; 486: ChatDebugMessageSection; 489: ChatDebugEventMessageContent; 494: ChatDebugMessageContentType, ChatDebugMessageSection; 501: ChatDebugEventToolCallContent; 510: ChatDebugToolCallResult; 528: ChatDebugEventToolCallContent; 538: ChatDebugEventModelTurnContent; 618: ChatDebugMessageSection; 621: ChatDebugEventModelTurnContent; 631: ChatDebugEventHookContent; 645: ChatDebugHookResult; 673: ChatDebugEventHookContent; 682: ChatDebugHookResult; 693: ChatDebugUserMessageEvent; 694: ChatDebugAgentResponseEvent; 697: ChatDebugAgentResponseEvent, ChatDebugEventHookContent, ChatDebugEventMessageContent, ChatDebugEventModelTurnContent, ChatDebugEventTextContent, ChatDebugEventToolCallContent, ChatDebugResolvedEventContent, ChatDebugUserMessageEvent; 701: ChatResponsePart; 703: ChatDebugAgentResponseEvent, ChatDebugEvent, ChatDebugGenericEvent, ChatDebugModelTurnEvent, ChatDebugSubagentInvocationEvent, ChatDebugToolCallEvent, ChatDebugUserMessageEvent; 708: ChatDebugLogProvider; 721: ChatDebugEvent; 723: ChatDebugEvent; 737: ChatDebugResolvedEventContent; 751: ChatDebugLogExportOptions; 768: ChatDebugLogImportResult; 790: ChatDebugLogProvider; 797: ChatDebugEvent; 801: ChatDebugLogProvider; 803: ChatDebugLogExportOptions; 808: ChatDebugEvent; 818: ChatDebugLogProvider; 820: ChatDebugLogImportResult |
| `vscode/src/vscode-dts/vscode.proposed.chatHooks.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 11: ChatHookType; 17: ChatHookCommand; 39: ChatRequestHooks; 40: ChatHookCommand; 49: ChatHookResultKind; 55: ChatHookResult; 59: ChatHookResultKind; 76: ChatRequest; 82: ChatRequestHooks; 90: ChatResponseHookPart; 92: ChatHookType; 107: ChatHookType; 111: ChatResponseHookPart; 114: ChatResponseStream; 122: ChatHookType |
| `vscode/src/vscode-dts/vscode.proposed.chatInputNotification.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 11: ChatInputNotificationSeverity; 31: ChatInputNotificationAction; 55: ChatInputNotification; 64: ChatInputNotificationSeverity; 80: ChatInputNotificationAction; 122: ChatInputNotification |
| `vscode/src/vscode-dts/vscode.proposed.chatOutputRenderer.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 11: ChatOutputRenderer; 33: ChatOutputRenderer; 35: ChatOutputDataItem; 50: ChatOutputWebview; 65: ChatOutputRenderContext; 81: ChatOutputRenderer; 94: ChatOutputDataItem, ChatOutputRenderContext, ChatOutputWebview; 119: ChatOutputRenderer |
| `vscode/src/vscode-dts/vscode.proposed.chatParticipantAdditions.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: ChatParticipant; 9: ChatUserActionEvent; 15: ChatCommand; 20: ChatVulnerability; 26: ChatResponseMarkdownWithVulnerabilitiesPart; 28: ChatVulnerability; 29: ChatVulnerability; 32: ChatResponseCodeblockUriPart; 42: ChatCommandButton; 46: ChatDocumentContext; 52: ChatResponseTextEditPart; 60: ChatResponseNotebookEditPart; 71: ChatWorkspaceFileEdit; 86: ChatResponseWorkspaceEditPart; 87: ChatWorkspaceFileEdit; 88: ChatWorkspaceFileEdit; 91: ChatResponseConfirmationPart; 102: ChatQuestionOption; 120: ChatQuestionType; 138: ChatQuestion; 146: ChatQuestionType; 158: ChatQuestionOption; 173: ChatQuestionType; 177: ChatQuestionOption; 188: ChatResponseQuestionCarouselPart; 192: ChatQuestion; 198: ChatQuestion; 201: ChatResponseCodeCitationPart; 208: ChatToolInvocationStreamData; 216: ChatTerminalToolInvocationData; 253: McpToolInvocationContentData; 272: ChatMcpToolInvocationData; 274: McpToolInvocationContentData; 277: ChatTodoStatus; 283: ChatTodoToolInvocationData; 287: ChatTodoStatus; 294: ChatSimpleToolResultData; 306: ChatToolResourcesInvocationData; 313: ChatSubagentToolInvocationData; 342: ChatToolInvocationPart; 351: ChatMcpToolInvocationData, ChatSimpleToolResultData, ChatSubagentToolInvocationData, ChatTerminalToolInvocationData, ChatTodoToolInvocationData, ChatToolResourcesInvocationData; 366: ChatResponseDiffEntry; 396: ChatResponseMultiDiffPart; 400: ChatResponseDiffEntry; 414: ChatResponseMultiDiffPart; 419: ChatResponseDiffEntry; 422: ChatResponseExternalEditPart; 435: ChatResponsePart; 436: ChatResponseTextEditPart; 437: ChatResponseNotebookEditPart; 438: ChatResponseWorkspaceEditPart; 439: ChatResponseConfirmationPart; 440: ChatResponseCodeCitationPart; 441: ChatResponseReferencePart2; 442: ChatResponseMovePart; 443: ChatResponseExtensionsPart; 444: ChatResponsePullRequestPart; 445: ChatToolInvocationPart; 446: ChatResponseMultiDiffPart; 447: ChatResponseThinkingProgressPart; 448: ChatResponseExternalEditPart; 449: ChatResponseQuestionCarouselPart; 450: ChatResponseAutoModeResolutionPart; 455: ChatResponseWarningPart; 460: ChatResponseInfoPart; 465: ChatResponseProgressPart, ChatResponseProgressPart2; 467: ChatResponseReferencePart, ChatResponseWarningPart; 468: ChatResponseReferencePart, ChatResponseWarningPart; 474: ChatResponseThinkingProgressPart; 478: LanguageModelThinkingPart; 485: LanguageModelThinkingPart; 488: ChatResponseReferencePart2; 507: ChatResponseReferencePartStatusKind; 510: ChatResponseReferencePart; 523: ChatResponseReferencePartStatusKind; 526: ChatResponseMovePart; 534: ChatResponseAnchorPart; 555: ChatResponseExtensionsPart; 562: ChatResponsePullRequestPart; 579: ChatResponseAutoModeResolutionPart; 591: ChatResponseStream; 595: ChatResponseProgressPart; 601: ChatResponseReferencePart, ChatResponseWarningPart; 617: ChatWorkspaceFileEdit; 627: ChatVulnerability; 629: ChatResponsePart, ChatResponseProgressPart2, ChatResponseTextEditPart, ChatResponseWarningPart; 636: ChatRequest; 650: ChatQuestion; 654: ChatResponseWarningPart; 663: ChatResponseInfoPart; 672: ChatResponseReferencePartStatusKind; 683: ChatToolInvocationStreamData; 690: ChatToolInvocationStreamData; 694: ChatResponseClearToPreviousToolInvocationReason; 701: ChatResultUsage; 704: ChatResponseReferencePartStatusKind; 725: ChatResponseClearToPreviousToolInvocationReason; 732: ChatRequest; 735: ChatRequest; 747: ChatRequest; 752: LanguageModelToolInformation; 759: ChatRequest; 762: LanguageModelToolExtensionSource; 776: LanguageModelToolMCPSource; 795: LanguageModelToolInformation; 796: LanguageModelToolExtensionSource, LanguageModelToolMCPSource; 800: ChatUsedContext; 801: ChatDocumentContext; 804: ChatParticipant; 808: ChatParticipantCompletionItemProvider; 812: Chat; 814: ChatParticipantPauseStateEvent; 817: ChatParticipantPauseStateEvent; 818: ChatRequest; 822: ChatParticipantCompletionItemProvider; 823: ChatCompletionItem; 826: ChatCompletionItem; 829: ChatVariableValue; 837: ChatVariableValue; 840: ChatContext, ChatExtendedRequestHandler, ChatRequest, ChatResponseStream, ChatResult; 845: ChatResultPromptTokenDetail; 865: ChatResultUsage; 891: ChatResultPromptTokenDetail; 894: ChatResult; 910: ChatExtendedRequestHandler, ChatParticipant; 917: ChatCopyKind; 923: ChatCopyAction; 927: ChatCopyKind; 937: ChatInsertAction; 948: ChatApplyAction; 960: ChatTerminalAction; 967: ChatCommandAction; 970: ChatCommandButton; 973: ChatFollowupAction; 976: ChatFollowup; 979: ChatBugReportAction; 984: ChatEditorAction; 990: ChatEditingSessionAction; 995: ChatEditingSessionActionOutcome; 998: ChatEditingHunkAction; 1005: ChatEditingSessionActionOutcome; 1009: ChatEditingSessionActionOutcome; 1015: ChatUserActionEvent; 1016: ChatResult; 1017: ChatApplyAction, ChatBugReportAction, ChatCommandAction, ChatCopyAction, ChatEditingHunkAction, ChatEditingSessionAction, ChatEditorAction, ChatFollowupAction, ChatInsertAction, ChatTerminalAction; 1020: ChatPromptReference; 1029: ChatLanguageModelToolReference; 1036: ChatVariableValue; 1040: ChatVariableLevel; 1056: ChatVariableLevel; 1062: LanguageModelToolInvocationOptions; 1063: LanguageModelChat; 1067: LanguageModelToolInvocationStreamOptions; 1078: LanguageModelToolStreamResult; 1085: LanguageModelTool; 1087: LanguageModelTool; 1094: LanguageModelToolInvocationStreamOptions, LanguageModelToolStreamResult; 1097: ChatRequest; 1099: ChatRequestModeInstructions; 1102: ChatRequestModeInstructions; 1107: ChatLanguageModelToolReference |
| `vscode/src/vscode-dts/vscode.proposed.chatParticipantPrivate.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 11: ChatLocation; 30: ChatRequestEditorData; 44: ChatRequestNotebookData; 51: ChatRequest; 88: ChatLocation; 94: ChatRequestEditorData, ChatRequestNotebookData; 99: ChatRequestEditedFileEvent; 146: ChatResponseVoiceProgressStage; 148: ChatResponseVoiceProgressPart; 152: ChatResponseVoiceProgressStage; 162: ChatResponseVoiceProgressStage; 166: ChatResponseVoiceProgressPart; 169: ChatResponseStream; 175: ChatResponseVoiceProgressStage; 178: ChatRequestEditedFileEventKind; 184: ChatRequestEditedFileEvent; 186: ChatRequestEditedFileEventKind; 190: ChatRequestTurn; 192: ChatRequestTurn2; 200: ChatRequestTurn; 202: ChatCommand, ChatParticipant; 213: ChatCommand; 220: ChatPromptReference; 225: ChatLanguageModelToolReference; 230: ChatRequestEditedFileEvent; 240: ChatRequestModeInstructions; 245: ChatLanguageModelToolReference, ChatPromptReference, ChatRequestEditedFileEvent, ChatRequestModeInstructions; 248: ChatResponseTurn2; 257: ChatResponseAnchorPart, ChatResponseCommandButtonPart, ChatResponseFileTreePart, ChatResponseMarkdownPart, ChatToolInvocationPart; 262: ChatResult; 274: ChatResponseAnchorPart, ChatResponseCommandButtonPart, ChatResponseFileTreePart, ChatResponseMarkdownPart, ChatResult; 277: ChatParticipant; 281: ChatErrorLevel; 287: ChatErrorDetails; 289: ChatErrorDetails; 301: ChatExpectedError; 306: ChatErrorLevel; 312: ChatExtendedRequestHandler, ChatParticipant; 316: ChatParticipant; 326: LanguageModelIgnoredFileProvider; 329: LanguageModelIgnoredFileProvider; 335: LanguageModelToolInvocationOptions; 373: LanguageModelToolInvocationPrepareOptions; 398: LanguageModelToolResult; 406: Chat; 408: ChatParticipantMetadata; 414: ChatParticipantDetectionResult; 419: ChatParticipantDetectionProvider; 420: ChatContext, ChatLocation, ChatParticipantDetectionResult, ChatParticipantMetadata, ChatRequest; 424: ChatParticipantDetectionProvider; 444: ChatErrorDetailsWithConfirmation; 446: ChatErrorDetails; 447: ChatErrorDetailsConfirmationButton; 450: ChatErrorDetailsConfirmationButton; 457: LanguageModelProxyProvider; 462: LanguageModelProxy; 467: LanguageModelProxyProvider; 468: LanguageModelProxy; 472: LanguageModelProxyProvider; 479: ChatContext; 497: LanguageModelToolInformation; 509: ChatQuotaSnapshot; 522: ChatRateLimitSnapshot; 532: ChatQuotaSnapshots; 537: ChatQuotaSnapshot; 538: ChatQuotaSnapshot; 539: ChatQuotaSnapshot; 542: ChatRateLimitSnapshot; 543: ChatRateLimitSnapshot; 550: ChatQuotaSnapshots |
| `vscode/src/vscode-dts/vscode.proposed.chatPromptFiles.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 12: ChatResourceSource; 17: ChatResource; 37: ChatCustomAgent; 56: ChatResourceSource; 108: ChatInstruction; 127: ChatResourceSource; 153: ChatSkill; 172: ChatResourceSource; 204: ChatSlashCommand; 223: ChatResourceSource; 251: ChatHook; 261: ChatResourceSource; 275: ChatPlugin; 291: ChatCustomAgentProvider; 303: ChatResource; 309: ChatInstructionsProvider; 321: ChatResource; 327: ChatPromptFileProvider; 339: ChatResource; 349: ChatHookProvider; 361: ChatResource; 371: ChatSkillProvider; 383: ChatResource; 388: Chat; 402: ChatCustomAgent; 415: ChatInstruction; 428: ChatSkill; 441: ChatSlashCommand; 453: ChatHook; 465: ChatPlugin; 472: ChatCustomAgentProvider; 479: ChatInstructionsProvider; 486: ChatPromptFileProvider; 493: ChatSkillProvider; 500: ChatHookProvider |
| `vscode/src/vscode-dts/vscode.proposed.chatProvider.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 9: LanguageModelChatRequestOptions; 22: LanguageModelChatInformation; 35: LanguageModelChatProvider; 37: LanguageModelChatInformation; 65: ChatLocation; 68: LanguageModelChatProvider; 81: LanguageModelConfigurationSchema; 122: LanguageModelChatCapabilities; 141: LanguageModelDataPart, LanguageModelResponsePart, LanguageModelResponsePart2, LanguageModelThinkingPart; 148: LanguageModelConfigurationSchema; 165: LanguageModelChatInformation, LanguageModelChatProvider; 167: LanguageModelChatRequestMessage, LanguageModelResponsePart2; 171: LanguageModelChatProvider; 183: ChatRequest; 186: LanguageModelChatInformation |
| `vscode/src/vscode-dts/vscode.proposed.chatReferenceBinaryData.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: ChatPromptReference; 12: ChatReferenceBinaryData; 15: ChatReferenceBinaryData |
| `vscode/src/vscode-dts/vscode.proposed.chatReferenceDiagnostic.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: ChatPromptReference; 12: ChatReferenceDiagnostic; 15: ChatReferenceDiagnostic |
| `vscode/src/vscode-dts/vscode.proposed.chatSessionCustomizationProvider.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 13: ChatSessionCustomizationType; 17: ChatSessionCustomizationType; 19: ChatSessionCustomizationType; 21: ChatSessionCustomizationType; 23: ChatSessionCustomizationType; 25: ChatSessionCustomizationType; 27: ChatSessionCustomizationType; 29: ChatSessionCustomizationType; 49: ChatSessionCustomizationProviderMetadata; 65: ChatSessionCustomizationType; 68: ChatSessionCustomizationSource; 73: ChatSessionCustomizationItem; 82: ChatSessionCustomizationType; 97: ChatSessionCustomizationSource; 147: Chat; 161: ChatSessionCustomizationProvider; 178: ChatSessionCustomizationItem; 193: ChatSessionCustomizationSourceFolder, ChatSessionCustomizationType; 199: ChatSessionCustomizationSourceFolder; 205: ChatSessionCustomizationSource; 216: ChatSessionCustomizationProvider; 224: ChatSessionCustomizationProvider, ChatSessionCustomizationProviderMetadata |
| `vscode/src/vscode-dts/vscode.proposed.chatSessionsProvider.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 10: ChatSessionStatus; 34: ChatSessionItemProvider; 45: ChatSessionItemProvider; 48: ChatSessionItemController; 53: ChatSessionItemController; 57: ChatSessionItemController, ChatSessionItemControllerRefreshHandler; 63: ChatSessionItemController; 65: ChatSessionItemProvider; 75: ChatSessionItem; 78: ChatSessionItemController; 80: ChatSessionItem; 81: ChatSessionItem; 88: ChatSessionItem; 92: ChatSessionItem; 100: ChatSessionItem; 106: ChatSessionItemController; 108: ChatSessionItemControllerRefreshHandler; 110: ChatSessionItemControllerNewItemHandlerContext; 112: ChatRequest; 118: ChatSessionInputState; 124: ChatSessionItem, ChatSessionItemControllerNewItemHandler, ChatSessionItemControllerNewItemHandlerContext; 134: ChatSessionItemController; 136: ChatSessionControllerGetInputState; 140: ChatSessionInputState; 141: ChatSessionInputState; 144: ChatSessionItemController; 147: ChatSessionItem; 155: ChatRequestTurn2, ChatSessionItem, ChatSessionItemControllerForkHandler; 160: ChatSessionItemController; 171: ChatSessionItemCollection; 176: ChatSessionItem; 183: ChatSessionItemControllerRefreshHandler; 188: ChatSessionItem; 197: ChatSessionItemControllerNewItemHandler; 202: ChatSession; 205: ChatSessionItemControllerForkHandler; 210: ChatSessionControllerGetInputState; 213: ChatSessionItem; 214: ChatSessionItem; 220: ChatSessionItemCollection; 223: ChatSessionItemController; 224: ChatSessionItemCollection; 230: ChatSessionItem; 233: ChatSessionInputState; 235: ChatSessionInputState, ChatSessionProviderOptionGroup; 241: ChatSessionItem, ChatSessionItemCollection; 252: ChatSessionItem; 260: ChatSessionItem, ChatSessionItemCollection; 268: ChatSessionItem; 284: ChatSessionItem; 290: ChatSessionItemController; 291: ChatSessionItemController; 294: ChatSessionItem; 325: ChatSessionStatus; 396: ChatSessionChangedFile; 406: ChatSessionChangedFile; 435: ChatSession; 452: ChatRequestTurn, ChatResponseTurn2; 459: ChatSessionProviderOptionItem; 462: ChatSessionProviderOptionItem; 471: ChatResponseStream; 478: ChatRequestHandler; 481: ChatRequestHandler; 487: ChatSessionItem; 489: ChatSessionItemController; 497: ChatSessionItemControllerForkHandler; 503: ChatSessionOptionChangeEvent; 520: ChatSessionProviderOptionItem; 527: ChatSessionContentProvider; 533: ChatSessionOptionChangeEvent; 540: ChatSessionContentProvider; 548: ChatSession; 554: ChatSession; 557: ChatSessionInputState; 558: ChatSession; 567: ChatSessionOptionUpdate; 574: ChatSessionProviderOptions; 577: ChatSessionOptionUpdate; 591: ChatSessionContentProvider; 595: ChatParticipant; 599: ChatParticipant, ChatSessionCapabilities, ChatSessionContentProvider; 602: ChatContext; 603: ChatSessionContext; 606: ChatSessionContext; 607: ChatSessionItem; 618: ChatSessionProviderOptionItem; 623: ChatSessionInputState; 626: ChatSessionCapabilities; 636: ChatSessionProviderOptionItem; 691: ChatSessionProviderOptionModelMetadata; 696: LanguageModelChatInformation; 699: ChatSessionProviderOptionModelMetadata; 734: ChatSessionProviderOptionGroup; 753: ChatSessionProviderOptionItem; 758: ChatSessionProviderOptionItem; 783: ChatSessionInputState; 794: ChatSessionContentProvider; 804: ChatSessionProviderOptions; 809: ChatSessionProviderOptionGroup; 816: ChatSessionProviderOptionItem; 822: ChatSessionInputState; 847: ChatSessionProviderOptionGroup |
| `vscode/src/vscode-dts/vscode.proposed.chatStatusItem.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: ChatStatusItem; 64: ChatStatusItem |
| `vscode/src/vscode-dts/vscode.proposed.defaultChatParticipant.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: ChatWelcomeMessageContent; 14: ChatTitleProvider; 16: ChatContext, ChatResult; 18: ChatContext; 21: ChatSummarizer; 22: ChatContext; 25: ChatParticipant; 37: ChatTitleProvider; 38: ChatSummarizer |
| `vscode/src/vscode-dts/vscode.proposed.languageModelCapabilities.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 10: LanguageModelChat; 25: LanguageModelChatCapabilities |
| `vscode/src/vscode-dts/vscode.proposed.languageModelPricing.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 10: LanguageModelChatInformation; 80: LanguageModelChat |
| `vscode/src/vscode-dts/vscode.proposed.languageModelProxy.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 7: LanguageModelProxy; 15: Chat; 16: Chat; 29: LanguageModelProxy |
| `vscode/src/vscode-dts/vscode.proposed.languageModelSystem.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 12: LanguageModelChatRequestOptions; 14: LanguageModelChatMessageRole |
| `vscode/src/vscode-dts/vscode.proposed.languageModelThinkingPart.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 13: LanguageModelThinkingPart; 40: LanguageModelChatResponse; 43: LanguageModelThinkingPart; 45: LanguageModelTextPart, LanguageModelThinkingPart, LanguageModelToolCallPart; 48: LanguageModelChat; 49: LanguageModelChatMessage, LanguageModelChatMessage2, LanguageModelChatRequestOptions, LanguageModelChatResponse; 50: LanguageModelChatMessage, LanguageModelChatMessage2; 56: LanguageModelChatMessage2; 64: LanguageModelChatMessage2, LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolResultPart; 72: LanguageModelChatMessage2, LanguageModelDataPart, LanguageModelTextPart, LanguageModelToolCallPart; 77: LanguageModelChatMessageRole; 83: LanguageModelDataPart, LanguageModelTextPart, LanguageModelThinkingPart, LanguageModelToolCallPart, LanguageModelToolResultPart; 97: LanguageModelChatMessageRole, LanguageModelDataPart, LanguageModelTextPart, LanguageModelThinkingPart, LanguageModelToolCallPart, LanguageModelToolResultPart; 101: LanguageModelToolResultPart; 103: LanguageModelToolResultPart, LanguageModelToolResultPart2; 106: LanguageModelToolResult; 108: LanguageModelToolResult, LanguageModelToolResult2 |
| `vscode/src/vscode-dts/vscode.proposed.languageModelToolResultAudience.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: LanguageModelPartAudience; 25: LanguageModelChatResponse; 27: LanguageModelTextPart, LanguageModelTextPart2; 28: LanguageModelPartAudience; 29: LanguageModelPartAudience; 32: LanguageModelDataPart, LanguageModelDataPart2; 33: LanguageModelPartAudience; 34: LanguageModelPartAudience |
| `vscode/src/vscode-dts/vscode.proposed.languageModelToolSupportsModel.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: LanguageModelToolDefinition, LanguageModelToolInformation; 30: LanguageModelChatSelector; 44: LanguageModelToolDefinition; 51: LanguageModelToolDefinition; 52: LanguageModelTool; 65: LanguageModelToolInformation, LanguageModelToolInvocationOptions, LanguageModelToolResult |
| `vscode/src/vscode-dts/vscode.proposed.mappedEditsProvider.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 33: ChatResult |
| `vscode/src/vscode-dts/vscode.proposed.mcpServerDefinitions.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 13: McpGatewayServer; 31: McpGateway; 36: McpGatewayServer; 42: McpGatewayServer; 57: McpServerDefinition; 76: McpGateway; 81: McpGateway; 84: McpGateway |
| `vscode/src/vscode-dts/vscode.proposed.mcpToolDefinitions.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 11: McpServerLanguageModelToolDefinition; 14: McpToolAvailability; 31: McpServerLanguageModelToolDefinition; 42: McpToolAvailability; 52: McpStdioServerDefinition; 55: McpServerMetadata; 57: McpServerMetadata; 61: McpServerLanguageModelToolDefinition; 80: McpStdioServerDefinition, McpStdioServerDefinition2; 81: McpServerMetadata; 82: McpServerMetadata; 85: McpHttpServerDefinition, McpHttpServerDefinition2; 86: McpServerMetadata; 96: McpServerMetadata |
| `vscode/src/vscode-dts/vscode.proposed.speech.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 8: SpeechToTextOptions; 12: SpeechToTextStatus; 20: SpeechToTextEvent; 21: SpeechToTextStatus; 25: SpeechToTextSession; 26: SpeechToTextEvent; 64: SpeechProvider; 65: SpeechToTextOptions, SpeechToTextSession; 72: SpeechProvider |
| `vscode/src/vscode-dts/vscode.proposed.toolInvocationApproveCombination.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 10: LanguageModelToolConfirmationMessages |
| `vscode/src/vscode-dts/vscode.proposed.toolProgress.d.ts` | P-D / T-A+T-C（stable保留，proposed声明不可恢复运行） | 9: LanguageModelTool; 22: LanguageModelTool; 23: LanguageModelToolInvocationOptions, LanguageModelToolResult |

## 专属删除域与不能扩大删除的公共域

本次 scanner 的退休域：`workbench/contrib/{chat,inlineChat,mcp,speech,agentsVoice,dictation,welcomeAgentSessions}`、`terminalContrib/{chat,chatAgentTools,voice}`、`workbench/services/{chat,mcp,agentHost,localTranscription,aiRelatedInformation,aiEmbeddingVector,aiSettingsSearch}`、`platform/{chat,agentHost,mcp,localTranscription,sandbox,webContentExtractor,networkFilter}`、专属 MainThread/ExtHost Chat/LM/MCP/Speech/AI/EmbeddingVector/CodeMapper 文件。`platform/networkFilter` 是否可删须以其余普通消费者核对；下一表每条外部路径给出实际 consumer，不能仅因名称删整域。`agentPlugins` 解析器是追加专属域，原表按 D-X 包含它的直接入边，实施删除前继续反向检查剩余 import。

公共保留：`base/parts/sandbox`、`base/node/pty`/ptyHost、storage/SQLite、普通 proxy/network、MainThreadWebviews/Window/UriOpeners、auth provider/session/secret、ordinary Command/URI/Markdown converter。Notebook/Debug 残留所属原裁剪域只影响源码编译收口，不能按名字扩大删除普通 Markdown/Mermaid/图片预览扩展。

## 缺口与后续动作

1. 本次完成静态清单，不跑 typecheck/build/真宿主/UI；API 无能力对象尚未实现，T-* 都是建议而非通过证据。此记录不替代 M1 同条件 app/ZIP基线、运行注册枚举及保留面实测。
2. `sessions/**`/既有 Notebook/Debug 残留/`agentPlugins` 追加域的最小完整删除闭包由集成人按本清单确认；若保留某个纯 data helper，须迁移到 API 或通用层，不能继续 import 已删除服务。它们是 M4 开始前必须收口的源码输入，不以“没发布”跳过。
3. 静态字符串扫描覆盖字面量动态 import/资源，无法证明运行中计算出的路径和 extension manifest 所有注册已被枚举。产品 metadata、所有注册表种类、构建配置/内置扩展 manifest 由并行入口调查和集成人交叉核对；M4/M6 全图编译和实际 commands/config/menu/keybinding/view/walkthrough 枚举兜底。普通 Accessibility 与 auth 的真实操作仍待执行。
4. 记录生成时未读取运行历史/token，也未删除数据。生成态 diff hash仅可用于对照调查输入；之后重放树的 drift 应重跑清单并核对新增入边，不把旧行号当固定补丁位置。

## 二级 wrapper 与专属辅助模块的精确入边

此表补充上面按目录识别不能捕获的本地 wrapper/桥：terminal AHP/chat entry、agent edit marker、MCP auth、agentPlugins；逐项处理 wrapper 注册和 consumer 后再删除文件。其中退役域内来源随域删除，普通来源仅解绑目标分支；测试来源删除专属 case/mock、保留普通测试。每行均附明确动作。目录表与此表可能重叠，统计不相加。

| 源文件/行 | 目标 | 语句/符号 | 动作/验证 |
| --- | --- | --- | --- |
| `vscode/src/vs/platform/agentHost/node/shared/sessionMcpDiscovery.ts:11` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { makeMcpServerCustomization, normalizeMcpServerConfiguration, readJsonFile, resolveMcpServersMap, type IMcpServerDefinition } from '../../../agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/platform/agentPlugins/common/pluginParsers.ts:19` | `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.js` | `import { readAgentPluginManifest } from './agentPluginParser.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/platform/agentPlugins/test/common/pluginParsers.test.ts:38` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { IParsedHookCommand, makeMcpServerCustomization, parseComponentPathConfig, parseHooksJson, resolveComponentDirs, normalizeMcpServerConfiguration, shellQuotePluginRootInCommand, interpolateMcpPluginRoot, convertBareEnvVarsToVsCodeSyntax, toParsedAgent, toParsedSkill, parsePlugin, PluginFormat, } from '../../common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/platform/agentPlugins/test/common/pluginParsers.test.ts:39` | `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.js` | `import { AGENT_PLUGIN_MCP_SCHEMA, AGENT_PLUGIN_SCHEMA } from '../../common/agentPluginParser.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHost.contribution.ts:54` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostTerminal.contribution.ts:9` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/contrib/terminal/browser/agentHostSessionTaskRunner.ts:14` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/contrib/terminal/browser/sessionsTerminalContribution.ts:16` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/contrib/terminal/test/browser/agentHostSessionTaskRunner.test.ts:18` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalCreateOptions, IAgentHostTerminalService } from '../../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/sessions/contrib/terminal/test/browser/sessionsTerminalContribution.test.ts:12` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalCreateOptions, IAgentHostTerminalService } from '../../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/sessions/sessions.common.main.ts:122` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import '../workbench/services/authentication/browser/authenticationMcpUsageService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/sessions.common.main.ts:123` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import '../workbench/services/authentication/browser/authenticationMcpAccessService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/sessions/sessions.common.main.ts:124` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import '../workbench/services/authentication/browser/authenticationMcpService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/api/browser/mainThreadMcp.ts:28` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../services/authentication/browser/authenticationMcpAccessService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/api/browser/mainThreadMcp.ts:29` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../services/authentication/browser/authenticationMcpService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/api/browser/mainThreadMcp.ts:30` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../services/authentication/browser/authenticationMcpUsageService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/api/common/extHostTypeConverters.ts:53` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { type IParsedHookCommand } from '../../../platform/agentPlugins/common/pluginParsers.js';` | 删 hook converter/IParsedHookCommand import；保留普通 converters；T-A/T-C |
| `vscode/src/vs/workbench/api/test/browser/mainThreadMcp.test.ts:22` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../../services/authentication/browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/api/test/browser/mainThreadMcp.test.ts:23` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../../services/authentication/browser/authenticationMcpService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/api/test/browser/mainThreadMcp.test.ts:24` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../../services/authentication/browser/authenticationMcpUsageService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts:17` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { AllowedMcpServer } from '../../../../services/authentication/browser/authenticationMcpAccessService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.ts:18` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../../../../services/authentication/browser/authenticationMcpAccessService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.ts:19` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../../../../services/authentication/browser/authenticationMcpService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostAuth.ts:20` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../../../../services/authentication/browser/authenticationMcpUsageService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts:61` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostTerminalContribution.ts:19` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../../../workbench/contrib/terminal/browser/agentHostTerminalService.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/promptSyntax/hookUtils.ts:14` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { type IParsedHookCommand } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts:53` | `vscode/src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.js` | `import { DetachedTerminalCommandMirror, DetachedTerminalSnapshotMirror } from '../../../../../terminal/browser/chatTerminalCommandMirror.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginService.ts:12` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { type INamedPluginResource, type IMcpServerDefinition, type IParsedHookCommand, type PluginFormat } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginServiceImpl.ts:49` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { resolvePluginComponentDirs, getPluginManifestComponent, readPluginSkills, readMarkdownComponents, readPluginManifest, readPluginMcpServers, parseMcpServerDefinitionMap, detectPluginFormat, type PluginComponent, type IPluginFormatConfig, type IParsedHookGroup, } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/plugins/agentPluginServiceImpl.ts:62` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `export { shellQuotePluginRootInCommand, resolveMcpServersMap, convertBareEnvVarsToVsCodeSyntax } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.ts:33` | `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.js` | `import { readAgentPluginManifest } from '../../../../../platform/agentPlugins/common/agentPluginParser.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/hookSchema.ts:13` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { IParsedHookCommand } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl.ts:40` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { type IParsedHookCommand } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentPluginActions.test.ts:10` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostAuth.test.ts:18` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../../../../services/authentication/browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostAuth.test.ts:19` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../../../../services/authentication/browser/authenticationMcpService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostAuth.test.ts:20` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../../../../services/authentication/browser/authenticationMcpUsageService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts:47` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../../../../services/authentication/browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts:48` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../../../../services/authentication/browser/authenticationMcpService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts:49` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../../../../services/authentication/browser/authenticationMcpUsageService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts:89` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../terminal/browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostClientTools.test.ts:56` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../terminal/browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostTerminalContribution.test.ts:29` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { IAgentHostTerminalService } from '../../../../terminal/browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/agentSessions/resolveCustomizationRefs.test.ts:14` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/browser/aiCustomization/aiCustomizationItemsModel.test.ts:16` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/plugins/agentPluginEnablement.test.ts:10` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/plugins/agentPluginFormatDetection.test.ts:27` | `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.js` | `import { AGENT_PLUGIN_MCP_SCHEMA, AGENT_PLUGIN_SCHEMA } from '../../../../../../platform/agentPlugins/common/agentPluginParser.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/plugins/agentPluginFormatDetection.test.ts:28` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/plugins/convertBareEnvVarsToVsCodeSyntax.test.ts:12` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import type { IMcpServerDefinition } from '../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/plugins/pluginMarketplaceService.test.ts:18` | `vscode/src/vs/platform/agentPlugins/common/agentPluginParser.js` | `import { AGENT_PLUGIN_SCHEMA } from '../../../../../../platform/agentPlugins/common/agentPluginParser.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/chat/test/common/promptSyntax/service/promptsService.test.ts:59` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingFeature.ts:30` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { AgentHostEditMarkerService } from './agentHostEditMarkerService.js';` | 删 agent marker/correlation 分支；普通 edit tracking 保留；T-E/T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingImpl.ts:24` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError, IAgentHostEditMarkerService, IPreparedAgentHostEditAttributionFlush } from './agentHostEditMarkerService.js';` | 删 agent marker/correlation 分支；普通 edit tracking 保留；T-E/T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/editTracker.ts:13` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { IExternalEditCorrelation, IExternalEditCorrelationResolution } from './agentHostEditMarkerService.js';` | 删 agent marker/correlation 分支；普通 edit tracking 保留；T-E/T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:24` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { AgentHostEditAttributionDeferredError, AgentHostEditMarkerService } from '../../browser/telemetry/agentHostEditMarkerService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/editSourceTrackingImpl.test.ts:28` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { AgentHostEditAttributionDeferredError, AgentHostEditAttributionUnknownOutcomeError, IAgentHostEditMarkerService, IExternalEditCorrelation, IExternalEditCorrelationResolution } from '../../browser/telemetry/agentHostEditMarkerService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/editTelemetry/test/browser/editTracker.test.ts:17` | `vscode/src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.js` | `import { IExternalEditCorrelation, IExternalEditCorrelationResolution } from '../../browser/telemetry/agentHostEditMarkerService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts:15` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.js` | `import { AgentHostPty } from './agentHostPty.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts:16` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostOutputChannel.js` | `import { AgentHostOutputChannel } from './agentHostOutputChannel.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts:17` | `vscode/src/vs/workbench/contrib/terminal/browser/ahpTerminalCommandSource.js` | `import { AhpTerminalCommandSource } from './ahpTerminalCommandSource.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/ahpTerminalCommandSource.ts:13` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.js` | `import { AhpCommandMarkKind, getAhpCommandMarkId, type AgentHostPty, type IAgentHostPtyCommandExecutedEvent, type IAgentHostPtyCommandFinishedEvent } from './agentHostPty.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/terminal.contribution.ts:49` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { AgentHostTerminalService, IAgentHostTerminalService } from './agentHostTerminalService.js';` | 删 agent/chat 专属注册/entry；普通 terminal 保留；T-N/T-C |
| `vscode/src/vs/workbench/contrib/terminal/browser/terminalTabbedView.ts:26` | `vscode/src/vs/workbench/contrib/terminal/browser/terminalTabsChatEntry.js` | `import { TerminalTabsChatEntry } from './terminalTabsChatEntry.js';` | 删 agent/chat 专属注册/entry；普通 terminal 保留；T-N/T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostPty.test.ts:23` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.js` | `import { AgentHostPty } from '../../browser/agentHostPty.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostPty.test.ts:24` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostOutputChannel.js` | `import { AgentHostOutputChannel } from '../../browser/agentHostOutputChannel.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostTerminalService.test.ts:20` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.js` | `import { AgentHostPty } from '../../browser/agentHostPty.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/agentHostTerminalService.test.ts:21` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.js` | `import { AgentHostTerminalService } from '../../browser/agentHostTerminalService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/ahpTerminalCommandSource.test.ts:10` | `vscode/src/vs/workbench/contrib/terminal/browser/ahpTerminalCommandSource.js` | `import { AhpTerminalCommand, AhpTerminalCommandSource } from '../../browser/ahpTerminalCommandSource.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/ahpTerminalCommandSource.test.ts:11` | `vscode/src/vs/workbench/contrib/terminal/browser/agentHostPty.js` | `import { AgentHostPty, AhpCommandMarkKind, getAhpCommandMarkId, type IAgentHostPtyCommandExecutedEvent, type IAgentHostPtyCommandFinishedEvent } from '../../browser/agentHostPty.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminal/test/browser/chatTerminalCommandMirror.test.ts:23` | `vscode/src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.js` | `import { computeChatTerminalMirrorCols, computeMaxBufferColumnWidth, computeSnapshotLineCount, DetachedTerminalCommandMirror, DetachedTerminalSnapshotMirror, vtBoundaryMatches } from '../../browser/chatTerminalCommandMirror.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/contrib/terminalContrib/chatAgentTools/browser/tools/terminalCommandArtifactCollector.ts:9` | `vscode/src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.js` | `import { getCommandOutputSnapshot } from '../../../../terminal/browser/chatTerminalCommandMirror.js';` | 随退役专属域删除；T-C |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.ts:17` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from './authenticationMcpAccessService.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.ts:18` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from './authenticationMcpUsageService.js';` | 删除专属 wrapper；T-C |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationQueryService.ts:29` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from './authenticationMcpUsageService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationQueryService.ts:31` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from './authenticationMcpAccessService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/services/authentication/browser/authenticationQueryService.ts:32` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from './authenticationMcpService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationMcpAccessService.test.ts:12` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { AuthenticationMcpAccessService, AllowedMcpServer, IAuthenticationMcpAccessService } from '../../browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts:16` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../browser/authenticationMcpUsageService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts:18` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService } from '../../browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts:19` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../browser/authenticationMcpService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryServiceMocks.ts:10` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import { IAuthenticationMcpUsageService } from '../../browser/authenticationMcpUsageService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryServiceMocks.ts:12` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import { IAuthenticationMcpAccessService, urlsEqual } from '../../browser/authenticationMcpAccessService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/services/authentication/test/browser/authenticationQueryServiceMocks.ts:13` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import { IAuthenticationMcpService } from '../../browser/authenticationMcpService.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:25` | `vscode/src/vs/platform/agentPlugins/common/pluginParsers.js` | `import { PluginFormat } from '../../../../../platform/agentPlugins/common/pluginParsers.js';` | 专属测试删；普通测试解绑目标 mock/case；T-C |
| `vscode/src/vs/workbench/workbench.common.main.ts:116` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.js` | `import './services/authentication/browser/authenticationMcpUsageService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/workbench.common.main.ts:117` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.js` | `import './services/authentication/browser/authenticationMcpAccessService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |
| `vscode/src/vs/workbench/workbench.common.main.ts:118` | `vscode/src/vs/workbench/services/authentication/browser/authenticationMcpService.js` | `import './services/authentication/browser/authenticationMcpService.js';` | 删 MCP auth 注册/DI；普通 auth 保留；T-H/T-C |

## 基线缺陷：extensionhostdebugservice IPC 缺失

状态：主 agent 真宿主 fixture 已观察错误；本子任务完成静态根因核对，没有修改/修复或复跑 app。调查采用 debugging skill，先沿客户端订阅 → IPC → main 注册 → 既有补丁链核查。

| 层 | 事实 |
| --- | --- |
| 既有删除来源 | `patches/93-light-remove-debug.patch` 明确删 `app.ts` 的 `ElectronExtensionHostDebugBroadcastChannel` import、实例构造和 `mainProcessElectronServer.registerChannel('extensionhostdebugservice', ...)`；upstream HEAD 的 `app.ts` L1451–1453 原本提供服务。 |
| 客户端保留 | 当前 `workbench.desktop.main.ts` L124 仍 import `contrib/debug/electron-browser/extensionHostDebugService.ts`；它通过 `registerMainProcessRemoteService(IExtensionHostDebugService, ExtensionHostDebugBroadcastChannel.ChannelName, { channelClientCtor: ExtensionHostDebugChannelClient })` 注册远端 client。 |
| 普通扩展入边 | `services/extensions/electron-browser/localProcessExtensionHost.ts` ctor L136 注入服务，L159/L164 **无条件**订阅 onClose/onReload，仅 callback 内部判断 `_isExtensionDevHost`；因此普通扩展宿主也会发 channel.listen，缺陷不局限于 test/development。 |
| 超时错误来源 | `base/parts/ipc/common/ipc.ts:collectPendingRequest` L488–501 将未注册通道请求排队，超时打印 `Unknown channel`；Promise request 同时回 error，event listen 不会收到正常事件。 |
| 测试生命周期 | `api/common/extHostExtensionService.ts` L756–816 执行 runner.run Promise；`services/extensions/common/abstractExtensionService.ts` L584–613 捕获测试错误并调用 `_onExtensionHostExit(1)`；与缺通道为独立观测，不可把 fixture assertion reject 都归因于广播缺失。 |
| CLI 退出边界 | `code/node/cli.ts` L332–373 只有 --wait 添加等待 callback；macOS L563–580 spawn open 后等待 callback 集合。默认启动可以先返回 0，不能表示 extensionTests 成功。主 agent 已通过直接 Electron 执行确认 assertion reject 可 exit 1。必须使用唯一结果文件、实际测试入口完成标记、宿主退出码和 logs 共同佐证。 |

最小持久修复建议：追加补丁在 `app.ts` 恢复 upstream 的一个 `ElectronExtensionHostDebugBroadcastChannel` import 和实例/注册两行，保留现有 `IWindowsMainService`；不恢复 Run/Debug contributions/views/adapters。这是已有普通 extension-host 生命周期/开发宿主桥的服务端闭包，类名含 Debug 不足以说明是可删调试 UI。`platform/debug/common/extensionHostDebug{,Ipc}.ts` 和该 client/server 桥应进入公共保留表。

更窄的 `ExtensionHostDebugBroadcastChannel` common server 只支持 close/reload/attach/terminate；它无法处理 retained client 的 openExtensionDevelopmentHostWindow/attachToCurrentWindowRenderer。若选择它，必须另查并明确这些调用失败契约；相比恢复既有 Electron 桥，多出新的兼容性设计，故不作为首选。禁止用 Event.None 或在 IPC 层吞 Unknown channel 隐藏错误。

建议验证：先记录当前 fixture/普通宿主基线错误，再在隔离重放树仅恢复这三行及 import；分别冷启动普通扩展、开发宿主和测试 fixture，超过当前 IPC timeout 后检查无 Unknown channel，Reload/关闭行为及 extension test 成败退出传播正确。CI 验证需要真实宿主；仅 typecheck 不能发现缺 channel。修复未实施、以上验证未运行。

## 调查交付自查

- 精确 actor allowlist 对照当前 protocol：30 个 AI proxy key/Shape 已逐项对应；4 个普通 language actors 无删除行，保留表明确列出。检查脚本实际通过。
- 10 处多行 import 已展开为完整符号声明；另外保存 88 条二级 wrapper import（不与目录表重复计数）。
- 生成树 `git diff --binary HEAD` SHA256 再核对仍为 `046ee0eae8404f9a03d600fc4ce6c121f1f48f3bfd548215c1316bf2c9224fb5`，本调查未变更生成源码。
- 计划相对链接存在；记录文件落盘。没有运行 typecheck/build/UI/真实 API 契约验收，没有将调查自查写成 M1 通过。

## M4 实施补充（M1 冻结后发现的专属入边）

2026-10-01：实际 protocol/消费者核查补入 MainThreadEmbeddings/ExtHostEmbeddings 与 MainThreadAgentEditorComments/ExtHostAgentEditorComments 共4个专属 actors，删除集合由原30增至34；普通 Languages/LanguageFeatures仍保留。前者为退役 embeddings proposal运行链；后者连接sessions comments store，普通Markdown Editor无条件创建该桥，必须先删普通编辑器的创建/订阅/消息转接与agentEditorComments proposal声明，再删除actor/服务，保留Markdown编辑与preview。原M1 census记录不改写为当时已发现；本节补齐当前闭包。
