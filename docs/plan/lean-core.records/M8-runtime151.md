# M8 · 151 实际运行、菜单与普通持久化

计划：[lean-core.md](../lean-core.md) M4/M5/M6/M8、V5/V6/V7/V9。最近更新：2026-10-02 20:53 +1000。状态：本运行子门通过，完整里程碑仍进行中。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；最终114–139/141–151与254条prune。未修改产品输入、用户生成树、installed app或原用户profile，未运行smoke、提交、推送或CI。

实际应用为已独立签名公证的持久151载体 `/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app`。本轮main25607、host26830，controller持有自己的子进程退出Promise；正常Quit实际exit0/signal=null，退出后这两个进程均不存在。四个签名产物文件与真实loaded workbench身份冻结；workbench SHA-256为 `4c164bd9abb2d7c32913b942d0ee35fd60d6b572e4d1e9c1b69919f2877e8496`。

[机器结果](M8-runtime151.json)、[完整归档证据](M8-runtime151.evidence/resume151-summary.json)包含原始注册表、菜单树、DOM、截图、控制器、独立fixture、实际落盘文件与日志。以下只证明本次覆盖范围，不以控制器的PASS子集代替M8全部验收。

| 退出条件/子门 | 实际步骤 | 环境/基线 | 结果与证据 |
| --- | --- | --- | --- |
| 150正常退出与新151宿主 | 历史parent真实wait150，再独立151进程冷启动；本轮controller拥有main与exit事件 | 隔离ui/u、ui/e、ui/w，151 signed app | PASS；150历史真实exit0；本轮main/host与150及两次失败151均不同，正常退出0 |
| 普通账户偏好/主题/禁用扩展 | 公共silent getSession未显式指定账户；实际CSS五项；精确禁用扩展列表与activation marker | 合成Alpha/Beta账户，One Dark Pro 3.20.2 | PASS；选择Beta，create/remove均0；主题颜色逐项相等；禁用扩展唯一实际ID正确、host不可见且未激活。theme/Welcome/terminal三截图已查看 |
| 不清理旧数据 | Quit后只读SQLite/file检查 | 私有合成旧历史/凭据/配置与状态 | PASS；12数据库项、6文件精确相等；冷启动前和正常退出后均通过，不返回token值 |
| 原生完整菜单 | 限定main25607的只读AXMenuBar递归采集 | Ghostty授权后的真实AX | PASS；424节点、完整递归、正控菜单齐，退休产品标题0；仅精确系统Edit→开始听写路径列为系统例外 |
| Welcome/标题栏 | 公共openWalkthrough，等待实际尺寸及非空内容 | 151实际renderer | PASS；Start/Open/Clone、两类普通Walkthrough、Announcements和布局controls可见，无退休入口 |
| Keyboard Shortcuts | 13次公共查询与实际显示命令ID核对 | 151实际renderer，冻结退休provenance | PASS；Copy正控存在，退休具体ID0；模糊chat/mcp普通结果按ID分类，无扩大禁用 |
| 实际设置schema | 同URL ESM缓存读取已存在注册表，核对loaded/disk hash | 151实际runtime/source | PASS；schema与151实际源码逐字相同，24条退休skip-shell说明消失，普通命令保留；完整实体审查另由[M6审查](M6-runtime151-audit.md)记录 |
| 实际终端过滤实例 | 从已存在singleton descriptor取得ctor，queryObjects查询已有实例，不调用DI.get/构造器 | 151已有TerminalConfigurationService | PASS；144默认项、configured=[]；24退休项false、普通项true，与实际151来源集合精确一致；尚未覆盖非空用户配置或真实按键 |
| 真实terminal/tasks | 公共createTerminal/sendText、executeTask、terminate及end事件；检查真实文件 | /bin/sh -f，151实际PTY | PASS；两个独立marker文件精确落盘，task仍活时显式terminate，真实end/processEnd且execution消失；保留终端DOM实际可见。公共API执行不代替键盘分发 |
| 日志和退出 | 保存17份实际logs并检查DI/actor，自己的Quit和真实exit事件 | 本轮20261002T204832 | PASS；检查器所列DI/actor模式0，正常exit0；task复原提示另有fixture定义警告，未冒充无任何warning |

失败原样保留：首次151任务未落盘，正常退出0；第二轮Welcome检查仅等DOM存在，尚未渲染可见文字便断言失败。新条件依据原可工作的GUI探针，等待尺寸和文字而不是只等节点。第三轮全部运行到最后只读skip-set时，V8的main闭包未捕获`P6e`变量，错误不是服务不存在；注册表已有`terminalConfigurationService`描述，其ctor明确为P6e。最终沿用已有registry/profiling探针的方法从真实descriptor取得ctor并查询现有实例，未新增服务实例或导入独立源码。两轮私有检查器红结果保留在证据目录，历史脚本/fixture冻结未改。

剩余：151真实键盘分发、用户`-command`覆盖与第三方追加；受影响完整可访问性焦点复验；完整注册实体审查和里程碑前置汇总。当前输入两arch CI受用户仅本地限制未运行，不能把本地build代替CI。旧149/150未受151单文件常量删除影响的结果保留真实原版本，当前tabs观测明确不作为新的混合窗口恢复验收。
