# M4/M8 · 最终149普通宿主

计划：[lean-core.md](../lean-core.md) V7/§9.3。最近更新：2026-10-02 04:55 +1000。状态：普通编辑/Git/tasks/NPM/Welcome/Reload通过；认证和完整原生GUI门未齐。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，实际147+148+149 app，独立有效profile /private/tmp/lc149-my6ky2od。

真实main91720、host92930。HTML语言识别、editor edit/save、文件搜索、builtin Git diff/stage/两个commit、普通task文件落盘/terminate/end event以及隔离SecretStorage store/get/delete均通过。147影响的builtin NPM实际Run/Open/Install commands存在、两Debug commands不存在；Run hover有普通入口且无Debug链接，真实NPM provider返回lean-proof任务，执行写入NPM_TASK_MARKER并结束。profile旧npm.scriptExplorerAction=debug仍在，未改写用户数据；GUI树点击本轮未操作，旧点击映射由[完整NpmView实模块回归](M4-retired-settings.md)验证。

Welcome真实打开。唯一Reload请求先消费再执行，旧host92930退出，新host2142 ready，main未变。实际命令response=null，因原宿主结束，不补造命令返回；[renderer闭包](M6-runtime149.md)和[main/shared](M6-main-shared149.md)各自验证前后身份/日志。最后通过fixture普通quit退出main91720。

原始请求/响应、任务proof hash、Git身份和fixture SHA见[JSON记录](M4-ordinary149.json)。第一次测试manifest的engine=*不合法，被产品拒绝；其隔离red目录保留，修正为^1.130.0后才创建本次有效profile。完整profile真实warnings/5条普通Git或inspector stderr仍在，退休DI/RPC异常0，不宣称所有级别日志为0。
