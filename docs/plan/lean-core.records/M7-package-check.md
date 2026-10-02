# M7 / M8 实际 `.app` 运行闭包静态检查

- 计划：[lean-core.md](../lean-core.md) §5.5–5.7、M7/M8、V5/V6/V8；构建任务候选 [M7-build-tasks.md](M7-build-tasks.md)。
- 输入基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，prepared +114；真实未签名 `.app` 取自 [M1-repaired-baseline-artifact.json](M1-repaired-baseline-artifact.json)，原件只读。
- 新文件：[dev/check-lean-runtime.py](../../../dev/check-lean-runtime.py)，标准库，Python 3.9+，SHA256 `76906da7730f7d2df9d3de58728f3d56ff96f398cf63deb032b13732eb982c5c`。初版 worker 未改 smoke、计划、现有 source、生产包或基线；当前 checker 含主集成人补入的 semver 物理副本检查。此次仅回写本记录，未修改 checker/source。源码说明仅描述产品用途，不携带计划编号。
- 状态：真实基线验证 **red / exit 1** 已完成；正式 137 app 的初版静态 gate 曾为 exit0，但实际启动暴露 semver ESM 缺副本。增强 checker 对旧137 app 为 exit1；138 修复并重打包后当前 app 的增强静态 gate 为 **exit0**。这不是 GUI 或真实 CI 通过，见下文完整证据链。

## 使用与退出结果

```sh
python3 dev/check-lean-runtime.py --app /absolute/path/VSLight.app > package-runtime-summary.json
```

stdout 是唯一完整 JSON summary：`schema_version`、`status`、`exit_code`、`errors`、每个 store 的结构计数、`retired_packages`、`required_packages`、`retired_out`、`missing_out`、`retired_extensions`。普通包每个位置列 `store` + 逻辑路径，真实副本还列 canonical `real_paths`。

- exit 0：有效 asar、所需普通包与入口存在、semver 必需的物理 `node_modules` 副本存在、所有被检查的退休包/目录/精确资源为空。
- exit 1：退休残留、普通必需项缺失，或者 app/asar/真实目录格式/解析/读取错误。缺 asar、坏结构、外部 symlink 不能因空结果误报 green。
- argparse 用法错误为 exit 2；这是命令参数错误，不是产品检查通过。

检查器不写文件、不抽取 asar、不修改任何包，也不按包名删除文件。文件不存在或无法读取时仍输出 fail JSON。

## 读取与断言边界

`Contents/Resources/app/node_modules.asar` 必须存在且有效。解析与本地既有 `asar/lib/disk.js` 一致的 Chromium Pickle size/header framing；读取 UTF-8 JSON 索引，严格验证 framing 长度、重复 JSON keys、files/root/node 形状、安全路径组件、link 目标/循环、size 和 packed offset 边界。没有对压缩或二进制 payload 做 grep。

每个 `unpacked` file 索引要求对应 `node_modules.asar.unpacked` 真实文件存在且长度一致。正常 `node_modules` 和 `.asar.unpacked` 分别遍历真实文件树，跟随包内 symlink、拒绝外部/损坏链接和目录循环。缺少不需要的散装目录本身允许为空；asar 始终必需。semver 是已确认的例外：主进程 ESM 启动需要物理 `node_modules` 副本，仅 asar 中存在不能通过当前 gate。

三个存储各自检查相同退休 package 身份：Playwright-core、`@microsoft/mxc-sdk`、`@vscode/sandbox-runtime`、Foundry SDK / `@foundry-local-core/*`、独占 `@pondwader/socks5-server`、`@github/copilot*`（SDK/CLI及平台包）、Copilot API、`@openai/codex*`、`@anthropic-ai/claude-agent-sdk*`。同时识别 nested `node_modules` 中的实例。无谓的包名前缀不作为依赖所有权证明：这里只列计划已冻结的专属包/families；普通 socks proxy、CRI 的 commander 和一般 sandbox preload 不在退休名单。

普通 `node-pty`、`@vscode/sqlite3`、ripgrep（universal 或普通包）、`chrome-remote-interface`、semver、katex 必须至少在一个有效存储中有非空文件。semver 还必须在物理 `node_modules` 中有非空文件；缺失时报告 `main_process_esm_package`。空目录不能冒充保留包。不是要求每种包都复制三遍：CRI/katex 在真实基线只存在于 asar，node-pty/sqlite/ripgrep 的 native 部分同时在 unpacked。

`out` 按精确目录/文件路径检查 BrowserView、Simple Browser、Sessions、AgentHost、MCP、transcription、Chat/inlineChat、agentsVoice/speech、AI sandbox、extractor；包括打包平铺的 `media/sessions-icon.svg` 和 126 已确认独占退休的 11 个 Chat/voice/edits sound 文件。**不检查全部 chat/mcp 字符串为零**，不否定稳定 API declarations、纯 types 或兼容数据；`vs/base/parts/sandbox` 是普通 Electron sandbox，不属于 AI sandbox。

12 个普通非空 out 文件要求保留：主程序、sharedProcess、workbench bundle，Webview 的 index/fake/service-worker，普通 Electron preload/preload-aux，PTY host、watcher、node extension host、profiling analysis worker。`extensions/simple-browser` 以及 Copilot 专属内置扩展目录也不得存在。

## 真实基线：确实报红

实际输入：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-baseline-vvqrjd3q/vscodium/VSCode-darwin-arm64/VSLight.app`。使用真实 Python **3.9.6** 执行 CLI；没有修改、复制成“最终产物”或用 fixture 代替基线。官方既有 `asar/lib/disk.js` 的 `readArchiveHeaderSync` 与新 Python reader 的 **3084 个目录/文件节点逐项相等**，header size 140960 / JSON 140950 bytes。该 asar 有 402 directories +2682 files，其中36个unpacked files，真实unpacked匹配全部通过。

```json
{
  "status": "fail",
  "exit_code": 1,
  "summary": {
    "missing_required_out": 0,
    "retired_extensions": 1,
    "retired_out_groups": 15,
    "retired_package_instances": 8,
    "structure_or_missing_package_errors": 0
  }
}
```

| 存储 | 实际退休包 | 逻辑 package roots |
| --- | --- | --- |
| `asar` | `@microsoft/mxc-sdk` | `@microsoft/mxc-sdk` |
| `asar` | `@pondwader/socks5-server` | `@pondwader/socks5-server` |
| `asar` | `@vscode/sandbox-runtime` | `@vscode/sandbox-runtime` |
| `asar` | `foundry-local-sdk` | `foundry-local-sdk` |
| `asar` | `playwright-core` | `playwright-core` |
| `node_modules` | `@pondwader/socks5-server` | `@pondwader/socks5-server` |
| `node_modules` | `@vscode/sandbox-runtime` | `@vscode/sandbox-runtime` |
| `node_modules.asar.unpacked` | `@microsoft/mxc-sdk` | `@microsoft/mxc-sdk` |

六个普通包全部 present，12 个普通 out 文件全部 present；没有结构错误。这次 red 的原因是退休残留，不是基线缺普通项。

实际退休 out groups（目录记录也计入 paths，不能把这个计数当文件减重）：

- `vs/platform/browserView`：3 个目录/文件记录
- `media/sessions-icon.svg`
- `vs/platform/localTranscription`：3 个目录/文件记录
- `vs/workbench/contrib/chat`：103 个目录/文件记录
- `vs/platform/accessibilitySignal/browser/media/requestSent.mp3`
- `vs/platform/accessibilitySignal/browser/media/responseReceived1.mp3`
- `vs/platform/accessibilitySignal/browser/media/responseReceived2.mp3`
- `vs/platform/accessibilitySignal/browser/media/responseReceived3.mp3`
- `vs/platform/accessibilitySignal/browser/media/responseReceived4.mp3`
- `vs/platform/accessibilitySignal/browser/media/voiceRecordingStarted.mp3`
- `vs/platform/accessibilitySignal/browser/media/voiceRecordingStopped.mp3`
- `vs/platform/accessibilitySignal/browser/media/chatEditModifiedFile.mp3`
- `vs/platform/accessibilitySignal/browser/media/chatUserActionRequired.mp3`
- `vs/platform/accessibilitySignal/browser/media/editsKept.mp3`
- `vs/platform/accessibilitySignal/browser/media/editsUndone.mp3`

另检测到 `extensions/simple-browser`。

## 格式失败的最小验证

只创建临时小 fixture，不新增 mirror unittest 或产品测试文件，不重跑既有已绿测试。以下9个无效 asar 的 reader 均明确拒绝，CLI JSON 均包含 `asar_structure` 且 exit1；另缺 asar也exit1。

- `truncated_pickle`：exit 1
- `bad_pickle_lengths`：exit 1
- `invalid_json`：exit 1
- `wrong_root_shape`：exit 1
- `unknown_node_shape`：exit 1
- `path_traversal`：exit 1
- `out_of_bounds_file`：exit 1
- `missing_unpacked_file`：exit 1
- `duplicate_json_keys`：exit 1
- `missing_asar`：exit 1

另一个必要物理范围检查：`node_modules` symlink 指向 `.app` 外临时目录，CLI exit1 且明确 `node_modules_structure / external symlink/path`，未把不可安全扫描的树视为空。fixture 都不是完整产品，没有任何 fixture green / locale / UI / CI 声称。

临时证据 `/tmp/m7-baseline-package-check.json`、`/tmp/m7-package-negative-checks.json`、`/tmp/m7-reference-asar-header.json`。这是初版 parser/基线的既有证据；本次记录回写未重跑原9个无效fixture或旧基线检查。Python3.9语法解析和真实3.9.6执行通过；不增加依赖。

## 正式137启动失败与138修复证据链

构建根：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev`，由 `/tmp/lean-core-final-build-path` 定位；当前实际 app 为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app`，旧137 app已归档到同构建根的 `raw-before138/VSLight.app`。

| 产物/阶段 | 实际结果 | 证据与解释 |
| --- | --- | --- |
| 正式137 app，初版 checker | exit0，退休包/入口/资源0，普通包联合存在性通过 | `/tmp/lean-final-runtime-report.json`：semver 仅在 asar，真实 `node_modules` 不存在。初版静态检查没有验证 ESM 启动。 |
| 正式137 app，真实启动 | `ERR_MODULE_NOT_FOUND`，缺少 semver | 主集成人实际启动发现；启动期主进程 import semver 早于 ASAR resolver 安装，asar 中存在不等于 Node ESM 可解析。不能把初版静态 exit0 写成运行通过。 |
| 旧137 app，增强 checker | exit1 | `/tmp/lean-semver-copy-red.json` 明确 `main_process_esm_package: semver requires a physical node_modules copy for startup`；其余退休残留与普通入口检查均没有失败。 |
| 138 打包规则 | 恢复 semver 的物理 copy；正式 min-packing + 资源 helper exit0 | [138-light-main-process-semver-copy.patch](../../../patches/138-light-main-process-semver-copy.patch) 只把 `node_modules/semver/**` 加回 `createAsar` 的 duplicate-copy 规则，不恢复 AI standalone 副本。构建根 `packing-138.exit` 为0；`packing-138.log` 包含资源helper成功结果。 |
| 138 重打包 app，增强 checker | exit0 | `/tmp/lean-final-runtime138-report.json`：semver 同时在 asar 和物理 `node_modules/semver`；没有退休/缺普通入口/结构错误。 |

当前138实际报告的摘要：

```json
{
  "status": "pass",
  "exit_code": 0,
  "summary": {
    "missing_required_out": 0,
    "retired_extensions": 0,
    "retired_out_groups": 0,
    "retired_package_instances": 0,
    "structure_or_missing_package_errors": 0
  }
}
```

138报告 asar为 2134 directory/file nodes /26 unpacked files，header 97852 bytes，JSON97842 bytes；普通真实 node_modules为58节点，unpacked为75节点，out为154节点。asar 与 unpacked 结构数据和137报告相同，新增的散装 node_modules 只恢复 semver。报告中明确的 semver physical realpath 是 `/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/node_modules/semver`。

这次静态 gate 更完整地覆盖了已发现的 ESM copy 约束。**物理副本检查与 min-packing/资源helper exit0 都不是 GUI 通过**；不在本记录宣称138已完成窗口启动、普通编辑/终端/扩展操作、签名、公证或完整M8运行验收。

## Sessions SVG 与剩余验收

`out/media/sessions-icon.svg` 的基线 exact source 是 `src/vs/sessions/browser/media/sessions-icon.svg`，只找到两个真正资源 consumers：`contrib/chat/electron-browser/agentSessions/media/openInAgents.css:23` 的 CSS background，以及 `contrib/agentsVoice/browser/agentsVoiceWindowService.ts:161` 的 FileAccess URI（简写相对 `src/vs/workbench/`）。它们都属退休运行域，没有普通使用者。当前主集成源已删这三个文件，其 `src/vs/sessions` parent prune 已覆盖资源，不追加重叠 child prune。138真实包报告的退休 out groups 为0，包含这个平铺 SVG 的缺失；该事实来自实际包检查，而不是从源 prune 推定。

138当前包的增强静态 gate 已为exit0；后续重构建仍需重新运行，不能沿用137初版结果。静态 gate 可以证明所列包/产物入口与资源的存在性和结构以及已确认的 semver 物理copy要求；不能识别 bundled JavaScript 内联的全部运行行为，也不检查任意改名包的 package.json identity、原生 ABI/签名/CPU架构或包内容 hash。后者继续由生产依赖图、完整构建/运行协议、M7安装字节账及M8真实运行验证覆盖。本门明确保留这些边界，不把路径零残留或 header 读取当作全产品验收。
