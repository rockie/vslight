# M6：最终 147+148+149 应用真实注册表

最终应用的 Cold、实际 Welcome 和真实 Reload 三次捕获均通过 147/149 精确负向门及继承的退休 ID/动态命令族对照。主线程普通 NPM/provider/hover/task 与普通编辑/Git 等实际 fixture 为 PASS；全部证据按捕获范围记录，不据此关闭其他 UI/auth/CI 门。

完整数据、文件 SHA、原始 authority、来源分类、例外和每项断言见 [M6-runtime149.json](M6-runtime149.json)。145 的实际红证据保留在 [M6-runtime145-cold.md](M6-runtime145-cold.md)，源码候选和模块回归见 [M4-retired-settings.md](M4-retired-settings.md)；没有覆盖旧快照或冻结补丁。

## 权威身份与只读范围

- 有效 profile root 为 `/private/tmp/lc149-my6ky2od`，user-data 为该 root 的 `u`，main PID 91720、renderer CDP 19500；extension host 在唯一 Reload 中从 92930 换为 2142。root 自己的早期私有 fixture 因 `engines.vscode=*` 被拒绝激活，旧 root 已退出并保留独立红记录；本捕获只使用有效 `^1.130.0` fixture。
- app 位于 `/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app`，目录名沿用 144，但 launch 明确标记整合 147+148+149。
- 当前 [registry.mjs](../../../dev/test-fixtures/lean-core/registry.mjs) 含只读 profiler，捕获 SHA 为 `e59cc46c8fbf0e9e7ff0907d3702c901ab2d85c885eaf0407e32b45b63cde5fd`。mandatory PID/executable/profile/port/listener 检查全部在 Runtime 探测前通过，结束后再次通过。
- 实际 loaded main 与 app 磁盘 SHA 均为 `ca30c3f30a81950153d7d9b433d32c4c78f3099bbfbef254b386088ed6786e97`；已加载同 URL import 新增 module 数为 0。没有重执行 main 或导入独立源码冒充注册表。
- 此 agent 只调用固定 helper 的 registry/data 查询，不执行 command/UI/DI.get，不启动或停止 profiler，不访问 19480。已有 profiler 的 own state/data 为 `0/null`。状态栏只读 own entry IDs/alignment，不读 command/tooltip/getter。

## 三次捕获

Cold 为 `2026-10-01T18:30:33.461Z`、Welcome 为 `18:37:53.513Z`、Reload 为 `18:40:54.511Z`，三个 helper 均 exit0；输出分别为有效 root 下的 registries-cold149、registries-welcome149、registries-reload149。三次实际 loaded/disk SHA 和 authority 前后检查相同。

| 实际集合 | Cold | Welcome | Reload |
|---|---:|---:|---:|
| CommandsRegistry handlers / metadata | 2123 / 891 | 2179 / 891 | 2152 / 891 |
| settings / excluded settings | 1565 / 10 | 1565 / 10 | 1565 / 10 |
| default keybindings | 975 | 975 | 975 |
| MenuId / 有 items 的 MenuId / items | 286 / 134 / 2397 | 286 / 135 / 2412 | 286 / 134 / 2404 |
| containers / views | 9 / 39 | 9 / 39 | 9 / 39 |
| viewsWelcome IDs / entries | 4 / 32 | 4 / 32 | 4 / 32 |
| singleton descriptors / renderer DI entries | 247 / 267 | 247 / 267 | 247 / 267 |
| 状态栏 models / entries | 1 / 2 | 1 / 4 | 1 / 4 |
| walkthrough instances / steps | 0 / 0 | 1 / 30 | 1 / 30 |
| command links / missing / retired | 41 / 0 / 0 | 74 / 2 / 0 | 74 / 2 / 0 |

三次设置 ID 与真实 145 相比恰好减少 147 指定的 9 项，其余 ID 全保留，没有新设置 ID。13 个普通 accessibility verbosity 和 23 个普通 signals 保留。cold 没有打开普通编辑器，状态栏为 Problems/notifications 两项；Welcome/Reload 加入普通 SCM 两项。旧 `editor.aiStats.enabled=true`、`git.addAICoAuthor=all` 已写入同一个 profile，三次仍没有 AI stats 项。

## 147 / 149 精确断言

9 个 retired schemas 在实际 settings/excluded settings 均无：notebook.codeActionsOnSave、search.experimental.closedNotebookRichContentResults、accessibility.verbosity.notebook/debug、accessibility.signals.lineHasBreakpoint/onDebugBreak/notebookCellCompleted/notebookCellFailed、accessibility.debugWatchVariableAnnouncements。

- Notebook 菜单没有任何实际 items；三条 Breadcrumbs Notebook menu entries 已撤。共享空 MenuId 标识依兼容约定保留。
- languageDetectionHints 的 properties/default/defaultDefaultValue 仅保留普通 `untitledEditors`；没有 `notebookEditors`。
- Mermaid 实际 WebviewContext 条件保留 Markdown/custom Markdown/独立 preview，两个 `notebook.output` 正分支为 0。
- NPM Debug 的两个 handler、metadata、menu references、专属 JS-debug command references 与 CodeLens schema 均为 0；scriptExplorerAction schema 的 enum 为 open/run，hover schema 为普通 Run。profile 的旧值仍为 `npm.scriptExplorerAction=debug`。真实普通 commands、Run hover、provider task 执行/落盘/结束 PASS；旧 tree click 映射由完整实际 147 NpmView 模块红绿证明，本记录不声称真实 GUI 点过该树节点。
- autoLockGroups 的 properties/default/defaultDefaultValue 不再有 Interactive Window 项；其余 11 项的 property schema/default 与实际 145 逐项一致。普通 Process Explorer/Terminal/第三方 Live Preview 三个 true 默认值保持。

## Welcome、普通行为与 Reload

Welcome/Reload 都有实际 1 walkthrough 实例、4 类别和 30 步。Setup/Beginner 为 true，SetupWeb 为 false，SetupAccessibility 保留 screen reader 条件及 11 个普通 editor/terminal/comment 无障碍步骤；全部 AI walkthrough 窄匹配为 0。

两个 missing links 为普通 Web 类别中的 toggleMenuBar（步骤 when 也是 false）和可选 remoteHub.openRepository；当前原生 macOS 不展示该类别。toSide 的普通 Settings/Keybindings/QuickOpen/Trust 路由正确解析，退休链接为 0；没有为这两个例外改产品。

主线程 ordinary149-01 实际 HTML/edit/save/search、Git diff/stage/commit、普通任务执行/停止、隔离普通 secret 操作为 PASS；npm149-02 和 welcome149-03 响应为 PASS，原始 request/response 与 fixture SHA 均保留在 JSON。唯一 Reload request 消耗后没有重放，旧 host 92930 退出、新 host 2142 就绪，main 91720 不变；null response 属实际 shutdown，原证据为 `/private/tmp/lc149-my6ky2od/reload149-after.json`。

## 全集、动态命令与普通元数据例外

沿用 145 审计的 1375 个 command/类 ID 候选、336 个 setting 候选和 960 个注册形状候选。960 含一般 super object/static ID 候选，不能据形状宣称每项都是已确认 Action2。当前真实 handlers、metadata、menu command/alt、bindings、command links 和 onCommand events 的退休命中均为 0；3 个普通 quickOpen/quickOpenWithModes/closeModalEditor 引用保持。

57 条动态/一般常量解析不了的来源逐项沿用定义、有限参数和精确 prefix，重新对照当前实际快照；每条 producer 在冻结 149 保留源物理 absent，有限 IDs/命令族当前命中均为 0。product/embedder 任意 key 的结论仍限于 producer 与捕获图，不作通用第三方 ID 黑名单。

全 scalar 比对只剩空字符串、error/notebook/scope/variable 的非 command 类、日志、语法或 picker 值。此前实际 autoLock metadata 的 `workbench.input.interactive` 已不再命中。

窄匹配仍为 1 marketplace Chat 分类 handler、2 普通 Markdown metadata、11 普通 schema、2 Markdown bindings、63 菜单聚合/空标识及 1 普通 IAiEditTelemetryService singleton；无退休 containers/views/viewsWelcome/statusbar。每项分类沿用 [M6-runtime145-cold.json](M6-runtime145-cold.json) 并对当前实际 item 重算 SHA。41 agentsWindow/3 HTTP agentHost annotation、普通第三方 CLI 标题及 Update 负向 guard 的纯数据例外保持，未按词删普通能力。

三次 267 个 renderer own service IDs 均无已退 Chat/MCP/speech/browser/agentHost/agentSessions/unification 名称匹配。Cold 的三个、Welcome/Reload 的四个已有 renderer channel server 仅为普通空 server、sync/recommendation、watcher、remoteResource/url，pending/request 为 0。

Cold 的 16 个复制日志，generic error/critical/Unhandled/serialize 与 helper 退休异常 pattern 都为 0。Welcome/Reload 的 generic scan 原始命中 5 条：Git fixture 曾缺少 main 分支的一条 merge-base 错误，以及普通 HTML/JSON language server 各两条 Node inspector 启动 stderr（被写成 error level）。日志和逐项分类保留；Reload 没有新增 error 文本。三次 helper 退休异常与 serialize pattern 均为 0，没有把所有日志级别门扩大写成零。

## 原生资源与验收边界

主线程拥有普通操作、NPM 激活、Welcome 和 Reload，本 agent 仅按通知重做同身份保护的只读捕获。三阶段已结束并通知主线程可以 quit；后续只读落盘证据。本记录只证明当前捕获时段，不能推导未来后台行为，也不替代 plan 中的其他真实 UI/auth/CI 门。

主线程 native_resources 的 Cold/Reload main/shared 四份 snapshot 均在 JSON 中只读引用，authority 为同 app/profile/main 91720，main/shared 端口为 19501/19502，loaded/disk 对应 SHA 一致。通用 main 的 extensionhostdebugservice、shared 的 v8InspectProfiling 以及普通 webview/terminal/fileWatcher/extensionHost 路径依约保留。renderer 结果本身不枚举所有 main/shared-process DI，不替主线程判定该独立原生门。
