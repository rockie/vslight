# M4/V7 · 最终149普通认证续验

计划：[lean-core.md](../lean-core.md) §9.3(2)、M4/M8。最近更新：2026-10-02 10:07 +1000。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，最终147–149产物。状态：普通双账户认证完整通过；SecretStorage删除立即读回失败另查，M4整体仍进行中。

原138的auth-live-07后来于09:49实际PASS，随后宿主正常退出。已核验原PID62872和19480 listener不存在，旧ready/state不能当活会话。旧响应保留；没有重发原请求。新的最终149实例使用私有auth-accounts目录，真实main44513/host45740，API1.135.0。冻结auth.js SHA256与执行前仓库相同；后续仅新增reload动作以免文字输入，账户断言未改。控制器在工具会话中等待真实子进程，不用后台PID或ready文件代替存活证明。

| 验收项 | 实际步骤与证据 | 结果 |
| --- | --- | --- |
| 普通provider/双账户创建 | 两个create请求，读取限定PID的真实原生dialog，核对合成provider名称后按Allow | PASS；两次createSession各+1，公共变化事件到达 |
| 双账户隔离/重取 | accounts-empty/alpha/two/beta及same-account silent reuse | PASS；session正确、重取不create |
| 普通账户退出 | 产品_signOutOfAccount，核对自己的账户label后按Sign Out | PASS；两个removeSession各+1，Alpha删除后silent为空、Beta仍可取 |
| provider撤销 | 全部合成账户退出后dispose；公共lookup拒绝 | PASS |
| 宿主正常退出/日志 | fixture quit；父控制器wait实际exit0；扫描六类DI/RPC模式 | PASS，16个认证动作全部PASS，DI/RPC全0 |

[完整响应和四个真实dialog](M4-auth149-resume.json)、[日志索引与计数](M4-auth149-resume-logs.json)。控制器和原日志保留在 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-resume149-pzgqgcap/auth-accounts`。界面操作只用限定PID激活和AXPress；没有文字输入、粘贴、真实账户访问或外部登录。

同根前一独立auth实验通过SecretStorage store、真实Reload新boot/host读取v1、覆盖v2，delete后立即get仍返回v2而FAIL。该失败原响应保留在上级auth目录，不能用账户认证成功覆盖它；继续核对storage删除链和实际日志。
