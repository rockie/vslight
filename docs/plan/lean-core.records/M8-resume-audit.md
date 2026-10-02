# M8 续做审查：M4–M7 证据与当前 smoke 缺口

- 计划：[lean-core.md](../lean-core.md) §4、§5.4–5.7、V5–V9、M4–M7。
- 最近更新：2026-10-02 10:34 +1000（Australia/Sydney）。
- 状态：只读审查完成；M4–M7 整体退出条件仍未满足。当前完整 smoke 有真实红例；用户最新指令明确停止使用或修改smoke。最终149新认证验收又发现SecretStorage.delete即时回读旧值，私有调查已收尾；正式集成与验收由主线程继续。
- 代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，114–139/141–149、254 条 prune。仓库写入仅本记录和SecretStorage独立调查；未修改计划、共享源码、正式补丁、index或用户生成树。后续扩大授权的私有source/test/app/profile操作在另一记录单列，未控制GUI或浏览器。
- 事实源码与实际 149 app 的构建根：`/tmp/lean-core-build144-path` 当前指向 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk`。目录名称 144 不代表其中当前 app 仍为 144；当前 main/shared/workbench 字节与 149 运行证据一致。

## 需求、证据与继续动作

| requirement | 当前实际证据 | 判定 | 建议具体动作 |
| --- | --- | --- | --- |
| §4.1 / V6 / M4：稳定 API 本地无能力、proposed 权限、provider 零调用、普通 Webview | [145 双权限宿主](M4-final-host145.json) 两轮 exitCode=0、status=passed，各 89 条权限路径。实际两份私有 run.js/extension.js 与当前仓库逐字节同；147–149 无 API/factory/protocol 修改。当前 149 源的两侧 assertRegistered 仍在。 | 145 绿色行为证据可沿用；明确保留来源为 145+146，不能改写为 149 重跑。API 项没有新缺口。 | 保留已有证据；仅在 API/factory/protocol 或 fixture 实质改变后重跑双权限宿主。 |
| §3 / V9 / M4–M6：退休 Browser/Chat 混合状态正确恢复 | [12 恢复](M6-final-restore.json) 全部 API PASS、exit=0、forced=false、全部 sqliteChecks=true。实际 12 个复制 profile 用 mode=ro、immutable 连接读取 editorpart.state，与各 acceptance.postShutdown.part 完全相同；launch.beforeGroup 与来源 group.after.json 全同。当前 149 editorGroupModel.ts 及同文件测试与已绿恢复源逐字节同。 | 138 绿色恢复证据可沿用。两个全退休案例正常保存后状态行缺失，与记录一致；没有空新 profile 假绿。 | 不重跑已通过的 12 案例。保留合成 serializer 与普通 profile 来源说明；149 的 autoLock schema 删除没有改通用 deserialize 映射。 |
| §5.6 / V9 / M6：旧 CLI 拒绝、显式 -- 后 chat 文件打开 | [真实 chat 文件](M6-cli-file.json) 保留正常 exit0、真实 activeTextEditor URI/内容/dirty=false；149 [静态 smoke](M8-build149.json) 的实际日志仍含 chat/add-mcp exit1 PASS。147–149 未改 CLI 参数链。 | 已绿且未受改动影响。 | 沿用旧真实同名文件及149两条拒绝证据；不重复宿主或静态 smoke。 |
| V7 / M4：普通 edit/Git/tasks/NPM/Welcome/Reload | [ordinary149](M4-ordinary149.json) 与私有落盘响应包含 edit/save/search、两次 Git commit、task 执行/停止、NPM provider 文件证明、SecretStorage 和唯一 Reload。实际 main/shared/workbench SHA 分别为 2a407501…、87b88f7e…、ca30c3f3…，与启动和 runtime 捕获证据相同。 | 这些子项通过；真实终端输入/完整原生焦点与完整 smoke 另有红项，不能由 fixture 命令替代。 | 保留已绿子项；按用户最新指令停止smoke，主线程维护完整保留面验收与原计划门的对应关系。 |
| V7 / M4：普通 auth/session/secret | 原 auth 私有根的 auth-live-01–06 已绿。当前 auth-live-07 两份 response 为 PASS，实际 provider-createSession 发生在 2026-10-01T23:49:03.231Z，createSessionDelta=1；response mtime 为 23:49:03.236Z。随后旧 exthost 在本地09:49:06.036收到 renderer terminate、.039以0退出；main在.040确认65169退出0。 | 原快照中的“auth-live-07 RUNNING”已经过时。Alpha 创建 API 子项已完成，但没有本次 Allow 原生走查新证据，双账户/reuse/sign-out/unregister 仍未完成。ready/state 是历史文件；主线程另核实原62872/19480已不存在。 | 归档本次 Alpha 创建 PASS与正常宿主终止。旧 provider sessions仅内存，不能向旧根写下一请求；主线程在独立149宿主重建完整双账户、复取、真实Sign Out链路并收尾日志。 |
| §9.3(7) / V7 / M4/M8：四类 Accessibility 内容、关闭、原生焦点返回 | [149 A11Y](M4-accessibility149.json) 的四项真实DOM/AX内容、限定Escape和逻辑控件返回已绿；完整native focus明确blocked。 | 内容子项可沿用，完整原生门尚未通过；DOM hasFocus 不足以证明系统前台。 | 用冻结fixture在解锁且实际ownapp前台时补四项完整门，保留appActive/console状态、DOM/AX内容尺寸、Escape和返回控件。 |
| V5/V9 / M5：系统外链与旧 Simple Browser fallback | [145 外链](M5-external-links145.json) 16/20 有实际 Chrome 原URI相等回执及产品Browser tab空；未通过的4行均为terminal-visible/terminal-osc8各自的0.0.0.0与example.com。原私有app/server均已正常结束，不能向其旧会话继续发送。 | 16条是真实145证据，可沿用未变链路；4条仍未验，native trust dialog只属推断。 | 建新隔离149链接会话，仅续4行；实际观察终端link控件与系统确认，验收浏览器收到完整原URI、不产生内置Browser tab。若有trust sheet，先记录真实sheet/button/URI，不沿用推断。 |
| V7 / M5：普通 extension-host profiling | 实际 cpuprofile 文件仍存在，16,365,536B，SHA与[M5-profiling145.json](M5-profiling145.json)相同；实际解析70 nodes、1,021,093 samples和timeDeltas，endTime>startTime。147–149未改profiling/CRI。 | 实际start/stop与有效CPU数据通过；native Save并非本项已验。 | 沿用现有真实采样证据，不重跑旧绿profiling。 |
| V6 / M6：renderer/main/shared运行注册与DI/RPC | [149 runtime](M6-runtime149.json) Cold/Welcome/Reload真实枚举与[main/shared](M6-main-shared149.json)24/17 channel、23退休通道零命中已落盘。当前实际三份JS字节仍同。此次按记录的六类regex重新只读扫描20个实际文本log，六类均0；19 warning/5 error保留原分类。 | 已绿运行实体子项仍有效。main/exthost在正常Quit后各增长98/180B；不是记录hash失效后出现新的DI/RPC异常，也不能宣称全级别日志零。 | 不重启旧runtime profile、不重复已绿捕获；新完整smoke/认证/外链完成后仅核对其新日志。 |
| V8 / M7：全序重放、全图编译、生产图、包三布局、prune闭包 | inputs149含201输入，全部存在；只有check-lean-runtime.py与external-links-cdp.mjs两个已记录的validation helper差异，所有生产输入与构建清单同。真实build149-exit.json为exit0、653,728B构建日志保留；noEmit日志0B。实际production-graph149重新计数146名/199出现、problems=[]、退休包=[]；package149-final.json与仓库M7-runtime149.json完全相同。当前254 prune路径无重复/父子重叠，实际149 source中全部不存在。remote真实summary/commands仍有离线ci及npm ls exit0、110名、118物理包目录、192,066,255B；其忽略scripts边界保持。 | 构建与生产闭包绿色证据仍可沿用；没有发现要求重新build/install的生产差异。M5/M6前置及完整smoke未齐，M7仍不能完成。 | 只推进缺失运行门。root/remote安装、完整构建、prune故障注入已绿且无相关变化，不重复。 |

## 当前完整 smoke 的真实红例

主线程本轮使用 `/tmp/vslight-smoke.7pUA1q`，并已核实私有app消失。该目录保留app-launch.log和profile日志；本子任务未运行完整脚本、未接触GUI。随后实读主线程保存的 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-resume149-pzgqgcap/smoke-first-result.json` 为exit2，stdout的最后两项为终端文件未落盘FAIL和frontmost abort；没有完整汇总。本轮不能通过。

当前实际 a.txt 已有 edit和clipboard文字，证明前两段输入/保存链路确实执行。其未保存备份 `user-data/Backups/3610f506326c0888a10deb19d0b0113f/file/2d862409` 第一行明确指向 `file:///tmp/vslight-smoke.7pUA1q/ws/a.txt`，正文在edit/clipboard文字与原hello vslight之间包含：

```text
·投产‘/tmp/vslight-smoke.7pUA1q/ws/term-proof.txt'&& 恶臭TERM啊OK啊啊恶臭TERMaFAIL
```

这是终端proof命令进入文本编辑器后被IME转写的实际备份内容。term-proof.txt不存在，terminal.log和tasks.log均0B。它证明发送proof命令时没有把输入交给终端；零字节terminal.log本身不单独证明服务故障。

当前 [smoke.sh](../../../dev/smoke.sh) 的对应路径为：require_frontmost只检查应用PID的isActive（321–325）；term_toggle发送Ctrl+物理key50（438–440）；随后固定sleep5，再通过type_str进行字符串字符注入（459–462）。[ui-driver.swift](../../../dev/ui-driver.swift) 的frontmost也只检查app.isActive（27–28），没有验证活动终端控件。应用前台并不保证xterm聚焦。

可以确认的失败边界是“终端toggle到终端控件就绪/聚焦”之间。为什么Ctrl+key50未把焦点交给终端仍需最小复现；现有证据不能裁定为快捷键被IME吞掉、快捷键布局映射、面板未打开、用户中途切换或窗口关闭。app-launch/main/exthost日志截至现场读取均无正常Quit/宿主终止行，不能仅凭进程后来消失把责任归给用户关闭或产品崩溃。

用户随后明确“smoke有问题别用”，因此不再运行、修改或依赖该脚本开展后续验收。本节仅保存停止前的真实红例。原计划完整smoke门尚未满足；主线程负责记录用户覆盖指令及替代验收与原退出条件的对应关系，不能把fixture executeTask绿直接计作完整门通过。

## 最终149认证新增红例

主线程用新独立root `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-resume149-pzgqgcap/auth` 执行冻结auth fixture：store v1、真实Reload至新宿主、read v1、update v2通过；delete Promise结束后立即get仍返回合成v2，实际FAIL。该失败发生在本记录表中的旧138绿例之后，不能用旧绿覆盖它。进程已由controller.finally终止。只读调用链/基线调查、原类最终红5/7（初轮红4/5保留）、单引用候选边界红1/7及Set候选绿7/7见 [SecretStorage删除调查](M4-secret-delete-investigation.md)。随后授权的四个独立149仪器副本均真实Reload到新host并正常Quit0；两轮实际trace确证main旧v2广播在local delete后回灌cache，但即时get分别早1/2ms而PASS，不能据此覆盖原红或计最终接受。正式补丁与完整session/双账户门仍未交付。

## 实际核验命令与边界

本轮使用`git status --short`、`git rev-parse HEAD`及相关计划正文/记录定向读取；未默认加载全部历史日志。审查阶段使用只读Python完成以下检查，未重新执行已绿测试；后续新Storage候选的必要红绿及44个相关既有suite另列在独立调查：

1. `json.loads`读取inputs149、build149-exit、production-graph149、package149-final、12份acceptance与当前auth response/state；对201个实际输入计算SHA256并与清单对比。
2. 对两份实际私有API fixture与当前run.js/extension.js作字节比较；对实际149和已绿恢复source/test作字节比较；逐项验证254路径无重叠且在实际source不存在。
3. 12个profile通过`sqlite3.connect('file:'+db+'?mode=ro&immutable=1', uri=True)`，只读`ItemTable`的`memento/workbench.parts.editor`，与各postShutdown.part比较；只读取该恢复key，不读取账户/secret。
4. 重算production JSON依赖图与六类当前20个文本日志regex计数；读取cpuprofile真实内容/hash；只读当前smoke的脚本、a.txt和独立profile备份。

审查表中的旧宿主退出结论依据日志，活PID/listener由主线程核验，不能从ready文件推断。后续额外授权的SecretStorage诊断由本子任务在独立app/profile后台controller执行，使用真实Popen.poll与wait结果；没有focus/全局键鼠/浏览器控制。完整smoke按用户指令停用。

## 150补丁与原生Chrome回执模式独立审查

审查时间：2026-10-02 10:38 +1000。仅只读patch/helper，未运行已有suite或浏览器。

[150补丁](../../../patches/150-light-storage-external-write-order.patch)去除一行why注释、归一化hunk行号后与私有最终candidate.diff逐字相同；行为与7回归未改，Set按request身份清理及失败后接收边界保留。正式150构建仍进行中，这项静态审查不是新app接受。

[外链helper](../../../dev/test-fixtures/lean-core/external-links-cdp.mjs:175)的可选native-chrome保留actual URL与原始URL逐字比较、唯一匹配、超时/异常不接受，以及产品退休Browser tab非空即失败。AppleScript是固定源码，完整URL作为execFileSync独立argv传入，未拼进代码或shell；无activate、navigate、edit、close操作。

存在新tab证据缺口：knownTabs只从先前有chrome.tabId的成功回执加载（242–250），未在当前click前快照实际匹配tab。旧点击已经开Chrome但bridge active回执失败时，旧tab ID不在knownTabs；下一次CDP click dispatch成功而真实route未新开tab，native查到该旧exact URL tab仍可被197行计为新tab PASS。建议每次click前仅对该exact testURL只读取全部tab IDs，回执必须是快照之外唯一新ID，并保留完整URL/Browser负向断言。当前helper可证明地址相等，尚不能独立证明该tab由本次click新建。

后续修正复核（2026-10-02 10:41 +1000）：上述旧tab缺口已关闭。nativeChromeTabs(url)返回全部严格匹配URL的tab/window IDs；267–270行在本次click之前保存chromeTabsBeforeClick并加入knownTabs，读取/格式错误在dispatch前即FAIL。204–207行只接受已知集合之外唯一新ID；完整URL逐字检查、Browser tab非空负向断言和固定脚本独立argv边界保留。未重跑既有UI回执；主线程将此前三项首次点击的不同surface/index原生回执与第一项用户+只读地址确认分列，原自动超时FAIL保留。
