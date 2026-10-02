# M6：145+146 冷启动与普通 Welcome 注册表审计

145+146 的真实应用已撤掉 144/145 对应的 AI 运行入口；但整个退休范围的负向门仍为 **RED**。本次发现 9 个 Notebook/Debug 专属设置、NPM Debug 的消费者与菜单、Notebook 菜单/字段，以及自动锁定编辑器组中的 Interactive Window 选项。147 和 149 已提供源码候选及红绿证据；本记录不把候选结果记成最终应用通过。

本 agent 仅离线读取主线程生成的两个不可变快照，没有访问 CDP、运行 UI 指令、调用 `di.get` 或修改快照。完整逐项分类、来源、原始文件 SHA、动态候选、例外和限制保存在 [M6-runtime145-cold.json](M6-runtime145-cold.json)。

## 实际应用与捕获范围

应用为主线程完整构建的 145+146；目录名字沿用 `lean-core-build144-lcib7zyk`，不能据目录名把它当 144。两个快照的 main PID 均为 27483，renderer 端口为 19500，profile 为 `/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/u`。

- cold：`2026-10-01T17:11:41.325Z`，该 root 下的 `registries-cold`。
- Welcome：`2026-10-01T17:18:24.819Z`，该 root 下的 `registries-welcome`。主线程通过普通 `openWalkthrough` fixture 打开后捕获。
- 捕获前后均核对 PID、真实 executable/profile、端口及 loopback listener 归属。实际加载 main 与磁盘 SHA 均为 `4d8b395feacab225a3ad8fc8711d15545337f93d4d5ab18720fd89e274a50a1a`。
- helper 取已加载 main 的 module scope，对对象原型和注册表身份交叉验证；缓存同 URL import 新增模块数为 0，没有执行 main。状态栏仅读取已存在模型的 own data descriptors；不读 tooltip/command/getter，不对 RPC proxy 取 getter 或调用方法。
- helper 为 [registry.mjs](../../../dev/test-fixtures/lean-core/registry.mjs)，SHA `395788450e022269a1bd03356536d57ff186a5de61b3758351cbb0babad98f05`。其 PID/profile/port 前置失败和 proxy/getter 回归见 [M4-ai-stats.json](M4-ai-stats.json)。

| 实际集合 | cold | Welcome |
|---|---:|---:|
| CommandsRegistry handlers | 2158 | 2147 |
| Command metadata | 892 | 892 |
| settings / excluded settings | 1574 / 10 | 1574 / 10 |
| default keybindings | 975 | 975 |
| MenuId / 有 items 的 MenuId / items | 286 / 138 / 2423 | 286 / 138 / 2413 |
| containers / views | 9 / 39 | 9 / 39 |
| viewsWelcome IDs / entries | 4 / 32 | 4 / 32 |
| singleton descriptors / renderer DI entries | 247 / 267 | 247 / 267 |
| 实际状态栏 models / entries | 1 / 10 | 1 / 4 |
| 实际 walkthrough instances / steps | 0 / 0 | 1 / 30 |
| command links / missing / retired links | 41 / 0 / 0 | 74 / 2 / 0 |

cold 的 walkthrough 服务只有 descriptor，尚未实例化。Welcome 捕获补足实际服务、4 个类别和 30 个步骤，不能用 cold 的 0 步骤证明 Welcome 已清理。

## AI、agent、Chat、voice 窄匹配的逐项分类

两个快照窄匹配一致；JSON 保留每项 index、原始 item SHA、菜单中的匹配 items 及分类原因。

| 集合 | 匹配 | 结论 |
|---|---:|---|
| command handler | 1 | `extensions.actions.searchByCategory.Chat` 是普通 marketplace 分类查询，保留第三方兼容 |
| command metadata / keybindings | 2 / 2 | Markdown 普通插入链接、图片及预览；prompt/instructions/chatagent/skill 是普通文件语法 |
| settings | 11 | 3 个 HTTP proxy 的纯 `agentHost` annotation、7 个终端 profile/icon 的共享 Codicon enum、1 个 `[chatagent]` 语言 override |
| configurations | 4 | 上述 HTTP、终端、默认语言配置的聚合重复视图 |
| menus | 63 | 56 个空共享 MenuId 标识；7 个普通菜单含上述文件语法、负向兼容 guard、marketplace 分类或 Update 条件 |
| singleton | 1 | `aiEditTelemetryService` 为普通第三方 inline completion/source tracking 共用遥测，保留 |
| containers / views / viewsWelcome / statusbars | 0 | 未发现窄匹配退休运行入口 |

41 项普通 schema 的 `agentsWindow` 元数据及通用 contribution 字段按明确例外保留，实际 read 消费者清单见 [M4-ai-stats.json](M4-ai-stats.json)。保留源码无 Agents 配置服务/窗口 producer；扩展校验会拒绝并删除不支持的外来 metadata。HTTP 三个 annotation 同样没有保留同步消费者。

普通终端 `terminal.integrated.tabs.allowAgentCliTitle` 控制第三方 CLI 的 escape-sequence 标题，保留 reader 为 `vscode/src/vs/workbench/contrib/terminal/browser/terminalInstance.ts`，不会启动内置 agent。Update 菜单中的 `updateTitleBarChatRequestInProgress` 为 false 默认负向条件，保留源码只有通用定义及普通 Update 条件，没有 Chat writer。上述例外没有被当作“匹配词为零”。

profile 明确设置 `editor.aiStats.enabled=true`、`git.addAICoAuthor=all`。cold 的 10 个状态栏实际 ID 是 SCM 2 项、Problems、selection、indentation、encoding、EOL、languageStatus、mode、notifications；Welcome 剩 4 个普通项。两次均无 AI stats 项，因此不是以默认 false 隐藏状态作为证据。

## 退休 ID 全集与动态项

只读原始 upstream 源码的 TypeScript AST 用于生成候选来源，实际注册表证据来自上述真实快照。没有导入原始产品模块来冒充运行注册表。

252 个 prune 路径中，解析了 2283 个退休生产 TS 文件；保留 1737 条 command/静态 ID 来源、387 条 schema 来源。imports、re-export、const、enum、模板及 static ID 解析后，手工补齐有限 helper 参数，得到 1375 个 command/类 ID 候选和 336 个 setting 候选。960 是注册形状候选数，含不能仅凭 `super({id})` 判定为 Action2 的输入；不会把这个数声称为 960 个已确认命令。

- 固定候选在 Command handlers、metadata、menu command/alt、keybindings、解析后的 command links 和 `onCommand` completion events 中没有退休命中。3 个命中是退休源码引用的普通 `quickOpen`、`quickOpenWithModes`、`closeModalEditor`，逐项保留。
- 全 scalar 比对还命中空字符串、error/notebook/scope/variable 的非命令类/日志/语法值，以及 `workbench.input.interactive` 编辑器类 ID。前 5 项不是命令；最后一项确有设置 metadata 残留，已单独交 149。
- 57 条仍不能由一般 AST 常量解析的表达式全部逐项记为：25 动态命令族、9 有限 helper、2 固定 global setting、2 product key、1 embedder input、16 个嵌套 JSON/manifest schema 字段、2 MCP request 命令。每项记录实际定义/参数来源、精确 prefix 或固定 IDs、生产文件物理 absent 及快照比对。
- `_configureToolSetTools/UUID` 与 `_configure/UUID` 使用源定义的精确 prefix；MCP `Access` 后缀碰到普通 setting/view context 名时记作非 command 碰撞，没有误删普通认证或扩展命名空间。
- product/embedder 任意输入不能穷举为固定 ID 黑名单，其结论限于 producer absent 与当前捕获图。原始生成树已有 11 个 prune 路径不存在，JSON 明列；这不是这些缺失扩展 manifest 的完整内容审计。

## 普通 Welcome 与链接例外

实际类别为 Setup（true）、SetupWeb（false）、SetupAccessibility（screen reader 条件）、Beginner（true）。无内置 AI walkthrough 步骤；普通 editor/terminal/comment 无障碍帮助和 settings/extensions/editor/terminal/SCM/tasks/shortcuts/trust 步骤保留。

两个 missing links 都在当前原生 macOS 不展示的普通 SetupWeb 类别：`workbench.action.toggleMenuBar` 的 menuBarWeb 步骤 when 也是 false；`remoteHub.openRepository` 是可选 RemoteHub 扩展链接。不是 `toSide:` 误解析，也不是退休 Chat/browser 链接。Quick Open、Settings、Keybindings、Trust 的 `toSide:` 链接已正确剥除路由前缀并命中注册命令。没有据此修改产品。

## 实际红项与后续门

9 个真实 settings 残留是 notebook.codeActionsOnSave、search.experimental.closedNotebookRichContentResults、accessibility.verbosity.notebook/debug、accessibility.signals.lineHasBreakpoint/onDebugBreak/notebookCellCompleted/notebookCellFailed、accessibility.debugWatchVariableAnnouncements。

147 同时收口 NPM Debug tree/hover/CodeLens/JS-debug 消费链及 manifests、3 条 Notebook Breadcrumbs 菜单、Notebook language hint 字段、Mermaid 的两个 Notebook 正分支和精确死帮助文字。149 收口 autoLockGroups 中 Interactive Window 的 property/default。源码红绿及完整 noEmit 见 [M4-retired-settings.md](M4-retired-settings.md)，最终正式应用仍须由主线程重捕。

renderer 的 267 个 own service IDs 无 Chat/MCP/speech/browser/agentHost/agentSessions/unification 名称命中。4 个现有 channel servers 的通道仅为普通 sync/recommendation、watcher、remoteResource/url；pending channel/request 为 0。进程树保存在 JSON。不能从 renderer 数据推导所有 main/shared-process service/channel maps 都已验证。

两份快照复制的 19 个日志文件，helper 窄 pattern 及独立 `[error]`、`[critical]`、Unhandled、`Method not found: serialize` 扫描均零命中。此结论只覆盖两个捕获时间窗；不是最终 Reload/完整 UI/auth/CI 的替代证据，也不复用曾被旧 138 探针污染的日志。
