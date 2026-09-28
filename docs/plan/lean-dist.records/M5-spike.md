# M5-spike · Bun 构建工具链可行性证据记录

- 对应计划：[lean-dist.md](../lean-dist.md) ADR-3、§5-F、§10 M5 行；里程碑记录 [M5.md](M5.md)
- 最近更新：2026-09-28 21:54 +1000
- 状态：完成（结论见 [../../adr/bun-build-toolchain.md](../../adr/bun-build-toolchain.md)：不采纳，与预设一致）
- 环境：Apple M5 Pro / macOS 26.6.2 arm64；bun 1.3.14（mise shim）；node 26.1.0；npm 12.0.2
- 隔离：`git worktree add ../vscodium-bun-spike HEAD`（detached 1f3b2f1）；fixture 为主树 `vscode/build` 整目录（不含 node_modules）+ `vscode/package.json`/`product.json` 副本；实验结束后 worktree 已 `worktree remove --force`，主树仅新增本文件与 ADR 两个文件
- 缓存状态：npm 与 bun 全局缓存均为暖（主树当天构建过；bun install 输出 `Resolved, downloaded and extracted [2]`）。耗时为单机单次采样，仅作量级参考

## 命题一：`bun install` 替 `npm ci` 装 `vscode/build` —— 有条件成立（装得上，保真度有缺口）

| 项 | bun（fixture a） | npm（fixture b） |
| --- | --- | --- |
| 命令 | `bun install` | `npm ci` |
| 退出码 | 0 | 0 |
| 耗时 | 5.42s（自报 534 packages installed [5.42s]，real 5.559s） | 11.58s（自报 added 534 packages in 11s，real 11.579s） |
| 顶层包数（find -maxdepth 2） | 349 | 348 |
| node_modules 体积 | 261M | 276M |
| 锁文件 | 7.6ms 将 package-lock.json 迁移为 **bun.lock**；**package-lock.json 未被改动**（前后 sha256 均 `8f5bc278…`） | package-lock.json 未被改动（同 hash）；无 bun.lock |

关键输出（bun）：

```text
[7.60ms] migrated lockfile from package-lock.json
warn: Bun currently does not support nested "overrides"   (package.json:79, path-scurry→lru-cache)
534 packages installed [5.42s]
Blocked 1 postinstall. Run `bun pm untrusted` for details.
# bun pm untrusted → ./node_modules/tree-sitter-javascript @0.23.1 » [install]: node-gyp-build
```

可用性抽验：

- `./node_modules/.bin/esbuild --version` → `0.27.2`，exit 0（平台二进制经 @esbuild/darwin-arm64 可选依赖到位，无需 postinstall）。
- `bun x tsc --noEmit -p tsconfig.json`（tsconfig.json 存在；typescript 非 build 依赖，由 bunx 临时拉取，两 fixture 用同一 transient tsc）：exit 1，**bun 树比 npm 树多 20 行类型错误**，归一化路径后 diff 全部命中同一模式：`TS2613/TS1192: Module '…/glob/dist/esm/index' has no default export`（7 处）及其级联 implicit-any / SrcOptions 类型漂移。
- 根因定位：`package-lock.json:3649` 钉顶层 `glob@7.2.3`（npm 照装）；bun.lock:574 顶层 `glob@11.1.0`。依赖面：`@electron/asar` 要 `glob@^7.1.6`，`@vscodium/vsce` 要 `glob@^11.0.0`，两包管理器各自 hoist 了不同大版本到顶层 → `import glob from 'glob'` 解析到不同类型。嵌套 lru-cache 两边均为 11.2.1（override 警告本例未造成实际偏差）。
- `bun lib/fetch.ts` → `error: Cannot find package 'event-stream'`，exit 1。**非 bun 缺口**：event-stream 只存在于主树 vscode 根 node_modules，build 级 node_modules（主树与两个 fixture）均无；该脚本在真实仓库靠向上解析根 node_modules。此后以 tsc 对照实验替代。

结论：机械安装可行且快 ~2x，但 ①hoisting 决策与 npm 锁文件不一致（glob 7→11，足以改变 tsc 结果）②原生模块 postinstall 被静默跳过（tree-sitter-javascript 装上不可用）③嵌套 overrides 不支持。不得作为 `npm ci` 的可复现替代。

## 命题二：`bun run` 驱动 gulp 打包链路 —— 失败（根因级实证）

fixture：`fixture/gulpfix`（`bun install` 装 `gulp@^4.0.0` → 4.0.2 / async-done 1.3.2），最小 gulpfile 含 `noop`（async fn 返回 Promise）与 `copy`（`gulp.src('src/**').pipe(gulp.dest('out'))`）两个 task。

| 命令 | 退出码 | 关键输出 |
| --- | --- | --- |
| `bun run gulp --tasks-simple`（在 vscode/build 副本内） | 1 | `error: Script not found "gulp"`（build/package.json 本无 gulp script，真实入口在 vscode 根 `package.json:56`） |
| `bun x gulp --help` | 0 | 正常打印 usage（但见下方「bunx 假象」） |
| `bun ./node_modules/gulp/bin/gulp.js noop` | 1 | `Starting 'noop'...` → `The following tasks did not complete: noop` / `Did you forget to signal async completion?` |
| `bun --experimental-strip-types --max-old-space-size=8192 ./node_modules/gulp/bin/gulp.js noop`（vscode 真实命令形态，`package.json:56` 以 bun 代入） | 1 | 同上 |
| `bun ./node_modules/gulp/bin/gulp.js copy`（stream task） | 1 | `The following tasks did not complete: copy` |
| `NODE_OPTIONS=--max-old-space-size=8192 bun x gulp noop` | 0 | 无警告，正常完成 |
| `bun --max-old-space-size=8192 x gulp noop` | 0 | 无警告，正常完成 |
| `bun --definitely-not-a-flag x gulp noop` | 0 | 无警告，正常完成（bun 静默吞掉一切未知前置旗标） |
| `bun x gulp noop` / `bun x gulp copy` | 0 | 正常完成，copy 产物 `out/hello.txt` 内容正确 |
| `bun x --bun gulp noop`（强制 bun 运行时） | 1 | `The following tasks did not complete: noop` |
| `node ./node_modules/gulp/bin/gulp.js noop`（node 对照） | 0 | `Finished 'noop' after 420 μs` |

根因链（分步探针，`bun -e`）：

```text
Promise.resolve().then(...)                                    → 正常
require('process-nextick-args').nextTick(...)                  → 正常
const d = require('domain').create();
d.bind((x)=>x*2)(21)                                           → undefined   ← node 返回 42
asyncDone(()=>Promise.resolve(), cb)                           → cb 永不触发（1.5s 超时）
```

`async-done@1.3.2:55` `var result = domainBoundFn(done)` 经 `domain.bind` 包装后拿到 `undefined`，`:65` stream 分支与 `:78` promise 分支均不可达 → 完成回调永不注册 → gulp 4 每个异步 task 必然超时失败。**bun 的 node:domain polyfill 丢弃被包装函数的返回值。**

bunx 假象：gulp bin shebang 为 `#!/usr/bin/env node`，bunx 对 node-shebang bin 默认用真 node 执行；`bun x --bun` 强制 bun 后立即复现失败。此前所有 `bun x gulp …` 的「成功」均为 node 在跑。

上游佐证：[oven-sh/bun#5923](https://github.com/oven-sh/bun/issues/5923)「gulp behavior with bun」，2023-09-22 报告，截至 2026-09-28 仍 open（5 条评论），bun 1.0.3→1.3.14 未修复。

结论：败。gulp 4 任务编排层在 bun 下不可用（domain 语义缺口），V8 堆调优旗标静默失效；打包链路无法由 bun 驱动。

## 命题三：bun 跑构建期小脚本 —— 成功

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `bun -p "1+1"` | 0 | `2` |
| `bun -p "require(\"./product.json\").nameShort"`（fixture a/vscode 内） | 0 | `VSLight`，与 `node -p` 同输出（覆盖 `build_cli.sh:14,23,24`、`prepare_assets.sh:43-45` 用法） |
| `bun -e "console.log(Date.now())"` | 0 | 正常 |
| `bun build/lib/policies/policyGenerator.ts build/lib/policies/policyData.jsonc darwin`（= `build.sh:28` 原命令换运行时，fixture a/vscode 内） | 0 | 警告行 `Skipping policy localization: No 'resourceUrlTemplate' found in 'product.json'.`（fork product.json 无该键 → 不触网），产物写入 `.build/policies/darwin/` |
| `node …policyGenerator.ts … darwin`（同树对照） | 0 | 同上 |
| `diff -r`（bun 产物 vs node 产物） | 0 | **逐字节一致**（`darwin/com.vslight.mobileconfig`、`darwin/en-us/com.vslight.plist` 两个文件） |

注：policyGenerator 依赖的 minimist/jsonc-parser 来自 bun 安装的 node_modules，node/bun 双运行时均正常解析；`import.meta.main` 守卫在 node 26 与 bun 下均为 true。

结论：成。构建期 TS 小脚本与 `node -p/-e` 等价物可由 bun 直接执行，输出与 node 逐字节一致。

## 隔离纪律核对

- 主树 `vscode/build/package-lock.json`、`vscode/package-lock.json` 全程未读写（fixture 副本 sha256 `8f5bc278…` 实验前后一致）；`bun.lock` 仅存在于 spike worktree 的 fixture 内，随 worktree 一并删除。
- 主树仅新增本文件与 `docs/adr/bun-build-toolchain.md`；收尾 `git worktree remove --force` + `git status --porcelain` 核对无其他新增污染（结果回报给主 agent 一并记录）。
