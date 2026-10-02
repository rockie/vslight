# M7 生产依赖处置复核

本记录供集成人修改 manifests、locks 和生产 copy 配置。调查为只读；没有执行 npm install、重新生成 lock、构建、旧测试或 GUI。结论是当前文件图的处置建议，不代表最终生产闭包或安装包已经通过验收。

## 来源与边界

2026-10-01 调查源为主 agent 私有 `/tmp/lean-core-api-5_lg434f/vscode`，根 manifest 版本为 1.135.06566。调查时主 agent 正串行接入 M6/M7 补丁并删除专属路径，因此不能把这个可变目录当作固定提交。冻结证据在 `/tmp/deps-m7-vj9hutti`：root/remote/build 三组 manifests 与 locks、desktop gulp 文件、重点源码副本及 SHA-256。`hashes.json` 与 `source-evidence-hashes.json` 可核对具体 preimage；本记录不会覆盖主 agent 随后的变更。

根 manifest 有 57 dependencies、1 optionalDependency、105 devDependencies；remote 有 48 dependencies，无 optional/dev 项。M6 的 23 个初始父目录加七个追加项共 30 个候选，以 [M6-closure-inventory.md](M6-closure-inventory.md) 为授权依据；证据目录 `retired-parents.json` 明确只列这 30 项。另冻结调查时的 light prune 到 `prune-paths-at-review.json`，覆盖 Browser/API/terminal 专属叶及 build SDK/语音脚本。候选目录中尚存在的源码仍作为“待退休消费者”，不能记成普通保留消费者。

`focused-module-loads.json` 记录重点包的 import / require / nativeRequire / importAMDNodeModule 字面量及所属退休路径。该检索只辅助定位；split path、动态 URL、类型 import、构建工具和资产引用分别人工核对。早期宽泛的 `source-package-literals.json` 会包含 telemetry npm 名称和测试文字，不能据此证明运行消费者或删除包。未使用任何个人 profile、用户数据或签名秘密。

## 可删除的直接声明

以下删除以对应 runtime 父目录、构建/复制入口同时退休为前提。此表列的是 manifest key，不是让执行者手工删同名 node_modules 或 lock 节点。

| manifest 字段 | exact keys | 实际消费者与剩余入口 | 处置 |
|---|---|---|---|
| root dependencies | `@microsoft/mxc-sdk` | `src/vs/platform/sandbox/node/sandboxHelper.ts:112,160` 动态 import；sandbox engine 解析 MXC 可执行文件。普通 terminal/process 没有这个入边。desktop ASAR unpack 与 Darwin Mach-O 清单仍须由集成人同步收口。 | 删除 |
| root dependencies | `@vscode/sandbox-runtime` | `src/vs/platform/sandbox/common/terminalSandboxEngine.ts:629` 拼接独立 CLI 路径；MCP sandbox 也拼接同一路径，二者均退休。不是普通 shell/PTY。 | 删除 |
| root dependencies | `foundry-local-sdk` | `src/vs/platform/localTranscription/node/localTranscriptionService.ts:47–51,492` 类型与真实动态加载；Foundry native addon/install/下载链专属语音。 | 删除 |
| root dependencies | `ssh2` | `src/vs/platform/agentHost/node/sshRemoteAgentHostService.ts:1596` 是唯一源码 runtime load；其类型与测试同在 agentHost。另外三处类型 import 仅为该文件 :7、agentHost/test/node/sshHostKeyVerification.test.ts:7、sshRemoteAgentHostService.test.ts:20；完整重点模块检索没有普通或保留开发 consumer。没有普通 Git auth、通用 socket 或 retained terminal 使用它。 | 删除 |
| root dependencies | `playwright-core` | 当前生产声明固定 alpha 1.61.0；src 无保留 runtime load。普通消费者是下面的开发自动化类型及 browser install 工具。Browser/CDP API actor 已独立退休。 | 删除生产声明，保留开发能力 |
| remote dependencies | `@microsoft/mxc-sdk`, `@vscode/sandbox-runtime`, `ssh2`, `zod` | 前三对应上述退休后台；remote zod 无独立普通 runtime consumer。 | 删除四个 key |
| root devDependencies | `@anthropic-ai/claude-agent-sdk`, `@openai/codex`, `@types/ssh2` | 两个 SDK 的开发 override / E2E 测试驱动 消费者只在 agentHost；SDK package/upload/protocol-sync 构建目录已列专属 prune。SSH 类型 import 只在同一退休父目录。 | 专属源码/build 闭合后删除三个 key |

根 `zod` 不属于整包删除：将 dependencies 的 `zod: ^4.4.3` 移入 devDependencies，保持普通 fixture 的显式开发声明。普通 `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:10` 仍 import zod。没有 manifest key 或真实模块 load 叫 `zod4`；这里的根 zod 是 4.4.3，而 sandbox-runtime 嵌套 zod 是 3.25.76，必须分别记账。

AI SDK 名称未命中字面 import 并不意味着“没有消费者”：agentHost 通过 SDK 根目录、下载分发目录和子进程使用它们。应同时检查 package scripts、构建上传/下载入口、product SDK metadata 及平台 optional SDK 包的 lock 闭包，不能只凭 bare import 数量。

## 必须保留的共享包

| exact dependency / 字段 | 普通证据 | 处置依据 |
|---|---|---|
| root `chrome-remote-interface`; dev `@types/chrome-remote-interface` | `src/vs/base/node/profiling.ts:6,86`；`src/vs/platform/profiling/node/profilingService.ts:6` 与 window profiling 使用它。 | 保留 profiling 的 runtime 与类型。CRI 不是退休产品 Browser 的 Playwright。 |
| root/remote `node-pty` 与全部现有 `@xterm/*` | `src/vs/platform/terminal/node/terminalProcess.ts:22` 真实 spawn；普通 terminal/task 和 tabs 保留。 | 保留生产声明、原生 binaries 与 Windows worker/package.json unpack 规则。 |
| root/remote `@vscode/sqlite3` | `src/vs/base/parts/storage/node/storage.ts:13,330` 普通 profile/workspace storage。 | 保留；不能因 agent sessions 数据库退休删 SQLite。 |
| root/remote `@vscode/ripgrep-universal` | `src/vs/base/node/ripgrep.ts:9` 动态 load，普通文件搜索使用。 | 保留 rg 包及 bin unpack。 |
| root/remote `katex` | `src/vs/workbench/contrib/markdown/browser/markedKatexSupport.ts:134`；普通 Markdown renderer。 | 保留数学渲染及资源，Notebook renderer 退休不等于 Markdown math 退休。 |
| root/remote `@vscode/fs-copyfile` | `extensions/git/src/repository.ts:6`；`extensions/git/esbuild.mts:36` 将其 external，Git 自己 manifest 也声明依赖。 | 普通 Git 实际 consumer，保留。agentHostGitService 的退休 import 不是唯一用户。 |
| root/remote `tar` | 两份 lock 的 `@vscode/sqlite3 → tar ^7.5.4`；`build/lib/util.ts:18`、`build/lib/npmPackage.ts:11` 是普通构建用户。 | 至少保留生产传递闭包和开发可解析性；本轮保留直接声明，避免夹带无关依赖重排。 |
| root/remote `tas-client` | `src/vs/workbench/services/assignment/common/assignmentService.ts:421–422` 用 resolveAmdNodeModulePath 与动态 URL 加载普通 assignment 服务；platform assignment 也用其类型。 | 保留。该服务内部 Agents window 分支仍需源码解绑，不能把整个包当 AI SDK 删除。 |
| root/remote `@vscode/tree-sitter-wasm`, `@vscode/vscode-languagedetection` | 普通 editor tree-sitter library/tokenization 和 `src/vs/workbench/services/treeSitter/browser/treeSitterLibraryService.ts:38`；languageDetectionWebWorker 的 ModelOperations。 | 保留普通解析/语言识别，agent command auto-approver 退休不改变这些入边。 |
| root optional `windows-foreground-love` 与 dev 对应类型 | 普通 Electron main 的 Windows foreground/global keybinding 检测。 | 保留 optional 平台能力。没有 remote 对应声明。 |
| root dev `@playwright/test`, `@playwright/cli`、component-explorer 两个包 | `test/unit/browser/index.js:18`、`test/automation/src/playwrightDriver.ts:6`；普通 fixture explorer。 | 保留真实 Chromium unit runner、自动化和 fixture 开发工具。它们的传递 playwright-core / zod 仍应存在于 dev 闭包。 |

其余普通生产声明保持不动：watcher、icon/font、diff、编码、native-watchdog、代理、spdlog、设备标识、sudo/elevation、Windows registry/process/mutex/native-keymap、通用 HTTP/WebSocket/zip、TextMate/Oniguruma/regex 等不是本次专属包删除候选。node-addon-api 属于普通原生构建头依赖；codicons 属于资源，不能以 JS import 为零误删。根/remote 1DS 差异及 tslib/minimist 等既有布局不在本次迁移范围。本表是重点处置复核，没有宣称给所有未变更包完成全图可达性证明。

### semver 与 shell-quote 的边界

普通更新服务 `src/vs/platform/update/electron-main/abstractUpdateService.ts:25,704` bare import semver 并调用 compareBuild。当前根 manifest 却没有 semver 直接声明。现有 lock 的生产来源既有 MXC，也有 **kerberos → prebuild-install → node-abi → semver**；删 MXC 不一定会使 semver 从生产闭包消失，但普通运行消费者不应依赖碰巧存在的安装工具传递包。建议集成人增加显式 root dependencies semver 声明并在最终 lock/生产图验证解析版本；不是删除它。remote 没有 desktop update consumer，但其普通 kerberos 原生安装闭包仍需 semver。根 `@types/semver` 当前在 dependencies，本轮保留可解析性；若另作 dev 字段规范化，应单独验证类型编译而非连同 runtime 删除。

shell-quote 没有 src runtime import。现有 root lock 同时由 sandbox-runtime（生产）和 npm-run-all2（开发）引入；remote 只有 sandbox 生产父包。删除 sandbox 后，shell-quote 可从生产闭包退出，但根 dev 安装仍可能 hoist 它。不得按名字从 root node_modules、lock 或 dev graph 整包抹除。sandbox 的 @pondwader/socks5-server 和嵌套 commander/zod3 也应随真实生产闭包计算退出，不手工列传递包强删。

## ASAR 与 plain copy

`build/lib/dependencies.ts` 用 `npm ls --all --omit=dev --parseable` 求生产路径，并合并 可选的 .build/distro/npm 对应路径。desktop `build/gulpfile.vscode.ts:320` 打包这个闭包；remote `build/gulpfile.reh.ts:426` 求 remote 生产闭包后直接复制，不走同一 desktop ASAR。root node_modules 中仍存在某开发工具传递包，并不等于产品会打包它；反之，distro overlay 可能重新引入已删包，最终也必须检查。

需要从 desktop ASAR 规则删的 exact 专属项：

- unpack：`**/@microsoft/mxc-sdk/bin/**`。
- standalone sandbox duplicate copy：`node_modules/@vscode/sandbox-runtime/**`、`node_modules/@pondwader/socks5-server/**`、`node_modules/semver/**`、`node_modules/shell-quote/**`、`node_modules/zod/**` 以及解释 sandbox 独立 Node 无 ASAR hook 的注释。

删 duplicate 的 semver 规则只取消真实目录冗余副本，普通更新 runtime semver 仍应在生产 ASAR 中。保留已有 native `.node`、rg bin、node-pty conpty/worker/package.json、WASM 等普通规则。`vsda` 规则属此前独立策略，本轮不拿 sandbox 结论改写它。MXC Darwin/universal/native verify 清单和 Foundry install/SDK upload 脚本由 root/build worker同步收口；它们是待退休 copy/入口，不是普通消费者。

## 未决事项与集成后验证

| 项目 | 当前证据 / 待决问题 | 集成人动作 |
|---|---|---|
| dev playwright-core 直接声明 | `test/automation/src/playwrightDriver.ts:7` 类型 import 与 `build/azure-pipelines/common/installPlaywright.js:7` require 内部 server；root @playwright/test 1.61.1、browser-chromium 与 playwright 等 dev 父包仍带 playwright-core，且 CLI 存另一 alpha 版本。 | 删除生产 alpha 声明后，按实际 dev resolution 决定新增匹配 test 的直接 dev 声明或调整安装入口；不能以缓存/旧 node_modules 解析成功当锁正确。普通 automation 同时 bare import playwright，也应确认最终可解析。 |
| Notebook renderer dev 类型 | root `@types/vscode-notebook-renderer` 的 source consumer 在退休 Notebook；Markdown、math、Mermaid 各扩展还有自己的 Notebook renderer dev 类型声明。 | 等 root 的扩展 Notebook leaf/build metadata 处置落地，再决定 root 类型包去留。不能删整个普通 Markdown/Mermaid extension 或其未核对的 dev graph。 |
| test/mcp 开发工具 | 独立 `test/mcp/package.json` 的 @modelcontextprotocol/sdk 是自动化测试工具，多个普通 editor/SCM/window/evidence 工具用 zod；不是产品 MCP service 的直接证明。 | 开发工具是否一并退役由 root 明确；本记录不建议因产品 MCP 退休删整个测试工具或其 SDK。 |
| allowScripts | root Foundry install key 专属；ssh2/cpu-features 关联退休 SSH。koffi 等没有普通 bare import 不足以判断所有 native/optional 父包。 | 删直接包后按重算 lock 的 reverse parents 移除孤立规则；保留普通 native build 规则，不用原始包名列表机械批删。 |
| 构建包 dev 闭包 | build manifest 的 Azure/签名/打包工具是独立 package 与 lock，SDK upload/foundry/canary 叶正在退休。 | 以 build worker 的普通 signing/storage/symbol 消费者清单收口，不能根据 SDK 叶删除所有 @azure/*、@electron/* 等开发工具。 |
| assignment 源残留 | 调查时 assignmentService 仍有 isSessionsWindow / WindowKind.Agents 分支，已告知主 agent。 | 源码解绑此分支，保留普通 assignment/tas-client；最终全图由 root 验证。 |

root 修改后需要串行生成 locks，以干净私有安装求 root、remote、distro 生产图。确认 MXC/sandbox/Foundry/SSH/运行 Playwright/zod 生产根与专属传递包不再可达，同时 semver、CRI、PTY/sqlite/rg/katex/Git native helper仍可达。安装后的 dev graph 可以合理保留同名 playwright-core/zod/shell-quote/semver；不能把它们从 dev graph 也缺失作为验收条件。最后检查 node_modules.asar header、unpacked 和普通 node_modules copy，区分归档/副本避免字节双计。

本 worker 只冻结文件图及文档，没有运行上述安装/生产图/打包检查，也没有宣布 M7 通过。
