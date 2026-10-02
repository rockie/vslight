# M7 Azure 专属运行时构建任务闭包候选

- 计划：[lean-core.md](../lean-core.md) R-6、§5.6/5.7、M7 / V8；前置 [M6-closure-inventory.md](M6-closure-inventory.md)。
- 源码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，prepared +114；输入 `/tmp/lean-core-api-5_lg434f/vscode` 在 127 已集成后、父任务分配 133 时的当前源码。其余 workers 后续修改不写入冻结 preimage。不修改用户生成 `vscode/`。
- 私有源：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m7-build-tasks-7a95h4t9/source`。只复制 `build/azure-pipelines/`、`build/agent-sdk/`、`build/dictation-runtime/`，冻结 Git HEAD `d83f100`；没有复制或修改 node_modules，解析器从既有基线只读加载。这个 HEAD 是本地 preimage 锚点，不是产品源码提交。
- 交付：[133-light-retired-runtime-build-tasks.patch](../../../patches/133-light-retired-runtime-build-tasks.patch)，25 files，10 additions / 417 deletions；SHA256 `6e4828d56db6e6684e1149decdf4acdebf43d4d711b65fe3fd374b61cf696f49`。没有整文件删除 hunks，整专属资源交由主集成 prune。
- 状态：候选静态验证与 clean replay 完成，主集成当前源码 apply-check 为 0。不是 M7 完整验收、生产图减重或真实 CI 通过。

## 实际解绑范围

普通平台编译、依赖缓存、npm authentication、builtin extensions、CLI artifact 等待、CG NOTICE、签名和 release 步骤保留。专属模板中的认证/编译/上传随专属模板退休；不是把所有名称相似的 npm、license 或 AzureCLI 步骤删除。

| 事实入口（相对 `build/azure-pipelines/`） | 133 的具体处理 |
| --- | --- |
| `win32/steps/product-build-win32-compile.yml`、`darwin/steps/product-build-darwin-compile.yml`、`linux/steps/product-build-linux-compile.yml` | 撤 `agent-sdk-produce`、`dictation-runtime-produce`、Foundry prepare/install 与禁安装调用、SDK canary override、AI native optional 校验、Copilot VSIX detach/attach、CAPI mixin。删除只剩退休子项的 Azure conditional wrapper；没有空 wrapper。 |
| `alpine/product-build-alpine.yml` | 撤 SDK produce、Foundry prepare/install、AI native 校验、Copilot detach/attach、CAPI。原树没有 Alpine dictation producer，不新增替代。 |
| `web/product-build-web.yml` | 撤 Foundry prepare/install、AI native 校验、Copilot detach/attach、CAPI；保留普通 Web 编译及发布。原树没有 Web SDK/dictation producer。 |
| `win32/product-build-win32-node-modules.yml`、`darwin/product-build-darwin-node-modules.yml`、`linux/product-build-linux-node-modules.yml`、`alpine/product-build-alpine-node-modules.yml`、`web/product-build-web-node-modules.yml` | 撤 SDK canary template、Foundry prepare/install、AI native 校验；原 npm registry/auth/ci、普通缓存键/缓存归档保留。 |
| `product-quality-checks.yml` | 撤 Foundry prepare/install、AI native 校验、CAPI mixin。普通 dependency install、compile、policy、distro/npm 与质量步骤保留。 |
| `win32/sdl-scan-win32.yml` | 撤 Foundry prepare/install 与 CAPI mixin；保留普通 SDL/source 扫描流程。 |
| `win32/product-build-win32.yml`、`darwin/product-build-darwin.yml`、`linux/product-build-linux.yml`、`alpine/product-build-alpine.yml` | 精确撤 `.build/agent-sdk/tarballs` 对应四个 pipelineArtifact output；普通 signed/unsigned/client/server/web outputs 保留。SDK 和 dictation 的独占 CDN 上传位于各 produce/upload 闭包，整资源 prune。 |
| `product-build.yml` | 撤 `VSCODE_SDK_CANARY_VERSION` / `VSCODE_CLI_CANARY_VERSION` 参数及对应归一化变量；撤 Copilot stage、CAPI repository resource 和 SDL exclude 引用。普通 artifact sanity 参数及发布/平台 stage 保留。 |
| `product-build-template.yml` | 撤单独 Copilot stage；普通 QualityChecks 和所有普通平台 jobs 保留。 |
| `product-smoke-flaky.yml` | 撤单独 Copilot stage、CAPI resource/SDL 引用。Linux/Windows/macOS 三个 stage 的 `dependsOn: Copilot` 改 `[]`，产物门禁改 `not(canceled())`，保留取消行为与普通 smoke 编译/执行。 |
| 三平台 `product-smoke-flaky-*.yml` | 仅撤 compile-template 的 `VSCODE_SKIP_FOUNDRY_LOCAL_INSTALL: true` caller 参数，compile 三模板的同名声明同步删除。 |
| 三平台 `steps/product-build-*-test.yml` | 仅撤 `copilot/test-integration-steps.yml` 及其独占 conditional wrapper；普通 Electron/Browser/remote suites、PublishTestResults 保留。Linux的 TMPDIR 行为与工作卷保留。 |
| `oss/scan-licenses.ts` | 只修注释里的已退休 `build/agent-sdk/common.ts` source-of-truth 链接。扫描器函数、generic native optional 平台/架构枚举、registry/license fallback 和测试都保留。 |

跨平台实数：SDK producer 4 calls，dictation producer 3 calls，Foundry phase 24 calls，canary 8 calls，CAPI 7 calls，Copilot download start/join 各 5 calls，Copilot 普通宿主集成测试模板 3 calls，Copilot stage 3 个 parents。计数来自 frozen preimage 的 YAML 数据节点，不是对注释做字符串计数。

## `checkNativeOptionalDeps` 的实际所有者

`common/checkNativeOptionalDeps.ts` 的 `findMissingNativeOptionalDep(nodeModulesDir, basePackage, target)` 是可复用函数形状，但全源码唯一导出消费是 `build/agent-sdk/package.ts:39,98`。CLI 的 `NATIVE_OPTIONAL_DEP_BASE_PACKAGES` 仅有 `@openai/codex` 和 `@anthropic-ai/claude-agent-sdk`。因此该文件实际闭包属于退休 AI SDK，不是普通库的通用依赖校验入口。

- 133 撤 11 个普通 Azure parents 中的 CLI calls；第 12 个 call 位于整退休 `copilot/setup-steps.yml`。
- `.github/workflows/pr-node-modules.yml` 的 3 个 calls 归 root134；交付时读取当前共享源，已经没有该函数/脚本引用。133 不重复改这些 workflow。
- root134 同时拥有 `pr-linux-test.yml` 的 AI musl cleanup、`pr.yml` Codex protocol CI 和根 package.json 的两个 Codex scripts；当前共享源的上述 workflow 专属引用检索为空，package.json 的 scripts 中无 Codex 项；生产 Codex/Claude dependencies 在该时点仍由主集成人统一清理，不能把 script 删除说成生产图已绿。这里按所有权交接关闭 134 的命令/CI 行，不列为 133 缺口。
- 普通 `npm ci`、node_modules cache、license/native 扫描、`oss/platform-binary.test.ts` 保留。后者的 Copilot package 名是 generic optional-package parsing 测试样本，不是安装/运行消费者；不机械删除测试样本。

## 精确 prune 清单

下列 **15 个无父子重叠的 exact roots** 由主集成人合并到正式 manifest。冻结源展开为 **32 文件 / 202596 字节源码**；这不是已安装资源、asar 或产物减重账。133 没有删除这些文件，候选仅解绑其保留消费者。

```text
build/agent-sdk
build/dictation-runtime
build/azure-pipelines/copilot
build/azure-pipelines/product-copilot.yml
build/azure-pipelines/product-copilot-recovery.yml
build/azure-pipelines/common/agent-sdk-produce.yml
build/azure-pipelines/common/dictation-runtime-produce.yml
build/azure-pipelines/common/foundry-local.yml
build/azure-pipelines/common/apply-sdk-canary.yml
build/azure-pipelines/common/apply-sdk-canary-override.ts
build/azure-pipelines/common/foundryLocalInstall.ts
build/azure-pipelines/common/disableFoundryLocalInstall.ts
build/azure-pipelines/common/checkNativeOptionalDeps.ts
build/azure-pipelines/common/downloadCopilotVsix.ts
build/azure-pipelines/common/mixin-vscode-capi.yml
```

| prune roots | 删除理由 / 闭包 |
| --- | --- |
| `build/agent-sdk` | Codex/Claude scratch package install、version sync、platform tarball produce/upload；普通程序编译不引用其中函数。包含两 agents 的独占 manifests/locks，不能误当根 lock。 |
| `build/dictation-runtime` | Foundry NuGet artifact download、打包/上传、目标平台 metadata，只服务退休听写 runtime。 |
| `build/azure-pipelines/copilot`、`product-copilot.yml`、`product-copilot-recovery.yml` | Copilot extension checkout/build/test/l10n/notices/VSIX/recovery release 专属生产闭包；所有普通 pipeline caller 已解绑。专属 notices task 随专属 job 退休，普通 notice task 保留。 |
| `common/agent-sdk-produce.yml`、`dictation-runtime-produce.yml` | 专属 producer、其 scratch npm/feed auth 与产物上传；普通 npm auth 不位于这两个模板。 |
| `common/foundry-local.yml`、`foundryLocalInstall.ts`、`disableFoundryLocalInstall.ts` | 修改 `foundry-local-sdk` 安装流程、调用 dictation NuGet 下载；无保留生产消费者。 |
| `common/apply-sdk-canary.yml`、`apply-sdk-canary-override.ts` | Copilot SDK/CLI 私有 feed override、专属 token/auth、lock 重写；普通 registry/auth 与 cache key 保留。 |
| `common/downloadCopilotVsix.ts`、`mixin-vscode-capi.yml` | 下载 Copilot 专属 VSIX、CAPI 私有 checkout/npm/mixin；不包含普通编译任务。 |
| `common/checkNativeOptionalDeps.ts` | 实际只校验 Codex/Claude，导出消费只在整退休 SDK producer，详见上节。 |

32 个 exact files 的展开（用于核对，不把此清单与上面 parent roots 同时加入 prune）：

```text
build/agent-sdk/README.md
build/agent-sdk/agents/claude/package-lock.json
build/agent-sdk/agents/claude/package.json
build/agent-sdk/agents/codex/package-lock.json
build/agent-sdk/agents/codex/package.json
build/agent-sdk/common.ts
build/agent-sdk/package.ts
build/agent-sdk/produce.ts
build/agent-sdk/test/versionSync.test.ts
build/agent-sdk/upload.ts
build/azure-pipelines/common/agent-sdk-produce.yml
build/azure-pipelines/common/apply-sdk-canary-override.ts
build/azure-pipelines/common/apply-sdk-canary.yml
build/azure-pipelines/common/checkNativeOptionalDeps.ts
build/azure-pipelines/common/dictation-runtime-produce.yml
build/azure-pipelines/common/disableFoundryLocalInstall.ts
build/azure-pipelines/common/downloadCopilotVsix.ts
build/azure-pipelines/common/foundry-local.yml
build/azure-pipelines/common/foundryLocalInstall.ts
build/azure-pipelines/common/mixin-vscode-capi.yml
build/azure-pipelines/copilot/build-steps.yml
build/azure-pipelines/copilot/l10n-steps.yml
build/azure-pipelines/copilot/setup-steps.yml
build/azure-pipelines/copilot/test-integration-steps.yml
build/azure-pipelines/copilot/test-steps.yml
build/azure-pipelines/product-copilot-recovery.yml
build/azure-pipelines/product-copilot.yml
build/dictation-runtime/common.ts
build/dictation-runtime/nuget.ts
build/dictation-runtime/package.ts
build/dictation-runtime/produce.ts
build/dictation-runtime/upload.ts
```

## 变更 sourcepath

全部修改在授权 `build/azure-pipelines/**` 中；未修改 root product/prepare/prune/lock/plan、build/npm、其他 build 文件、GitHub workflows 或共享生成树。

```text
build/azure-pipelines/alpine/product-build-alpine-node-modules.yml
build/azure-pipelines/alpine/product-build-alpine.yml
build/azure-pipelines/darwin/product-build-darwin-node-modules.yml
build/azure-pipelines/darwin/product-build-darwin.yml
build/azure-pipelines/darwin/product-smoke-flaky-darwin.yml
build/azure-pipelines/darwin/steps/product-build-darwin-compile.yml
build/azure-pipelines/darwin/steps/product-build-darwin-test.yml
build/azure-pipelines/linux/product-build-linux-node-modules.yml
build/azure-pipelines/linux/product-build-linux.yml
build/azure-pipelines/linux/product-smoke-flaky-linux.yml
build/azure-pipelines/linux/steps/product-build-linux-compile.yml
build/azure-pipelines/linux/steps/product-build-linux-test.yml
build/azure-pipelines/oss/scan-licenses.ts
build/azure-pipelines/product-build-template.yml
build/azure-pipelines/product-build.yml
build/azure-pipelines/product-quality-checks.yml
build/azure-pipelines/product-smoke-flaky.yml
build/azure-pipelines/web/product-build-web-node-modules.yml
build/azure-pipelines/web/product-build-web.yml
build/azure-pipelines/win32/product-build-win32-node-modules.yml
build/azure-pipelines/win32/product-build-win32.yml
build/azure-pipelines/win32/product-smoke-flaky-win32.yml
build/azure-pipelines/win32/sdl-scan-win32.yml
build/azure-pipelines/win32/steps/product-build-win32-compile.yml
build/azure-pipelines/win32/steps/product-build-win32-test.yml
```

## 静态验证与 clean replay

验证只用冻结本地源及既有 `js-yaml` / TypeScript parser；不运行网络、npm install、真实 AzureCI、GUI、既有已绿 suites或完整编译。

| 检查 | 实际结果及界限 |
| --- | --- |
| preimage 全部 Azure YAML parse | 63 文件解析成功；Azure `${ ... }` keys 按 YAML scalar 处理，不声称 Azure 服务已做 schema/expression 编译。 |
| retained YAML semantic equality | 排除 12 个专属 YAML 后，51 文件的 AST 逐项等于 preimage **只删除专属任务/空退休 wrapper、同名 retired 参数/CAPI声明并替换3 smoke gates** 的预期 AST。140 个保留 `task` 对象及普通 script/env/condition/output 内容无额外修改。 |
| local template closure | 267 个 literal local `@self` / relative templates 全部有文件，无 retained→prune template 入边。4 个 external repository template 引用保留；未联网展开/验证 external 服务。无 dynamic template path。 |
| retained TS syntax | 所有该 scope 的保留 TypeScript parser diagnostics 0；不等同完整 TS 类型编译。 |
| 当前主集成 source apply-check | `git apply --check patches/133-light-retired-runtime-build-tasks.patch` 在 `/tmp/lean-core-api-5_lg434f/vscode` exit 0；无写入。 |
| 冻结源 clean replay | replay `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m7-clean-replay-9o93kwhx`：apply-check 0、apply 0、diff-check 0、reverse-apply-check 0，replay diff 与候选 diff 逐字节相同。 |
| retained retirement-string 调查 | 只剩普通 NOTICE downloader 的历史 harness 注释、license 扫描的 generic optional-package 示例/注释、generic parsing 测试样本、Linux TMPDIR 历史例子。没有 runtime import/template/script/产物门禁；未把注释/通用测试误当退休依赖。 |

本地临时证据：`/tmp/m7-transform-results.json`（90 个 maximal 专属删除节点），`/tmp/m7-validation.json`（AST/template/TS/prune清单），`/tmp/m7-replay-results.json`（replay全部exitcode），`/tmp/m7-retained-matches.txt`（保留字符串逐行）。临时验证脚本 `/tmp/m7-transform.cjs` 与 `/tmp/m7-validate.cjs` 只在私有源操作，不是产品新增构建入口。

## 主集成仍需完成

133 只完成 Azure 专属任务候选。主集成人还需正式接入 patch+15 roots，与 130 的 build/postinstall 清理及 134 workflows 串行合并；检查完整生产 manifests/locks、普通 copy/native/license 闭包，运行 M7/V8 要求的全图类型编译、干净重放、产物与安装字节账、prune故障注入和当步 smoke。外部 Azure模板真实 schema/执行和 CI没有在本任务验证，不将这些静态结果替代 M7/M8 验收。

`VSCODE_PUBLISH_COUNTER*` 在普通 product-build、product-build-variables 和 smoke 文件仍保留。当前本地树找不到实际 reader，但 external distro/release tooling 是否读取不能由只读本地扫描否定；因此不把这两个一般计数变量纳入专属任务 prune。此保留不重新启用 Copilot stage、VSIX download 或 SDK override。
