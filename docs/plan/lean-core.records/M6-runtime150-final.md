# M6/V5/V6 · final150 真实注册实体与快捷键审计

计划：[lean-core.md](../lean-core.md) §5.4、§9.2/9.3、V5/V6/V7/V9。最近更新：2026-10-02 18:28 +1000。代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，114–139/141–150、254 prune。状态：**当前注册实体与快捷键负向子门通过；存在24项终端skip-shell死引用的元数据限制，完整native菜单与真实退出重启仍待验。** 本记录不宣称M6/M8或本地整体完成。

[完整离线评估JSON](M6-runtime150-final.json)含逐项快照hash、来源分类、57动态producer、普通例外实际item/hash、九schema精确断言、日志逐行分类、13查询及公共账户before结果。本agent只读落盘证据并写本记录/JSON及自己的最终覆盖审计；没有启动GUI、连接CDP、重新执行registry、发送requests、碰外链工具或进程、改计划/代码/其他文档，没有smoke/CI/提交/发布。

## 真实身份与捕获范围

快照：[/private/tmp/lcfinal-chkarkup/ui/evidence/registry-active](/private/tmp/lcfinal-chkarkup/ui/evidence/registry-active)，捕获时间2026-10-02 08:17:44.776 UTC（18:17:44.776 +1000）。自有app `/private/tmp/lcfinal-chkarkup/VSLight.app`，main46653/host47396，profile为`ui/u`，CDP19560。主集成人实际helper执行exit0，本agent没有重复该执行。

authority-before/after精确相同，限定executable/profile/PID/parentPID/port与listener owner。实际loaded/disk workbench SHA均为`e31bba14f7e709bd2794f91e73ff3f12b3139df4dd7ecac7ed1cf9569e1f99c5`，本次离线重算与冻结build150产物相同；同URL import新增module0。helper为[registry.mjs](../../../dev/test-fixtures/lean-core/registry.mjs)，SHA`e59cc46c8fbf0e9e7ff0907d3702c901ab2d85c885eaf0407e32b45b63cde5fd`，与旧冻结helper一致。实际runtime对象方法/constructor/prototype由identity快照保留，未导入独立源码模拟注册实体。

这是一个普通操作后的**active renderer捕获**，不是一组新Cold/Reload/restart，也不包含main/shared进程完整DI/channel注册表。旧149 Cold/Welcome/Reload/main/shared证据保留原身份；本快照不把它们换标为150。

## 全部实际集合与退休比对

| 实际集合 | 150 active数量 | 退休命中/范围 |
| --- | ---: | --- |
| CommandsRegistry handlers / metadata | 2173 / 898 | 1375候选按普通例外分类后0；注册形状候选对应命令实体0 |
| settings / excluded / configuration nodes | 1571 / 10 / 120 | 336退休setting ID候选0；147九schema精确0 |
| default keybindings | 975 | 退休command ID0；普通Markdown两条绑定保留 |
| MenuId /有items的MenuId /items | 286 /134 /2409 | 实际command/alt退休0；Chat/AgentSession/Notebook/BrowserView/Speech/MCP/Dictation域实际items0，空共享MenuId不算运行贡献 |
| containers /views | 9 /39 | 窄退休匹配0，未把容器列表9个误当作只有9个view |
| viewsWelcome IDs /entries | 4 /32 | 退休viewsWelcome0，普通内容与command链接纳入扫描 |
| registry entries /singletons /renderer DI own entries | 29 /247 /267 | 退休名称0；普通aiEditTelemetryService singleton保留 |
| statusbar models /entries | 1 /8 | 退休ID0；Problems、selection、indentation、encoding、eol、languageStatus、mode、notifications |
| walkthrough instances /steps /command links | 1 /30 /74 | 退休steps/links/onCommand事件0；两个普通缺失link例外保持 |
| renderer ChannelServer instances | 3 | sync/recommendation、watcher、remoteResource/url；pending names0、active requests0 |

按[retired-provenance149.json](/private/tmp/lcfinal-chkarkup/ui/retired-provenance149.json)的1375命令候选、336设置、960注册形状候选重新比对全部当前handler/metadata/menu command与alt/default bindings/command links/walkthrough onCommand事件；960是调查超集，不声称每个super/static ID都是Action2。三个普通引用例外为closeModalEditor、quickOpen、quickOpenWithModes；精确scalar碰撞只有空字符串/error/notebook/variable等非command值，不能据此判退休服务存在。完整字符串scalar扫描不拆普通文字说明，所以另外核对下文skip-shell文本。

57动态/有限输入producer在冻结150保留源码全部物理absent，按来源语义对当前实际命令或setting surface比对，退休命中0。`Access$`只对MCP request命令surface应用；普通schema `extensions.experimental.issueQuickAccess`的同suffix另列碰撞，不能当退休MCP command。任意embedder/product输入依producer不存在证明，不能建立禁止普通第三方ID的通用黑名单。provenance源记录SHA与实际[M6-runtime145-cold.json](M6-runtime145-cold.json)相同，未改旧调查或当前快照。

147/149精确普通保留：13 verbosity、23 signals均在；languageDetectionHints只含untitledEditors；autoLockGroups无interactive property/default，11普通项保持；NPM schema open/run与普通Run hover保留，Debug handler/CodeLens schema无；Mermaid实际WebviewContext没有notebook.output正分支。

## 普通例外与元数据限制

窄匹配数量与实际分类：1个marketplace Chat category handler、2普通Markdown metadata、11普通schema、2Markdown bindings、63菜单聚合/共享空符号、1普通aiEditTelemetry singleton；containers/views/viewsWelcome/statusbar/walkthrough窄匹配0。63中56为空MenuId，7为普通聚合菜单，不能把聚合菜单中一个普通文本匹配判成整个菜单退休。当前direct schema有40个agentsWindow override和3个HTTP agentHost inert annotation；不是40个agent服务。普通AI/Chat市场分类、Markdown grammar/图标enum、第三方opener/Webview及Developer诊断不因词名含browser/agent/Chat就被判退休。本捕获不证明全部Developer命令已在GUI点击。

新增broad项`workbench.action.output.show.textModelChanges`及Output channel selector的对应普通item，属于实际编辑活动后注册的Text Model Changes Reason日志出口。其余broad项依旧普通源码来源分类；每项当前hash、分类和原始快照位置在JSON，聚合菜单/配置不重复复制全量items，不只沿用旧计数。

**24条skip-shell死引用仍存在。** 当前`terminal.integrated.commandsToSkipShell.schema.markdownDescription`的Default Skipped Commands普通文本列表有14个Sessions/SessionsViewPane和10个Debug旧command名；冻结150的`src/vs/workbench/contrib/terminal/common/terminal.ts`仍有对应default skip-shell常量。该setting的用户default/defaultDefaultValue都是`[]`，这24项没有handler或command:链接，也没有恢复Chat/Browser/AI后台。

此项不推翻“当前退休注册实体0”，但意味着不能宣称全部生产元数据/常量对退休command的引用均清零。计划§5.4包括死项闭包，集成人须明确裁定并记录这些无实体skip常量/说明是否需清理；本agent不授权保留、不修改源码或重新打包。精确24个ID、实际schema文本hash及handler/link空集已在JSON单独记录，不以笼统普通例外掩盖。

## 实际Keyboard Shortcuts与账户before

[active-probe-summary](/private/tmp/lcfinal-chkarkup/ui/evidence/active-probe-summary.json)状态为`BEFORE_QUIT_PUBLIC_CHECKS_PASS`，只计退出前结果。13次均在自有实际Keyboard Shortcuts编辑器读DOM输入值/实际row，查询严格相等；正向`@command:editor.action.clipboardCopyAction`确有Copy一条，后12负向查询按实际command来源分类退休0。

chat宽搜有8条普通fuzzy结果（含marketplace Chat、Change/Transpose等），mcp有Markdown security/Merge Conflict两条，不能要求宽搜文本结果绝对0。speech/dictation/integrated browser/simple browser/agent sessions/playwright及四个精确`@command:`退休ID均0 row。首轮错误查询API与fuzzy-query红例由主线程保存，未覆盖为成功。

公共账户before：合成provider经public API注册、getAccounts返回Alpha/Beta，无explicit account的silent getSession选择Beta原session，token仅在fixture中比对、未返回其值，create/remove均0。globalState及历史/假凭据sentinels读回PASS；disabled fixture manifest在、hostVisible=false、activationMarker=false。**尚未quit/restart**，不能称账户偏好/disabled enablement已跨新host保持。

themeApplied状态仍为`THEME_API_PASS_RENDERER_COLORS_REQUIRE_CHECK`。旧摘要cssBefore的bodyClass/editorBackground是空字符串，来自错误documentElement选择器；不能计150实际CSS/视觉通过。主集成人正在限定自有renderer补实际workbench主题身份/五tokens/图像与disabled renderer列表，不修改这个旧摘要冒充旧执行。

## 日志和未完成项

只读本次捕获复制的32份文本日志，覆盖17:40首轮与17:45当前session；两份LevelDB binary不当文本日志读取。退休DI/actor/channel/model-download异常regex0、generic error/critical/Unhandled/serialize0、实际error级别0；**warning共7**：旧session4（synthetic provider未在manifest声明1、Git resource-scope2、backup tracker suspended settings事件1）；当前session3（同synthetic provider1、Git resource-scope2）。原行/时间/文件hash在JSON，不写日志全级别0，也不把历史attempt warning归为当前session新增。

helper profiler own state0/data null；只读现有状态，没有启动/停止profiling。renderer registry/snapshot不能替代完整自有PID **native AX菜单**：新AX helper还需用户系统辅助功能权限，未取得native tree全量结果；实际titlebar与后续退出重启也按主线程独立证据判断。本agent不退出仍由主线程持有的46653，不使用旧ready文件判断未来存活。

剩余：完整native菜单与titlebar收口、正常Quit→真实新进程的账户授权/偏好/主题实际CSS和disabled renderer状态、24死引用裁定、最终替代验收汇总；当前输入双archCI依仅本地限制仍未验。局部handler/schema/shortcut绿不能替代上述门或M6/M8退出条件。

## 151 后续限制

最近更新：2026-10-02 18:49 +1000。[151终端skip-shell补丁](M4-terminal-skip151.md)已按本记录的150真实捕获缺陷删除terminal.ts共同默认集合中24条退休debug/session ID。隔离真实源码载入168→144、退休24→0，schema同源文本恰好去掉24行，其余集合与字段保持；apply/reverse通过。本记录中的150原快照及24项限制保持历史事实，不改写为当时已清零。

151独立完整构建在 `/private/tmp/lean-core-build151-c480juxs` 进行中，全图typecheck/package/真实注册表/签名尚未通过；须冻结实际151workbench身份再捕获注册表和核对受影响终端controls，不能把当前150 active快照换标为151。150 app46653/host47396继续等待用户为codex CLI添加辅助功能权限；完整native菜单与实际普通quit/restart未齐，不由隔离源码或旧150证据补填通过。仅本地/no-smoke，不改TCC，不提交/推送/CI/发布，M6/M8仍未完成。
