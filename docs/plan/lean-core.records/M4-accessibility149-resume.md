# M4/V7 · 最终149四项普通可访问性完整焦点续验

计划：[lean-core.md](../lean-core.md) §9.3(7)、M4/M8。最近更新：2026-10-02 10:07 +1000。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，最终147–149产物。状态：四项完整门PASS，M4其他缺口独立保留。

独立根 `/private/tmp/av149-qt1l4h3d`，main46261/host47472，自己的profile/extensions/workspace，CDP仅127.0.0.1:19540。冻结accessibility.js未改，实际loaded workbench与149 SHA256一致。私有editor.accessibilitySupport=on、shell=/bin/sh -f。NSRunningApplication按实际PID激活，原生探针使用正确的kCGSSessionOnConsoleKey；没有修改全局输入法或语言偏好。

| 实际动作 | DOM/Chromium AX内容 | Escape及焦点 | 结果 |
| --- | --- | --- | --- |
| terminal-view | A11Y_TERMINAL_MARKER | view关闭，返回xterm textarea | PASS |
| terminal-help | Focus Accessible Terminal View | view关闭，返回xterm textarea | PASS |
| editor-help | You are in a code editor | view关闭，返回editor | PASS |
| hover-view | A11Y_HOVER_MARKER | view关闭，返回hover row | PASS |

每项都同时要求document.hasFocus、原生appActive、onConsole=true、locked=false、view实际尺寸可见、非空真实AX内容、限定own renderer的可信Escape和对应控件返回。四项退休文字匹配0，全部通过。fixture正常quit后父控制器wait exit0。六类DI/RPC计数0。

[逐项原始内容与前后原生状态](M4-accessibility149-resume.json)、[日志索引](M4-a11y149-resume-logs.json)。同根保存控制器、native探针和driver日志。原锁屏下的149内容子项记录保留，不回写为当时已经通过完整焦点门。
