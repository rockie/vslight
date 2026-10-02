# M4/M8 · 普通可访问性实机验收

- 计划：[lean-core.md](../lean-core.md) §9.3(7)、V7、M4/M8；最近更新：2026-10-02 01:30 +1000。
- 状态：四项可访问性行为通过；发现旧 Debug 帮助文字，继续清理。里程碑仍进行中。
- 基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33 +114–138；正式未签名 arm64 app，Electron 43.7.5。
- 测试目录：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/av138b-qkaxxaxn`；主进程 71045，CDP 19480，私有 user-data/extensions/shared-data/workspace。未修改用户生成树或已安装 app。

## 实现记录

[accessibility.js](../../../dev/test-fixtures/lean-core/accessibility.js) 提供终端输出和普通 hover。驱动请求只证明命令被执行，最终验收读取真实 DOM、Chromium AX tree，并发送 Escape 验证关闭和焦点。

旧 AppleScript 按 PID 查询进程后执行操作，在两个同名 VSLight 实例同时运行时，实际窗口/前台属性落到已安装实例。`ps` 和按 PID 枚举确认：测试 PID71045 的窗口为 Extension Development Host，安装实例 PID97177 的窗口为 xgent；原 AppleScript 操作后测试 document.hasFocus=false。改用 NSRunningApplication(processIdentifier:71045).activate 后同一终端视图出现。未修改产品 provider、DI 或 RPC。

新增 [ui-driver.swift](../../../dev/ui-driver.swift)：前台判断/激活、AX 窗口和菜单读取都直接使用 PID。smoke 编译并使用此工具，按键仍由已有 System Events 发送，每组按键前用实际 PID 检查前台。新 Swift binary 的 CGEvent 注入在本机未收到 keydown，故没有采用该注入路径；旧与新探针均保留在私有目录。

## 验收记录

| 退出条件 | 命令或步骤 | 环境/基线 | 结果与证据 |
| --- | --- | --- | --- |
| 终端 Accessible View 内容可读、关闭回终端 | fixture terminal-output/terminal-view；CDP DOM + Accessibility.getFullAXTree；实际 Escape | 正式138 app，真实焦点 | PASS：AX textbox 包含 A11Y_TERMINAL_MARKER，关闭后 xterm 获焦 |
| 终端 Help 内容可读、关闭回终端 | fixture terminal-help；同上 | 同上 | PASS：AX textbox 包含 Focus Accessible Terminal View，关闭后 xterm 获焦 |
| 编辑器 Help 内容可读、关闭回编辑器 | fixture editor-help；同上 | 同上 | PASS：You are in a code editor，关闭后编辑器获焦；旧 Debug 文案另列缺口 |
| 普通 hover Accessible View、关闭回 hover | fixture hover-view；同上 | 同上 | PASS：AX textbox 包含 A11Y_HOVER_MARKER，关闭后 hover row 获焦 |
| 真实焦点与视图可见 | document.hasFocus、accessible-view.offsetWidth，关闭后检查宽度为零 | 每项独立检查 | 全部 PASS；[原始结果](M4-accessibility.json) |
| smoke 驱动语法与编译 | bash -n dev/smoke.sh；swiftc -O -o /tmp/lean-ui-driver dev/ui-driver.swift | 当前 dirty 工作树 | PASS；单次完整 smoke 尚待执行 |

截图为私有目录内 terminal-view/terminal-help/editor-help/hover-view.png。编辑器 Help 的退休 Debug 指引仍在，不能用可读性通过覆盖该死文案缺口。完整保留功能与运行注册表继续验收。
