# M4 · 151 真实终端按键、用户覆盖与第三方命令

计划：[lean-core.md](../lean-core.md) §5.4、M4/M6/M8、V7。最近更新：2026-10-02 21:11 +1000。状态：四条真实按键路由全部PASS。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；114–139/141–151、254条prune，产品输入未变。

实际signed151载体使用新的隔离根 `/private/tmp/lc-key151-mivqeuwq`、profile/extensions/workspace和127.0.0.1:19542。最终main38116/host39411；父controller拥有真实child exit事件，正常Quit实际exit0/signal=null。已加载workbench hash与冻结151一致，签名app四入口哈希前后保持。未使用全局输入，不改变IME、TCC、用户profile或installed app。

[机器结果](M4-terminal-keys151.json)、[真实controller与证据](M4-terminal-keys151.evidence/evidence/summary.json)归档全部按键前台/DOM、现存服务Set、公共extension handler次数、PTY实际单字节文件、日志和失败轮。测试私有keybindings将Ctrl+P绑定普通Quick Open、Ctrl+E绑定本fixture注册的第三方命令，均限定terminalFocus；不是改变产品默认快捷键。

| 验收 | 实际动作 | 可断言的结果 |
| --- | --- | --- |
| 默认普通命令不进shell | 实际xterm聚焦，可信Ctrl+P发往身份核验后的own renderer | Quick Open真实可见，PTY读者未收到字节；可信Escape关闭并返回xterm；PASS |
| 用户负号覆盖默认 | 公共configuration.update设置`-workbench.action.quickOpen`，现存服务确认更新，再Ctrl+P | Quick Open未出现，实际PTY单字节文件为0x10；PASS |
| 未追加的第三方命令 | 配置空数组，实际Ctrl+E | 实际PTY单字节文件为0x05，extension handler次数0；PASS |
| 用户追加第三方命令 | 公共configuration.update追加`lean-tests.terminalKeys.thirdParty`，现存服务确认更新，再Ctrl+E | 真实extension handler恰调用1次，PTY未收到字节；PASS |
| 设置恢复与退出 | 公共配置恢复到原undefined，dispose自己的terminals，公共Quit | 私有settings中对应键不存在，真实child正常exit0；六类DI/RPC日志计数0；PASS |

每个键前均核验NSRunningApplication为实际appActive、onConsole=true、locked=false，DOM为真实xterm textarea且document.hasFocus。collector通过公共createTerminal/sendText启动真实/bin/sh与PTY读者，**测试目标键单独经可信Input.dispatchKeyEvent发送**；断言以真实工作台控件或extension回调及内核PTY落盘为准，不以sendText代替快捷键，也没有直接调用目标command来造成功结果。

只读skip集合检查从已存在singleton描述表取得构造器，queryObjects枚举现存服务；每次配置都核对完整实际Set恰等144默认项加用户追加、减用户负号项，并校验所有普通144与退休24答案。无DI.get、构造器调用、独立源码import或关闭RPC校验。

失败保留：重复Debugger.enable不重发scriptParsed事件，第二次检查读到0个script；修正为检查结束释放对象并disable，下一次重新捕获已加载脚本。复用目录的旧quit请求会被新宿主处理，两次启动边界红例正常退出并保留；后续启动清理自己的mailbox并等待实际workbench target，不触碰用户数据。最初第三方绑定Ctrl+Y是macOS tty的dsusp控制字符，内核消耗后读者不落盘、handler也未调用；`stty -a`实际显示dsusp=^Y。改选无该内核控制含义的Ctrl+E后取得上述正反路由，不改产品终端行为。各旧检查器及原红JSON独立归档，没有改写为成功。

该子门连同[四项完整151可访问性](M4-accessibility151.md)、[151注册表与实际Set](M6-runtime151-audit.md)、[151持久化与普通运行](M8-runtime151.md)覆盖本次terminal常量删除的实际影响。完整M4及依赖里程碑由主集成人另按全部退出条件汇总。
