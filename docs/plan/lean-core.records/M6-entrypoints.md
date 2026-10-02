# M6 · 后台入口、CLI 与历史数据保护

- 对应计划：[lean-core.md](../lean-core.md) §5.4–5.7、§9.2、M6。
- 最近更新：2026-10-01 23:40 +1000；状态：切片已集成，完整闭包与实机门待验。
- 根基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；事实源码为 `/tmp/lean-core-api-5_lg434f/vscode`。用户根生成树未修改。
- 持久补丁：[130](../../../patches/130-light-retired-background-entrypoints.patch)，21 文件、2 新文件、84253 字节，SHA256 `af194f605db541b6953df61c71bb9b9724c0139feb3444d05b4eaa34723cba27`；[132](../../../patches/132-light-retired-ai-search-protocol.patch)，1 文件、2290 字节，SHA256 `769c2521003a3890892b6bbe785dbbfa562836990bd9376df9ad62b381ce5dac`。

## 实现

130 撤下 main/shared/workbench 的 MCP 管理、发现、gateway、AI sandbox、页面提取、Agent Host、transcription、Notebook/Debug 服务注册与专属 IPC。移除 Sessions 启动和旧 Chat CLI 执行链，普通窗口、文件、Webview、导航防护、PTY、watcher、profiling 和普通 telemetry 保留。只有 DebugSession 使用的 CustomEndpoint telemetry 后台随其退休，不迁出闲置进程。

普通扩展宿主的调试/Reload 生命周期桥原样迁至工作台 extensions 服务目录，desktop/web 入口改指迁出文件；这两个新文件不是运行调试 UI。131 的 profile 构造函数调整和后续 NotebookDocument 入口补漏由 [134](../../../patches/134-light-retired-build-entrypoints-metadata.patch) 收口，未回写冻结的130。

CLI 用真实 parseArgs 先解析显式 `--` 前的参数：首位置 `chat`、任意 `--add-mcp` 形式明确抛出可读拒绝。参数值为 chat 或显式 `--` 后的同名文件仍是普通参数/文件。拒绝借原 CLI 末端的 rejection handler 退出1。初版在 parse catch 中仅设置 exitCode，实际进程测试发现末端成功路径 `eventuallyExit(0)` 覆盖它；已删除早期 catch，使失败到达原末端 rejection handler。

历史保护沿用旧 workspace identifier 算法，对旧 `appSettingsHome/agent-sessions.code-workspace` 计算 hash。不能直接删除 storageDataCleaner 保护分支：那会把旧 Chat workspace 数据当普通无关联目录清理。最终不调用退休 environment getter，也不读取配置/历史内容；旧 state.vscdb 原字节保留。

132 仅删除普通 Search actors 上四个专属 wire 方法：注册 AI text provider、keyword result、AI name、AI results；纯 AISearchKeyword 构造保留，普通 file/text Search IDs、方法及全集 assert 保留。对应 actors/manager 实现由129解绑。

## 实际验证

| 检查 | 环境/证据 | 结果 |
| --- | --- | --- |
| 真实 argvHelper / OPTIONS 参数路径与帮助 | `/tmp/lean-cli-guard-check.mjs`，实际模块 Node bundle | 新增14参数路径及帮助断言通过；显式 `--` 和参数值边界通过 |
| 实际自启动 CLI 进程 | `/tmp/lean-cli-process-check.mjs`；`/tmp/lean-cli-process-130.json` | 六种退休命令/缺值形式 exit1、stdout 空；三个 version/help/显式 `--` 控制 exit0、有输出；不是调用测试替身 main |
| 历史 storage 清理 | 实际 Node unit runner 的 storageDataCleaner.test.ts；`/tmp/lean-storage-cleaner-130.log` | 2 passing；旧数据库字节不变，无关空目录正常清理 |
| transpile | `/tmp/lean-root-130-transpile.log` | exit0，7152文件/1869资源；不是类型检查或产品打包 |
| 中间 full noEmit | `/tmp/lean-root-130-tsc.log` | exit1、235诊断，退休域为主；一项新 unused import 已修。尚未完整接入129/源码父目录 prune，不能称全图通过 |
| 130 冻结 preimage 独立重放 | `/tmp/lean-core-runtime130-preimage`，replay `lean-replay-130-pp8tl9de` | check/apply/reverse-check 通过，21 文件逐字节一致 |
| 132 独立重放与 wire 复核 | replay `lean-replay-132-7o_7uwen`；实际当前协议 | check/apply/reverse-check 通过；四退休方法为0、六普通方法仍在，actor IDs 无改 |

待验：最终产品 CLI 拒绝、显式 `-- chat` 同名文件真实打开、普通宿主启动/Reload、旧profile恢复和完整产物 smoke。旧绿且未受影响的检查沿用，没有再次运行旧 namespace/Auth/terminal suite。
