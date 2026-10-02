# M8 · 六产品文档最终审计

最终完成（2026-10-02 22:01 +1000）：**已完成，进度8/8**。用户明确取消x64/CI验收门、接受本地arm64结果；其余退出条件全通过，见[最终验收](M8-final-acceptance151.md)与[范围指示](M8-local-arm64-scope151.md)。当前输入/实际签名app及两ZIP复核一致，生产漂移0。未提交/推送/触发CI或发布。以下保留历史时点的未验CI/阻塞事实，已由最新指示解除。


最终更新（2026-10-02 21:38 +1000）：必要本地验收均已通过，进度6/8，M1/M3/M4/M5/M6/M7已完成。[151逐项覆盖与原始证据](M8-final-local-audit151.md)涵盖真实键盘/用户覆盖、四项完整A11Y、全注册/菜单、Cold/Reload及普通数据持久化；独立151签名公证/CRC全绿。**唯一未验门是当前输入arm64/x64 CI**，依用户仅本地限制未触发，M2/M8保持进行中，未提交/推送/发布。下文保留各原记录时点的历史事实和缺口，不代表当前仍缺这些本地项。


151记录补充（2026-10-02 19:20 +1000）：[新完整构建与静态子门](M8-build151.md)、[unsigned新账/CRC](M8-artifact151.md)及[150实际主题/禁用扩展退出前结果](M8-ui150-before.md)已保存。六产品文档原150已验来源保持；151真实运行/签名及普通持久化未齐，因此不把新unsigned账混进旧signed发布账，也不把文档审计解释为M8/Release完成。

计划：[lean-core.md](../lean-core.md) §4.1、§9.2、§10。最近更新：2026-10-02 18:49 +1000。范围：六产品文档；状态：150文档内容核对和检查通过，150 Mermaid/CRC/静态保留历史来源；新增151生产补丁后，全构建/typecheck/package/真实注册表/体积签名尚未通过，普通GUI/账户与扩展状态持久化尚待收口，当前输入双架构 CI 未验，进度2/8，M8 不记完成。

代码快照为主仓 `master`、`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`；当前持久补丁 114–139/141–151，prune 的 remove 路径仍共 254 条。下文六产品文档依据 [150 构建](M8-build150.json)、[150 未签名字节账](M8-artifact150.json)、[150 签名](M8-sign150.md)及对应历史宿主/恢复记录，只读核对重启安全 build150 的源码与 app；未把旧150载体或消失的临时目录当作151最终产物。

本审计使用仓库 documentation-writer skill 及 README、user-manual、writing-style 参考。仅修改本文及下表列出的产品文档，没有操作生产代码、生成树、installed app、GUI、签名、CI、提交、推送或 Release；没有运行或修改 `dev/smoke.sh`。图形验收与最终产物门由集成人负责。

## 文档与事实对应

| 文档 | 核对事实与依据 | 本轮处理 |
| --- | --- | --- |
| [README](../../../README.md) | AI/Chat/LM/MCP/speech/agent host 与两内置浏览器为物理删除；普通 Webview、Markdown、auth、第三方 opener 保留。依据 118/124/125/129/130/136 补丁、254-prune 及 150 构建/包检查。 | 替换已停用的 smoke 验收入口，链接 §9.2 替代验证；说明当前 lean-core 未发布与 macOS arm64 本地验收范围。 |
| [扩展兼容](../../extensions-compatibility.md) | [118 补丁](../../../patches/118-light-disabled-ai-api.patch)的无能力 API 精确返回值与权限检查；普通 profiling 保留 CRI，生产 Playwright 链移除。 | 展开 participant、空模型/tool、惰性 provider 注册、never-fired events、accessInfo undefined 和 invokeTool 异步 NotFound；保留第三方自带 AI 实现的边界。 |
| [图标](../../vslight-icons.md) | [资源 helper](../../../dev/prune-macos-resources.py)与 build.sh：packing 后、签名前整理；同哈希文档副本删除，其他 plist 字段保留。150 app 实际主/文档图标均引用唯一 VSLight.icns，65 个文档类型。 | 内容与代码/产物一致，未改。 |
| [发布](../../vslight-release.md) | 150 实测 app/ZIP、签名独立副本、43.7.5/12.0 地板与未发布/CI 未验。版本 1.135.06566 已从持久 app package.json 核对。 | 写出升级用户须知四点，链接迁移节；去掉已经过时的“用户暂停”现状；纠正“所有外发连接仅 OpenVSX”的过度承诺；补150实际 Mermaid 定向恢复与 signed CRC/静态通过结果，保留普通 GUI/账户与扩展持久化、CI未齐。 |
| [使用](../../usage.md) | [130 补丁](../../../patches/130-light-retired-background-entrypoints.patch)在显式 -- 前拒绝 chat/--add-mcp，CLI catch 走 exit 1；Mermaid 命令文案来自实际 150 package.nls.json；资源 helper 保留四 locale base。 | 内容与代码/既有验收一致，未改。150 定向持久化门不由本轮文档检查代替。 |
| [迁移](../../vslight-migration.md) | 数据/凭据不清理；普通 tabs index 映射依据 [117 补丁](../../../patches/117-light-editor-restore-index.patch)；外链普通 fallback 保留；NPM legacy debug 点击转普通 task，实际 150 npmView.ts 已核对。 | 补 canSendRequest 返回 undefined/不索取 consent；138 的 87 API 路径及 12 恢复案例明确版本，避免冒充150实测；删掉空泛措辞。 |

## 持久 150 载体只读复核

读取 `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build150/vscodium`，未写入该目录：

- 源码六个代表退休路径实际不存在：workbench contrib/chat、contrib/browserView、extensions/simple-browser、platform/mcp、platform/localTranscription、platform/agentHost。完整生产闭包沿用 [M8-build150.json](M8-build150.json)的图/包结果，不把六项抽查称为完整生产图复验。
- app 版本为 1.135.06566，macOS 地板为 12.0；Contents/Resources 仅有一份 VSLight.icns，65 类文档关联中的图标引用均为 VSLight.icns。
- 主 Resources 为 en/en_GB/zh_CN/zh_TW 四个 lproj；Framework Resources 为相同四个 base 及各三个 gender variants，共 16 个。其他原生语言回退英文的实机证据来自 [149 原生 GUI](M2-native-gui149-resume.md)；工作台语言包与原生语言不混为一项。
- 150 argvHelper.ts 的拒绝判断仅检查显式 -- 前的参数；cli.ts 的失败 catch 打印可读消息并 eventuallyExit(1)。普通同名 chat 文件的真实打开证据仍按 [M6 CLI 文件](M6-cli-file.md)原版本保留，不新标为150执行。

## 体积与分发边界

同条件 unsigned 基线 app 528,142,131 B、ZIP 192,738,926 B；150 app 422,444,482 B、ZIP 157,532,426 B，分别下降 20.01% 和 18.27%。规则为普通文件计一次、排除 symlink，不重复累加 asar unpacked header 声明；基线/最终均 Node 24.18.0、Electron 43.7.5、CI=true、arm64、ditto 未签名口径，依据 [150 字节账](M8-artifact150.json)。

独立 signed app 421,985,960 B、ZIP 157,388,380 B 是另一计量口径。strict codesign、spctl、公证 Accepted、staple/validate 与签名内容校验依据 [150 签名记录](M8-sign150.md)；不能用其数值与 unsigned 基线直接宣称同条件签名收益。本轮 [最终 CRC/静态记录](M8-crc-static-final.md)补齐 signed ZIP 独立 CRC exit0、3858条目，1209 regular files/14 symlinks 与 signed app 全量一致，失配/缺失/额外均0。signed 包检查、整 app 和14个签名后长度变化 Mach-O 的15项 strict 签名检查通过；checker 回归12/12、Python3.12资源helper27/27通过。该记录保留沙箱 codesign 与初始 checker 的失败，说明实际根因与修正，不将初始失败覆盖为绿。

已阅读 [150 Mermaid 定向记录](M3-storage150-final.md)及实际 [summary.json](M3-storage150-final.evidence/summary.json)：双surface真实quit/restart通过，raw source/ID/theme/numeric panZoom、公共tab状态与完整SQLite editor memento严格相等；历史/假凭据/配置哨兵同值。四张前后原图由主agent复核通过。第一次后台lazy tab尚未deserialize造成的红轮保留；公共firstEditorInGroup显示原tab后原ID/source/transform通过，不是重建editor替代恢复。未把149的32图/33交互改标为150实测。

## 验证与剩余门

六文档已运行 `python3 .agents/skills/documentation-writer/scripts/check_doc.py`，退出 0，无错误/提示；路径、链接、占位符和凭据检查通过。`git diff --check` 限定六产品文档，退出 0。人工核对重点涵盖物理删除、稳定无能力 API、用户数据、第三方 AI/opener、旧 CLI 及显式 -- 文件、四 locale base、体积/签名和未发布边界。没有新增图，无需图形交付检查。

当前状态以本轮集成人的最终结果为准：150 Mermaid 双surface持久化与 signed ZIP CRC/静态子门已按新证据通过；[150实际注册实体与Keyboard Shortcuts](M6-runtime150-final.md)负向子门通过，同时发现下述24条skip-shell死引用。完整native菜单/标题栏GUI、普通账户授权/偏好与第三方主题/扩展状态的实际quit/restart仍未在本文记通过；私有准备fixture不能替代运行证据。双架构 CI 依用户“仅本地实现和验收”限制未运行，旧 CI 或本地 arm64 构建不能代替。六文档内容通过不等于 V1–V10 或 M8 全部退出条件通过；没有发布。

## 151 生产输入后续限制

[151最小补丁](M4-terminal-skip151.md)删除terminal.ts中24条退休debug/session默认skip-shell ID；实际隔离源码常量168→144/退休24→0、同源schema精确减24行、其他普通集合与覆盖逻辑保持，apply/reverse通过。该变动是新生产输入，当前不再宣称主仓全部生产输入匹配150冻结manifest；此前 [150静态记录](M8-crc-static-final.md)的输入一致性仍仅对应其捕获时间与原150。

151正在 `/private/tmp/lean-core-build151-c480juxs` 独立完整构建，全构建、全图typecheck、package、真实151注册表、受影响终端运行及体积/签名尚未通过。本次只维护计划和记录，不改六产品文档的150字节/签名来源，也不把150旧证据改标151；151结果齐备后再同步最终产物数字与状态。150 app46653/host47396保留等待用户给codex CLI辅助功能授权，完整native菜单与普通profile持久化仍未齐，不操作TCC或启动GUI。双arch CI仅本地限制仍未验，2/8，不运行smoke，不提交/推送/发布。
