# M8 · 本地 arm64 最终完成验收

计划：[lean-core.md](../lean-core.md) §9/§10。最近更新：2026-10-02 22:01 +1000。代码基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，114–139/141–151、254条prune。结论：**全部当前退出条件通过，必要缺口0**。

用户明确“x64 不用跑了，本地跑过 arm64就可以”，因此本次按[最新验收范围](M8-local-arm64-scope151.md)完成。x64/CI未运行、不记为通过；生产代码、workflow配置及其余退出条件未改变。M1–M7前置均已完成。

| 当前退出条件 | 结果与实际证据 |
| --- | --- |
| V1–V9及V10本地项 | [逐项原验收](M8-final-local-audit151.md)完整覆盖资源/GUI/语言、Mermaid矩阵与Storage定向恢复、浏览器外链、AI API/后台摘除、所有普通保留面、CLI/旧profile与数据、254-prune/typecheck/生产及安装包闭包；各子项保留实际执行代次。当前必要缺口0。 |
| 当前输入本地arm64完整compile/build | [151构建](M8-build151.md)真实全序prepare/compile/packing exit0/147.93s，native全图noEmit exit0/0B，实际包三布局exit0；[当前重新核对](M8-completion-input-artifact151.json)1475输入生产/helper/workflow漂移0。 |
| 完整保留与负向验收 | 按计划§9.2用户指示停用smoke，使用真实host、实际CLI/包及限定PID/renderer GUI逐项替代；[M4全退出](M4-final-acceptance151.md)、[M5](M5.md)、[M6](M6.md)、[M7](M7.md)。151四可信键盘route/用户覆盖、四完整DOM/AX可访问性、full registry/native menu、Cold/Reload、账户/主题/禁用扩展及正常退出持久化全绿。 |
| 签名/公证/staple/ZIP | [151独立20阶段](M8-sign151.md)全部exit0，strict codesign/spctl、Apple Accepted/staple/validate/独立CRC与内容校验通过。[实际产物复核](M8-completion-input-artifact151.json)签名app全部1223文件/链接、两ZIP与冻结manifest完全不变。 |
| 同条件体积与平台版本 | [151实账](M8-artifact151.md)：unsigned app422,443,727 B/ZIP157,530,299 B，减少20.01%/18.27%；独立signed app421,985,205 B/ZIP157,386,282 B不混入同条件收益。Electron43.7.5、macOS12不变。 |
| README/兼容/语言/迁移/图标/发布与升级须知 | 六产品文档和[本次最终文档检查](M8-completion-validation151.json)通过；发布说明同步本地arm64范围、最新产物数字和未发布事实。AI接口、数据保留、外链、CLI、四原生locale、第三方扩展边界准确。 |
| 原当前输入双架构CI门 | **用户明确取消，不要求**；不能解释为CI或x64已通过。原未验/阻塞记录保留历史来源。 |

[逐项机器记录](M8-final-acceptance151.json)固定最终证据哈希。原红轮、headless基线相同超时与原disabled developer测试保留，不称历史所有suite零skip；必要最终验收路径按用户指定方式均通过。未改用户生成树、安装app、profile、输入法、TCC，测试进程已正常退出。

本地交付：[签名 app](/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app)、[签名 ZIP](/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight-151-signed.zip)。本次只完成开发和本地验收，没有提交、推送或发布。
