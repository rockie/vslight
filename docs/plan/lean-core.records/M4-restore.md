# M4 · 窗口恢复索引

- 计划：[lean-core.md](../lean-core.md)，对应 §4、§9.2、M4 的通用窗口恢复。
- 最近更新：2026-10-01 21:47:50 AEST（UTC+10）。
- 状态：独立实现与单测已完成；等待集成人重放和 M4 全图验证，M5/M6 实机恢复未运行。
- 代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33` 的隔离 114 基线，源码上游 `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`；来源为 [M1-repaired-baseline-inputs.json](M1-repaired-baseline-inputs.json) 所指源码树。
- 交付：[117-light-editor-restore-index.patch](../../../patches/117-light-editor-restore-index.patch)。SHA256：`0340b44e360c4a0292d35ebff0d63f83bb464409dd36dc31bd097c6d3f2c0821`。
- 修改边界：仓库只新增补丁与本记录；未修改用户 vscode 生成树、基线 app、API/protocol/factory/prune、计划或 115/116。私有源码和测试输出位于 `/tmp/restore-11d92xrr`，node_modules 只读使用隔离 114 基线依赖的 symlink；没有操作真实 app GUI 或个人 profile。

## 实现记录

补丁仅含两个源文件：

- `vscode/src/vs/workbench/common/editor/editorGroupModel.ts`。
- `vscode/src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts`。

原实现先 coalesce 删除无法恢复的 editor，再用旧 mru/preview 索引访问已压缩数组；退休项之前的偏移因此转到相邻普通 editor。sticky 在遍历旧索引时递减传入 data.sticky，后续退休项可能已越过被改变的边界，且会修改调用方 state。根因已由真实红测试复现，没有重新注册任何退休 editor 来规避。

修复保留 `editorsByOriginalIndex` 的未压缩映射：普通 sequential 列表使用 coalesce，MRU 与 preview 从原索引映射恢复；active 继续取第一个存活 MRU。缺失 preview 恢复为 null；sticky 仅累计原 sticky 边界内实际存活 editor，不修改输入 state。serializer 的既有未知/返回 undefined 容错保留；无缺失状态对照和既有测试均通过。

补丁增加 16 个回归：8 个明确输入/预期，各分别走未注册 serializer 与已注册但 deserialize 返回 undefined 两种路径。复用现有 TestEditorInputSerializer 和测试 DI，没有把目标逻辑复制为测试实现；预期为明确的 editor id 顺序、active、preview 和 sticky 归属。每例同时检查 stickyCount、group id 与输入 state 不变。

| 输入场景 | 关键预期 |
| --- | --- |
| `[R,A,B]`，MRU `[1,2,0]` | ordinary 顺序与 MRU `[A,B]`，active A |
| `[R,A,B]`，MRU `[0,2,1]` | active 退休后 MRU `[B,A]`，active B |
| `[R,A,B]`，preview 0 | preview null，不转给 A |
| `[R,A,B]`，preview 1 | preview 仍为 A |
| `[R1,R2,A]`，sticky 1 | A 非 sticky，stickyCount 0 |
| `[R1,R2,A,B]`，sticky 2 | 仅 A sticky，边界按原索引解释 |
| 全部退休，含 MRU/preview/sticky | 空组、空 MRU、active/preview null、stickyCount 0 |
| 完全无退休，MRU `[1,0]`/preview 1/sticky 0 | 原顺序、active B、preview B、仅 A sticky；输入 state 不变 |

## 红、绿与重放

独立 snapshot 复制 114 基线的 src/test/build/scripts/remote 和必要 manifest，生成物均写私有 out。使用仓库现有转译入口和上游 browser unit runner；Chromium 已安装，默认 headless，提供实际 DOM/浏览器环境，不是 Node mock。不启动 VSLight 实机窗口。

以下命令 cwd 均为 `/tmp/restore-11d92xrr`。先仅新增测试，产品源码仍为 114 原实现：

```bash
node build/next/index.ts transpile
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts \
  --grep 'group deserialization with missing serializers' > restore-red.log 2>&1
```

转译 exit 0，私有 out 包含测试模块。红测试 exit 1，**2 passing / 14 failing**。两条无退休对照通过，其余均有具体断言失败：MRU/active 偏移、preview 错迁移、连续退休 sticky、全退休 stickyCount 或输入 state 变更。[红日志](/tmp/restore-11d92xrr/restore-red.log)。

再修产品源码，仅增量转译该模块：

```bash
node --input-type=module - <<'JS'
const { transpileFile } = await import('./build/next/transpile.ts');
await transpileFile('src/vs/workbench/common/editor/editorGroupModel.ts',
  'out/vs/workbench/common/editor/editorGroupModel.js');
JS
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts \
  --grep 'group deserialization with missing serializers' > restore-green.log 2>&1
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts \
  > restore-full.log 2>&1
```

绿阶段两次 runner 均 exit 0：新增回归 **16 passing**，完整同文件 **65 passing / 0 failing**，包含 49 个既有用例。[绿日志](/tmp/restore-11d92xrr/restore-green.log)、[完整同文件日志](/tmp/restore-11d92xrr/restore-full.log)。最终补丁仅清理一个多余空行后生成，未改变已验证逻辑。

补丁从私有原件与最终源码的 unified diff 生成。原始文件 SHA256 分别为：

- model：`c72776f936e0d9fd829905c5639b0de534937deb4246fb6ac46ecafced555165`。
- test：`bf173026093dd534339d0fb17a35a8344cd5edffd238af1a716a89a954e15df1`。

在只含这两个原件的 `/tmp/restore-11d92xrr/original` 运行以下检查与重放：

```bash
git apply --check /Users/rockie/Documents/gh-xgent/vscodium/patches/117-light-editor-restore-index.patch
git apply /Users/rockie/Documents/gh-xgent/vscodium/patches/117-light-editor-restore-index.patch
```

两项 exit 0；重放后的两个文件与最终私有源码逐字节一致。临时目录与日志只作为当次证据，未收入补丁；补丁不含生成 JS、编译配置排除或退休 Chat/Browser 注册。

## 验收记录

| 退出条件 | 命令或步骤 | 环境/代码基线 | 实际结果 |
| --- | --- | --- | --- |
| 先红证明原实现缺陷 | 上述 grep 回归 runner | 私有 114 源码，仅新增测试，Chromium headless | exit 1，2 PASS / 14 FAIL；各失败有断言证据 |
| 五类状态及退休 active 变体正确 | 相同 grep runner | 私有 114+117 源码 | exit 0，16 PASS，0 FAIL |
| 原有正常恢复行为不回归 | 不带 grep 的同文件 runner | 同上 | exit 0，65 PASS，0 FAIL |
| 补丁重放可用且范围精确 | apply --check、apply、两文件 byte equality | 私有原始两文件 | exit 0，两文件一致；patch 只含 model/test |
| 文档引用检查 | documentation-writer check_doc.py | 本记录 | 已运行，exit 0，无错误 |
| M4 全图 typecheck/DI/RPC/普通功能 | 集成人统一验证 | 114+115/116+各 M4 补丁集成 | 未运行，不由本任务测试替代 |
| M5/M6 真实旧 profile 恢复 | [M1 fixture 来源](M1-fixture-inventory.md) 的 Browser-only/混合副本 | 对应里程碑的新 app | 未运行；本任务未操作 GUI |

继续动作：集成人重放 117 到集成源码，核验全图与其它 M4 解绑结果；M5/M6 用已有真实来源的合成 profile 副本实机验 sequential/MRU/active/preview/sticky。此子任务通过不代表 M4 整体完成。
