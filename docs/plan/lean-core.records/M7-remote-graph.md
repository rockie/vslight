# M7 remote 实际生产安装图

2026-10-02 00:18 +1000（2026-10-01 14:18 UTC），在独立临时目录完成最终 remote manifest/lock 的真实离线生产安装。npm ci 与生产 npm ls 均退出 0，依赖图没有 problems、没有退休包。此证据验证安装及依赖闭包；安装显式忽略 scripts，没有执行 remote server 或原生模块运行验证。

## 输入和隔离

输入目录由 `/tmp/lean-core-deps136-path` 提供，实读为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-deps136-_x59epje`。只复制其中 remote/package.json 和 remote/package-lock.json 到 `/tmp/lean-remote-ed6xg2xq/install`，没有复制旧 node_modules、源码或个人数据。root 当前 SHOULD_BUILD_REH=no，本次补足 remote 独立安装图，不宣称构建了 REH 产物。

| 文件 | 输入/复制件 SHA-256 |
|---|---|
| package.json | `5cc1d50a5f6ec3d6ae2fa14c86e17dcc1c31476b031d9911adafb09d639a7638` |
| package-lock.json | `f1f3317d249985009294caae5898dfb391e0251c47713141e2964566aa0af6b7` |

安装和读取图后再次核对两个源文件及两个复制文件，四个 hash 均保持原值。没有修改源 manifest/lock、root/source 或项目工具配置。默认 Node 为 26；此次用 mise 的一次性版本选择，实测 Node v24.18.0、npm 11.16.0。Node 24.18.0 首次选择时由 mise 安装；npm 包安装全部命中缓存，无联网重试。

## 实际命令与退出证据

以下命令的工作目录是隔离 install 目录。私有 `run-install.py`、`inspect-graph.py` 通过 subprocess 保存完整 stdout/stderr 和实际退出码，不以日志中的成功文字替代退出状态。

```sh
mise exec node@24.18.0 -- npm ci --omit=dev --ignore-scripts --legacy-peer-deps --offline --no-audit --no-fund
mise exec node@24.18.0 -- npm ls --omit=dev --all --json
```

| 操作 | 真实结果 | 日志 |
|---|---|---|
| ci 离线生产安装 | exit 0；npm 输出 added 118 packages in 806ms；外层计时 0.921 秒 | `/tmp/lean-remote-ed6xg2xq/ci-offline.log` |
| npm ls 生产全图 | exit 0；递归 problems=[] | `/tmp/lean-remote-ed6xg2xq/npm-ls-production.json`；stderr 日志为空 |
| 图、实际目录及 hash 核对 | 私有验证脚本 exit 0；退休命中=[]；源/复制件未变 | `/tmp/lean-remote-ed6xg2xq/summary.json` |

完整命令/版本/退出码在 `/tmp/lean-remote-ed6xg2xq/commands.json`，来源 hash 在 `/tmp/lean-remote-ed6xg2xq/provenance.json`。可通过 `/tmp/lean-remote-graph-path` 取得本次证据目录。结果来自本次安装，不引用 root 146 unique 包名的桌面安装图作为 remote 证明。

## 生产闭包和保留项

| 口径 | 数量 |
|---|---:|
| remote manifest 直接生产 keys | 44 |
| npm ls 图唯一包名 | 110 |
| npm ls 图唯一包名/版本组合 | 114 |
| npm ls 递归依赖出现次数 | 161 |
| 磁盘实际安装 package 目录 | 118 |
| 磁盘实际 package 唯一包名/版本组合 | 114 |
| node_modules 全部目录（含包内部目录） | 525 |

依赖出现次数会包含被多条边共享的同一包；目录数会包含同版本多位置副本，均不能当成唯一包名数。完整依赖边记录在 `/tmp/lean-remote-ed6xg2xq/graph-package-entries.json`，实际包目录/版本在 `/tmp/lean-remote-ed6xg2xq/physical-packages.json`。

本次生产图中不存在 @microsoft/mxc-sdk、@vscode/sandbox-runtime、ssh2、zod，也不存在 @pondwader/socks5-server、cpu-features、foundry-local-sdk、playwright-core、@anthropic-ai/claude-agent-sdk、@openai/codex。后五项中并非每项原本都在 remote manifest；此处陈述实际图缺失，不宣称它们全是此次 remote 删除量。

与 [M7-dependencies-inventory.md](M7-dependencies-inventory.md) 的冻结旧 remote lock 比较，以下 15 个路径退出最终 lock，并已断言隔离磁盘相同路径全部不存在：

```text
node_modules/@microsoft/mxc-sdk
node_modules/@pondwader/socks5-server
node_modules/@vscode/sandbox-runtime
node_modules/@vscode/sandbox-runtime/node_modules/commander
node_modules/@vscode/sandbox-runtime/node_modules/zod
node_modules/asn1
node_modules/bcrypt-pbkdf
node_modules/buildcheck
node_modules/cpu-features
node_modules/nan
node_modules/safer-buffer
node_modules/shell-quote
node_modules/ssh2
node_modules/tweetnacl
node_modules/zod
```

其中 commander 仍由普通 katex→commander 使用；只删除退休 sandbox 的嵌套副本。其他 13 个唯一包名（zod 有两个旧路径）均不在最终普通 remote 生产图。普通 node-pty、@vscode/sqlite3、@vscode/ripgrep-universal、katex、@vscode/fs-copyfile、tar、semver 全部保留。既有 @microsoft/1ds-core-js 与 @microsoft/1ds-post-js 的声明和真实图仍保留；没有借本次依赖退休扩大 1DS 处置范围。

## 安装字节和验证限度

只计本次实际 node_modules 文件；遍历不跟随 symlink。普通文件逻辑长度由 lstat.st_size 汇总，分配字节由 lstat.st_blocks×512 汇总，额外按设备/inode 去重记录逻辑长度。没有将 manifest、日志、缓存或 source 计入安装字节。

| 实际安装口径 | 结果 |
|---|---:|
| 普通文件 | 3,020 |
| symlink | 8 |
| 普通文件逻辑字节 | 192,066,255（183.1687 MiB） |
| 去重 inode 后逻辑字节 | 192,066,255 |
| 普通文件 st_blocks 分配字节 | 199,659,520（190.4102 MiB） |

st_blocks 汇总不等于 APFS 上新增的独占磁盘占用。本次是未应用产品 moduleignore/ASAR/filter 的原始生产安装目录，不能拿这个数当作最终 REH 包体、桌面安装节省量或 native build 后字节。ignore-scripts 禁止安装 lifecycle scripts；它没有验证 SQLite/PTY/kerberos 等原生 ABI、目标平台 optional package、REH 启动、普通功能运行或 GUI。没有执行这些运行验证，也没有调整 source/lock 来使依赖图通过。
