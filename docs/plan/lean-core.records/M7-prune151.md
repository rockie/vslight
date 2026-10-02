# M7 · 151 prune失效注入与路径闭包

计划：[lean-core.md](../lean-core.md) §9.4、M7/V8。最近更新：2026-10-02 21:15 +1000。状态：两项失效注入、254路径无重叠且实际删除全部PASS。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；当前utils.sh与254-prune清单，未改产品或正式清单。

此前原始`/tmp/lean-prune-gate-path`指针已消失，不能用缺失日志作为本次复核依据。本轮在新私有目录创建两个最小JSON，使用真实utils.sh的apply_actions、bash set -e、VSCODE_QUALITY=stable执行，未作用于用户生成树。

| 退出条件 | 实际步骤/环境 | 结果 |
| --- | --- | --- |
| 缺失remove路径失败 | 私有missing目录，remove不存在的missing，调用后touch sentinel | stderr为Not found: missing；exit4，sentinel不存在；PASS |
| 父子重叠失败且调用者中止 | 私有parent-child目录先建parent/child，按parent、parent/child删除，调用后touch sentinel | parent已删；stderr为Not found: parent/child；exit4，sentinel不存在；PASS |
| 正式清单无重复/重叠 | 逐项比较当前254路径，检查所有父子前缀 | 重复0，重叠0；PASS |
| 实际151源码已删除全清单 | 正确构建cwd为vscodium/vscode；先验证保留API工厂及base/parts/sandbox存在，再检查254路径 | 全部不存在，包括symlink检查；PASS |

[机器结果](M7-prune151.json)保留完整命令、cwd、真实stdout/stderr/exit与utils/prune SHA-256。原始隔离脚本与日志位于该JSON的root。首次源码检查误用外层vscodium目录，本轮在实际vscode根、两个保留正控存在后重新核验；记录保留该修正，不以错误根目录的空结果证明删除。仅创建和删除自己的注入fixture；未运行smoke、提交、推送或CI。
