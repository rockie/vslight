# M6 普通生产消费者解绑（129）

日期：2026-10-01。状态：候选补丁和同前置重放完成；不是 M6 完整构建或 GUI 验收通过。

## 基线与隔离

- Root HEAD：`f1961b7546139a6aa722ff0b8a001296d3041e33`；用户生成树 vscode HEAD：`08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。
- Preimage：主私有 `/tmp/lean-core-api-5_lg434f/vscode` 的完整 prepared +114–126 候选源码，含完整121和6个已改配置schema文件。复制前置在私有 Git 中冻结为 `9a3140ffd6add95816ffbfd37e681846e4ed61a7`，只追踪 src。源码属于 prepared 生成态，不是干净 upstream checkout。
- 实施树：`/tmp/lean-core-m6-consumers-lbzi04pa/source`。`rsync` 仅以根锚定 `/out*/` 排除输出，保留普通 `outlineModel.ts`；根/build 的 node_modules 只读 symlink。未写用户 vscode、现有 app 或共享 generated source。
- 类型审计另合入127、128、130、131、132、134；这些文件不属于129导出。私有树按退休父目录和129叶清单实际删除源码以检查普通入边。127专属 actors/tests 未在本树完整删除，下面按退休域记录其诊断。
- 补丁：`patches/129-light-retired-background-consumers.patch`，118 files（112修改、6新增），560712 bytes；SHA-256 `c88dd55c59801dbea8fa02d4795cbb8deff89e62a00f91e8f284fa11d015fc5d`。补丁没有整文件删除、生成bundle、Null服务、any新增兼容层或tsconfig排除。

## 切口与保留边界

| 普通所有者 / 符号 | 最终动作与原因 | 保留与验证 |
| --- | --- | --- |
| `contrib/search/browser/searchTreeModel/{searchModel,searchResult,folderMatch,fileMatch,textSearchHeading,searchTreeCommon}.ts` | 去 AI heading/query/provider、Notebook widget绑定和cell结果包装，普通file match使用`FileMatchImpl`；SearchResult只有plain heading。进度添加保留正常change事件，批量替换/删除仍保留父子去重与事件合并。 | text/file query、取消、新搜索、排序、replace、普通model高亮保留；共享测试只删Notebook专属案例并迁普通file模型。 |
| `searchWidget.ts`、`searchView.ts`、search actions/renderers及`contrib/searchEditor/browser/*` | 普通输入复用`ContextScopedFindInput`，去Notebook filters、AI按钮/自动请求/关键词及两项AI配置注册；搜索编辑器只序列化文本结果。 | 旧搜索编辑器Notebook标记作为可选纯数据读取，未传回runtime；普通regex、replace、历史、搜索编辑器保留。 |
| `api/browser/mainThreadSearch.ts`、`api/common/extHostSearch.ts`、`services/search/common/textSearchManager.ts` | 经root明确扩权，仅去AI maps/register/name/results/keyword RPC分支，shared manager只调用普通TextSearchProvider。node子类实际没有AI分支，无需改。 | 普通Search actor IDs/assert、旧/新file/text注册、eager初始化全部保留；`searchExtTypes.AISearchKeyword`稳定纯构造保留。132负责4个wire methods。 |
| `bulkEditService.ts`、`conflicts.ts`、`replaceService.ts`、`customEditorInputFactory.ts` | 去NotebookCell edit lift/apply/conflict与Notebook working copy特殊分支；不伪装成功，未知edit仍既有不支持路径。 | text/file/opaque edit、undo/preview/save及普通custom editor保留。 |
| `remote/browser/urlFinder.ts`、`remoteExplorer.ts`、`viewQuickAccess.ts` | 去Debug REPL/session listeners/DI及Debug console pick。UrlFinder只监听已有/新增/销毁terminal。 | ANSI去除、chunk积累、500ms debounce、高吞吐阈值、localhost端口检测和dispose保留。 |
| `workbench/common/notebookUri.ts`、`fileBasedRecommendations.ts`、`browser/labels.ts` | CellUri/metadata/output URI编码解析迁纯模块，依赖仅base buffer/network/URI；标签去NotebookDocumentService DI。 | 普通推荐读取URI与普通资源标签保留；不保留NotebookDocumentService或整个notebookCommon实现。 |
| `testing/browser/callStackWidget.ts`、`testStackDecorations.ts`、两个CSS及`testResultsViewContent.ts` | Debug call stack UI原实现迁到普通Testing；仅迁纯颜色注册/stack decoration options，不迁Debug editor contribution或服务。Testing Chat tool注册退役。 | 普通测试错误栈呈现保留；Comments NotebookRange由127负责，129未改这7个文件。 |
| `extensions/electron-browser/debugExtensionHostAction.ts`、`extensions.contribution.ts` | 去Debug新窗口启动/attach动作及debug lifecycle contribution。 | `DebugExtensionHostInDevToolsAction`保留；普通扩展生命周期、Node inspect/CRI/profile保留。130把必要debug bridge clients原样迁extensions。 |
| `accountPolicyService.ts`、`accounts/browser/defaultAccount.ts`、`developerActions.ts` | AccountPolicy仅实现普通IPolicyService，直接从账户数据计算普通value callbacks；去AI managed DI/三通道合并/gate。DefaultAccount去managed请求、兼容错误/遥测及MCP registry请求，developer报告去这些专属章节。 | 普通Git auth sessions、provider/account metadata、token纯元数据、缓存和普通policy update/change事件保留。130的双参ctor/普通policyChannel对齐。 |
| `assignmentFilters.ts`、`assignmentService.ts` | 去Chat entitlement订阅与GitHubCore AI组织/tracking过滤器；普通TAS provider窗口为`WindowKind.Editor`。 | 第三方扩展版本与ICopilotTokenInfo纯元数据过滤器保留，不机械删除名为Copilot的普通metadata。 |
| `editSourceTrackingFeature.ts`、`editSourceTrackingImpl.ts`、`arcTelemetrySender.ts` | 去AgentHostEditMarkerService创建/flush/commit与Chat/InlineChat ARC caller/reporter；generic correlation接口迁`externalEditCorrelation.ts`纯类型。 | 普通本地文档编辑统计、Git/SCM、inline edit ARC保留。`IAiEditTelemetryService`真实被普通`MainThreadLanguageFeatures`使用，只生成UUID/遥测，保留本地实现/DI；没有Chat/LM/host provider。 |
| `services/environment/*`、host producers、`extHostTelemetry.ts`及Sessions window普通消费者 | 去已退休window flag与Agents窗口行为；ordinary enablement/theme/view/SCM/tasks/terminal/storage/configuration/issue/survey/trust均采用其原普通窗口分支。 | 普通扩展host initData其他字段、debug bridge不变；extensionHostProtocol flag由134删。Issue picker不再提供Agents Window。纯context/enum/旧metadata不按字符串清零。 |
| `welcomeGettingStarted/common/gettingStartedContent.ts`、profile init/editor/import-export | 去Notebook onboarding和MCP资源初始化/树/apply，profile去已删agentPluginsHome复制。 | 普通欢迎、设置/任务/snippets/extensions/global state profile行为保留。旧资源纯字段不通服务；专属叶列下表。 |
| accessibility signals / inline completion language status / workspace trust / titlebar | 去Debug breakpoint signal、Chat entitlement/gate、Agent host URI trust exception和Chat progress订阅。 | 普通markers/folding/accessibility、第三方inline completion状态、普通update indicator与资源trust保留。 |

Root共享面除明确授权Search actors及extHostTelemetry外均未导入129。4个wire方法为`MainThreadSearchShape.$registerAITextSearchProvider/$handleKeywordResult`和`ExtHostSearchShape.$provideAITextSearchResults/$getAIName`，132已删除；普通file/text方法保留。

## 检查证据

| 检查 | 命令 / 结果 |
| --- | --- |
| 同前置重放 | 在`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m6-129-replay-pjrtebgi`恢复112 preimage文件；`git apply --check` exit0，实际apply exit0，118个postimage与私有源码逐字节相同。`/tmp/lean-m6-replay-result.json`。 |
| 差异完整性 | `git diff --check -- <118 assigned paths>` exit0；只有源码/CSS变化，没有bundle。 |
| 受影响共享suite | `node /tmp/lean-m6-tests.mjs`，实际生产模块经esbuild转译，Mocha TDD跑UrlFinder 5项与DocumentEditSourceTracker 8项，**13 passing**。记录`/tmp/lean-m6-tests.log`，SHA `e304cf82117bb9609dd54aaf5a9a721bafef476cd0f0efbfbfcf39b71161541f`。 |
| 实际普通Search/Policy/URI | `node /tmp/lean-m6-headless.mjs` exit0。实际ExtHostSearch text provider注册/重复拒绝/results/dispose/重注册；AccountPolicy更新/账户移除；两种URI scheme ×3 handles往返；**90 inputs，0退休runtime输入**。RPC边界只记录普通wire调用，没有Null服务。日志`/tmp/lean-m6-headless.log`，SHA `36a812fc8a07058d4ee15795b16b01af9ec872000da342e56cadee1286a482e1`。 |
| Search GUI相关共享suite | 单独尝试searchModel/searchResult/searchActions/searchViewlet实际测试模块；Node加载SearchActions的浏览器依赖时`ReferenceError: window is not defined`，**没有计通过**。未造DOM或重复运行已绿旧suite；交root真实browser harness执行。`/tmp/lean-m6-search-tests.log`。 |
| 全src native TS | `node_modules/@typescript/native/bin/tsc --noEmit -p src/tsconfig.json --pretty false`，exit1；最终 **281 diagnostics，129文件0 diagnostics**。`/tmp/lean-m6-acceptance-tsc.log`，SHA `cfd21509d5149419cfd5f8f74e254738df85896875d1df040bb1ffac96aa04b2`。见下节，不能报完整TS绿。 |
| 全generated源码入边 | `node /tmp/lean-m6-import-audit.cjs` 用TS preProcessFile读全部src `.ts`，覆盖relative from/side-effect/dynamic import；按30父目录、已有manifest、129叶与退休API叶区分owner。**普通生产入边0**；剩余3测试owners/4edges如下。`/tmp/lean-m6-final-inbound.json`，SHA `12d01280f1f24e5de6ebed53b39339058c6575effbc8477d804f0e064ba92263`。 |

## 未关闭的集成门

- 全TS的271项属于退休Notebook/Debug/Interactive actors或专属API测试，等待root完整精确prune，不是普通语言/auth/tab故障。只读完整计数在`/tmp/lean-m6-diagnostic-counts.json`。
- 其余10项：普通editor test helper `editor/contrib/inlineCompletions/test/browser/utils.ts:298`的旧managed成员1；`platform/remoteTunnel/test/node/remoteTunnelService.test.ts:20`旧AgentHostSharing类型1；专属platform customEndpointTelemetry两个实现3；普通platform workspaces测试旧ctor第6参1；专属`workbench/test/browser/aiCustomizationManagementSectionRegistry.test.ts`2；两个普通editor component fixtures旧NotebookDocumentService DI各1。131/133/root已有协调，129不越边写这些文件。
- 静态4剩余edges：editorTabBar.fixture.ts与multiDiffEditor.fixture.ts各1，aiCustomizationManagementSectionRegistry.test.ts的2。前两须保留普通fixture、去Notebook DI；后者专属叶须精确prune。
- 真实Search/Testing/Issue/旧profile GUI和完整生产构建由root集成后执行；本记录没有预填通过，也没有GUI操作。

## 精确专属叶清单

此27项供root加入持久prune manifest并规范化父/子覆盖，不包含补丁整文件删除。普通Search actors、普通LanguageFeatures/Languages、Webview、Git/auth/tasks/CRI与整体tunnel目录不在清单。

- `src/vs/workbench/contrib/search/browser/AISearch`
- `src/vs/workbench/contrib/search/browser/notebookSearch`
- `src/vs/workbench/contrib/search/browser/searchFindInput.ts`
- `src/vs/workbench/contrib/search/common/notebookSearch.ts`
- `src/vs/workbench/contrib/search/test/browser/searchNotebookHelpers.test.ts`
- `src/vs/workbench/contrib/bulkEdit/browser/bulkCellEdits.ts`
- `src/vs/workbench/contrib/bulkEdit/test/browser/bulkCellEdits.test.ts`
- `src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignalDebuggerContribution.ts`
- `src/vs/workbench/contrib/replNotebook`
- `src/vs/workbench/contrib/remoteCodingAgents`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts`
- `src/vs/workbench/contrib/testing/common/testingChatAgentTool.ts`
- `src/vs/workbench/services/localTranscription`
- `src/vs/workbench/services/notebook`
- `src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts`
- `src/vs/workbench/services/policies/browser/accountPolicyGate.contribution.ts`
- `src/vs/workbench/services/policies/test/browser/accountPolicyGateContribution.test.ts`
- `src/vs/workbench/services/accounts/browser/managedSettings.ts`
- `src/vs/workbench/services/accounts/test/browser/managedSettings.test.ts`
- `src/vs/workbench/services/accounts/test/browser/defaultAccount.test.ts`
- `src/vs/workbench/services/userDataProfile/browser/mcpProfileResource.ts`
- `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts`
- `src/vs/workbench/contrib/testing/test/common/testingChatAgentTool.test.ts`
- `src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts`
- `src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts`
- `src/vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile.ts`
- `src/vs/workbench/contrib/welcomeGettingStarted/common/media/notebookThemes`

## 129补丁文件全集

- `src/vs/workbench/api/browser/mainThreadSearch.ts`
- `src/vs/workbench/api/common/extHostSearch.ts`
- `src/vs/workbench/api/common/extHostTelemetry.ts`
- `src/vs/workbench/browser/actions/developerActions.ts`
- `src/vs/workbench/browser/actions/quickAccessActions.ts`
- `src/vs/workbench/browser/contextkeys.ts`
- `src/vs/workbench/browser/labels.ts`
- `src/vs/workbench/browser/layout.ts`
- `src/vs/workbench/browser/parts/titlebar/commandCenterControl.ts`
- `src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignal.contribution.ts`
- `src/vs/workbench/contrib/accessibilitySignals/browser/editorTextPropertySignalsContribution.ts`
- `src/vs/workbench/contrib/bulkEdit/browser/bulkEditService.ts`
- `src/vs/workbench/contrib/bulkEdit/browser/conflicts.ts`
- `src/vs/workbench/contrib/customEditor/browser/customEditorInputFactory.ts`
- `src/vs/workbench/contrib/editSessions/test/browser/editSessions.test.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/editTelemetry.contribution.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/editTelemetryContribution.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/arcTelemetrySender.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingFeature.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/editSourceTrackingImpl.ts`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/editTracker.ts`
- `src/vs/workbench/contrib/editTelemetry/test/browser/editSourceTrackingImpl.test.ts`
- `src/vs/workbench/contrib/editTelemetry/test/browser/editTelemetry.test.ts`
- `src/vs/workbench/contrib/editTelemetry/test/browser/editTracker.test.ts`
- `src/vs/workbench/contrib/extensions/browser/fileBasedRecommendations.ts`
- `src/vs/workbench/contrib/extensions/electron-browser/debugExtensionHostAction.ts`
- `src/vs/workbench/contrib/extensions/electron-browser/extensions.contribution.ts`
- `src/vs/workbench/contrib/inlineCompletions/browser/inlineCompletionLanguageStatusBarContribution.ts`
- `src/vs/workbench/contrib/issue/browser/issueReporterModel.ts`
- `src/vs/workbench/contrib/issue/browser/issueReporterOverlay.ts`
- `src/vs/workbench/contrib/issue/browser/issueService.ts`
- `src/vs/workbench/contrib/issue/common/issue.ts`
- `src/vs/workbench/contrib/issue/electron-browser/issueService.ts`
- `src/vs/workbench/contrib/issue/electron-browser/nativeIssueFormService.ts`
- `src/vs/workbench/contrib/issue/test/browser/issueReporterOverlay.test.ts`
- `src/vs/workbench/contrib/languageDetection/browser/languageDetection.contribution.ts`
- `src/vs/workbench/contrib/preferences/browser/settingsEditor2.ts`
- `src/vs/workbench/contrib/preferences/browser/settingsTreeModels.ts`
- `src/vs/workbench/contrib/quickaccess/browser/viewQuickAccess.ts`
- `src/vs/workbench/contrib/relauncher/browser/relauncher.contribution.ts`
- `src/vs/workbench/contrib/remote/browser/remoteExplorer.ts`
- `src/vs/workbench/contrib/remote/browser/urlFinder.ts`
- `src/vs/workbench/contrib/remote/test/browser/urlFinder.test.ts`
- `src/vs/workbench/contrib/scm/browser/quickDiffModel.ts`
- `src/vs/workbench/contrib/search/browser/quickTextSearch/textSearchQuickAccess.ts`
- `src/vs/workbench/contrib/search/browser/replaceService.ts`
- `src/vs/workbench/contrib/search/browser/search.common.contribution.ts`
- `src/vs/workbench/contrib/search/browser/search.contribution.ts`
- `src/vs/workbench/contrib/search/browser/searchActionsCopy.ts`
- `src/vs/workbench/contrib/search/browser/searchActionsRemoveReplace.ts`
- `src/vs/workbench/contrib/search/browser/searchActionsTopBar.ts`
- `src/vs/workbench/contrib/search/browser/searchCompare.ts`
- `src/vs/workbench/contrib/search/browser/searchResultsView.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/fileMatch.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/folderMatch.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/searchModel.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/searchResult.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/searchTreeCommon.ts`
- `src/vs/workbench/contrib/search/browser/searchTreeModel/textSearchHeading.ts`
- `src/vs/workbench/contrib/search/browser/searchView.ts`
- `src/vs/workbench/contrib/search/browser/searchWidget.ts`
- `src/vs/workbench/contrib/search/test/browser/searchActions.test.ts`
- `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts`
- `src/vs/workbench/contrib/search/test/browser/searchResult.test.ts`
- `src/vs/workbench/contrib/search/test/browser/searchTestCommon.ts`
- `src/vs/workbench/contrib/search/test/browser/searchViewlet.test.ts`
- `src/vs/workbench/contrib/searchEditor/browser/constants.ts`
- `src/vs/workbench/contrib/searchEditor/browser/searchEditor.ts`
- `src/vs/workbench/contrib/searchEditor/browser/searchEditorSerialization.ts`
- `src/vs/workbench/contrib/surveys/browser/nps.contribution.ts`
- `src/vs/workbench/contrib/surveys/browser/survey.contribution.ts`
- `src/vs/workbench/contrib/tasks/browser/abstractTaskService.ts`
- `src/vs/workbench/contrib/terminal/browser/terminalService.ts`
- `src/vs/workbench/contrib/testing/browser/testResultsView/testResultsViewContent.ts`
- `src/vs/workbench/contrib/testing/browser/testing.contribution.ts`
- `src/vs/workbench/contrib/themes/browser/themes.contribution.ts`
- `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts`
- `src/vs/workbench/contrib/userDataProfile/browser/userDataProfilesEditorModel.ts`
- `src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts`
- `src/vs/workbench/contrib/workspace/browser/workspace.contribution.ts`
- `src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts`
- `src/vs/workbench/services/accounts/browser/defaultAccount.ts`
- `src/vs/workbench/services/assignment/common/assignmentFilters.ts`
- `src/vs/workbench/services/assignment/common/assignmentService.ts`
- `src/vs/workbench/services/assignment/test/common/assignmentFilters.test.ts`
- `src/vs/workbench/services/configuration/browser/configurationService.ts`
- `src/vs/workbench/services/environment/browser/environmentService.ts`
- `src/vs/workbench/services/environment/common/environmentService.ts`
- `src/vs/workbench/services/environment/electron-browser/environmentService.ts`
- `src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts`
- `src/vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test.ts`
- `src/vs/workbench/services/extensions/browser/webWorkerExtensionHost.ts`
- `src/vs/workbench/services/extensions/common/remoteExtensionHost.ts`
- `src/vs/workbench/services/extensions/electron-browser/localProcessExtensionHost.ts`
- `src/vs/workbench/services/policies/common/accountPolicyService.ts`
- `src/vs/workbench/services/policies/test/browser/accountPolicyService.test.ts`
- `src/vs/workbench/services/search/common/search.ts`
- `src/vs/workbench/services/search/common/searchService.ts`
- `src/vs/workbench/services/search/common/textSearchManager.ts`
- `src/vs/workbench/services/storage/electron-browser/storageService.ts`
- `src/vs/workbench/services/storage/test/browser/storageService.test.ts`
- `src/vs/workbench/services/telemetry/browser/workbenchCommonProperties.ts`
- `src/vs/workbench/services/telemetry/common/workbenchCommonProperties.ts`
- `src/vs/workbench/services/telemetry/test/browser/commonProperties.test.ts`
- `src/vs/workbench/services/telemetry/test/node/commonProperties.test.ts`
- `src/vs/workbench/services/themes/browser/workbenchThemeService.ts`
- `src/vs/workbench/services/userDataProfile/browser/userDataProfileImportExportService.ts`
- `src/vs/workbench/services/userDataProfile/browser/userDataProfileInit.ts`
- `src/vs/workbench/services/views/browser/viewDescriptorService.ts`
- `src/vs/workbench/services/workingCopy/test/electron-browser/workingCopyBackupService.test.ts`
- `src/vs/workbench/services/workspaces/common/workspaceTrust.ts`
- `src/vs/workbench/services/workspaces/test/common/workspaceTrust.test.ts`
- `src/vs/workbench/common/notebookUri.ts`
- `src/vs/workbench/contrib/testing/browser/callStackWidget.ts`
- `src/vs/workbench/contrib/testing/browser/testStackDecorations.ts`
- `src/vs/workbench/contrib/testing/browser/media/callStackWidget.css`
- `src/vs/workbench/contrib/testing/browser/media/callStackEditorContribution.css`
- `src/vs/workbench/contrib/editTelemetry/browser/telemetry/externalEditCorrelation.ts`
