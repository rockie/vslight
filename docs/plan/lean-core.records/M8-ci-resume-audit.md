# M2/M8 macOS CI 续做审计

计划：[lean-core.md](../lean-core.md) §5.1、§9.4、M2/M8。最近更新：2026-10-02 09:54 +1000。状态：本次只读审计完成；当前输入的 arm64/x64 CI 尚未运行，用户已选择仅本地验证，不推送或触发 CI。代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，114–139/141–149、254 条 prune，以及本次两个发布 workflow 的 keychain 路径修复。

本审计仅写本记录，未修改共享 workflow/build/计划、用户生成树、GUI 或进程；未 commit/push/dispatch/release，未读取凭据或输出 token。共享修复由主集成完成。

## 当前准备状态

`git worktree list --porcelain` 确认独立 worktree 实际存在：`/private/tmp/lean-core-ci-review-tmnau35t/worktree`，分支 `codex/lean-core-ci-20261002`，HEAD 仍为 f196；196 个文件仅暂存，16 个已有文件变更、180 个新增文件。对应 [proposal.json](/private/tmp/lean-core-ci-review-tmnau35t/proposal.json)、[输入清单](/private/tmp/lean-core-ci-review-tmnau35t/inputs.json) 和 [diff 统计](/private/tmp/lean-core-ci-review-tmnau35t/diff-stat.txt) 均存在。公开仓库该分支的 Git ref API 返回 404，与尚未推送的状态一致。

初次核验时，196 项 manifest hash 同时与根工作区文件、临时 worktree 的 index 字节一致，缺失及 mismatch 都为 0。随后主集成修复两个发布 workflow；09:53 +1000 再查时，准备清单有下列两项落后于根工作区，其余 194 项仍相同：

| 文件 | 原准备清单 SHA256 | 修复后根工作区 SHA256 |
| --- | --- | --- |
| `.github/workflows/publish-insider-macos.yml` | `39e87bbd4b049c94662e39d8cdb8451b8289a77c807f518a7eb92f8b01ec6d4e` | `23e161e03eb4e0c35dcce8901c63c3eeaf5b6626dcf2297615e44a7bc09dd40e` |
| `.github/workflows/publish-stable-macos.yml` | `9378475e2b878430c73aac1e60c176454ec3e7170093eb1c92b6628e00f11cc1` | `e63c9d6ed6b384352a83f75e205c29dc78473198ce748d26600d59cda067f5d0` |

本记录属于新增审计文件，也未进入原 196 项清单。用户选择仅本地后，旧 proposal 保留为准备时的快照；不能再称其与最新根工作区逐字节相同。本审计未更新其 index 或 manifest。

## 公开 CI 与输入边界

只读查询 `gh workflow list`、`gh run list/view` 和 GitHub Contents/Refs API：rockie/vslight 为公开仓库，默认分支 master，公开 HEAD 为 `da0b544ca3b210e97cb50939b37bdbea9d32ba67`。macOS CI workflow ID 为 368961522，状态 active。

最新 [macOS CI run 36680287671](https://github.com/rockie/vslight/actions/runs/36680287671) 于 2026-09-30 06:49:42 UTC 由 master push 触发，headSha 为上述 da0b544。两个 job 均 success：

| Job | 构建 | Setup Python 3 | 资产/上传 |
| --- | --- | --- | --- |
| [macos-15-intel / x64](https://github.com/rockie/vslight/actions/runs/36680287671/job/109774016648) | success | success | skipped |
| [macos-14 / arm64](https://github.com/rockie/vslight/actions/runs/36680287671/job/109774016979) | success | skipped | skipped |

公开 workflow 仍有 `if: env.VSCODE_ARCH == 'x64'`，所以该绿色运行既未覆盖新增 helper，也未覆盖 arm64 显式 Python 供给。run 列表中没有当前临时分支的运行；两个 macOS 发布 workflow 的 run 列表均为空。旧 CI 不能替代当前 dirty 输入的 M2/M8 CI 退出门。

本地 f196 比已知 `rockie/master` 多三个提交：0721595（既有配置/UI 修复）、8471f4d（计划）、f1961b7（文档）。现有临时分支若以后推送，会同时包含这些前置提交及本次暂存输入；仅描述“196 个文件”不足以说明整条分支的输入来源。

[最终149记录](M8-build149.json) 指向的实际 build input manifest 仍存在，201 个输入逐项核对：应用构建输入没有漂移，仅 `dev/check-lean-runtime.py` 与 `dev/test-fixtures/lean-core/external-links-cdp.mjs` 两个验证 helper 的 hash 不同，均已在该记录的 `postBuildValidationChanges` 明确列出。这个 build manifest 不包含两个发布 workflow；本次 cleanup 修改不影响已构建应用。manifest 的旧 `status=BUILD_RUNNING` 是构建启动时快照，最终 exit 0 与完成时间来自 M8-build149.json，不把启动字段当完成凭证。

## 三套 workflow 和构建路径

已读 [CI workflow](../../../.github/workflows/ci-build-macos.yml)、[Stable workflow](../../../.github/workflows/publish-stable-macos.yml)、[Insider workflow](../../../.github/workflows/publish-insider-macos.yml)、[build.sh](../../../build.sh)、[prepare_vscode.sh](../../../prepare_vscode.sh) 和 [macOS 资产脚本](../../../build/osx/prepare_assets.sh)。

| 核验项 | 当前事实 | 结果/边界 |
| --- | --- | --- |
| Python 与 arch | 三套 workflow 的 setup-python 均保留 Python 3.11，已去掉原 x64 条件；matrix 均为 macos-15-intel/x64 与 macos-14/arm64 | 源码覆盖两 arch，当前线上运行待验 |
| helper 调用顺序 | build.sh:30 先 min-packing；33–36 检查 `${PYTHON:-python3}` ≥3.11，并以同一解释器执行 helper；38 再 touch | 整理在签名/公证/ZIP 前；set -e 使 helper 失败阻止继续 |
| app 名称 | build.sh:35 从生成 product.nameLong 推导；prepare_vscode.sh:59–85 分别设置 `VSLight - Insiders` / `VSLight` | 覆盖有空格的 Insider app 名称；未硬编码稳定版 app |
| Python 依赖 | helper 使用标准库；CI 由 setup-python 的 python3 提供，本地 dev/run-build.sh 设置 Python3.12 | 无新增 Python 安装包或产品运行依赖；已有 fixture 未重复运行 |
| 源码 pin | stable.json 与 insider.json 当前均固定 08d4889f9ec4a1685d257b9b95de036c8e1ce1e5；.nvmrc 为 24.18.0 | 与最终149的 upstream/Node一致；资源规则仍须由实际 x64 包验证 |
| 根配置闭包 | prepare_vscode.sh:116 的 `--slurpfile` 依赖 build/retired-api-proposals.json，该文件已进入原准备清单；helper、35 个新增 patch、prune/product/prepare/build 同样在清单内 | 未发现缺失本次构建必需文件；patch 全量重放/构建证据沿用149 |
| CI 触发/checkout | 临时分支 push 不匹配 CI 的 master/insider push filters；显式 workflow_dispatch 可选择分支；checkout 输入为空时，已 pin 的 checkout action 使用 context.ref/context.sha | 技术路径可行，当前用户明确选择不执行 |
| 发布 workflow 范围 | Stable checkout 固定 master；Insider checkout 固定 insider，并含 release/update_version | 不能用临时分支发布 dispatch 冒充当前输入的纯构建验证；本次未触发 |

checkout 空 ref 的行为已只读核对 [actions/checkout 固定版本 input-helper.ts](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/src/input-helper.ts#L79)：workflow_dispatch 下 `github.event.head` 为空不会使 checkout 转回默认分支，它会采用当前事件的 ref 和 sha。

## 已发现并修复的 cleanup 问题

根因是两个发布 workflow 的 `always()` cleanup 使用 `$RUNNER_TEMP/build.keychain`，而 build/osx/prepare_assets.sh:9 实际创建 `${RUNNER_TEMP}/buildagent.keychain`。正常签名脚本末尾自行删除实际 keychain；中途退出时，workflow 兜底检查的是另一个文件，不能命中遗留项。之前只给 `security delete-keychain` 参数加引号，未解决这处路径不一致。

本审计用独立 TemporaryDirectory 的普通 mock 文件复现，没有执行 security 或接触凭据：原逻辑 exit 0、删除未调用、实际 mock 文件仍在；仅把赋值改为 `KEYCHAIN="$RUNNER_TEMP/buildagent.keychain"` 后，删除调用执行、mock 文件消失。主集成据此修复 Stable:94 / Insider:95；本审计随后直接读取两处赋值确认与创建路径一致。主集成报告路径一致断言及三套 workflow actionlint exit 0，本审计未重复该已绿检查。

主集成另提供 [无秘密临时 keychain 探针](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-keychain-probe-6rncfow8/probe.json)：本机 logicalPathExists=true、databasePathExists=false，实际文件名为 buildagent.keychain。主集成确认使用逻辑路径删除成功、search list 前后相同。本审计只读取这个不含凭据的 JSON；本机没有观察到需额外处理 `.keychain-db` 的情形，不按假设扩大修复范围。

## 保留缺口与继续条件

M2/M8 的原始门仍是当前输入对应的 arm64/x64 现有 CI 构建绿；本地完整构建、旧 CI 绿和本次源码审计均不能替代。用户已选择仅本地，因此该门保留为未验，不再把“推送授权待答复”当当前行动。

计划正文没有要求相同输入 CI 连跑三轮。恢复快照和 M8.md 中的“连续三轮”来自此前 blocked 审计次数，不能新增为 CI 验收次数；主集成可在回写时消除该歧义。

若用户以后另行授权 CI，应先由集成人同步最新两个 workflow、本记录及最终里程碑记录，重新生成准备 manifest 并核对 index/root hashes，再提交该独立分支。仅使用 ci-build-macos.yml，`generate_assets=false`、`checkout_pr` 留空，并要求两个 job 的 headSha 与同一个实际待测提交一致、Setup Python 3 均 success、Build 均 success；保留 run/job 链接与结论。当前不执行这些操作，也不触发发布 workflow。
