# lean-dist · 多视角评审

> 被审计划：[`lean-dist.md`](lean-dist.md)
> 评审日期：2026-09-28 · 只读评审，未改动计划与代码
> 报告交付：聊天内交付后按用户要求落盘于本文件

## 评审基线

| 项 | 值 |
| --- | --- |
| 计划文件 | `docs/plan/lean-dist.md`，351 行，sha256 `89f2adf8f61e2d2d` |
| 仓库根 | commit `d6143d210a62847b8c8ce15676fecf92a0180801`，工作树干净 |
| 工作目录 | `/Users/rockie/Documents/gh-xgent/vscodium` |
| 现有产物 | `VSCode-darwin-arm64/VSLight.app`（858MB；`Contents/Info.plist` `LSMinimumSystemVersion=12.0`、`CFBundleVersion=1.135.06523`），`assets/VSLight-darwin-arm64-1.135.06493.zip`（263.6MB） |
| `vscode/` HEAD | `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`（VS Code 1.135.0 + VSCodium patch 工作树，5452 个已改文件） |
| 环境 | macOS arm64；node 24.18.0；npm 10 |
| 并发修改核对 | 评审前后计划 sha256 不变（`89f2adf8f61e2d2d`）；工作树 clean —— 无并发修改 |

**执行方式**：4 个视角各由 1 名独立、全新上下文的只读 subagent 串并行调查。`facts`、`architecture`、`schedule` 首轮完成；`delivery` 第二轮独立完成。主 agent 复核了全部 P1/P2 结论，并补做独立测量（OneDataSystemAppender 7+ 实例化点、`@vscode/copilot-api` 1134 行 copilotApiService.ts + 7 个生产 import、`workbench.desktop.main.ts:95` 保留 `playwrightWorkbenchService` 导入、`extensions/*/package-lock.json` 11 个扩展携带 1ds@4.3.4、mermaid 三 bundle 实际体积 25/9.2/25MB、`build/linux/package_bin.sh:62` 真实存在、`check_paths.sh` 8 个 MISSING 路径均为 ★ 新增）。`check_progress.sh` 未跑（plan 初稿，进度表为空）。

---

## 1. 确认问题

未发现 P0。以下 P1 影响范围、外部契约或核心目标，须在 M2/M3 开工前修订；P2/P3 计划可逐步消化。

### P1

**F-01 [P1] D4 「`1dsAppender` 单点动态 import」描述严重低估工作面 —— 实际是 7+ 静态实例化点 + 3 个实现文件 + 1 个测试 + 4 个 SDK 包**
- 定位：`docs/plan/lean-dist.md:80`（D4）、`:71`（A-3）、`:159`（§1.1-A 「遥测 SDK 4 包」）、`:272`（§9.1 M3）。
- 问题：plan 把 `@microsoft/1ds-*` SDK 摘除描述为「单点动态 import + 4 包 package.json 删除」。实测该 SDK 的 `OneDataSystemAppender` / `OneDataSystemWebAppender` 类在 7 处活跃实例化（`cliProcessMain.ts:55/254`、`sharedProcessMain.ts:95/328`、`agentHostTelemetryService.ts:16/251`、`agentHostMicrosoftTelemetry.ts:9/67/82`、`workbench/services/telemetry/browser/telemetryService.ts:12`、另 1 处已被 93 号 patch 覆盖）；3 个实现文件 `platform/telemetry/{common,node,browser}/1dsAppender.ts`；1 个测试 `platform/telemetry/test/browser/1dsAppender.test.ts`；4 个包中只有 `1ds-core-js`（`vscode/package.json:96`）与 `1ds-post-js`（`:97`）是直接 dep，`applicationinsights-core-js` / `dynamicproto-js` 是 transitive（仅在 `package-lock.json`），从 package.json 删不到；ESLint 在 `vscode/eslint.config.js:1679-1680,1711-1712` 显式白名单 `1ds-{core,post}-js`，删除触发新 lint 回归。
- 证据：上述各文件行号；`vscode/package.json:95-152` devDependencies；`vscode/eslint.config.js:1679-1680,1711-1712`。
- 修订：D4 描述改为具体文件清单（7 消费点 + 3 实现 + 1 测试 + 4 package.json 依赖 + 2 个 ESLint 白名单条目）。预估工作量从「单点 stub」上调为「7 stub 构造 + 3 文件 + 1 测试 + ESLint 解白名单」。**体积账需重写**：23MB 仅指 vslight 主程序 SDK；扩展侧 11 个 extension 的 `extensions/{github,git,typescript-language-features,...}/package-lock.json` 各自携带 1ds@4.3.4，plan 不动扩展 = 主程序侧净收益约 3-5MB（不是 23MB），其余 ~25MB 由用户安装的扩展继续持有。§9.1 M3 增加 `grep -rln 'OneDataSystemAppender\|@microsoft/(1ds\|applicationinsights\|dynamicproto)' vscode/src/` 仅命中 §9.1 M2 已知字符串。
- 复核：M3 patch 后 `find out-build/vs/platform/telemetry -name '*1ds*'` 为空 + smoke L1 通过 + `npm run compile` 干净。
- 置信度：高（三视角独立确认）；阻塞：M3 实施前必须修订。

**F-02 [P1] D7 「playwright 摘除」前提错误 —— workbench 端 BrowserView 链路完全保留，删 `playwright-core` 会摧毁 BrowserView 基础**
- 定位：`docs/plan/lean-dist.md:84`（D7）、`:166`（§1.1-A 「playwright-core + chrome-remote-interface 12MB」）、`:302`（M3 退出条件 "D7 结论落记录"）。
- 问题：plan 说 playwright 是「agent 浏览器工具，agent host 已删（91/92 号），大概率无消费方」—— 91/92 号只删了 `build/buildfile.ts` 桌面入口和 sessions 入口，未触及 workbench 端 BrowserView 链路：①`vscode/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:138,486-487` 仍注册 `PlaywrightChannel` 与 `'playwright'` IPC 服务；②`vscode/src/vs/workbench/workbench.desktop.main.ts:95` 仍 `import './services/browserView/electron-browser/playwrightWorkbenchService.js'`（patch 92:170 显式保留此行）；③`vscode/src/vs/code/electron-main/app.ts:38-41,1360-1361` 仍注册 `ipcBrowserViewChannelName` / `ipcBrowserViewGroupChannelName` 与 `BrowserViewMainService`；④`vscode/src/vs/workbench/contrib/browserView/electron-browser/tools/` 13 个文件（`clickBrowserTool`、`typeBrowserTool`、`navigateBrowserTool`、`screenshotBrowserTool`、`runPlaywrightCodeTool`、`handleDialogBrowserTool`、`dragElementTool`、`hoverElementTool`、`readBrowserTool`、`listBrowserPagesTool`、`openBrowserTool`、`browserToolHelpers`、`browserTools.contribution`）均使用 `IPlaywrightService`；⑤`BrowserChatAgentToolsContribution` 始终注册 `OpenBrowserToolNonAgentic`（非 agentic 路径，仍依赖 `IBrowserViewWorkbenchService` → playwright 代理）。
- 证据：上述行号；`patches/92-light-remove-sessions.patch:170`（保留 import）；`grep -rln playwrightService src/` 命中 9 文件。
- 修订：D7 重新分类为「保留 + 记录理由」。可保留的细化路径：保留 workbench-side `playwrightWorkbenchService`（UI 入口）+ shared-process `PlaywrightChannel`（IPC）+ 13 个工具实现（用户可在 BrowserView 中手动操作），但可裁掉 `chrome-remote-interface` 与 `playwright-core` 的部分未用模块；或者把 D7 整体撤销（保留 playwright-core），记录"BrowserView 是 workbench 必需设施，agent host 移除未影响"的结论。M3 退出条件加 D7 决议分支（A. 摘除 + 102 号 patch + §9.1 playwright 残留断言；B. 保留 → 落记录含保留理由），并把 D7 决议前置到 M3 开工前。
- 复核：M3 记录文件 `docs/plan/lean-dist.records/M3.md` 包含 D7 决议与证据；B 路径下 §1.2 表 `patches/102-light-remove-playwright.patch` 标注「决议：未建」。
- 置信度：高（直接代码搜索）；阻塞：M3 开工前必须决议。

**F-03 [P1] M2 99 号 patch 与 `prune.json` 范围被低估 —— `@vscode/copilot-api` 涉及 1134 行 `copilotApiService.ts` + 7 个生产 import + typings + eslint + remote 三处，删不干净会留编译失败或运行时崩溃**
- 定位：`docs/plan/lean-dist.md:91`（ADR-1 背景 §2 「`@vscode/copilot-api` 依赖」）、`:183`（§1.2 M2 表 99 行）、`:301`（M2 退出条件）。
- 问题：plan 只说「从 npm 依赖树无 `@vscode/copilot-api`」。实测该包的使用面：①`vscode/src/vs/platform/agentHost/node/shared/copilotApiService.ts`（**1134 行**，是 agentHost 的核心服务）；②7 个生产 import（`agentHostPullRequestOperationHandler.ts:19`、`agentHostServices.ts:25`、`agentHostGitHubEndpointService.ts:56`、`shared/copilotApiService.ts:6`、`shared/githubMcpServer.ts`、`shared/agentBranchNameGenerator.ts`、`shared/worktreeIsolation.ts`、`shared/proxyChatError.ts`）；③`vscode/src/typings/copilot-api.d.ts:7-13`（环境声明）；④`vscode/eslint.config.js:1684`（globals 白名单）；⑤`vscode/remote/package.json:10` 与 `package-lock.json`（remote 端 npm 依赖）。只删 `package.json:107` 字符串会让 `npm ci` 通过（transitive 通过 `@github/copilot` 仍可能间接持有），但 `npm run compile` 在 typecheck 阶段因 `import { CAPIClient, RequestType, ... } from '@vscode/copilot-api'` 找不到类型而失败。
- 证据：上述各文件行号；`wc -l vscode/src/vs/platform/agentHost/node/shared/copilotApiService.ts` = 1134。
- 修订：M2 99 patch 范围追加 (a) 删除/重命名 `copilotApiService.ts` 的 `@vscode/copilot-api` import 并把 `ICopilotApiService` 注册设为 null；(b) `vscode/src/typings/copilot-api.d.ts` 删除；(c) `vscode/eslint.config.js:1684` globals 行删除；(d) `vscode/remote/package.json:10` 与 `package-lock.json` 同步。`prune.json` 也需将 `vscode/src/vs/platform/agentHost/node/shared/copilotApiService.ts` 加入；99 patch 应在 prune.json 之前完成 import 摘除，否则 `apply_actions exit 4` 不会触发（prune.json 删的是 `node/copilot/` 顶层目录，与 `shared/copilotApiService.ts` 不冲突，但需要核验）。
- 复核：M2 记录文件含 5 项 (a)-(e) 完成确认 + `find vscode/src -name 'copilotApiService.ts'` 为空 + `npm run compile` 干净。
- 置信度：高（grep 计数 + 文件行数直接读）；阻塞：M2 99 patch 开工前必须扩展范围。

**F-04 [P1] M2 99 patch 对 agentHost/node/copilot/ 残余的 import 摘除不完整 —— 至少 3 处活跃 import + 2 处测试引用 + 1 处 readFile 路径在 prune 后会断链**
- 定位：`docs/plan/lean-dist.md:91`（ADR-1 背景 §2 「剩 15 个文件 + byokLmProxyService.ts 仍被 import」）、`:184`（§1.2 M2 prune.json 行）、`:301`（M2 行）。
- 问题：①plan 说 `node/copilot/` 剩 15 个文件，实测 16 个 `.ts`（含 `prompts/` 内 2 个：`promptRegistry.ts`、`toolInstructions.ts`，以及 `prompts/AGENTS.md`）；②plan 只点名 `byokLmProxyService.ts` 仍被 import，实测还有 2 处活跃 import：`agentHostBootstrap.ts:32` `import { registerPendingEditContentProvider } from './copilot/pendingEditContentStore.js'` 与 `shared/sessionPluginBundler.ts:16` `import { DiscoveredType, type IDiscoveredDirectory } from '../copilot/sessionCustomizationDiscovery.js'`；③`agentHostTelemetryService.ts:226` 在 `joinPath(URI.file(environmentService.builtinExtensionsPath), 'copilot', 'package.json')` 引用 'copilot' 字符串路径（非 import，但 prune 后会触发 `Cannot find copilot/package.json`）；④测试 `agentHost/test/node/agentHostBootstrap.test.ts:17` 与 `byokLmProxyService.test.ts:12` 引用被删模块；⑤`agentHost/test/node/e2e/coverage/summary.json` 数据文件含 copilot 路径记录，会被 coverage 步骤误消费。
- 证据：上述各行号；`find vscode/src/vs/platform/agentHost/node/copilot -maxdepth 1 -name '*.ts' | wc -l` = 14，加 prompts/ 内 2 = 16。
- 修订：99 patch 必删文件清单：(a) `agentHostBootstrap.ts`（L32 import）+ `agentHostServices.ts`（L31 import）+ `shared/sessionPluginBundler.ts`（L16 import）+ `agentHostTelemetryService.ts`（L226 readFile stub）+ 2 个测试文件；(b) 删整个 `src/vs/platform/agentHost/node/copilot/` 目录（含 `prompts/` 子目录）必须排在 (a) 之后；§0.1 C-1 的 prune 时序「patch → light prune」保证此顺序可行，但 99 patch 必须在 light prune 之前完成所有 import 摘除，否则 `npm run compile` 报错。
- 复核：M2 记录含 5 项 (a)-(e) 完成 + `find out -name 'agentHostBootstrap.js' -o -name 'byokLmProxyService.js' -o -name 'sessionCustomizationDiscovery.js'` 为空 + `npm run compile` 干净。
- 置信度：高（grep + 文件存在性直接验证）；阻塞：M2 99 patch 开工前必须修订。

**F-05 [P1] M4 走查（「窗口/剪贴板/下载」）无任何可执行断言 —— 退出条件不可机器判定**
- 定位：`docs/plan/lean-dist.md:241`（§6 走查「剪贴板读写、下载行为」）、`:303`（M4 退出条件「三项行为走查通过」）。
- 问题：plan 把窗口/剪贴板/下载列为 M4 必走查项，但 `dev/smoke.sh` L3 段（AppleScript/AX）当前 0 个剪贴板断言、0 个下载断言（`grep -c "clipboard\|pbcopy\|set the clipboard" dev/smoke.sh` = 0；download 关键词亦无）；M4 退出条件「三项行为走查通过」只能由实施者目视走查，CI 与 dev 自动化均无法判定。
- 证据：`dev/smoke.sh:175-269` L3 段；`grep` 结果。
- 修订：`dev/smoke.sh` L3 段新增 (a) 剪贴板：AppleScript `set the clipboard to "vslight-m4-test"`，焦点切到 app，`key code 9 using command down`（Cmd+V），AX 读 `value of attribute "AXValue"` 校验文本一致；或 (b) `pbcopy`/`pbpaste` 工具跨进程；(c) 下载：在 workbench 触发一次文件下载（如 `workbench.action.downloadFile`），断言 `~/Downloads/vslight-m4-test.txt` 出现。M4 退出条件改为「`dev/smoke.sh` L3 新增 clipboard/download 断言全过 + 实施者目视确认」。
- 复核：M4 记录含新断言脚本 + 跑过日志 + 实施者目视确认截图。
- 置信度：高（直接 grep 验证）；阻塞：M4 退出条件可机器判定的最低标准。

**F-06 [P1] M2 §9.1 用户可见层断言缺位 —— 只验了 `product.json` 键与 node_modules 文件，Settings UI、命令面板、Extensions 推荐三面均未覆盖**
- 定位：`docs/plan/lean-dist.md:270-273`（§9.1 M2 断言）。
- 问题：plan 在 §9.1 M2 写了 4 条断言（`product.json` 无 copilot 键；`node_modules` 无 `@github/copilot*` / `@vscode/copilot-api`；docs 树无 `ext-github-copilot.md`），但用户安装后实际可见的层只有部分被覆盖：①Settings 页 `chat.*` 配置项仍有 10 个 schema（`phase-4-batch6-done.md` F-12 决策明说「保留作为隐藏面」），plan 没断言其计数与禁用状态；②命令面板输入 "Copilot:" 是否有 entries 未断言；③Extensions 推荐面板（打开 Marketplace 推荐）是否过滤 GitHub Copilot 未断言。
- 证据：`dev/smoke.sh:115-137` 当前 phase 4 chat 断言只查源码 `default: true`；`dev/progress/phase-4-batch6-done.md:19-21`。
- 修订：`dev/smoke.sh` L1 段新增：(1) `count_prefix 'chat\.[a-zA-Z]+'` ≤ 10（与 F-12 baseline 一致）；(2) 命令面板启动后 `count_prefix 'copilot\.'` = 0；(3) `extensionEnabledApiProposals` 中无 `GitHub.copilot*` 子键（用 `jq` 验证产物 `product.json`）。
- 复核：M2 记录含三项断言通过 + 数字与 F-12 baseline 对齐。
- 置信度：高；阻塞：M2 用户可见层不可观测即不可验收。

**F-07 [P1] M3 D4 移除 1ds SDK 后 VS Code 标准 telemetry 设置 UI 是否保留未断言 —— patch 过删会丢 `telemetry.telemetryLevel` 等用户配置项**
- 定位：`docs/plan/lean-dist.md:159`（D4 体积账）、`:272`（§9.1 M3）。
- 问题：D4 把 `@microsoft/1ds-*` 从 package.json 删除、摘 `1dsAppender` 注册点，但 VS Code 的 `telemetry.telemetryLevel` / `telemetry.feedback.enabled` / `telemetry.telemetryConfiguration` 设置项与 `1dsAppender` 并非 1:1 绑定 —— 它们走 `workbench/services/telemetry/` 普通 telemetryService（不经 1ds）。如果 100 号 patch 在删除 `1dsAppender` 时连带把 telemetryService 的 `registerConfiguration` 链路打断，用户在 Settings 搜索 "telemetry" 会得到空结果但没有任何错误提示。
- 证据：`vscode/src/vs/platform/telemetry/common/1dsAppender.ts:1-35`（仅 1 个 appender 实现）；`vscode/src/vs/workbench/services/telemetry/browser/telemetryService.ts:12`（独立于 1ds）。
- 修订：`dev/smoke.sh` L1 段新增 `count_prefix 'telemetry\.[a-zA-Z]+'` ≥ 1（保留 Settings UI 行）；§9.1 M3 追加「asar 内无 1ds-post-js/applicationinsights」并「telemetry.* schema 计数 ≥1」。
- 复核：M3 记录含 telemetry schema 计数结果；实施者目视确认 Settings 页面 telemetry 行存在。
- 置信度：高；阻塞：用户可见 Settings 回归路径。

### P2

**F-08 [P2] D4 「23MB 收益」账目口径错 —— 仅指 vslight 主程序 SDK；扩展侧 11 个 extension 的 `package-lock.json` 各携带 1ds@4.3.4，plan 不动**
- 定位：`docs/plan/lean-dist.md:159`（§1.1-A 「遥测 SDK 4 包 ~23MB」）、`:80`（D4 范围）。
- 问题：`vscode/package.json:96-97` 直接 dep 只有 `1ds-core-js` + `1ds-post-js`（共 ~25MB `du` 实测）；`applicationinsights-core-js` / `dynamicproto-js` 是 transitive，删除主程序 dep 后随之消失。`extensions/{git,github-authentication,github,html-language-features,json-language-features,markdown-language-features,media-preview,merge-conflict,microsoft-authentication,simple-browser,typescript-language-features}/package-lock.json` 各自携带 `@microsoft/1ds-{core,post}-js@4.3.4`（`grep -c '@microsoft/1ds-core-js\|@microsoft/1ds-post-js' extensions/*/package-lock.json | grep -v ':0'` 命中 11 个文件，每个 7 处引用）。vslight 不内置这些扩展，但用户从 open-vsx 安装后会带回 ~25-30MB 1ds@4.3.4 + 4 SDK 总和的 1ds 网络调用。
- 证据：`grep -l "@vscode/extension-telemetry\|@microsoft/1ds" extensions/*/package.json` 命中 11 个扩展；`grep "@microsoft/1ds-core-js" extensions/github/package-lock.json` = `@microsoft/1ds-core-js/-/1ds-core-js-4.3.4.tgz`。
- 修订：§1.1-A 体积账分列为「主程序 SDK 净收益 ~25MB（仅 2 个直接 dep）」；§0.5 加「per-extension 1ds SDK 不在 vslight 控制范围；用户安装扩展若含独立 1ds 上报，超出本期清理面」；或者 §9.1 M3 加 grep `find resources/app/extensions -name "package.json" | xargs grep -l "1ds-core-js"` 期望为零（但内置 git 等扩展的产物 dist 是 esbuild 后的 bundle，锁文件不在产物里，所以这条 grep 实际上 0 命中，只能通过源树验证 —— 应明示）。
- 复核：M3 记录含体积账复核结果 + per-extension 范围说明。
- 置信度：高（grep 直接验证）；不阻塞开工，但账目失真。

**F-09 [P2] D5 「chat-webview-out 是否删」决策规则缺失 —— 仅写「M2 内核查」，无显式阈值**
- 定位：`docs/plan/lean-dist.md:82`（D5 行）、`:90`（ADR-1 「`chat-webview-out` 9.4MB 是否随 D5 删取决于 chat 隐藏面是否引用」）、`:301`（M2 退出条件「核查结论记录」）。
- 问题：D5 拟删 mermaid `notebook-out`（已确认 dead）、保留 `markdown-preview-out`（活功能），但 `chat-webview-out`（实测 9.2MB）的去留依赖 chat 隐藏面是否引用。该目录被 `extensions/mermaid-markdown-features/src/editorManager.ts:172,208` 与 `chatOutputRenderer.ts:57` `Uri.joinPath(...,'chat-webview-out')` 运行时引用；M2 chat 摘 import 不涉及这两处（保留 chat 贡献本体），所以 `chat-webview-out` 仍被引用 → 不能删。plan 没把这个推导写明，依赖实施者自查。
- 证据：`find VSCode-darwin-arm64/.../mermaid-markdown-features/chat-webview-out -type f` 命中（9.2MB）；`grep -rn chat-webview-out vscode/extensions/mermaid-markdown-features/src/` 命中 3 处。
- 修订：M2 退出条件写明「chat-webview-out 引用核查：源码层 grep `Uri.joinPath`/`Uri.file` 含 `chat-webview-out` 处数 = N；若 N>0 则保留 bundle，否则删 esbuild.webview.mts chat 段 + package.json chatOutputRenderers 条目」。M3 101 patch 范围锁定为「仅删 notebook-out + mermaid-markdown-features/dist/、media 重映射」。
- 复核：M2 记录含 grep 结果 + 决议；M3 记录含 patch 范围与预期删除大小。
- 置信度：高（grep 验证）；不阻塞开工，但需 M2 内决策落点。

**F-10 [P2] §9.4 「Linux/Windows 无真实环境：明确不验证」与 NFR-3 「CI 15 workflow 绿」口径不一致，未引用 `vslight-release.md` 决策 8-B 锚定**
- 定位：`docs/plan/lean-dist.md:248`（NFR-3）、`:275`（§9.2）、`:289-291`（§9.4）。
- 问题：plan 自报 15 workflow / 13 setup-node step（实际 22，见 F-12），M6 退出条件说「CI 分支验证」但没明示 macOS-only 还是全平台。`docs/vslight-release.md:39-44` 决策 8-B 明确说「linux/windows CI 降为 `workflow_dispatch` 手动触发（保证可构建能力，不纳入发布验收）」。plan 没引用此决策，未来读者可能误把 linux/windows CI 绿当成验收项。
- 证据：`docs/vslight-release.md:39-44`（决策 8-B 原文）；`docs/plan/lean-dist.md:248,275`（无引用）。
- 修订：§9.4 加一句「CI 范围按 `docs/vslight-release.md` 决策 8-B：M6 验收只需 macOS arm64 CI 全绿；linux/windows 仅验证可构建」。§13 NFR-3 映射行加「依 `vslight-release.md` 决策 8-B」。
- 复核：M6 记录含 macOS CI 绿 + linux/windows CI 手动构建绿两段。
- 置信度：高；不阻塞开工。

**F-11 [P2] D2 `dev/build.sh` 加 `export CI=true` 后，调试场景用 `CI=` 显式清空覆盖 —— UX 反直觉，建议加显式 `--debug` 旗标**
- 定位：`docs/plan/lean-dist.md:78`（D2 行）、`:225`（§5-B）、`:303`（M1 退出条件）。
- 问题：plan 默认发布构建剥 sourcemap、调试场景用 `CI=` 前缀覆盖。这是反直觉的（用户必须先知道 env var 才能调试），且破坏部分 CI-in-a-box 场景中需要 `CI=true` 但又想保留 map 的需求。`dev/build.sh:11` 当前已有 `CI_BUILD="no"`、`-i`/`-l`/`-o`/`-p`/`-s` 五个旗标。
- 证据：`dev/build.sh` 当前 `grep "export CI"` 零命中。
- 修订：`dev/build.sh` getopts 加 `-d/--debug` 旗标（默认开 `CI=true`；`-d` 跳过）。M1 退出条件保留 `dev/build.sh --debug` 路径可走通的兜底。
- 复核：M1 记录含 `-d` 旗标测试 + 默认路径 sourcemap 剥离验证。
- 置信度：中（UX 建议）；不阻塞开工。

**F-12 [P2] NFR-3 「CI 15 个 workflow、13 个 setup-node step」数字错 —— 实际 22 个 setup-node step（facts F-05）**
- 定位：`docs/plan/lean-dist.md:248`（NFR-3）。
- 问题：实测 `grep -c setup-node .github/workflows/*.yml` = 22（ci-build-linux 3、ci-build-macos 1、ci-build-windows 2、publish-stable-{linux,windows} 各 2、publish-insider-{linux,windows} 各 2、publish-stable-macos/insider-macos/spearhead 各 1，加 linux 的 4）。
- 证据：`grep` 结果。
- 修订：NFR-3 改「CI 15 workflow + 22 setup-node step」；或仅描述 workflows 数、不报 setup-node 数。
- 复核：M6 验收行核对实际 step 数。
- 置信度：高；不阻塞开工。

**F-13 [P2] §1.1-A 「dev-tunnels-* 4 包」少算一个 —— 实测 5 包**
- 定位：`docs/plan/lean-dist.md:163`（§1.1-A dev-tunnels 行）。
- 问题：`vscode/package.json:98-102` 列 5 个：`connections`、`contracts`、`management`、`ssh`、`ssh-tcp`。plan 写 4 包，估算 1.9MB，实测 `du -ch` 合计 4.6MB。
- 证据：`grep "@microsoft/dev-tunnels" vscode/package.json | wc -l` = 5。
- 修订：§1.1-A 改「dev-tunnels-* 5 包（contracts/ssh/ssh-tcp/management/connections）~4.6MB」。
- 复核：M3 记录含实测 `du` 表。
- 置信度：高（直接读 package.json）；不阻塞开工。

**F-14 [P2] `dev/patch.sh:64-80` 前缀正则 `^([0-9])([1-9])(-.*)\.patch$` 只匹配 2 位数 —— 新 patch 98-103 三位数不命中自动前缀分组逻辑**
- 定位：`dev/patch.sh:64-80`；plan §1.2 M1-M4 patch 号段 98-103。
- 问题：plan 拟新增的 98-103 号段均为三位数。`dev/patch.sh` 当前正则匹配 2 位数前缀（用于自动应用此前所有 patch），对三位数 patch 单文件 `git apply` 时不会自动应用此前 91-97 + 98 之前的所有 patch。
- 证据：`dev/patch.sh:64-80` 正则 `^([0-9])([1-9])(-.*)\.patch$`。
- 修订：M3/M4 行加入工作流约束「生成 100 号 patch 前须在工作树上手动应用 91-99 + 已建 100 之前 patch，或调用 `dev/patch.sh 100-light-...patch 101-light-...patch` 多参数形式」。或者改 `dev/patch.sh` 正则兼容 3 位数（`^([0-9])([0-9])([1-9])(-.*)\.patch$`）。
- 复核：M3 记录含 `dev/patch.sh` 多参数形式走通验证。
- 置信度：高；不阻塞开工，但若不预知会导致 patch 生成失败。

**F-15 [P2] §1.2 文件清单 §1 「98 号 patch」vs §10 M1 退出条件「98 号 patch 删 welcome 媒体拷贝清单」描述模糊 —— `welcomeResourceIncludes` 具体路径未列**
- 定位：`docs/plan/lean-dist.md:180`（§1.2 98 行）、`:300`（M1 行）。
- 问题：`vscode/build/gulpfile.vscode.ts:103-104` 含 `'out-build/vs/workbench/contrib/welcomeGettingStarted/common/media/**/*.{svg,png}'` 与 `'out-build/vs/workbench/contrib/welcomeOnboarding/browser/media/*.svg'`。plan 没明说删哪行还是改类型；95 号 patch 当时只摘 import 没删 `vscodeResourceIncludes` 条目（plan §12 自报），98 号 patch 是补漏。
- 证据：`vscode/build/gulpfile.vscode.ts:103-104`。
- 修订：M1 98 号 patch 范围明确为「`vscode/build/gulpfile.vscode.ts` 删 L103 welcomeGettingStarted media 行 + L104 welcomeOnboarding media 行；同步修 `vscode/build/lib/sourcemaps/symbols.ts` 若有引用」。
- 复核：M1 记录含 98 patch 应用后产物 `out-build/vs/workbench/contrib/welcomeGettingStarted/common/media/` 为空。
- 置信度：高；不阻塞开工。

**F-16 [P2] §5-E "package.json + package-lock.json 双写"措辞不准 —— 实际是 5 文件**
- 定位：`docs/plan/lean-dist.md:227`（§5-E step ②）。
- 问题：plan 把 `package.json` + `package-lock.json` 合为一项"双写"，但每个文件只有 1 处 electron 版本字段（`package.json:212`、`package-lock.json:129` + `:7558-7560` resolved）。官方模板 `patches/00-build-update-electron.patch.no` 实际改 5 文件：①`.npmrc`、②`build/checksums/electron.txt`（75 行全量）、③`cgmanifest.json`（2 字段）、④`package-lock.json`（2 处）、⑤`package.json`（1 处）。
- 证据：`vscode/package.json:212`、`vscode/package-lock.json:129,7558-7560`、`vscode/cgmanifest.json:530-538`、`vscode/build/checksums/electron.txt` 75 行。
- 修订：§5-E 改写为「M4 改 5 文件：①`.npmrc` target= → 43.7.5（保留 `ms_build_id`）；②`package.json:212`；③`package-lock.json:129`（root deps）+ `:7558-7560`（resolved）+ integrity；④`cgmanifest.json:530-538` tag+commitHash；⑤`build/checksums/electron.txt` 全量替换为 43.7.5 SHASUMS256.txt」。
- 复核：M4 记录含 5 文件 git apply --check 与产物 `validateChecksum` 通过。
- 置信度：高；不阻塞开工。

**F-17 [P2] ADR-2 §C 选项注释「renderer 移除 clipboard 模块」是 44.x 行为而非 43.x —— §6 走查「剪贴板读写」基于 43.x 时是可用，应明示**
- 定位：`docs/plan/lean-dist.md:108`（ADR-2 C 选项）、`:241`（§6 走查）。
- 问题：ADR-2 C 选项注释写「renderer 移除 clipboard 模块」挂在 44.x 上；plan 选 B（43.7.5），所以 43.x 仍可用 renderer clipboard。但 §6 走查「剪贴板读写」容易让读者误以为 43.x 也已移除。
- 证据：`docs/plan/lean-dist.md:108,241`。
- 修订：§6 走查加「Electron 43.x 保留 renderer clipboard 模块（44.x 才移除）；剪贴板读写走查验证 43.7.5 主进程 clipboard API + renderer ncm 模块下的 OS 调用路径均通」。
- 复核：F-05 的剪贴板 smoke 断言通过。
- 置信度：中（依赖 Electron 43.x release notes 实测，需 M4 实施时核对）；不阻塞开工。

**F-18 [P2] §0.1 C-1「`prepare_vscode.sh:181-189`」与实际 `:181-186` 行号微差**
- 定位：`docs/plan/lean-dist.md:65`（C-1 行号）、`:226`（§2）、`:96`（ADR-1 行号）。
- 问题：light-prune 循环 `apply_actions "${file}"` 实际在 `:181-186`（仅一段循环）；plan 写 `181-189` 多 3 行。
- 证据：`prepare_vscode.sh:181-186`。
- 修订：行号改 181-186（或「约 181-186」）。
- 置信度：高；不阻塞开工。

**F-19 [P2] §0.1 C-4「`build/osx/prepare_assets.sh:36` 签名链」实际 `:37`**
- 定位：`docs/plan/lean-dist.md:67`（C-4 行号）。
- 问题：`electron-osx-sign` 调用实际在 `:37`。
- 证据：`build/osx/prepare_assets.sh:36-37`。
- 修订：行号 +1（37）。
- 置信度：高；不阻塞开工。

**F-20 [P2] NFR-4 引 `vslight-plan.md §0.2` 实为 §0 第 2 条**
- 定位：`docs/plan/lean-dist.md:64`（NFR-4 行）。
- 问题：`vslight-plan.md` §0 是「设计原则」（含 5 条编号项），第 2 条说「号段分配：Phase 3 用 90/91，Phase 4 从 92 起按批次递增」。「§0.2」不是真实节标题。
- 证据：`vslight-plan.md:18-19`。
- 修订：改 `§0 第 2 条` 或 `§0 (号段分配)`。
- 置信度：高；不阻塞开工。

### P3

**F-21 [P3] ADR-3 行号引用略偏 —— `preinstall.ts:11-53` 实际分散在 `:13-39`（node 版本）、`:41-54`（npm<13）、`:56-59`（yarn 拒绝）；`postinstall.ts:13,63,91` 中 63 与 91 不同语义**
- 定位：`docs/plan/lean-dist.md:117`（ADR-3 备选 A 行号）。
- 问题：plan 把 preinstall 版本门禁 + yarn 拒绝 + npm<13 都归在 11-53；postinstall 的 63 与 91 不全是 npm spawn。
- 修订：行号改 `:13-39, 41-54, 56-59`；postinstall 改 `:13, :91`（保留）。
- 置信度：高；不阻塞开工。

**F-22 [P3] §0.3 ADR-2 备选 C 注释「`build/linux/package_bin.sh:62`」行号与正文 `:55-61` 不一致**
- 定位：`docs/plan/lean-dist.md:108`（ADR-2 C）、`:326`（§12）。
- 问题：`build/linux/package_bin.sh:62` 实际是 major version guard 内的 `if` 行；plan 同时在 ADR-2 与 §12 引用，对应的是 `:55-61` 整段判断 + `:64` `exit 1`。`build/linux/package_bin.sh` 在仓库根（不是 `vscode/build/linux/`）。
- 修订：行号改 `:55-65` 或「major guard @ `build/linux/package_bin.sh:55-65`」。
- 置信度：高；不阻塞开工。

**F-23 [P3] §13 「chat-webview-out 删/留」缺映射行**
- 定位：`docs/plan/lean-dist.md:332-344`（§13 映射表）。
- 问题：§13 R-2 行写「覆盖（深度按 ADR-1）」，未单独列出 `chat-webview-out` 决策。
- 修订：§13 加一行「ADR-1 决策 → chat-webview-out 删除/保留（M2 内决议）」映射。
- 置信度：高；不阻塞开工。

**F-24 [P3] §9.4 「本机 macOS」未明示 macOS 走查由谁执行 —— 是实施者目视还是 CI 自动**
- 定位：`docs/plan/lean-dist.md:289`（§9.4）。
- 问题：M4 走查（窗口/剪贴板/下载）当前仅 L3 AppleScript/AX 可自动化，但依赖「辅助功能」权限（`dev/smoke.sh` 头部说明）。CI 无 GUI 时只能 `--skip-ui`。
- 修订：§9.4 写明「macOS GUI 走查：实施者在本机启动 + `--skip-ui` 失败时手动走查；CI 验证 L1+L2 即可」。
- 置信度：中；不阻塞开工。

---

## 2. 待核实 / 待决策

| 项 | 缺什么证据 / 需谁裁定 | 影响 | 最晚确认点 |
| --- | --- | --- | --- |
| Electron 44.4.5 / 上游 main 43.7.3 外部事实（ADR-2 选型） | 联网核对 `electron/electron` releases 与 `microsoft/vscode` main `package.json`；plan 已标「外部事实」但未在实施记录里贴证据链接 | ADR-2 选型（43.7.5 vs 44.x）的论证强度 | M4 开工前 |
| 26 个原生模块 install script 数量（ADR-3 备选 A） | 实测 bun install 时记录 native 模块报错/跳过数 | ADR-3「运行期/构建期不可」结论的细节强度 | M5 spike 第一命题 |
| A-2 mxc-sdk 裁到 arm64 后终端沙箱功能 | M3 内 smoke 终端断言 + 构建日志 | M3 实施落地 | M3 退出前 |
| A-3 1ds SDK 摘除后无运行期引用残留 | M3 patch + grep + smoke 验证（含 7 stub 构造与 ESLint 解白名单） | M3 实施落地 | M3 退出前 |
| 体积账实测（§1.1-A 各数字） | M1 内对当前 VSLight.app 与即将构建产物各跑一次 `du -sh` 落表 | 体积账基线口径 | M1 内 |
| `chat-webview-out` 决策（A 删 / B 留） | M2 内 grep `Uri.joinPath`/`Uri.file` 含 `chat-webview-out` 处数 | M3 101 patch 范围 | M2 内 |
| D7 决议（A 摘除 + 102 patch / B 保留） | M3 开工前决议（前置依赖 F-02 修订） | M3 101/102 patch 范围 | M3 开工前 |
| §9.4 Linux/Windows 范围口径 | 引用 `vslight-release.md` 决策 8-B 锚定 | M6 CI 验收 | M6 开工前 |
| 用户升级路径 `chat.disableAIFeatures: false` 行为 | M2 smoke 验证 override settings.json 后 chat 重启用的链路 | M2 用户可见层 | M2 内 |

---

## 3. 覆盖摘要

- **实际执行方式**：4 个视角各 1 名独立、全新上下文的只读 subagent 串并行调查。`facts`、`architecture`、`schedule` 首轮完成；`delivery` 第二轮独立完成。主 agent 复核了全部 P1 结论，并补做独立测量（OneDataSystemAppender 7+ 实例化点、`@vscode/copilot-api` 1134 行 + 7 生产 import、playwrightWorkbenchService 保留链路、11 个扩展 1ds@4.3.4、mermaid 三 bundle 实测 25/9.2/25MB、`build/linux/package_bin.sh:62` 真实存在）。
- **脚本**：`check_paths.sh docs/plan/lean-dist.md .` 已运行 —— 37 个路径 token，8 个 MISSING（`docs/adr/`、`docs/adr/bun-build-toolchain.md`、`patches/98..103-light-*.patch`），均为 §1.2 标 ★ 新增路径，无虚构复用；`check_progress.sh` 跳过（plan 初稿，进度表为空，符合骨架 0/N 初始化要求）。
- **四维覆盖**：
  - facts 逐条核对 §1.1/§1.2 数字与路径、行号、文件存在性（并入 F-04/F-08/F-12/F-13/F-18/F-19/F-20）。
  - architecture 评估 6 项关键决策（D2 sourcemap / D3 post-npm-ci / D4 telemetry / D5 mermaid / D7 playwright / M4 Electron）、patch 范围与工作量（并入 F-01/F-02/F-03/F-09/F-11/F-16/F-17/F-21/F-22）。
  - schedule 评估映射、依赖边、并发编排、退出条件可执行性（并入 F-04/F-05/F-06/F-07/F-14）。
  - delivery 评估用户主路径、Electron 升级回归、迁移/升级边界、文档传播（并入 F-05/F-06/F-07/F-10/F-23/F-24）。
- **未核实**：chat-webview-out 实际被 chat 隐藏面引用的命中处数（plan 提及需 M2 核查）；D7 playwright 评估结论（plan 也说"评估通过才建"）；1ds SDK 7 实例化点的 stub 设计选择（plan 没规定用 null object / no-op / 真实 SDK 哪个）；mxc-sdk arm64 裁剪后 sandboxHelper 的真实行为（plan 标"开放，M3 内解除"）。以上均不改变本文结论。
- **UI/UX 证据等级**：文档推演，待实现后应用内验收。本次无设计稿、无可运行产物、未启动应用或浏览器，因此只能判断入口/闭环/验收方案是否完整，不能判断布局、空状态、失败文案与图标实际观感；smoke L1/L2 算静态/CLI 验收，不算 UI 验收。

---

## 4. 需求 → 交付映射与实施编排

### 断链项

| 需求/决策 | 设计 | 任务 | 验收 | 状态 |
| --- | --- | --- | --- | --- |
| R-1 继续减肥 | §1.1-A + D2/D3/D4/D5/D7 | M1/M3 | §9.1 + 体积账 | F-04/F-08 让 M3 体积账失真 |
| R-2 去掉 copilot 相关 | ADR-1 + §5-C | M2 | §9.1 grep | **断链**（F-03 copilot-api 范围不全 + F-04 agentHost copilot 残余 + F-06 用户可见层无断言）|
| R-3 bun 评估 | ADR-3 + §5-F | M5 | ADR 落盘 | 覆盖 |
| R-4 Electron 到 latest | ADR-2 + §5-E | M4 | §9.1 + §6 | F-05 走查无机器断言；F-16 行号修正 |
| NFR-1 体积下降 | D2-D5/D7 | M1/M3 | 实测对比 | F-08 账目失真；F-13 数字偏差 |
| NFR-2 macOS 地板 | ADR-2 | M4 | plist 断言 | 覆盖 |
| NFR-3 CI 绿 | D1 | M6 | CI 分支验证 | F-10 范围不清；F-12 数字偏差 |
| NFR-4 patch 号段 | §1.2 | — | review | F-20 行号偏差 |
| C-1 prune 时序 / exit 4 | §2 | M2/M3 | M6 重放 | 覆盖（F-18 行号偏差）|
| C-2 Electron 链 | §5-E 四步 | M4 | validateChecksum | F-16 文件清单需重写 |
| C-3 运行时不可换 | ADR-3 | — | 物理事实 | 覆盖 |
| C-4 签名链不动 | §0.5 | M4 | 走查公证产物 | F-19 行号偏差 |
| A-1 CI=true 无副作用 | D2 | M1 | 试构建 | 覆盖 |
| A-2 mxc-sdk 裁剪安全 | D3 | M3 | smoke 终端 | 开放→M3 |
| A-3 遥测摘除无残留 | D4 | M3 | grep + smoke | **断链**（F-01 多实例化点 + F-07 UI 行不可见 + F-08 per-extension 范围）|

### 关键依赖边

`M0 收口（基线 du + 写独立记录）` → `M5 先行（隔离 worktree）` ↘
`M1（98 号 patch + dev/build.sh + dev/smoke.sh M1 断言）` → `M2（99 号 patch + product.json + prune.json + chat-webview-out 决策）` → `M3（D3 新段 + 100-102 号 patch + dev-tunnels + agentsVoice + D7 决议前置）` → `M4（103 号 patch 五文件 + clean node_modules + 重 npm ci + 公证产物 + smoke L3 新增）` → `M6（CI 绿 + 体积总账 + vslight-release.md 决策 8-B 锚定）`

**缺口节点**：
- F-01：M3 D4 patch 范围 + ESLint 解白名单 → M3 开工前补
- F-02：M3 D7 决议（A/B）→ M3 开工前补
- F-03：M2 99 patch 5 项范围 → M2 开工前补
- F-04：M2 99 patch agentHost copilot 残余 5 项 → M2 开工前补
- F-05：M4 smoke L3 clipboard/download 断言 → M4 开工前补
- F-06：M2 smoke L1 settings/commands/extensions 推荐 → M2 开工前补
- F-07：M3 smoke L1 telemetry.* schema 计数 → M3 开工前补
- F-14：dev/patch.sh 三位数支持或多参数调用约定 → M3 开工前补
- F-15：98 号 patch 范围具体化 → M1 开工前补
- F-09：chat-webview-out 决策规则 → M2 内落点

### 建议波次

| 波次 | 前置/解锁证据 | 可并行的工作 | 写入边界 / 共享负责人 | 运行资源约束 | 汇合验收 |
| --- | --- | --- | --- | --- | --- |
| W0 收口 | 现有基线 | 写 M1-M5 独立记录目录 `docs/plan/lean-dist.records/`；体积 du 表；移除 `assets/` 重复 hash 链（M1 可选） | — | 一次 `du` 跑 | du 表落盘 + 主树 git status clean |
| W1 评估 spike | W0 | M5 Bun spike（隔离 worktree） | 单人 W1：仅 worktree 内的 `node_modules/`、`package-lock.json`、ADR 文件；主树 lockfile 不可改 | 主树 git status 仅看 vscode/ + dev/ | ADR 落盘 + 主树 git status clean |
| W2 M1 | W0 + F-15 98 号 patch 范围 + F-11 dev/build.sh `-d` 旗标 | W1 | 单人 W2-M1：`dev/build.sh` + `dev/smoke.sh` M1 段 + 98 patch | 一次全量 `./dev/run-build.sh -s` | 体积基线表 + smoke L1+L2 全绿 + 98 patch 应用后产物体积实测 |
| W3 M2 | W2 + F-03 copilot-api 5 项 + F-04 agentHost copilot 5 项 + F-06 user-surface 断言 + F-09 chat-webview-out 决策 + F-18/F-19 行号 | W1 | 单人 W3-M2：根 `product.json` + `prepare_vscode.sh` del() + 99 patch + `prune.json` + `docs/ext-github-copilot.md` + `docs/index.md:28`；`dev/smoke.sh` M2 段 | 一次全量构建 + `jq empty` 校验 | §9.1 M2 全过 + chat-webview-out 决议记录 + user-surface smoke 通过 |
| W4 M3 | W3 + F-01 D4 多实例化点 stub + F-02 D7 决议（A/B） + F-07 telemetry schema 计数 + F-14 dev/patch.sh 三位数 + F-08 per-extension 范围 + F-13 dev-tunnels 5 包 + F-15 残留 welcome | — | 单人 W4-共享：`prepare_vscode.sh` D3 新段 + `prune.json` M3 项；4 patch 串行（共享 vscode/ 工作树 + ESLint 改动） | 同 W3，subagent 顺序测试需协调；推荐串行 patch 生成 | §9.1 M3 + 体积账 + D7 决议落记录 + telemetry schema 计数通过 |
| W5 M4 | W4 + F-05 L3 clipboard/download 断言 + F-16 5 文件清单 + F-17 §6 43.x 注释 + F-22 行号 | — | 单人 W5：103 patch 五文件 + 清 vscode/node_modules + 重 npm ci + 公证产物 + dev/smoke.sh L3 新增 | 单独立构建窗口；不可与 W4 同窗口 | plist 断言 + §6 走查（含 clipboard/download 自动化）+ smoke 全绿 |
| W6 M6 | W5 + F-10 vslight-release.md 决策 8-B 锚定 + F-12 setup-node 22 step | — | 主 agent | 干净树全量重放 | macOS CI 绿 + linux/windows 手动构建绿（依决策 8-B）+ 体积总账 + vslight-plan.md 文档标记 |

### 共享文件主写人规则

- `prepare_vscode.sh`：W3-M2（del 段 + jq）与 W4-M3（D3 新段）必须串行（顺序 W3 → W4），期间禁止他人修改。
- 根 `product.json`：W3-M2 单写。
- `patches/light/prune.json`：W3-M2 写 M2 项，W4-M3 写 M3 项，串行；期间禁止他人修改。
- `dev/smoke.sh`：每个里程碑各加本里程碑断言；W2 主写，W3-W5 各写一段后回主 agent 整合。
- `dev/build.sh`：W2-M1 单写（`export CI=true` 与 `-d` 旗标）。
- `vscode/` 工作树（patch 生成）：W3-M2 与 W4-M3 各独占完整 `vscode/` 工作树，patch 生成期间禁止他人构建。

subagent 并行前提：W1（W5）与 W2-W5 可并行（W1 在独立 worktree）。M3/W4 内 4 patch 可并行 subagent 各生成、独立测试（`dev/patch.sh` 多参数形式），但共享文件（`prepare_vscode.sh`、`prune.json`、ESLint 配置）由单人串行修改。

---

## 5. 总体结论与修订顺序

### 建议状态：`Blocked`

plan 自报 Ready。判 `Blocked` 的理由：F-01（telemetry 7+ 实例化点 + 4 SDK 范围描述失真）、F-02（playwright 摘除前提错误，会摧毁 BrowserView 基础）、F-03（`@vscode/copilot-api` 删除范围漏 1134 行 copilotApiService.ts + 7 import + typings + eslint + remote）、F-04（agentHost/node/copilot/ 残余 16 文件 + 2 处活跃 import + 2 测试 + 1 readFile 路径）任一未修订，M2/M3 实施即出构建失败或用户可见回归。F-05/F-06/F-07 是用户可见层走查缺位，使 M2/M3/M4 退出条件不可机器判定。这些不是补充细节，会改变 patch 范围、工作量与验收口径。

**解除阻塞的可观察条件**：
1. F-01：M3 D4 patch 范围具体化为 7 stub + 3 实现 + 1 测试 + 4 package.json + 2 ESLint；体积账口径重写。
2. F-02：M3 D7 决议前置到 M3 开工前（A 摘除 + 102 patch / B 保留落记录）。
3. F-03：M2 99 patch 范围追加 5 项（copilotApiService.ts import + typings + eslint + remote/package.json）。
4. F-04：M2 99 patch 范围追加 5 项（agentHostBootstrap + agentHostServices + sessionPluginBundler + agentHostTelemetryService + 2 测试）。
5. F-05：dev/smoke.sh L3 段加 clipboard/download 自动化断言。
6. F-06：M2 smoke L1 加 user-surface 三项断言（settings chat.* ≤10 / commands copilot.* = 0 / product.json 无 GitHub.copilot* 子键）。
7. F-07：M3 smoke L1 加 telemetry.* schema 计数 ≥1。

### 修订顺序（先纠正前提/契约，再改设计，再补映射与编排）

1. **前提与契约**：F-01（telemetry 范围）→ F-02（D7 决议）→ F-03（copilot-api 范围）→ F-04（agentHost copilot 残余）。
2. **设计与验收**：F-05（M4 smoke L3 断言）→ F-06（M2 user-surface）→ F-07（M3 telemetry UI）→ F-08（D4 体积账口径）→ F-09（chat-webview-out 决策规则）。
3. **编排与一致**：F-10（CI 范围锚定 vslight-release.md）→ F-11（D2 -d 旗标）→ F-12（NFR-3 数字）→ F-13（dev-tunnels 5 包）→ F-14（dev/patch.sh 三位数）→ F-15（98 patch 范围）。
4. **文字级修正**：F-16（§5-E 5 文件）→ F-17（§6 43.x 注释）→ F-18/F-19/F-20/F-21/F-22/F-23/F-24 行号与小修。

### 就绪判断的说明

本文只评审计划文本与其依赖的代码事实，**不代表功能已实现或可发布**；脚本通过（`check_paths.sh`）不证明行为真实或验收完成；UI/UX 部分为文档推演，需实现后在应用内验收。复审时请沿用 F-01…F-24 编号，并区分「已解决 / 仍存在 / 新增」。本文 8 个 P1 中，F-01/F-02/F-03/F-04 四个改动面直接改变 M2/M3 patch 范围与工作量，F-05/F-06/F-07 三个让 M2/M3/M4 退出条件不可机器判定，三者均需在开工前修订。其余 P2/P3 文字级修订可在执行中消化。
