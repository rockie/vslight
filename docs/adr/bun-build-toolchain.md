# ADR：Bun 作为构建机工具链——不采纳，仅保留「安装提速」局部观察项

- 状态：Accepted（2026-09-28，M5 限时 spike 实证后落盘）
- 对应计划：[../plan/lean-dist.md](../plan/lean-dist.md) ADR-3、§5-F、R-3、C-3
- 证据记录：[../plan/lean-dist.records/M5-spike.md](../plan/lean-dist.records/M5-spike.md)

## 背景与驱动

用户问题（R-3）：「node 能不能换成 bun？」

已核实的物理事实（C-3，不在本 ADR 重议）：产物运行期 Node 不可替换——Electron 42.8.1 内嵌 Node 运行时，reh 产物钉官方 node 二进制（`vscode/build/gulpfile.reh.ts:141-146`），bun 物理上够不到。因此评估范围仅为**构建机一侧**。

构建机全量替换此前被四道墙否决（计划 ADR-3 背景节，事实仍成立）：`vscode/build/npm/preinstall.ts` 的 node 版本门禁 / 拒绝 yarn / 要求 npm<13；`vscode/build/npm/postinstall.ts:13,91` 硬编码 spawn npm 循环装 ~50 个子目录；`.npmrc` 的 `disturl/target=42.8.1/runtime=electron/build_from_source` 是 npm/node-gyp 私有语义（26 个原生模块 install script 依赖）；`npm run gulp` 承担 PATH/env 注入且 gulp 命令行含 V8 旗标。

M5 spike 的任务是对仅存疑的子命题拿实证，而非重开全量替换讨论。

## Spike 实证结果（2026-09-28，Apple M5 Pro / macOS 26.6.2 arm64，bun 1.3.14 vs node 26.1.0 / npm 12.0.2）

隔离 worktree `../vscodium-bun-spike`（已收尾删除），fixture 为主树 `vscode/build` 整目录 + `vscode/package.json`/`product.json` 的副本。逐条命令与输出见证据记录。

### 命题一：`bun install` 替 `npm ci` 装 `vscode/build` —— 机械上装得上，保真度有缺口

- 成：`bun install` exit 0，5.42s 装 534 包（对照 `npm ci` 11.58s 装 534 包，均为暖缓存单次采样，仅作量级参考）；自动将 `package-lock.json` 迁移为 `bun.lock`（7.6ms），**未触碰原 lockfile**（sha256 前后一致）；包数与 npm 一致（349 vs 348，顶层口径）；esbuild 平台二进制（@esbuild/darwin-arm64）未经 postinstall 即可用（`esbuild --version` → 0.27.2）。
- 缺口 1（解析保真）：bun 迁移锁文件后**未保持 npm 的 hoisting 决策**——`package-lock.json:3649` 钉顶层 `glob@7.2.3`，bun 装成顶层 `glob@11.1.0`。同一 `bun x tsc --noEmit -p tsconfig.json` 对照（同一 transient tsc）：bun 树比 npm 树多 20 行类型错误（`TS2613/TS1192: Module 'glob/dist/esm/index' has no default export` 及其级联），根因即 glob 顶层版本漂移。嵌套 overrides 不支持（`warn: Bun currently does not support nested "overrides"`，本例碰巧解析结果相同，未咬人）。
- 缺口 2（原生模块）：`tree-sitter-javascript@0.23.1` 的 `[install]: node-gyp-build` 被 bun 默认安全策略**静默 block**（`Blocked 1 postinstall`），不手工 `bun pm trust` 则该原生模块装上但不可用，且安装过程无任何失败信号。

### 命题二：`bun run` 驱动 gulp 打包链路 —— 失败（根因级实证）

- vscode 真实调用形态（`package.json:56` 的 `node --experimental-strip-types --max-old-space-size=8192 ./node_modules/gulp/bin/gulp.js`）以 bun 代入后，**每一个返回 promise 或 stream 的 task 都报** `The following tasks did not complete: noop` / `Did you forget to signal async completion?`，exit 1。最小 gulpfile（noop task）即可复现。
- 根因：bun 1.3.14 的 `node:domain` polyfill 中 **`domain.bind()` 丢弃被包装函数的返回值**：`d.bind((x)=>x*2)(21)` 返回 `undefined`（node 返回 42）。gulp4 → undertaker → `async-done@1.3.2:55` 经 `domainBoundFn(done)` 拿任务返回值，拿到 `undefined` 后 promise 分支（`:78`）与 stream 分支（`:65`）都不可达，完成回调永不注册。分步探针：裸 Promise/.then、process-nextick-args 在 bun 下正常；domain.bind 包一层后返回值即丢失。
- V8 旗标**不报错但被静默吞掉**：`NODE_OPTIONS=--max-old-space-size=8192`、`bun --max-old-space-size=8192 …`、甚至 `bun --definitely-not-a-flag …` 全部 exit 0。构建期 8GB 堆调优在 bun（JavaScriptCore）下语义失效且无任何警告——比「报错」更危险：失败是静音的。
- `bun x gulp noop` 的「成功」是假象：gulp bin shebang 为 `#!/usr/bin/env node`，bunx 默认用**真 node** 执行该类 bin；`bun x --bun gulp noop` 强制 bun 后立即复现相同失败。
- 上游已知问题：[oven-sh/bun#5923](https://github.com/oven-sh/bun/issues/5923)（2023-09-22 报，截至本 spike 仍 open）；本 spike 在其上补了根因定位。

### 命题三：bun 跑构建期小脚本 —— 成功

- `bun -p` / `bun -e` 与 `node -p` / `node -e` 等价（`bun -p "require(\"./product.json\").nameShort"` → `VSLight`，与 node 一致），可覆盖 `build_cli.sh:14,23,24`、`prepare_assets.sh:43-45` 的用法。
- `bun build/lib/policies/policyGenerator.ts build/lib/policies/policyData.jsonc darwin`（即 `build.sh:28` 原命令换运行时）exit 0，产物（`darwin/com.vslight.mobileconfig`、`darwin/en-us/com.vslight.plist`）与同树 node 运行结果 `diff -r` **逐字节一致**。该脚本依赖的 minimist/jsonc-parser 来自 bun 安装的 node_modules，node/bun 双运行时均可正常解析。

## 备选

- A：构建机全量 bun 化。淘汰：四道墙（计划 ADR-3 背景）+ 本 spike 命题二根因级失败 + 命题一保真度缺口。
- B（本决策）：运行时不谈（物理不可），构建侧不采纳 bun；仅把「bun install 装纯 JS 子目录」与「bun 跑构建期 TS 小脚本」登记为带边界的局部可选项，保留观察。
- C：spike 后顺带把 `node -p`/policyGenerator 换成 bun。淘汰：收益为零（这些脚本不是瓶颈），徒增一条与上游分叉的维护面；命题三证据只用于登记边界，不用于落地。

## 决策

**不采纳 bun 作为构建机工具链的任何正式环节**（安装、脚本、打包、CI 一律维持 node/npm）。仅保留两个带边界的观察项：

1. `bun install` 可在「无原生模块 install script、不依赖顶层 hoisting 语义、无嵌套 overrides」的纯 JS 子目录做**非可复现**的快速安装（本仓库唯一符合条件的 `vscode/build` 实测快 ~2x，但存在 glob hoisting 漂移与原生模块静默跳过两个反例，故不得用作 `npm ci` 的可复现替代）。
2. bun 可直接执行构建期 TS 小脚本（policyGenerator 类、`node -p/-e` 等价物），输出与 node 逐字节一致；仅作知识登记，不落地。

## 后果

- 正面：结论有据且边界精确——未来再有人问「换 bun」，可直接引用命题二的 domain.bind 根因与 oven-sh/bun#5923；CI/构建脚本继续只有 node/npm 一条工具链，维护面不增。
- 负面/中性：1 人日内 spike 成本（隔离 worktree，主树零污染，lockfile sha256 前后一致）；「安装提速 ~2x」的诱惑被明确标记为带缺口，防止未来只记住「快」而重开评估。
- 对 CI：无改动（setup-node 步骤维持现状）。

## 重新评估触发

- bun 修复 `node:domain` 语义（`domain.bind()` 透传返回值）且 oven-sh/bun#5923 关闭 → 重跑命题二；
- bun 官方完整支持 node-gyp 生态（含 `.npmrc` 的 disturl/target/runtime 语义）且不再静默跳过原生模块 postinstall → 重跑命题一；
- 上游 vscode 放开包管理器门禁（`preinstall.ts` 改写、postinstall 不再硬编码 npm）→ 重估全量替换；
- 上游 vscode 用 gulp 5 或其他任务框架替换 gulp 4 → 命题二结论失效，需重做。
