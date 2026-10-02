# M8 · 终局验收覆盖审计

计划：[lean-core.md](../lean-core.md) R-1–R-6、NFR-1–NFR-5、C-1–C-4、V1–V10、M1–M8、§9.2。最近更新：2026-10-02 18:28 +1000。状态：只读证据审计已交付；当前终局门尚未全部通过。代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，114–139/141–150、254 条 prune；没有把 HEAD 写成未提交应用的构建来源。初次17:27审计时计划 SHA256：`0d058cac4e64d6a13e9d811b809200868f13ef661e57858296b9ec4e0e4dd939`。

本审计只写本文件；只读计划、现有记录、相关验证夹具与 150 补丁、持久证据副本。没有修改计划、里程碑记录、源码或六份产品文档，没有运行或修改 smoke，没有启动 GUI、连接活浏览器、提交、推送、触发 CI 或发布。当前并行任务的执行结果须实际落盘再纳入，不因任务已启动预填通过。

## 结论与证据等级

已有证据证明完整 arm64 150 重放/编译/打包、当前生产依赖/包闭包、真实 SecretStorage 即时删除/Reload/退出重启、普通旧窗口三类各冷启动及重启通过。资源整理、149 的图表矩阵/普通功能/原生语言/外链，以及未变化的 145 API、138/144 的指定 CLI 与下载子项，仍有各自版本的有效证据。

新增已验：[150 Mermaid 双 surface 精确退出重启](M3-storage150-final.md)及synthetic历史/MCP/auth/opaque凭据global+workspace DB/file哨兵原值保留；[signed ZIP独立CRC、unsigned/signed包闭包与冻结输入](M8-crc-static-final.md)；[六文档审查](M8-docs-final-audit.md)。这些局部门已从待验转为实际通过，不改写各旧执行来源。

新增[150 active注册表与实际13快捷键查询](M6-runtime150-final.md)：退休注册实体/动态来源匹配0、完整普通Welcome/状态栏/renderer DI有证据；合成Beta账户public before通过。它们是退出前范围，不证明新host持久化，renderer菜单items不能替代native AX树。

终局仍未齐：完整原生菜单/标题栏GUI、真实普通账户偏好/授权持续可用及主题/extension enablement-profile state退出重启、最终逐项整合。native新helper尚待用户系统辅助功能权限。另发现24项terminal skip-shell退休常量/说明死引用，需集成人裁定；不把它们称为服务残留，也不以注册实体0掩盖。当前输入arm64/x64 CI未验，用户要求仅本地；此门不能解除、删除或用旧CI、本地build代替。M2/M8仍不能记完成，也不宣称本地整体验收已完成。

本表中的状态约定：

- **本地子门已验**：指定实际产物/动作有结果、正常退出或所需断言；不自动代表包含该子门的整个里程碑完成。
- **沿用旧绿**：记录保留旧执行输入与版本，相关实现未变且新的生产输入/包复核成立；不能改称 150 重跑。
- **待本地证据**：未运行、只有准备/源码或覆盖不足；不计通过。
- **当前 CI 未验**：当前输入无双架构线上运行，保留为未完成退出条件。

持久证据根为 [/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002](/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002)，按 [paths.json](/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/paths.json) 的18项原路径映射读取。审计实际读了build149的静态/CLI原日志、build150的官方Electron Storage日志、新Mermaid summary和两次SQLite结果及CRC/static/doc审查记录，并核对当前records JSON与持久目录文件存在性。新Mermaid四原图的实际逐张查看由主集成人执行，图像结论保留其来源。原`/tmp`、PID、port和ready文件是历史事实；路径存在不表示原会话存活。整个app和冻结输入重算依据并行静态任务的实际结果，本审计没有重复执行。

## R / NFR / C 终局映射

| 门 | 已有证据能证明的范围 | 状态与剩余条件 |
| --- | --- | --- |
| R-1 图标合并 | [150 实账](M8-artifact150.json) 65 类关联非 icon 字段/URLTypes 相同；[资源 helper](M2-resources.md) hash/有效引用/单份图标/失败事务与幂等；[149 三文件真实打开](M2-native-gui149-resume.md)；[150 Finder/Dock/About](M2-icons150.md) 用户观察、AX、截图、正常 quit | 本地子门已验；M2 双架构 CI 未验。About 的实际样式没有独立图标，不虚构 About 图标。 |
| R-2 Mermaid 压缩与保留 | [149 两 surface×两 theme×八 case](M3-product149-runtime.md)、32原图、33交互、同条件preview下降及普通editor；Chat适配已断；[尺寸](M3-final-size149.json)；[150双surface重启](M3-storage150-final.md) | 渲染/压缩沿用旧绿；150 source/ID/theme/numeric panZoom/完整editor memento/三tab flags定向恢复通过，不以普通tabs恢复替代。 |
| R-3 Codicons 开发资源 | [115](../../../patches/115-light-codicons-demo-assets.patch)、[149三布局](M7-runtime149.json)、[150实包](M8-build150.json)，demo缺失/CSS/TTF/license保留；149普通界面和图表原图；[当前静态](M8-crc-static-final.md) | 本地子门已验，冻结生产输入匹配；包存在与界面显示分别取证。 |
| R-4 原生中英文资源 | helper 白名单/variants/可选 plist；[en/zh-CN/zh-TW/fr GUI](M2-native-gui149-resume.md)、七组资源选择；[德语工作台](M2-language-gui145.md)、[语言包 CLI](M2-language-cli.json) | 本地子门已验/旧绿沿用；M2 当前双架构 CI 未验。原生与 workbench 的语言证据不互代。 |
| R-5 Browser/生产 Playwright 移除 | [150编译/实包/生产图](M8-build150.json)、[当前active实体/13实际快捷键](M6-runtime150-final.md)、149 main/shared、20外链、普通Webview/HTML/profiling | 包/服务/出口与快捷键子门已验或沿用；完整native菜单/标题栏待验。 |
| R-6 Chat/MCP/语音运行链移除 | 145双权限89paths/provider0、149 Cold/Welcome/Reload/main/shared；[150active renderer全集](M6-runtime150-final.md)、全图/实际包 | 当前退休注册实体0；不能外推全部元数据/文本0：24项Sessions/Debug skip-shell常量/说明死引用单列待裁定。native与退出重启余项仍缺。 |
| NFR-1 同条件体积下降 | [M1 修复后基线](M1-repaired-baseline-artifact.json) 528,142,131 B / 192,738,926 B；[150 unsigned](M8-artifact150.json) 422,444,482 B / 157,532,426 B，下降 20.01%/18.27%；[150 signed](M8-sign150.json) 另计 | 本地体积子门已验；signed 与 unsigned 不混用，不重复计 symlink/asar 索引。 |
| NFR-2 保留面与普通宿主可靠性 | 编辑/文件与内容搜索/Git/PTY/tasks/NPM/市场/主题/语言/auth/Webview/profiling/四类完整 A11Y；150 secrets 定向；§9.2 替代矩阵见下 | 多项子门已验；不能由源码存在或若干 fixture PASS 推导整体零缺口。150 GUI及 Storage state 影响范围仍需收口。 |
| NFR-3 重放、编译/运行/包/生产图一致 | 150完整build/生产图/unsigned-signed包/冻结复核；[150active真实注册表](M6-runtime150-final.md)；149 Cold/Reload/main/shared与未变旧graph/失败注入 | 当前生产/构建454项及19workflow匹配，active实体负向通过；旧Cold/Reload/main/shared仍为149。24无实体skip常量/说明需单列裁定，不能称全元数据闭包零残留。 |
| NFR-4 稳定 API/旧数据与窗口 | 双权限fixture、138十二恢复、150六恢复/SecretStorage；[150 Mermaid与sentinels](M3-storage150-final.md) | 窗口/接口/secret及synthetic历史/opaque凭据/授权row保留通过；真实普通账户授权/偏好读取与重启可用性待验，任意哨兵row未变不能替代公共authentication行为。 |
| NFR-5 43.7.5/12.0/分发 | 150 plist/Electron、真实arm64 build/host、strict/spctl/notary/staple/validate/cleanup；[CRC及signed复核](M8-crc-static-final.md) | 本地签名链、signedCRC子门已验；当前输入x64/arm64 CI仍未验。 |
| C-1 JSON→patch→light/prune 时序与 exit4 | prepare/utils实际顺序；150全序成功；[M7](M7.md)两注入Not found/exit4、哨兵未执行；254 prune；[冻结复核](M8-crc-static-final.md) | 子门已验/旧失败注入沿用；patch/prune及其他生产输入全部匹配，未改写原manifest。 |
| C-2 packing 后、签名前资源整理 | [build.sh](../../../build.sh) helper 在 min-packing 后/touch 前；150 unsigned 与独立 signed 内容审计，43 处签名相关变化、0 意外变化/删除 | 本地子门已验；共同入口覆盖三 workflow 的源码审计成立，不能当作两 arch 实际构建绿。 |
| C-3 全源码含测试、全集 RPC assert | [M4 API audit](M4-api-audit.md) 全集两 assert/actors；150 native noEmit/完整 compile；149 真实 Cold/Reload DI/RPC 0 | 子门已验；当前检查没有通过全局 skip/排除保留域取绿。纯 types/proposed unavailable 是契约例外。 |
| C-4 Electron sandbox/Webview/PTY/storage/SQLite/external opener/profiling | 实际包 12 普通 out 与普通依赖、真实 Webview ping/pong/PTY/tasks/外链/profiling、150 Storage suite/secret/窗口恢复 | 指定保留子门有证据；跨两个活 host 的 secret 通知不是本次真实宿主已测范围，不能由单 host 计数外推。 |

## V1–V10 验收矩阵

| ID | 当前证据及范围 | 未完成或边界 |
| --- | --- | --- |
| V1 | 65 关联非图标字段/URLTypes、主图标统一/有效、txt/md/py URI 与内容、150 Finder/Dock/About | 本地子门已验；指定 app 打开证据不改称 Finder 默认关联双击。M2 双架构 CI 仍未验。 |
| V2 | 150 unsigned/signed三物理布局demo无/普通包及out在；149各实际图标原图；[当前静态](M8-crc-static-final.md) | 本地子门已验，旧原图按surface沿用。signed模式有全app及14个长度变化Mach-O strict验证，不将签名变长误判资源丢失。 |
| V3 | 149完整32图/33交互/发布minify；[150两surface](M3-storage150-final.md) source/ID165d2776/dark/scale1.25/x429.75/y225、完整editor memento及三tab flags精确重启 | 150定向持久化通过，四原图已由集成人查看；首次后台editor未resolve的DOM超时红例保留，公共显示原恢复tab后才取得完整结果；未重跑32图。 |
| V4 | 实际白名单及有效资源，四语言真实菜单/Open/Save/Cancel，fr native 英文 fallback，de workbench 实际 NLS/DOM | 本地已验；三 workflow setup-python 无 x64 条件只是源码事实，当前两 arch CI 未验。 |
| V5 | 150源/包、[active全部实体与13实际Keybindings](M6-runtime150-final.md)退休0；149main/shared无退休channel；20外链 | Keybindings子门通过，native全菜单/titlebar待验。首个补链以用户+Chrome回执取证，自动超时保留。 |
| V6 | 双权限89paths/provider零、149 IPC/utility证据、150build/package；[150active handler/schema/menu/binding/DI/Welcome/statusbar](M6-runtime150-final.md) | 当前注册实体负向通过；1个普通marketplace Chat/2 Markdown/11 schema/2 bindings/63聚合-空menu/1普通AI edit telemetry为分类例外。24终端旧skip常量/说明另列，非后台证据；native/持久化待验。 |
| V7 | [普通149](M4-ordinary149.md)、[内容搜索/第三方实际主题](M4-search-theme149-resume.md)、[PTY/clipboard](M4-terminal-clipboard149-resume.md)、[双账户16动作](M4-auth149-resume.md)、[150 secrets](M4-secret150-runtime.md)、[四项完整 A11Y](M4-accessibility149-resume.md)、145 Webview/profiling、144 市场卸载、138 Downloads | 多版本有效子门，逐项来源保留；150 主题缓存/扩展 enablement-profile state 受 Storage 影响的持久化仍需明确验证或精确说明为何不受影响，不能将149“选择并显示”改称“150重启恢复”。 |
| V8 | 150 clean build/全图/真实生产图与包；remote实际图；两prune exit4、全集assert；[冻结静态](M8-crc-static-final.md) production/workflow全匹配、checker12/12、resource27/27 | 当前静态子门通过。官方79 total含新增7/1原有pending；resource首次系统Python3.9版本门失败和signed sandbox签名失败均保留，只有实际正确环境结果计通过。 |
| V9 | 138十二旧恢复、150普通六恢复；[150双surface及DB/file哨兵](M3-storage150-final.md)；旧opener fallback与CLI拒绝/同名文件旧绿 | Mermaid/历史MCP/opaque凭据/合成授权row保留子门已验；真实普通账户授权/偏好与profile/enablement/实际主题持久化待验，不将sentinel原值保留称为真实账户状态验收。 |
| V10 | 150体积/运行时版本、签名公证清理；[signedCRC及app一致](M8-crc-static-final.md)3858 entries、firstBad=None/exit0，ZIP1209 regular/14 symlink与signed app逐字节一致 | 本地分发子门通过，unsigned/signed旧计量仍分开；当前输入两arch CI未验，没有发布。 |

## §9.2 停用 smoke 后的逐项替代

2026-10-02 用户调整具有优先级：正文中旧 `smoke`/`--skip-ui`/单轮完整 smoke 的执行要求均已由真实产物静态/CLI、隔离真实宿主和限定 PID 原生 GUI 替代。不再运行或修改脚本。旧静态日志及其中 57 条 PASS 只证明当时 50 静态 + 7 CLI 子项，日志明确 L3 未跑，不能称完整 smoke 通过；受 IME/错误控件影响的一轮红不计通过。替代方式不降低保留功能、负向、前台/焦点、全构建/分发和当前 CI 门。

| 原条目/保留功能 | 实际替代证据 | 分类 |
| --- | --- | --- |
| 品牌/bin/tunnel/REH/sessions/agentHost 文件 | build149原静态日志；150实际包/plist；CLI --version；[当前静态](M8-crc-static-final.md) | 沿用旧静态/CLI + 当前unsigned/signed包子门，冻结生产输入通过 |
| remote/debug/notebook/chat/MCP/speech/browser/Copilot schema 0 | 149 Cold/Welcome/Reload实体；150active全部schema/命令/metadata/menus/bindings/viewsWelcome/walkthrough动态分类与实际包 | 当前注册实体退休0；24terminal skip-shell文本/常量不属于schema ID或command链接0的覆盖，单列待裁定 |
| product retired keys/API授权、Copilot包、旧文档 | 149原静态、150实际包product keys/三布局、[冻结静态](M8-crc-static-final.md)、[文档审计](M8-docs-final-audit.md) | 当前包/冻结子门通过；旧具体CLI和源码负向项保留原覆盖范围 |
| rg可执行/仅arm64、1ds源及包缺失/telemetry保留、普通运行包 | 原静态日志、150 actual package；真实内容搜索另有结果 | 沿用/当前包子门；rg存在不能覆盖内容搜索 |
| Electron/macOS floor | 150实际plist与版本 | 已验 |
| version/tunnel/chat/add-mcp/普通CLI同名文件 | 149静态CLI的可读拒绝及exit1；138真实`-- chat`、内容不变/正常quit | 沿用具体版本，不将错误文本单独当退出码证明 |
| OpenVSX安装/list/卸载与语言包 | 149实际安装；144 uninstall前后列表及日志；145德语DOM；149简繁native/workbench | 沿用旧实际行为；不声称150重复装卸或全部market UI已验 |
| 窗口/workbench/编辑保存 | 149真实文档edit/save磁盘proof、native普通tabs/内容与截图；138实际OCR | 已验子门，未受影响沿用 |
| 剪贴板读写/粘贴/保存 | 149公共clipboard自己的marker、产品paste action、save磁盘严格相等、finally恢复 | 已验替代动作；不宣称拼音输入下全局Cmd+V文字注入已验 |
| 终端开/执行/焦点 | 149真实PTY/sendText落盘；四类A11Y要求真实appActive/onConsole/locked=false，终端内容可读、Escape返回xterm textarea；138独立UI正向子项 | 已验实际行为和完整焦点；旧终端输入落入editor的失败保留，不能篡改成绿 |
| Downloads网络写盘 | 138实际terminal curl、1237B子项与审计保留；原全轮exit2源于Debug正则误判，后定向修正 | 沿用真实子项；只覆盖terminal下载写盘，不宣称Browser Download API |
| Source Control/Git diff-stage-commit | 149内置Git真实repo/index/diff/两commit；普通SCM实体及旧GUI入口 | 已验 |
| 原Remote Explorer/Debug: Start/Chat:/Notebook:/Copilot: palette负向 | 138实际查询/OCR及Debug定向修正；149与150active完整退休实体负向 | 沿用具体palette行为，150新增Keybindings13查询通过；不误判marketplace Chat/Developer/browser诊断，native/titlebar另补 |
| zh-CN菜单“文件”/语言生效 | 149真实菜单/GUI及实际bundle选择、145德语workbench | 已验；不靠CLI安装成功推导GUI已生效 |
| 普通Welcome与Keyboard Shortcuts | 149 Welcome/Reload与150active各1 walkthrough/30步骤/退休links0；150实际Keybindings13查询、输入exact/实际IDs来源分类 | 当前子门通过；宽搜chat8/mcp2均普通fuzzy结果，不假称全0 row；正向Copy1条。native权限/重启独立待验 |
| 文件/内容搜索与主题显示 | 149真实findFiles；内容搜索实际1 result/1 file、URI/marker/AX；One Dark Pro身份与5实际CSS token严格一致 | 已验运行显示；重启持久化适用边界另列 |
| task/NPM执行停止 | 149真实tasks execute/terminate/end、NPM普通provider与磁盘proof | 已验，不以“命令返回”替代执行证明 |
| 普通auth/session/secret | 149完整双账户；150secrets/Reload/3 quit；150public before双account返回、silent无explicit account选Beta原session、create/remove0 | 退出前public preference子门通过；尚未quit/restart，不证明新host偏好/授权保留；secret当前完整定向门通过 |
| Webview/inline/profiling | 145真实Webview ping/pong/inline/双权限host、实际CPU采样；[150 Mermaid完整双surface恢复](M3-storage150-final.md) | 未变机制沿用，新增Mermaid当前恢复子门通过 |
| 普通Accessibility Help/Accessible View | 149 terminal-view/help、editor-help、hover-view，实际DOM/AX内容/尺寸/appActive/onConsole/非锁屏/关闭返回焦点 | 四项完整通过，不再沿用锁屏下只验内容的子集 |
| 新Browser/MCP/speech/transcription/native资源/GUI负向 | 150 actual package/active注册表/Keybindings、149native语言/20外链 | 当前实体与快捷键子门通过，native全菜单/titlebar/后续持久化仍待；停用旧脚本不等于skip绿 |

这些证据不是单次完整脚本 exit0；§9.2 已允许逐项替代，但最终替代账仍要每项有证据、无待验/失败项。supplemental unit suite 的原有 disabled clear 单独保留，不算替代产品验收的一条“已跳过也算通过”。

## Storage150 影响范围与额外本地缺口

实际 [150 补丁](../../../patches/150-light-storage-external-write-order.patch) 修改公共 `Storage.acceptExternal` 和 `flushPending`。同 key 的 pending/in-flight 本地写期间忽略 external echo，request 按身份释放；作用不只 SecretStorage。当前证据覆盖：

1. 七个真实 Storage class 新回归：pending/in-flight set/delete、不同 key 继续接收、并发 request 保护、失败释放、写后远端 set/delete。私有 mocha 7 PASS/0 FAIL/SKIP。
2. 持久 [storage-electron-suite.log](/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build150/storage-electron-suite.log) 官方六 suite **共79 passing/1 pending**，其中包含上述新7例。另涵盖真实基础/SQLite/关闭flush、StorageService scope/source事件、secrets change与APPLICATION_SHARED、main关闭。不是79旧例再加7；原pending是browser developer clear，未改、未作为产品验收。
3. [真实150 secret JSON](M4-secret150-runtime.json) 八个store/read/update/delete请求全部PASS、四host boot、三正常quit0；store/update/delete的secretEvents每次+1。delete立即get undefined、keys absent没有等待或retryget；事件到达等待不替代立即读取断言。该真实证据来自单个fixture在顺序host生命周期中的公共事件，不是两个同时活host间的传播测试。
4. [150普通恢复](M6-storage150-regression.md) editorpart状态三类×两启动共6/6；正常退出后只读SQLite/MRU/flags、空状态row按正常save移除。
5. [150 Mermaid定向恢复](M3-storage150-final.md)双surface三tab flags、raw source、ID、theme、numeric panZoom、两次quit后完整serialized editorpart严格相同；global/workspace四类sentinel与历史文件原值保留。[summary](M3-storage150-final.evidence/summary.json)及[cold](M3-storage150-final.evidence/cold-sqlite.json)/[restart](M3-storage150-final.evidence/restart-sqlite.json)实际读取核对，历史/opaque凭据保留的原缺口已补齐其合成范围。

仍需针对以下现有契约收口，不重跑未变的32图、12窗口排列、全部API/market/download：

| 本地项 | 当前证据不足的位置 | 最小补证方向 |
| --- | --- | --- |
| V9 / NFR-4 的普通账户授权/偏好可用性 | [150新哨兵](M3-storage150-final.md)已证明global/workspace synthetic Chat history/MCP/opaque credential/auth grant row与历史文件不删除。该授权row作为sentinel保留，不等于真实authentication provider权限/普通账户偏好公共API读取成功；149双账户完整运行没有150退出重启偏好动作。 | 历史/文件/opaque凭据保留不用重复。主GUI当前准备的合成普通provider授权/账户偏好→正常quit→新host读取/撤权持久化须按真实结果记录，区分DB保留与实际账户行为；不访问真实用户账户或token。 |
| 150 renderer profile/enablement与主题恢复影响范围 | [旧替代审计](M8-alternative-validation-audit.md)已指出Storage改动涉及extension enablement/profile state与主题缓存。[149搜索/主题记录](M4-search-theme149-resume.md)明确只验选择/实际显示，**没有补重启后的主题恢复**；150六恢复只覆盖workspace editorpart，不能覆盖profile/application消费者。 | 同一自有150实例验证普通已安装扩展的enablement/profile state写入→正常quit→真实重启，以及主题身份/实际CSS恢复；或逐路径证明指定行为直接从JSON/文件读取、不经受影响Storage，并保存精确源码及运行身份依据。设置配置值或CLI扫描目录不能单独证明renderer enablement/实际主题恢复。无需重新联网装已验扩展。 |
| 150 GUI / 最终整合 | Mermaid/CRC/冻结/六文档已通过；150active实体/实际13Keybindings已通过，public before账户也PASS；完整native菜单新helper仍待系统AX权限，titlebar和真正重启待收口 | 当前实体/快捷键不重复跑。主线程继续native树/titlebar、normal quit→restart、主题五tokens/identity及disabled renderer状态，保留旧CSS空摘要不是绿。 |
| 24 terminal skip-shell无实体死引用 | 150真实commandsToSkipShell schema说明14 Sessions/10 Debug旧command名；冻结terminal.ts默认skip常量在；实际handler/command链接均无，用户default[] | 不推断服务仍存在，也不宣称全部死元数据清零。§5.4死项闭包由集成人精确裁定/记录；若修改生产输入，需相应新输入重放/构建与受影响门，不复用旧150身份。 |

跨两个活host的secret通知、第三方自带AI/browser功能、未来永久无后台不是计划新增强门；这里明确真实测试边界，不擅自扩张范围。对于确实受公共Storage改动影响的现有NFR-2/4保留行为，需要证据或精确不受影响依据，不能以“旧绿很多”直接免除。

## 本轮已收口的静态、ZIP与文档子门

[M8-crc-static-final](M8-crc-static-final.md)证明原1421项manifest与持久build150副本1421/1421匹配，当前454生产/构建项及19workflow项全部匹配。当前16项偏离为3验收helper和13文档，另有两个新增验证helper，未回写原manifest；不将validation helper的新hash称为build150生产输入。此复核证明当前输入与构建来源对应，不证明当前CI已经运行。

signed ZIP CRC3858 entries全覆盖、firstBad=None/exit0，157,388,380 B及SHA与签名记录一致；全部regular文件与symlink和持久signed app相同。signed checker初版真实红是14个unpacked Mach-O签名后长度变化，继发inventory丢失/CRI-katex误报；新的显式`--signed`模式先要求整app deep strict和14个变化文件独立strict全部通过，才接受签名长度变化，默认unsigned仍严格要求长度。真实unsigned/signed checker均exit0、43处签名预期变化/0意外变化；12回归与资源27例通过。原sandbox签名验证exit1由同app未变字节在授权沙箱外strict exit0辨识环境限制，原失败保留；没有为结果绿色重签或改产品。

[M8-docs-final-audit](M8-docs-final-audit.md)已经逐文档核对README、compatibility、icons、release、usage、migration与150实际源码/app，限定六文档check_doc与diff-check均exit0。文档审计17:26时对CRC/Mermaid仍写待验，是其当时的结果边界，不能覆盖17:40实际新增通过项；集成人最终回写时应以各新独立记录同步状态。文档子门通过不等于M8或发布完成。

## M1–M8 退出判定

| Milestone | 已证明的退出范围 | 审计判定 |
| --- | --- | --- |
| M1 | 两同条件基线全构建/字节来源、八类保留现状、精确入边与处置/验收清单、旧profile源/合成方法；smoke失败作为基线现状保留 | 已有“已完成”记录可维持；M1本来不要求最终完整UI绿，其完成不外推M4–M8。 |
| M2 | V1/V2/V4资源/GUI/helper本地子门、共同build入口/三workflow Python源码覆盖两arch | 进行中；当前输入arm64/x64 CI绿是明确退出门，未验不能完成。 |
| M3 | 149 V3矩阵、交互、quit/restart、minify/收益、Chat适配解绑及全图；150双surface精确退出重启绿 | 原149完成记录可维持，150集成持久化回归也通过；首次后台editor未resolve红例保留，不抹旧事实。 |
| M4 | stable/proposed真实host、全集RPC、ordinary suite、普通认证/A11Y/Git/task/secret/窗口/历史sentinels | 进行中；150普通账户授权/偏好及profile-enablements/主题影响范围、最终汇总尚缺。模块suite/源码存在/局部绿不能代替整项退出。 |
| M5 | Browser闭包/20外链/旧opener/Webview/HTML/profiling/旧Browser恢复/全图；150active实体及实际快捷键 | 进行中；完整native菜单/titlebar待验，M4前置未收口。 |
| M6 | AI/CLI/包/双权限host、149实体、十二恢复；150六恢复/Mermaid/sentinels/active实体与实际快捷键 | 进行中；native/titlebar/退出重启账户-profile待，24skip死引用裁定未收口；前置须完整整合。 |
| M7 | 150真实重放/全图/生产图/unsigned及signed三布局、普通copy、remote图/安装字节、两exit4；冻结production/workflow匹配 | 本地技术子门已验；M5/M6前置和最终汇总未收口，仍进行中。未变旧绿无需重复，包checker绿不能越过依赖。 |
| M8 | 150完整build/体积/签名公证/signedCRC、Mermaid与sentinel保留、冻结静态、六文档、多版本真实替代子项 | 进行中；剩GUI/账户偏好/主题与enablement持久化/最终矩阵，且当前两archCI未验。当前本地整体验收也未完成；即使本地余项齐，M2/M8仍不可完成。 |

恢复快照当前2/8只计M1/M3，未把M4–M7局部交付数算完成；本审计没有改其状态。主集成人应先收齐各独立真实结果，按M4→M5→M6→M7依赖逐项审核退出条件，单写里程碑记录和计划回写。双架构CI是M2/M8专门的未验门，不能因该门限制就抹掉其他可完成本地里程碑，也不能为了进度把它放宽。

## 继续与最终整合规则

当前只做已获授权的本地实现和验收，不提交/推送/dispatch/release、不再询问同一CI授权。旧 [CI审计](M8-ci-resume-audit.md)的公开绿色运行对应`da0b544`，不含当前helper/150输入；原196项CI准备清单也落后于后续workflow和150输入，不是当前输入证据。

Mermaid、signedCRC/冻结静态和六文档结果已经并入本审计。主集成人继续补真实GUI及150账户/Profile存储余项，再按具体独立记录收口最终矩阵和主进度。六文档已核对物理删除、stable无能力、外链、CLI exit1/`-- chat`、native四语言、旧历史留盘和签名/未发布边界；更新动态验收状态时须保留具体执行版本。文档准确本身不证明功能/CI已验，文档worker完成也不能代替主集成的终局退出判定。

当某项失败或没有证据，保留红例及真实版本，继续只补受影响动作；不重写旧manifest、旧PID或旧hash以冒充当前输入。源码实现已存在、历史绿色和审计文件写完都不等于整个里程碑完成。
