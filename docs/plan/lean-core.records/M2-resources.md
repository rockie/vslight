# M2 · macOS 图标与原生语言资源 helper

最终完成（2026-10-02 21:59 +1000）：**已完成**。按[用户最新本地arm64验收指示](M8-local-arm64-scope151.md)，x64/CI不要求，原阻塞解除；V1/V2/V4/V8资源、原生GUI/fallback、语言包、三workflow Python配置、151完整build/实际包及静态CLI退出项均通过。[逐项最终验收](M2-final-acceptance151.json)和[当前产物复核](M8-completion-input-artifact151.json)记录实际来源与零缺口。以下保留原验收时点和未验CI的历史事实。


阻塞更新（2026-10-02 21:44 +1000）：必要本地验收已通过；当前输入arm64/x64 CI依用户仅本地限制无法执行，连续三轮核验后记为**阻塞**，总进度6/8。见[阻塞与恢复条件](M8-blocked-ci151.md)。下文保留历史验收时点。


最终本地更新（2026-10-02 21:38 +1000）：V1/V2/V4/V8资源与原生GUI、工作台语言包、151完整重放/实际包检查均通过，见[最终逐项审查](M8-final-local-audit151.md)。三workflow的Python供给覆盖两arch；**当前输入arm64/x64 CI仍未运行**，依用户仅本地限制不触发，M2保持进行中。下文按原验证时点保留历史未验与红例。


当前更新（2026-10-02 10:59 +1000）：[149四语言原生菜单/打开保存](M2-native-gui149-resume.md)和[150 Finder/Dock/关于](M2-icons150.md)通过，65项关联保持；helper及德语工作台已验。当前输入双arch CI依用户仅本地限制未运行，M2仍进行中。

以下保留各阶段实施和红例。

- 计划：[lean-core.md](../lean-core.md)，§5.1，V1/V4/V8，M2。
- 最近更新：2026-10-02 02:17 +1000。
- 状态：helper 子任务已交付并通过行为 fixture 与未签名基线副本验证；M2 总体验收尚未完成。

新增[真实原生资源验证](M2-native-runtime.md)：未签名正式138的实际进程按NSArgumentDomain测试en/en-GB/zh-CN/zh-TW及fr/de/ja七组资源选择、AppKit字符串和英文fallback，通过且全局系统语言未改。65项文档类型非图标字段/URL关联和图标引用通过。此证据不替代Finder/Dock/About及三语言原生GUI；新产物检查与双arch CI也待验。
- 代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33 + patches/114-light-extension-host-lifecycle.patch`；本子任务新增 `dev/prune-macos-resources.py`、`dev/test_prune_macos_resources.py` 与本记录。app 输入来自 [M1 修复后基线产物](M1-repaired-baseline-artifact.json)，版本 `1.135.06566`、Electron `43.7.5`、macOS floor `12.0`，未签名。
- 写入边界：仅上述三个文件；未修改构建入口、workflow、patches、计划或用户 `vscode/` 生成树。实际资源操作只发生在临时 fixture 和基线副本，基线原件未修改。

## 实现记录

CLI：`python3 dev/prune-macos-resources.py <实际未签名.app路径>`。需要 Python 3.11+；成功 stdout 输出 JSON、exit 0，失败 stderr 给出具体路径/原因、exit 1。无需安装第三方 Python 包。

先解析 app/main Resources/Framework 实际 Resources 的路径，验证所有目标和其内部 symlinks 的最终路径仍在 app 内；不跟随重复的 Framework `Resources → Versions/Current/Resources → Versions/A/Resources` 进行多次扫描。读取两份 plist 并保持其 XML/binary 格式。所有图标、语言、运行资源、plist 格式和删除后的 symlink 存活性均在首次写入前验证。

主图标取 `CFBundleIconFile`，允许合法 basename 的 `.icns` 或省略扩展名形式；绝对路径、穿越、嵌套路径或其他图标格式拒绝。全部带 `CFBundleTypeIconFile` 的文档类型必须存在且 SHA256 等于主图标，再把该字段统一为主图标原值；无该字段的文档类型不补字段。其他文档字段、URL 关联及任意 plist 数据不变。仅删除原文档引用过、修改后又没有其他 plist 图标引用的副本；icon 字段中的省略扩展名值和任意字段中的 `.icns` 路径都保护对应资源。普通 `CFBundleTypeExtensions` 中的 `python/text` 等扩展名不当作图标引用。

两处原生语言白名单是 `en/en_GB/zh_CN/zh_TW` 与各自现存 `_FEMININE/_MASCULINE/_NEUTER`，`Base.lproj` 若存在保留。仅接受当前 Electron 已知的 55 种 locale basename 和规范大小写/suffix；新名称、连字符目录名、未知 gender、大小写错误、lproj 文件或 symlink 目录均失败，要求显式审核上游变化。main Resources 的语言目录是占位目录，要求 en/zh_CN/zh_TW 存在；Framework 还要求每个保留语言/变体带非空 `locale.pak`。保留并验证 icudtl、resources.pak、两份 chrome pak、V8 context snapshot 和许可证；普通 app 内容不裁剪。现有 `CFBundleLocalizations` 同步过滤，声明允许 Apple 的连字符语言格式且保留原拼写；字段不存在时不补造。两份 plist 的 `CFBundleDevelopmentRegion` 均设为 `en`。

事务先将全部新 plist 和原始字节备份写入 app 内临时目录、fsync、重新解析验证，再把已验证删除项同文件系统 rename 到事务目录，最后用 `os.replace` 原子替换 plist。任何 staging/replace 错误都会恢复原始 plist、权限和删除项，清掉临时目录。成功后删除隔离资源。重跑不重写 plist、不产生新增资源、不再删除资源。这里的原子替换和异常回滚不承诺跨电源故障的整个目录事务。

## 行为 TDD 与调试证据

先建立 20 项测试和抛 `NotImplementedError` 的 helper，首轮 exit 1，20 tests/34 errors，证明实现前测试为红。实现后，XML fixture 内 `None` 无法序列化的问题由独立 `plistlib.dumps` 复现定位，改为可序列化但结构非法的 integer 7。

随后先补红例再修复两个实际安全缺口：保留 symlink 指向待删图标/语言文件必须拒绝；基线首次副本检查发现只删除 10/28 个图标，定位为将普通扩展名当成图标引用，新增 `test_document_extension_names_are_not_icon_references` 先失败 `0 != 2` 后修复。另对 `.LPROJ` 大小写异常先补红例再扩展预检。最终 27 项测试全部通过；早期少删图标的实验副本已经移除，最终下述产物来自原始基线的新副本。

| 行为 | 对应测试族 | 结果 |
| --- | --- | --- |
| 合并图标、保留全部非 icon 字段、无字段不补、支持省略扩展名 | `icons_and_non_icon_document_data`、`icon_without_extension` | 通过 |
| 其他 plist icon 引用保护、framework 省略扩展名引用、文档扩展名不误判 | `other_plist_reference_keeps_duplicate`、`framework_plist_reference_keeps_icon_copy`、`document_extension_names_are_not_icon_references` | 通过 |
| 异 hash/缺图标/穿越/绝对路径/外部图标 symlink 失败且 app 不变 | 对应 `different_icon_hash`、`missing_document_icon_and_main_icon`、`icon_path_traversal_and_absolute_path`、`external_icon_symlink` | 通过 |
| 四语言、16 variants、Base 和其他 runtime 资源保留；Framework alias 不重复计量 | `retains_all_four_locales_variants_base_and_runtime`、`framework_alias_scanned_once_and_counts_physical_files` | 通过 |
| 缺必须语言/locale.pak/runtime、未知语言/gender/目录大小写或 suffix 拒绝 | `missing_required_locales_and_native_payload`、`missing_runtime_resource`、`unknown_locale_and_wrong_whitelist_format`、两项 `case_mismatch` | 通过 |
| Framework 资源外部 symlink、lproj 内外部 symlink、保留链接将悬空拒绝 | 四项相关 symlink tests | 通过 |
| 非法 plist 容器/文档结构/声明、可选声明、英文 fallback、binary 格式 | `invalid_plist_structures`、`optional_localizations_and_english_fallback`、`absent_localizations_not_created_and_binary_format_retained` | 通过 |
| staging/第二份 plist replace 失败回滚、模式和字节不变；重复执行幂等 | `plist_staging_failure`、`atomic_replacement_failure_rolls_back_all_changes`、`idempotence` | 通过 |
| 真 CLI JSON/exit 0，坏资源 stderr/exit 1 且 app 不变 | `cli_nonzero_and_json_summary` | 通过 |

最终命令：`/opt/homebrew/bin/python3.12 dev/test_prune_macos_resources.py`；Python `3.12.13`，27 tests，exit 0。fixture 在独立 TemporaryDirectory 中创建含空格/Insider 名称的 app，测试完成清理；禁用本地 bytecode 写入，未遗留测试 cache。

## 真实基线副本资源账

保留可复核副本：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m2-resources-ieg7a0u7/VSLight.app`。原件路径为 [M1 artifact](M1-repaired-baseline-artifact.json) 的 `app` 字段。用 `shutil.copytree(original, copy, symlinks=True)` 制作，helper 由 Python 3.12.13 运行。

每个普通文件记录相对路径、长度和 SHA256；symlink 记录相对路径和链接内容，不重复计 symlink 指向的文件。原件前后清单逐项相同，清单 JSON（sort_keys=True）SHA256 为 `1de351a90e428395a0a61f467592913a78a7d84520e34b8b6ebff3cd4aececea`。副本变化只包含删除候选和两份 plist；所有剩余非 plist 文件 hash 与链接内容不变，无新增资源。

| 项目 | 删除文件数 | 删除字节 |
| --- | ---: | ---: |
| 28 个文档图标副本 | 28 | 11,986,912 |
| 非中英文 Framework `locale.pak`（main 语言目录为空） | 204 | 46,403,559 |
| 已删除物理文件合计 | 232 | 58,390,471 |
| 两份 plist 净缩小 | 0 | 7,053 |
| 文件长度求和净下降 | 232 | **58,397,524（55.69 MiB）** |

普通文件数 2,199 → 1,967；文件长度求和 528,142,131 → 469,744,607 bytes（约 447.98 MiB）。不包含 ZIP 压缩收益，也不把目录或 symlink 占用算入文件长度。

main 保留 1 个 `VSLight.icns`、4 个语言目录；Framework 保留 16 个语言/variants 目录。共删除 255 个 lproj 目录（main 51、Framework 204），Framework 的 symlink 布局不变。当前实物没有 Base.lproj；Base 保留由 fixture 验证。

两份 plist 的语义差异：

- `Contents/Info.plist`：`CFBundleDocumentTypes` 的已有 icon 字段统一 `VSLight.icns`，新增 `CFBundleDevelopmentRegion=en`。65 项文档类型的其他字段逐项相同，没有增删类型，URL 关联和其他字段不变。
- `Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/Info.plist`：只新增 `CFBundleDevelopmentRegion=en`。
- 两份原件均无 `CFBundleLocalizations`，副本也未补造；可选字段过滤由 fixture 覆盖。
- 同副本第二次 helper exit 0，`deleted_files=0`、`deleted_bytes=0`、`deleted_directories=0`、`plist_updates=[]`、`plist_bytes_delta=0`；完整清单与第一次成功后相同。

## 主集成事实与未验收项

主 agent 已加入 `patches/115-light-codicons-demo-assets.patch`；该补丁由主 agent 管理，本子任务未生成/验证它。已只读核对 `build.sh:30–37`：packing 后检查 Python 3.11+，由生成 product 的 `nameLong` 推导实际 app 名称（符合生成源码 [build/lib/electron.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/build/lib/electron.ts) 的 packaging 名称，覆盖 Insider），调用本 helper，再执行 touch；签名/公证/ZIP 在其后。三份 macOS workflow 的 `setup-python` 均无原 x64 条件，保留 Python 3.11 配置。这些代码落点已存在，CI 两 arch 尚未运行，不能记通过。

本机 `/usr/bin/python3` 是 3.9；集成入口要求 Python 3.11+，本子任务验证显式用 `/opt/homebrew/bin/python3.12`。主 agent 的本地集成构建需使用已有 3.12 interpreter 的 PATH 或等价受控环境；本子任务未修改系统 Python、mise 或永久 PATH。

| M2 退出条件/断言 | 命令或走查 | 环境/代码基线 | 结果与必要证据 |
| --- | --- | --- | --- |
| V1 图标引用与文档字段、V4 静态白名单、V8 安全失败/幂等 | 27 tests，命令见上文 | dirty@f196 +114，Python 3.12.13，独立 fixture | 通过子任务 fixture |
| V1/V4 实际资源整理与字节/字段安全 | copytree + helper CLI + 前后相对路径/sha256/symlink/plist 比较 | M1 修复后未签名 arm64 app 的独立副本 | 通过资源静态验证；原件清单相同，净减 58,397,524 bytes |
| V8 同副本第二次执行 | helper CLI + 全清单比较 | 上述已整理副本 | 通过：无删除/写入/新增 |
| V1 Finder/Dock/关于框/文件关联 | 实机走查 | 需签名后的集成 app | 未运行 |
| V4 en/zh-CN/zh-TW 原生 UI、其他系统语言英文 fallback、工作台语言包 | 隔离系统语言偏好或测试账户 | 需真实 UI | 未运行；fixture 不替代 |
| V2 Codicons 产物/图标、V8 完整重放/编译/构建 | 主集成补丁与构建检查 | 115 与 build.sh/workflows 由主 agent 集成 | 本子任务未运行 |
| M2 两 arch CI 构建、当步产物 smoke --skip-ui | 现有流水线和 smoke | 尚无集成产物/CI 结果 | 未运行 |

继续动作：主 agent 复核 helper/测试与构建入口，使用正确 Python PATH 打包并跑当步 smoke；执行三语言原生 UI、其他系统语言 fallback、Finder/Dock/关联与双 arch CI 后，才可记 M2 已完成。

主集成补充：build.sh 使用 `"${PYTHON:-python3}"`，与本地 dev/run-build.sh 的 Python3.12 配置一致；CI 经 setup-python 的 python3 默认入口供给3.11。调用前显式版本检查，随后使用相同解释器，不依赖本机系统python3（当前3.9）。app路径依据实际gulp-electron product.nameLong。

[德语语言包/普通市场CLI](M2-language-cli.json)：144新产物从OpenVSX安装真实de pack且package声明de；普通已装主题卸载后list移除，语言包仍在。GUI德语生效与nativefallback尚未验；未重复既有绿且未影响的helper测试。
