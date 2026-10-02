# M6 · 151 独立注册表与终端 skip Set 审查

结论：**PASS，限实际 renderer 注册实体、普通注册对照及终端 skip Set 子门；actor/main/shared 的直接运行注册表覆盖有缺口。** 不宣称 M6/M8 或全部普通功能完成。主线程执行捕获；审查者只读文件，未启动 GUI、连接 CDP、调用服务、构建、运行或修改 smoke、提交、推送或运行 CI，只写本记录与[逐项审查 JSON](M6-runtime151-audit.json)。

## 身份与证据

三轮原证据均保留，按实捕时间审查，没有将首轮 task 红例改成成功：

| 捕获 | UTC | main PID | handlers | menu items | renderer channels |
| --- | --- | ---: | ---: | ---: | ---: |
| 首轮 task-red | 2026-10-02T10:21:13.608Z | 7097 | 2143 | 2401 | 3 |
| visible | 2026-10-02T10:47:05.806Z | 23860 | 2145 | 2402 | 4 |
| 最终 runtime | 2026-10-02T10:48:49.435Z | 25607 | 2145 | 2402 | 4 |

首轮目录 `/private/tmp/lcfinal-chkarkup/ui/attempt151-task-red/evidence/registry151-e412786b-556a-4565-aa2c-1ebdbcc75817`；visible 目录 `/private/tmp/lcfinal-chkarkup/ui/evidence151-visible/registry151-86633c86-df56-4820-be83-7f90865fbe42`；最终目录 `/private/tmp/lcfinal-chkarkup/ui/evidence151-runtime/registry151-2ba977e2-986a-44de-a601-1d87bb13d0f4`。各轮 before/after authority 精确相同，actual executable 为持久151 app：`/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app/Contents/MacOS/VSLight`，profile `/private/tmp/lcfinal-chkarkup/ui/u`，CDP 19560。每轮 identity loaded/disk、scripts 中实际已加载 ES module 与本次离线重算当前 app 文件 SHA-256 都是 `4c164bd9abb2d7c32913b942d0ee35fd60d6b572e4d1e9c1b69919f2877e8496`；同 URL cached import 新增 module 0。helper `dev/test-fixtures/lean-core/registry.mjs` 的 SHA `e59cc46c8fbf0e9e7ff0907d3702c901ab2d85c885eaf0407e32b45b63cde5fd` 与150一致。JSON 保存每个输入文件 hash、完整路径、捕获身份及逐项检查。

## 全量实体核对

最终实枚举 handlers/metadata 2145/898；settings/excluded/configurations 1571/10/120；bindings 975；MenuId/有items的MenuId/items 286/133/2402；containers/views 9/39；viewsWelcome IDs/entries 4/32；registry entries/singletons/renderer DI own entries 29/247/267；walkthrough instances/steps/command links 1/30/74。

按原 provenance `/private/tmp/lcfinal-chkarkup/ui/retired-provenance149.json` 的1375命令、336设置、960注册形状调查候选逐项比对 handlers、metadata、menu command/alt、default bindings、command links 和 walkthrough onCommand事件，退休命中均0；原provenance hash及源 M6-runtime145-cold.json hash核验一致。960为调查超集，不当作960个实际Action2。closeModalEditor、quickOpen、quickOpenWithModes仍为普通来源例外；scalar碰撞仅空字符串/error/notebook/variable等已分类非命令值。

57动态/有限输入producer在冻结151源码全部物理不存在，按来源语义核对实际命令/设置surface，退休命中0。MCP `Access$`仅对请求command surface应用；普通 issueQuickAccess setting 名称碰撞不判退休。任意embedder/product输入按producer不存在证明，未构造禁止第三方普通ID的黑名单。

narrowCounts只是调查入口：1市场Chat分类handler、2普通Markdown metadata、11普通schema、2Markdown bindings、63菜单聚合或共享符号、1普通aiEditTelemetry singleton仍存在；均逐项核对当前hash和来源理由，JSON没有未分类实体。共享空MenuId不算实际运行贡献。非空Chat/AgentSession/Notebook/BrowserView/Speech/MCP/Dictation域menu items为0。三轮renderer DI退休名称及注册/pending channel退休名称均0；最终多出的channel是普通ptyhost。

相对150，实际schema精确项仍通过：九项147退休schema0；13普通verbosity与23普通signals保留；languageDetectionHints仅untitledEditors；autoLockGroups的11普通property保持、interactive property/default无；NPM open/run保留、debug handler及CodeLens schema无；Mermaid Webview菜单无notebook.output分支。Changed聚合schema只有skip-shell项受本次补丁影响；walkthrough资源路径变化来自151 app root。菜单其他差异为实际app路径、普通ptyhost日志输出、未激活JSON语言server输出、排序变化，不从旧计数推断结论。

## 24条终端引用与普通对照

三轮 `terminal.integrated.commandsToSkipShell` 的真实schema与150比较，Default Skipped Commands恰168→144，只删除14 Sessions及10 Debug旧ID；新增0、其他schema字段及default/defaultDefaultValue空数组完全不变，所有聚合configuration副本一致。最终description SHA `7d9021a5dbf2228213ff32b04145b99d904272fa1d543c2f368df5335cd5c7c6`。24条原ID逐条保存在JSON，当前schema字面出现0，handler/link也无。

实际已存在终端服务证据 `/private/tmp/lcfinal-chkarkup/ui/evidence151-runtime/151-live-terminal-skip-set.json`：instance 1、Set144、configured空数组；Set精确等144项schema清单，144个普通shouldCommandSkipShell答案true、24个退休答案false。loaded hash同151，证据标明仅读取已有实例，没有独立源码import或DI实例化。该Set审查覆盖旧元数据限制与本次共同默认集合的运行效果。

Copy、Quick Open、终端new/focus/kill、tasks run/terminate、Accessibility Help/View、Settings、Keyboard Shortcuts、Welcome walkthrough及实际扩展宿主profiling命令handler保留。普通Markdown showPreview/showPreviewToSide/togglePreview metadata保留；默认bindings为showPreviewToSide/togglePreview，showPreview本来无默认绑定；这三次捕获未激活其handler，不宣称真实preview执行通过。键盘编辑器状态仅Problems/Notifications两个statusbar ID，不用150的8个普通editor statusbar换标为151。两个普通Welcome缺失link仍为toggleMenuBar、remoteHub.openRepository。

## 日志与覆盖缺口

最终session `20261002T204832`：17份文本log，error0，退休DI/actor/channel/download模式0，warning7；两条persistent ptyhost orphan、两条 `/bin/sh -f` shell integration未启用、合成auth fixture未声明1、Git resource-scope2。JSON只保留数量及注册审查相关pattern命中，不转发账户/token内容。历史 `20261002T202056` task红例error1仍存在；旧session warning各自计数，不合并称最终error或抹除旧失败。LevelDB日志只hash，不作为文本log解析。

**直接actor table未捕获；main/shared完整DI/channel maps不在renderer helper覆盖内。** observed logs没有缺actor异常只属于间接证据，不能据此填写runtime actor0或main/shared全零。本记录也没有独立验收native AX菜单、真实task落盘/terminate、账户持久化、主题、可访问性焦点返回、完整GUI矩阵、CLI、签名或跨arch CI；这些由主线程的独立实际证据汇总。下一步将本记录作为已完成注册表/skip Set子门，保留actor/main/shared覆盖事实，继续收口其余M6/M8退出条件。
