# lean-core.md 评审报告

**基线**：计划 `docs/plan/lean-core.md`（481 行，自报 Ready）· 评审日 2026-10-01 · 主仓 HEAD `8471f4d7d406c1b42ecb5ecbf54e0cf884708851`（clean，计划自报调查基线 `0721595` 为 HEAD~1）· `vscode/` 生成树 `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`（1.135.0，与计划一致）· 评审期间计划无并发修改。

## 1. 确认问题（P2 → P3，共 10 条）

**1. [P2] F-01 · 窗口恢复的实机旧 profile 验收在 M5/M6 退出条件中无锚点**
- 定位：`docs/plan/lean-core.md:438`（§11 承诺"M5/M6 用旧 profile 验收、最晚 M5/M6 退出前"）与 `:421`/`:422`（M5 仅"V9 浏览器项"、M6 无 V9 项）冲突；关联 `:196`、`:388`、`:378`
- 问题：退休 serializer 的索引缺陷已证实真实存在（`editorGroupModel.ts:1252` mru、`:1257` preview 用旧索引读过滤后数组，`:1245-1247` 遍历中改 sticky 边界），但按 §10 现状，混合 tabs 恢复最早只能到 M8 验收；实施者按行核对退出条件时 §11 的承诺会被跳过，用户升级面缺陷晚发现。
- 修订：二选一——把"V9 窗口恢复项（旧 profile 副本混合 tabs 恢复）"写入 M5 或 M6 退出条件；或把 §11 最晚确认点改为 M8 并写明理由（M4 单测五类已先行覆盖）。
- 复核：改稿后对应行退出条件含该项且仍以「回写『实施进度』」结尾；实现后按 §9.2 五类场景实机核验。
- 置信度：高（两处原文直接比对 + 代码缺陷三方独立证实）；阻塞：M5 开工前修订。

**2. [P2] F-02 · "零残留入口"枚举面漏 walkthrough 步骤/viewsWelcome/视图容器/默认快捷键绑定**
- 定位：`docs/plan/lean-core.md:403`（§9.3 第 6 条仅"命令/设置注册枚举 + 菜单/快捷键检查"）、`:331`
- 问题：编译闭包和命令/设置枚举抓不到挂在保留模块上的注册表内容与字符串。已证实实例：`welcomeGettingStarted/common/gettingStartedContent.ts:404-405` 的 dictation walkthrough 步骤仅靠 `hasSpeechProvider` context key 默认 false 隐藏（speech 删除后该 key 定义消失，属侥幸安全的死内容），`:320`/`:328` 无障碍步骤文案引用 chat response。同类 viewsWelcome/视图容器/默认快捷键绑定可静默残留进产品。
- 修订：§9.3 第 6 条枚举面扩为"命令/设置/菜单/快捷键绑定/视图容器与 viewsWelcome/walkthrough 步骤"，或 M1 冻结清单时把这些注册表种类列为入口残留检查面（实机打开 Welcome 页与 Keyboard Shortcuts 编辑器扫查即可覆盖大部分）。
- 复核：改稿后检查枚举清单；实现后 Welcome 页无 AI 步骤、快捷键编辑器无指向已删命令的默认绑定。
- 置信度：高（缺口与实例均可证实，残留发生概率中）；阻塞：M1 清单冻结前修订。

**3. [P2] F-03 · 可访问性保留面有明确要求但无验收锚点**
- 定位：`docs/plan/lean-core.md:289`（§5.4 可访问性解绑行）、`:335`（"不能为摘 speech 删除整个 accessibility 系统"）；对照 `:376`（V7）、`:396-403`（§9.3）、`:464-481`（§13）均无对应项
- 问题：过删（把 speech 相邻的普通 Accessibility Help/Accessible View 一起摘掉）没有任何闸门能拦，依赖可访问性的用户升级后才发现。
- 修订：V7 或 §9.3 增一项——终端/编辑器焦点下 Open Accessible View 与 Open Accessibility Help 可打开、无 DI 错误；§13 补对应行。
- 复核：改稿后 §13 出现可访问性行；实现后走查通过。
- 置信度：高（映射缺失可直接对照证实）；阻塞：M4 开工前修订。

**4. [P3] F-04 · §5.1"Python 3 在两个 job 明确可用"与 workflow 不符**
- 定位：`docs/plan/lean-core.md:237`；关联 C-2、M2
- 问题：`.github/workflows/ci-build-macos.yml:66-70` 与 `publish-stable-macos.yml:49-53` 的 setup-python 均以 `if: env.VSCODE_ARCH == 'x64'` 门控，arm64 job 无显式 Python 供给，实际依赖 runner 镜像预装（版本未固定）。镜像变动时 M2 资源整理会在 arm64 CI 构建期失败。
- 修订：放宽两处 workflow 的 setup-python 条件到两个 arch（与 M2 同改动）；或措辞降级为"helper 启动校验 `python3 --version`，缺失即明确失败"并在 M2 退出条件加 arm64 job 实证。
- 复核：改稿后不再有"两个 job 明确可用"的无条件表述；实现后 arm64 CI job 绿。
- 置信度：高（workflow 文本直接可见；runner 自带 python3 可能兜底，故 P3）；阻塞：M2 前修订。

**5. [P3] F-05 · smoke 旧断言替换（§9.2）无里程碑退出条件锚点**
- 定位：`docs/plan/lean-core.md:389-390` 对照 `:421-423`（M5/M6/M7 退出条件均无 smoke 项）
- 问题：`dev/smoke.sh:141-149`（chat.disableAIFeatures 源码断言）、`:169`（chat.* ≤10）、`:184-186`（MXC bin 仅 arm64）在 M6/M7 删除落地后必然转红；替换若漏做，要到 M8"完整 smoke 绿"才暴露，回头修 M6/M7 补丁成本更高。
- 修订：M6（或 M7）退出条件加"dev/smoke.sh 旧断言已按 §9.2 替换且 `--skip-ui` 绿"；M2 行明确"静态/CLI 绿"是否含 smoke。
- 复核：改稿后逐行可判定；实现后在对应里程碑跑 `./dev/smoke.sh --app <产物> --skip-ui`。
- 置信度：中高；阻塞：M6 开工前修订。

**6. [P3] F-06 · 旧 CLI 拒绝缺机器断言，现有同类模式 exit 0 与 §5.6 的 exit 1 冲突**
- 定位：`docs/plan/lean-core.md:314`、`:389-390`、`:378`
- 问题：§5.6 要求 `vslight chat`/`--add-mcp` 拒绝且 **exit 1**，但现成同类模式（`cli.ts:54-58` tunnel 拒绝）是 `console.error` 后 return → exit 0，实施者照抄即违约；`dev/smoke.sh:244-250` 的 tunnel 断言只查输出文本不查退出码，§9.2 替换清单也未把 legacy CLI 纳入机器断言，回归无闸门。
- 修订：§9.2 增 L2 断言三条——`vslight chat` 与 `vslight --add-mcp …` 输出可读拒绝且退出码=1；`vslight -- chat` 仍按文件打开。
- 复核：改稿后 §9.2 出现该断言；实现后 smoke L2 红绿可查。
- 置信度：高（断言缺失与 exit 0 现状均已证实）；阻塞：M6 开工前修订。

**7. [P3] F-07 · C-1 的 prune 缺失/重叠失败注入无 V/M 锚点**
- 定位：`docs/plan/lean-core.md:477`（§13 声称"重叠与缺失注入"）对照 `:377`（V8 的失败注入只修饰资源 helper）、`:408`（§9.4 全序重放正确树不触发 exit 4）、`:423`（M7 仅静态"无 prune 重叠"）
- 问题：缺失路径 exit 4（`utils.sh:19-43`）与父子路径重叠两类失败模式没有可执行的验收归属，而 §5.7 的示例场景（52 号 JSON 与 light/prune.json 现存 agentHost 逐文件条目）正是高风险面。
- 修订：V8 文本补"prune 重叠/缺失路径注入"或 M7 退出条件补一句注入测试（一行改动）。
- 复核：改稿后 V8/M7 含该断言；实现后隔离树注入缺失路径与重叠条目确认 exit 4。
- 置信度：高；阻塞：M7 前修订。

**8. [P3] F-08 · "SKIP 不能代替 UI 验收"只有规则、无脚本层强制**
- 定位：`docs/plan/lean-core.md:392`
- 问题：`dev/smoke.sh:375-376` 拉不到前台记 SKIP，`:544-546` 汇总后 exit 0——SKIP 与全绿无法从退出码区分；上一轮已有先例（`lean-dist.records/M6.md:33`：L3 一项环境级 FAIL、SMOKE_EXIT=2 仍记 M6 完成）。
- 修订：M8 退出条件写明"完整 smoke 汇总无 SKIP/FAIL 行"，或给 smoke 加 `--require-ui`（L3 SKIP 时 exit 非零）。
- 复核：改稿后 M8 行含该条件；实现后 smoke 输出与退出码可直接核对。
- 置信度：高；阻塞：M8 前修订。

**9. [P3] F-09 · 升级用户须知只有文档文件名、无内容落点要求**
- 定位：`docs/plan/lean-core.md:430`（M8 文档清单）
- 问题：`docs/vslight-migration.md` 当前仅"从 VSCodium/VS Code 迁移"视角，无"从旧版 VSLight 升级"节。升级用户最需知道的四条没有落点：①AI 功能从"默认隐藏"变物理移除（旧 Chat 历史/MCP 配置留盘但不可访问）；②内置浏览器入口消失、外链一律系统浏览器；③`vslight chat`/`--add-mcp` 变 exit 1；④原生界面仅中英文。顺带：`README.md:12` 现已写 "removed: AI Chat"（当前实为隐藏），M8 时应核对口径与现实一致；NFR-5 来源列引用的 `docs/vslight-release.md` 实际未载 43.7.5/12.0（由 103 号补丁承载），可同批修正引用。
- 修订：M8 文档任务点名上述四条，落发布说明 + `vslight-migration.md` 新增"从旧版 VSLight 升级"节。
- 复核：改稿后 M8 行/§6 出现内容要求；实现后对照发布说明文本。
- 置信度：高；阻塞：M8 前修订。

**10. [P3] F-10 · 恢复快照代码基线 dirty@0721595 与实际 clean@8471f4d 漂移**
- 定位：`docs/plan/lean-core.md:43`、`:5`
- 问题：计划已提交为 8471f4d、工作树 clean、所述未跟踪目录已为空。影响小——0721595..8471f4d 的 diff 只有计划文件本身，功能基线等价；续做按协议先核对 `git status` 即可调和。属记录陈旧而非基线错误。
- 修订：下次回写时把代码基线刷新为 `8471f4d7d406c1b42ecb5ecbf54e0cf884708851`（clean）。
- 复核：改稿后 check_progress.sh 仍 0 ERROR。
- 置信度：高；阻塞：否。

## 2. 待核实/待决策（计划自设闸门覆盖，非评审缺口）

| 待核实项 | 影响 | 解除办法 / 最晚确认点 |
| --- | --- | --- |
| Mermaid 压缩试验值 17.83 MiB（试验产物不在仓内，仅基线 24.64 复测吻合） | D6 收益记账 | M3 私有 outputRoot 源码构建 + 图表矩阵，M3 退出 |
| ADR-1 删除闭包全集（~15 个 ExtHost actor 及 MainThread/converter 入边） | M4 工作量 | M1 清单冻结 + C-3 全图编译，M4 开工前 |
| 旧 profile"混合 tabs"构造方法（现产品 AI 入口已隐藏，真实 Chat tab 难自然产生，需手工合成或注明来源） | V9/§9.3 第 5 条名实相符 | M1 记录写明构造说明，M1 退出 |
| 历史 smoke 终端焦点失败是否仍存在（现行脚本已无 term_open_wait，修复方向需重新确认） | M8 实机门 | M1 重跑定位 |
| 非支持语言原生回退的具体走查面（点验哪些原生对话框） | V4 可执行性 | M2 实机走查清单，M2 退出 |
| 第三方 AI 扩展拿到空模型/拒绝后的用户侧表现 | ADR-1 已接受的残余风险 | M4 fixture + M8 extensions-compatibility 文档文本 |

## 3. 覆盖摘要

- **实际分工**：4 个独立 explore subagent（facts / architecture / schedule / delivery）同基线并行初审，主 agent 逐条复核全部候选问题的计划原文与代码证据（含 workflow、cli.ts、editorGroupModel、gettingStartedContent、smoke.sh、lean-dist M6 记录等 10 余处亲自查证），按根因去重（facts 与 architecture 各自独立报出的 Python CI 问题合并为 F-04）。
- **facts**：§1.1 全部产物测量逐项复测吻合（29 icns 单哈希、220 lproj 46.40 MiB、各包字节、503.66/181.55 MiB）；17 组代码主张全部核实到行为级；全文内部矛盾检查未发现互斥陈述。
- **architecture**：ADR-1/2/3、D2/D6、窗口恢复映射、lock 重生成逐一判定可行；Electron 43.7.5 存在性已联网核实（2026-10-01，electron v43.7.5 release 页）；无过度设计，最大不确定项（高耦合入边数量）有 M1 冻结 + 全图编译双闸。
- **schedule**：R/NFR/C → §13 → 设计 → M* → V* 主链逐条验证通过，无断链；依赖无环无倒置；「实施者定位」「实施进度」与骨架逐字一致（仅进度校验命令填空）。
- **delivery**：主路径九环节中七个闭环；UI 证据等级为**文档推演**（计划未实施，无浏览器/实机验证，属正常状态，未据此判阻塞）。
- **脚本**：`check_paths.sh` 报 7 个 MISSING，与 §1.3 的 7 个 ★ 新增路径一一对应，人工豁免成立；`check_progress.sh` 通过（0/8、8 行、0 ERROR 0 WARN）。
- **修正一处 reviewer 证据**：walkthrough 内容实际位于 `welcomeGettingStarted/common/gettingStartedContent.ts`（非 browser/），内容主张不变。

## 4. 映射与实施编排

映射无断链（§13 逐条复核通过）；排除项有明确去向。依赖边：M1→{M2,M3,M4}、M4→M5、{M3,M4,M5}→M6、{M5,M6}→M7、全→M8，DAG 成立。建议波次：

| 波次 | 前置及解锁证据 | 可并行 | 写入边界/共享负责人 | 运行资源约束 | 汇合验收 |
| --- | --- | --- | --- | --- | --- |
| W0 · M1 | 无 | 集成人重放固基线 ∥ 只读 consumer 检查 ∥ fixture 设计 | 集成人独占重放树与旧 profile | 单次重放 + 一次基线构建 | 基线有来源与体积、入边清单冻结（含 F-02 注册表种类） |
| W1 · M2 ∥ M3 ∥ M4 | M1 清单冻结 | 三者文件集互不相交（资源层 / mermaid 扩展 / API+消费者） | build.sh、CI、factory、protocol、product、editorGroupModel 等共享面集成人单写 | 唯一生成树上的 patch 生成与全量构建排队串行 | M2: V1/V2/V4 · M3: V3 · M4: §4.1 fixture+RPC 校验 |
| W2 · M5 | M4 | — | 浏览器专属目录 worker；auth/app/入口集成人 | typecheck 串行 | V5 + V9 浏览器项（+F-01 窗口恢复项） |
| W3 · M6 | M3、M4、M5 | 服务域内独立文件可委派 | main/shared/CLI/入口/prune 集成人 | typecheck 串行 | V6 + 旧 CLI 拒绝（含 F-06 断言）+ V7 |
| W4 · M7 | M5、M6 | 元数据清理可委派（只产 patch 候选） | manifests/locks/gulp/copy/prune 集成人 | lock 重生成独占 | V8（含 F-07 注入） |
| W5 · M8 | M2–M7 | 文档 worker ∥ 集成人集成 | 版本/记录/结论集成人统一；单一 GUI 会话 | 干净重放+全构建+签名链串行 | V1–V10 + CI 绿 + 签名/公证/staple（含 F-08 无 SKIP） |

结构瓶颈链：**M1 → M4 → M5 → M6 → M7 → M8**；M2/M3 为侧枝。真正吞吐瓶颈是唯一 vscode 生成树上的串行 patch 生成与全量构建（计划 :428 已正确声明）。共享面单写清单对照 §5.1–5.7 文件清单无漏网两写手风险。非阻塞建议：M4 可拆出"M4a · factory/protocol/auth 切片"子门提前解锁 M5（置信度中，不拆仅主链变长，同样可行）。

## 5. 总体结论与修订顺序

**建议状态：Ready** —— 与计划自报一致。事实层异常干净（测量与代码主张全部复核成立），技术路线各关键决策均有真实备选与可行性证据，映射主链完整，无 P0/P1。10 条确认问题全部是验收锚点与局部表述缺口，修订均为 1–3 行文本改动，不改范围、契约与设计。

修订顺序（建议 M1 开工前一次改稿同批落实）：

1. 先修验收锚点类：F-02（M1 前）、F-03（M4 前）、F-01（M5 前）、F-05/F-06（M6 前）、F-07（M7 前）、F-08（M8 前）；
2. 再修事实表述类：F-04（M2 前）、F-09（M8 前，顺带 NFR-5 来源引用）；
3. F-10 随下次回写自然刷新。

解除条件的可观察判据：§10 对应行退出条件含新增项且仍以「回写『实施进度』」结尾，§9.2/§9.3 枚举面更新，`check_progress.sh` 仍 0 ERROR。

说明：本结论只表示计划可实施，不表示功能已实现或产物可发布；M1 的清单冻结与后续实机验收不可省略。
