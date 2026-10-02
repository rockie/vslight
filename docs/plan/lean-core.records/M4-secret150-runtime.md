# M4 · Storage150正式集成与真实SecretStorage复验

计划：[lean-core.md](../lean-core.md) V7/V8/V9、M4/M8。最近更新：2026-10-02 10:53 +1000。基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，新增[150补丁](../../../patches/150-light-storage-external-write-order.patch)。状态：正式修复、全图和真实SecretStorage定向门通过；用户要求暂停，整体里程碑未记完成。

[根因调查](M4-secret-delete-investigation.md)保留原149即时get红例、真实main旧set广播在pending delete后回灌cache的trace，以及确定性原类2绿5红、Set候选7绿。150在同key的pending/in-flight数据库写期间保留本地cache；每个request按身份独立释放，避免in-memory并发写互相解除保护。其他key正常接受外部更新，完成或失败后解除保护。注释仅说明晚到echo不能覆盖更新的本地写，没有计划元数据或特定secret例外。

| 退出子项 | 实际命令/动作 | 基线 | 结果 |
| --- | --- | --- | --- |
| 新定向回归 | 真实Storage源打包，Mocha TDD执行新增common/storage.test.ts | 隔离150源码 | 7 PASS，0 FAIL/SKIP；覆盖pending、in-flight、并发request与失败释放 |
| 完整全图/干净重放 | native tsc --noEmit及dev/run-build.sh -s | 150，254条prune | exit0/0B；全prepare/compile/packing exit0，234.11秒，[build](M8-build150.json) |
| 既有真实Electron suite | 官方test/unit/electron/index.js --build六个Storage/SQLite/StorageService/secrets/main/browser suite | 150实际out-build | 79 PASS/0 FAIL/1既有pending；pending是未改的slow developer clear，不算产品验收；首轮错误browser测试路径在0例加载阶段失败，已保留并修路径 |
| SecretStorage即时契约 | public store→get/keys；public delete→立即get undefined→keys absent | 实际150app，ownprofile | 两次删除均PASS，未加wait/retryget |
| Reload与退出重启 | store v1→公共reload→新host读v1→更新/删除→正常quit；第二boot确认旧key absent再store；第三boot读v1再更新/删除 | main26149等3轮真实进程、4次host boot | PASS；三次父process wait均normal exit0 |

[完整真实宿主结果](M4-secret150-runtime.json)冻结auth.js、实际workbench SHA及全部请求。独立root `/private/tmp/auth150-gf6b3osv`，只用合成key/provider与自己的u/e/s/w，不操作用户输入法/剪贴板、真实账户或历史；未运行/修改smoke。账户创建/复取/退出16项沿用[149普通认证](M4-auth149-resume.md)，没有将这次secrets定向门称为再跑全部认证。

恢复/持久化定向结果另见[M6存储回归](M6-storage150-regression.md)，快捷键/原生菜单/标题栏GUI和Mermaid150重启按暂停检查点续做。临时根的重启安全副本与路径映射见[M8续做入口](M8-next-session.md)。
