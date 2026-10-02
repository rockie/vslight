# M4 · 151 最终退出条件汇总

结论：**PASS_M4_ALL_EXIT_GATES**。计划[lean-core.md](../lean-core.md) M4所列退出条件均有有效证据；本记录不修改计划或M4进度状态，不据此完成M5–M8。

核对时间：2026-10-02 21:22 +1000。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；实际151源 `/private/tmp/lean-core-build151-c480juxs/vscodium/vscode`，114–139/141–151、254条prune。[逐项JSON](M4-final-acceptance151.json)保存输入、源码、actor全集、注册位置、引用文件哈希与八项判定。本次只读核查，不启动GUI或重跑已绿测试。

| M4退出条件/拆分项 | 实际证据与环境 | 判定 |
| --- | --- | --- |
| §4.1真实宿主fixture | [145+146双权限宿主](M4-final-host145.md)两轮实际exit0/passed，各89条proposed路径；stable对象、never events、幂等dispose、空模型/固定空tools、canSendRequest undefined、invokeTool异步LanguageModelError.NotFound、poison provider读取/方法/订阅0，普通Webview ping/pong与inline provider接受文本 | PASS，保留145+146真实来源；后续未改对应API链 |
| 剩余RPC全量校验有效 | 当前151实际ExtHost55/set55；MainThread60=54 decorators+6 manual，集合无缺失/额外/重复。工厂Object.values全集、MainContext Object.keys全集、manager assertRegistered及底层逐identifier检查保留。145双权限及151实际普通宿主无缺DI/RPC | PASS；不是早期65/69集合，也不把静态清单冒充直接runtime actor table |
| 普通保留功能 | [ordinary149](M4-ordinary149.md)实际编辑保存/HTML/文件搜索/Git diff-stage-commit/tasks执行停止/NPM/Welcome/Reload；[内容搜索与第三方主题](M4-search-theme149-resume.md)真实结果/AX/CSS；[149账户](M4-auth149-resume.md)双账户16动作和真实dialog；[150 SecretStorage](M4-secret150-runtime.md)即时delete/Reload/三次正常quit；普通语言、市场、Webview与profiling见下文 | PASS，各子项保留原generation；151影响另验 |
| 151 terminal普通按键与用户/第三方覆盖 | [真实四route](M4-terminal-keys151.md)：默认QuickOpen进入控件并Escape回terminal；负号覆盖交PTY0x10；第三方未追加交PTY0x05/回调0，追加交回调1/无PTY字节；144默认/24退休答案与配置实时Set核对，恢复undefined、quit0；[151真实terminal/tasks](M8-runtime151.md)另外证明shell/task落盘与停止 | PASS，可信按键独立于sendText，不以getCommands存在代替执行 |
| §9.3普通可访问性 | [151四项](M4-accessibility151.md)terminal-view/help、editor-help、hover-view，DOM/AX非空可见内容、真实appActive/onConsole且未锁屏、可信Escape关闭、正确控件焦点返回均通过，退休文案0、日志DI/RPC0、quit0 | PASS，已覆盖本次终端集合变更的实际影响 |
| 退休serializer混合状态单测 | [117恢复回归](M4-restore.md)原红14失败；新增16/同文件65通过。当前151映射与同文件测试SHA和安全149源逐字节相等；后续147–151未改它们 | PASS，不重跑未变绿单测 |
| 普通Profile恢复和数据保留 | [138十二真实恢复](M6-final-restore.md)Browser-only/混合各6、公共tabs和正常退出后SQLite；[150普通6轮](M6-storage150-regression.md)覆盖无退休/混合sticky/全退休行删除及重启；[150 Mermaid双surface](M3-storage150-final.md)source/ID/theme/panZoom/SQLite。151实际Beta silent偏好、主题CSS、禁用扩展不激活、12DB项/6文件原样保留 | PASS；Storage变化由150定向实测补齐，151不改Storage/恢复逻辑；Welcome/Shortcuts tabs不当混合恢复证据 |
| 不以空服务保留AI运行链 | 当前151生产源码已核对extHostDisabledAi只保留本地对象/数据/惰性Disposable，known退休Null服务/AI服务注册及API退休runtime imports扫描0；[151完整build](M8-build151.md)254路径物理absent、生产图/包退休0；[151实际renderer全量](M6-runtime151-audit.md)退休实体0 | PASS，稳定无能力API不是后台服务；保留普通aiEditTelemetry来源分类，不扩大字符串零要求 |

普通保留门另沿用明确的实际来源：[149 terminal/剪贴板](M4-terminal-clipboard149-resume.md)公共剪贴板往返、产品粘贴保存及PTY落盘；[144市场CLI](M2-language-cli.json)OpenVSX语言包安装、主题卸载/列表；[145德语工作台](M2-language-gui145.md)NLS/DOM/原图；[145 profiling](M5-profiling145.md)真实start/stop及有效CPU数据；[普通消费者suite](M4-consumers.md)Settings模型/renderer、手填Issue、SCM/Markers和enablement行为；[terminal受影响suite](M4-terminal.md)普通profiles/Xterm/tasks。后续patch未改变这些未重跑路径；历史四个headless基线相同超时仍留原记录，不把所有历史suite写成全绿。

## 145证据为何可沿用到151

已实读安全副本 [145冻结输入](/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build149/inputs145.json)，其generation明确为145+146。其中114–146的32个补丁哈希逐项等于151冻结manifest及当前文件，147–151的精确target均不涉及API工厂、协议、ExtHost服务、MainThread贡献、RPC实现或manager。147之后增加的两条prune仅为npmScriptLens.ts和Debug break.mp3，不涉及API/RPC。当前151的14个关键源码SHA及安全149逐字节一致，全部值和路径列在JSON；这不是把后来149源称作当时145运行源。

151冻结 `/private/tmp/lean-core-build151-c480juxs/build-inputs.json` 的SHA为 `f6fc4ff04b5b1c4828dc8c1f353f0a2bdb16affa7a5883a8d8fae2ee64fb5cd6`。本次只读重算1475输入，私有copied root与冻结manifest1475/1475一致；完整build/native noEmit的实际exit0来源保留[M8-build151](M8-build151.md)，没有在本审查重跑。

当前151普通宿主的真实无DI/RPC日志是行为补充；[Cold/Reload main/shared直接捕获](M6-main-shared151.md)由另一子任务独立记录，仍需集成人按M6全退出条件汇总。这里的55/60判定使用完整静态actor和真实宿主校验路径，不伪造运行期actor对象枚举。

M4已无实质退出缺口。M2当前两arch CI和M8分发门不属于M4退出条件；用户local-only限制不改变本条M4判定。计划/M4状态及依赖里程碑由主集成人按实施约定回写。
