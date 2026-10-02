# M6 普通测试 helper 与 component fixtures 解绑

补丁：[128-light-retired-test-fixtures.patch](../../../patches/128-light-retired-test-fixtures.patch)。仅改四个公共测试文件，移除退休 Chat / MCP / Sessions 的 imports、mock 类与默认服务注册；普通认证、工作台和编辑器 helper 保留。补丁已在独立副本重放，四个文件逐字节一致。没有修改 prune、产品共享接口、生成源码或已安装 app，也没有运行 GUI。

基于 [M6-closure-inventory.md](M6-closure-inventory.md) 核对实际 imports；来源为 `/tmp/lean-core-api-5_lg434f/vscode` 当时的 prepared +114–125 私有源码。验证快照 `/tmp/tf-595nxpwt` 排除根 `out` / `out-build`，`node_modules` 仅 symlink 只读使用，transpile 产物写私有 `out`。后续 root 的 126 等并发修改不在这次全图检查中。

## 改动与普通行为保留

| sourcepath | 修改 | 保留 |
| --- | --- | --- |
| `src/vs/workbench/test/browser/workbenchTestServices.ts` | 去 ChatWidget / ChatEntitlement imports、默认 DI stub、`TestChatWidgetService` | 原 `workbenchInstantiationService` 签名，普通 editor / file / terminal / menu / layout 服务 |
| `src/vs/workbench/test/common/workbenchTestServices.ts` | 去 `TestChatEntitlementService`、Chat import 及仅该类使用的 Lazy / observableValue imports | 普通 workspace / lifecycle / storage / file 等 shared helper |
| `src/vs/workbench/services/authentication/test/browser/authenticationQueryServiceMocks.ts` | 去 `TestMcpUsageService` / `TestMcpAccessService` / `TestMcpService` 与三个 MCP imports | provider / session 构造、普通 usage / access / preferences / extensions / authentication helpers |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts` | 去 Phone / ChatPaste / Sessions agent feedback、editing、management、session、review、stats 的 imports 与注册 | 普通 editor / model / menu / action / trust / clipboard 服务；公共 helper 签名不变 |

全 `src` 的 named-import 消费者核对见 `/tmp/tf-595nxpwt/consumer-audit128.json`。三种 TestMcp 类没有 imported consumer。`TestChatWidgetService` 仅被退休 Chat 的 `src/vs/workbench/contrib/chat/test/browser/agentSessions/agentSessionViewModel.test.ts` 导入。`TestChatEntitlementService` 除此次公共 browser helper 外，消费者仅为退休 Chat 的 `src/vs/workbench/contrib/chat/test/browser/chatTipService.test.ts`、`src/vs/workbench/contrib/chat/test/browser/voiceClient/voiceSessionController.test.ts`、`src/vs/workbench/contrib/chat/test/common/chatService/chatService.test.ts`。其它同名局部 test class 没有被误当作此公共 helper 的消费者；没有删除普通混合测试文件。

## 交 root 写入 prune 的精确路径

以下专属 fixture 在私有快照中物理删除以验证闭包，不携入补丁。文件数来自来源快照：

| exact path | 文件数 |
| --- | --- |
| `src/vs/workbench/test/browser/componentFixtures/chat` | 21 |
| `src/vs/workbench/test/browser/componentFixtures/sessions` | 20 |
| `src/vs/workbench/test/browser/componentFixtures/agentsVoice` | 1 |
| `src/vs/workbench/test/browser/componentFixtures/aiStats.fixture.ts` | 1 |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts` | 1 |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts` | 1 |

当前 componentFixtures 子树没有 Notebook / Debug 专属目录或文件可额外列入。保留 `src/vs/workbench/test/browser/componentFixtures/editor/inlineCompletions/other.fixture.ts`、`src/vs/workbench/test/browser/componentFixtures/editor/inlineCompletions/views.fixture.ts`、imageCarousel fixtures；它们属于普通编辑器或普通图像组件。删除以上路径后的保留 componentFixtures imports 扫描，没有直接指向退休 Chat / InlineChat / Sessions / Notebook / Debug / AgentsVoice 模块的入边。

component-explorer 通过 后缀为 .fixture.ts 的文件 发现注册（配置在 `test/componentFixtures/component-explorer.json`），子树没有必须同步修改的显式全量注册 barrel。专属 Sessions 中仍有四个 import 所有者，交父目录 retirement 处理：

- `src/vs/sessions/contrib/agentFeedback/test/browser/agentFeedbackEditorWidget.fixture.ts` → `'componentFixtures/sessions/mockCodeReviewService.js'`。
- `src/vs/sessions/contrib/chat/test/browser/chatInput.fixture.ts` → `'componentFixtures/chat/renderChatInput.js'`。
- `src/vs/sessions/contrib/chat/test/browser/newChatInput.fixture.ts` → `'componentFixtures/chat/chatFixtureUtils.js'`。
- `src/vs/sessions/contrib/chat/test/browser/newChatWidget.fixture.ts` → `'componentFixtures/chat/chatFixtureUtils.js'`。

## 实际验证与未完成边界

所有以下命令 cwd 为 `/tmp/tf-595nxpwt`，不写基线源码、out 或 node_modules。

| 实际命令 | 结果 / 日志 |
| --- | --- |
| `node build/next/index.ts transpile` | exit 0；`transpile128.log` |
| `node helper-load128.mjs` | exit 0；`helper-load128.log`。真实加载普通 auth mocks，用 Node module resolve hook 阻止退休模块导入，构造/销毁五种普通服务并检查 provider/session helper；未重跑已绿 auth 39 suite |
| `node test/unit/browser/index.js --browser chromium --run out/vs/workbench/test/browser/helperLoad128.test.js` | exit 0，1 passing；`helper-assert128.log`。真实动态导入公共 common/browser helper，检查普通 exports、退休 exports 消失，并构造/销毁 `workbenchInstantiationService` 服务图 |
| `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit` | exit 1，215 个诊断；`tsc128.log`。四个修改文件均 0 诊断，不能声称全图类型检查通过 |

两个私有验证脚本只存在快照的 `helper-load128.mjs` 与 `out/vs/workbench/test/browser/helperLoad128.test.js`，不进入 patch。后者把 import 放在 Mocha test 内，确保加载失败实际报红，避免 runner 吞掉顶层 import 错误产生假绿。

component fixture 公共模块的真实运行仍待 component-explorer 环境验证：直接运行上游 Chromium unit runner 导入 `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts`，日志 `component-helper-load128.log` 出现 `BAD ...fixtureUtils{}`，但进程 exit 0、0 passing。原因已用私有动态 import diagnostic 捕获：`Failed to resolve module specifier "@vscode/component-explorer"`（`component-diagnostic128.log`）。`test/unit/browser/renderer.html` 的 import map 不含该 bare package，`loadModules` 在失败时 resolve `{}`。诊断本身 1 passing 仅证明捕获到环境限制，不代表普通 component fixtures 加载通过。此处没有改 runner、添加假 package 或 mock 产品服务来掩盖失败。

全图 215 个诊断主要来自尚待退休的 Chat / Sessions / MCP 与旧认证消费者。普通路径的剩余协同边界准确如下，未越界修改：

- `src/vs/workbench/contrib/comments/browser/simpleCommentEditor.ts`、`src/vs/workbench/contrib/scm/browser/scmInput.ts` 仍 import 已裁 dictation；root 的 126 正处理。
- `src/vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint.ts` 有旧参数数目错误；Notebook 属于计划退休族。
- 删除公共 Chat helper 后，退休 Chat 的上述 imported consumers 报缺少 export；由 root 删除退休父目录闭合，不恢复空 adapter。

补丁 SHA-256：`9b346d6f4b7cc16ef023f30abe5d3f751d3ee818dd6af2fd4a6e3cf08f824931`。独立重放目录 `/tmp/tp128-f0x_hpn1`：`git apply --check` 与 `git apply` 均 exit 0，四个结果文件与验证快照逐字节一致（`replay128.json`）。最终完整编译、component-explorer 实际运行与 app 验收由 root 集成后完成；本记录不声称这些已通过。
