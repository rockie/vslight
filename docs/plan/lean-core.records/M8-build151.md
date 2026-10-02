# M8 · 151 最小终端过滤补丁与实际完整构建

核验记录时间：2026-10-02T19:18:26.738566+10:00。基线 dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，上游 08d4889f9ec4a1685d257b9b95de036c8e1ce1e5；本轮 **实际完整构建与静态子门 PASS**。151 的 packaged registry、普通 terminal controls、native GUI、真实 quit 生命周期与独立签名链尚缺；双 arch 当前输入 CI 按用户 local-only 要求未跑，M8/Release 不记完成。

## 本次构建与既有实际检查

私有根：/private/tmp/lean-core-build151-c480juxs。实际 source：/private/tmp/lean-core-build151-c480juxs/vscodium/vscode；app：/private/tmp/lean-core-build151-c480juxs/vscodium/VSCode-darwin-arm64/VSLight.app。构建命令 bash dev/run-build.sh -s，root 实际执行 2026-10-02T18:47:16.400130+10:00 至 2026-10-02T18:49:44.332883+10:00，耗时 147.933s，真实 exit 0。Node 24.18.0、npm 11.16.0、Electron 43.7.5、CI=true、arm64、macOS floor 12.0。

- root 已执行全 source native noEmit：真实 exit 0，stdout 0B、stderr 0B。
- root 已执行 npm ls --omit=dev --all --json：真实 exit 0，stdout 32,665B，stderr 1,094B。本轮独立重计该实际图为146个 unique names、199个 occurrences，递归 problems/missing/invalid/extraneous 与退休依赖全部 0。
- root 已执行 actual unsigned package checker：真实 exit 0，stdout 3,667B、stderr 0B。CRI、katex、node-pty、sqlite、ripgrep、physical semver 全齐，retired package/out/product keys/extensions、missing entries、structure errors 全部 0。

本轮只读取这些真实结果，不重跑 build/compile/tests/noEmit。完整命令、退出和 package JSON 在 [M8-build151.json](M8-build151.json)；原始 build.log、*-exit.json、production-graph.json/stderr、native-noemit.log/stderr、package.json/stderr 保留于上述私有根。

npm stderr 是7条 Unknown project config 兼容性/弃用警告：disturl、target、ms_build_id、runtime、build_from_source、build_from_source_native_keymap、timeout，全部来自真实 generated source/.npmrc。没有隐藏或把1,094B写成0B；该警告不等于缺依赖，production graph 实际 exit0、problems0。

## 冻结输入与254 prune

冻结 manifest：/private/tmp/lean-core-build151-c480juxs/build-inputs.json，SHA-256 f6fc4ff04b5b1c4828dc8c1f353f0a2bdb16affa7a5883a8d8fae2ee64fb5cd6，1475文件。私有 vscodium 副本1475/1475精确匹配冻结 hash，manifest未改。当前工作区核验快照1468匹配/7后改差异，全部是文档或记录；生产/构建输入、验收 helper 与 workflow 无漂移，记录目录外未发现新输入。精确分类计数及每项冻结/当前 hash 见 JSON。

后改文档：

- docs/plan/lean-core.md
- docs/plan/lean-core.records/M4.md
- docs/plan/lean-core.records/M6-runtime150-final.json
- docs/plan/lean-core.records/M6-runtime150-final.md
- docs/plan/lean-core.records/M8-docs-final-audit.md
- docs/plan/lean-core.records/M8-remaining-gates.md
- docs/plan/lean-core.records/M8.md

patches/light/prune.json 的全部254路径在实际151 generated source物理 absent；不是只统计清单。原 manifest 不回写当前文档 hash，旧执行输入保持原样。

## 151源码 preimage

151补丁 SHA-256：92282c3d51a074371264fdf60232207d1ecfffe10190d006d851b126a81fc77b。目标 src/vs/workbench/contrib/terminal/common/terminal.ts 的冻结150 preimage hunk只出现1次。把151补丁唯一 hunk替换到冻结150整文件后，结果与实际151生成源码逐字节相同；实际151 source上 git apply --reverse --check 真实 exit0（dry-run，不改源码）。

冻结150与实际151 src全树各5213个文件/链接独立比较，只发现 terminal.ts 这1项变化，其余5212项相同。150文件 hash 77a81b4db4b04ea8e897ab9a2ab877136c67bb274b82f8c1a3faa98daa907baf；151文件 hash 5fd803f6451e977bb288b9aaab35b93a27661ca581ecea9fdc0a45184d482deb。

唯一改动移除24个已经退休的 debug/sessions terminal skip-shell command IDs。24项在151文件均 absent；其余源码字节完整保持。该静态事实不代替真实普通终端 controls/registry 验收。列表、hunk核对、全树对比保留于 JSON 和私有根 src151-vs-frozen150.json。

unsigned 体积、ZIP SHA及独立CRC见 [M8-artifact151.md](M8-artifact151.md)。150记录、旧manifest、旧/新app均未改写，本轮未签名/GUI/运行smoke/提交/推送/触发CI或发布。
