# lean-core · VSLight · 原生资源合并与浏览器、AI 服务摘除（补丁层裁剪 · 本地编辑器）

> **计划状态：Ready**
>
> 调查基线：2026-10-01 · 主仓 `072159555717dd134cd599b918fa84e3d55c95cf`；工作树有与本计划无关的未跟踪目录 `docs/plan/ckf-1-acceptance-gaps.records/`，不读取、不修改。现状依据当前补丁层、应用产物及已有生成树；`vscode/` 的上游基线为 `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`（1.135.0），其修改是生成态，不能拿该 SHA 冒充最终应用的构建来源。
>
> 本期交付：**合并重复 macOS 图标、压缩 Mermaid 预览、剥离 Codicons 开发资源、Electron 原生界面保留中英文资源、删除内置浏览器及运行期 Playwright、移除 Chat/MCP/语音的服务实现与专属生产依赖**。
> 本期独特职责：把上一轮“AI 入口隐藏、服务本体保留”改成真正的运行链路删除；保留普通扩展所需的稳定 API 数据类型与本地无能力外壳。
> **顶层排除：不更换或升级 Electron/Node、不取消普通 Webview、不删除 Markdown/Mermaid 图表、不删除开发测试使用的 Playwright、不新增 Linux/Windows 发布、不自动推送或发布 Release。**

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

**一次回写**：由主 agent 先更新对应里程碑的独立记录，再同步「恢复快照」全部 7 行及「完成记录」中该里程碑的一行；状态/摘要就地更新，不追加流水。快照的「当前状态」写在做的里程碑（可并列）及最近实质进展，「下一步」写可执行动作；命令、断言清单、调试过程和改动清单只进独立记录。完成记录首次有进展时删掉占位行，每个已开始的里程碑一行：状态仅用「进行中 / 阻塞 / 已完成」，更新时间带时区，摘要 1–2 句写交付结果或已做到哪里、还差什么，记录列填相对本计划的 Markdown 链接（如 `[M1 记录](FEATURE.records/M1.md)`）。阅读规则、加载 skill 不算进展。实现偏差涉及范围、决策、接口、数据、风险或退出条件时，同时修订正文对应章节，快照只点明变化。

**独立记录**：每个里程碑一份，放在计划旁的同名 `.records/` 目录，命名 `M1.md`、`M2.md`…，有实施事实时才建；subagent 的任务详情写同目录的 `M1-前端.md` 这类任务文件，由里程碑记录链接。记录头写对应计划链接、最近更新（带时区）、状态和代码基线（验证时对应的 commit SHA；未提交写 dirty@起始SHA 并列出关键改动路径，不拿 HEAD 冒充）。「实现记录」写已交付行为、关键路径、必要决策与计划偏差，未完成时写缺口与继续动作；「验收记录」用 `退出条件 | 命令或走查步骤 | 环境/代码基线 | 结果与必要证据` 表逐条写实际结果，未运行、失败、环境缺失分开写，不预填通过。日志、截图只在有复核价值时另存并从记录链接，不复制终端流水或聊天。

**记完成的门槛**：退出条件全部通过才可记完成。验证没跑、跑红或因环境缺失跳过，就如实写进「当前状态」/「当前阻塞」，不写“基本完成”“应该可用”。

**回写后自查**：「当前进度 n/N」的 N 等于里程碑总数，n 只计状态为「已完成」的行；每个里程碑最多一行，转为已完成时将原行移至已完成记录末尾，按实际完成先后排列；「最近完成」对应最后一条已完成记录，不按编号推算；链接指向已落盘文件，完成判定有真实验收证据。每次回写后运行 `bash .agents/skills/dev-plan/scripts/check_progress.sh docs/plan/lean-core.md .`：它只查上述结构、计数与链接存在性，不读记录正文，也不证明验收真实通过。

### 恢复快照

- 最近更新：2026-10-01 18:42 +1000（计划初稿，尚未实施）
- 当前进度：0/8 个里程碑完成
- 当前状态：尚未开始；六项范围和稳定 API 兼容契约已确定
- 最近完成：无
- 下一步：M1 · 隔离重放当前补丁、固定基线产物与删除依赖清单，验证保留功能
- 当前阻塞：无设计阻塞；构建、签名及真实 UI 验收将在实施期运行
- 代码基线：dirty@072159555717dd134cd599b918fa84e3d55c95cf（仅上述未跟踪目录与新增计划；不包含功能实现）

### 完成记录

| Milestone | 状态 | 更新时间 | 简要记录 | 实现与验收记录 |
| --- | --- | --- | --- | --- |
| — | — | — | 尚未开始任何里程碑 | — |

## 0. 需求、范围与决策

### 0.1 需求与约束账本

| ID | 类型 | 来源 | 内容 | 设计/验收落点 | 状态 |
| --- | --- | --- | --- | --- | --- |
| R-1 | 功能 | 用户：重复图标合并 | macOS 文档关联引用同一应用图标，去掉相同图标副本；保留关联类型、名称、扩展名、UTI 与角色 | §5.1、M2、V1 | 已确认 |
| R-2 | 功能 | 用户：打开 Mermaid 预览压缩 | 发布预览 bundle 启用 minify，保留现有图表类型、布局、字体、明暗主题和独立编辑器 | §5.3、M3、V3 | 已确认 |
| R-3 | 功能 | 用户：清除 Codicons 展示页、预览图片等开发资源 | 产品不携带展示 HTML、预览图片和无运行消费者的展示 SVG；保留字体、CSS 和许可证 | §5.2、M2、V2 | 已确认 |
| R-4 | 功能 | 用户：Electron 原生界面只保留中英文语言资源 | 原生资源支持 en/en-GB/zh-CN/zh-TW，其他原生界面语言回退英文；VS Code 的扩展语言包机制保留 | §5.1、M2、V4 | 已确认 |
| R-5 | 功能 | 用户：删除内置浏览器及 Playwright 链路 | 删除 Integrated Browser、Simple Browser、浏览器工具、服务、IPC、preload、生产 Playwright；普通 HTTP(S) 外链交给已有 external opener | §5.5、M5、V5 | 已确认 |
| R-6 | 功能 | 用户：Chat、MCP、语音相关服务移除 | 删除 Chat/inlineChat/agentHost 残留、MCP、speech/agentsVoice/dictation/localTranscription 和专属 sandbox/extractor 服务；稳定接口只留下无后台兼容外壳 | §5.4–5.7、M4/M6/M7、V6 | 已确认 |
| NFR-1 | 体积 | 本地产物实测 | 最终 app 文件字节总和与 ZIP 都低于同条件基线；逐项记账，不把估计收益当退出条件 | §1.1、§7、M8 | 已知 |
| NFR-2 | 可靠性 | README 的保留范围、现有 smoke | 编辑/文件/搜索/Git/终端/tasks/OpenVSX/语言/主题/auth/普通 Webview/Markdown 保持可用，普通扩展激活与 Reload 不出现缺 DI/actor | §4、V7、M8 | 已知 |
| NFR-3 | 可维护性 | prepare_vscode.sh、utils.sh | 改动通过补丁/构建脚本重放；编译图、运行图、安装包与 npm 生产依赖闭包一致；不得以隐藏、skip 或删除校验代替移除 | §5、V8 | 已知 |
| NFR-4 | 兼容与数据 | 既有独立用户数据目录 | 稳定扩展 API 可加载并按无能力契约响应；旧设置和窗口状态不阻止普通编辑；不清理用户文件、账户凭据或历史数据库 | §3、§4、V9 | 已知 |
| NFR-5 | 分发 | docs/vslight-release.md、103 号补丁 | 沿用 Electron 43.7.5、macOS 12.0 地板和签名/公证链；macOS arm64 实机验收，现有 x64 CI 保持可构建 | §7–9、M8 | 已知 |
| C-1 | 约束 | prepare_vscode.sh:154–196、utils.sh:19–43 | 根 JSON remove 在 patch 之前；light/prune 在全部 patch 之后；缺失路径退出 4；嵌套删除必须消除重叠路径 | §5.7、§12 | 已确认 |
| C-2 | 约束 | build.sh:20–35、build/osx/prepare_assets.sh | macOS 资源整理必须在 packing 后、touch/签名/公证/ZIP 前，覆盖本地与 CI 共同入口 | §5.1、V1/V4 | 已确认 |
| C-3 | 约束 | src/tsconfig.json:29–34、extHost.api.impl.ts:273–275 | 全量 TypeScript 编译包含源码与测试；RPC 仍校验剩余全部 actor，不能全局关闭 assertRegistered | §5.4、V6/V8 | 已确认 |
| C-4 | 约束 | base/parts/sandbox、MainThreadWebviews、profiling.ts | Electron 基础 sandbox、普通 Webview、local pty host、storage/SQLite、外链 opener、profiling 仍属保留面 | §0.5、§2 | 已确认 |

没有依赖未知产品选择的 A-* 条目。删除闭包的最终枚举、上游漂移及真实渲染属于必须执行的工程验证；M1 的清单冻结和后续编译闸不能省略。

### 0.2 决策表

| # | 决策点 | 选择 | 含义/影响 | 依据 |
| --- | --- | --- | --- | --- |
| D1 | 持久落点 | 继续使用 patches/、根产品配置和构建脚本；不直接交付 vscode/ 修改 | 从当前最高号 113 后分配新补丁；生成树只是调查/编译载体 | C-1、现有 91–113 批次 |
| D2 | 图标与 locale 整理 | 新增一个 macOS 构建资源整理脚本，共用 packing 后入口 | 使用 Python 标准库处理 plist/哈希/资源目录，无运行依赖；不要修改已公证的发行包 | C-2、gulp-electron 的图标复制行为 |
| D3 | 浏览器出口 | 删除两个内置浏览器，沿用现有 external opener fallback | 普通 Webview 和第三方 external opener 保留，不新增 URL 转发机制 | OpenerService.openExternal、NativeHostMainService.openExternal |
| D4 | 扩展接口 | 稳定 chat/lm/MCP API 保留本地无能力外壳，删除 runtime actors；被移除的 proposed API 明确不支持 | 普通扩展可继续加载，AI 功能不再可用；不通过 Null Chat/MCP 服务保留整条后台 | ADR-1 |
| D5 | npm 范围 | 删除生产闭包里的 Playwright/MXC/sandbox-runtime/foundry；测试专属依赖可保留 | 产品零对应运行依赖；不要求仓库/lock 文件所有 playwright 字符串为零 | ADR-2 |
| D6 | Mermaid | 压缩普通预览；拆出普通 openInEditor 命令，保留 index-editor，删除聊天 renderer/index | 同名输出目录有共享消费者，按文件和声明裁剪 | editorManager.ts:172/208、chatOutputRenderer.ts:141 |
| D7 | 服务解绑 | 先处理扩展 API 和普通功能消费者，再删除注册/IPC、源码及生产依赖 | DI/actors/编译闭包逐层验收；不堆叠大面积空服务来绕过启动失败 | §1.2、C-3 |
| D8 | 升级和回滚 | 不主动删除用户 Chat/MCP 数据；旧功能入口失效，旧配置无需清洗 | 回滚应用后旧历史/凭据仍在；窗口恢复容忍退休的 editor ID | §3、ADR-3 |

### 0.3 ADR-lite

#### ADR-1：服务物理删除与稳定扩展 API 的兼容边界

- 状态：Accepted（本计划采用的实现策略；用户已明确要求移除服务）。
- 驱动：R-6、NFR-2/NFR-4。API 工厂会为普通扩展主动获取 LM/MCP 并创建多个 Chat/Speech actors；context 对每个扩展生成 languageModelAccessInformation。直接删 DI 后继续使用现有工厂会破坏普通扩展。
- 候选 A：删除所有相关 namespace、稳定类型和接口，明确放弃这些扩展契约。删除面简单，但同时使用普通编辑能力和可选 AI API 的扩展也会在 activation 中失败。
- 候选 B：删除后台、IPC、runtime actors 和服务，仅保留稳定符号的本地空查询、惰性注册和失败返回。保留面的复杂度集中在一个 API 模块，需要明确测试，但不会形成 AI 运行链。
- 决策：B。proposed API 不承诺兼容；其类型检查/现有提议检查仍可保留，本地入口必须明确 unavailable，不能被 product allowlist 或 --enable-proposed-api 重新启用。
- 正面后果：普通扩展宿主可以初始化，模型/工具为空，任何 provider/handler 都不会被产品调用。
- 负面后果：依赖被删除功能的扩展不可工作；纯数据类型和部分 API 名称仍出现在源码/JS 中，不能宣传“所有 Chat/MCP 字符串为零”。
- 重评估触发：用户要求连稳定接口也不保留，或上游正式取消这些稳定接口。

#### ADR-2：产品运行依赖与开发测试依赖分开裁剪

- 状态：Accepted（本计划采用）。
- 驱动：R-5。playwright-core 是产品运行依赖；@playwright/test 同时用于普通 browser unit tests 和 Electron automation。chrome-remote-interface 仍用于扩展 profiling。
- 候选 A：仓库内所有 Playwright 开发和运行依赖一起删除，另建 GUI/浏览器测试方案。范围扩张至验收工具迁移，用户没有要求。
- 候选 B：删除产品浏览器/Playwright 链路和生产依赖，保留测试专属工具与 profiling 的 CRI。
- 决策：B。以 npm production graph 和最终 `.app`/asar 为零残留判定边界，而非根 lock 文本。
- 后果：得到运行期瘦身且保留验证能力；lock 中可能合法存在测试 Playwright。第三方自行安装的浏览器扩展不属于发行包内置浏览器。
- 重评估触发：用户另行要求纯净开发工具链。

#### ADR-3：原生语言与旧用户数据的兼容策略

- 状态：Accepted（中英文范围来自本次用户要求；数据处理为本计划策略）。
- 候选 A：语言整理同时限制所有 VS Code 语言包，并清除旧 Chat/MCP 设置、缓存和凭据；扩大到用户数据迁移且回滚困难。
- 候选 B：只裁原生资源，不改变工作台语言包；旧 AI 数据留在磁盘，应用不读取它们来运行服务。
- 决策：B。原生中英文集为 en/en-GB/zh-CN/zh-TW，保留它们现有的 gender variants；Base.lproj 如存在保留。其他原生界面回退英文；不在 macOS 强塞 Electron --lang。
- 后果：原生界面不再支持其他语言；旧历史和凭据可供用户回滚/导出，不产生不可逆数据库迁移。
- 重评估触发：明确新增语言支持或单独授权清理历史数据。

### 0.4 职责与事实所有权

| 边界 | 上游源码与 Electron | 本仓补丁/构建层 | 用户数据与扩展 |
| --- | --- | --- | --- |
| 拥有 | 原始类型和功能实现、运行时资源格式 | 删除策略、稳定 API 无能力语义、构建过滤、验收和发布物 | 本地文件、设置/历史/凭据、用户安装扩展 |
| 不拥有 | 不决定本产品开启哪些功能 | 不改第三方扩展自带 SDK/网络；不重新实现浏览器、Chat 或通用 RPC | 不把不兼容扩展的 AI 功能当作保留能力 |

最终依据是重放后的源码、生产依赖图和已验证的产品；历史计划不替代代码事实。

### 0.5 明确不在本期

- 删除编辑器/文件/搜索、Git/SCM、普通终端/Tasks、语言/主题/auth、普通 Webview、Markdown/Mermaid、local history、SQLite/storage、通用外链或本地 profiling。
- Electron/Node 升级、Bun 替换、Rust CLI/REH 重新引入、图标视觉重设计、Linux/Windows 的中英文资源裁剪或发布。
- 删除测试开发目录中的 Playwright；阻止用户自行安装带 AI/浏览器能力的第三方扩展；后台读取/删除用户的 MCP 配置、Chat 历史或凭据。
- 照搬此前未选中的 MXC“只裁跨平台文件”任务：本期在专属消费者全部移除后删除整个生产包，收益不能叠加两次。

## 1. 当前事实与改动面

### 1.1 现状、计量口径与收益依据

本次读取的 `VSCode-darwin-arm64/VSLight.app` 版本为 1.135.06566；文件长度求和（跳过 symlink）503.66 MiB，`assets/VSLight-darwin-arm64-1.135.06566.zip` 为 181.55 MiB。不与 `du` 的块分配口径混用。该旧产物用于量级参考；M1 必须补充与当前补丁基线同条件的新基线，记录 source commit/patch hash、Electron、Node、构建参数和签名状态。

| 已核实的候选 | 当前内容/证据 | 可减少的文件字节 | 判定 |
| --- | --- | --- | --- |
| 图标 | Contents/Resources 下 29 个 icns 的 SHA256 完全相同，应用图标为 VSLight.icns | 28 个副本，11.43 MiB；现有 ZIP 中约 10.28 MiB | 资源合并，R-1 |
| Codicons | root production 包的 dist/codicon.html、dist/codicon.svg、preview.png；消费检索未发现当前产品加载它们 | 三文件约 2.04 MiB | 按精确清单过滤，R-3 |
| Electron locales | Framework 的实际 Resources 下 220 个 lproj，共 46.40 MiB；16 个中英文/variants 合计约 2.15 MiB | 44.25 MiB；ZIP 对应条目约 11.21 MiB | 原生语言范围变化，R-4 |
| Mermaid preview | esbuild.webview.mts:42 显式 minify:false；共用 webview runner 默认 true，被该配置覆盖 | 已完成的二次压缩试验：24.64→17.83 MiB，省 6.81 MiB；deflate 差约 0.59 MiB | 可行性估计，尚非源码构建/渲染验收 |
| Playwright | asar header 中 runtime playwright-core 的逻辑文件长度约 10.37 MiB | 取决于实际生产依赖闭包 | R-5；不包含 CRI 的 2.05 MiB |
| Mermaid chat index | chat-webview-out/index.js 约 4.51 MiB；index-editor.js 也约 4.51 MiB，但普通 editor 活用 | 只移除聊天入口，保留 editor 和 CSS | R-6 的必要级联，不删除全部 Mermaid |
| AI 专属生产包 | MXC 14.72 MiB、sandbox-runtime 2.69 MiB、foundry SDK 约 0.12 MiB；standalone Node 副本另在 node_modules | M7 统一按实际文件记账 | 同一 asar unpacked 文件不重复计算 |

收益不能简单相加当作最终承诺：源码重打包、许可证/共同资产与重复副本会改变差值。没有来源的“减到某固定 MB”“启动快百分之多少”不作为目标。

### 1.2 已核实的运行边界

| 模块 | 已读到的行为与最小改动 | 漏做的后果 |
| --- | --- | --- |
| workbench.common.main / desktop.main / web.main | Chat、inlineChat、MCP、speech、agentsVoice、agentHost、localTranscription、sandbox/extractor 均有 import/单例；desktop 还加载 BrowserView/Playwright | UI 隐藏后仍编译、注册或预热服务 |
| API factory / services / protocol | extHost.api.impl.ts:177–178/254–275 主动创建 AI actors 并 assert 全集；common services 注册 Eager LM/MCP | 普通扩展启动 Missing proxy/Unknown service |
| ExtensionContext | extHostExtensionService.ts:37/139/527/556 为所有扩展创建 languageModelAccessInformation | 仅替换 chat/lm namespace 仍不能启动 |
| Main/shared process | app.ts 注册 BrowserView、MCP discovery/gateway、sandbox/extractor；sharedProcessMain 注册 Playwright/MCP/extractor channels | 隐藏 workbench 后后台和 IPC 仍在 |
| AgentHost / transcription | agentHostService 的 BlockRestore prewarmer 会 startAgentHost；localTranscription 事件 getter 可创建 utility worker并传递下载参数 | 错把懒加载视为无运行能力 |
| CLI | cli.ts、cliProcessMain.ts、environment 的 argv 仍有 chat/--add-mcp 路由和帮助 | CLI 可以重启被删除功能或残留坏帮助 |
| Browser/Simple Browser | Integrated Browser 有 editor、CDP、菜单、localhost opener；Simple Browser 在 integrated command 消失时 fallback 到自有 Webview | 只删 BrowserView 后还剩第二个内置浏览器 |
| Mermaid | editorManager:172/208 加载 index-editor；registerChatSupport 同时注册普通 openInEditor | 整目录删除使普通预览/图表编辑失效 |
| 窗口恢复 | editorGroupModel.deserialize 会 coalesce 掉未知 serializer，却用旧索引读取过滤后的 editors 来恢复 mru/preview；sticky 在遍历中修改原边界 | 混合退休/普通 tabs 有错选、预览和 sticky 越界风险，需测试和通用索引映射 |
| tsconfig | src/tsconfig.json:29–34 纳入所有 vs/**/*.ts 与 proposed declarations | 仅摘 import 不能清除全图编译引用 |

### 1.3 文件落点

持久修改：`patches/`、`patches/light/prune.json`、`prepare_vscode.sh`、`product.json`、`build.sh`、`dev/smoke.sh`，必要的构建 workflow 与上述文档。新文件在首次有实现时创建，不现在预建：

- ★ `dev/prune-macos-resources.py`：图标/locale 的构建期整理；★ `dev/test_prune_macos_resources.py`：资源安全/失败与幂等 fixture。
- ★ `dev/test-fixtures/lean-core/package.json`、★ `dev/test-fixtures/lean-core/extension.js`、★ `dev/test-fixtures/lean-core/run.js`：在真实扩展宿主验证稳定 API 与普通保留面，不能作为内置扩展发布。
- ★ 通过新补丁生成 `vscode/src/vs/workbench/api/common/extHostDisabledAi.ts`：稳定无能力兼容对象，不注册 DI/RPC，不 import 专属服务。
- ★ `docs/plan/lean-core.records/`：实施后逐里程碑建立，不预建空记录；M1 同时保存源码入边清单、保留常量/类型清单和专属依赖清单。

新补丁编号从 114 起，由集成人统一分配。每个补丁以完整当前前置批次为生成基，不把并行 worker 的不同“全部 patch 已应用”假设带入同一生成树。本文引用 `vscode/` 文件是调查和补丁落点，不授权把生成态当持久交付。

## 2. 模块、接口与依赖

| 模块 | 调用者 / 接缝 | 不变量 | 依赖和验证 |
| --- | --- | --- | --- |
| macOS 资源整理 | build.sh 的 packing 后单一入口 | 先验证所有条件再改；plist 与资源引用一致；幂等；不越出 app 的实际路径 | 标准库 + 实际 .app；fixture/签名验证 |
| 无能力 API | createApiFactoryAndRegisterActors、ExtensionContext 构建 | 初始化不用 AI DI/actor；注册不调用/订阅 provider；查询为空；执行异步拒绝 | 进程内本地对象；真实 extension host fixture |
| 普通功能解绑 | Settings/auth/terminal/tasks/editor/SCM/issue | 保留普通路径，直接移除 AI 分支与参数；不新造一套 Null 服务层 | 现有服务；公开操作回归 |
| 外链打开 | 通用 OpenerService → NativeHostService → shell/open | HTTP(S) 沿用 external opener；普通 Webview 的消息与渲染不变 | 真实本地服务器/系统浏览器，保留 open dependency |
| 删除域 | workbench、main/shared process、CLI、source compile | 无 runtime contribution、IPC、preload、worker、生产专属 npm 包 | 全图编译/生产 graph/asar/运行注册清单 |

删除测试：完整删除专属服务后，其功能复杂度应消失；稳定接口兼容只集中处理“产品没有该能力”的策略，不能把 Chat/MCP 实现散进 Settings、auth 或 terminal。无需远程 adapter、新 RPC 协议、新数据库或功能开关。

## 3. 用户数据、升级与回滚

1. 用户文件、工作区设置、MCP JSON、Chat/agent history、secret storage 与普通账户凭据均不做清理迁移。去掉服务的 scanner/provider/worker，保留无关的设置读取、SQLite 和 secret storage。
2. 原有 chat/mcp/speech/browser 设置留在用户 JSON；新注册 schema/菜单不再展示它们，不自动启用功能，不批量重写用户文件。
3. 旧窗口里的退休 Chat/Browser editor 不应阻断普通 tabs。`vscode/src/vs/workbench/common/editor/editorGroupModel.ts` 的 deserialize 会跳过未知 serializer，但 mru/preview 仍按旧索引访问过滤后的列表，sticky 判定也在修改原边界；不能仅凭“跳过未知项”承诺恢复正确。M1 在 `vscode/src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts` 设计混合状态回归，M4 按结果修复通用恢复：建立旧索引到存活 EditorInput 的映射，mru/preview 按映射恢复，sticky 依据原边界计算存活数量。不重新注册旧 editor 或读取 Chat 数据。存活文本/Markdown/Webview tabs 保持相对顺序；原 active 仍存活时保留它，否则选第一个存活 MRU；preview 已退休时不迁给邻项；sticky 不越界。
4. 导入旧 `workbench.externalUriOpeners` 指向 Simple Browser 的配置时，现有 opener 无匹配应交给系统 fallback。不批量删除第三方 opener 配置。
5. 从备份 profile 回滚旧 app，历史与凭据仍可使用。正常应用保存窗口布局可能更新 editor state；不承诺被退休的 tabs 还原到原位置。
6. 无 schema 升降级、回填或不可逆迁移。升级验证必须使用 profile 副本，不能用真实用户目录做试验。

## 4. 集成契约

### 4.1 稳定 API 的最终行为

依据 `vscode/src/vscode-dts/vscode.d.ts` 与 `extHostTypes.ts`，实施以下契约：

| API | 返回/行为 | 必须观察的失败或禁止行为 |
| --- | --- | --- |
| chat.createChatParticipant(id, handler): ChatParticipant | 本地对象包含 id、可写 requestHandler/iconPath/followupProvider、never-fired onDidReceiveFeedback、幂等 dispose | 不能只返回 Disposable；不会执行 handler，不注册 UI/backend |
| lm.selectChatModels(...): Thenable | resolved [] | 无伪模型、无模型发现、无网络 |
| lm.onDidChangeChatModels、accessInfo.onDidChange | 不发事件；遵循 Event 的 listener/thisArgs/disposables 约定 | 监听/解除监听不发 RPC，不调用用户 callback |
| lm.tools | 固定 readonly 空数组 | 不暴露注册工具或 MCP 工具 |
| lm.registerTool、registerLanguageModelChatProvider、registerMcpServerDefinitionProvider | 本地惰性 Disposable | 不保留 provider/tool、不订阅它们的事件、不执行提供/解析/响应方法 |
| lm.invokeTool(...): Thenable | rejected Promise，使用现有 LanguageModelError.NotFound，说明本产品无 LM 工具 | 不同步 throw、不成功返回空 result；兼容测试固定 name/code 与消息含义 |
| ExtensionContext.languageModelAccessInformation | 本地对象，canSendRequest(...) 返回 undefined | 无模型时不能返回现有实现的恒 true；不索取 consent |
| LM message/part/result、LanguageModelError、McpStdio/HttpServerDefinition | 保留纯数据构造/枚举 | 不连接模型、不启动 MCP 命令/HTTP |

不制造 LanguageModelChat 实例，因而无 sendRequest/countTokens 的伪实现。对象持有的用户 handler 可按稳定接口读写，但绝不在服务生命周期中调用。

Proposed browser/speech/Chat 扩展接口不受兼容承诺保护。删对应 actors/customer/DI；M1 冻结退休 proposal 清单，在 extHost.api.impl.ts 保留入口时先遵守 `vscode/src/vs/workbench/services/extensions/common/extensions.ts` 的 checkProposedApiEnabled，再明确返回本地 unavailable，异步签名返回 rejected Promise。权限授权不等于产品实现能力，product allowlist、实验 fallback 或 --enable-proposed-api 均不能恢复被删服务。保留普通 proposal 的既有权限检查和行为；不是删整个 proposed declarations 集合，也不是把所有 proposed API 一起禁用。

### 4.2 保留调用者与删除边界

| 边界 | 行为级证据 | 本期处理 / 失败语义 |
| --- | --- | --- |
| 普通扩展和两侧 RPC | factory 对 ExtHostContext assert；extensionHostManager 创建全部 customer、校验 MainContext | 缩减两侧 actor ID/shape/import 与注册；保留校验，错误仍阻止验收 |
| 外链/localhost | OpenerService.ts:240–253 无 contributed opener 时调用 default；window.ts:874–876 到 nativeHost.openExternal | 撤销内置 opener，复用系统出口，不更改第三方 URI opener能力 |
| 普通 Webview | MainThreadWebviews 的 actor/rendering 与外链服务是独立链路 | 完整保留；普通消息、恢复、主题回归 |
| 账户/auth | authenticationQueryService 的 MCP usage/access 混在普通查询内 | 只拆 MCP 事件/入口/DI；普通 auth/session/secret 操作不改变 |
| profiling | base/node/profiling.ts:86 动态 import CRI；CLI/ExtensionHostProfiler 仍调用 | 保留 CRI和采样停止路径 |
| 元数据 allowlist | 根 product 合并没有删除语义，曾保留 browser/speech/chat/MCP proposal条目 | 根配置与生成结果双层精确过滤；保留不相关 proposals/extensions |

## 5. 实施机制

### 5.1 重复图标与原生语言资源

新 helper 在 `build.sh` macOS 的 min-packing 后、现有 touch 和 prepare_assets 签名前运行，参数传实际输出 app 路径。从输出目录唯一 app 或生成 product.nameShort 推导，不能硬编码 VSLight.app 导致 Insider 失效。CI arm64/x64 都经过同一入口；脚本所需 Python 3 在两个 job 明确可用。

图标流程：

1. 读取应用 Info.plist 的 CFBundleIconFile，以及 CFBundleDocumentTypes 的所有 CFBundleTypeIconFile。只处理 Contents/Resources 下本产品文档图标，不扫描 helper app 或任意用户文件。
2. 验证主图标存在；每个文档图标存在且与主图标 SHA256 相同。遇到不同哈希或外部路径先失败并说明具体图标；不能静默吞掉未来真实的文件类型图标。
3. 将文档图标字段统一为应用主图标字段；类型名称、扩展名、UTI、role、URL关联等其他数据保持原值。不存在 CFBundleTypeIconFile 的文档类型不补造字段。
4. 用临时文件写好并解析验证 plist，再原子替换；删除已验证且已不被其他 plist 字段引用的副本。重跑不新增文件、不报不存在错误。
5. 不只把源码映射改成 code.icns：gulp-electron 会把 app icon 重命名为 productName.icns，而文档图标保留 basename；这种做法仍留下两份同内容。处理最终 plist 可以收敛到一份。

语言流程：

- 作用域为 app 内主 Resources 和 Electron Framework 的实际 Resources；解析框架 symlink 后确认仍在 app 内，不重复扫描 Versions/Current/A 同一文件。
- 精确白名单：en、en_GB、zh_CN、zh_TW 及每个现存的 `_FEMININE`、`_MASCULINE`、`_NEUTER` variants；Base.lproj 若存在保留。启动必需的 icudtl.dat、resources.pak、snapshot、许可证和其他 runtime资源保留。
- en/zh_CN/zh_TW 必需资源缺失、白名单格式不匹配或发现目录越界时失败，不打包缺资源产物。已有 CFBundleLocalizations 如存在必须同步过滤，development region 采用英文 fallback；当前产物两份 plist 都没有该字段，不假设始终如此。
- 不改 `src/main.ts:156–166` 的 macOS locale 选择：上游明确避免在 macOS 加 --lang。其他工作台语言包可以继续安装，原生 Electron 部分只承诺中英文。
- 全部条件预检后才执行删除；输出保留集合、删除文件数与字节，错误由 build.sh 的 set -e 阻止签名/打包。

### 5.2 Codicons 开发资源

在新补丁中扩展 `vscode/build/.moduleignore` 的精确路径：`@vscode/codicons/dist/codicon.html`、`@vscode/codicons/preview.png`、`@vscode/codicons/dist/codicon.svg`。第三项执行前再次检查最终消费图，若新增消费者则只删纯展示文件并记录差异，不把运行资产误认成演示。

保留包内 dist/codicon.css、dist/codicon.ttf、包入口和许可证；当前构建输入可核对 `vscode/node_modules/@vscode/codicons/dist/codicon.css`。同包在扩展 webview 中的构建输入不删：清理规则作用于发行复制，不在 npm 安装后破坏 Mermaid、Markdown、普通主题的编译输入。对 asar 与散装副本统一检查展示资产未带入。

### 5.3 Mermaid 压缩及 Chat 适配拆除

1. 发布构建移除普通 preview 的 minify:false 覆盖，继承 webview common 的 true；不取消 CSS/font data URL插件，不改变 es2024 target、ESM、CSP 或 mermaid/addon版本。
2. 保留 flowchart、sequence、state、ELK/tidy-tree、ZenUML 等当前支持能力；不能用砍图类型或字体冒充压缩收益。明暗主题、中文标签和异常图表状态属于回归。
3. 将 `_mermaid-markdown.openInEditor` 从 registerChatSupport 移到普通 extension激活逻辑；保留 editorManager、webviewManager 和普通 resetPanZoom/copySource命令。
4. 解绑 extension.ts 的 registerChatSupport import/调用；删聊天 renderer 与 LM render tool、manifest 中相应 proposal/contribution/菜单条件、chat webview index 构建入口。
5. 构建产物 chat-webview-out/index-editor.js 和它实际需要的 CSS/字体/共享渲染输入继续存在；源码入口为 `vscode/extensions/mermaid-markdown-features/preview-src/chat/index-editor.ts`，当前成品可核对 `VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/chat-webview-out/index-editor.js`。同目录 index.js 删除。不为改目录名称重写所有引用，目录名中的 chat 不是失败条件。
6. 构建和复制入口、manifest 声明、恢复入口保持一致；继续满足上一轮 notebook-out 不进产物的断言。

### 5.4 扩展 API 和保留功能先解绑

工厂：修改 extHost.api.impl.ts、extHost.common.services.ts、extHost.node.services.ts、extensionHost.contribution.ts、extHost.protocol.ts，撤销 AI/浏览器 MainThread/ExtHost actors、eager service、RPC 初始化与客户注册。移除不再使用的 DTO/type imports；保留 actor校验，剩余集合必须完整。同步 extHostExtensionService 的 accessInfo构建。

转换/类型：删 extHostTypeConverters 内专属 Chat/MCP/语音/Browser runtime转换分支。extHostTypes 中纯稳定数据继续保留；如 HookTypeValue 等仅属于删除域的类型仍被 API数据引用，迁移最小纯数据定义至 API层，不反向 import 服务，不复制整个 Chat model。

普通消费者必须逐项解绑，不能全部改成注入空 Chat 服务：

| 保留功能 | 确定的源文件/符号 | 删除的分支；保留的结果 |
| --- | --- | --- |
| Settings 搜索/编辑 | settingsEditor2、preferencesSearch、preferencesRenderers、preferences.ts、settingsLayout | 去 Chat entitlement、AI/LLM ranking、MCP renderer/code actions与分组；保留本地字符串/TF-IDF、普通 JSON编辑 |
| 扩展安装/启用 | extensionEnablementService、extensions.contribution、extensionsActions、extensionsViewlet | 去 AI migration/unification、SearchExtensionsTool、@mcp/agent分流；保留普通市场与 enablement |
| 认证/账户 | authenticationQueryService、authentication.contribution、manageAccountsAction、globalCompositeBar | 去 MCP usage/access/query、Codex菜单和 DI；保留普通 provider/session/secret及按需认证 |
| 终端 | terminal.all、terminalTabbedView、terminal.ts、terminalMenus、terminalContribExports | 去 chat/voice/tools注册、TerminalTabsChatEntry、speech菜单；保留普通 tabs/过滤/布局/运行能力 |
| agent 终端 | terminal.contribution、terminalProfileResolverService、agentHostPty/agentHostTerminalService/agentHostOutputChannel/ahpTerminalCommandSource | 去专属 pty/profile/output适配与 allow flag；保留 node-pty和普通 profile |
| Tasks | abstractTaskService、taskService | 去 Chat DI和错误后的 Fix with AI；保留错误显示、运行/停止任务 |
| 搜索/符号 | anythingQuickAccess、symbolsQuickAccess、gotoSymbolQuickAccess、search.contribution | 去 Ask/Chat attachment/context；保留文件搜索、quick open、普通 outline/符号 |
| 编辑器 | emptyTextEditorHint、codeEditor.contribution、dictation/editorDictation | 去 AI生成和听写；保留语言选择提示和普通编辑贡献 |
| Git/SCM/Problems | scmInput、scm.contribution、markers.contribution | 去 AI commit/冲突修复、Chat context；保留普通 commit输入/diff/stage和问题列表 |
| 可访问性 | accessibleView、accessibility.contribution/configuration、editorAccessibilityHelp、terminalAccessibilityHelp | 去 Chat code block/speech专属帮助和设置；保留普通 accessible view、导航/提示 |
| Issue reporter | issueReporterEditorPane、issueReporterOverlay | 去 AI标题生成按钮、事件、模型调用与注入；保留手填标题/复制/提交 |
| 通用诊断/信任/编辑遥测 | developerActions、workspaceTrust、editSourceTrackingFeature/Impl、editTracker | 去 agentHost scheme/marker/diagnostics分支；保留普通本地诊断与信任语义 |

上述具名清单是本次读到的高风险入边，不宣称是全图全集。M1 从所有静态/动态 import、DTO、装饰器 DI、运行注册、资源 string path 中生成清单；每条入边标明“删除调用”“普通路径替换”“纯类型/常量迁移”及对应验收，才可冻结接口并开始 M4。后续全图编译发现遗漏即补闭包，不用 any、tsconfig 排除整个保留模块或全局 skip 校验遮蔽问题。

### 5.5 浏览器和 Playwright 链路删除

- 删除 desktop/web 的 browser contributions、workbench Playwright service、platform/browserView运行目录；移除 app.ts 中 BrowserViewMain/Group service、导航专用放行判断、两个 IPC，以及 sharedProcess 的 PlaywrightChannel/AgentNetworkFilter创建。
- 从 auth.ts 删除 BrowserSession import及专用 proxy-auth例外，保留普通代理认证；editorConfiguration 去 Simple Browser 静态项，保留第三方 browserPreview配置。
- 删除 browser tools/contributions、editor serializer/resolver、HTML菜单、View/标题栏 Browser、快捷键、localhost opener以及 workbench.browser.* schema。保留通用 BrowserWindow 与 Electron sandbox/preloads。
- 完整删除 `vscode/extensions/simple-browser`，同时去 build/npm/dirs.ts、gulpfile.extensions.ts、build/lib/extensions.ts 的安装/编译/media 入口，避免集成浏览器消失后 Simple Browser接管。
- 删除浏览器 preload 的 gulp资源复制、build/next入口与 checker/layers配置。web未发布但其导入仍参与检查，不能留下指向已删模块的引用。
- 不删除 MainThreadWindow/MainThreadWebviews/UriOpeners和普通 externalUriOpener服务。HTTP(S) fallback本来就存在；旧 opener设置及 localhost地址必须实测到系统浏览器。

### 5.6 Chat/MCP/语音后台与 CLI 删除

移除运行实现族：workbench/contrib 下 chat、inlineChat、mcp、speech、agentsVoice 和专属 terminalContrib/chat/chatAgentTools/voice；services 下 chat、AI settings/embedding/relatedInformation、agentHost、localTranscription 及专属 MCP认证；platform 下 agentHost、mcp、localTranscription、sandbox（AI终端辅助域）、webContentExtractor和没有保留消费者的 AI networkFilter。先拆共享消费者，再按清单删除目录/文件/对应专属测试。共用 imageCarousel 等贡献仅在入边确认为 Chat专属后去掉；普通图片预览扩展保留。

这里的 `platform/sandbox` 不包括 `base/parts/sandbox`。普通 ptyHost、file watcher、extensionHost、editor workers、Webview与通用网络代理继续保留。

main/shared：撤销 MCP discovery/gateway/management/gallery/scanner、sandboxHelper、webContentExtractor/shared extractor等服务和所有 IPC；撤销 local transcription utility worker、runtime download参数、agent prewarmer。IPC名称按代码中的常量收集，不只检查 channel字符串包含 chat。

构建：取消 localTranscriptionMain、agentHostMain/diffWorker 的所有剩余入口（包括不发布的 codeServer清单）、Chat媒体和专属资源复制、dictation runtime build/import/metadata stamping、Foundry安装/SDK改写及相关 checker/CI生产任务。用户未请求重新支持 REH/web；只要求其残留声明不使全图检查失败。

CLI：从 cli.ts、cliProcessMain.ts、platform/environment/{node,common}/argv 删除 chat/add-mcp 的执行、参数帮助和 stdin/context处理。针对旧 `vslight chat`/`--add-mcp` 请求提供本地“不支持此功能”并 exit 1 的最小兼容拒绝，不能把 chat误当待创建文件或成功返回；普通 `--version`/`--status`/文件打开/扩展安装继续可用，显式 `--` 后的同名文件仍按文件路径处理。

产品与 schema：根 product和 merge后的结果清掉指向删除能力的 proposal授权、推荐/特例、worker/runtime metadata。保留普通 auth相关条目和未涉及的扩展。AI/MCP/voice/browser 的用户设置/命令/菜单注册为零；类型字符串、无能力 API和用于拒绝旧CLI的名字不是违规运行入口。

### 5.7 源码 prune、依赖与复制闭包

- 所有新 hunk 在 prune前应用；删除目录的子文件若已在旧 JSON remove清单，更新为不重叠清单。例如完整删除 platform/agentHost 时，52号根 JSON仍必须在patch前删其既有路径，light清单需删去其原有逐文件条目，避免父目录删除后子条目 exit 4。
- 不让不同补丁与 JSON同时拥有同一删除动作；prune必须在上游输入中稳定存在。package清理由生产依赖计算和专属过滤完成，不依靠静默忽略缺失文件掩盖漂移。
- root与remote manifests/locks都删专属直接依赖：playwright-core、@microsoft/mxc-sdk、@vscode/sandbox-runtime、foundry-local-sdk；远程manifest没有的项不补造。去对应 allowScripts、cglicenses、eslint/typings和生产构建元数据。
- 用现有 npm/node工具在正确 Electron target环境重生成 lock，复核 peer/optional/去重闭包；删除独占 transitive，不手工按包名抹掉共享条目。开发测试 Playwright仍可存在。
- 去 gulp中的 AI standalone重复副本/asar unpack规则、MXC平台裁剪、verify-macho/universal-app特殊规则、Foundry dictation install/produce/distribution。每个 copy规则先验证是否仍有保留使用者。
- 保留 node-pty、ripgrep、@vscode/sqlite3、katex、CRI、open、通用代理和 watcher。semver、shell-quote、zod、ssh2、tas-client等只在实际生产/开发消费者和依赖图均不需要时删除；不要把包名当归属证明。
- 清理对象包括正常 node_modules、asar和unpacked/standalone copy。同一内容用物理文件一次计量；asar header的 unpacked size不能再加一遍。

## 6. UI 与交互交付

- 主路径：本地文件/搜索/Source Control/终端/Tasks/扩展和普通设置可正常使用；外链由系统浏览器打开。
- 删除入口：命令面板、View/Help相关菜单、标题栏、状态栏、HTML右键菜单、终端工具、编辑器/SCM/Tasks的AI按钮、Settings分组和 MCP账户项均不再出现。不能只验证 Command Palette。
- Mermaid：普通 Markdown图表预览与“在编辑器打开图表”、缩放、复制源码、明暗主题、中文字符全部保留；无聊天渲染入口。
- 原生语言：明确支持英文、简体中文、繁体中文；其他语言包仍可影响工作台，原生对话框等回退英文。不能将 --locale=zh-cn 的工作台变化当作 macOS原生资源验证。
- 无能力稳定 API不弹登录/权限/模型选择；旧 AI CLI明确失败。服务移除后没有额外“启用AI”的按钮或占位页。
- 可访问性以保留普通界面为标准，不能为摘 speech删除整个 accessibility系统。

## 7. NFR 与运行保障

| ID | 本期目标 | 机制 | 验证 |
| --- | --- | --- | --- |
| NFR-1 | 同基线条件下 app及ZIP实际下降，逐项账可复核 | 原生/资源/依赖减法，MiB以2^20定义；基线与最终相同签名/压缩条件 | V10、M8；发布前给实测，不写估计完成 |
| NFR-2 | 核心保留能力与扩展激活通过，错误无DI/RPC缺失 | 先解绑消费者/API再摘服务，保留actor assert | V7、真实extension fixture、完整smoke |
| NFR-3 | 全量重放、编译图/包图/运行图一致 | 数值补丁序、无重叠prune、生产依赖和copy闭包 | V8、失败注入、干净重构建 |
| NFR-4 | 旧profile可启动、普通tabs与auth有效，用户数据不被清理 | 本地无能力API；缺serializer容错；profile副本回归 | V9，数据目录前后清单 |
| NFR-5 | 43.7.5/12.0不改变，签名与公证仍有效 | 先整理再签名；保留许可文件；现有macOS CI/签名链 | codesign/spctl/stapler/Info.plist、M8 |

本期不承诺 RAM/冷启动改善比例。M1/M8可在相同机器和空profile记录启动和空闲进程数据用于比较，结果不能由磁盘下降推断。运行错误沿用既有logs；无新增监控、后台服务或遥测。

## 8. 失败模式、发布与回滚

| 失败/触发 | 爆炸半径 | 数据后果 | 用户表现 | 检测 | 恢复 | 验证 |
| --- | --- | --- | --- | --- | --- | --- |
| icon不相同或plist引用缺文件 | 本次macOS构建 | 不改用户数据 | 构建失败，拒绝签名 | helper预检/文件关联检查 | 修清单或回退资源步骤 | 异哈希/缺主图标fixture |
| 语言必需资源缺失/原生fallback坏 | 发布macOS用户 | 无 | 原生界面异常或无法加载 | 白名单预检+真实原生UI | 回退locale整理独立提交 | en/zh-CN/zh-TW/其他系统语言测试 |
| Mermaid压缩或误删editor资产 | Markdown用户 | 无 | 空白/坏图或独立编辑器失败 | diagram矩阵+CSP/webview日志 | 回退压缩hunk或恢复共享资产 | 图表错误态和正常态 |
| DI/customer/actor遗漏 | 普通扩展乃至workbench | 无清理迁移 | 启动/扩展激活失败 | 全图compile+runtime logs+fixture | 回退该完整服务/API切片 | 冷启动/Reload/普通扩展命令 |
| 旧Browser/Chat serializer缺失阻断restore | 旧profile用户 | 窗口布局可能无法恢复 | 普通tabs不能打开 | 混合旧state fixture | 补通用容错；用备份profile回滚 | 普通tabs顺序/active/sticky |
| 生产闭包或copy遗漏 | 全发行包 | 无 | 原功能仍有后台/包仍膨胀 | graph+asar+运行注册与进程观察 | 补对应切片再重构建 | V5/V6/V8 |
| prune重叠/补丁上游漂移 | 本次构建 | 无 | exit4/git apply失败 | 重放/失败注入 | 修补丁或删除清单，不吞错 | 干净源全序重放 |
| 整理发生在签名后 | 本发行物 | 无 | macOS拒载/公证失效 | codesign/spctl/stapler | 回到未签名产物，整理后重新签名 | 完整交付链 |

发布门：M8全部退出条件通过才交付待发布ZIP；不发布有UI失败、服务残留或签名失败的产物。回滚保持“资源/扩展兼容/浏览器/AI服务/依赖”切片可追溯；跨API/actor与服务的配套修改必须一起回退，不能只恢复单个import。已签名ZIP不原地改，生成新产物；用户数据不需要数据库降级。

## 9. 验证

### 9.1 验收断言目录

| ID | 验证对象 | 通过标准 |
| --- | --- | --- |
| V1 | 图标 | 文档关联非图标字段与基线一致；全部IconFile引用有效且统一主图标；资源目录只保留该产品需要的一份图标；Finder/Dock/关于框与文件打开正常 |
| V2 | Codicons | asar/普通副本无指定demo资源；CSS/TTF/许可证在；Explorer/terminal/主题/Markdown/Mermaid图标正常 |
| V3 | Mermaid | 源码发布构建minify=true且产物比同条件baseline小；flowchart/sequence/state/ELK/tidy-tree/ZenUML、中文、字体、light/dark、非法语法提示正常；独立editor/缩放/复制有效；聊天index及注册不存在 |
| V4 | 原生locale | 真实资源及可选plist声明只有白名单；主和Framework资源引用有效；三语言原生UI与其他系统语言fallback正常；非中英文工作台语言包仍可安装 |
| V5 | 浏览器 | 无Integrated/Simple Browser贡献、BrowserView/Playwright服务、IPC、preload、生产包；HTML/标题栏/View/快捷键无入口；terminal/Markdown/Webview localhost及HTTP(S)由系统外链打开 |
| V6 | AI服务/API | 无Chat/MCP/voice/agentHost/transcription专属运行模块/注册/IPC/worker/download；stable fixture符合§4.1，provider/handler调用计数0；无常驻MCP/语音/agent子进程 |
| V7 | 保留功能 | 编辑保存、文件/搜索、语言/主题、Git diff/stage/commit、terminal命令落盘、task执行/停止、OpenVSX装卸、普通auth/session/secret、Webview消息往返和profiling全部通过 |
| V8 | 重放与闭包 | 全补丁+prune成功；全源码typecheck/compile；生产dependency tree与三种文件布局无专属包；保留DI/RPC校验；资源helper幂等和失败注入 |
| V9 | 升级数据 | 使用旧profile副本混合tabs/AI配置；普通tabs恢复，外链fallback，账户仍在；不删除历史/凭据/用户文件；legacyCLI失败且普通CLI正常 |
| V10 | 体积与分发 | app/ZIP实测下降且账不重复；43.7.5/12.0符合；macOS CI构建绿；codesign、spctl、公证和staple验证通过 |

不把 compiled JS 中没有某个关键词当作唯一移除证据：设置/命令枚举、入口/生产图、已构建文件清单和 runtime共同验证。纯API数据类型/禁用接口字符串/测试依赖列为明确例外，不放宽服务实现的验收。

### 9.2 必要自动验证与现有入口

- 资源helper：实际fixture涵盖多文档类型、不同哈希/缺文件、symlink越界、语言保留/缺必需资源、可选CFBundleLocalizations、重跑幂等；未知资源输入必须在写入前失败。
- 真宿主fixture：普通命令/文档/状态栏、稳定chat/lm/MCP、local accessInfo、provider零回调、never-fired Event、dispose重复调用、invokeTool异步reject、Webview双向消息；不是仅在Node中mock一个API对象。
- fixture 的 package.json 提供 main/activationEvents 与测试命令，run.js 导出 CommonJS `run(): Promise<void>`，使用内置 node:assert，断言失败 reject 并使宿主退出非零；已有 extHostExtensionService._doHandleExtensionTests 支持此契约。用构建后实际 CLI 运行 `"$LEAN_APP_CLI" --user-data-dir "$LEAN_TEST_PROFILE" --extensions-dir "$LEAN_TEST_EXTENSIONS" --extensionDevelopmentPath "$LEAN_FIXTURE_DIR" --extensionTestsPath "$LEAN_FIXTURE_DIR/run.js" "$LEAN_TEST_WORKSPACE"`；这些变量分别为实际 app CLI、独立临时 profile/extensions/workspace 与新增 fixture 的绝对路径。另用仅测试用 enabledApiProposals/CLI 授权验证退休接口始终 unavailable、不相关 proposal 未被批量禁用；不将 fixture 授权写进产品 allowlist。
- 窗口恢复测试覆盖 `[退休,A,B]` 的 MRU/active、退休 preview、连续多个退休 sticky、全部退休、完全无退休五类；映射修复不改无缺失状态的恢复行为，并在旧profile副本实机核验。
- `dev/smoke.sh` 的Chat“disableAIFeatures默认true”以及“chat.* ≤10”旧成功条件替换为运行移除证据和设置0；MXC“仅arm64存在”替换为包及unpacked缺失。源码被删除不能当作skip成功。
- 继续保留远程/调试/Notebook/Copilot的既有负向断言、telemetry设置保留和搜索rg断言；新增browser、MCP、speech、localTranscription及native资源检查，不删整个阶段绕过旧断言。
- 清查旧smoke对终端焦点的已知失败记录（lean-dist M6）。实施期先重跑当前脚本；若仍失败，定位脚本/产品根因后修复，不能以“环境级失败”或skip记成完整通过。
- 运行：`python3 dev/test_prune_macos_resources.py`（★新增）；`./dev/smoke.sh --app <实际产物> --skip-ui`用于CI静态/CLI，完整 `./dev/smoke.sh --app <实际产物>`用于实机。路径和测试app由构建产物推导；SKIP不能代替最终UI验收。

### 9.3 真实macOS回归

使用独立user-data/extensions/workspace目录：

1. 冷启动、Reload Window；查看main/shared/renderer/extension-host logs，无Unknown service、Missing proxy、customer初始化异常。
2. 运行V7全部保留路径；认证用隔离测试provider验证，不读取真实账户token。终端和task都以文件落盘证明执行。
3. ordinary Webview与Markdown点HTTP(S)/localhost、127.0.0.1、[::1]、0.0.0.0和带编码字符的URL；外部浏览器收到原地址，应用内不生成Browser tab。
4. 英文、简体、繁体工作台+原生资源验证；另以隔离macOS语言偏好/测试账户验证非支持系统语言的原生fallback。改变 --locale只验证workbench，不改变真实用户全局偏好来测试。
5. 图表矩阵和普通独立Mermaid editor；导入旧profile副本验证恢复、旧opener设置和普通账户/扩展状态。
6. 命令/设置注册直接枚举与菜单/快捷键检查结合，抓取服务删除后没有残留后台/模型下载的证据。

### 9.4 静态、编译、构建与分发

- `jq empty product.json patches/light/prune.json`；对每个新/变更JSON同样检查。shell修改 `bash -n`，workflow修改按现有actionlint规则验证。
- 临时隔离源码上依照prepare_vscode.sh真实顺序应用JSON/patch/platform/prune，不能只对最后一个补丁git apply --check。用户现有生成树不git reset、不覆盖。
- vscode树：`node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`；各服务/API切片完成后跑全图，M8再跑完整 `npm run compile` 与 `./dev/run-build.sh` 等价干净全构建。只跑tsgo不能替代最终打包。
- 同构基线/最终在同一Node、Electron、CI=true、arch和压缩/签名条件构建；检查npm production graph，并解析asar目录及实际文件，而非对lock或压缩binary简单grep。
- 所有资源删除发生在签名前；通过现有macOS流水线做codesign严格校验、spctl、公证、stapler，验证两种arch现有CI构建。Linux/Windows仅受影响的通用编译/构建能力保持，不扩大实机验收。

## 10. 里程碑（每步可独立验收）

| # | 里程碑 | 前置依赖 | 内容与并行边界 | 验证/退出条件 |
| --- | --- | --- | --- | --- |
| M1 | 基线、删除闭包和契约冻结 | 无 | 集成人隔离重放并固定基线、旧profile/运行注册；只读consumer检查与验收fixture设计可并行；冻结§4.1、输入/删除/保留清单 | 同条件基线有来源与体积；保留路径和smoke现状实测；每条入边有处置/验收，记录明确未知并收口后才开依赖任务；回写「实施进度」 |
| M2 | 图标、Codicons、locale资源整理 | M1 | helper/fixture worker与Codicons独立patch worker可并行；build.sh和CI入口由集成人单写；只在未签名输出操作 | V1/V2/V4/V8资源项通过；真实原生fallback已验证；新构建静态/CLI绿；回写「实施进度」 |
| M3 | Mermaid压缩与Chat适配拆分 | M1 | 独立扩展目录/新patch，可与M2/M4的独立API文件任务并行；使用私有outputRoot，不共享extension输出 | V3通过；普通openInEditor命令仍在；chat index/renderer/tool与manifest已解绑；全图检查无新增错误；回写「实施进度」 |
| M4 | 无能力API与普通消费者解绑 | M1 | API worker、terminal/tasks worker、其余保留消费者worker按冻结文件表并行；窗口恢复通用映射与回归独立文件可委派；工厂/protocol/common入口/product/锁由集成人拥有，编译与patch生成串行 | §4.1真实宿主fixture通过；剩余RPC全量校验有效；普通保留功能、退休serializer混合状态单测通过，无以空服务保留AI运行链；回写「实施进度」 |
| M5 | 内置浏览器及Playwright运行链摘除 | M4 | 一名worker负责BrowserView/Simple Browser专属目录；保留auth/app/entry/checker等共享文件由集成人集成；与M6因服务/入口耦合串行 | V5/V9浏览器项通过；全图typecheck和普通宿主启动通过；Webview/HTML编辑/外链/profiling保留；回写「实施进度」 |
| M6 | Chat/MCP/语音服务和CLI摘除 | M3、M4、M5 | 服务域内已独立文件可委派；main/shared/CLI/入口/prune由集成人单写；先撤注册/IPC，再源码闭包 | V6服务、旧CLI拒绝及V7保留面通过；MCP/语音/agent后台和下载入口无；全图typecheck通过；回写「实施进度」 |
| M7 | 生产依赖与构建/复制闭包 | M5、M6 | 集成人单写root/remote manifests、locks、生产构建配置与copy规则；专属元数据清理可委派只改独立补丁候选 | V8生产图/asar/普通copy无专属包；tsgo绿；无prune重叠、无坏build入口；实际安装字节账落盘；回写「实施进度」 |
| M8 | 集成、实机、分发和文档交付 | M2、M3、M4、M5、M6、M7 | 集成人做干净重放/构建/签名及单一GUI会话；文档worker并行独立文档，版本/记录/最终结论集成人统一 | V1–V10全部通过；完整compile/build/smoke与现有macOS CI绿；签名/公证/staple和ZIP通过；README/兼容/语言/迁移/图标文档准确、实测账完整；回写「实施进度」 |

执行编排：M1后M2、M3和M4的已冻结独立任务可以同时开始；M5→M6→M7因后台服务/协议/编译依赖保持顺序。不是按编号把所有任务串行，也不允许仅因目录不同就并行改共享契约。

集成人单写的共享面包括workbench.common/desktop/web入口、app.ts、sharedProcessMain.ts、API factory/protocol、根product/prepare脚本、build/gulp/filters/npm dirs、prune、lock、smoke及计划。worker对这些文件给精确patch候选/建议，由集成人应用；同一文件不同时存在两个写手。使用隔离worktree/源码树或明确互不相交的文件范围；vscode生成树的patch生成、完整compile/build、同一个GUI与profile资源串行。Mermaid测量用私有outputRoot；不同fixture使用独立临时profile和扩展目录。

M8同步文档：README.md、docs/extensions-compatibility.md、docs/vslight-icons.md、docs/vslight-release.md、docs/usage.md、docs/vslight-migration.md及发布说明。旧lean-dist记录保留其历史事实，本计划注明已覆盖其Chat本体/Playwright保留决议，不把历史记录改成当时就已摘除。

## 11. 风险、开放问题与就绪状态

| 项目 | 影响 | 责任人/解除办法 | 最晚确认点 | 是否设计阻塞 |
| --- | --- | --- | --- | --- |
| 高耦合入边多于具名清单 | 实施工作量、普通功能正确性 | 集成人M1清单冻结，全图编译逐层闭包；不改变已定产品边界 | M4前 | 否，已定义确定的处理规则和强门 |
| Mermaid现有压缩估计并非源码产物 | 渲染与收益 | M3实际源码构建和图表矩阵，失败修复压缩兼容而不砍图类型 | M3退出 | 否 |
| 旧窗口跳过serializer后的索引风险，尚无实机结果 | 用户升级 | M1混合state fixture；M4修通用映射，M5/M6用旧profile验收 | M5/M6退出前 | 否，映射、fallback和保留用户数据契约已定 |
| 历史smoke终端焦点失败 | 完整实机门 | M1重跑并定位；失败时对应里程碑不能记完成 | M8退出前 | 否，属于验证工具/产品缺陷处理 |
| 原生非支持语言fallback | 原生UX | M2隔离系统偏好实机验证，禁止假用--locale代替 | M2退出 | 否，英文回退契约已定 |
| 跨平台编译/生产配置引用 | Linux/Windows可构建性 | 清理通用构建声明，现有macOS x64 CI及必要平台最低验证 | M8 | 否 |

最终状态：**Ready**。六项需求已纳入终局范围；此前“保留Chat实现、保留运行Playwright”的决议被本次用户要求覆盖。稳定API、语言范围、用户数据与测试工具边界已明确，无需再次向用户确认同一删除意图。当前尚未实施，真实构建和UI结果没有预填为通过。

## 12. 已知坑与历史教训

- 旧lean-dist ADR-1保留Chat本体，不能沿用其“disableAIFeatures=true即完成”的口径；本次用户明确要求移除，以服务/API/IPC/依赖的终局标准验收。
- dev/smoke.sh 原先要求MXC存在，只改代码不改配套断言会使验收自相矛盾；替换语义但保留其余有效检查。
- utils.sh 路径缺失exit4；把目录父路径和历史逐子文件删除放在同一prune队列会炸，必须规范化不重叠清单。
- root product的jq merge不删除键；只删根配置仍可能被上游重新供应，要对生成结果精确过滤。
- 只去import会留下资源copy/entry/manifest；95号welcome媒体和101号notebook教训同样适用于browser preload与Mermaid chat入口。
- actor缺失影响普通扩展，不是可被UI隐藏掩盖的AI错误；保持两侧protocol和assert一致，不能关闭整套RPC完整性检查。
- codeServer/next/web入口虽然不是当前发行物，源文件仍在检查范围；不能物理删agentHost/localTranscription却保留它们的构建引用。
- Browser API仅proposed，Chat/LM/MCP却有稳定声明；不能用一个“全部namespace undefined”方案处理两类契约。
- Mermaid目录名chat-webview-out含普通editor资产；markdown-math/notebook-out的CSS仍被普通Markdown引用，同样不能按名字批量删。
- `base/parts/sandbox` 是Electron基础设施，`platform/sandbox`是本次AI辅助域；搜索到sandbox不能整库删除。
- asar header包含unpacked逻辑长度，standalone还可能有额外真实副本；计量按实际文件一次求和，不把元数据与解包目录重复叠加。
- gulp-electron会把应用图标重命名；把所有doc icon指向源码code.icns并不会实现发行物只有一份，最终plist和文件必须共同整理。
- macOS的src/main.ts明确避免--lang；原生语言与工作台语言验收不能混用。
- 不能把历史48/49 smoke算成这次通过；新验收必须完成终端执行与完整保留面，失败如实回写。

## 13. 需求 → 设计 → 验证映射

| ID | 需求/约束 | 设计落点 | 验证 | 结果 |
| --- | --- | --- | --- | --- |
| R-1 | 图标合并 | D2、§5.1、M2 | V1 | 覆盖 |
| R-2 | Mermaid压缩 | D6、§5.3、M3 | V3 | 覆盖 |
| R-3 | Codicons开发资源 | §5.2、M2 | V2 | 覆盖 |
| R-4 | 原生中英文 | ADR-3、§5.1、M2 | V4 | 覆盖 |
| R-5 | 浏览器/运行Playwright移除 | ADR-2、§5.5、M5/M7 | V5/V8 | 覆盖 |
| R-6 | Chat/MCP/语音服务移除 | ADR-1、§4.1、§5.4/5.6/5.7、M4/M6/M7 | V6/V8/V9 | 覆盖 |
| NFR-1 | 实测瘦身 | §1.1、§7、M8 | V10 | 覆盖 |
| NFR-2 | 保留功能可靠 | §2/4/6、M1/M4/M8 | V7 | 覆盖 |
| NFR-3 | 可重放和图一致 | §5.7/9.4、M7/M8 | V8 | 覆盖 |
| NFR-4 | 稳定接口/用户数据 | §3/4.1、M4/M8 | V6/V9 | 覆盖 |
| NFR-5 | 运行时/分发兼容 | §7/8/9.4、M8 | V10 | 覆盖 |
| C-1 | prune时序与缺失失败 | §5.7/12 | 重叠与缺失注入、完整重放 | 覆盖 |
| C-2 | 签名前整理 | §5.1/8 | V1/V4/V10 | 覆盖 |
| C-3 | 全图与RPC完整性 | §5.4/9.4 | V6/V8 | 覆盖 |
| C-4 | 共享基础设施保留 | §0.5/2/5.5/5.7 | V7 | 覆盖 |
| — | 不在本期 | §0.5 | 不扩大发布/第三方/数据清理/开发工具范围 | 排除 |
