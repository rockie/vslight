# M4/M8 · 151 四项普通可访问性完整焦点验收

计划：[lean-core.md](../lean-core.md) §9.3(7)、M4/M8。最近更新：2026-10-02 20:59 +1000。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，114–139/141–151、254条prune。状态：四项实际151子门PASS，M4整体仍由集成人逐项判断。

实际独立signed151 app位于 `/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app`；新根 `/private/tmp/av151-4dvltjmt` 使用自己的user-data、extensions、workspace。main29377/host30589，CDP只绑定127.0.0.1:19540。父控制器直接持有实际child，执行期间确认PID、app/profile参数、listener owner、fixture和已加载workbench哈希；启动与退出后四个app入口哈希相同。

冻结 [accessibility.js](../../../dev/test-fixtures/lean-core/accessibility.js) 与仓库逐字节相同。复制149的capture-driver和Swift模板到新根，只适配实际root、151哈希/PID，并在每行补采beforeNative及将退休文案零匹配纳入通过条件；不修改历史文件。自己的profile启用editor.accessibilitySupport，shell为/bin/sh -f。

| 退出子项 | 实际步骤与环境 | 结果与证据 |
| --- | --- | --- |
| terminal-view | 真实PTY输出A11Y_TERMINAL_MARKER，打开Accessible View | DOM/AX内容、可见尺寸、完整前台、Escape关闭并回到xterm textarea均PASS；[原始行](M4-accessibility151.evidence/terminal-view.json) |
| terminal-help | 聚焦终端，打开Accessibility Help | Focus Accessible Terminal View可读，关闭并回到xterm textarea，全部门PASS；[原始行](M4-accessibility151.evidence/terminal-help.json) |
| editor-help | 聚焦普通editor，打开Accessibility Help | You are in a code editor可读，关闭并回到editor，全部门PASS；[原始行](M4-accessibility151.evidence/editor-help.json) |
| hover-view | 普通plaintext provider提供真实hover，聚焦后打开Accessible View | A11Y_HOVER_MARKER可读，关闭并回到hover row，全部门PASS；[原始行](M4-accessibility151.evidence/hover-view.json) |
| 日志与普通退出 | 20份自己的app日志扫描六类DI/RPC；fixture公共quit，父控制器实际wait | 六类计数0，正常exit0/forced=false；main/host消失、19540无listener；[日志索引](M4-accessibility151.evidence/logs.json)、[退出](M4-accessibility151.evidence/process-exit.json)、[释放](M4-accessibility151.evidence/release.json) |

每行前后NSRunningApplication实际appActive=true，CGSession的kCGSSessionOnConsoleKey=true、locked=false，document.hasFocus=true。Escape通过Input.dispatchKeyEvent只发往身份校验后的own renderer，保持真实可信事件，不使用focus emulation或全局输入。四项退休文案匹配0。实际activate仅限本次PID，不改变全局输入法、TCC或用户偏好。

日志保留4条普通warning：/bin/sh -f不启用shell integration、Git两处和Markdown Math一处resource-scoped配置读取。没有把整份日志称为零warning/error。[完整结果和输入哈希](M4-accessibility151.json)、[实际控制器](M4-accessibility151.evidence/controller.py)、[实际driver](M4-accessibility151.evidence/capture-driver.mjs)、[前台探针](M4-accessibility151.evidence/window-state.swift)已保存。

本轮只验四项可访问性。普通终端shortcut键盘分发及用户/第三方skip-shell覆盖仍另验；命令打开这些可访问性界面不替代快捷键路由。未修改产品、计划、smoke、用户目录或安装应用，未提交、推送或运行CI。GUI已释放给集成人。
