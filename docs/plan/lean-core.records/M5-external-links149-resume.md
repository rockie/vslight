# M5 · 最终149四条外链补验

计划：[lean-core.md](../lean-core.md) V5/§9.3(3)。最近更新：2026-10-02 10:43 +1000。基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，实际最终149 app。状态：四条余项完整地址通过；与[既有16条](M5-external-links145.md)组成20条覆盖，M5仍依赖M4前置。

独立root `/private/tmp/ell145-resume149-h6uoclfu`，目录前缀用于既有helper的严格权限检查，实际app与loaded workbench为149。两次有效launch主进程79351/14681，host80636/16103；父controller保持wait，使用自己的u/e/s/w和127.0.0.1:19520。实际终端visible与OSC8由公共API生成，限定真实renderer的Meta+mouse点击，不输入文字。旧`externalUriOpeners: {"*":"simpleBrowser.open"}`配置保留；没有改URL或放宽trustedDomains。四次真实native prompt逐字含各完整URL，限定PID AXPress Open。实际product tabs均没有Browser。

| surface/index | URI | 回执 | 结果 |
| --- | --- | --- | --- |
| terminal-visible/3 | http://0.0.0.0:19481/… | 原自动Kimi foreground查找超时exit1；用户提供完整地址，主线程独立只读Chrome匹配本run的tab URL，同原地址逐字一致；server实际GET编码path/query | PASS，人工地址核对+独立原生读回，保留自动失败 |
| terminal-visible/4 | https://example.com/… | 新Chrome tab，原生URL属性读回，同编码path/query/fragment逐字一致 | PASS，自动 |
| terminal-osc8/3 | http://0.0.0.0:19481/… | 新Chrome tab，原生URL属性读回，同原地址逐字一致；server实际GET | PASS，自动 |
| terminal-osc8/4 | https://example.com/… | 新Chrome tab，原生URL属性读回，同原地址逐字一致 | PASS，自动 |

原URI均包含`/lean%20core/%E4%B8%AD?encoded=%252F&plain=value&run=80a249748537&surface=…&index=…#fragment%20space`。网页正文“Lean independent external URI probe.”只证明测试页响应，完整地址才是此门证据。HTTPS页正文/HTTP状态不属于URL转发验收，不把页面加载错误当地址失真。

[原始receipt/AX/身份与退出](M5-external-links149-resume.json)。后三项nativeChrome回执仅只读exact test URL，返回tab/window IDs与实际URL，不导航、聚焦、修改或关闭用户Chrome。执行后独立审查补了“click前exact URL全部tab IDs快照”以防旧失败回执tab冒充新tab；这三条实际URI的surface/index各不相同、均第一次点击。执行helper hash未冻结，不把当前修订hash反写为当时输入。

最终launch正常quit0，自己的HTTP server terminate/wait0；不关闭用户浏览器的测试tab。首个分离remote-debugging-port参数被Electron解析为随机port的harness失败留在attempt1；改为`--remote-debugging-port=19520`后才通过authority，不放宽PID/监听端口或bundle hash检查。
