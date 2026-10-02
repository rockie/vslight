# M8 · 150 当前窗口退出前检查

状态：13 项实际快捷键查询、public synthetic Beta 账户选择、真实主题 CSS 和禁用扩展显示通过；未执行退出重启，完整原生菜单仍未获辅助功能权限。机器证据：[M8-ui150-before.json](M8-ui150-before.json)，截图、DOM、控制脚本和实际结果保存于 [证据目录](M8-ui150-before.evidence/)。这些是 150 的退出前子门，不作为 151 的实际运行验收或 M8 完成证据。

实际应用 `/private/tmp/lcfinal-chkarkup/VSLight.app` 来自冻结 unsigned150；四个主产物文件的 SHA-256 在检查前保持不变。主进程 46653、普通 development host 47396，父进程 46652 持有真实子进程退出 Promise。每次补充 CDP 检查先核对实际 PID、应用和独立 profile；未改已安装 app、用户原 profile 或生成源码树。

13 项 Keyboard Shortcuts 查询含普通 Copy 正控、chat/mcp/speech/dictation/Integrated Browser/Simple Browser/Agent Sessions/Playwright 词查询及四个已退休具体 command ID。实际显示 ID 按冻结退休候选和动态命令族分类，退休匹配为 0。chat 的 8 项、mcp 的 2 项属于普通功能，不能以模糊关键词结果非零判产品失败。完整注册表另见 [M6-runtime150-final](M6-runtime150-final.md)。

public `persistence-status(before)` 通过：两个合成账户中，未显式指定账户的 silent getSession 选择既有 Beta session；fake token 只作相等断言，未返回凭据。create/removeSession 均 0，真实 globalState 退出前 marker 写入成功。禁用扩展 manifest 存在，public host 看不到该扩展，activation marker 不存在。上述状态尚未经退出和新进程验证。

One Dark Pro 3.20.2 的实际 renderer 类名与主题声明相符；五个 CSS token 与真实 theme file 的颜色逐项相等，编辑器背景 `rgb(40, 44, 52)`。主题文件 SHA-256 `186fbbd1ef99a9fb6548fac7a1d354b925a7f9b98da97ef7649e22e20d08c756`。禁用扩展页面实际搜索值为 `@disabled lean-disabled-final`，唯一结果的 `data-extension-id` 精确为 `lean-tests.lean-disabled-final`，截图已查看，主题与普通文件内容正常显示。

保留检查器失败的真实边界：第一次读取隐藏的 keybindings input；改为实际 header search input 后，模糊关键词零行断言又误判普通结果。补充扩展 UI 检查第一次按原生 input 读取，但真实控件是 SuggestEnabledInput 的 Monaco editor；第二次误用 fixture 不存在的 isActive 字段。最终检查根据源码与实际 DOM 读取 `extensions:searchinput` 的显示内容、精确 extension ID，并使用 fixture 实际 hostVisible 字段。这些私有验收脚本修正没有更改产品；原失败 JSON 保留，旧 documentElement 空 CSS 值也不算通过。

完整 native menu 的最近只读尝试真实 exit 1：AX `trusted=false`、`menuBarError=-25211`、`nodeCount=0`。先前 System Events 的 `osascript 不允许辅助访问(-1719)` 不算已验。用户正在手动添加实际会话程序 `/Users/rockie/.codex/packages/app-server-daemon/releases/0.160.0-aarch64-apple-darwin/bin/codex`；未修改 TCC、关闭权限弹窗或把弹窗消失解释为用户拒绝。当前窗口保持打开，等待权限处理。

后续须串行补 native menu、正常退出且父进程真实等待、新 main/host PID 再启动、public 账户偏好/主题/扩展状态读取与 SQLite/file 精确保留。当前父 controller 已载入旧版查询断言；不要直接创建 `ui/continue.json` 触发它。应先设计正常退出交接、保留其真实 exit 结果，再由修正后的新 controller 负责重启验证。151 的实际 registry/schema、受影响普通 terminal/tasks/可访问性及签名链另待新产物验收。用户限制继续为仅本地、不运行或修改 smoke、不 commit/push/CI/Release。
