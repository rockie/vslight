# M4/M6 · AI 统计状态栏与剩余入口清理

145 撤下 AI 统计状态栏、无保留消费者的 `_aiEdits` 注册、Copilot 专属问卷，以及 Agents Markdown 专属设置。普通 EditTracking、`IAiEditTelemetryService`、第三方 inline provider 的权限与遥测保持。候选源码、实际模块红绿和全图 noEmit 已通过；最终应用的 fresh profile 运行验收由主线程执行。

## 红证据和根因

正式138的已加载运行对象有 `editor.aiStats.enabled`、`workbench.editor.markdownDefaultEditorInAgentsWindow`、三项专属无障碍设置、三个 `_aiEdits` 命令及两个 Copilot 问卷命令。来源为主PID6084、隔离 profile `/private/tmp/ordinary138b-3n3pk6ty/u`，捕获于2026-10-01T15:47:44.377Z。已加载 main 与实际 app 磁盘 SHA256 均为 `ad53b5cb14fe1142dfc0f8ba0a048971f59b41c350a59b499e1f40df049d95e9`；完整证据见 [M6-runtime-registries.json](M6-runtime-registries.json)。旧探针的 serializer 日志污染仍按原记录保留，不能据此宣称 clean logs。

在冻结144源码中，`EditTelemetryContribution` 的独立 autorun 仍读取 AI 统计设置并实例化 AiStatsFeature，其闭包创建 `aiStatsStatusBar`、图表与样式。schema 默认 false 只能避免默认显示，不能证明实现已移除。另一个 autorun 读取 `git.addAICoAuthor`；143后 Git 的实际配置与消费者已经删除，剩下 fallback 注册、AiContributionFeature 和专属测试。全量保留源码及内置扩展搜索未找到其他 `_aiEdits` 调用。

Copilot 问卷虽然使用通用 Survey 名称，但唯一已注册表单为 `CopilotPMFSurvey`。普通 NPS 和语言问卷走独立路径，不依赖该编辑器。Agents Markdown 专属设置则被 DynamicEditorConfigurations 读取并监听；旧值会触发动态配置重新注册。

## 最终候选与 prune

[145-light-ai-stats-survey.patch](../../../patches/145-light-ai-stats-survey.patch) 修改9文件，增加9行、删除122行。冻结 SHA256：`0c42782251c11f610b5c39046a882758f06af012b7b54ef03050226266af3826`。完整144私有后态 `git apply --check` exit0。私有根由 `/tmp/lean-ai-stats145-path` 指向；本轮没有改共享集成源、API 工厂、权限契约、prune、产品元数据或用户生成树。

| 文件（vscode/ 指私有快照中的目录） | 处理 |
| --- | --- |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/editTelemetryContribution.ts` | 撤 AIStats/AI署名 autorun、三个 fallback 命令及未用 import；保留普通 workspace、annotated documents 和 tracking autorun |
| `vscode/src/vs/workbench/contrib/editTelemetry/browser/editTelemetry.contribution.ts`、`vscode/src/vs/workbench/contrib/editTelemetry/browser/settingIds.ts` | 撤 AI统计 schema/常量；保留四项普通编辑遥测设置与两项 singleton 注册 |
| `vscode/src/vs/workbench/services/editor/common/editorResolverService.ts` | 撤专属 MarkdownAgents schema/导出 helper；普通编辑关联设置保持，纯数据 Agents override 使用原静态默认值 |
| `vscode/src/vs/workbench/browser/parts/editor/editorConfiguration.ts` | 撤专属配置读取/监听与无其他用途的配置服务 DI；普通动态编辑器配置仍可更新 |
| `vscode/src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts` | 撤 SessionsChanges、Survey、Automations 的专属 enum/schema；普通 verbosity 设置保持 |
| `vscode/src/vs/workbench/workbench.desktop.main.ts`、`vscode/src/vs/workbench/workbench.web.main.ts` | 撤 Copilot 问卷贡献导入与悬空注释；普通 NPS/languageSurveys 导入保持 |
| `vscode/src/vs/workbench/services/editor/test/browser/editorResolverService.test.ts` | 仅撤专属 Agents 默认 helper 测试，普通 resolver 测试保留 |

主线程将11个物理文件归一为8条 prune，清单逐项保存在 [M4-ai-stats.json](M4-ai-stats.json)：`vscode/src/vs/workbench/contrib/editTelemetry/browser/editStats` 整目录的四个文件；AiContributionFeature 及其专属测试；Copilot survey 的贡献、输入、pane、questions 与样式五文件。私有验证已物理删除这些文件。补丁不重复拥有 prune 删除动作，不删除普通 source tracker、遥测实现、coauthor 解析或第三方 provider。

## 实际模块回归

| 验证 | 结果与边界 |
| --- | --- |
| 完整 EditTelemetryContribution 和注册模块红绿 | 6case PASS。旧配置 stats=true/coauthor=all 在改动前实例化专属 feature；改动后无读取、实例化或三个命令注册。普通 usage tracking 与 telemetry-off 行为保持 |
| 实际配置注册与 DynamicEditorConfigurations 红绿 | 2case PASS。5项专属 schema 和两个问卷命令撤下；旧 MarkdownAgents 读取由2次变0、订阅由1次变0；11项普通 verbosity、普通编辑关联和两个普通 survey 模块保持 |
| Copilot 程序命令红证据 | 改动前实际 command handler 创建 `copilot-pmf` 输入；改动后无注册、无该 UI 闭包输入 |
| 普通 MainThread/ExtHost inline 双侧 | 授权/未授权两轮 PASS；173 runtime inputs，普通 provider 提供 TAIL DTO、shown callback 保持权限、遥测各1次、幂等 dispose 各1次；两个 unification API 保持原权限检查后 unavailable |
| 全源码 native noEmit | `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit` exit0，日志0 bytes；11个 prune 文件均已缺席，未调整编译范围或 actor 校验 |

回归执行整个实际贡献/配置/语言功能模块。贡献测试替换六个 feature 构造器为 disposable 边界；配置测试替换 survey pane 和浏览器 pane registry，并禁止音频 DOM listener 执行。普通 inline 测试对普通 telemetry 服务使用 spy。它们证明注册、调用与权限路线，不能代替最终 Electron UI、实际 extension host 和 focus 验收。结果及边界完整保存在 [M4-ai-stats.json](M4-ai-stats.json)。最后两处注释/空白收尾按主线程要求完成，未改变上述行为。

## 一次性运行快照审计及保留例外

对实际138完整注册表扫描得到73项含候选文本/元数据的 settings、1项 excluded setting、7个 commands、3项 command metadata、2项 keybindings 和69个 MenuId。JSON逐项分类，未按 AI 名字删除普通能力。

- 15个真实 Chat/InlineChat menu items由142处理；58个匹配的空 MenuId仅为标识常量。普通扩展市场 AI/Chat 分类保留，支持第三方扩展发现。
- 48项普通 setting及1项 excluded setting携带 `agentsWindow` 纯覆盖数据。保留源码对该贡献字段的读取只有既有 proposal 权限校验与拒绝删除；没有窗口或配置服务应用 default/readOnly。配置类型、普通 schema 与既有权限契约按主线程明确指示保留。
- Preferences 的 `isAgentsWindowReadOnly` 只初始化为 false，未找到 true 写入；7处控件读取和2处指示文本读取不能由这些 schema 元数据触发。`override:agentsWindow` 只余查询解析，无 tag 生产者。IssueSource 的旧枚举呈现分支保留，但实际 source picker只有普通产品、扩展和市场，非法旧预设会重置。
- 三项普通 HTTP proxy 设置的 `agentHost` 同步注解只有 schema 数据；扩展贡献入口明确拒绝该字段，没有运行同步消费者。
- 终端第三方 agent CLI 标题/粘性滚动兼容、共享 Codicon enum、Markdown的 prompt/instructions/chatagent/skill 文件编辑保留。`terminal.ansiMagenta` 是关键词误匹配；普通 NPS/language survey 保持。
- 普通 IAiEditTelemetry 的延迟 singleton 与普通 `editTelemetry` 状态栏保留。旧138探针未枚举实际状态栏 model集合，因此没有“所有状态栏为零”的结论。
- 两项可见说明仍需精确收尾：Modern UI 的 Agents设计比较句，以及 Mermaid manifest 的 built-in chats 说明。主线程已分配146处理，145保持冻结。冻结144私有 product 已无 `voiceWsUrl`；AI名字的第三方 proposal allowlist/空数组仍属兼容数据，不能据此认定有 host 实现。

完整 consumer 搜索、实际 setting overrides、各项保留理由与146候选均保存在 [M4-ai-stats.json](M4-ai-stats.json)，最终运行快照需要沿用同样分类。

## 状态栏 helper 与最终复验

[registry.mjs](../../../dev/test-fixtures/lean-core/registry.mjs) 已增加既有 StatusbarViewModel 的 own-data 枚举，SHA256为 `395788450e022269a1bd03356536d57ff186a5de61b3758351cbb0babad98f05`。仅从已加载 main Module scope定位类，并同时校验 prototype方法与 own `HIDDEN_ENTRIES_KEY`；随后 query既有实例，读取 own `_entries` 和 entry的 id/extensionId/alignment。entry ID缺少 own string时失败。不会读取名字、tooltip、command、DOM或 getter；结果写入 statusbars.json及总数。

完整实际 StatusbarViewModel 模块和 helper 原函数的独立回归 PASS：1 model/1普通 entry，getter读取0、RPC调用0。missingPID、wrongport、stale6084三种前置检查均 exit1，网络尝试0、输出目录未创建；实际 ContextKey表达式仍可序列化。前置 expected-app/PID/profile/port与 listener身份检查仍在任何 fetch/CDP/Runtime之前。此轮未接触19480认证会话。

[TODO] 主线程在最终145+146 fresh profile预写 `editor.aiStats.enabled=true` 和 `git.addAICoAuthor=all`，Cold与一次Reload后直接枚举所有注册表、既有状态栏 model及服务集合；确认五项专属 schema、五个命令、AI统计状态栏与专属闭包缺席，同时普通 Welcome、编辑/终端无障碍、inline provider和遥测保持，日志无异常。必须用完整权威身份参数运行 helper，不能复用旧污染 profile，也不能用默认false的隐藏状态作退出证据。main/shared channel图与整段后台进程门仍需独立补齐。
