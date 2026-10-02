# M4 · 145+146 正式包双权限宿主

- 对应[lean-core.md](../lean-core.md) V6/M4；最近更新：2026-10-02 03:21 +1000。
- 状态：本项通过，完整M4仍进行中。基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，114–139/141–146、252条prune。
- 正式unsigned app由[M8-build145](M8-build145.json)绑定，原始runner结果见[M4-final-host145.json](M4-final-host145.json)；私有目录由`/tmp/lean-host145-path`定位。

两轮真实Electron扩展宿主均exit0、结果passed且本轮runId一致。未授权轮检查原proposal权限错误，授权轮检查明确unavailable；89条路径包含新增两个inline unification属性/事件。stable shell的provider getter/method/subscription计数均0，普通API权限边界保留。

普通inline provider在真实宿主生成并接受`INLINE_HEAD:INLINE_TAIL`；授权additions回调实际执行，未授权metadata仍权限失败。普通findFiles2、命令、文档、状态栏和Webview ping/pong均通过。27项manifest proposal与89条调用路径分开计数，没有批量退休inlineCompletionsAdditions。

初轮fixture放在默认macOS临时长路径，IPC socket超过103字节，进程在测试启动前exit1。改用`/private/tmp/lh145-*`短目录后两轮完整通过；原失败原件由`/tmp/lean-host145-firstpath-red`定位，未计为产品API失败，也未把无结果退出当通过。
