# M8 · 151 本地最终验收与未验 CI

计划：[lean-core.md](../lean-core.md) §9.1–9.4/§10。最近更新：2026-10-02 21:38 +1000。状态：**必要本地验收全部通过；当前输入两arch CI未验，M8保持进行中**。M1/M3/M4/M5/M6/M7已按依赖次序完成，进度6/8；M2也只剩两arch CI。代码基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，上游08d4889f9ec4a1685d257b9b95de036c8e1ce1e5，114–139/141–151、254条prune。

| 原验收项 | 判定 | 实际覆盖与边界 | 证据 |
| --- | --- | --- | --- |
| V1 | PASS_LOCAL | 65文档非icon字段/URL关联保持、唯一主图标有效；149四语言/实际文件打开与150 Finder/Dock/关于原图通过。151实际资源不变。 | [图标实机](M2-icons150.md)、[原生GUI](M2-native-gui149-resume.md)、[151实账](M8-artifact151.md) |
| V2 | PASS_LOCAL | 151实际三布局无Codicons demo，CSS/TTF/license保留；149普通Explorer/terminal/theme/Markdown/Mermaid图标实机通过。 | [151完整包检查](M8-build151.md)、[M4保留面汇总](M4-final-acceptance151.md)、[M3矩阵](M3-product149-runtime.md) |
| V3 | PASS_LOCAL | 149两surface×两theme×8case共32原图/33交互；preview同条件下降27.86%，普通独立editor/缩放/复制/语法错误有效。150 Storage变动后双surface真实退出重启的source/ID/theme/panZoom/SQLite精确保持。151只改terminal.ts。 | [M3](M3-mermaid.md)、[150定向持久化](M3-storage150-final.md)、[151源差异](M8-build151.md) |
| V4 | PASS_LOCAL | 资源白名单及引用、四locale base/16Framework variants有效，真实en/zh-CN/zh-TW/fr GUI和7资源选择/fallback；普通德语工作台/语言包安装保留。两arch CI另列未验。 | [M2](M2-resources.md)、[德语](M2-language-gui145.md)、[语言包CLI](M2-language-cli.json) |
| V5 | PASS_LOCAL | Browser/Simple Browser/Playwright模块、IPC/preload/生产包移除；20实际外链覆盖四surface×五类base及完整编码URI，旧opener配置保留。151完整native菜单424节点、13快捷键、标题栏/Welcome和全量注册退休0。 | [M5](M5.md)、[151GUI](M8-runtime151.md)、[全注册](M6-runtime151-audit.md) |
| V6 | PASS_LOCAL | 双权限实际宿主§4.1各89路径、provider/handler0；当前ExtHost55/MainThread60全集及assert路径保留；151renderer全注册、main24/shared17 Cold/Reload实际退休0，正常host替换，无专属utility/background/download。 | [M6](M6.md)、[完整API/RPC审查](M4-final-acceptance151.md)、[Cold/Reload](M6-main-shared151.md) |
| V7 | PASS_LOCAL | 编辑保存、文件/内容搜索、Git diff-stage-commit、语言/主题、市场装卸、账户与secret、普通Webview消息/profiling实际证据齐。151 shell/task落盘停止、四真实按键route/用户覆盖、四DOM+AX A11Y内容/焦点、theme/禁用扩展与账户偏好退出重启通过。 | [M4全保留面](M4-final-acceptance151.md)、[151真实键盘](M4-terminal-keys151.md)、[151 A11Y](M4-accessibility151.md)、[151 runtime](M8-runtime151.md) |
| V8 | PASS_LOCAL | 151真实全补丁+254prune prepare/完整compile/packing exit0；native全图noEmit exit0/0B，实际root production146名/199出现/problems/退休0、三布局与普通copy通过；remote重跑离线ci/ls0。资源helper27、checker12与失败/幂等行为原来源沿用。两真实prune注入exit4并中止，254无重叠。 | [M7](M7.md)、[归档构建日志](M8-build151.evidence/build.log)、[prune注入](M7-prune151.md)、[helper回归](M8-crc-static-final.md) |
| V9 | PASS_LOCAL | Browser/Chat混合12实机恢复、150普通/混合/全退休6轮与Mermaid定向恢复；15112DB键/6文件、账户偏好/主题/扩展状态原样保留。最新两CLI可读拒绝exit1，version/help0；显式--后chat文件真实打开沿用未变CLI原来源。 | [混合恢复](M6-final-restore.md)、[150恢复](M6-storage150-regression.md)、[151数据](M8-runtime151.md)、[CLI151](M6-cli151.json)、[同名文件](M6-cli-file.md) |
| V10本地体积/分发 | PASS_LOCAL | 同条件unsigned app422,443,727 B、ZIP157,530,299 B，下降20.01%/18.27%；Electron43.7.5/macOS12不变。独立151 strict codesign/spctl/Accepted/staple/validate/ZIP CRC及内容全量比对通过。signed app421,985,205 B/ZIP157,386,282 B独立计量；实际运行后1223文件/链接不变。 | [151实账](M8-artifact151.md)、[151签名链](M8-sign151.md)、[运行后全量复核](M8-post-runtime-payload151.json) |
| V10/M2/M8当前两arch CI | UNVERIFIED | 当前输入arm64/x64 CI未运行。用户明确仅本地、不提交/推送/触发CI或Release；旧CI、本地arm64构建及workflow语法绿不替代。 | [当前CI审查](M8-ci-resume-audit.md) |
| §9.2替代验收 | PASS_LOCAL | 按用户指示不运行/修改smoke。实际包/CLI、真实host/公共API和限定PID/renderer GUI逐项覆盖原保留面及负向断言；原远程/Debug/Notebook/Copilot、telemetry/rg负向断言保留。相关静态输入未变、受151影响的terminal全部另验。 | [计划§9.2](../lean-core.md)、[149静态原结果](M8-build149.json)、[M4汇总](M4-final-acceptance151.md)、[M6](M6.md) |
| 六文档/语法/升级说明 | PASS_LOCAL | README/兼容/语言使用/图标/迁移/发布说明逐项核对；AI无能力返回、第三方AI/opener、CLI、数据保留、四原生locale、151unsigned/signed账与未发布界限准确。JSON/bash/actionlint实际绿，生产/helper/workflow无漂移；最终文档和进度检查另归档。 | [文档审查](M8-docs-final-audit.md)、[最终检查](M8-final-validation151.json)、[最终输入核对](M8-final-input-audit151.json) |

旧代证据沿用的依据是对应生产路径未变，不改标为151执行。151只相对150改变terminal.ts默认skip-shell集合，已经另跑真实键盘/覆盖、terminal/tasks、完整可访问性、注册表和正常退出持久化。150 Storage变化对应的Mermaid与普通恢复已真实定向重测，未用旧149矩阵替代。

[机器可复核汇总](M8-final-local-audit151.json)固定证据哈希。[原始151构建、生产图、包、输入及noEmit](M8-build151.evidence/build-inputs.json)已从私有根归档；签名/运行/键盘/A11Y/main-shared原始日志与红轮各保留在相应evidence目录。历史四个headless基线同样超时、既有disabled developer clear、驱动时序和沙箱签名红例保留，不宣称每个历史suite零skip/failure。必要最终退出路径按§9.2替代门均有实际通过证据。

本地签名载体：[VSLight.app](/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app)、[signed ZIP](/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight-151-signed.zip)。未替换/打开用户installed app，未改用户profile、输入法或TCC；测试由公共quit正常退出，owned进程/端口释放。两后台审查任务已完成。

后续动作仅为当前生产输入的既有macOS arm64/x64 CI验收；当前用户的仅本地限制下不执行，也不再次请求同一授权。M2/M8及总目标不能记完成；未提交、推送或发布。
