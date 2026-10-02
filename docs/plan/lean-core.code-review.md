# lean-core 未提交变更代码评审

评审日期：2026-10-02。参照当前工作树的 [lean-core.md](lean-core.md)。

## 1. 确认问题

未发现可确认的问题。没有将预期的功能移除、历史验收中的失败尝试、未执行的跨平台 CI 或尚未复测的路径列为缺陷。

## 2. 待核实项与证据限制

本轮没有需要用户决定的产品边界问题。以下是评审覆盖限制，不代表代码已被证实有错：

- 没有重新执行完整编译、打包、公证或全部真实扩展宿主及 GUI 验收。Mermaid 图表矩阵、普通编辑/Git/终端任务、第三方 opener、账户/secret、可访问性焦点和混合旧窗口恢复的实机结果引用实现记录；本轮另外执行的检查见第 3 节。历史通过不能写成本轮执行通过。
- 38 个新增补丁的改动文件、入口和保留消费者已纳入检查，重点行为链进行了源码追读；大段退休实现删除、测试 fixture 删除、部分 Azure 构建声明和 lock 中被删的完整条目没有全部逐行审阅，主要用引用闭包、重放、类型检查和实际包清单交叉验证。不能据此声称对全部删除代码做了完整语义审计。
- `docs/plan/lean-core.records/` 的 850 个文件全部进入范围及指纹清单，但没有逐个阅读原始日志或检查所有截图。阅读了 M1–M8 相关汇总及最终验收、构建、API/恢复/持久化等关键记录；其余证据附件仅做范围登记，不宣称已逐项独立复核。
- 本轮实际平台为 macOS arm64。按照计划恢复快照和最终验收范围，x64/CI 已由用户明确取消本期验收要求；Linux/Windows 未作运行验收。此项不作为 M8 未完成的缺陷。

若后续修改上述保留行为链，应针对改动重跑对应真实宿主或 GUI 场景，不能仅沿用这份评审。

## 3. 覆盖与验证

### 3.1 审查对象与快照

变更意图：在补丁层物理移除内置 Browser、Chat/LM/MCP/语音及其后台实现和专属生产依赖，整理 macOS 图标及语言资源，压缩 Mermaid，同时保留普通编辑器、扩展和稳定 API 的约定行为。

| 项目 | 固定值 |
| --- | --- |
| 用户输入 | `$review-code 未提交的代码，参考开发计划 docs/plan/lean-core.md` |
| 仓库 | `/Users/rockie/Documents/gh-xgent/vscodium` |
| 模式 | `uncommitted`，包含 staged、unstaged、untracked |
| base / HEAD | `2c6e2797caf80dc80c427a0425114541fbc66a37` |
| staged | 空 |
| tracked 变更 | 17 个文件 |
| untracked | 910 个文件，其中 38 个新增补丁、850 个记录文件、22 个其他新增文件 |
| 合计 | 927 个文件；本报告不纳入本轮输入 |
| 上游 VS Code | `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5` |
| 计划 SHA-256 | `dbfb31a70ca95e4ea9c0656d534a77bad3b87dbcc1e0c7f6c77be345b10c4cf7` |
| 文件 SHA-256 清单自身的 SHA-256 | `42e5efb5074aa6c68a35bc26924ef0bbce10318c3399ae61e2f8096f78535e12` |

比较方式：`git diff HEAD`、`git diff --cached`、`git ls-files --others --exclude-standard`，并对上述每个输入文件计算 SHA-256。落盘前再次核对，927 个文件无内容漂移、无新增或移出审查范围的输入。临时快照清单为 `/tmp/lean-core-review-snapshot.json`，临时文件可能被系统清理；本节保留其指纹。

当前工作区被忽略的 `vscode/` 生成树没有包含本次完整新增补丁，未将它当作目标源码，也未修改它。代码追读和类型检查使用已留存的最终构建源码，并用当前补丁独立重放结果交叉核对；计划及记录中的历史 `dirty@f1961b…` 不是本轮 Git 基准。

本轮由当前 reviewer 单独完成，未委派 reviewer。没有修复产品代码、改写计划、提交或发布。

### 3.2 已审行为链

| 改动面 | 本轮核查的关键行为 |
| --- | --- |
| `build.sh`、三个 macOS workflow、`dev/prune-macos-resources.py` | 按生成 product 推导 app 名称；整理发生在签名前；Python 版本要求明确；图标同哈希预检与其他 plist 引用保留；语言白名单、framework 路径约束、必需资源、失败回滚及幂等 |
| `prepare_vscode.sh`、`product.json`、`build/retired-api-proposals.json` | 根配置与生成配置双层移除退休元数据；精确过滤 retired proposals；保留普通 proposals；先补丁后 light-prune 的时序 |
| 114、118–119、125、127、130、132、144 等补丁 | 普通扩展宿主生命周期通道；稳定 Chat/LM/MCP 空能力契约；退休 proposed APIs 先权限检查再 unavailable；Notebook/Debug 数据类型及外壳；普通 actors 与双方 RPC 完整性断言保留 |
| 117、149–151 等补丁 | 丢失 serializer 时按原索引恢复 MRU/preview/sticky；移除退休 auto-lock 选项；Storage 延迟外部回写与 pending/in-flight 写入；终端默认 skip-shell 清单及用户覆盖 |
| 120–124、129、131、143 等补丁 | 普通 terminal/tasks、文件/内容搜索和替换、SCM/Git、认证/secret、设置、profiles、工作区 trust、Webview/外链消费者与退休服务解绑；未发现数据清理操作 |
| 116、139、141、148 等补丁 | Mermaid 普通 preview/editor 构建入口、压缩、add-ons、ZenUML 字体、原文换行及错误展示；移除 Chat surface 时保留普通图表和 editor 资产 |
| 133–138、142、145–147 等补丁及 prune | 生产入口、构建任务、依赖与 lock、semver 物理副本、普通 Welcome/交互教程及资源、退休菜单/设置/遥测/描述的闭包 |
| `dev/check-lean-runtime.py` 与新增验证工具 | ASAR、普通 node_modules、unpacked 三种布局；必要依赖/入口和退休项检查；签名后 Mach-O 大小差异处理；限定 PID 的 GUI 驱动与 CLI/宿主 fixture |
| 六份产品文档、计划、`skills-lock.json` | 产品边界与升级说明，原生/工作台语言区别，数据保留、CLI 拒绝、第三方 AI/opener 的能力边界；skills lock 不参与产品运行 |

反证核查包括：Accessibility 中删除的代码块导航原本限定 Chat；Notebook bulk edit 在应用普通编辑前明确拒绝；MRU/preview 使用原始索引，避免压缩后的相邻编辑器接替；Python 旧版本造成的测试失败与文档的 3.11+ 构建要求区分；开发测试使用的 Playwright 与已删除的生产浏览器依赖区分。以上没有形成可确认的新缺陷。

### 3.3 本轮实际执行

使用 Python `/opt/homebrew/bin/python3.12` 和 Node `/Users/rockie/.local/share/mise/installs/node/24.18.0/bin/node`，均未安装新依赖。

| 验证 | 目标与结果 | 限制 |
| --- | --- | --- |
| 资源 helper 单测 | `python3.12 -B -m unittest discover -s dev -p 'test_prune_macos_resources.py'`：27 项通过 | 仿真 app 资源树 |
| runtime checker 单测 | `python3 -B -m unittest discover -s dev -p 'test_*lean_runtime.py' -v`：12 项通过 | 人工 ASAR/文件布局，不等于 GUI |
| 全补丁独立重放 | 对上述上游 `git archive`，按 `prepare_vscode.sh` 的 `sort -t/ -k3 -n` 顺序执行 `git apply --ignore-whitespace`，应用 macOS 补丁，再严格删除 light-prune | 106 个补丁、148 个前置删除、254 个 light 删除全部成功；没有运行 npm install/完整 prepare/build |
| 源码一致性 | 重放后的 5,212 个 `src` 文件与最终构建源码比较，仅 Welcome 公告占位替换和 5 个品牌 SVG 不同；2,307 个 `extensions` 源文件无差异 | 品牌复制/公告替换属于 prepare 的后续生成步骤；不是声称完整生成树字节相同 |
| 构建输入关联 | 留存构建的 `build-inputs.json` 中 262 个相关补丁、构建、helper、workflow/product 输入与当前工作树一致 | 不把历史记录的 HEAD 当作当前 HEAD |
| TypeScript 全图 | 在最终构建源码运行 `node node_modules/@typescript/native/bin/tsc --noEmit -p src/tsconfig.json`：exit 0，无输出 | 类型检查，未重新打包 |
| Storage 回归 | 用该源码自带 `build/node_modules/esbuild` 将 `src/vs/base/parts/storage/test/common/storage.test.ts` 打包到临时目录，再以 Mocha `ui: 'tdd'` 执行：7 项通过 | 覆盖 pending/in-flight 插入/删除、并发写和失败释放；未做真实双窗口并发试验 |
| 已签名实际包 | `python3.12 -B dev/check-lean-runtime.py --app /Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app --signed`：exit 0 | 包布局及签名检查，不是启动 GUI |
| 原生资源选择 | `python3.12 -B dev/probe-macos-native-locale.py <实际 unsigned app> --output <新临时目录>`：7 个语言案例通过；app 与全局语言偏好不变 | 在 Electron main 前验证真实 NSBundle/AppKit 资源，不等于系统对话框 GUI 验收 |
| 实际 packaged CLI | 在独立 profile/extensions 临时目录执行 `chat`、`--add-mcp '{"name":"review-fixture","command":"node"}'`、`--version`、`--help` | 两个退休命令分别明确报 unavailable 且 exit 1；version/help exit 0，版本 `1.135.06566` / arm64；本轮未真实打开 `-- chat` 文件 |
| 语法/格式 | `git diff --check`、`bash -n build.sh prepare_vscode.sh dev/smoke.sh`、11 个 JSON/Python 解析检查、13 个 fixture JS/MJS 的 `node --check` | 全部通过；不是 actionlint 或所有补丁内部文件的语法检查 |

首次使用系统默认 Python 跑资源单测时，CLI 案例因解释器低于 3.11 失败。依据已有构建文档和 `dev/run-build.sh` 的 Python 3.12 配置，换用要求范围内的解释器后 27 项全部通过，不判定为新产品缺陷。Storage 验证首次从根 node_modules 导入 esbuild 时找不到模块；改用已经安装在 build/node_modules 的依赖后执行成功，未修改依赖。

实际包检查中，必要 CRI、KaTeX、node-pty、sqlite、ripgrep、物理 semver 均存在；retired package/out/extension/product 项、missing out、结构错误均为空。`codesign --verify --strict --verbose=2 --deep` 及相关 unpacked Mach-O 检查全部通过；checker 检查前后内容指纹均为 `ed837977d384d86b999a1c667f083f5b4deb69787851cc38067f145d1571d859`。

本轮临时验证证据位置：

- 重放与源码比较：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-review-sorted-e1kxb3tp/summary.json`。
- 实际 signed 包 checker：`/tmp/lean-core-review-runtime.json`。
- Storage 测试打包文件：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-review-storage-8vV4fR/storage.test.mjs`。
- 原生资源选择：`/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-review-native-9i38jbqz/locale/summary.json`。
- 实际 CLI：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-review-cli-vnck8mzc/results.json`。

这些临时文件可能被系统清理。本报告中的执行结果、目标版本与限制独立保留。

## 4. 计划符合性

参照的是本轮固定 SHA-256 的计划工作树版本，范围为已经声明完成的 M1–M8。以当前恢复快照及 [M8 最终验收](lean-core.records/M8-final-acceptance151.md) 的范围修订为准；较早记录的 x64/CI 阻塞描述保留历史意义，不覆盖后来用户明确取消该门的要求。

| 计划承诺 | 实现与验证依据 | 判断 |
| --- | --- | --- |
| R-1 / R-4 / C-2：图标合并、原生语言、签名前整理 | helper、build/workflow 时序、27 单测、实际原生资源探测；[M2 资源记录](lean-core.records/M2-resources.md) | 未发现实现缺口；真实 GUI 本轮未重跑 |
| R-2：Mermaid 压缩并保留图型和普通 editor | 116/139/141/148 及生成资源；[M3 最终矩阵](lean-core.records/M3-product149-runtime.md)、[150 持久化](lean-core.records/M3-storage150-final.md) | 静态实现与记录相符；32 图矩阵未在本轮执行 |
| R-3：Codicons 开发资源移除 | 115、prune 与实际包检查；字体/CSS/license 保留 | 未发现实现缺口 |
| R-5：两个浏览器及运行 Playwright 删除 | 124–125、入口/IPC/生产依赖/prune，实际包退休项为空；普通 Webview/opener 留存 | 未发现实现缺口；第三方 opener 实机使用记录 |
| R-6 / C-3：AI 服务及专属依赖移除，RPC 图一致 | 两侧 protocol/customer/factory，权限与无能力外壳，入口/依赖/prune、全图 noEmit 和实际包 | 未发现实现缺口；真实宿主 API 矩阵使用 [M4 汇总](lean-core.records/M4-final-acceptance151.md) |
| NFR-2：普通保留面与 Accessibility | 普通消费者解绑、宿主生命周期、搜索/Git/终端/认证等源码；[M4 汇总](lean-core.records/M4-final-acceptance151.md) | 未发现确认回归；GUI 覆盖限制见第 2 节 |
| NFR-4：稳定 API、旧窗口与用户数据 | 117/118/127/150，原索引恢复及局部无能力契约，7 项 Storage 回归、CLI 拒绝；[M6 恢复](lean-core.records/M6-final-restore.md) | 未发现确认回归；没有将保留历史数据误判为残留运行能力 |
| NFR-3 / C-1：可重放、prune 缺失失败与闭包 | 严格独立重放 106 补丁、254 light-prune；现有 apply_actions 失败语义；[M7 注入](lean-core.records/M7-prune151.md) | 本轮重放成功；缺失注入引用记录，未冒充本轮执行 |
| NFR-1 / NFR-5：体积、运行时及分发 | [151 体积](lean-core.records/M8-artifact151.md) 区分 signed/unsigned；Electron/macOS floor 未变；本轮实际签名包检查 | 同条件收益数字使用记录，本轮未重新计算 ZIP 或执行公证 |
| M8 文档与交付边界 | README、兼容、usage、icons、migration、release 文档及最终验收范围 | 与物理删除、第三方能力、数据保留及未发布边界一致 |

没有用跨平台未验、已停用 smoke 或历史中间失败推翻用户修订后的本地 arm64 验收范围；没有将上述记录中的 `PASS_LOCAL` 全部算作本轮独立测试。

## 5. 总体结论与修复顺序

**总体结论：`patch is correct`；评审置信度：中。** 在已核查的关键行为和明确覆盖范围内，未发现本次引入、证据充分且应修复的正确性缺陷或本期需求遗漏。独立补丁重放、目标源码一致性、全图类型检查、46 项单测、实际包/签名、原生资源及 CLI 检查提供了交叉证据。

这一判断不是全部删除代码和 850 个证据附件的逐行审计，也不是本轮重新完成整套产品验收。完整 GUI、真实扩展宿主矩阵及公证/ZIP 的限制已分别列明。

没有确认问题，因此没有产品修复排序。后续若改动对应路径，先复测稳定 API/数据恢复/普通消费者，再复测 Mermaid、语言资源和实际分发物；按实际受影响范围执行，不要求重新恢复用户已经取消的 x64/CI 门。
