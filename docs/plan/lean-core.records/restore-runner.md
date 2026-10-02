# 真实旧 profile 恢复 runner

- 交付：[restore.js](../../../dev/test-fixtures/lean-core/restore.js) 与 [extension.js](../../../dev/test-fixtures/lean-core/extension.js)。这是私有开发扩展 fixture，不发布、不加入内置扩展；根 API fixture run.js 未修改。
- 最近更新：2026-10-02。fixture 实现阶段完成 Node 语法/真实生成数据解析/坏输入检查；随后主 agent 用正式138 app 顺序运行两套共12个case，API、真实正常退出和保存态验收全部通过，见 [M6-final-restore.md](M6-final-restore.md)。本文保留 runner 契约与实现阶段检查，不重跑已绿case。
- 来源：[M1-restore-source-state.json](M1-restore-source-state.json)、[M1-restore-fixtures.json](M1-restore-fixtures.json)、[M1-fixture-inventory.md](M1-fixture-inventory.md) 与 [create-retired-tabs.py](fixtures/create-retired-tabs.py)。恢复索引实现与真实单测见 [M4-restore.md](M4-restore.md)。

## 来源与数据契约

M1 原测试 profile 经正常 Quit 保存，源工作区 realpath 为 `/private/tmp/lean-restore-jdsqe80h/workspace`，而 workspace.json 的精确 folder URI 是 `file:///tmp/lean-restore-jdsqe80h/workspace`。launch 必须沿用该精确 URI（此例路径为 `/tmp/lean-restore-jdsqe80h/workspace`），不能用 realpath 拼写替换；普通 editor serializer 中已有的 /private/tmp URI 原值保持。真实 editorpart.state 包含普通 A.txt/B.txt，MRU `[1,0]`、preview 1、sticky 0；准备 API 版本 1.135.0，完整 app 版本 1.135.06566，两者不是同一字段。源 profile inventory SHA256 为 `b728dc1da4ad3bc5255303eb16dd61ce3918f681ffc900759eb23567225b2dca`。

生成器复制普通 serializer payload 原值，并向每个独立测试 profile 合成退休项；没有真实 AI session 数据。现有 manifest 为 `/tmp/lr-d16ezm2o/manifest.json`（Browser+Chat）和 `/tmp/lr-nepzo6pm/manifest.json`（Browser-only），各有五类、六个 variant：

| 编号 | category / variant | 预期普通 Tab 状态 |
| --- | --- | --- |
| 1 | mru-active / retained-active | A、B；active A；无 preview/sticky |
| 2 | mru-active / retired-active | A、B；active B；无 preview/sticky |
| 3 | retired-preview / default | A、B；active A；preview 空；无 sticky |
| 4 | consecutive-sticky / default | A、B；active A；原 sticky 边界内全部退休，普通 sticky 为 0 |
| 5 | all-retired / default | 真正空 editor group，active/preview 空、sticky 为 0 |
| 6 | no-retired / default | A、B；active B；preview B；A sticky |

生成器没有独立 case.json；每项为 manifest.cases 描述对象，另有 group.after.json 和 expected.json。LEAN_RESTORE_CASE 支持两种输入：

- 直接使用 `/tmp/lr-d16ezm2o/1/group.after.json`，runner 自动找上一层的 manifest.json 与同目录 expected.json。
- 将对应 manifest.cases 项原样导出为任意 `/tmp` 下 case.json，runner 从其 group_state 找到相同 manifest。描述对象不得加入/改写字段。

loadCase 校验真实 synthetic-profile/无 gap/usable_for_gui_restore、源版本/hash、case 唯一归属、expected 与 manifest 相等、普通 A/B serializer payload 原值、file URI 与准备 metadata 相符。不接受单元 fallback。退休 serializer value 仅为输入 JSON 内未解释的字符串；runner 不解析 Browser/Chat payload、不注册退休 serializer、不打开退休项或读取 AI 文件。预期 MRU 直接读取 M1 expected 数据，未复制产品的退休索引算法。

## 正常 activation 与输出

package 的 activation event 已是 onStartupFinished。extension.js 保留 leanCore.echo 和返回 API，在 LEAN_RESTORE_CASE 非空时延迟 250ms 调用 restore.run；没有该变量时 API fixture 的原工作方式继续使用。restore 模式拒绝 ExtensionMode.Test，因此不得传 extensionTestsPath；该模式会使用内存 storage，无法验收真实恢复与保存。

| 环境变量 | 必需值 |
| --- | --- |
| LEAN_RESTORE_CASE | 上述真实生成 case 输入的绝对 /tmp 路径 |
| LEAN_RESTORE_RUN_ID | 每次唯一；1–100 字符，仅字母/数字/点/下划线/连字符 |
| LEAN_RESTORE_RESULTS | 全新、绝对 /tmp JSON 输出路径；须在源 profile、生成 dataset/profile 和源 workspace 之外 |

输出用 exclusive-create 预留，已有结果文件直接失败，防止前一次 PASS 被当成当前结果；随后原子替换 JSON。case/provenance 数据只读，fixture 不读取 SQLite。运行时必须有唯一真实 workspace folder，realpath 与 M1 准备 workspace 相等。还要求实际 context.storageUri 位于 /tmp，workspace storage id 与 manifest.source_workspace_database 的 id 一致，并记录 actualWorkspaceDatabase，便于主 runner 核对实际启动 profile。storageUri 映射已按 extHostStoragePaths.workspaceValue 的实际实现核对。

fixture 仅订阅真实 tab/group 事件、读取公开 window.tabGroups，既不开新文件，也不改变布局/focus。普通场景最少观察 3 秒，最终 1.5 秒无 tab/group 事件或 snapshot 变化；数量尚未到预期会等至 30 秒再失败。all-retired 最少完整观察 **15 秒**，且必须有已初始化的真实 active group；不会因第一次 all 数组为空而通过。没有初始化、额外 tab、错误状态或超时均失败。

Tab.isPinned 已核对 mainThreadEditorTabs：它映射 group.isSticky，不是普通的“退出 preview”。runner 精确断言一个 group、TabInputText、A/B URI 与顺序、active tab/group、preview 和 sticky flags；全退休另断言所有 group 的 tabs 都为空。

结果含 status、case/runId、源 hash/API/app 版本、expected、observed、逐条 assertions、事件与等待时长、actualWorkspaceDatabase。PASS 只表示公开 Tab API 检查通过；mru.status 始终是 REQUIRES_POST_SHUTDOWN_SQLITE。公开 API 没有 MRU，也没有精确的 whenRestored barrier，不能据此伪造 MRU 或最终保存态验收。

完成后写结果，再执行 workbench.action.quit。断言失败同样写 FAIL 并请求正常 Quit；quit 命令异常会更新 FAIL。quit.requested 只证明已请求，不能证明主进程退出或 SQLite 已保存。无效输入、输出不可写或已有输出可能没有新的结果文件；主 runner 必须将缺失/旧 runId/RUNNING/FAIL/超时当失败，不能看 CLI exit 0 判绿。

## 主 agent 的真实运行步骤

以下为 launch 契约；正式138实际执行证据见 [M6-final-restore.md](M6-final-restore.md)。示意 CLI 命令没有逐字执行，系统 launch/循环脚本由主 agent 单写；所有 case 顺序运行，同一时间只有一个 app 会话。

1. 先用 Node validate-case 检查输入。为每次运行创建短 `/tmp/rr-...` 目录，复制对应生成 case 的 p 到其中，保持原生成 profile 和源 profile 不变；不要复用被前一次 Quit 改写的 profile。
2. launch 前从复制 profile 的 source_workspace_database 只读核对 memento/workbench.parts.editor 内注入 group，必须逐字节/JSON 等于该 case 的 group.after.json。尤其全退休若误用了空新 profile，会出现假绿；这一步不可省略。
3. 用最终 app、原 workspace.json 的精确 folder URI（不能规范化为 realpath 拼写）、复制的 user-data-dir、隔离 extensions/shared-data 目录和 extensionDevelopmentPath 启动，设置上述三个变量。不要传 extensionTestsPath。先跑 no-retired 普通控制例，确认同一 launch/保存链能恢复 A sticky/B preview，再跑退休项。
4. 等真实主进程完成正常 Quit。记录实际 app/PID/启动参数、开始/退出时间与主进程退出证据；CLI 的提前 exit 0 不替代该证据。建议外层上限至少 45 秒，超时标失败。
5. 校验结果 runId/casePath/status/所有 assertions 与实际复制 profile 路径一致，然后执行下面的保存态核对。只有 API、真实正常退出和 SQLite 三段证据都通过，才能记该 case 实机通过。

```bash
node dev/test-fixtures/lean-core/restore.js --validate-case \
  /tmp/lr-d16ezm2o/6/group.after.json

# LEAN_FINAL_CLI 为主 agent 确认的最终隔离 app CLI；下列仅是参数示意。
LEAN_RESTORE_CASE=/tmp/lr-d16ezm2o/6/group.after.json \
LEAN_RESTORE_RUN_ID=restore-control-unique \
LEAN_RESTORE_RESULTS="$restoreRunRoot/results.json" \
"$LEAN_FINAL_CLI" --new-window --wait \
  --user-data-dir "$restoreRunRoot/p" \
  --extensions-dir "$restoreRunRoot/e" \
  --shared-data-dir "$restoreRunRoot/s" \
  --extensionDevelopmentPath "$repoRoot/dev/test-fixtures/lean-core" \
  --skip-welcome --skip-release-notes --disable-workspace-trust \
  /tmp/lean-restore-jdsqe80h/workspace
```

所有 shell 变量由主 runner 明确赋值；profile/app 等路径采用短临时目录，避免 macOS Unix IPC 路径长度限制。profile 复制与外层实际 process wait 未包含在 fixture 中。

## 正常 Quit 后 SQLite 核对

由主 runner 对**本次复制 profile**的 source_workspace_database 读取，不触碰源 profile。必须确认 app 已关闭；非空 WAL 表示保存证据尚未稳定，不应直接把 immutable 读取结果当作最终状态。

从 ItemTable 的 key `memento/workbench.parts.editor` 取 editorpart.state.serializedGrid，找到恢复 group；同时核对 activeGroup 和源 group id。以 M1 expected 中普通 serializer 的 URI 为 oracle：

- sequential URI 等于 expected.sequential 的 URI 顺序，全部是普通 fileEditorInput，没有退休项。
- mru 中每个索引有效、无重复，按该索引取普通 editor URI，顺序等于 expected.mru；第一个有效项为 active。
- preview 缺失/普通 URI与 expected.preview 相符；sticky 的保存边界对应 expected.sticky_count。
- 全退休的 API 必须在已初始化 group 上观察至少15秒并确认 editor 皆空；正常 Quit 后 editorPart.saveState 会删除空的 editorpart.state，允许对应 memento 行缺失，不能要求保存空 editor/MRU 行。若仍有状态需要查明，不能自动记 PASS；no-retired 必须保留 A/B、MRU B/A、B preview/A sticky。正式两套全退休退出后该行均缺失，见新实机记录。

报告可合并 fixture JSON、实际退出记录和保存态 JSON。没有公开 Tab API MRU 断言；没有正常退出/SQLite 核验时只能报告 API 层完成。

## 本任务实际执行的检查

```bash
node --check dev/test-fixtures/lean-core/restore.js
node --check dev/test-fixtures/lean-core/extension.js
node dev/test-fixtures/lean-core/restore.js --validate-case \
  /tmp/lr-d16ezm2o/6/group.after.json
```

语法检查 exit 0。两套 manifest 共 **12 个现有生成 case** 均由 loadCase 成功解析，原样导出的 manifest entry 也成功；[解析记录](/tmp/restore-runner-node-validation.json)。负例：相对路径、缺失文件、把 expected.json 当 case、unit-state fallback 均拒绝。独立 CLI 的错误输入命令实际 exit 1；[错误输入日志](/tmp/restore-bad-case-validation.log)。这些是实现阶段的 Node 语法和数据契约检查，没有 mock vscode 来模拟恢复通过；主 agent 后续真实 app 结果独立记录于 [M6-final-restore.md](M6-final-restore.md)。
