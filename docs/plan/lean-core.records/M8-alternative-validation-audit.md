# M8 替代验收覆盖审计

计划：[lean-core.md](../lean-core.md) §9.2 用户调整、V1–V10、M4/M8。最近更新：2026-10-02 10:23 +1000。状态：证据审查完成，替代门尚未全部通过。代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，正式147+148+149 app、254条prune；Storage仅有私有候选，未进入正式补丁或产物。

用户已停用 `dev/smoke.sh`。本审计只读其条目及已有记录，未运行或修改该脚本，未修改共享代码/计划，未操作GUI、浏览器、进程或CI。既有静态/CLI证据按真实范围保留；受IME或错误控件影响的红轮不计通过。下表判断的是逐项证据，不把旧脚本整体退出码或fixture命令返回当全功能验收。

## 原静态/CLI条目

实读 [M8-build149.json](M8-build149.json) 指向的原始静态日志：57条 `PASS:`，没有 `FAIL:` / `SKIP:`；其中50条静态、7条CLI/安装。以下均有实际149产物证据，当前尚未集成Storage新源，不需要再执行已停用脚本。

| 原条目 | 现有证据及覆盖 | 判定 |
| --- | --- | --- |
| bin/品牌、tunnel/REH缺失、sessions/agentHost入口缺失 | 原日志50条静态中的品牌与文件断言；[149构建](M8-build149.json) | 149已验 |
| remote/debug/notebook/chat/MCP/speech/browser/Copilot设置、退休目录和Simple Browser缺失 | 原日志及[真实Cold/Welcome/Reload注册表](M6-runtime149.md)；后者还枚举隐藏metadata/menu/bindings/viewsWelcome | 149已验；运行实体证据强于单独字符串计数 |
| product退休键/API授权、Copilot包及旧文档缺失 | 原日志；[实际包三布局](M7-runtime149.json) | 149已验 |
| rg可执行及单arch目录、生产退休包/运行资源缺失、Mermaid notebook-out缺失 | 原日志、三布局checker与真实production图 | 149已验；rg存在不等于内容搜索操作已验 |
| 1ds源码/产物缺失、普通telemetry设置保留 | 原日志及149实际注册表 | 149已验 |
| Electron43.7.5、macOS12.0地板 | 实际plist与原日志 | 149已验 |
| --version、tunnel可读拒绝、chat/add-mcp可读拒绝且exit1、内置Git | 原日志7条中的对应5条；[显式--后的真实chat文件](M6-cli-file.md)另补正向CLI | CLI子项已验，138同名文件证据沿用其真实来源 |
| OpenVSX主题安装及列表、zh-CN包安装 | 原日志最后2条；没有从安装成功推导主题已经应用 | 安装子项已验；主题实际生效见下文缺口 |

本审计没有读取用户生成树；源码负向项沿用该日志在独立149构建树中的实际结果，不把根工作区或后来私有Storage候选误记为其测试输入。

## 原保留UI与V7条目

| 条目 | 权威证据 | 尚缺/适用边界 |
| --- | --- | --- |
| 窗口/workbench、编辑保存 | [ordinary149](M4-ordinary149.json)真实document edit/save及磁盘proof；[原生149](M2-native-gui149-resume.md)真实tabs/内容/英文截图；旧[138UI](M8-ui.md)亦有12行OCR | 当前子项已验；不继承IME红轮的输入结论 |
| 剪贴板和编辑器粘贴保存 | [本轮terminal-clipboard](M4-terminal-clipboard149-resume.md)，公共clipboard读写自己的marker、产品粘贴命令、save及磁盘严格相等；finally恢复 | 已验用户调整后的功能范围；不声称验证全局Cmd+V或拼音文字注入 |
| 普通terminal、task执行/停止、NPM任务 | 本轮真实PTY/sendText/TERMINAL_RUN_MARKER；ordinary149普通task terminate/end；真实NPM provider/npm-proof | 已验普通执行路径；四条terminal外链仍缺，不能用任务proof替代 |
| Source Control及Git diff/stage/commit | ordinary149内置Git真实repository/diff/index/两commit；149真实SCM状态栏/菜单实体；138UI实际SCM入口OCR | 已验保留能力；不是只检查扩展目录存在 |
| Command Palette退休入口及菜单/快捷键负向 | 138UI五类实际查询，Debug误判经定向修正exit0；149实际handlers/metadata/menu/default bindings及退休动态族均0 | 可沿用已验行为与149完整注册实体；普通Developer诊断明确保留 |
| Welcome/Keyboard Shortcuts路由、退休walkthrough链接 | [runtime149](M6-runtime149.md)真实Welcome/Reload的1实例/30步骤及toSide路由；退休command links0 | 已验捕获范围；两条非展示Web/可选扩展链接例外按原分类保留 |
| 普通auth双账户创建/复取/退出/unregister | [auth149-resume](M4-auth149-resume.md)限定PID的四个真实dialog、16动作PASS、公共事件/调用计数、正常wait exit0；JSON明确ordinaryAuthenticationFull=true | 账户完整链已验；secretStorageFull=false，不能由账户绿覆盖secret删除红例 |
| 四类Accessibility内容/关闭/焦点返回 | [accessibility149-resume](M4-accessibility149-resume.md)四项内容、AX、可见尺寸、appActive/onConsole/locked及Escape返回全部PASS | 完整焦点门已验；旧锁屏内容子集不再列为本轮待补 |
| 普通Webview消息、稳定/退休API、ordinary inline及授权边界 | [145双权限真实宿主](M4-final-host145.md)89路径、provider零调用、ping/pong、inline接受、findFiles2 | 145+146真实证据可沿用未变链路；不要改写成149重跑 |
| 非中英文工作台语言 | [144语言包CLI](M2-language-cli.json)及[145德语NLS/DOM/截图](M2-language-gui145.md) | 非中英文工作台已验；不能代替原生fallback |
| 内置light/dark实际主题 | [149 Mermaid](M3-product149-runtime.md)实际body theme/CSS变量/原图与dark→light→dark；[冻结themes](../../../dev/test-fixtures/lean-core/mermaid-cases.json)为Default Light/Dark Modern | 内置主题的实际显示有证据；第三方已安装主题是否实际生效仍缺 |
| 普通文件搜索 | [ordinary.js](../../../dev/test-fixtures/lean-core/ordinary.js):103断言findFiles返回真实URI；145宿主另有获权findFiles2 | 文件名搜索已验；内容搜索仍缺 |
| profiling | [145真实CPU采样](M5-profiling145.md)开始/停止与有效cpuprofile、时间/samples；后续未改CRI/profiling | 沿用，不默认重跑 |

## 四个特别检查项

**内容搜索尚无结果断言。** ordinary.js:96创建 `ORDINARY_SEARCH_MARKER`，但103行只执行文件名匹配；144行执行 `workbench.action.findInFiles` 后直接返回PASS，没有读取match、URI、range或实际结果文本。现有ordinary149响应的checks也只称“file search”。因此M8.md中“搜索PASS”只能解释为文件搜索，不能覆盖V7的全局内容搜索。最小补验是在自己的工作区中放唯一marker，调用实际产品搜索路径后，断言真实结果模型或可见结果含指定URI和marker；不能只检查命令存在或执行完成。

**第三方主题实际生效尚缺。** 149静态/CLI日志只证明 `zhuangtongfa.material-theme` 安装且list可见；既有Mermaid矩阵使用内置Default Light/Dark Modern，不能替代第三方主题选择。可复用已经安装验证的隔离扩展，按其真实manifest label选择主题，然后核对resolved theme身份、实际颜色token/CSS及可见截图；单独设置 `workbench.colorTheme` 或读取配置不够。无需为这个缺口再联网重复已绿安装。

**market卸载有旧144实际证据。** [M2-language-cli.json](M2-language-cli.json)有before/after列表，卸载后主题消失、两个语言包仍在；实读 [theme-uninstall144.log](/tmp/vslight-smoke.fWrs7O/theme-uninstall144.log)包含产品的成功卸载文本。145–149的持久patch没有修改CLI/market install-uninstall源路径，所以这条CLI行为可沿用，不写成全无证据，也不写成149重新卸载过。当前没有单独的产品Extensions UI卸载/重启state证据；若以后验证Storage修改对renderer的extension enablement/profile state影响，应补相应持久化行为，勿混成CLI卸载未通过。

**Downloads有旧138落盘证据。** 实读 [ui.log](/tmp/ui138-dbgdgcyk/ui.log):9/25记录1237B的Downloads PASS，自己的term-proof.txt仍在；[meta.json](/tmp/ui138-dbgdgcyk/meta.json)和保存的ui.sh确认该子项在真实集成terminal执行curl写入唯一Downloads临时文件，检查非空后删除。原ui.exit=2源于Debug泛化正则，已在debug-only.exit=0的定向补验中修正；不能因此抹掉Downloads的真实子项，也不能把整轮exit2改为0。该项只证明terminal网络写盘，不证明Electron Browser Download API（本产品没有这类保留入口）。本轮149 terminal-clipboard仅写workspace marker，没有新的Downloads动作；保留138来源即可，不因停用smoke默认再跑此绿项。

## V1–V10映射和剩余门

| ID | 当前有效证据 | 还需补验 |
| --- | --- | --- |
| V1 图标/文件关联 | [最终149字节/65类字段](M8-final-artifact.json)、helper fixture；本轮txt/md/py指定app打开、URI/内容及普通图标截图 | Finder/Dock/About实际应用图标；指定app的CLI打开不等于Finder关联交互 |
| V2 Codicons | 三布局demo缺失/CSS/TTF/license保留；149 Mermaid控件/字体原图；本轮三类普通file图标 | 普通Explorer/terminal/theme/Markdown图标应从已有原图明确逐项核对，缺少的surface再补；包存在不能单独替代显示检查 |
| V3 Mermaid | 149两surface×两theme×8case的32图、33交互及精确quit/restart/source/ID/panZoom | 当前源码未变，无新增渲染缺口；保留ZenUML固定白底与日志覆盖边界 |
| V4 locale | 149资源白名单/plist；早期7组实际NSBundle/AppKit选择；本轮英文菜单/Open/Save真实AX/截图/Cancel返回；145德语工作台 | 最终zh-CN/zh-TW及其他系统语言fallback的真实菜单/Open/Save GUI；otherLanguages=NOT_COMPLETED_LOCKED |
| V5 浏览器 | 149包/运行贡献/IPC零退休；[145系统外链](M5-external-links145.json)16/20原URI回执且无Browser tab | terminal-visible/terminal-osc8各自的0.0.0.0及example.com四条真实出口；不能用trust dialog推断通过 |
| V6 AI/API | 双权限89路径及provider零调用；149Cold/Welcome/Reload退休注册0、main/shared channels24/17、观察期间无退休后台 | 当前源码未变，已有证据可沿用；单快照不外推未来永久无后台 |
| V7 保留能力 | 上表实际编辑/Git/tasks/terminal/clipboard/账户/A11Y/Webview/语言/profiling | 内容搜索、第三方主题实际生效、SecretStorage立即删除读回；原生语言相关UI另归V4 |
| V8 构建/闭包 | 149全序prepare/prune/compile/packing/native noEmit、root/remote生产图、三布局、helper及prune失败注入、全集RPC校验 | Storage若正式集成，需其原suite/新回归/全图与新完整构建；当前私有5绿不能替代 |
| V9 升级数据 | [138十二恢复](M6-final-restore.md)来源/注入/公共Tab API/正常quit/SQLite；149未改deserialize；旧CLI拒绝与同名文件开通 | Storage若正式集成，需实际新产物的状态保存/删除与重启恢复定向回归；账户/secret不能靠旧绿覆盖新红 |
| V10 体积/分发 | 149同条件下降20.01%/18.27%、43.7.5/12.0、独立签名/notary/staple/CRC | 当前两arch CI仍未验，用户明确仅本地不执行；Storage新生产字节若交付，重新计量与签名验证，不能沿用149签名身份 |

## Storage候选对原绿项的影响

[调查记录](M4-secret-delete-investigation.md)明确：当前149的真实 `await delete → get` 红例；私有真实Storage类原件1绿/4红、候选5绿；正式patch/typecheck/build/实际宿主复验未交付。候选改变所有Storage在pending或in-flight本地写期间接受同keyexternal事件的语义，范围超出secret。它不会仅因测试绿就使当前149实际应用的失败消失。

若确认根因并正式集成，需要重验这些具体受影响项，保留原结果而另记新产物身份：

1. 原auth fixture的store→真实Reload→read→update→`await delete`立即get undefined及keys缺失；不得加等待、retry或降低断言。跨宿主/renderer的secret change通知、账户偏好/撤权的持久化与普通事件也需验证；已有双账户dialog截图不因Storage改动失效，但账户状态保存不能直接沿用旧绿。
2. 新Storage回归与原基础/外部变化/SQLite suite，含同keypending/in-flight冲突、不同key继续接收、本地ack后远端set/delete及关闭flush。新候选会暂时忽略external事件，真实并发路径是否完整一致仍待验证。
3. 新产物正常Quit/重启的普通profile状态：最小覆盖无退休控制例（sticky/preview）、代表混合退休active/MRU例、全部退休的状态行删除；退出后只读SQLite与oracle比较。旧12例的deserialize逻辑证据可以保留，不默认重跑所有布局排列。Mermaid source/ID/panZoom持久化也使用Storage，应定向重做quit/restart恢复；未改渲染资产不需重复32图矩阵。
4. renderer保存的扩展enablement/profile state、主题实际显示及重启后的恢复；区分JSON配置、CLI安装目录扫描与Storage状态，只有受候选影响的路径需要重验。任务/PTY和Git磁盘proof、CLI旧拒绝、Downloads、API惰性契约及资源helper不因该候选自动失效。
5. 正式持久补丁重放、全图检查、新完整构建，并在新app运行Cold/Reload及上述受影响动作的日志核对。更新新main/shared/workbench身份hash；旧149捕获不能换标成新artifact。源码没改的退休注册/依赖/资源结论保留来源，包三布局对新包复核。重新测量新unsigned/signed app和ZIP、完成其签名链；149的旧计量/签名记录不覆盖新字节。

最小继续动作是先解决并验证Storage真实红例，在新生产输入定下后补内容搜索和已安装第三方主题实际生效；解锁后仅续缺失的语言/fallback原生GUI、Finder/Dock/About及四条外链。有效market CLI卸载、Downloads、API路径和图表渲染绿项保留，不为替代验收重跑旧smoke。最后按新产物身份合并逐项结果；当前CI依用户仅本地限制仍保留未验，不能标V1–V10或M8全部完成。
