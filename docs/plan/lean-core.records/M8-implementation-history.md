# M8 · 历史实施阶段记录

以下保存149完成前的阶段记录；当前结论见 [M8](M8.md)。历史暂停/失败/中间尺寸不代表当前状态。各阶段产物分别见 [138账](M8-artifact138.json)、[144账](M8-artifact144-beforemeta.json)、[145账](M8-artifact145.json)。

# M8 · 集成构建与实机验收

- 计划：[lean-core.md](../lean-core.md) M8/V10；最近更新：2026-10-02 03:21 +1000。
- 状态：进行中；dirty@f1961b7546139a6aa722ff0b8a001296d3041e33。持久输入为114–138补丁、prune/product/prepare/build、资源helper和smoke；用户vscode生成树未修改。
- 隔离构建根：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev`；指针 `/tmp/lean-core-final-build-path`。上游/Node/Electron/版本和ZIP条件与[M1](M1.md)相同。

## 实际验证

| 退出条件 | 命令或走查步骤 | 环境/代码基线 | 结果与证据 |
| --- | --- | --- | --- |
| 全图类型与干净实际构建 | native tsc --noEmit；隔离repo ./dev/run-build.sh -s | Node24.18.0/npm11.16、arm64、Electron43.7.5 | 全图tsc exit0，日志零行；第二次完整构建exit0/compile-src零错误。第一次JSON动作重放exit5，proposal数据移出动作JSON目录后修复 |
| 生产package/out | dev/check-lean-runtime.py --app 实际app | 真实asar/unpacked/node_modules | 原检查exit0，零退休包/out/扩展，六普通包与12入口保留；启动证明仅asar内semver不够，收紧后的137app明确exit1。138重新packing后的正式app检查exit0，证据 `/tmp/lean-final-runtime138-report.json` |
| 静态/CLI smoke | ./dev/smoke.sh --app 实际app --skip-ui --keep | 私有profile/workspace/extensions/shared-data | 137产物exit0；新chat/add-mcp均拒绝并exit1，版本/Electron/地板/普通扩展安装通过。只覆盖L1/L2，未冒充完整UI门 |
| GUI启动根因 | 私有测试进程sample、诊断副本入口包装提取异常 | 137原app和诊断副本 | 原app进入NSAlert；异常ERR_MODULE_NOT_FOUND semver。只补物理semver后编辑器与普通扩展宿主启动；诊断副本不计正式宿主验收 |
| 精确修复与正式packing | 138独立apply/check/reverse-check、逐字节比对；复用未变编译输出运行min-packing和资源helper | 138只改打包copy | 独立重放、实际packing/helper均exit0；不重复未影响源码测试。正式宿主/UI/profile待验 |
| 同条件app/ZIP账 | 普通文件长度总和；ditto -c -k --sequesterRsrc --keepParent | 未签名；相同基线 | 基线528,142,131 B/192,738,926 B；137app407,549,783 B、1130files，ZIP152,552,665 B。137有启动缺陷，只记中间体积；138最终账待刷新 |
| 完整UI、旧profile、原生fallback、图表/普通editor | 既有fixture与smoke，只补未验或受影响项 | 单一私有GUI会话 | 未完成；旧绿且未影响的slice测试沿用 |
| macOS双arch CI、签名/公证/staple、文档 | 计划既有流程 | 未发布、未推送 | 未执行，不宣称分发可用 |

## 启动根因和接续

136误把semver物理副本与退休sandbox subprocess专属copy一起移除。semver仍在生产manifest和asar，普通update服务却在main.js静态ESM导入它，早于ASAR resolver安装。138精确保留物理copy，专属sandbox/Zod/socks5副本仍删除；检查器增加main_process_esm_package约束。[138补丁](../../../patches/138-light-main-process-semver-copy.patch)为632字节，SHA256 `1f5edc120cca8f54a6cfdc094417ce7d0adc7cffddff31ee9f29e865c63eae81`。

137原app在构建根raw-before138，原ZIP未覆盖。接着执行正式app两权限真实宿主和旧profile恢复，不使用诊断wrapper。runner显式携带LEAN_TEST_WORKSPACE/RUN_ID/PROPOSALS，fresh结果必须匹配本轮ID；之前缺runner环境的诊断启动不算API通过。

最新正式结果：[两权限宿主](M4-final-host.md)与[12旧profile恢复](M6-final-restore.md)均通过；[UI分段](M8-ui.md)只修正Debug分类OCR误判后全部项绿，保留第一次exit2历史，不冒充单次完整smoke。资源图标、使用、兼容、升级、发布与README六文档已同步，仍需按未验门补最终事实。138[同条件产物账](M8-artifact138.json)为407,625,179 B、1182files、ZIP152,619,148 B，较基线减少22.82%/20.82%；未签名、不代表分发完成。

[显式--同名chat文件](M6-cli-file.md)正式CLI与宿主通过，文件内容未改，普通文件路径没有被退休命令拦截。

用户于2026-10-02 01:11 +1000要求暂停并更新进度。测试进程已正常退出，三个worker已停止；可访问性初probe没有出现视图，不算通过。所有未完成工作、证据与后续入口见[M8-next-session](M8-next-session.md)，等待新对话继续。

2026-10-02新对话续做：[普通可访问性](M4-accessibility.md)四项通过，新增ui-driver修复smoke同名进程的错误定位；Mermaid独立editor addon缺口已复现，139候选正在私有源码修复。此前暂停已解除，后续范围仍按原计划。

本轮139/141–144和244条prune已集成：主私有源码全图native noEmit exit0、`/tmp/lean-core-typecheck144.log`为0 bytes。新的全构建根为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk`，指针 `/tmp/lean-core-build144-path`；独立克隆源已reset至冻结上游，node_modules由该目录自行安装。输入hash冻结在该根`inputs.json`，运行`./dev/run-build.sh -s`，日志`build144.log`；构建结果未出，未预填通过。此前138 app保留供同一认证请求续做，不被新构建覆盖。

02:45续做结果：[build144](M8-build144.json)完整prepare/compile/packing、全图noEmit通过，包checker、146名199项实际production graph和静态/CLI smoke56项通过。实际unsigned app422,528,282 B/ZIP157,554,736 B，比基线减少20.00%/18.25%；历史138账另存[M8-artifact138](M8-artifact138.json)。[独立签名链](M8-sign144.md)通过strict codesign、spctl、Apple Accepted、staple/validate和ZIP CRC，凭据已清理。

收尾偏差：144包仍含无运行消费者的voiceWsUrl；checker真实红exit1精确命中该键。prepare增加删除、checker/smoke增加断言后，复用未受影响编译输出重新packing，144-meta1实际包checkerexit0。旧unsigned原件已保留于`raw-before-voice-meta`，旧签名副本不改。另发现editor.aiStats.enabled及git.addAICoAuthor旧监听可启用AI统计状态栏/内部命令，145候选在独立源码处理；普通inline遥测保留。最终输入改变后重新干净构建、计量并签名，不把144的绿替代145最终门。

当前锁屏：真实认证已完成六请求与Reload，PID62872的auth-live-07仍等待Allow；详见[M4-auth-runtime](M4-auth-runtime.md)。等待用户解锁期间只推进独立源码/构建；32项Mermaid headless不是产品UI验收，注册表旧探针误发serialize的日志也不作为clean logs证据。最终产物须fresh profile重新验新增API、Git、Welcome和unification注册闭包，并执行受smoke驱动变化影响的完整单次门。

## 最终145+146输入

最近更新：2026-10-02 03:21 +1000。[完整构建](M8-build145.json)exit0、全图noEmit0 bytes、252条prune和57项L1/L2静态smoke通过；[145 unsigned账](M8-artifact145.json)为422,493,299 B/1200普通文件，ZIP157,545,677 B，比冻结同条件基线减少20.00%/18.26%。[最终签名链](M8-sign145.md)strict/spctl/Accepted/staple/CRC通过，旧144签名原件保留。

[双权限真实宿主](M4-final-host145.md)89条退休路径和普通inline行为通过；[普通真实宿主](M4-ordinary145.md)Git/tasks/HTML/保存/搜索/SecretStorage通过。fresh renderer冷态与Welcome全部注册表已捕获；main/shared读取和实际产品Mermaid矩阵继续。原生GUI、auth同一Allow、完整单次smoke与当前输入双arch CI未齐；仅M1完成。后台运行不会取消或覆盖原auth会话。

2026-10-02 03:47 +1000 实际矩阵与运行发现：Mermaid32项DOM/CSP绿，[逐张截图审计](M3-product145-matrix.md)发现4个editor错误长行裁剪；两暗色ZenUML白底是冻结addon原有固定SVG配色、可读，未破坏主题链。33交互绿，但真实正常重启后source模板缩进被存回导致ID变化/逐轮空白增长，148将精确修HTML原source保留，不能放宽恢复门掩盖。全量运行注册表另发现Notebook/Debug专属schema/NPM Debug消费者/退休Notebook菜单残留，147精确闭包进行中；这些新输入会重建与重签，145证据保留为中间输入。

[M5 profiling](M5-profiling145.md)实际采样/停止通过；[main/shared](M6-main-shared-probe.md)cold/reload 24/17 channels、23退休名称0、4普通utility和DI/RPC0。旧测试driver持久reload请求重放导致历史tasks日志碰撞；消费请求/原子写已修，最后单次Reload区间无warning/error，最终fresh profile再验完整clean logs。原认证Allow仍未触碰。
