# M1 · 保留功能与验收 fixture

- 计划：[lean-core.md](../lean-core.md)，对应 §4.1、§9、M1。
- 最近更新：2026-10-01 AEST（UTC+10），补充真实存储运行模式与混合 tabs 生成器。
- 状态：调查、普通宿主 fixture、恢复 profile 准备模式和生成器已交付；真实普通来源及两套混合 tabs 副本已构造验证；全量普通模式 auth/secret 存储仍待收口，GUI 恢复回归未运行。
- 代码基线：根仓 `dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，本任务新增本记录、`fixtures/baseline/{package.json,extension.js,run.js}` 与 `fixtures/create-retired-tabs.py`；源码树 HEAD `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。恢复 profile 来源为集成人该基线加 114 补丁的隔离 app，产物来源见 [M1-repaired-baseline-artifact.json](M1-repaired-baseline-artifact.json)。
- 边界：读取当前源码、计划、旧 lean-dist M6 的普通 smoke 摘要。未读取个人 profile、历史数据库、账户 token 或签名秘密；未调用 GUI；未改产品源码或 smoke。

## 1. 普通保留功能基线

冻结以 V7 为完整保留面。现有 smoke 是其中一部分，不能用 smoke 绿色推断整张表通过（计划 §9.1–9.3）。表中的「基线」均需集成人用同条件旧产物补实际结果。

| 保留面 | 实际可执行方法与证据 | 已有覆盖/缺口 |
| --- | --- | --- |
| 普通扩展激活、命令、文档、状态栏 | 运行本记录 §2 fixture，文档精确读回、命令回传、状态栏 API 设置/显示/隐藏 | fixture 已写，未跑；状态栏视觉与焦点仍人工核验 |
| 编辑保存、剪贴板 | 完整 smoke；独立文件输入唯一文本、保存后读回目标文件，避免「任一文件改动」掩盖错焦点 | smoke `dev/smoke.sh:393` 当前只查 workspace 任意文件；fixture 对目标文档精确断言 |
| Explorer、搜索、语言、主题 | 新建/重命名/删除测试文件；全局搜索唯一标记；打开 HTML/TS 查看普通语言功能；切换内置 light/dark 与 OpenVSX 主题 | smoke 没有 Explorer/搜索操作、语言服务和主题实际切换的断言 |
| 内置 Git diff/stage/commit | fixture 用 `vscode.git` API 打开临时仓，生成 diff、add、commit；用 `git show HEAD:git-proof.txt` 读回 | smoke 仅包内 Git 存在和 Source Control OCR，未验证 diff/stage/commit（`dev/smoke.sh:252`） |
| 普通终端 | fixture 用真实 `createTerminal`、`processId`、`sendText` 输出 `TERMINAL_OK` 文件；另完整 smoke 验真实快捷键输入 | API 成功不能替代 smoke 焦点问题；详见 §5 |
| task 执行/停止 | fixture `ShellExecution` 输出 `TASK_OK` 并断言 `onDidEndTaskProcess` exit 0；长任务先输出 `TASK_RUNNING`，`terminate()` 后等待 `onDidEndTask` 并检查执行列表 | smoke 没有 task；fixture 未跑 |
| OpenVSX 装卸 | 当前 smoke 安装 `zhuangtongfa.material-theme` 与简体语言包；需单独执行卸载，并以 `--list-extensions` 缺失证明卸载 | 当前 smoke 没有 `--uninstall-extension`（`dev/smoke.sh:258`） |
| 普通 auth/session/secret | fixture 注册隔离 provider，`getAccounts`、预授权的 `getSession(silent)`、假 secret 写读删 | 不借用真实账号；跨重启持久化与升级账户状态还需旧 profile 副本验证 |
| Webview 双向消息、HTML 编辑 | fixture 的 iframe script 先发 ready，宿主发 ping，script 回 pong，30 秒超时失败；另打开普通 HTML 编辑器 | DOM 渲染与 Webview 外链另走 §6 |
| Markdown、独立 Mermaid | Markdown 预览；独立 Mermaid editor 的图类型/中文/字体/light-dark/非法语法/缩放/复制矩阵按 V3 | smoke 无渲染矩阵，M3/M8 验收不能省略 |
| 外链、profiling | §6 的系统外链矩阵；运行扩展宿主 profiling 的既有命令，启动/停止并查看输出 | smoke 无对应覆盖；须主 agent 实测 |
| 普通 Accessibility Help/Accessible View | §6 从有内容的 terminal、editor、focused hover 逐一打开、读取、关闭、检查焦点返回 | fixture 只测 hover 内容和命令注册；它不把命令存在当成 UI 通过 |
| 冷启动、Reload、运行日志 | 隔离 profile 冷启动与 Reload Window；检查 main/shared/renderer/exthost logs 的 Unknown service、Missing proxy、customer 异常 | 完整 smoke 不做 Reload 与日志 DI/RPC 扫描 |

## 2. 已交付普通宿主 fixture

测试专用目录：[fixtures/baseline](fixtures/baseline)。仅三个 CommonJS 文件，无发布集成；不测 AI 无能力行为。`package.json` 声明 main、启动 activation、测试命令和 auth provider；[extension.js](fixtures/baseline/extension.js) 提供普通命令、假认证 provider、hover；[run.js](fixtures/baseline/run.js) 使用 `node:assert/strict` 和真实 `vscode` API。

全量普通基线使用 `LEAN_RUN_BASELINE=1` 的 extensionDevelopmentPath 模式，不传 extensionTestsPath：activation 返回 API 后通过 setImmediate 执行 run，避免 run 再调用 activate 导致等待自身；成功/失败写完结果都执行 `workbench.action.quit` 正常关闭。外层必须检查结果 JSON，否则退出码可能假绿。原 `run(): Promise<void>` 仍可用标准测试 runner（`vscode/src/vs/workbench/api/common/extHostExtensionService.ts:766`），但不能据此验证有预授权的持久 auth/session：`vscode/src/vs/platform/storage/electron-main/storageMainService.ts:109` 对 extensionTestsLocationURI 启用全存储 in-memory，忽略预 seed SQLite。第二轮已实际验证此缺口；该模式中严格 session 断言会失败，不能称 session 已通过。

测试 workspace 必须为单文件夹，与环境变量 `LEAN_TEST_WORKSPACE` 的真实路径相同。成功输出 baseline-results.json，8 个场景逐个 PASS；失败保存此前完成项与错误后 rethrow。超时也失败。终端、任务、Webview 使用 30 秒等待，单个场景 60 秒上限。认证/secret 检查排在最后；baseline-progress.json 只记录阶段名与已完成结果，认证内进一步区分 getAccounts/getSession/secrets.store/get/delete/get-after-delete，不记录 token。此 JSON 是当次 fixture 证据，不能替代 GUI、完整 smoke 或最终 M4 稳定 API fixture。

集成人提供以下绝对路径并在隔离 profile 尚未启动时执行准备。不要指向个人目录；默认 profile 的全局存储为 `User/globalStorage/state.vscdb`，schema 与 auth key 依据 `vscode/src/vs/base/parts/storage/node/storage.ts:343`、`vscode/src/vs/workbench/services/authentication/browser/authenticationAccessService.ts:75`、`vscode/src/vs/platform/storage/electron-main/storageMain.ts:285`。

```bash
export LEAN_APP_CLI="<实际基线 app>/Contents/Resources/app/bin/vslight"
export LEAN_TEST_PROFILE="/tmp/lean-test-<唯一短标识>/p"
export LEAN_TEST_EXTENSIONS="/tmp/lean-test-<唯一短标识>/e"
export LEAN_TEST_WORKSPACE="/tmp/lean-test-<唯一短标识>/w"
export LEAN_TEST_SHARED="/tmp/lean-test-<唯一短标识>/s"
export LEAN_FIXTURE_DIR="$PWD/docs/plan/lean-core.records/fixtures/baseline"
mkdir -p "$LEAN_TEST_PROFILE/User/globalStorage" "$LEAN_TEST_EXTENSIONS" "$LEAN_TEST_WORKSPACE" "$LEAN_TEST_SHARED"
python3 - <<'PY'
import json, os, pathlib, sqlite3
profile = pathlib.Path(os.environ['LEAN_TEST_PROFILE'])
settings = {
    'git.enabled': True,
    'git.autoRepositoryDetection': True,
    'git.enableCommitSigning': False,
    'git.confirmSync': False,
    'terminal.integrated.enablePersistentSessions': False,
    'security.workspace.trust.enabled': False,
    'workbench.startupEditor': 'none'
}
(profile / 'User/settings.json').write_text(json.dumps(settings, indent=2))
with sqlite3.connect(profile / 'User/globalStorage/state.vscdb') as db:
    db.execute('CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)')
    db.execute('INSERT OR REPLACE INTO ItemTable (key,value) VALUES (?,?)', (
        'lean-baseline-auth-Lean Baseline Account',
        json.dumps([{'id': 'lean-tests.lean-baseline-fixture', 'name': 'Lean Baseline Fixture', 'allowed': True}])
    ))
PY
LEAN_RUN_BASELINE=1 "$LEAN_APP_CLI" --user-data-dir "$LEAN_TEST_PROFILE" \
  --shared-data-dir "$LEAN_TEST_SHARED" --wait \
  --extensions-dir "$LEAN_TEST_EXTENSIONS" --disable-workspace-trust \
  --skip-welcome --skip-release-notes --verbose \
  --extensionDevelopmentPath "$LEAN_FIXTURE_DIR" "$LEAN_TEST_WORKSPACE"
python3 - <<'PY'
import json, os, pathlib
report = json.loads((pathlib.Path(os.environ['LEAN_TEST_WORKSPACE']) / 'baseline-results.json').read_text())
assert report['status'] == 'PASS' and len(report['results']) == 8
assert all(result['result'] == 'PASS' for result in report['results'])
PY
```

profile 使用 `/tmp` 短路径：主 agent 的首个长临时路径实跑触发 UNIX IPC handle 长度超过 103 字符与 EINVAL；CLI 未加 verbose 时仍 exit 0 且没有可见错误。实际测试是否成功必须同时核验 baseline-results.json 全 8 项、宿主测试结束证据与退出码，不能只看 CLI 退出 0。

仅真实普通模式使用隔离 profile 的 SQLite 预授权；标准 extensionTestsPath 模式因 in-memory 存储无法使用该授权。独立 shared-data-dir 避免应用共享存储串到默认用户空间，其 CLI 定义为 `vscode/src/vs/platform/environment/node/argv.ts:122`。只给此测试 provider/假账户授权，不改 product allowlist。未预授权时 silent session 返回 undefined，fixture 明确失败，不弹授权对话框。`vscode/src/vs/workbench/api/browser/mainThreadAuthentication.ts:473` 根据该 allow-list 返回现存 session；`vscode/src/vs/workbench/api/browser/mainThreadAuthentication.ts:537` 的 silent 路径不创建交互授权。

fixture 内 Git 使用 `execFile` 初始化仅指定 workspace 的仓库和本地测试身份，diff/stage/commit 由内置扩展执行；不会修改全局 Git 身份。terminal/task 使用 `/bin/sh`，适用于本期 macOS 实机。secret 只使用固定假值并在测试中删除；它仍经过宿主实际 secret storage，系统存储能力不足应失败并定位。建议一次使用全新 workspace，避免已有仓库配置与 HEAD 污染基线。

## 3. 冻结最终稳定 API fixture 契约

最终路径按计划为 `dev/test-fixtures/lean-core/{package.json,extension.js,run.js}`，当前未创建。M4 在实际构建 app 的扩展宿主运行；不要把本记录普通基线 fixture 当作该契约已经实现。普通场景可沿用 §2，稳定 API 增以下断言。

| 场景 | 冻结断言 | 源码依据 |
| --- | --- | --- |
| Chat participant | 创建后 id 正确，`requestHandler` 与输入 handler 同一引用；可替换 handler、iconPath、followupProvider 并读回；feedback Event 返回可重复 dispose 的 Disposable；participant 重复 dispose 不抛异常 | `vscode/src/vscode-dts/vscode.d.ts:19785` |
| LM 查询/工具 | selector 缺省与指定值均 resolved `[]`；`lm.tools` 始终空且对外 readonly；注册 provider/tool/MCP 前后仍空；没有伪 `LanguageModelChat` | 计划 §4.1；`vscode/src/vscode-dts/vscode.d.ts:20739` |
| provider 零调用 | 各 provider 的提供/解析/响应/计数/工具 invoke/prepare 回调均累加计数；注册、查询、dispose 与重复 dispose 后总计 0。provider 事件用显式记录订阅次数的 Event，注册和注销都必须 0 次订阅 | 计划 §4.1/§9.2；现路径 `vscode/src/vs/workbench/api/common/extHost.api.impl.ts:1896` 仍转运行服务 |
| never-fired Events | `lm.onDidChangeChatModels`、accessInfo.onDidChange、participant.feedback 以 `(listener,thisArgs,disposables)` 注册；检查返回 Disposable、加入 disposables 数组；解除/重复解除及一次普通宿主事件循环后 listener 计数 0；源码另确认无发射源 | 计划 §4.1；有限时观测不能单独证明永不触发 |
| invokeTool | 调用时用 `assert.doesNotThrow` 捕获返回值，确认 Thenable；`await assert.rejects` 要求 `instanceof LanguageModelError`、`name === 'LanguageModelError'`、`code === 'NotFound'`，消息表达本产品无 LM tools；不能同步 throw、返回空成功 result | `vscode/src/vs/workbench/api/common/extHostTypes.ts:4174` |
| context accessInfo | 本地对象与 Event 可用；对测试传入的模型形状 `canSendRequest` 返回 undefined；不创建/注册伪模型，不出现 consent | `vscode/src/vscode-dts/vscode.d.ts:20853`；现宿主仍调用 LM service 创建该对象（`vscode/src/vs/workbench/api/common/extHostExtensionService.ts:527`） |
| 纯数据 | 构造/读回 `LanguageModelChatMessage`、角色枚举、Text/Data/ToolCall/ToolResult/PromptTsx parts、ToolResult、LanguageModelChatToolMode、LanguageModelError 三种静态错误、McpStdio/HttpServerDefinition；MCP command/HTTP 只作为数据，不执行、不请求网络 | `vscode/src/vscode-dts/vscode.d.ts:20127`、`:20351`、`:20422`、`:20896`；`vscode/src/vs/workbench/api/common/extHostTypes.ts:4297` |
| 授权边界 | 无 enabledApiProposals 的 fixture 保持 proposed 权限检查；只给测试扩展声明/CLI 授权后，退休入口仍明确 unavailable，异步签名 reject；至少一个未退休普通 proposal 继续可用 | 退休 proposal 完整清单由 M1 删除入边/保留清单交叉冻结，不能只猜 browser/speech 三个名字 |
| 无后端链 | 运行日志无 DI/RPC/customer 缺失；actor/生产图核验无 AI 执行链；测试期间进程无 MCP/voice/agent 子进程 | 不以 provider 计数 0 代替注册、IPC、生产包闭包检查 |

同名 CLI 文件场景另创建内容固定的 `chat` 文件，用 app CLI `-- chat` 打开后由真宿主 `workspace.textDocuments` 查 URI 和内容；普通 `chat`/`--add-mcp` 拒绝退出码在 M6 smoke L2 验证。不能把 GUI 打开断言塞入 `--skip-ui`。

## 4. 旧 profile 与混合 tabs

### 4.1 源码证据与单测矩阵

`ISerializedEditorGroupModel` 的 editors 为 `{id,value:string}`，mru 与 preview 指向原 editors 索引，sticky 为最后 sticky 项的索引（`vscode/src/vs/workbench/common/editor/editorGroupModel.ts:38`）。当前 deserialize 在过滤未知 serializer 后才按旧索引查 `this.editors`；还在遍历里修改 `data.sticky`（同文件 `:1233`、`:1245`、`:1252`、`:1256`）。

现有测试的 serializer 接口、注册和实例化入口可直接复用（`vscode/src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts:282`、`:325`、`:55`）。现有 `group serialization` 覆盖全部能恢复/全部不能恢复，未覆盖以下局部缺失矩阵（同文件 `:680`、`:724`）。这里是按源码推导的预期失败，尚未运行测试。

用 `testEditorInputForGroups` 串行化 `{id:'A'}`、`{id:'B'}` 为普通测试 editor；`R` 用未注册 id 或已注册但返回 undefined 的 serializer。每例创建独立深拷贝 state，避免现实现修改 sticky 污染后续断言。snapshot 一并检查 sequential、MRU、active、preview、stickyCount、各项 sticky 和输入 state 未被修改。

| editors / state | 正确恢复 | 当前源码推导风险 |
| --- | --- | --- |
| `[R,A,B]`, mru `[1,2,0]` | sequential `[A,B]`，MRU `[A,B]`，active A | 当前 MRU `[B,A]`，active B |
| `[R,A,B]`, mru `[0,2,1]` | MRU `[B,A]`，active B（退休 active 后选首个存活 MRU） | 当前 MRU `[A,B]`，active A |
| `[R,A,B]`, preview `0` | preview null，不能转给 A | 当前旧索引 0 指向 A |
| `[R,A,B]`, preview `1` | preview A | 当前旧索引 1 指向 B |
| `[R1,R2,A]`, sticky `1` | stickyCount 0，A 非 sticky | 原边界遍历中被减小，第二个 R 被漏算，A 错成 sticky |
| `[R1,R2,A,B]`, sticky `2` | stickyCount 1，仅 A sticky | 存活 sticky 按原边界计数，不依据动态变小边界 |
| `[R1,R2]`, mru `[1,0]`, sticky `1`, preview `0` | count 0，MRU 空、active null、preview null、stickyCount 0 | 当前 stickyCount 可变成 1，preview 可为 undefined |
| `[A,B]`, mru `[1,0]`, preview `1`, sticky `0` | 原顺序/active/preview/sticky 全不变 | 无退休对照，不可由映射修复引入行为变化 |

实施位置为既有 `vscode/src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts`；M4 配套通用映射修复。候选验证命令为在 `vscode/` 执行 `./scripts/test.sh --grep EditorGroupModel`，该入口实际在 `vscode/scripts/test.sh` 调用 Electron 单测 runner，会使用开发 Electron/编译输出；它不是本任务已运行项，也不能用此单测替代实际 app 旧 profile 恢复。

### 4.2 合成 profile 构造步骤

1. 用 M1 同条件基线 app 创建**全新测试 profile**、独立 extensions 和固定路径 workspace；记录版本、Electron、app/补丁哈希、CLI、生成日期。打开 A 文本、B Markdown、普通可恢复 Webview；设置 pinned/preview/sticky/MRU 并正常退出。Webview 需 fixture 注册恢复 serializer，不能把任意未注册 Webview 当成预期存活项。
2. 退出后复制此测试 profile 为只读原件和每场景独立运行副本；workspace 保持固定绝对路径，profile 副本允许更新窗口 state，不改原件。不从真实用户目录复制或抽取数据。
3. 在副本 User/workspaceStorage/<workspace-id> 的元数据核验测试 workspace 身份（当前源码文件名 workspace.json；主 agent 实跑基线副本实际生成 meta.json，按该 app 的实际格式核验，不能硬编码源码文件名），再打开对应 `state.vscdb`；只选 `ItemTable` key `memento/workbench.parts.editor`。JSON 内取 `editorpart.state.serializedGrid.root`，递归 branch.data，定位 leaf.data 的 group state。路径依据 `vscode/src/vs/platform/storage/electron-main/storageMain.ts:415`、`vscode/src/vs/workbench/common/memento.ts:19`、`vscode/src/vs/workbench/services/layout/browser/layoutService.ts:30`、`vscode/src/vs/workbench/browser/parts/editor/editorPart.ts:1499`、`vscode/src/vs/workbench/browser/parts/editor/editorGroupView.ts:2279`、`vscode/src/vs/base/browser/ui/grid/grid.ts:756`。实际叶子/state 缺失时停止构造，不凭空创建 grid 外层。
4. 在 group.editors 原列表插入合成退休项，并按 §4.1 明确重设 mru/preview/sticky；不要对既有旧索引再自动重映射，否则测试不了缺失项恢复。Chat id 为 `workbench.input.chatSession`；value 以 JSON 字符串保存 `{options:{}, resource:{scheme:'vscode-chat-editor',path:'chat-1'}, sessionResource:{scheme:'vscode-chat-session',authority:'local',path:'/bGVhbi1maXh0dXJlLXNlc3Npb24'}}`。此假 session 无历史内容，不创建 Chat database。格式出处为 `vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditorInput.ts:41`、`:431`、`:447`，session URI 为 LocalChatSessionUri.forSession 对假 id 的无填充 URL-safe base64；具体 URI scheme/路径以该基线源码 schema/`vscode/src/vs/workbench/contrib/chat/common/model/chatUri.ts:23` 复核。
5. Browser id 为 `workbench.editorinputs.browser`；value 以 JSON 字符串保存 `{id:'lean-fixture-browser',url:'http://127.0.0.1:18765/lean-fixture',title:'Lean fixture browser'}`。出处为 `vscode/src/vs/workbench/contrib/browserView/common/browserEditorInput.ts:71`、`:404`、`:428`。仅在对应 serializer 已退休的新产物运行，不把该合成项提前交旧 app 执行网络/模型链。
6. 以 SQLite 参数绑定更新该一条 key，保存外层与目标 group 的前后 JSON、构造用脚本/参数、原件与副本文件清单/哈希。标明「基线普通 profile + 源码格式合成退休条目」，不能称为真实历史 profile。
7. M5 的副本只放退休 Browser；M6 放退休 Chat/Browser 并执行全部五类状态。冷启动与 Reload 后核验普通 tabs 相对顺序、active、MRU、preview、sticky；退出后检查历史哨兵、假 auth/secret、测试用户文件仍在。窗口 state 更新单列为允许差异；不要求 SQLite 全文件哈希不变。

[TODO] 首次红测试的隔离 `/tmp/lean-host-ll534sn4/profile` 只有 meta.json、没有工作区 state.vscdb，不可作真实 tabs 来源。后续已取得真实普通 A/B profile 并构造副本（§4.4）；普通 Webview 恢复 serializer 和新产物实机结果尚未补齐，不能预填「升级通过」。未读取个人 profile。

### 4.3 已交付准备模式与生成器

准备真实普通窗口状态时，用新短路径 profile/shared/extensions/workspace，启动与 §2 相同的 app 和 fixture，将环境切到 `LEAN_PREPARE_RESTORE_PROFILE=1`，不设置 `LEAN_RUN_BASELINE`，也不传 extensionTestsPath。activation 严格核验唯一 workspace 与 `LEAN_TEST_WORKSPACE` 的真实路径一致，然后写 A.txt/B.txt；A 用 preview:false 打开，再运行 `workbench.action.pinEditor`；源码明确此命令调用 `group.stickEditor`（`vscode/src/vs/workbench/browser/parts/editor/editorCommands.ts:1400`）。B 用 preview:true 打开，写 restore-prepared.json，等待 1 秒后执行 `workbench.action.quit` 保存状态。

metadata 的状态为 PREPARED_AWAITING_SHUTDOWN_STATE，包含真实 `vscode.version`、workspace、文档 URI 与执行动作；它只证明准备动作完成，必须正常关闭后核验数据库确实保存。metadata 中名为 appVersion 的值实际来自扩展 API `vscode.version`，此基线是 1.135.0；发布包/CLI 版本为 1.135.06566。生成器 manifest 分开记录 source_api_version 与 source_app_version，后者使用产物记录佐证，不能把这两个版本断言为相同。主 agent 负责实际运行，本任务不启动 GUI。

生成器：[create-retired-tabs.py](fixtures/create-retired-tabs.py)，只接受显式提供的 `/tmp` 测试 profile。它读取真实 SQLite 复合 key `memento/workbench.parts.editor`，遍历 editorpart.state.serializedGrid.root 的 leaf.data；必须找到至少两个普通 editor，且 value 为字符串。复制 source profile 后仅改目标 state key，原普通 `{id,value}` 保持原值；先验证当前 Browser/Chat serializer、URI schema、LocalChatSessionUri、测试 serializer 源码片段并将各源码 SHA256 写入 manifest。源 workspace SQLite 有非空 WAL 时拒绝，要求先正常退出。

```bash
python3 docs/plan/lean-core.records/fixtures/create-retired-tabs.py \
  --source-profile "/tmp/<新普通测试profile>/p" \
  --source-app-version "<实际生成 app 的完整发布版本>" \
  --preparation-metadata "/tmp/<对应workspace>/restore-prepared.json" \
  --source-artifact-record docs/plan/lean-core.records/M1-repaired-baseline-artifact.json
```

输出根为 `/tmp/lr-<随机短标识>`；`1/p` 至 `6/p` 是独立副本，覆盖五类：MRU/active 的 retained-active 与 retired-active 两变体、退休 preview、连续退休 sticky、全部退休、完全无退休。每例有 group.before.json、group.after.json、expected.json；manifest.json 记录源 profile 的每文件 SHA256 与整体清单哈希、app/API 版本及 metadata、serializer 源码哈希、构造方法、每例完整预期 sequential/MRU/active/preview/sticky。退出前重算源哈希，变化即失败。source profile 不原地修改。默认 `--retired-kind both` 用于 M6；M5 使用 `--retired-kind browser`，其连续退休项为两条独立 Browser id，不会提前复活尚未退休的 Chat serializer。

默认无真实已保存状态则 exit 1；已在首次红测试 profile 上实跑验证拒绝。显式 `--allow-unit-fallback` 仅允许产出 `testEditorInputForGroups` 源码格式的单元 state，manifest 标为 unit-state-only、usable_for_gui_restore=false，复制 profile 不注入伪造 grid。这种输出不能替代 M1 真实普通 profile 来源，当前未运行该 fallback。

### 4.4 已实际构造的来源与副本

来源 `/tmp/lean-restore-jdsqe80h/profile`，由主 agent 的准备模式正常 shutdown（exit 0）生成；metadata 在 `/tmp/lean-restore-jdsqe80h/workspace/restore-prepared.json`，生成日期 2026-10-01 21:27:39 AEST。真实发布版本 1.135.06566、API 版本 1.135.0；app 为 dirty@f196 基线加 114 隔离重构建，详见 [产物记录](M1-repaired-baseline-artifact.json)。

已读该测试 profile 的实际 state.vscdb：key 为 memento/workbench.parts.editor，group id 0，两个真实 `workbench.editors.files.fileEditorInput`，payload 指向对应 workspace 的 A.txt/B.txt；MRU `[1,0]`、preview 1、sticky 0。A/B 的 resourceJSON、encoding 与 value 原字符串在各混合副本中保持不变；全部退休案例刻意清空普通 tabs，不改源 profile 或源文件。

两次生成命令均 exit 0，未使用 unit fallback：

| 用途 | 输出与来源清单 | 场景 |
| --- | --- | --- |
| M6 Browser/Chat 混合 | `/tmp/lr-d16ezm2o/manifest.json` | 5 类、6 个独立 profile，`1/p`–`6/p` |
| M5 Browser-only | `/tmp/lr-nepzo6pm/manifest.json` | 5 类、6 个独立 profile，`1/p`–`6/p` |

源 profile 整体清单 SHA256 为 `b728dc1da4ad3bc5255303eb16dd61ce3918f681ffc900759eb23567225b2dca`。验证已逐个读取副本 SQLite，确认实际 group 等于 group.after.json；核验所有普通 payload 与源值一致、无退休对照 group 完全相同、退休 preview 预期 null、连续退休 sticky 与全退休预期 stickyCount 0；Browser-only 中无 Chat 项。源 profile 的逐文件 SHA256 复核一致。

这些通过项只证明构造器和 fixture 内容正确。当前实现仍有旧索引恢复风险，未用 M5/M6 新 app 打开这些副本，没有实际恢复 PASS。临时目录不是持久交付物；保留生成器、来源摘要/哈希与主 agent 的临时资源路径，后续目录失效时由相同准备模式重建并记录新哈希。

## 5. 当前 smoke 终端焦点

- 历史 `docs/plan/lean-dist.records/M6.md:33` 记录 48/49 PASS、终端文件未落盘、exit 2。该行称「环境级时序」，没有给已定位的产品/脚本根因；本期只能引用失败事实。
- 当前 `dev/smoke.sh:419` 的 `term_toggle` 发 Ctrl+Shift+Backquote。源码实际把它绑定到 **Create New Terminal**（`vscode/src/vs/workbench/contrib/terminal/browser/terminalActions.ts:1213`），Toggle Terminal 是 **Ctrl+Backquote**（`vscode/src/vs/workbench/contrib/terminal/browser/terminal.contribution.ts:125`）。`term_close_wait` 连发所谓 toggle 可能新建两个 terminal，不能保证面板关闭。
- `require_frontmost` 只证明 app 前台（`dev/smoke.sh:309`），不证明 xterm 输入区焦点。执行链是快捷键、固定 sleep 5、字符注入、等待文件（同文件 `:438`）；没有终端已创建/输入焦点的独立证据。输入法、创建终端延迟和焦点状态需实测区分，不能先写归因。
- 候选调试顺序：主 agent 完整 smoke `--keep` 重跑；保存落盘前后的窗口截图/OCR与隔离 logs；核对 Create New/Toggle/Focus 命令实际执行；再在相同 app 的独立 profile 运行 §2 API terminal 测试。API terminal 绿、快捷键路径红时可缩小到 UI/测试驱动，仍需定位；两条都红应看普通 terminal 创建/PTY 日志。
- 收口应使用明确 New/Focus/Toggle/关闭命令分别验证，不复用错误名字；等待可识别的 terminal ready/焦点证据后注入，保留落盘硬断言。修改归集成人。本记录不声称候选修改已经修复。
- 当前完整 smoke 会退出同 app 的已运行实例（`:298`），备份/恢复剪贴板（`:306`），并写/删 `${HOME}/Downloads/vslight-smoke-download.bin`（`:452`）。它有 profile 隔离，却尚无进程/Downloads 完全隔离。主 agent 运行前应使用独立 test app/进程和独立测试目录方案；此固定文件行为不能因新 fixture 安全就被忽略。
- L3 前台失败与 zh-CN 前台失败可 SKIP 后最终 exit 0（`:375`、`:527`、`:542`）；最终门同时要求退出 0、汇总零 SKIP/FAIL，`--skip-ui` 不替代完整门。

## 6. 主 agent 的 UI 可执行步骤

以下全部未运行，按隔离 app/profile/extensions/workspace 串行执行，运行时记真实版本/源码/补丁基线、步骤、预期与结果；失败不标环境通过。

1. 冷启动，完成 §2 fixture，再正常退出、重新启动普通模式、执行 Developer: Reload Window；查当次隔离 logs，无 DI/RPC/customer 初始化异常。
2. 创建 terminal 并明确 Focus Terminal；输入 `printf '%s\n' LEAN_ACCESSIBLE_TERMINAL`，确认输出可见；运行 Open Accessible View (`editor.action.accessibleView`)，确认文本可读；关闭后输入第二标记，证明焦点回 terminal。再打开 Accessibility Help (`editor.action.accessibilityHelp`)，读取并关闭，重新输入证明返回。
3. 打开 baseline.txt，编辑器焦点运行 Accessibility Help，读完关闭，输入保存后精确读回文件，证明焦点返回。
4. 以开发扩展模式启用本 fixture 的 hover provider（普通模式不要加 extensionTestsPath）；打开 plaintext 文档并把光标置首行，运行 Show or Focus Hover 两次，或 `editor.action.showHover` 参数 `focus:'autoFocusImmediately'`；hover 有 fixture 文字后运行 Accessible View，读取并关闭，再验证焦点返回 hover/原编辑器。hover 的自动焦点行为出处为 `vscode/src/vs/editor/contrib/hover/browser/hoverActions.ts:28`。
5. 在 Markdown 预览、普通 Webview 以及 terminal 各放 HTTP(S)、localhost、127.0.0.1、`[::1]`、0.0.0.0、含编码字符的 URL；用独立本地测试服务器接收，记录外部浏览器实际收到原地址；应用内无 Browser tab。HTML 文件保持普通编辑器。新 fixture 只验证消息，没有提供外链完整 UI，此项需主 agent 独立准备。
6. 打开普通 Mermaid editor，执行 V3 全矩阵；冷启动 §4 profile 副本做 tabs 恢复。安装语言包后切换 workbench locale 验证英文/简体/繁体；原生菜单与其他系统语言 fallback 需隔离 macOS 测试账户，`--locale` 不当作原生语言证明。
7. 运行真正的 Git diff/stage/commit 操作、搜索/Explorer/语言/主题、OpenVSX 卸载、profiling 和普通 auth 状态走查；最终重新完整 smoke，保留退出码与全汇总。fixture 证据与 GUI 证据分别记录。

## 7. 验收记录与剩余缺口

| 退出条件 | 命令或走查 | 环境/代码基线 | 实际结果 |
| --- | --- | --- | --- |
| 普通宿主 fixture 可解析 | `node --check docs/plan/lean-core.records/fixtures/baseline/extension.js`、同目录 [run.js](fixtures/baseline/run.js) | 当前新增文件 | 已运行，两项 exit 0；仅 JS 语法，不证明宿主能力 |
| 文档引用有效 | documentation-writer `check_doc.py` | 本记录 | 已运行，引用修正后复验，见任务交付结果 |
| 普通宿主 V7 基线 | §2 实际 app CLI | 主 agent 短 profile `/tmp/lean-host-ll534sn4`；日志 `host.log` 与 workspace 的 baseline-results.json | 首次 FAIL：普通文档/命令/状态栏 PASS，auth 可选 icon 过严断言已修；第二次 FAIL：标准 tests 模式 in-memory 导致 session 无预授权，已新增真实普通模式，后续场景待重跑 |
| 当前完整 smoke 与 terminal 根因 | §5，集成人独占 GUI | 同条件基线产物 | 未运行；已冻结快捷键错配与焦点缺口 |
| 稳定 API §4.1 | §3 最终 fixture | M4 重构建产物 | 未实现、未运行；普通 baseline fixture 不替代 |
| 混合退休 serializer 单测 | §4.1 Electron 单测 | M4 通用恢复修复 | 未实现、未运行；源码推导的风险与正确断言已冻结 |
| 合成旧 profile 来源/恢复 | §4.2–4.4 | dirty@f196+114 隔离 app 准备模式→生成器 | Python AST 解析通过；缺失 state 来源 exit 1；真实来源两套各5类6变体构造 exit 0，SQLite/payload/源哈希复核通过；M5/M6 实际恢复未运行 |
| 普通 Accessibility/外链/图表/原生 UI | §6 | 主 agent 独占 macOS GUI | 未运行 |

M1 收口前，集成人仍须补同条件 app 来源/体积和本表基线实测；删除闭包清单须给退休 proposal 的确切枚举，以及每条注册/actor/消费者的处置与对应验收。本记录完成的是可执行测试供给与断言冻结，不是 M1 整体验收。

主 agent 另观察到宿主终止过程中 `Unknown channel: extensionhostdebugservice`。这是既有 Debug 删除与测试专用退出链路的基线缺陷候选，待集成人调查；不能写成此次 AI actor 删除引发，也不能忽略退出失败后宣称 V7 全绿。

全量普通模式曾在 auth/secret 场景 60 秒超时，主进程随后无法响应 quit。可能涉及锁屏下同步系统存储调用，根因仍待主 agent trace；不能先标为环境通过。最新 fixture 将严格 auth/secret 移至其余场景之后并提供真实阶段文件，以便区分 getSession 与 secret storage 阻塞，同时保留最终全量失败门。
