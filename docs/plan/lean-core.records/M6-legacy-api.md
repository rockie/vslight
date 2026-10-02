# M6 Notebook / Debug 旧 API 闭包候选

- 计划：[lean-core.md](../lean-core.md) ADR-1、§5.4/5.6、M6 / V6–V9；只读全图 [M6-closure-inventory.md](M6-closure-inventory.md)。
- 基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，prepared +114；输入 `/tmp/lean-core-api-5_lg434f/vscode` 当前完整 114–125 源码及当时已经落到该树的共享普通消费者变更。不修改根生成 `vscode/`。
- 交付：[127-light-retired-notebook-debug-api.patch](../../../patches/127-light-retired-notebook-debug-api.patch)，23 个 sourcepath，534 additions / 744 deletions；SHA256 `8383d5cad6b785eb8a69ce38ea6b9001d2dd229dfa67ca9a6d3481f7a4fb71ca`。
- 私有源：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m6-legacy-api-js2_jypx/source`。rsync 排除仅根 `/.git/`、`/out*/`、`/node_modules/`、`/.build/`，保留 outline/output；node_modules 为既有只读 symlink。复制后的 Git HEAD 是本地 preimage 锚点，不是产品 source commit。
- 状态：候选实施与单独验证完成，待主集成串行接入；不是 M6 完整验收或全图构建通过。

## 最终行为

Notebook / Debug / Interactive 的真实 actors、DI 和 protocol runtime contracts 撤下，保留普通扩展初始化所需数据与本地无能力入口。稳定 Notebook/Debug constructors、enum 值、TabInput 数据、WorkspaceEdit 的 Notebook cell 数据仍可构造/序列化。工厂最大公开 API 对象的 347 个 symbol 与 preimage 逐项相同。

- Notebook documents/editor 查询为空，activeNotebookEditor 为 undefined；稳定事件 never fire，并支持正常 dispose / disposables 数组。
- serializer / status-bar / Debug configuration / descriptor / tracker 注册只返回本地 disposable。测试用会抛异常的 provider getters 验证没有读取；token dispose 可重复调用。没有存储 provider/handler，没有 RPC 或假 Controller。
- 异步 Notebook open/show、Debug start/stop 返回 rejected Promise；同步 Controller/renderer messaging、Debug console/add-remove breakpoints/asDebugSourceUri 明确 unavailable，签名不改成 Promise。
- Debug visualization / Notebook kernel-source 的 proposed 方法保留原 permission check；未授权拒绝权限，授权后依旧 unavailable。既有 AI/Browser proposal 分支不改。
- mainThreadBulkEdits 收到 `cellEdit` 在普通 bulk service 执行前拒绝，并在 `$tryApplyWorkspaceEdit` 上保持 Promise 拒绝；普通 text/file edit 的 resource canonicalization 保留。`vscode.resolveNotebookContentProviders` 是本地异步明确拒绝，不再调用 retired main command。
- `languages.match` 保留普通 LanguageSelector.from + score，普通 TypeScript selector 得10、只有 retired Notebook selector 得0；不读 Notebook actor。
- editor tabs 撤 Notebook/Interactive editor runtime instance 分支，普通 text/diff/custom/Webview/terminal/multidiff 继续；稳定 Notebook/Interactive TabInput DTO/constructors保留。Views extension point 撤 Debug 内置容器schema/分流，普通 Explorer/SCM/custom view注册保留。

## 纯数据与所有权

| 新落点 | 精确保留内容 / 闭包 |
| --- | --- |
| `api/common/notebookTypes.ts` | 181行；稳定 WorkspaceEdit/NotebookData/statusbar/kernel-action converter实际需要的24个 data declarations（含依赖）：CellKind/CellEditType/CellStatusbarAlignment、metadata/transient/options、output/cell edit DTO、ICellErrorStackFrame/ICellExecutionError。所有跨模块 imports 均为 type imports，无 DI/service/context注册。 |
| `api/common/debugTypes.ts` | 38行；仅 DebugConfigurationProviderTriggerKind、DebugTreeItemCollapsibleState、IDebugVisualizationTreeItem（含identity serialize/deserialize namespace）。零 imports；没有 IConfig/adapter/session wire contracts 或 Debug runtime。 |
| `workbench/common/notebookRange.ts` | 27行；原样 ICellRange/isICellRange 的数据与guard，零 imports/注册。六个 Comments消费者与mainThreadComments改import。 |
| `api/common/extHostDisabledLegacy.ts` | 复用既有 disabled helper 的 createRegistration/neverEvent/unavailable/unavailableAsync；只创建本地namespace兼容对象，不注册运行服务。 |

`notebookCommon.ts`、`debug.ts`、`abstractDebugAdapter.ts` 等完整运行文件没有保留或复制。初步曾考虑的 Debug config/adapter DTO 和 Notebook execution/events wire DTO 在 actor卸载后没有保留 API消费者，因此从最终pure文件中撤出。NotebookUri / ordinary Search/BulkEdit/Remote URLFinder由129负责；MCP test mocks/fixtures由128；main/shared/CLI/build/entry与platform/debug普通宿主广播桥由root负责。所有权：六 Comments文件 + api mainThreadComments归127；simpleCommentEditor/SCMInput的126 dictation行不改。

## Actor 集合与删除列表

退休 15 个 actor IDs：MainThread Debug1 + Notebook5 + Interactive1；ExtHost Debug1 + Notebook6（含save participant）+ Interactive1。对应 wire actor Shape interfaces及只被这些actors消费的wire DTO删除。保留值为 ExtHost55 / MainThread60；factory55个 `.set` 与 ExtHostContext55个key相等且无重复，MainThread60个key均有 decorator或Documents/Editors/Webview manager手动customer注册。`Object.values(ExtHostContext)` → `rpcProtocol.assertRegistered(expected)` 未过滤、未跳过。

下列25个 exact paths仅在私有验证副本删除，**127补丁没有整文件删除 hunks**。由root加入最终 prune，21个runtime +4个测试；不要以tsconfig exclude处理。

```text
src/vs/workbench/api/common/extHostDebugService.ts
src/vs/workbench/api/common/extHostInteractive.ts
src/vs/workbench/api/common/extHostNotebook.ts
src/vs/workbench/api/common/extHostNotebookDocument.ts
src/vs/workbench/api/common/extHostNotebookDocumentSaveParticipant.ts
src/vs/workbench/api/common/extHostNotebookDocuments.ts
src/vs/workbench/api/common/extHostNotebookEditor.ts
src/vs/workbench/api/common/extHostNotebookEditors.ts
src/vs/workbench/api/common/extHostNotebookKernels.ts
src/vs/workbench/api/common/extHostNotebookRenderers.ts
src/vs/workbench/api/browser/mainThreadDebugService.ts
src/vs/workbench/api/browser/mainThreadInteractive.ts
src/vs/workbench/api/browser/mainThreadNotebook.ts
src/vs/workbench/api/browser/mainThreadNotebookDocuments.ts
src/vs/workbench/api/browser/mainThreadNotebookDocumentsAndEditors.ts
src/vs/workbench/api/browser/mainThreadNotebookDto.ts
src/vs/workbench/api/browser/mainThreadNotebookEditors.ts
src/vs/workbench/api/browser/mainThreadNotebookKernels.ts
src/vs/workbench/api/browser/mainThreadNotebookRenderers.ts
src/vs/workbench/api/browser/mainThreadNotebookSaveParticipant.ts
src/vs/workbench/api/node/extHostDebugService.ts
src/vs/workbench/api/test/browser/extHostNotebook.test.ts
src/vs/workbench/api/test/browser/extHostNotebookKernel.test.ts
src/vs/workbench/api/test/browser/TestMainThreadNotebookKernels.ts
src/vs/workbench/api/test/browser/mainThreadVariableProvider.test.ts
```

## 修改 sourcepath

本记录所有源码路径相对事实 vscode 根；表中 `api/`、`contrib/`、`common/` 简写相对 `src/vs/workbench/`。prune paths使用完整 `src/vs/`前缀。

```text
src/vs/workbench/api/browser/extensionHost.contribution.ts
src/vs/workbench/api/browser/mainThreadBulkEdits.ts
src/vs/workbench/api/browser/mainThreadComments.ts
src/vs/workbench/api/browser/mainThreadEditorTabs.ts
src/vs/workbench/api/browser/viewsExtensionPoint.ts
src/vs/workbench/api/common/debugTypes.ts
src/vs/workbench/api/common/extHost.api.impl.ts
src/vs/workbench/api/common/extHost.common.services.ts
src/vs/workbench/api/common/extHost.protocol.ts
src/vs/workbench/api/common/extHostApiCommands.ts
src/vs/workbench/api/common/extHostDisabledLegacy.ts
src/vs/workbench/api/common/extHostTypeConverters.ts
src/vs/workbench/api/common/extHostTypes/workspaceEdit.ts
src/vs/workbench/api/common/notebookTypes.ts
src/vs/workbench/api/node/extHost.node.services.ts
src/vs/workbench/api/test/common/extHostDisabledLegacy.test.ts
src/vs/workbench/common/notebookRange.ts
src/vs/workbench/contrib/comments/browser/commentNode.ts
src/vs/workbench/contrib/comments/browser/commentReply.ts
src/vs/workbench/contrib/comments/browser/commentService.ts
src/vs/workbench/contrib/comments/browser/commentThreadAdditionalActions.ts
src/vs/workbench/contrib/comments/browser/commentThreadBody.ts
src/vs/workbench/contrib/comments/browser/commentThreadWidget.ts
```

## 验证与实际限度

| 检查 | 实际结果 |
| --- | --- |
| 新 contract suite | `node /tmp/m6-legacy-tests.cjs`，Node + Mocha运行bundle后的实际生产helper/types/converters/mainThreadBulkEdits：12 passing、exit0。覆盖上列行为与普通text/file edits，不重跑已绿AI/Browser/Converter整suite。测试module为patch内 `api/test/common/extHostDisabledLegacy.test.ts`。 |
| actual factory fragments + actor集合同步 | `node /tmp/m6-legacy-factory-check.cjs`，取当前factory AST实际15个Notebook成员 +普通languages.match编译运行（16成员）；空查询、never事件、serializer getter0读取、open/show Promise reject通过；ExtHost55 / MainThread60完整对应、退休15、unfiltered assert检查通过。此为模块/结构检查，没有冒充真实宿主启动。 |
| 生产module bundling可达图 | contract suite的esbuild metafile输入中 Notebook/Debug/Interactive退休 runtime路径为0。puredebug文件零imports，NotebookTypes仅typeimports，Range零imports。没有后台、RPC或download替代实现。 |
| API公开symbol | factory最大object347个property与preimage逐项相等。 |
| 全src noEmit | `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`，exit1，229条诊断；`workbench/api/**`为0。尚未合入128/129/130、未做全专属域prune，因此不宣称全图绿；逐文件计数见下表。最后修改仅恢复LanguageSelector原普通转换器与排版，受影响actual factory运行检查通过。 |
| clean replay | `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m6-legacy-replay-esthw42q/source`：git apply --check、实际apply、diff --check、reverse --check全部exit0；以private preimage HEAD重放。 |

私有日志：`legacy-contract-tests.log`、`legacy-contract-metafile.json`、`legacy-factory-check.log`、`legacy-typecheck-final.log`、`legacy-prune-paths.json`。通用文档checker按本仓根解释源码路径而报missing（本仓源码位于生成vscode/，事实输入在private snapshot）；另作fact-source路径验证，127所有exact sourcepaths在输入或private副本中存在，链接/计数人工复核。esbuild只作受影响module测试，不是产品build；使用既有开发依赖，未安装/修改生产dependency。没有GUI/真实extensionhost、旧profile恢复、产品build/smoke/CI，以上仍由root完整M6门验收。

剩余229诊断所在sourcepath：

| 文件 | 诊断数 | 处置 |
| --- | ---: | --- |
| `src/vs/sessions/contrib/browserView/browser/sessionBrowserView.ts` | 7 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/chat/browser/newChatInput.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/chat/browser/sessionBrowsersControl.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/chat/browser/sessionsChatAccessibilityHelp.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/chat/browser/variableCompletions.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/chat/test/browser/sessionBrowsersControl.test.ts` | 13 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/editor/browser/addTabActions.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/layout/browser/singlePane/singlePaneSharedHelpers.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/layout/test/browser/desktopSessionLayoutController.test.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHost.contribution.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostTerminal.contribution.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/terminal/browser/agentHostSessionTaskRunner.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/terminal/browser/sessionsTerminalContribution.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/terminal/test/browser/agentHostSessionTaskRunner.test.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/contrib/terminal/test/browser/sessionsTerminalContribution.test.ts` | 5 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/sessions.desktop.main.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/sessions/sessions.web.main.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts` | 11 | MCP专属action；root exact prune |
| `src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts` | 10 | MCP专属action；root exact prune |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityProvider.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityService.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatResponseAccessibleView.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatTerminalOutputAccessibleView.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/actions/chatActions.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/actions/chatCodeblockActions.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/actions/chatContextActions.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/agentPluginsView.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionHandler.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostTerminalContribution.ts` | 5 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgets.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/attachments/chatImplicitContext.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/attachments/implicitContextAttachment.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingEditorAccessibility.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingSession.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatEditing/chatEditingTextModelChangeService.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatEditing/notebook/chatEditingNotebookEditorIntegration.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatEditing/notebook/overlayToolbarDecorator.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/chatPetAchievements.contribution.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/tools/languageModelToolsService.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.ts` | 4 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatCollapsibleContentPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatInlineAnchorWidget.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownContentPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatProgressContentPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatToolInputOutputContentPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/codeBlockPart.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatOtherClientToolProgressPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolConfirmationSubPart.ts` | 14 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` | 20 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolProgressPart.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatDragAndDrop.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/browser/widget/input/editor/chatInputCompletions.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/electron-browser/actions/voiceChatActions.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostChatContribution.test.ts` | 8 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostClientTools.test.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentHostTerminalContribution.test.ts` | 5 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/chatAttachmentResolveService.test.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/tools/languageModelToolsService.test.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatSubagentContentPart.test.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/chat/test/browser/widget/chatTurnPills.test.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/mcp/browser/mcpCommands.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/mcp/browser/mcpServerActions.ts` | 3 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/mcp/browser/mcpServersView.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint.ts` | 1 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/contrib/speech/browser/speechAccessibilitySignal.ts` | 2 | 已退休Sessions/Chat/MCP/Notebook/Speech域，root prune |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts` | 3 | 128专属fixture/helper解绑 |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts` | 1 | 128专属fixture/helper解绑 |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts` | 10 | 128专属fixture/helper解绑 |

## 新发现的后续入边

129清理普通Search发现独立AI Search闭包尚留：`api/browser/mainThreadSearch.ts`、`api/common/extHostSearch.ts` 与node子类的AI provider/maps/manager/RPC；`extHost.protocol.ts`两个Search Shape及factory的AISearchKeyword纯data。127不动这些AI Search行，以免覆盖已有AI/Browser实施。已报告root并协调129接三个Search actor文件；root后续共享补丁撤protocol AI methods、将AISearchKeyword迁最小API纯data。不能删除整个普通Search actor来绕过编译。完整入边列表见M6 closure记录。

## Preimage证据

| 源文件 | SHA256 |
| --- | --- |
| `src/vs/workbench/api/common/extHost.api.impl.ts` | `27847dc9cd9330274e862bb768bf138c8a61458144fc038bf546c667d59c14be` |
| `src/vs/workbench/api/common/extHost.protocol.ts` | `0f00a2d95b3c885a2eba67c225d23361a8cccc0cf5594520e47f1cfa34a79612` |
| `src/vs/workbench/contrib/comments/browser/commentService.ts` | `c33266ef34f0e2ddbd5ba18f3bd0a8c85139326e47191294969a5ce7c8d9e403` |
