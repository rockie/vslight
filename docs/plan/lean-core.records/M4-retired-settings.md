# M4：147 / 149 退休设置与普通消费者闭包

147、149 已冻结并由主线程集成，私有源码回归及原始完整项目 noEmit 通过。最终 147+148+149 应用的 Cold/Welcome/Reload 实际注册表精确负向门也已通过，见 [M6-runtime149.md](M6-runtime149.md)。145+146 原红快照仍保留；源码模块回归与正式结果分别记录。

- 147：[147-light-retired-notebook-debug-settings.patch](../../../patches/147-light-retired-notebook-debug-settings.patch)，SHA `eab769cfd3b1a15b5b6249ffdf14c287863cdb3f83b6cb08246c76904fb02a69`，19 文件。
- 149：[149-light-autolock-interactive-option.patch](../../../patches/149-light-autolock-interactive-option.patch)，SHA `d681ff55e2e2ef39fd0c59122ecea37e5e8a92ff247993a01a0c359043a455bb`，1 文件。
- 实际红证据及候选审计：[M6-runtime145-cold.md](M6-runtime145-cold.md) / [JSON](M6-runtime145-cold.json)。源码、脚本、输入图、检查日志和重放 SHA：[M4-retired-settings.json](M4-retired-settings.json)。

147 从冻结 145 私有源复制；149 从冻结 147 私有源复制。没有修改用户生成树、主线程源、共享 prune/plan/进度记录或 API 权限 fixture，没有访问活 GUI/CDP，也没有提交或推送。

## 147 红证据与修改边界

真实 cold 和 Welcome 快照都含以下 9 个专属设置。保留源码中，Notebook/Debug 专属 reader 已随领域 prune；残留来自普通注册模块内的共享声明。

| 实际 schema ID | 精确闭包 |
|---|---|
| notebook.codeActionsOnSave | 删除 `vscode/src/vs/workbench/contrib/codeActions/browser/codeActionsContribution.ts` 内 Notebook schema/值生成器/动态更新分支，以及 `vscode/src/vs/workbench/contrib/codeActions/browser/codeActions.contribution.ts` 的注册；普通 editor schema、动态 source kinds 和 keybinding args 保留 |
| search.experimental.closedNotebookRichContentResults | 删除 `vscode/src/vs/workbench/contrib/search/browser/search.contribution.ts` 的 schema、`vscode/src/vs/workbench/services/search/common/search.ts` 内唯一剩余内部 type 字段；普通搜索保留 |
| accessibility.verbosity.notebook / debug | 删除 `vscode/src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts` 内 enum/schema；普通 verbosity 保留 |
| accessibility.signals.lineHasBreakpoint / onDebugBreak | 删除上述 schema 及 `vscode/src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.ts` 中唯一专属静态 descriptors、Sound.break |
| accessibility.signals.notebookCellCompleted / notebookCellFailed | 删除 schema 及专属 descriptors；共享 taskCompleted/taskFailed 声音保留 |
| accessibility.debugWatchVariableAnnouncements | 删除该独占 Debug Watch schema；保留源无 reader |

同次实际 metadata/源消费者审查还收口了以下闭包：

- Breadcrumbs 的 NotebookToolbar、NotebookToolbarContext、NotebookStickyScrollContext 3 条菜单；普通 CommandPalette/MenubarAppearance/StickyScroll 及 toggle handler 保留。源为 `vscode/src/vs/workbench/browser/parts/editor/breadcrumbsControl.ts`。
- languageDetectionHints 中 `notebookEditors` 的 schema/default/internal type。保留 `vscode/src/vs/workbench/contrib/languageDetection/browser/languageDetection.contribution.ts` reader 仅使用 `untitledEditors`，普通语言检测和提示保留。
- Mermaid 两条普通 WebviewContext command 的 `notebook.output` 正分支，保留 Markdown preview/custom Markdown/独立 Mermaid preview 条件。源为 `vscode/extensions/mermaid-markdown-features/package.json`。
- 普通 panel、树 sticky scroll、glyph margin、terminal automation profiles，以及普通 clear/format/dimUnfocused 无障碍设置的说明，精确移除已退 Debug Console/Notebook/cell 描述；普通行为未删。

### NPM 的完整运行链

cold 的 `npm.debugScript` 只有 metadata/菜单而没有 handler，原因是扩展尚未激活；不能把它当作“无消费者”。实际源仍有 tree/hover command、hover link、Debug CodeLens/config listener 和 `extension.js-debug.*` 调用。

147 删除 `vscode/extensions/npm/src/npmView.ts`、`vscode/extensions/npm/src/scriptHover.ts` 的 Debug command/handler/link，`vscode/extensions/npm/src/tasks.ts` 的专属 startDebugging helper，`vscode/extensions/npm/src/npmMain.ts` 的 CodeLens import/constructor，以及 package.json/package.nls.json 的 Debug command、3 条 menu entries 和死说明文字。纯 Debug CodeLens 文件可精确 prune。

旧 `npm.scriptExplorerAction=debug` 不修改用户 profile，显式转成普通 `npm.runScript`。普通 open/run 选择保留，其他未知值回到 open；Run/Install tasks、hover Run、任务扫描和解析保留。tasks.ts 对用户 Node `--inspect/--debug` 命令行的 TaskGroup.Rebuild 分类仍保留，这只分类普通任务，不调用 debugger/JS-debug 入口。

147 不修改 IAiEditTelemetryService、普通 EditTracking/inline provider 遥测、普通 extension-host profiling、第三方 WebviewPanel/custom editor、APIimpl/proposal 权限或 protocol 契约。

### 精确 prune 建议

仅 2 条路径，与当时 252 条已有 prune 无重叠；主线程统一写 prune：

1. `vscode/extensions/npm/src/npmScriptLens.ts`：唯一 import/constructor 为 npmMain.ts，已撤；该文件只读 Debug CodeLens 配置并产生 JS-debug commands。
2. `vscode/src/vs/platform/accessibilitySignal/browser/media/break.mp3`：仅两个 Debug signals 通过 Sound.break 引用，均撤。普通 error/warning/task/terminal/diff/save/format/inline sounds 保留。

## 149：自动锁定选项逐项审查

真实 `workbench.editor.autoLockGroups` 有 `workbench.input.interactive` property，description 为 Interactive Window，默认值为 false；InteractiveEditorInput 已物理 prune。它是编辑器类 ID，不是命令。149 仅修改 `vscode/src/vs/workbench/browser/parts/editor/editorConfiguration.ts`：撤静态额外选项及随之没有覆盖对象的两个专属去重 ID，保留普通 Markdown preview 去重。无新 prune。

| 实际选项 | 分类与实体 |
|---|---|
| default | 普通 Text/default editor resolver |
| workbench.editorinputs.searchEditorInput | 保留 Search Editor input 与 resolver |
| workbench.editor.processExplorer | 保留 Process Explorer editor/input；default true |
| workbench.editors.gettingStartedInput | 保留普通 Welcome input/contribution |
| terminalEditor | 保留普通 Terminal editor/resolver；default true |
| vscode.markdown.editor | 保留 Markdown extension custom editor |
| imagePreview.previewEditor / vscode.audioPreview / vscode.videoPreview | 保留 Media Preview custom editors |
| workbench.input.interactive | 已退实体，删除仅剩的静态 schema/default 项 |
| mainThreadWebview-markdown.preview | 普通 Markdown WebviewPanel 兼容项 |
| mainThreadWebview-browserPreview | 可选第三方 Live Preview 的泛型 WebviewPanel 兼容项；default true，并非已 prune 的 built-in `simpleBrowser.view` |

各保留实体的路径/存在事实及第三方边界均记入 JSON。没有按 browser/interactive 字样整删泛型预览或普通编辑器能力。

## 红绿模块回归与类型检查

| 验证 | 结果与实际边界 |
|---|---|
| 147 settings | before/after 完整 a11y config/signal service、CodeActions、workbench config、terminal profiles、实际 search configuration registration：9 专属 schema→0、4专属 descriptors→0；13普通verbosity/23普通signals保留。实际动态 source-kind schema/keybinding enums 更新和 taskCompleted announcement 通过。Search 未变 UI/provider imports 与 DOM listener 为明确边界，不执行 GUI/声音 |
| 147 NPM | 完整实际 View/Hover/Task/readScripts 及 before CodeLens，真实 JSONC parser/临时 package/lock 文件；2 Debug commands、3 manifest menus、lens/config read/JS-debug call 撤下。旧 debug click、普通 Open/Run、Run hover、Install task 通过。VS Code host API 与 tasks.executeTask 为 fixture，无真实 shell/debugger/GUI 启动 |
| 147 menus | 原文件中完整 ToggleBreadcrumb action declaration，实际 Action2/MenuRegistry/CommandsRegistry/BreadcrumbsConfig：3普通菜单/切换保持、3Notebook菜单撤下。实际 ContextKeyExpr 对 Mermaid manifest 条件的 Markdown/独立/Notebook matrix 通过；不声称已实例化 Breadcrumbs DOM |
| 149 DynamicEditorConfigurations | 完整实际模块 70 inputs，真实 Registry/config/events。property/default 12→11，11普通项与145 capture数据一致，3 default true 保持；第三方编辑器动态更新、Markdown去重、binary/associations/large-file schemas 保留。resolver 输入取自实际 capture 并加入普通 fixture provider；无真实 GUI |
| 147 类型检查/重放 | 原始 src/tsconfig.json 完整 strict graph、NPM native/browser noEmit 均 exit0/0B。另复制一份完整冻结145源重放 patch+物理 prune，19文件 byte-equal，重复3项 noEmit均 exit0/0B；当前145+146源只读 apply-check exit0 |
| 149 类型检查/重放 | 完整冻结147源独立副本 full graph noEmit exit0/0B；baseline apply-check 与独立原文件 replay/byte-equal exit0 |

原始完整项目及 actor 类型校验保持；没有缩小 tsconfig 或删除类型错误门来取得通过。模块 fixture 的浏览器/host 边界和输入图在 JSON 中明确记录。

## 最终正式应用结果与边界

主线程整合 147/148/149 后完整构建并启动有效隔离 profile，main 91720、renderer 19500。三个 helper 捕获均验证同一实际 app/executable/profile/port，loaded/disk main SHA 一致；记录见 [M6-runtime149.json](M6-runtime149.json)。

1. 旧 editor.aiStats.enabled=true/git.addAICoAuthor=all、npm.scriptExplorerAction=debug 在 profile 中保留。三阶段 9 schema、退休 menus、NPM Debug/JS-debug references、Notebook hints 和 Interactive autoLock property/default 均为 0，普通13verbosity/23signals/11autoLock项保持。其他旧 Notebook/Debug profile key 未写入这次正式 profile；schema/静态 descriptor 退休由实际注册表与模块红绿分别证明。
2. 真实 NPM 扩展激活后普通 command 注册、Run hover、实际 provider task 执行/落盘/结束为 PASS。旧 tree click 的 Run 映射有完整真实 NpmView 模块证据；正式 fixture 保留该旧配置并证明普通任务能运行，没有声称 GUI 点过该树节点。
3. 实际普通 Welcome 和唯一真实 Reload 后均有 1 walkthrough/30步骤/74links；2 个普通 Web 缺失链接例外，退休 links 为 0。host92930退出→2142；三阶段精确退休 ID 和57动态家族均无命中。
4. Cold generic日志0；Welcome/Reload保留5条已分类普通 Git fixture/Node inspector 日志，Reload无新增error文本，退休异常及serialize0。其他普通 CodeActions、无障碍、Breadcrumbs、Markdown/Mermaid 实际 UI、auth/CI/native等计划门仍由主线程记录，模块绿和本注册表不替代它们。
