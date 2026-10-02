# M6/M8 · 正式138运行注册表枚举

真实138产品注册表仍有15个退休菜单项，并且普通 Welcome walkthrough 服务缺失。本轮提供真实运行对象的红证据与可重复 helper；142/144候选的类型检查或源码回归不代替重构建后的运行验收。

## 对象来源与方法

- 对应 [lean-core.md](../lean-core.md) §5.4、§9.3(6)、M4/M6/M8；根基线 dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，产物为114–138未签名 arm64 app。
- 捕获：2026-10-01T15:47:44.377Z；正式主进程PID6084，隔离根 `/private/tmp/ordinary138b-3n3pk6ty`，CDP19480。真实用户 app 与生成树未改，worker未启动 GUI 或执行 UI command。
- [registry.mjs](../../../dev/test-fixtures/lean-core/registry.mjs) 检查 workbench URL 所属实际 app、唯一已加载 main ES module、加载源码与磁盘 SHA256 相等。仅用完全相同的已加载 URL 取得缓存导出 main；新增解析 module 数为0，没有调用 main、cache bust 或导入独立源码。
- 对 main 的 `[[Scopes]]` 读取 Module scope，通过 actual bundle 标记定位绑定，再验证方法与数据结构身份；keybindings 对象还要求与 Registry.as 返回对象相同。Ae/Pe/re/se/k/eet/afs/mVi 是本包经验证的结果，不是供下一包盲用的固定名字。
- 读取全部 commands、settings/excluded、default keybindings、所有 MenuId（含空项）、containers/views、viewsWelcome 的原始 SetMap，以及现有 walkthrough 的完整 collection/steps，不以可见 context 筛选。现有 Workbench ServiceCollection 与 renderer ChannelServer 由验证原型 queryObjects 取得；不调用 DI.get 或 channel.call。
- 完整关键注册元数据、所有ID/条件、services/channels/process/log hash 保存在 [M6-runtime-registries.json](M6-runtime-registries.json)。原始捕获目录 `/tmp/lean-registry138b-20261002`；持久JSON去掉 view ctor 参数中的服务对象图和重复配置schema，不把服务内缓存NLS当注册入口。

## 枚举结果

| 集合 | 数量 |
| --- | ---: |
| commands / command metadata | 2139 / 889 |
| settings / excluded settings | 1575 / 10 |
| default keybindings | 970 |
| MenuId / 有内容的菜单 / 菜单项 | 286 / 141 / 2417 |
| view containers / views | 9 / 39 |
| viewsWelcome IDs / 条目 | 4 / 32 |
| singleton descriptors / 现有 Workbench | 247 / 1 |
| 现有 renderer ChannelServers | 3 |
| walkthrough descriptor / instance / step | 0 / 0 / 0 |

| 真实残留或保留项 | 处置与证据 |
| --- | --- |
| ChatInputResourceAttachmentContext 4项、ChatInlineResourceAnchorContext 5项、ChatAttachmentsContext 5项、InlineChatEditorAffordance 1项 | 即使不可见也是实际注册。内容为 open/copy/reveal/Finder/QuickFix 普通 action 在退休 context 的入边；142删除15项，普通action仍保留 |
| secondarySideBar.defaultVisibility 的 agent sessions 文案、extensions.allowOpenInModalEditor 的 MCP 文案 | 实际settings schema仍含退休说明；142删除文案及相关启动布局 override |
| Help 的普通 Get Started with Accessibility Features action存在，openWalkthrough命令/服务不存在 | 普通保留面失败；142恢复 ordinary Welcome、Accessibility walkthrough与editor playground及精确媒体资源，实机尚待验收 |
| inlineCompletionsUnificationService | singleton与实际ServiceCollection均有；144解绑状态RPC、实验/迁移服务和旧设置消费者，详见 [M4-inline-unification.md](M4-inline-unification.md) |
| aiEditTelemetryService | singleton仍有，是普通第三方inline provider的show/accept遥测消费者。144保留并做实际双侧源码回归，不按AI名字误删 |
| editor.aiStats.enabled | 138实际schema与144源仍注册；开启后会构造AiStatsFeature和AI Usage Statistics状态栏，是独立于普通遥测的AI专属UI候选。已报主线程精确撤schema/feature入边；默认false不能替代§5.6/§6入口删除 |
| _aiEdits三条内部命令与git.addAICoAuthor | 实际存在，消费第三方inline接受的Git attribution；归属须由主线程按普通消费者与AI入口标准收口。未擅自整删editTelemetry或假定所有AI字样均可保留 |
| extensions.actions.searchByCategory.Chat、Markdown条件中的prompt/instructions/chatagent/skill grammar | 普通市场搜索和普通文档编辑条件，不等同于退休 Chat service 的command注册；纯MenuId常量也与真实items分开记 |
| views及containers/viewsWelcome | 未发现退休实体注册；持久JSON含全ID/条件。宽泛字符串命中不能替代实体判断 |
| 注册元数据的command链接 | 剔除服务参数缓存NLS后38个链接位置，全部目标存在；未发现退休command链接。原raw scanner另报4个缺失sync链接，均来自同一缓存NLS字符串的不同服务图路径，不能写成实际walkthrough链接 |

renderer的已注册逆向channels为 userDataSyncUtil、extensionRecommendationNotification、remoteResourceHandler、urlHandler，另有普通文件watcher ChannelServer；pending全为空。main/shared-process 的server注册表不在 renderer CDP上下文，本次没有直接枚举它们。

PID6084的实际后代树共8个进程，未见具名MCP/speech/agent worker。通用 Electron NodeService 命令行不能辨认所有utility角色；单次进程快照也不能证明未来无下载或无后台。最终仍需结合源入口、生产包、cold/reload logs与运行区间证据。

## 探针错误和证据边界

初版serializer沿view ctor参数进入了通用RPC proxy，用 value.serialize/evaluate/keys 读取判断表达式；proxy把任意方法当函数，误发serialize RPC。138b renderer log保留12条 Method not found: serialize；它们来自本探针，不是被删服务的产品DI错误。该profile不能用于声称clean logs，原始错误没有删除。

helper现已将ctor服务参数作为opaque描述，仅用own/prototype数据描述符识别本地表达式方法，避免触碰proxy getter。针对RPC proxy的回归证明getter读取0、调用0；本地表达式仍正确序列化。后续实际module复验只证明修复探针的增量行为，最终cold/reload必须使用fresh profile。

一次旧PID复验尝试在末尾被拒绝：PID6084已退出，19480已由主线程的认证会话接管。同一app/module hash不能证明同一测试会话；该尝试整体失败，不接受为138b重放。现已把权威检查前移到任何HTTP/CDP Runtime/Debugger之前：endpoint/output/expected-app/pid/profile-root/expected-port六参数全部必填；PID实际CFBundleExecutable、user-data-dir realpath、remote-debugging-port参数及监听socket持有者须一致。末尾再次核对身份，output目录必须为空以免混合证据。profile-root必须是实际user-data目录本身。

新增前置失败回归：缺PID、expected-port不匹配、旧PID退出均exit1，并且没有创建output目录，没有fetch/CDP或接触活窗口。结果及helper hash已写入持久JSON。[TODO] 正确新实机会话的全helper复验由主线程统一启动后执行；本worker没有接管认证窗口。

[TODO] 最终app重新枚举：15菜单为0、退休设置文案无、unification singleton/运行链无，ordinary walkthrough真正注册，AI statistics UI候选及共享attribution归属已收口；配合实际Welcome/Keyboard Shortcuts/菜单走查和四类可访问性。fresh profile cold/reload须独立确认无Unknown service/Missing proxy/customer异常；补main/shared channels与背景角色证据，不能用renderer范围的空结果代替全进程证明。最终144 product仍有无消费者的voiceWsUrl退休voice endpoint metadata，已给主线程prepare删除候选，未把纯metadata当活voice服务。
