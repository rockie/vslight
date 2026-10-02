# M6 正式138 app 旧 profile 恢复验收

2026-10-02，主 agent 在正式138 app 上顺序完成 Browser-only、Browser+Chat 两套各六个 variant，共12个真实恢复案例：公开 Tab API 全部 PASS、真实主进程正常 exit 0、无强制退出，正常 Quit 后 SQLite 与 oracle 一致。汇总按原字节复制为 [M6-final-restore.json](M6-final-restore.json)。本 worker 仅只读复核已有证据、补正空状态验收和文档，没有重跑已通过案例或启动 GUI。

## App、fixture 和证据目录

全部 launch.json 指向同一隔离正式 app：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app`。实读 Info.plist 的发布/构建版本均为 1.135.06566；真实 API 返回 1.135.0，两者不混为一个版本字段。138 是本次修复后的 app/补丁基线标识，不是另一个发布版本号。

使用私有开发扩展 [restore.js](../../../dev/test-fixtures/lean-core/restore.js) 的正常 activation 模式，没有 extensionTestsPath。fixture 读取真实 window.tabGroups 并请求 workbench.action.quit，不打开新 editor、不调整布局、不注册 Browser/Chat serializer。输入来自 M1 正常 shutdown 的普通 A/B profile 副本，退休 serializer 为合成测试数据，不是个人 AI session。来源和契约见 [restore-runner.md](restore-runner.md)、[M1-fixture-inventory.md](M1-fixture-inventory.md)。

完整证据根为 `/tmp/rr138-79hyih4n`：Browser-only 对应 lr-nepzo6pm，目录 6pm-1 至 6pm-6；Browser+Chat 对应 lr-d16ezm2o，目录 m2o-1 至 m2o-6。每个目录保留 launch.json、results.json、acceptance.json 和本次复制 profile；混合套另有 process-exit.json。汇总保留真实 runId/PID、exit、forced、apiStatus、sqliteChecks；CLI 的提前 exit 0 不用作通过证据。

## 五类、六个 variant 的结果

两套分别以无退休控制例6开始，再运行1–5。下表 oracle 以 A/B 表示原普通文件 URI，实际断言为完整 URI、TabInputText 及逐 tab flags。

| case | category / variant | ordinary 顺序；active；MRU；preview；sticky | Browser-only | Browser+Chat |
|---|---|---|---|---|
| 1 | mru-active / retained-active | A/B；A；A/B；无；0 | PASS / exit 0 | PASS / exit 0 |
| 2 | mru-active / retired-active | A/B；B；B/A；无；0 | PASS / exit 0 | PASS / exit 0 |
| 3 | retired-preview / default | A/B；A；A/B；无；0 | PASS / exit 0 | PASS / exit 0 |
| 4 | consecutive-sticky / default | A/B；A；A/B；无；0 | PASS / exit 0 | PASS / exit 0 |
| 5 | all-retired / default | 空；无 active/MRU/preview；0；保存后空状态移除 | PASS / exit 0 | PASS / exit 0 |
| 6 | no-retired / default | A/B；B；B/A；B preview；A sticky | PASS / exit 0 | PASS / exit 0 |

复核全部12个 launch.beforeGroup 与对应 group.after.json 完全相等，尤其两个 all-retired 在 launch 前确有退休 editor 注入，不是打开空新 profile 的假绿。results、acceptance.fixture、summary 的 runId/case/result 相互一致，所有 API assertions 和外层 sqliteChecks 为 true。

十个非空案例退出后 sequential/MRU/preview/sticky/active/activeGroup 逐项与 expected oracle 相符，全部 WAL stable。公共 Tab API 没有 MRU；fixture JSON 明确 mru=REQUIRES_POST_SHUTDOWN_SQLITE，MRU 通过主 runner 的退出后 SQLite 检查，而非虚构公开 API。worker 又用 mode=ro、immutable 的只读连接核对本次复制 profile 的 editorpart.state，与 acceptance.postShutdown.part 相等，没有读其他 profile keys 或改数据库。

## all-retired 空状态的保存规则

Browser-only case5 和混合 case5 的 API settling 分别为15,077ms、15,079ms，均不超时，真实 group initialized=true、activeTabIndex=-1、tabs=[]。其余普通案例观察至少3秒；不能用启动瞬间的空数组判通过。

已实际读隔离源码 `src/vs/workbench/browser/parts/editor/editorPart.ts:1475` 的 saveState：有 grid 且 isEmpty 时删除 workspaceMemento 的 EDITOR_PART_UI_STATE_STORAGE_KEY，非空才 createState。正常保存因此可以移除空 editorpart.state。本次两个 case5 的退出后数据库中，memento/workbench.parts.editor 行实际缺失，且没有未稳定 WAL；acceptance.postShutdown.editorPartStateAbsent=true。这是正常空状态保存，不是数据恢复失败，不能要求留下空 editors/mru 的状态行。

Browser-only case5 原外层 checker 已进入真实 rc==0/PASS 分支，随后错误要求必须存在空状态行。其 acceptance.json 的 outerCheckerRecovery 明确记录：按 saveState 规则作只读补验，确认 emptyStateRemovedOnNormalSave/walStable；没有重启 app、改 fixture/产品或重跑已绿case。该 summary 项没有 seconds 字段，本文不补造主进程时长；15,077ms 来自实际 API settling。

混合 case5 在原始一轮就取得正常 exit 0/PASS，外层检查直接接受空状态移除，process-exit.json 为 exit=0、forced=false。二者均有 launch 前注入和15秒已初始化空态证据，空状态补验不会把未运行案例变成通过。

## workspace URI 规则修正

此前控制例失败的原因是 launch 将工作区写成 /private/tmp realpath，而源 workspace.json 的 folder 实际为 `file:///tmp/lean-restore-jdsqe80h/workspace`。虽然二者指向同一磁盘目录，工作区 identity/storage hash 取 URI 拼写，不可互换。按 workspace.json 的精确 folder URI 启动后，普通控制例恢复 A sticky/B preview 并通过。

最终12个 launch.sourceFolderUri 均为上述 file:///tmp URI，复制 profile 的 workspace.json 也保持该值；实际 workspace database id 均为 d5df99ee946b67c5fa5a2caed3c5586c。普通 editor serializer 中的 file:///private/tmp A/B URI 原值继续保留。修正仅在主 runner 启动参数，不修改 fixture、源 profile 或普通 editor payload；realpath 只用于验证目录身份，不能替代 workspace identity 字符串。[restore-runner.md](restore-runner.md) 已局部修正文档中的示意路径及空态保存规则。

本次验收覆盖这两套合成旧 profile 的普通窗口恢复与正常保存；不宣称恢复真实 Browser/Chat 会话、重新启用退休能力，亦不替代其他普通功能、分发或完整 M8 验收。
