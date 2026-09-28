# lean-dist · VSLight · 发行版瘦身、Copilot 清除与工具链评估（构建补丁层 · 平台横切面）

> **计划状态：Ready**
>
> 调查基线：2026-09-28 · commit `d6143d210a62847b8c8ce15676fecf92a0180801` · 工作树 clean。
>
> 本期交付：**VSLight 进一步瘦身（可验证的体积下降）、产物与仓库内 Copilot 集成面清除、Electron 升级 42.8.1→43.7.5、Node→Bun 可行性 ADR**。
> 本期独特职责：全部改动落在补丁层与构建脚本（`patches/`、`prepare_vscode.sh`、`product.json`、`dev/`、`build/`），不直接修改 `vscode/` 上游 checkout——它是每次构建重新生成的中间物。
> **顶层排除：不摘除 workbench chat 贡献本体（默认禁用保留，理由见 ADR-1）；不替换产物内嵌的任何 Node.js 运行时（C-3，物理上不可能）；不改 macOS 签名/公证链。**

## 实施者定位

执行本计划的 agent 是**资深软件工程师**：Kent Beck 式的 TDD 纪律加上《程序员修炼之道》式的精确。本节与「实施进度」是实施本计划的完整约定：实施与续做只依据本计划、仓库规则和代码，不需要加载写计划用的 skill 或参考资料。开始任何里程碑前先接受以下约定。

- **表达方式**：极简，每句话都可引用。说到代码给文件路径，说到需求或验收给本计划的 ID（需求账本 R-* / NFR-* / C-* / A-*，决策 D* / ADR-*，里程碑 M*）。不写铺垫、不写感想、不复述计划。
- **完成的定义**：没有通过验证的任务不算完成。里程碑退出条件里的测试、断言和走查全部通过，才能在「实施进度」记为完成；验证没跑、失败或环境缺失，就如实记为缺口或阻塞。
- **工作顺序**：需要行为测试的改动先红、再绿、最后重构。按前置依赖推进；同一或不同里程碑中，前置已满足、契约稳定、文件与运行资源互不干扰的任务，应启动多个 subagents 并发完成。共享文件单人负责，共享数据库、端口、浏览器会话等资源须隔离或串行；工具不可用或无法安全拆分时说明原因并串行。
- **并行交付**：无特别要求时 subagent 使用与主 agent 相同的模型，启动时默认继承，不主动覆盖模型。主 agent 给每个 subagent 一份精简任务说明：目标与对应章节/ID、已稳定的契约、可写与禁改路径、可用运行资源、验收条件和独立记录路径，不转交整段聊天或无关历史。subagent 只写自己的改动和记录，边界要变先回报；完成、受阻或暂停时回报简要结论、改动路径、验证结论、缺口与记录链接。主 agent 逐项审查交付并统一集成验证，单独负责计划回写和里程碑记录；不以子任务通过代替整个里程碑验收。某任务失败时保留已交付成果，只阻塞依赖它的任务；结束对话前收回或停止仍在运行的 subagent，并记下可接续状态。
- **源码干净**：注释解释为什么，不解释是什么。源码里不出现工单或需求编号（如 `# FR-12`、`// BUG-42`）、本计划的 R-* / M* 编号、agent 工作流标记或任何规划元数据；追溯关系记在计划摘要、独立实现/验收记录和提交说明里。交付的是可直接上生产的代码：干净、最小，没有多余防御、空洞注释或重复样板这类 AI 生成痕迹。

## 实施进度（实施期持续更新）

本节是跨对话恢复的**唯一汇总入口**，协议文字不随实施改写，实施期只更新「恢复快照」和「完成记录」。续做时先读仓库规则、本节、当前任务相关正文与依赖，再核对 `git status` 和相关 diff；记录与工作树不符时先查明原因，不凭记录覆盖用户改动，也不凭代码存在推断验收已通过。只有继续未完任务、核验前置验收、排错或审查时，才按链接读取对应记录的相关部分；不要默认加载全部记录或原始日志。

**回写时机**：每完成一个里程碑，立即先保存独立实现/验收记录，再回写本节的简要进度与引用；早于报告完成、提交代码或启动依赖该成果的任务，不等整批并行任务结束。已独立运行的任务可继续。实质进展后暂停、受阻、切换任务、发现偏差或结束对话时，也须保存已有成果与缺口，刷新快照。

**一次回写**：由主 agent 先更新对应里程碑的独立记录，再同步「恢复快照」全部 7 行及「完成记录」中该里程碑的一行；状态/摘要就地更新，不追加流水。快照的「当前状态」写在做的里程碑（可并列）及最近实质进展，「下一步」写可执行动作；命令、断言清单、调试过程和改动清单只进独立记录。完成记录首次有进展时删掉占位行，每个已开始的里程碑一行：状态仅用「进行中 / 阻塞 / 已完成」，更新时间带时区，摘要 1–2 句写交付结果或已做到哪里、还差什么，记录列填相对本计划的 Markdown 链接（如 `[M1 记录](lean-dist.records/M1.md)`）。阅读规则、加载 skill 不算进展。实现偏差涉及范围、决策、接口、数据、风险或退出条件时，同时修订正文对应章节，快照只点明变化。

**独立记录**：每个里程碑一份，放在计划旁的同名 `.records/` 目录，命名 `M1.md`、`M2.md`…，有实施事实时才建；subagent 的任务详情写同目录的 `M1-瘦身.md` 这类任务文件，由里程碑记录链接。记录头写对应计划链接、最近更新（带时区）、状态和代码基线（验证时对应的 commit SHA；未提交写 dirty@起始SHA 并列出关键改动路径，不拿 HEAD 冒充）。「实现记录」写已交付行为、关键路径、必要决策与计划偏差，未完成时写缺口与继续动作；「验收记录」用 `退出条件 | 命令或走查步骤 | 环境/代码基线 | 结果与必要证据` 表逐条写实际结果，未运行、失败、环境缺失分开写，不预填通过。日志、截图只在有复核价值时另存并从记录链接，不复制终端流水或聊天。

**记完成的门槛**：退出条件全部通过才可记完成。验证没跑、跑红或因环境缺失跳过，就如实写进「当前状态」/「当前阻塞」，不写“基本完成”“应该可用”。

**回写后自查**：「当前进度 n/N」的 N 等于里程碑总数，n 只计状态为「已完成」的行；每个里程碑最多一行，转为已完成时将原行移至已完成记录末尾，按实际完成先后排列；「最近完成」对应最后一条已完成记录，不按编号推算；链接指向已落盘文件，完成判定有真实验收证据。每次回写后运行 `bash .agents/skills/dev-plan/scripts/check_progress.sh docs/plan/lean-dist.md .`：它只查上述结构、计数与链接存在性，不读记录正文，也不证明验收真实通过。

### 恢复快照

- 最近更新：2026-09-29 03:35 +1000
- 当前进度：1/6 个里程碑完成
- 当前状态：M4 构建窗口完成（BUILD EXIT 0：103 真实重放、43.7.5 headers 重编原生、plist 43.7.5 / LSMinimumSystemVersion 12.0、L1+L2 36 项全绿、锁屏态冷启动无崩溃）；smoke L3 OCR 化重写完成、单项证据齐备；42.8.1 产物已备份 `m1m3-bak/`；两场 L3 全量跑（M1–M3 对备份产物、M4 对新构建）同待 ≥3 分钟解锁空闲窗口，守望 v4 在跑
- 最近完成：M5 · bun spike ADR 落盘（结论：不采纳，domain.bind 根因级实证）
- 下一步：守望跑通 M1–M3 smoke 全绿 → M1/M2/M3 记完成 → M4 smoke 全绿 + 窗口/剪贴板/下载走查 → M6
- 当前阻塞：L3 全量需 ≥3 分钟解锁空闲窗口（机器夜间锁定；守望 v4 在跑，注意：含 "/VSLight" 的宽泛 pkill 会误杀守望进程，已规避）
- 代码基线：dirty@cfc8c96（M4 验收记录与快照更新待提交）

### 完成记录

| Milestone | 状态 | 更新时间 | 简要记录 | 实现与验收记录 |
| --- | --- | --- | --- | --- |
| M1 | 进行中 | 2026-09-29 03:25 +1000 | 构建验证基本完成：.map=0、zip 263.6→178.5MB、welcome 媒体空、checksum 链 0 新增、CPPFLAGS 修复、`-d` repack 核销（无 CI 71 map / CI 还原 0）；smoke L3 OCR 化重写完成（AX 死局实证后改 win_id+Vision OCR），硬保险①实战生效（失焦即中止）；L3 单项证据齐备；余单次全绿跑（守望重试中） | [M1 记录](lean-dist.records/M1.md) |
| M2 | 进行中 | 2026-09-29 01:35 +1000 | §9.1 M2 断言全过（产物零 Copilot 键/schema/asar/docs）；104 nil-guards 两轮补强：首轮修安装崩溃，次轮修启动空白窗（defaultAccount 等 5 处裸读，全量扫描 11 处安全/5 处必修），同号重建验证窗口完整渲染 + L1+L2 全绿；余 smoke L3 命令面板复核（随 M1 单次全绿跑收口） | [M2 记录](lean-dist.records/M2.md) |
| M3 | 进行中 | 2026-09-29 00:39 +1000 | §9.1 M3 断言全过（rg/mxc 单平台、1ds=0、notebook-out 无、telemetry.*≥1）；体积账全核销；发现并修复 prepare_vscode.sh 应用序 bug；余 smoke L3 走查复核 | [M3 记录](lean-dist.records/M3.md) |
| M4 | 进行中 | 2026-09-29 03:35 +1000 | 构建窗口完成：BUILD EXIT 0（103 真实重放、43.7.5 原生重编、validateChecksum 过）、plist 43.7.5/地板 12.0、L1+L2 36 项全绿（Electron 断言自动跟随）、锁屏态冷启动无崩溃；余 smoke L3 全绿 + 三项走查（待解锁窗口） | [M4 记录](lean-dist.records/M4.md) |
| M5 | 已完成 | 2026-09-28 22:05 +1000 | ADR 落盘（docs/adr/bun-build-toolchain.md）：不采纳，命题二 domain.bind 根因级实证；主树零污染已独立复核 | [M5 记录](lean-dist.records/M5.md) |

## 0. 需求、范围与决策

### 0.1 需求与约束账本

| ID | 类型 | 来源 | 内容 | 设计/验收落点 | 状态 |
| --- | --- | --- | --- | --- | --- |
| R-1 | 功能 | 用户：「看看 vslight 还能做什么减肥」 | 调研剩余瘦身空间并实施安全项 | §1.1 体积账 + M1/M3；验收：zip/app 实测下降 + smoke 绿 | 已确认 |
| R-2 | 功能 | 用户：「去掉所有 @github/copilot 相关的」 | 清除产物与仓库内 Copilot 集成面（配置、依赖、文档、孤儿文件） | §1.1-B + M2；验收：产物 `product.json` 与文档 grep 断言 | 已确认（深度见 ADR-1） |
| R-3 | 功能（评估型） | 用户：「node 能不能换成 bun？」 | 交付可行性结论与 ADR；事实已 strongly 指向「运行期不可、构建期受阻」，M5 限时 spike 验证仅存疑子命题 | ADR-3 + M5；验收：ADR 落盘 | 已确认 |
| R-4 | 功能 | 用户：「Electron update 到 latest」 | 升级 Electron；字面 latest=44.4.5（2026-09-22），但证据显示超前上游有真实破坏面，经 ADR-2 定为 43.7.5 | ADR-2 + M4；验收：全链路构建 + smoke + 行为走查 | 已确认（43.7.5） |
| NFR-1 | 体积/成本 | 实测：app 858MB、zip 263.6MB（`assets/VSLight-darwin-arm64-1.135.06493.zip`） | 可验证的下降；不设无来源硬指标，逐项记账（§1.1-A） | M1/M3 + §9.2 体积账 | 已知基线 |
| NFR-2 | 兼容性 | 产物 `Info.plist` `LSMinimumSystemVersion=12.0` | 不抬升 macOS 地板（ADR-2 已定 43.7.5；Electron 44 才会抬到 13+） | M4 验证 plist | 已知 |
| NFR-3 | 可靠性/运维 | CI 15 个 workflow、22 个 setup-node step（分布于 11 个文件） | 构建 workflow 保持绿（macOS 为验收线，linux/windows 仅手动触发可构建，见 §9.4）；patch 体系可重复应用 | M6 集成验收 | 已知 |
| NFR-4 | 可维护性 | patch 号段约定（`docs/vslight-plan.md` §0 第 2 条：Phase 4 批次 92+ 递增） | 新增 light patch 从 98 起；剪枝优先走 `patches/light/prune.json` | M2/M3 | 已知 |
| C-1 | 约束 | `utils.sh:19-43` `apply_actions`：remove 路径缺失即 `exit 4`；`prepare_vscode.sh:181-188` prune 在所有 patch 之后执行 | prune.json 只收「任何 patch 都不触碰」的路径；内容修改必须走 patch | M2/M3 机制约束 | 已确认 |
| C-2 | 约束 | Electron 版本由上游 checkout 自带：`upstream/stable.json` → `get_repo.sh` → `vscode/.npmrc target=` → `vscode/build/lib/util.ts:376-381` | 升级要么 bump MS_TAG，要么打 patch 改五处版本点（§5-E） | M4 | 已确认 |
| C-3 | 约束 | 产物内嵌运行时不可替换：Electron 42.8.1 自带 Node 运行时；reh 产物钉官方 node 24.18.1 二进制（`vscode/build/gulpfile.reh.ts:141-146`、`vscode/build/checksums/nodejs.txt`） | bun 评估仅限构建机一侧 | ADR-3 | 已确认（事实） |
| C-4 | 约束 | `build/osx/prepare_assets.sh:36` 签名公证链（electron-osx-sign + notarytool） | 不动签名链；Electron 升级后公证行为不变 | M4 走查 | 已确认 |
| A-1 | 假设 | 发布构建设 `CI=true` 剥离 sourcemap 无其他副作用 | 已核实 `CI` 在 `vscode/build` 仅两个消费点：`gulpfile.vscode.ts:175`（strip）与 `lib/fetch.ts:45`（verbose 日志） | M1 试构建验证 | 已解除（转为事实） |
| A-2 | 假设 | `@microsoft/mxc-sdk` 裁到仅 darwin-arm64 后终端沙箱功能不变 | sandboxHelper 动态 import（`vscode/src/vs/platform/sandbox/node/sandboxHelper.ts:112`），按平台目录加载 | M3 smoke 终端断言 + 构建日志 | 开放，M3 内解除 |
| A-3 | 假设 | 摘除 1ds 遥测 SDK 后无运行期引用残留 | 实测消费面：7 处实例化点（`cliProcessMain.ts:254`、`sharedProcessMain.ts:328`、`agentHostTelemetryService.ts:251`、`agentHostMicrosoftTelemetry.ts:67/82`、`workbench/services/telemetry/browser/telemetryService.ts:112`）+ 3 个实现文件 + 1 个测试；遥测已默认 OFF + 域名 0.0.0.0 | M3 patch + grep 断言 + smoke（`telemetry.*` schema ≥1） | 开放，M3 内解除 |

### 0.2 决策表

| # | 决策点 | 选择 | 含义/影响 | 依据 |
| --- | --- | --- | --- | --- |
| D1 | 改动形态 | 全部走补丁层：新 light patch（98+）、`prune.json` 加路径、`prepare_vscode.sh` 加步骤、根 `product.json` 改键 | 不污染 `vscode/` checkout 生成物；上游 bump 后 patch 可重新应用 | C-1、NFR-4；`prepare_vscode.sh:146-188` |
| D2 | sourcemap 处置 | `dev/build.sh` 新增 `-d`（debug）旗标：默认发布构建 `export CI=true` 剥离（与 CI 构建同行为），`-d` 调试构建不设、保留 map | app 直接省 ~215MB（89 个 .map）；剥离后 F-17 的 sourcemap 基址品牌问题随之消失；崩溃栈由 `upload_sourcemaps.sh` 发布渠道兜底（spearhead workflow 已用） | 实测体积；`vscode/build/gulpfile.vscode.ts:175,293,363`；`patches/00-build-update-sourcemap-url.patch` |
| D3 | 跨平台二进制裁剪 | 新增 **post-npm-ci 剪枝步骤**（`prepare_vscode.sh` 在 `npm ci` 之后追加 light 剪枝段），裁 `@vscode/ripgrep-universal/bin/` 非本机平台目录、`@microsoft/mxc-sdk/bin/` 非 arm64 目录 | prune.json 在 `npm ci`（`prepare_vscode.sh:218-232`）**之前**执行，够不到 node_modules——必须新步骤；ripgrep 省 ~51MB、mxc-sdk 省 ~22MB | 实测；时序读自 `prepare_vscode.sh` 行序 |
| D4 | 遥测 SDK 摘除 | 新 patch：摘除 7 处 `OneDataSystemAppender`/`OneDataSystemWebAppender` 实例化点（清单见 A-3）、删 3 个实现文件（`vscode/src/vs/platform/telemetry/{common,node,browser}/1dsAppender.ts`）+ 1 个测试、`vscode/package.json:96-97` 删 2 个直接依赖（`1ds-core-js`、`1ds-post-js`；`applicationinsights-core-js`/`dynamicproto-js` 是 transitive 随之消失）、`vscode/eslint.config.js:1679-1680,1711-1712` 解白名单 | 省 ~23MB（asar 内解压口径；zip 口径显著更小，以实测记账为准）；遥测已 OFF + 域名已 0.0.0.0，SDK 是纯死重；工作量较初估上调：7 处摘除 + ESLint 解白名单 | 实测；A-3 消费面清单 |
| D5 | mermaid 扩展死 bundle | 新 patch 从 esbuild/拷贝清单删 `mermaid-markdown-features/notebook-out/`（25MB）；`chat-webview-out/`（9.2MB）**保留**——已核实 3 处运行期引用（`vscode/extensions/mermaid-markdown-features/src/editorManager.ts:172,208`、`chatOutputRenderer.ts:57`）；`markdown-preview-out/`（25MB）保留——markdown 预览 mermaid 是活功能 | notebook 已删（94 号），notebook-out 是死重 | 实测；`vscode/build/lib/extensions.ts` esbuild 清单机制 |
| D6 | Electron 升级路线 | 走 patch 改四处版本点（而非 bump `upstream/*.json`），保持 app 版本 1.135.x 不变 | 与「跟随上游升 MS_TAG」解耦：不连带升级 vscode 本体，爆炸半径限于运行时层 | C-2；`patches/00-build-update-electron.patch.no` 为官方改法模板 |
| D7 | playwright-core 保留（决议已下） | **不摘除**：BrowserView 链路完整存活——`vscode/src/vs/workbench/workbench.desktop.main.ts:95` 仍 import `playwrightWorkbenchService.js`、`vscode/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:138,486-487` 仍注册 `PlaywrightChannel` 与 `'playwright'` IPC、`vscode/src/vs/code/electron-main/app.ts` 仍注册 BrowserView 主进程服务、contrib/browserView 工具组仍走 `IPlaywrightService`；91/92 号只删 sessions/agentHost 入口，未触及 BrowserView | 初估「agent host 已删故无消费方」被证伪；~12MB 从体积账移除；102 号改作 dev-tunnels 用途 | 上述行号实证 |

### 0.3 ADR-lite

#### ADR-1：Copilot 清除深度——清到「产物无 Copilot 集成面」，不摘 chat 贡献本体

- 状态：Accepted（2026-09-28 用户拍板：按选项 A 执行，chat 贡献本体保留不删）
- 背景与驱动：R-2。现状（已核实）：52/53 号 patch 已删 `extensions/copilot`、agentHost 的 copilot/claude/codex 主体与 npm 依赖；`00-copilot-fix-action-condition.patch` 已把 `chat.disableAIFeatures` 默认置 true 隐藏全部 AI 入口。残留四层：①合并后 `product.json` 仍发布完整 Copilot 集成配置（`defaultChatAgent`、`trustedExtensionAuthAccess`、`builtInExtensionsEnabledWithAutoUpdates`、多条 `extensionEnabledApiProposals`，且根 `product.json:50-55,66-68,251-326,417-421` 自己重新供应了其中一部分）；②`vscode/src/vs/platform/agentHost/node/copilot/` 剩 16 个 .ts（14 个顶层 + `prompts/` 内 2 个，另有 `vscode/src/vs/platform/agentHost/node/copilot/prompts/AGENTS.md`），仍有多处活跃引用（`agentHostBootstrap.ts:32`、`shared/sessionPluginBundler.ts:16` 两处 import；`agentHostTelemetryService.ts:226` readFile `'copilot/package.json'` 路径，prune 后会断链；2 个测试文件引用被删模块）+ `@vscode/copilot-api` 依赖（`vscode/package.json:107` 与 `vscode/remote/package.json:10`；核心消费者是 1134 行的 `vscode/src/vs/platform/agentHost/node/shared/copilotApiService.ts`，另有 8 个文件 import 该模块，外加 `vscode/src/typings/copilot-api.d.ts` 与 `vscode/eslint.config.js:1684` globals 白名单）；③孤儿构建文件（`vscode/build/lib/copilot.ts`、`vscode/build/gulpfile.extensions.ts` 的 `compileCopilotExtensionBuildTask`、`vscode/build/lib/extensions.ts` 的 `packageCopilotExtensionStream`、`vscode/cglicenses.json` 过期条目、`vscode/build/lib/policies/policyData.jsonc` 的 `github.copilot.*` 策略定义）；④`docs/ext-github-copilot.md` 是「如何在 VSCodium 启用 Copilot」指南，与本需求直接冲突。
- 备选：
  - A（本决策）：清配置面 + 依赖 + 孤儿文件 + 文档，agentHost 残余文件摘 import 后删；chat workbench 贡献本体保留（默认禁用，编译进 JS 的 copilot 字符串属隐藏面）。
  - B（字面「所有」）：连 chat 贡献本体一起摘。淘汰理由：既有调查（`dev/progress/phase-4-batch6-done.md` F-12）实测 DI 修复面 >20 处，97 号 patch 因此降级为只删 9 行；收益仅是隐藏字符串，代价是维护一个持续腐烂的大型 patch。
- 决策：A。证据：残留①②③都是无消费方或单点 import 的死配置/死代码，清除成本低且无行为风险；④是文档删除。
- 正面后果：产物 `product.json` 零 Copilot 键；npm 依赖树无 `@github/copilot*`、`@vscode/copilot-api`、`@anthropic-ai/sdk`；文档与产品立场一致。
- 负面/中性后果：chat 隐藏面字符串仍在 workbench JS 里（已禁用、不可达）；`chat-webview-out`（9.2MB）已核实被 chat 链路运行期引用（D5），随 chat 本体一并保留。
- 重新评估触发：用户明确要求「字符串也要没有」，或上游把 chat 拆成可选扩展使摘除成本骤降。

#### ADR-2：Electron 目标版本——默认升 43.7.5，不直跳 44.x

- 状态：Accepted（2026-09-28 用户拍板：选项 B，目标版本 43.7.5）
- 背景与驱动：R-4。当前 42.8.1（全链路一致：`vscode/.npmrc:2`、`vscode/package.json:212`、`vscode/build/checksums/electron.txt`、产物 plist）。外部事实（2026-09-28 核实）：latest stable = **44.4.5**（Chromium 152 / Node 24.21，要求 **macOS 13+**，renderer 移除 clipboard 模块）；上游 vscode `main`（1.140.0）用 **43.7.3**；上游 1.136 已发布。本仓库 1.135 树不含上游针对 43/44 的适配 commit。
- 备选：
  - A：跟随上游，bump `upstream/stable.json` 到 ≥1.136 的 MS_TAG，继承上游全部 Electron 43 适配。代价：连带升级 vscode 本体，全部 90+ patch 需重新应用验证，爆炸半径最大但每步有上游背书。
  - B（默认）：1.135 树上 patch 升 **43.7.5**。macOS 地板不变（12.0）；43 系是上游 main 已验证的一代；改动点收敛（§5-E 四处 + 原生模块按 target 重编）。风险：1.135 workbench 未含 43 适配 commit，需 smoke 覆盖窗口/剪贴板/下载行为。
  - C：直跳 **44.4.5**（字面 latest）。淘汰为默认的理由：macOS 地板抬到 13+（改变对外兼容承诺 NFR-2）；renderer clipboard 移除等 breaking change 无上游适配可继承；Linux 三 arch fork（riscv64/loong64/ppc64le）无对应版本会撞 major guard（`build/linux/package_bin.sh:62-65`）。
- 决策：B，目标版本 43.7.5（用户拍板）。若未来要字面 latest 则转 C 并同步更新 NFR-2 承诺与发布说明；若接受连带升级 vscode 则 A 更稳。
- 正面后果（B）：拿到 43 系安全修复与 Chromium 150；不抬 macOS 地板；不改 app 版本语义。
- 负面/中性后果（B）：承担「超前当前树、落后上游 main」的维护位；每次上游 bump 需重新评估 patch 是否仍需要。
- 重新评估触发：上游 vscode stable 发布带 Electron 44 的版本 → 放弃 patch 路线转跟随；43 系曝出未修安全漏洞；Linux/Windows 构建启用且 fork 版本不齐。

#### ADR-3：Node→Bun——默认不采纳；M5 限时 spike 验证存疑子命题后落盘结论

- 状态：Proposed（结论预写，spike 只负责推翻或确认）
- 背景与驱动：R-3。已核实事实：①**运行期不可替换**（C-3）：Electron 内嵌 Node 运行时、reh 产物钉官方 node 24.18.1 二进制，bun 物理上够不到；②构建机侧被四道墙挡：`vscode/build/npm/preinstall.ts:11-39`（node 版本门禁）、`:41-44`（拒绝 yarn）、`:46-53`（要求 npm<13）、`vscode/build/npm/postinstall.ts:13,91` 硬编码 spawn npm 循环装 ~50 个子目录、`.npmrc` 的 `disturl/target=42.8.1/runtime=electron/build_from_source` 是 npm/node-gyp 私有语义（26 个原生模块 install script 依赖它）、`npm run gulp` 承担 PATH/env 注入且 gulp 命令含 `--max-old-space-size` 等 V8 旗标（bun 是 JavaScriptCore，不识别）；③外部证据（2026-09 检索）：node-gyp 原生 addon 是 bun 公认头号兼容 blocker；bun 默认不执行依赖 lifecycle scripts；VSCode 官方只支持 npm。
- 备选：
  - A：全量替换构建机 node → 被上述四道墙淘汰。
  - B（本决策）：运行时不动；构建侧只做限时 spike（隔离 worktree，1-2 人日），验证两个存疑子命题：bun 能否装纯 JS 子目录（如 `vscode/build`）、`bun run` 能否驱动 gulp 打包；产出 ADR，默认结论「不采纳，仅作为安装提速的局部可选项保留观察」。
  - C：不做 spike 直接结案。淘汰理由：用户问的是开放问题，留一份带实证边界的 ADR 比一句「不行」更能阻止未来重复评估。
- 决策：B。
- 正面后果：结论有据；若 bun 在纯 JS 子集可用，CI 安装阶段有提速空间。
- 负面/中性后果：1-2 人日 spike 成本；不污染主树 lockfile（隔离 worktree 强制）。
- 重新评估触发：bun 官方完整支持 node-gyp 生态 + 上游 vscode 放开包管理器门禁（`preinstall.ts` 改写）。

### 0.4 职责与事实所有权

|  | 上游 microsoft/vscode | 本仓库（补丁层） | 发布/分发 |
| --- | --- | --- | --- |
| 拥有 | Electron 版本的事实来源（`.npmrc target=`）、workbench 行为适配 | patch/prune/product.json 的删除面与品牌、构建编排、版本覆盖 patch、体积账 | zip/checksum/feed、sourcemap release、签名公证 |
| 不拥有 | vscodium 品牌决策 | **不顺手改 `vscode/` checkout 本体（生成物）、不顺手升 vscode 版本（A 路线需单独拍板）** | 不修改上游 release 资产 |

一句话：本计划只动补丁层与构建脚本；`vscode/` 树内的一切变化必须由 patch/prune 在构建时重新生成。

### 0.5 明确不在本期

- **摘除 workbench chat 贡献本体**——ADR-1，保留默认禁用；去向：依赖上游拆分。
- **Electron 44.x**——ADR-2；去向：上游 stable 采用后跟随。
- **构建机全量 bun 化**——ADR-3；去向：spike ADR 记录，触发条件满足前不重开。
- **Linux/Windows 产物发布**——本 fork 实际只产出 darwin-arm64（`assets/` 仅见该产物）；M4 的改动点涉及 Linux 三 arch guard 时只做兼容性处理，不新增发布。
- **摘除 `playwright-core`/`chrome-remote-interface`（~12MB）**——D7 已决议保留：BrowserView 链路完整存活（证据见 D7 行）。
- **删 mermaid `chat-webview-out/`（9.2MB）**——已核实 3 处运行期引用（D5）；chat 本体保留（ADR-1）故该 bundle 是活代码。
- **清除各扩展自带的 1ds 遥测依赖**——`vscode/extensions/` 下 11 个扩展的 `package.json`/锁文件各自携带 `@vscode/extension-telemetry`/`@microsoft/1ds-*`；D4 只清主程序依赖，扩展 dist 是 esbuild bundle、锁文件不进安装包；属上游扩展源码面，另立项。
- **`prepare_checksums.sh` 重复 hash 链修复**（`assets/` 里 `.sha1.sha1.sha1...` 文件是其反复运行副产物）——顺手项，M1 可选；不做不阻塞。
- **`patches/00-copilot-disable-terminal-suggest.patch` 改名**——文件名含 copilot 但内容无关（只加 codium 补全 spec）；改名会造成 patch 历史噪音，M2 可选。

## 1. 当前事实与改动面

### 1.1 现状与缺口

**A. 体积账（实测 `VSCode-darwin-arm64/VSLight.app` = 858MB，zip = 263.6MB）**

已减（既有机制）：远程/会话（91/92）、Debug（93）、Notebook（94）、Testing/Welcome/Profiles（95）、策略（96）、CLI/REH 不产出（`dev/build.sh:15-17`）、Copilot 扩展与 agent 主体（52/53）、内置市场扩展清零（根 `product.json:2`）。装机 JS 48.1MB→26.3MB。

剩余候选（按收益，全部为本次实测；大小为安装后解压口径，zip 压缩口径显著更小）：

| 项 | 大小 | 机制 | 风险 |
| --- | --- | --- | --- |
| 89 个 `.map` 文件（含 `workbench.desktop.main.js.map` 94MB） | ~215MB | D2：`CI=true` 即剥离（机制已存在于 `vscode/build/gulpfile.vscode.ts:175`） | 低（A-1 已解除） |
| `@vscode/ripgrep-universal/bin/` 12 平台二进制，darwin-arm64 仅需 4.4MB | 省 ~51MB | D3 post-npm-ci 剪枝 | 低（留本机平台） |
| `@microsoft/mxc-sdk/bin/` 跨平台（裁到 arm64） | 省 ~22MB | D3 | 中（A-2，smoke 终端断言） |
| `mermaid-markdown-features/notebook-out/` 死 bundle | 25MB | D5 patch 清单 | 低（notebook 已删） |
| 遥测 SDK（主程序 2 个直接依赖 + 2 个 transitive） | ~23MB（asar 内） | D4 patch（范围见 D4，含 7 处实例化点） | 中（A-3） |
| `@microsoft/dev-tunnels-*` 5 包（connections/contracts/management/ssh/ssh-tcp；tunnel 已删） | ~4.6MB（实测 du 4748KB） | 102 号 patch 删依赖（先验证无消费方） | 低中 |
| `agentsVoice` mp3（Copilot Voice TTS） | 1.8MB | 并入 99 号 patch（属 Copilot 面）：摘 desktop.main 残留 import + 删 gulpfile 资源清单 | 低中 |
| `welcomeGettingStarted`/`welcomeOnboarding` 媒体残留（95 号摘了 import 没删拷贝清单） | 1.4MB | 98 号 patch 删 `vscode/build/gulpfile.vscode.ts:109-110` 两行 | 低 |
| `playwright-core` + `chrome-remote-interface` | ~12MB | **不删**（D7 决议：BrowserView 链路存活） | — |
| `mermaid-markdown-features/chat-webview-out/` | 9.2MB | **不删**（3 处运行期引用，D5） | — |
| `LICENSES.chromium.html` | 19MB | **不删**（三方许可证合规） | — |
| `extensions/node_modules/typescript` | 17MB | **不动**（TS 语言服务核心） | — |
| 多语言 i18n 残留 | 无 | 已核实仅英文基表，无收益 | — |

**B. Copilot 残留（四层，详见 ADR-1 背景）**

**C. Node 工具链**：构建机 node 24.18.0（根 `.nvmrc` = `vscode/.nvmrc`）；npm 唯一（yarn 被 `preinstall.ts` 显式拒绝）；26 个原生模块 install script；CI 22 个 setup-node step（11 个 workflow 文件）。零 bun 痕迹。

**D. Electron**：42.8.1 全链路一致；latest 44.4.5、上游 main 43.7.3（ADR-2）。

### 1.2 拓扑与文件清单

| 文件/目录 | 改动 | 里程碑 |
| --- | --- | --- |
| `dev/build.sh` | getopts 加 `-d`（debug）旗标；默认发布构建 `export CI=true`（D2） | M1 |
| `dev/patch.sh` | 号段正则支持 3 位数（`:59` 现为 `^([0-9])([1-9])(-.*)\.patch$` 只认 2 位，100+ 不命中前置自动应用逻辑） | M1 |
| `patches/98-light-remove-welcome-media.patch` ★ | 删 `vscode/build/gulpfile.vscode.ts:109-110` 两行媒体拷贝清单（welcomeGettingStarted + welcomeOnboarding） | M1 |
| 根 `product.json` | 删 copilot 相关条目（L50-55、66-68、251-326、417-421 区域） | M2 |
| `prepare_vscode.sh` | `del()` 加 product.json 键（注意 jq 子键精确删除，见 §5-C）；追加 post-npm-ci 剪枝段（D3） | M2/M3 |
| `patches/99-light-copilot-residual.patch` ★ | 摘 agentHost copilot 残余 import（`agentHostBootstrap.ts:32`、`shared/sessionPluginBundler.ts:16`、`agentHostTelemetryService.ts:226` readFile、2 个测试文件）；处置 1134 行 `vscode/src/vs/platform/agentHost/node/shared/copilotApiService.ts` 及其 8 个模块引用方；删 `vscode/src/typings/copilot-api.d.ts`、`vscode/eslint.config.js:1684` 白名单条目、`vscode/remote/package.json:10` 依赖；删孤儿构建文件（`vscode/build/lib/copilot.ts`、`compileCopilotExtensionBuildTask`、`packageCopilotExtensionStream`）；清 `vscode/cglicenses.json`/`vscode/build/lib/policies/policyData.jsonc` 条目；摘 agentsVoice「Copilot Voice」import + gulpfile 资源清单 | M2 |
| `patches/light/prune.json` | 加 `vscode/src/vs/platform/agentHost/node/copilot/` 目录（prune.json 内写 vscode 相对路径；含 16 个 .ts 与 prompts 子目录及其 AGENTS.md）等「无 patch 触碰」路径；时序由 C-1 保证（prune 在 99 号 patch 之后执行） | M2 |
| `docs/ext-github-copilot.md`、`docs/index.md:28` | 删文档与链接 | M2 |
| `patches/100-light-remove-telemetry-sdk.patch` ★ | D4（7 处实例化点 + 3 实现文件 + 1 测试 + 2 直接依赖 + ESLint 白名单） | M3 |
| `patches/101-light-prune-mermaid.patch` ★ | D5（仅 `notebook-out/`） | M3 |
| `patches/102-light-remove-dev-tunnels.patch` ★ | dev-tunnels 5 包依赖摘除（先验证无消费方；评估不过则记录不建） | M3 |
| `patches/103-light-update-electron.patch` ★ | ADR-2 五文件版本点 + checksums 全量替换（§5-E） | M4 |
| `dev/smoke.sh` | 扩展断言：M2 用户可见层三条（§9.1）；M3 telemetry schema 计数 + rg/mxc 平台断言；M4 L3 剪贴板/下载机器断言（§9.1） | M2/M3/M4 各自追加 |
| `docs/adr/` ★ | bun 结论 ADR（M5 产出） | M5 |

无需修改的邻接面及依据：CI workflow 的 setup-node 步骤（M5 结论为不采纳则不触碰）；签名公证链（C-4）；`upstream/*.json`（D6 不 bump MS_TAG）。

## 2. 模块、接口与依赖

本计划不新增共享模块；改动面是构建管线上的五个接缝，接口即「构建脚本步骤的顺序契约」：

| 接缝 | 调用者 | 接口与不变量 | 测试面 |
| --- | --- | --- | --- |
| patch 应用（`utils.sh:45-69` `apply_patch`） | `prepare_vscode.sh:152-178` | 按文件名序；`!!APP_NAME!!` 占位符替换；`git apply` 失败即构建中止 | 全量 patch 在干净 1.135 树上可重复应用 |
| JSON remove（`utils.sh:19-43` `apply_actions`） | `prepare_vscode.sh:146-150`（批次一）与 `:181-188`（light 批次） | 路径缺失 `exit 4`；light 批次在所有 patch 之后，删任何路径不影响存量 patch | prune 路径在 patch 后的树上存在 |
| product.json 处理 | `prepare_vscode.sh:109-123` | 先 jq merge 根 `product.json`，再 `del()`；merge 无删除语义——上游有的键必须从两边同时清 | 产物 `product.json` grep 断言 |
| post-npm-ci 剪枝 ★（D3） | `prepare_vscode.sh`（`npm ci` 之后新增段） | 输入：已安装的 node_modules + 目标平台 `VSCODE_ARCH`；不变量：保留本机平台目录，缺失不 fail（包可能随上游消失，剪枝须幂等且 warn-only） | 产物内 rg/mxc 目录平台断言 + smoke |
| Electron 版本点（C-2 链） | `vscode/build/lib/util.ts:376-381` 正则抓 `.npmrc` | `vscode/.npmrc` 必须有 `target=` 且 `ms_build_id=` 行必须保留（正则强制）；`vscode/build/checksums/electron.txt` 与版本强绑定 | gulp packing 的 `validateChecksum` 通过 |

为什么没有新接缝：剪枝与摘除都是单次构建期动作，没有第二实现或运行期替换需求（三次再抽象原则）。

## 3. 数据模型与迁移

无持久化、无对外数据契约。产物版本兼容窗口：本期升 43.7.5 不改变 macOS 地板；若未来改选 Electron 44（macOS 13+），发布说明须声明系统要求变化，旧系统用户停留在上一 zip——无数据迁移问题（用户设置目录 `.vslight` 不受 Electron 版本影响）。

## 4. 集成与契约

| 依赖 | 当前状态 | 行为级证据 | 本期处理 | 失败语义 |
| --- | --- | --- | --- | --- |
| 上游 microsoft/vscode 1.135.0 checkout | 已核实足够 | `upstream/stable.json` pin；5675 个 patch 后改动文件可重复应用 | 零改动（D6 不 bump） | patch 漂移 → `git apply` 失败即中止 |
| electron/electron GitHub releases | 已核实足够 | `build/lib/electron.ts:240-243` OSS 路径下载 + `validateChecksum` | M4 换新版本 SHASUMS256.txt | checksum 不符 → packing 失败（硬阻塞，构建期暴露） |
| electronjs.org/headers | 已核实足够 | `.npmrc disturl`；原生模块按 target 源码编译 | M4 随 target 联动 | 头文件缺失 → `npm ci` 失败 |
| open-vsx gallery | 已核实足够 | `prepare_vscode.sh:37-107` 品牌改写 | 零改动 | smoke L2 装扩展断言覆盖 |
| rockie/sourcemaps release | 已核实足够 | `upload_sourcemaps.sh` 被 `publish-*-spearhead.yml` 调用 | D2 后本地发布与 CI 行为一致；本机不触发上传 | 上传失败不阻塞本地构建 |
| rockie/vslight versions feed | 已核实足够 | `dev/seed-versions-feed.sh`、`dev/update-feed.sh` | 零改动 | 与本计划无关 |

## 5. 核心机制

**A. 构建管线时序（本计划所有改动的坐标系）**：`dev/build.sh` → `build.sh` → `prepare_vscode.sh`（product.json 改写 → merge → del → JSON remove 批次一 → 全量 patch → light prune → npm ci → **【M3 新增】post-npm-ci 剪枝**）→ gulp prepack/packing → `prepare_assets.sh`（签名 zip）→ checksums。

**B. sourcemap 剥离（D2）**：`dev/build.sh` getopts（现有 `:ilops`，`dev/build.sh:25`）加 `-d`：默认（发布）路径在 source 根 `build.sh` 前 `export CI=true`；`-d` 调试路径不设，保留 map。已核实 `CI` 在 `vscode/build` 内仅影响 strip 与 fetch 日志冗余度（`gulpfile.vscode.ts:175`、`lib/fetch.ts:45`）。剥离后 F-17 基址问题消失（无 map 可指），`00-build-update-sourcemap-url.patch` 继续无害存在。

**C. product.json Copilot 清除（M2 核心）**：两边同清——①根 `product.json` 删自有条目；②`prepare_vscode.sh:114-123` 的 `jq 'del(...)'` 加 `defaultChatAgent`、`trustedExtensionAuthAccess`、`builtInExtensionsEnabledWithAutoUpdates`；`extensionEnabledApiProposals` / `extensionsEnabledWithApiProposalVersion` 只能**按子键**删（`del(.extensionEnabledApiProposals["GitHub.copilot"])` 等），整键删除会误杀其他扩展的合法条目。验收以产物 grep 为准。

**D. post-npm-ci 剪枝（D3 新增步骤）**：位置 `prepare_vscode.sh` `npm ci`（:218-232）之后；逻辑：按 `VSCODE_ARCH` 保留 `@vscode/ripgrep-universal/bin/` 与 `@microsoft/mxc-sdk/bin/` 的本机平台子目录，删其余；幂等、目录缺失只 warn 不 exit（与 C-1 的 exit 4 语义相反——这里是上游包内容，可能随版本消失）。写成独立函数，与 prune.json 的「源码树剪枝」职责分开。

**E. Electron bump 五文件（M4，以 `patches/00-build-update-electron.patch.no` 为模板生成 103 号 patch）**：①`vscode/.npmrc` `target=` → 43.7.5（`ms_build_id` 行保留原值）；②`vscode/package.json:212`；③`vscode/package-lock.json:129`（root deps）及 `:7558-7560` 区域（resolved + integrity）；④`vscode/build/checksums/electron.txt`（75 行）全量替换为 43.7.5 官方 SHASUMS256.txt（含 mksnapshot/ffmpeg/libcxx 全条目）；⑤`vscode/cgmanifest.json:530-538` tag+commitHash。之后清 `vscode/node_modules` 重跑 `npm ci` 触发原生模块按新 ABI 重编。

**F. bun spike（M5）**：`git worktree add` 隔离目录；命题一 `bun install` 替 `npm ci` 装 `vscode/build`（纯 TS 无原生）；命题二 `bun run gulp`（预期败于 V8 旗标与 gulp4/vinyl-fs 兼容，记录实证）；命题三（可选）`bun` 跑 `build.sh` 内 `node -p`/`policyGenerator.ts` 小脚本。不碰主树 lockfile，不进 CI。

## 6. 前端与交互

无新 UI。交互回归 = `dev/smoke.sh` L3（AppleScript 注入：窗口、编辑保存、命令面板、终端、Git、open-vsx 装卸扩展）。Electron 升级后追加走查：窗口创建/聚焦、剪贴板读写、文件下载行为（43 起下载默认进 Downloads 目录）。Electron 43.x 仍保留 renderer clipboard 模块（44.x 才移除）——剪贴板走查验证 43.7.5 下主进程 clipboard API 与 renderer 路径均通。剪贴板与下载走查必须有机器断言（M4 在 `dev/smoke.sh` L3 新增，见 §9.1 M4），不接受纯目视。

## 7. NFR、安全与运行保障

| ID | 基线/来源 | 目标或未知项 | 超限/失败行为 | 机制 | 验证 |
| --- | --- | --- | --- | --- | --- |
| NFR-1 | zip 263.6MB / app 858MB | 逐项下降记账（§1.1-A），不设无来源总目标 | 某 patch 收益 <1MB 且引入维护负担 → 回退该 patch | D2-D5、D7 | §9.2 体积账（构建产物 du 对比表） |
| NFR-2 | `LSMinimumSystemVersion=12.0` | 43.7.5 下保持 12.0 不变；未来若改选 Electron 44 则抬到 13+ | 旧系统拒载 → 发布说明声明 | M4 plist 断言 | 构建产物 plist 读取 |
| NFR-3 | CI 15 workflow 绿 | 保持绿；新 patch 可重复应用 | patch 漂移即构建中止（暴露即修） | D1 | M6 全量 `git apply --check` + CI |
| NFR-4 | 号段 92+ 递增 | 新 patch 98 起、prune 优先 | 号段冲突 → 重编号 | 约定遵守 | review 走查 |

安全：删除面（Copilot 配置、遥测 SDK）本身是攻击面收缩；无新增凭证/网络入口。可观测性：构建失败即日志，无运行期服务。

## 8. 失败模式、发布与回滚

| 失败/触发 | 爆炸半径 | 数据后果 | 用户表现/降级 | 检测 | 恢复/补偿 | 验证 |
| --- | --- | --- | --- | --- | --- | --- |
| prune/patch 路径随上游消失 | 单次构建 | 无 | 构建中止（exit 4 / git apply 失败） | 构建日志 | 修路径或删条目 | M6 全量重放 |
| rg 剪枝删错平台目录 | 单平台产物 | 无 | 搜索功能坏 | smoke L1（rg 存在性）+ 编辑器内搜索走查 | 修正剪枝逻辑重打包 | M3 验收 |
| 遥测 SDK 摘除后残留引用 | 产物 | 无 | 启动报错/功能降级 | smoke L2/L3 + grep 断言 | 回退 patch | M3 验收 |
| Electron checksum 不符 | 单次构建 | 无 | packing 硬失败 | 构建日志 | 换正确 SHASUMS256 | M4 验收 |
| Electron 行为回归（窗口/剪贴板/下载） | 全用户 | 无 | 对应功能异常 | §6 走查 + smoke | 回退 103 号 patch 即回到 42.8.1 | M4 验收 |
| bun spike 污染主树 | 工作区 | lockfile 被改写 | 构建不可复现 | 隔离 worktree 强制 + `git status` 核对 | 删 worktree | M5 纪律 |

发布顺序：M1→M3 的 patch 类改动可在同一构建窗口合并验证；M4 单独构建窗口（运行时层变更独立可回滚）。回滚门：任一 smoke 负向断言失败 → 该里程碑 patch 回退，不影响已完成的其他里程碑（patch 相互独立）。

## 9. 验证

### 9.1 行为与接口验证

- patch 可重复应用：干净 1.135 树上 `prepare_vscode.sh` 全量重放成功。
- 编译闸：M2/M3 的 patch 落地后 vscode 树内 typecheck（`npm run compile`）干净——摘 import 漏一处即在这里暴露。
- 产物断言（并入 `dev/smoke.sh`，复用其 `count_prefix` 机制）：
  - M2（L1）：产物 `product.json` 无 `defaultChatAgent`/`trustedExtensionAuthAccess`/`builtInExtensionsEnabledWithAutoUpdates` 键命中；`jq` 断言 `extensionEnabledApiProposals`/`extensionsEnabledWithApiProposalVersion` 无 `GitHub.copilot*`/`ms-vscode.vscode-copilot*`/`ms-azuretools.vscode-azure-github-copilot`/`ms-vscode.vscode-websearchforcopilot` 子键；`node_modules` 无 `@github/copilot*`、`@vscode/copilot-api`；docs 树无 `ext-github-copilot.md`；设置 schema 计数：`chat.*` ≤ 10（对齐 `dev/progress/phase-4-batch6-done.md` F-12 隐藏面基线）、`copilot.*` 与 `github.copilot.*` 前缀 = 0；产物 `product.json` 无 `extensionTips`/`extensionImportantTips` 键。
  - M3（L1）：`rg` 二进制存在且 `bin/` 仅本机平台目录；`mxc-sdk/bin/` 仅 arm64；asar 内无 `1ds-post-js`/`1ds-core-js`/`applicationinsights-core-js`；无 `notebook-out`；设置 schema 计数 `telemetry.*` ≥ 1（Settings UI 不丢 telemetry 行）；源码树 `grep -rl 'OneDataSystemAppender\|@microsoft/1ds' vscode/src/` = 0。
  - M4：plist `CFBundleVersion` = 43.7.5；`LSMinimumSystemVersion` 保持 12.0。L3 新增机器断言：剪贴板——AppleScript `set the clipboard to` 后在编辑器 Cmd+V 并以 AX 读回校验一致（或 `pbcopy`/`pbpaste` 跨进程校验）；下载——触发一次文件下载并断言文件落盘（默认 `~/Downloads`）。

### 9.2 集成与回归

- `dev/smoke.sh`（L1+L2+L3，`--skip-ui` 用于无 GUI 环境）全绿；各里程碑只增断言不删既有断言。
- 体积账：每里程碑构建后 `du` 对比 §1.1-A 表逐项核销，zip 大小与 `assets/` 基线对比。
- CI：改动推分支触发 `ci-build-macos.yml` 绿（其余 workflow 视启用情况）。

### 9.3 NFR 与故障注入

- 体积：实测对比（9.2）。
- 故障注入：人为把 prune.json 指向不存在路径 → 确认 exit 4 且日志可读；Electron checksum 改坏一位 → 确认 packing 硬失败。

### 9.4 真实环境与 UI

本机 macOS（darwin-arm64）构建 → `dev/smoke.sh` 全量 → §6 清单走查。GUI 走查由实施者在本机执行（L3 依赖 macOS「辅助功能」权限）；无 GUI 环境用 `--skip-ui` 只跑 L1+L2。CI 验收范围按 `docs/vslight-release.md`「CI 范围（决策 B 落地）」：M6 只需 macOS arm64 CI 全绿；linux/windows 已降为 `workflow_dispatch` 手动触发，仅验证可构建、不纳入发布验收。Linux/Windows 无真实环境：明确不做本机验证。

### 9.5 静态校验

- `jq empty` 校验改后的根 `product.json` 与 `prune.json`。
- 全部 patch `git apply --check`（在干净上游树上）。
- shell 改动 `bash -n`；workflow yml 若改动跑 `actionlint`（仓库已有 lint workflow 惯例）。

## 10. 里程碑

| # | 里程碑 | 前置依赖 | 内容与并行边界 | 验证/退出条件 |
| --- | --- | --- | --- | --- |
| M1 | 体积基线 + 零风险瘦身 + 工具预备 | 无 | 记录基线表；`dev/build.sh` 加 `-d` 旗标、默认路径 `export CI=true`（D2/§5-B）；`dev/patch.sh` 号段正则支持 3 位数（M3/M4 的 100+ patch 依赖此修复）；98 号 patch 删 `vscode/build/gulpfile.vscode.ts:109-110` 两行；（可选）`prepare_checksums.sh` 跳过已有 hash 文件。**与 M5 可并行；与 M2 共享 `prepare_vscode.sh`/`product.json` 邻接面，若并行须同一写人** | 构建产物内 .map 文件计数 = 0（基线 89 个）且 zip 实测下降（差值落体积账）；`dev/smoke.sh` 全绿；`-d` 路径构建保留 map 走通；`dev/patch.sh` 对 3 位号段文件名命中前置应用逻辑（可用临时文件名验证）；98 patch 应用后产物 welcome 媒体目录为空；回写「实施进度」 |
| M2 | Copilot 配置面清除（ADR-1） | 无（建议 M1 后串行，共享文件单写人） | 根 `product.json` 清条目；`prepare_vscode.sh` del() 加键（子键精确删）；99 号 patch（完整范围见 §1.2：残余 import、copilotApiService.ts 处置、typings、eslint、remote 依赖、孤儿文件、agentsVoice）；prune.json 加 `node/copilot/` 目录（时序由 C-1 保证在 99 之后）；删 `docs/ext-github-copilot.md` + `docs/index.md:28` | §9.1 M2 断言全过（含用户可见层三条）；`jq empty` 过；vscode 树 `npm run compile` 干净；smoke 全绿；回写「实施进度」 |
| M3 | 深度瘦身 patch 批 | M1（体积基线口径 + `dev/patch.sh` 3 位号段修复） | D3 post-npm-ci 剪枝（rg + mxc-sdk）；D4 遥测 SDK（100 号，范围见 §1.2）；D5 mermaid notebook-out（101 号）；dev-tunnels 5 包摘除（102 号，先验证无消费方，不过则记录不建）。**各 patch 文件独立可并行 subagent 编写；`prepare_vscode.sh`（D3 新段）与 `prune.json` 为共享文件由主 agent 单写；patch 生成串行占用 `vscode/` 工作树** | §9.1 M3 断言全过（含 `telemetry.*` ≥1、1ds grep = 0、rg/mxc 平台断言）；体积账逐项核销；vscode 树 `npm run compile` 干净；smoke 全绿（终端/搜索/markdown 预览重点走查）；回写「实施进度」 |
| M4 | Electron 升级至 43.7.5 | 建议 M3 后单独构建窗口 | 先在 `dev/smoke.sh` L3 加剪贴板/下载机器断言（§9.1 M4）；按 §5-E 生成 103 号 patch（五文件）；清 node_modules 重编原生模块；构建；plist 断言；§6 行为走查 | §9.1 M4 断言全过（含 L3 新机器断言）；smoke 全绿；窗口/剪贴板/下载三项走查通过（机器断言 + 实施者目视确认）；失败则回退 patch 并记录；回写「实施进度」 |
| M5 | Bun spike（ADR-3） | 无（隔离 worktree，与任何里程碑并行） | §5-F 三命题验证；产出 `docs/adr/bun-build-toolchain.md` | ADR 落盘且每个命题有实证结论（成/败 + 证据）；主树 `git status` 无 lockfile 污染；回写「实施进度」 |
| M6 | 集成验收与收尾 | M1-M5 | 干净树全量重放构建；全 patch `git apply --check`；体积总账 vs 基线；smoke 全量；文档更新（`docs/vslight-plan.md` 相关段落标记已落地）；CI 分支验证 | 完整构建产出 zip 且 smoke 全绿；体积总账落记录；macOS CI 绿（linux/windows 按 `docs/vslight-release.md` 决策 B 仅手动验证可构建）；回写「实施进度」 |

并行说明：M5 完全独立（隔离 worktree）应委派 subagent 先行；M1/M2 因共享 `prepare_vscode.sh` 与根 `product.json` 由同一写人串行；M3 内各 patch 可委派 subagent 并行编写，但 `prepare_vscode.sh` 的 D3 新段与 `prune.json` 由主 agent 单写；patch 生成统一用修复后的 `dev/patch.sh` 在全量 patch 后的工作树上串行进行，`vscode/` 工作树同一时刻只属一个写人；M4 独立窗口避免与其他改动混在同一构建里定位问题。

## 11. 风险、开放问题与就绪状态

| 项目 | 影响 | 责任人/解除办法 | 最晚确认点 | 是否阻塞 |
| --- | --- | --- | --- | --- |
| A-2 mxc-sdk arm64 裁剪 | M3 一项 | M3 内 smoke 终端断言验证 | M3 退出前 | 否 |
| A-3 遥测 SDK 残留引用 | M3 一项 | M3 内 grep + smoke 验证 | M3 退出前 | 否 |
| Linux/Windows 未真实验证 | 发布面 | 本 fork 只发布 darwin-arm64；CI 若启用以其为准 | M6 | 否 |

- 最终状态：**Ready**。
- 定级理由：全部事实已核实、机制落点明确、验证闭环完整；ADR-1（按选项 A，chat 本体保留）与 ADR-2（目标 43.7.5）已于 2026-09-28 经用户拍板，无影响范围、安全、数据、外部契约或关键 NFR 的未决项。

## 12. 已知坑与历史教训

- prune 必须在所有 patch 之后执行（`dev/progress/audit-remove-patch.md` 时序审计）——本计划 D3 的 post-npm-ci 剪枝是第三个时序段，不与 prune.json 混用。
- `apply_actions` 路径缺失 exit 4（`utils.sh:19-43`）——prune.json 只收稳定存在的源码树路径；上游包内容剪枝走 D3 的 warn-only 逻辑。
- 摘 import 必须同步删打包/拷贝清单——welcome 媒体残留 1.4MB 就是 95 号只摘 import 没删 `vscodeResourceIncludes` 的教训（§1.1-A 末段，M1 顺手修掉）。
- chat 本体摘除 DI 修复面 >20 处（`dev/progress/phase-4-batch6-done.md` F-12）——ADR-1 不重复尝试。
- F-17：sourcemap 基址指 `rockie/sourcemaps`（`patches/00-build-update-sourcemap-url.patch`）——D2 剥离后该问题消失；调试构建保留 map 时基址不变。
- `jq` merge 无删除语义（`prepare_vscode.sh:109-110`）——product.json 清键必须 merge 源与 del() 双管齐下，且 `extensionEnabledApiProposals` 只能按子键删。
- `prepare_checksums.sh` 会对已有 `.sha1` 再取 hash，`assets/` 的 `.sha1.sha1.sha1...` 链是反复运行副产物——M1 可选修，清理存量链文件。
- `patches/00-copilot-disable-terminal-suggest.patch` 文件名误导（内容与 Copilot 无关）——不改名，避免 patch 历史噪音。
- Linux 三 arch Electron fork 有 major guard（`build/linux/package_bin.sh:62-65`）——M4 若触及需同步处理或确认本 fork 不构建这些 arch。
- `dev/patch.sh:59` 号段正则 `^([0-9])([1-9])(-.*)\.patch$` 只认 2 位数——100+ 号 patch 不命中「自动先应用同组前置 patch」逻辑；M1 先修脚本，生成 100+ patch 前必须用修复版或多参数调用形式。
- `vscode/` 树内的上游 AGENTS.md（如 `vscode/src/vs/platform/agentHost/AGENTS.md`，自称 living spec）随 patch 删除面失真——这些文件不进产物，本计划不维护它们；实施者不要把它们当作本仓库的现行事实。

## 13. 需求 → 设计 → 验证映射

| ID | 需求/约束/假设 | 设计落点 | 验证/解除办法 | 结果 |
| --- | --- | --- | --- | --- |
| R-1 | vslight 继续减肥 | §1.1-A 体积账 + D2-D5 + M1/M3 | 体积账核销 + smoke | 覆盖 |
| R-2 | 去掉 copilot 相关 | ADR-1 + §5-C + M2 | §9.1 M2 grep 断言（含用户可见层三条） | 覆盖（深度按 ADR-1） |
| R-3 | node 换 bun 评估 | ADR-3 + §5-F + M5 | ADR 落盘（命题实证） | 覆盖 |
| R-4 | Electron 到 latest | ADR-2 + §5-E + M4 | §9.1 M4（含 L3 机器断言）+ §6 走查 | 覆盖（拍板 43.7.5；44.x 按 ADR-2 重评估触发跟进） |
| NFR-1 | 体积下降 | D2-D5（D7 决议保留 playwright，不计入收益） | 实测对比 | 覆盖 |
| NFR-2 | macOS 地板承诺 | ADR-2（已定 43.7.5，不抬地板） | plist 断言 | 覆盖 |
| NFR-3 | CI 绿/patch 可重放 | D1；验收范围按 `docs/vslight-release.md` 决策 B | M6 全量重放 + macOS CI | 覆盖 |
| NFR-4 | patch 号段约定 | §1.2 | review | 覆盖 |
| C-1 | prune 时序/exit 4 | §2 接缝表 + §5-D warn-only | M6 重放 + 故障注入 | 覆盖 |
| C-2 | Electron 版本链 | §5-E 四步 | packing validateChecksum | 覆盖 |
| C-3 | 运行时 node 不可换 | ADR-3 | 无需验证（物理事实） | 覆盖 |
| C-4 | 签名公证链不动 | §0.5 | M4 走查公证产物 | 覆盖 |
| A-1 | CI=true 无副作用 | D2（已核实两消费点） | M1 试构建 + smoke | 已解除 |
| A-2 | mxc-sdk 裁剪安全 | D3 | M3 smoke 终端断言 | 开放→M3 解除 |
| A-3 | 遥测摘除无残留 | D4 | M3 grep + smoke + `telemetry.*` schema ≥1 | 开放→M3 解除 |
| — | chat-webview-out 删/留 | D5（保留：3 处运行期引用已核实） | §9.1 M3（notebook-out 无、chat-webview-out 在） | 覆盖（保留） |
| — | **不在本期：chat 本体摘除、Electron 44、全量 bun 化、playwright 摘除（D7 决议保留）、chat-webview-out 删除（运行期引用存活）、per-extension 1ds（上游扩展面，另立项）、Linux/Windows 发布、checksum 脚本修复（可选）、terminal-suggest patch 改名（可选）** | §0.5 | 去向见 §0.5/ADR | 排除 |
