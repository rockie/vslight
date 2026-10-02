# M4 API 集成只读审计

2026-10-01。审计 `/tmp/lean-core-api-5_lg434f/vscode` 的当时集成修改态，未编辑 source、patch、app 或构建资源。主集成已合 115/116/117/118/120；119 协议/converters/类型/Markdown 与 122 普通消费者仍在修改。私有 git HEAD 为 `ad154d6d582ac01dda528c738d8e09c9da765a10`；根 HEAD 为 `f1961b7546139a6aa722ff0b8a001296d3041e33`，上游 vscode HEAD 为 `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。

行号对应各次只读观察的时刻；主集成继续删除 DTO 会移动行号，后续核对以路径和符号为准。此次是持续集成中的即时检查：一次 tsc 的诊断在后续源码修复前采集。下文区分首次观察和稍后只读确认；没有把旧错误列成当前未修故障，也没有把退休 Chat/Sessions 的依赖错误列成普通功能损坏。沿用 M4 已绿的 stable/proposed 测试，未重复执行；未操 GUI。

## API、协议与纯数据结果

| 审查面 | 当前读到的证据与边界 |
| --- | --- |
| ExtHost 注册全集 | extHost.protocol 中剩余 **65** 个 ExtHostContext ID，factory 的 rpcProtocol.set 恰为 **65** 个，集合差为空。factory:236–237 仍使用 Object.values 全集并 assertRegistered，无过滤 |
| MainThread 注册全集 | MainContext 剩余 **69** ID：61 个 extHostNamedCustomer decorator，另 8 个显式 set：mainThreadDocumentsAndEditors:306/309 两个；mainThreadNotebookDocumentsAndEditors:110/111 两个；mainThreadWebviewManager:24/27/30/33 四个。无额外退休 decorator |
| 两侧校验 | mainThreadExtensionService:58 从 MainContext 全部 keys 传 _setAllMainProxyIdentifiers；extensionHostManager:314 对该全集 assertRegistered；extHostRpcService:28 仍绑定原 assert。静态全集闭合不等于真实宿主已验收 |
| 退休 ID/Shape | 与私有 git HEAD 的协议相比删除 **34 ID**，对应 **34 Shape**。扫描全部 src TypeScript，无 Shape 引用、无 ID 运行引用；只有 mcpRegistry.test:746/761/772 三条旧注释提到 MainThreadMcp |
| DTO 删除 | 共 **102** 顶层 export 被删（包含 Shapes/Chat DTO），扫描所有 src 的 named protocol imports，无剩余删除 export 的 import。普通 language、auth、secret、tabs、webview/FS 等 Shapes 保留 |
| 纯数据与本地 module runtime 图 | 当前 extHostDisabledAi 打包输入 73、extHostTypes 72、完整 extHost.api.impl 334；三者均 **0 AI runtime inputs**。esbuild 仅 write:false 生成内存图，未执行工厂或运行 namespace 测试 |
| HookTypeValue | extHostTypes:33 的本地 10-member string union 与原 hookTypes enum 的十个值逐项一致；无需 import chat prompt service。纯 LM/MCP/message/result/error 构造仍保留 |
| 普通 tab 数值 | TabInputKind 固定 0–9 和 MultiDiff=11，删除 Chat=10 没有把后续普通 MultiDiff 重新编号。AnyInputDto/ExtHostEditorTabs 只去 Chat 分支；ordinary Text/Notebook/Custom/Webview/Terminal/Interactive/MultiDiff 保留 |
| Markdown bridge | markdownEditorProvider 与 package manifest 已无 createAgentEditorComments/agentEditorComments 桥；普通 provider 仍在。tsconfig 仍有 proposed.agentEditorComments include，属于可删的编译输入残项，不代表 runtime bridge 还在 |

运行图检查命令使用已安装的 `/Users/rockie/Documents/gh-xgent/vscodium/vscode/extensions/node_modules/esbuild`；主私有快照缺 extensions 的 esbuild 查找位置时直接使用原安装，只读使用，没有安装依赖。三次 build 均 bundle:true/platform:node/format:esm/write:false/metafile:true。AI 输入筛选覆盖 contrib/chat/mcp/speech/inlineChat、services/agentHost/aiRelatedInformation/aiSettingsSearch、platform/agentHost/mcp；三次均空数组。

### 34 个删除 ID

- `ExtHostAgentEditorComments`
- `ExtHostAiEmbeddingVector`
- `ExtHostAiRelatedInformation`
- `ExtHostAiSettingsSearch`
- `ExtHostChatAgents2`
- `ExtHostChatContext`
- `ExtHostChatDebug`
- `ExtHostChatOutputRenderer`
- `ExtHostChatProvider`
- `ExtHostChatQuota`
- `ExtHostChatSessions`
- `ExtHostCodeMapper`
- `ExtHostEmbeddings`
- `ExtHostLanguageModelTools`
- `ExtHostMcp`
- `ExtHostSpeech`
- `MainThreadAgentEditorComments`
- `MainThreadAiEmbeddingVector`
- `MainThreadAiRelatedInformation`
- `MainThreadAiSettingsSearch`
- `MainThreadChatAgents2`
- `MainThreadChatContext`
- `MainThreadChatDebug`
- `MainThreadChatInputNotification`
- `MainThreadChatOutputRenderer`
- `MainThreadChatQuota`
- `MainThreadChatSessions`
- `MainThreadChatStatus`
- `MainThreadCodeMapper`
- `MainThreadEmbeddings`
- `MainThreadLanguageModelTools`
- `MainThreadLanguageModels`
- `MainThreadMcp`
- `MainThreadSpeech`

## Xaa / OAuth 与共有类型边界

**当前没有 IMcpAuthenticationOptions 误删导致的普通 Xaa 故障，也不需要迁移这个类型。** 原协议中 IMcpAuthenticationOptions 仅用于 MainThreadMcpShape 的 getTokenFromServerMetadata/getTokenForProviderId。原 src 的调用者为 mainThreadMcp；extHostMcp 与其测试使用 IMcpAuthenticationDetails；现已整域退休。当前普通 Xaa/common/node Authentication 源码不 import、引用这两个 MCP options/details 类型。

必须保留的普通链路已保留：

- protocol ExtHostAuthenticationShape 的 registerDynamicAuthProvider/registerXaaAuthProvider，参数使用 base OAuth 的 IAuthorizationServerMetadata/ProtectedResourceMetadata/TokenResponse；MainThreadAuthenticationShape 的 promptForResourceClientSecret 仍是两个 string 参数、Promise<string | undefined>。
- MainThreadAuthentication 的 createXaa 仍发现 OAuth metadata、读取已有 dynamic auth registration/session cache、调用 registerXaaAuthProvider。仅撤掉 MCP-specific IdP config 优先值，不删除普通 issuer/clientId/clientSecret/initialTokens 参数。
- extHostAuthentication:369 仍注册 Xaa provider，NodeExtHostAuthentication:326 仍用 XaaifyAuthProvider(NodeDynamicAuthProvider)；base 动态 auth 仍保留正常 session/consent/URL handler/token cache 路径。
- extHostXaaAuthProvider:243–273 的 options.clientSecret 来自已有 vscode.AuthenticationProviderSessionOptions 通用签名，不是 IMcpAuthenticationOptions。资源 secret 优先显式值、然后当前 provider 内存 cache、再 prompt；undefined 是取消，空字符串是确认无 secret。mainThreadAuthentication:698 的 generic prompt 保持返回 trim/undefined，去掉 MCP URL key 的 OS secret 写入/删除及 code lens 文案；旧用户 MCP secret keys 不改写。

若后续 grep 发现新的普通 caller 引入 MCP options，应只把所需的有限字段迁到 authentication/common 的纯 interface；不得恢复 mainThreadMcp 或 MCP DI。目前没有这个前提，不增加迁移代码。

两个无 runtime 效果的注释残项可在 M6 整理：extHostXaaAuthProvider:93/238–241 仍描述 main-thread MCP 持久化/code lens 来源；authentication/common/authentication:328 的 issuer 注释仍举 mcp.enterpriseManagedAuth.idp。它们不是运行依赖，不应为删除注释而删除 generic Xaa。

## 一次全图检查与普通面最小修正

收到主构建结束通知后执行：

```sh
cd /tmp/lean-core-api-5_lg434f/vscode
node_modules/@typescript/native/bin/tsc --noEmit -p src/tsconfig.json
```

实际 stdout/stderr 保存 `/tmp/lean-m4-api-audit-tsc.log`；exit **1**，114 条 TS diagnostics，23,614 bytes。没有改 tsconfig、any、Null service 或跳过 assert。之后主集成继续修复，未再次运行 tsc。日志中普通/混合文件的十条诊断如下，建议均是精确删专属分支或恢复普通注册：

| 首次观察 | 后果与最小修正 | 稍后只读状态 |
| --- | --- | --- |
| authentication.contribution:75/95 TS6196 两普通类未使用 | 尾部 MCP 注释删除误连带删了普通 AuthenticationContribution / AuthenticationUsageContribution 的 registerWorkbenchContribution2。恢复 AfterRestored/Eventually 两注册及 WorkbenchPhase/import；不恢复 MCP actions。否则普通账户菜单/SignOut/管理扩展信任与使用 cache 初始化消失 | 已看到两原注册与 import 恢复（现:166/167）；未重跑类型或 GUI |
| extHostTypeConverters:2277 TS6133 isImageDataPart 未使用 | 它只供删除的 LM converters；删 helper，保留普通 DataTransfer/Notebook conversions | 已从稍后源码检索消失 |
| telemetry.contribution:439/456 TS2339 OutputLocation / AgentSandboxEnabled | 删两个退休 Chat terminal/sandbox telemetry case；不要给普通 enum 补假常量，不动 SuggestEnabled 分支 | 稍后源码两专属 case 已消失 |
| extHostTypeConverter.test:9 TS2305 ChatAgentResult / LanguageModelChatMessage2（2条） | 这是混合测试文件；只删 LM converter testcase 和 ChatAgentResult suite/import，保留 Markdown、Notebook serializer/output、LanguageSelector、WorkspaceEdit 回归 | 稍后这两个专属 import/cases 已消失 |
| extHostTypeConverters.test:10 TS2305 ChatResponseVoiceProgressPart | 只删该 speech/chat 专属测试及 import，保留 IconPath/ThemeColor/URI 普通测试 | 稍后专属 import 已消失 |
| authenticationQueryService.test:772/773 TS2304 trustedQuery/nonTrustedQuery（2条） | 原 isTrusted testcase 专门设置 mcpAccessService + account.mcpServer；清了一半留下断言。删整个 MCP-only testcase；保留相邻 clearAllData/getAllowedExtensions 普通测试 | 稍后两个残留名称已消失 |

这十条的受影响源码后续已被主集成精确修改。记录此处用于解释这一次失败，最终 tsc 和普通认证宿主行为仍由主集成验收，不能从静态源码消失推断全部通过。

## M6 退休域诊断清单

同次日志另有 **104** 条来自退休域/专属文件：Chat 61、MCP 6、Sessions 15、MCP-only authentication actions 21、Chat-only fixture 1。不能为让这些旧代码继续编译而复活已删除 API/terminal 服务，也不能删同目录的普通 auth 或 mixed converter tests。

### Sessions（含其测试）：15 条

| 文件 | 诊断数 |
| --- | --- |
| `src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHost.contribution.ts` | 4 |
| `src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostTerminal.contribution.ts` | 1 |
| `src/vs/sessions/contrib/terminal/browser/agentHostSessionTaskRunner.ts` | 1 |
| `src/vs/sessions/contrib/terminal/browser/sessionsTerminalContribution.ts` | 2 |
| `src/vs/sessions/contrib/terminal/test/browser/agentHostSessionTaskRunner.test.ts` | 2 |
| `src/vs/sessions/contrib/terminal/test/browser/sessionsTerminalContribution.test.ts` | 5 |

### 普通 authentication 目录中的 MCP-only actions：21 条

| 文件 | 诊断数 |
| --- | --- |
| `src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts` | 11 |
| `src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts` | 10 |

### Chat（含其测试）：61 条

| 文件 | 诊断数 |
| --- | --- |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatTerminalOutputAccessibleView.ts` | 2 |
| `src/vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp.ts` | 2 |
| `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts` | 3 |
| `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostTerminalContribution.ts` | 5 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolConfirmationSubPart.ts` | 14 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` | 19 |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts` | 8 |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostClientTools.test.ts` | 2 |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostTerminalContribution.test.ts` | 5 |

### MCP（含其测试）：6 条

| 文件 | 诊断数 |
| --- | --- |
| `src/vs/workbench/contrib/mcp/browser/mcpCommands.ts` | 3 |
| `src/vs/workbench/contrib/mcp/browser/mcpServerActions.ts` | 3 |

### 普通 fixtures 目录中的 Chat-only fixture：1 条

| 文件 | 诊断数 |
| --- | --- |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts` | 1 |


MCP-only actions 的 production import 已从 authentication.contribution/普通账户菜单去掉；把两个专属文件加入实际 prune 闭包。Chat/Sessions/相关测试及 fixture 属于本产品整体退休域，M6 删除源码后再收集新边；当前错误不是普通 terminal、任务或语言功能的实现要求。

### 额外 API / DTO 残项

- 普通 SCM actor 内仍有两个 AI RPC：protocol ExtHostSCMShape，extHostSCM:1176/1189，mainThreadSCM:233/237，scm/common/history:28/29 的 resolveHistoryItemChatContext / resolveHistoryItemChangeRangeChatContext。实际调用者仅 scmHistoryChatContext:181/221。M6 删除 Chat SCM context 贡献时同步删这两条 internal RPC/实现/内部接口；保留整个普通 SCM actor/history provider。scmHistoryProvider proposal 同时包含普通能力，不能删整 proposal 或把普通 history 注册 unavailable。
- protocol 的 IQuotaSnapshotDto / IRateLimitSnapshotDto / IQuotaSnapshotsDto 仅彼此引用，没有外部消费者；IAuthResourceMetadataSource / IAuthServerMetadataSource / IAuthMetadataSource 也仅互引。可以删除这些退休 Chat/MCP 独占 DTO，不恢复 actor。
- IXaaProviderDiscovery 当前是无调用的独立纯 DTO；可删 unused 定义，但不能由这个结论推广删除 generic Xaa 的 RPC、provider 构造或 OAuth types。
- extensions/markdown-language-features/tsconfig.json:14 残留 agentEditorComments proposed include，源码/manifest 已解绑，可去这个无用编译输入。其他普通 proposal 仍需保留。

[TODO] 最终删除域闭包、全src green、Main/ExtHost 实际全集注册、普通 auth/Xaa 交互、真实 Markdown/Webview 由主集成继续验收。本审计只新增记录，未操 GUI、未修改任何源码或补丁。
