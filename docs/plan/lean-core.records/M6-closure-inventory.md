# M6 专属源码闭包调查

- 计划：[lean-core.md](../lean-core.md) §5.4–5.7、M6 / V6–V8。
- 最近更新：2026-10-01 23:15 +1000。
- 状态：只读调查完成；本记录没有实施删除，不等同完整构建通过。
- 仓库基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；事实源码 `/tmp/lean-core-api-5_lg434f/vscode`（prepared +114，M4 API/普通消费者补丁已集成）；读取当前 `patches/light/prune.json`。不改共享源码或生成 vscode，不重跑测试。

## Exact 父目录候选

以下是计划明确退休的运行实现族，所有外部入边需先拆除，稳定 API/普通共享数据需先迁出；不是直接执行字符串匹配删除。表中计数含专属测试。

| 路径 | 当前文件数 | light/prune.json 中需要被父目录合并的旧子项数 |
| --- | --- | --- |
| `src/vs/sessions` | 807 | 13 |
| `src/vs/platform/agentHost` | 975 | 29 |
| `src/vs/platform/agentPlugins` | 3 | 0 |
| `src/vs/platform/mcp` | 27 | 0 |
| `src/vs/platform/localTranscription` | 7 | 0 |
| `src/vs/platform/sandbox` | 16 | 0 |
| `src/vs/platform/webContentExtractor` | 10 | 0 |
| `src/vs/platform/chat` | 3 | 0 |
| `src/vs/workbench/contrib/chat` | 1276 | 0 |
| `src/vs/workbench/contrib/inlineChat` | 23 | 0 |
| `src/vs/workbench/contrib/mcp` | 85 | 0 |
| `src/vs/workbench/contrib/speech` | 5 | 0 |
| `src/vs/workbench/contrib/agentsVoice` | 37 | 0 |
| `src/vs/workbench/contrib/welcomeAgentSessions` | 4 | 0 |
| `src/vs/workbench/contrib/notebook` | 272 | 0 |
| `src/vs/workbench/contrib/interactive` | 9 | 0 |
| `src/vs/workbench/contrib/debug` | 118 | 0 |
| `src/vs/workbench/services/chat` | 2 | 0 |
| `src/vs/workbench/services/aiSettingsSearch` | 2 | 0 |
| `src/vs/workbench/services/aiEmbeddingVector` | 1 | 0 |
| `src/vs/workbench/services/aiRelatedInformation` | 3 | 0 |
| `src/vs/workbench/services/agentHost` | 13 | 0 |
| `src/vs/workbench/services/mcp` | 5 | 0 |

## 起始快照静态与动态 import 入边（归档）

扫描发生在M5专属prune之前。其后root已删除BrowserView、dictation及121的专属ChatContext/tools叶文件；这些旧owner行只作起始图证据，不属于当前保留owner或最终prune。扫描含相对 from、side-effect import 和 import()；普通所有者列表包含测试/DTO/服务/入口。各入边的处置依据下文人工核对；不能将此表当整文件删除指令。

候选父目录与已在 light prune 内的文件合并后：174 个候选外部所有者、731 条入边。这是初始 23 父目录的静态扫描结果，包含下面会继续退休的 API actors / fixtures / AI 叶模块，不能宣称为最终保留模块数。

| 保留 sourcepath:行 | 指向的退休模块 |
| --- | --- |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:125` | `src/vs/platform/webContentExtractor/common/webContentExtractor.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:126` | `src/vs/platform/webContentExtractor/node/sharedWebContentExtractorService.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:127` | `src/vs/platform/mcp/node/mcpManagementService.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:128` | `src/vs/platform/mcp/common/mcpManagement.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:129` | `src/vs/platform/mcp/common/mcpResourceScannerService.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:130` | `src/vs/platform/mcp/common/mcpGalleryService.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:131` | `src/vs/platform/mcp/common/mcpManagementIpc.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:132` | `src/vs/platform/mcp/common/allowedMcpServersService.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:133` | `src/vs/platform/mcp/common/mcpGalleryManifest.ts` |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:134` | `src/vs/platform/mcp/common/mcpGalleryManifestServiceIpc.ts` |
| `src/vs/code/node/cliProcessMain.ts:68` | `src/vs/platform/mcp/common/mcpManagementCli.ts` |
| `src/vs/code/node/cliProcessMain.ts:71` | `src/vs/platform/mcp/common/mcpManagement.ts` |
| `src/vs/code/node/cliProcessMain.ts:72` | `src/vs/platform/mcp/node/mcpManagementService.ts` |
| `src/vs/code/node/cliProcessMain.ts:73` | `src/vs/platform/mcp/common/mcpResourceScannerService.ts` |
| `src/vs/code/node/cliProcessMain.ts:74` | `src/vs/platform/mcp/common/mcpGalleryService.ts` |
| `src/vs/code/node/cliProcessMain.ts:75` | `src/vs/platform/mcp/common/allowedMcpServersService.ts` |
| `src/vs/code/node/cliProcessMain.ts:76` | `src/vs/platform/mcp/common/mcpGalleryManifest.ts` |
| `src/vs/code/node/cliProcessMain.ts:77` | `src/vs/platform/mcp/common/mcpGalleryManifestService.ts` |
| `src/vs/code/electron-main/app.ts:47` | `src/vs/platform/sandbox/electron-main/sandboxHelperService.ts` |
| `src/vs/code/electron-main/app.ts:48` | `src/vs/platform/sandbox/node/sandboxHelper.ts` |
| `src/vs/code/electron-main/app.ts:134` | `src/vs/platform/mcp/common/nativeMcpDiscoveryHelper.ts` |
| `src/vs/code/electron-main/app.ts:135` | `src/vs/platform/mcp/node/nativeMcpDiscoveryHelperService.ts` |
| `src/vs/code/electron-main/app.ts:136` | `src/vs/platform/mcp/common/mcpGateway.ts` |
| `src/vs/code/electron-main/app.ts:137` | `src/vs/platform/mcp/node/mcpGatewayService.ts` |
| `src/vs/code/electron-main/app.ts:138` | `src/vs/platform/mcp/node/mcpGatewayChannel.ts` |
| `src/vs/code/electron-main/app.ts:139` | `src/vs/platform/webContentExtractor/common/webContentExtractor.ts` |
| `src/vs/code/electron-main/app.ts:140` | `src/vs/platform/webContentExtractor/electron-main/webContentExtractorService.ts` |
| `src/vs/code/electron-main/app.ts:142` | `src/vs/platform/sandbox/common/terminalSandboxService.ts` |
| `src/vs/workbench/workbench.common.main.ts:60` | `src/vs/platform/mcp/common/mcpResourceScannerService.ts` |
| `src/vs/workbench/workbench.common.main.ts:74` | `src/vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.ts` |
| `src/vs/workbench/workbench.common.main.ts:75` | `src/vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService.ts` |
| `src/vs/workbench/workbench.common.main.ts:76` | `src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearchService.ts` |
| `src/vs/workbench/workbench.common.main.ts:138` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/workbench.common.main.ts:139` | `src/vs/workbench/services/agentHost/common/agentHostResourceService.ts` |
| `src/vs/workbench/workbench.common.main.ts:140` | `src/vs/platform/agentHost/browser/agentHostConnectionsService.ts` |
| `src/vs/workbench/workbench.common.main.ts:166` | `src/vs/platform/mcp/common/mcpManagement.ts` |
| `src/vs/workbench/workbench.common.main.ts:167` | `src/vs/platform/mcp/common/mcpGalleryService.ts` |
| `src/vs/workbench/workbench.common.main.ts:168` | `src/vs/platform/mcp/common/allowedMcpServersService.ts` |
| `src/vs/workbench/workbench.common.main.ts:215` | `src/vs/workbench/contrib/notebook/browser/notebook.service.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:218` | `src/vs/workbench/contrib/speech/browser/speech.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:221` | `src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:222` | `src/vs/workbench/contrib/chat/browser/chat.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:223` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHost.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:224` | `src/vs/workbench/contrib/chat/browser/chat.view.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:225` | `src/vs/workbench/contrib/inlineChat/browser/inlineChat.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:228` | `src/vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:229` | `src/vs/workbench/contrib/mcp/browser/mcp.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:230` | `src/vs/workbench/contrib/mcp/browser/mcp.view.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:231` | `src/vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:232` | `src/vs/workbench/contrib/chat/browser/contextContrib/chatContext.contribution.ts` |
| `src/vs/workbench/workbench.common.main.ts:276` | `src/vs/workbench/contrib/debug/browser/debug.service.contribution.ts` |
| `src/vs/workbench/workbench.web.main.ts:46` | `src/vs/workbench/services/mcp/browser/mcpWorkbenchManagementService.ts` |
| `src/vs/workbench/workbench.web.main.ts:75` | `src/vs/platform/sandbox/browser/sandboxHelperService.ts` |
| `src/vs/workbench/workbench.web.main.ts:101` | `src/vs/platform/webContentExtractor/common/webContentExtractor.ts` |
| `src/vs/workbench/workbench.web.main.ts:102` | `src/vs/platform/mcp/common/mcpGalleryManifest.ts` |
| `src/vs/workbench/workbench.web.main.ts:103` | `src/vs/workbench/services/mcp/browser/mcpGalleryManifestService.ts` |
| `src/vs/workbench/workbench.web.main.ts:105` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/workbench.web.main.ts:106` | `src/vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient.ts` |
| `src/vs/workbench/workbench.web.main.ts:107` | `src/vs/platform/agentHost/common/remoteAgentHostService.ts` |
| `src/vs/workbench/workbench.web.main.ts:108` | `src/vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.ts` |
| `src/vs/workbench/workbench.web.main.ts:109` | `src/vs/workbench/services/agentHost/browser/webAgentHostEnablementService.ts` |
| `src/vs/workbench/workbench.web.main.ts:152` | `src/vs/workbench/contrib/debug/browser/extensionHostDebugService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:57` | `src/vs/workbench/services/mcp/electron-browser/mcpGalleryManifestService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:58` | `src/vs/workbench/services/mcp/electron-browser/mcpWorkbenchManagementService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:91` | `src/vs/platform/sandbox/electron-browser/sandboxHelperService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:92` | `src/vs/platform/webContentExtractor/electron-browser/webContentExtractorService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:93` | `src/vs/workbench/services/agentHost/electron-browser/agentHostService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:94` | `src/vs/platform/agentHost/electron-browser/remoteAgentHostService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:123` | `src/vs/workbench/contrib/debug/electron-browser/extensionHostDebugService.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:177` | `src/vs/workbench/contrib/chat/electron-browser/chat.contribution.ts` |
| `src/vs/workbench/workbench.desktop.main.ts:186` | `src/vs/workbench/contrib/mcp/electron-browser/mcp.contribution.ts` |
| `src/vs/workbench/test/browser/aiCustomizationManagementSectionRegistry.test.ts:10` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementSectionRegistry.ts` |
| `src/vs/workbench/test/browser/aiCustomizationManagementSectionRegistry.test.ts:11` | `src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.ts` |
| `src/vs/workbench/test/browser/workbenchTestServices.ts:135` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/workbenchTestServices.ts:136` | `src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditor.ts` |
| `src/vs/workbench/test/browser/workbenchTestServices.ts:137` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/workbenchTestServices.ts:147` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:63` | `src/vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:64` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:65` | `src/vs/workbench/contrib/chat/browser/attachments/chatPasteTargetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:102` | `src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:103` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:105` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:107` | `src/vs/sessions/services/sessions/browser/sessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:109` | `src/vs/sessions/services/sessions/common/sessionChangesStatsCache.ts` |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts:111` | `src/vs/sessions/contrib/codeReview/browser/codeReviewService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/agentsVoice/voiceModeOnboarding.fixture.ts:9` | `src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.ts` |
| `src/vs/workbench/test/browser/componentFixtures/agentsVoice/voiceModeOnboarding.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.ts` |
| `src/vs/workbench/test/browser/componentFixtures/agentsVoice/voiceModeOnboarding.fixture.ts:11` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:11` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:12` | `src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:13` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTurnPillsPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:14` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:15` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:16` | `src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTurnPills.fixture.ts:17` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:14` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatProgressContentPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/widget/chatContentMarkdownRenderer.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:16` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:17` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:18` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:19` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatProgressContentPart.fixture.ts:22` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTerminalCollapsible.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTerminalCollapsible.fixture.ts:11` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTerminalCollapsible.fixture.ts:12` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatTerminalCollapsible.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:15` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:16` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:17` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:18` | `src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:19` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:20` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:21` | `src/vs/workbench/contrib/chat/common/tools/chatTodoListService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:22` | `src/vs/workbench/contrib/chat/common/languageModels.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:23` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/renderChatInput.ts:24` | `src/vs/platform/sandbox/common/settings.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInputNotice.fixture.ts:9` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInputNotice.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputStack.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetFixtureUtils.ts:10` | `src/vs/workbench/contrib/chat/browser/chatPetAchievements.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetFixtureUtils.ts:11` | `src/vs/workbench/contrib/chat/browser/chatPetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/voiceGlow.fixture.ts:7` | `src/vs/workbench/contrib/chat/browser/voiceClient/voiceGlow.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/voiceGlow.fixture.ts:8` | `src/vs/workbench/contrib/chat/browser/voiceClient/voiceGlowController.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts:8` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts:9` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts:15` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts:17` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatQuestionCarousel.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatArtifacts.fixture.ts:14` | `src/vs/workbench/contrib/chat/browser/widget/chatArtifactsWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatArtifacts.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatArtifacts.fixture.ts:16` | `src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatArtifacts.fixture.ts:19` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAccessoryRig.fixture.ts:9` | `src/vs/workbench/contrib/chat/browser/chatPetAchievements.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAccessoryRig.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/widget/chatPetAccessoryRenderer.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAccessoryRig.fixture.ts:11` | `src/vs/workbench/contrib/chat/browser/widget/chatPetWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAccessoryRig.fixture.ts:12` | `src/vs/workbench/contrib/chat/browser/widget/chatPetAccessoryRig.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:17` | `src/vs/workbench/contrib/chat/browser/feedbackSurvey/chatModelFeedbackSurveyService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:18` | `src/vs/workbench/contrib/chat/test/browser/feedbackSurvey/mockChatModelFeedbackSurveyService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:24` | `src/vs/platform/webContentExtractor/common/webContentExtractor.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:37` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:42` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:43` | `src/vs/platform/agentHost/common/agentHostEnablementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:44` | `src/vs/platform/agentHost/common/state/agentSubscription.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:45` | `src/vs/platform/agentHost/common/state/sessionState.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:46` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:47` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:48` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:49` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:50` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:51` | `src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:52` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:53` | `src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:54` | `src/vs/workbench/contrib/chat/browser/chatPetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:55` | `src/vs/workbench/contrib/chat/browser/widget/chatPetWidgetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:56` | `src/vs/workbench/contrib/chat/browser/chatOutputItemRenderer.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:59` | `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:60` | `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:61` | `src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:62` | `src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:63` | `src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:64` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:65` | `src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:66` | `src/vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:67` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:68` | `src/vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:69` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:70` | `src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:71` | `src/vs/workbench/contrib/chat/common/chatModes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:72` | `src/vs/workbench/contrib/chat/test/common/mockChatModeService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:73` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:74` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:75` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:76` | `src/vs/workbench/contrib/chat/common/languageModels.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:77` | `src/vs/workbench/contrib/chat/common/participants/chatAgents.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:78` | `src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:79` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:80` | `src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:81` | `src/vs/workbench/contrib/chat/common/tools/chatTodoListService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:82` | `src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:83` | `src/vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAchievementsEditor.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/chatPetAchievementsEditor.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAchievementsEditor.fixture.ts:11` | `src/vs/workbench/contrib/chat/browser/chatPetAchievementsEditorInput.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAchievementsEditor.fixture.ts:12` | `src/vs/workbench/contrib/chat/browser/chatPetAchievements.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatPetAchievementsEditor.fixture.ts:13` | `src/vs/workbench/contrib/chat/browser/chatPetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:14` | `src/vs/workbench/contrib/chat/browser/widget/chatContentMarkdownRenderer.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentCodePools.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:16` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:17` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:18` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:19` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:20` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatUsedContextLabel.fixture.ts:24` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:14` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:16` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatContentParts.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:17` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:18` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolConfirmationCarouselPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:19` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:20` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:21` | `src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:22` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:23` | `src/vs/workbench/contrib/chat/common/tools/chatTodoListService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:24` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:31` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:32` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatConfirmationWidget.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:33` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatAgentFeedbackReviewConfirmation.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatAgentFeedbackReviewConfirmation.fixture.ts:34` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatToolConfirmationCarousel.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatToolRiskBadge.fixture.ts:9` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/toolRiskBadgeWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatToolRiskBadge.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatToolRiskBadge.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatReadOnlyBanner.fixture.ts:6` | `src/vs/workbench/contrib/chat/browser/widget/chatReadOnlyBanner.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:11` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:12` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:13` | `src/vs/workbench/contrib/chat/common/tools/chatTodoListService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:14` | `src/vs/workbench/contrib/chat/common/languageModels.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:15` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:16` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatInput.fixture.ts:20` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatRichLink.fixture.ts:9` | `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatRichLink.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/permissionPickerList.fixture.ts:13` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:17` | `src/vs/workbench/contrib/chat/common/requestParser/chatParserTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:18` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:19` | `src/vs/workbench/contrib/chat/common/model/chatViewModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:20` | `src/vs/workbench/contrib/chat/browser/widget/chatListWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:21` | `src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:22` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:24` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:25` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:26` | `src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatElicitationRequestPart.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:27` | `src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:28` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:29` | `src/vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:33` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:34` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:35` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:36` | `src/vs/workbench/contrib/chat/browser/chatResponseFileChangesService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:37` | `src/vs/workbench/contrib/chat/test/common/chatService/mockChatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:40` | `src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/chatWidget.fixture.ts:42` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/chat/promptFilePickers.fixture.ts:23` | `src/vs/workbench/contrib/chat/browser/promptSyntax/pickers/promptFilePickers.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/promptFilePickers.fixture.ts:24` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/promptFilePickers.fixture.ts:25` | `src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/chat/promptFilePickers.fixture.ts:27` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:20` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsViewer.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:21` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:22` | `src/vs/workbench/contrib/chat/common/voicePlaybackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:23` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:24` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:25` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/agentSessionsViewer.fixture.ts:29` | `src/vs/workbench/contrib/chat/browser/agentSessions/media/agentsessionsviewer.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsSignInDialog.fixture.ts:10` | `src/vs/workbench/contrib/chat/browser/chatSetup/chatSetupRunner.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsSignInDialog.fixture.ts:11` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsSignInDialog.fixture.ts:15` | `src/vs/sessions/browser/sessionsSignInDialog.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:12` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:14` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:16` | `src/vs/sessions/services/sessions/browser/sessionContext.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:18` | `src/vs/sessions/contrib/github/common/types.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:20` | `src/vs/sessions/contrib/github/browser/githubService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:22` | `src/vs/sessions/contrib/github/browser/issueHover.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:24` | `src/vs/sessions/contrib/github/browser/githubReferenceList.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:26` | `src/vs/sessions/contrib/github/browser/issueActions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openIssue.fixture.ts:31` | `src/vs/sessions/browser/parts/media/chatCompositeBar.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionReadOnlyBanner.fixture.ts:7` | `src/vs/sessions/browser/parts/sessionReadOnlyBanner.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts:10` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts:12` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts:14` | `src/vs/sessions/services/sessions/browser/sessionsProvidersService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts:16` | `src/vs/sessions/browser/parts/chatCompositeBar.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatCompositeBar.fixture.ts:20` | `src/vs/sessions/browser/parts/media/chatCompositeBar.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:19` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:21` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:23` | `src/vs/sessions/services/sessions/browser/sessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:25` | `src/vs/sessions/services/sessions/browser/sessionsListModelService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:27` | `src/vs/sessions/services/sessions/browser/sessionsProvidersService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:29` | `src/vs/sessions/contrib/sessions/browser/blockedSessionsList.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:31` | `src/vs/sessions/contrib/sessions/browser/sessionsTitleBarWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:33` | `src/vs/sessions/contrib/sessions/browser/views/sessionsList.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:34` | `src/vs/workbench/contrib/chat/common/voicePlaybackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:35` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:36` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:37` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:38` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:39` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/blockedSessionsList.fixture.ts:44` | `src/vs/sessions/contrib/sessions/browser/media/sessionsList.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:25` | `src/vs/platform/agentPlugins/common/pluginParsers.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:35` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:43` | `src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:44` | `src/vs/workbench/contrib/chat/common/customizationHarnessService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:45` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:46` | `src/vs/workbench/contrib/chat/common/model/chatUri.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:47` | `src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:48` | `src/vs/workbench/contrib/chat/common/promptSyntax/config/promptFileLocations.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:49` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:50` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:51` | `src/vs/workbench/contrib/chat/common/plugins/agentPluginService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:52` | `src/vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:53` | `src/vs/workbench/contrib/chat/common/plugins/marketplaceReference.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:54` | `src/vs/workbench/contrib/chat/common/plugins/pluginInstallService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:55` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditor.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:56` | `src/vs/workbench/contrib/chat/browser/aiCustomization/customizationMigrationCategories.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:57` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemSource.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:58` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:59` | `src/vs/workbench/contrib/chat/browser/aiCustomization/embeddedMcpServerDetail.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:60` | `src/vs/workbench/contrib/chat/browser/aiCustomization/embeddedAgentPluginDetail.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:61` | `src/vs/workbench/contrib/chat/browser/agentPluginEditor/agentPluginItems.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:62` | `src/vs/workbench/contrib/chat/common/enablement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:63` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagementEditorInput.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:66` | `src/vs/platform/mcp/common/mcpManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:67` | `src/vs/platform/mcp/common/mcpPlatformTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:68` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:69` | `src/vs/workbench/contrib/chat/common/automations/automationDialogService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:70` | `src/vs/workbench/contrib/chat/common/automations/automationRunner.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:71` | `src/vs/workbench/contrib/chat/common/automations/automationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:72` | `src/vs/workbench/contrib/mcp/common/mcpTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:73` | `src/vs/workbench/contrib/mcp/common/mcpRegistryTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:74` | `src/vs/workbench/services/mcp/common/mcpWorkbenchManagementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:75` | `src/vs/workbench/contrib/chat/browser/aiCustomization/mcpListWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:76` | `src/vs/workbench/contrib/chat/browser/aiCustomization/pluginListWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:78` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:79` | `src/vs/platform/agentHost/common/state/protocol/state.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:81` | `src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:83` | `src/vs/sessions/contrib/codeReview/browser/codeReviewService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:85` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:86` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationManagementEditor.fixture.ts:93` | `src/vs/workbench/contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:12` | `src/vs/sessions/contrib/github/browser/fetchers/githubPRFetcher.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:14` | `src/vs/sessions/contrib/github/browser/models/githubPullRequestModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:16` | `src/vs/sessions/contrib/github/browser/models/githubPullRequestCIModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:18` | `src/vs/sessions/contrib/github/browser/models/githubPullRequestReviewThreadsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:20` | `src/vs/sessions/contrib/github/browser/models/githubIssueModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:22` | `src/vs/sessions/contrib/github/browser/fetchers/githubIssueFetcher.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:24` | `src/vs/sessions/contrib/github/browser/githubService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:26` | `src/vs/sessions/contrib/github/browser/pullRequestIconCache.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/githubFixtureUtils.ts:28` | `src/vs/sessions/contrib/github/common/types.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:15` | `src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:16` | `src/vs/workbench/contrib/chat/common/customizationHarnessService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:17` | `src/vs/workbench/contrib/chat/common/plugins/agentPluginService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:18` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:19` | `src/vs/workbench/contrib/chat/common/model/chatUri.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:20` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:21` | `src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:22` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:23` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationItemsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:24` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationListWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationListWidget.fixture.ts:28` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptFileParser.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:23` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:36` | `src/vs/sessions/contrib/changes/common/changesViewService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:38` | `src/vs/sessions/contrib/changes/common/changes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:40` | `src/vs/sessions/contrib/changes/browser/changesView.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:42` | `src/vs/sessions/contrib/changes/browser/sessionChangesService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:44` | `src/vs/sessions/contrib/github/browser/models/githubPullRequestCIModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:46` | `src/vs/sessions/contrib/github/browser/githubService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:48` | `src/vs/sessions/contrib/github/common/types.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:50` | `src/vs/sessions/services/sessions/browser/sessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:52` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/changesView.fixture.ts:54` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:18` | `src/vs/sessions/services/agentHostFilter/common/agentHostFilter.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:20` | `src/vs/sessions/services/sessions/browser/sessionGroupsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:22` | `src/vs/sessions/services/sessions/browser/sessionSectionOrderService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:24` | `src/vs/sessions/services/sessions/browser/sessionsListModelService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:26` | `src/vs/sessions/services/sessions/browser/sessionsProvidersService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:28` | `src/vs/sessions/services/sessions/browser/sessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:30` | `src/vs/sessions/services/customView/browser/customViewService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:32` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:34` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:36` | `src/vs/sessions/contrib/sessions/browser/views/sessionsList.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:37` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:38` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:39` | `src/vs/workbench/contrib/chat/common/automations/automationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:40` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:41` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:42` | `src/vs/workbench/contrib/chat/common/voicePlaybackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsList.fixture.ts:47` | `src/vs/sessions/contrib/sessions/browser/media/sessionsList.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatPetAchievementBadges.fixture.ts:7` | `src/vs/workbench/contrib/chat/browser/chatPetAchievements.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatPetAchievementBadges.fixture.ts:8` | `src/vs/workbench/contrib/chat/browser/chatPetService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/chatPetAchievementBadges.fixture.ts:10` | `src/vs/sessions/contrib/accountMenu/browser/chatPetAchievementBadges.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionApprovalModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:17` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:19` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:21` | `src/vs/sessions/services/sessions/browser/sessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:23` | `src/vs/sessions/services/sessions/browser/sessionsProvidersService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:25` | `src/vs/sessions/contrib/blockedSessions/browser/blockedSessions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:27` | `src/vs/sessions/contrib/sessions/browser/sessionActionFeedback.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:29` | `src/vs/sessions/contrib/sessions/browser/sessionsTitleBarWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:31` | `src/vs/sessions/contrib/sessions/browser/blockedSessionsCIFixModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionsTitleBarWidget.fixture.ts:33` | `src/vs/sessions/contrib/sessions/browser/blockedSessionsIndicatorModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/viewAllChanges.fixture.ts:12` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/viewAllChanges.fixture.ts:14` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/viewAllChanges.fixture.ts:16` | `src/vs/sessions/services/sessions/browser/sessionContext.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/viewAllChanges.fixture.ts:18` | `src/vs/sessions/contrib/changes/browser/changesActions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/viewAllChanges.fixture.ts:22` | `src/vs/sessions/browser/parts/media/chatCompositeBar.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts:12` | `src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts:13` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts:14` | `src/vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts:15` | `src/vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationWelcomePage.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/aiCustomizationWelcomePages.fixture.ts:21` | `src/vs/workbench/contrib/chat/browser/aiCustomization/media/aiCustomizationManagement.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:12` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:16` | `src/vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:18` | `src/vs/sessions/contrib/chat/browser/sessionChatInputToolbar.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:20` | `src/vs/sessions/contrib/chat/browser/sessionChatInputToolbarDebug.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:22` | `src/vs/sessions/contrib/github/browser/githubService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:24` | `src/vs/sessions/contrib/sessionInputBanners/browser/sessionInputBanners.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:26` | `src/vs/sessions/common/agentHostSessionsProvider.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:28` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:30` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:13` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:15` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:17` | `src/vs/sessions/services/sessions/browser/sessionContext.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:19` | `src/vs/sessions/contrib/github/common/types.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:21` | `src/vs/sessions/contrib/github/browser/githubService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:23` | `src/vs/sessions/contrib/github/browser/pullRequestHover.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:25` | `src/vs/sessions/contrib/github/browser/pullRequestActions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:27` | `src/vs/sessions/contrib/github/browser/pullRequestIconCache.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:29` | `src/vs/sessions/contrib/github/browser/githubReferenceList.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/openPullRequest.fixture.ts:34` | `src/vs/sessions/browser/parts/media/chatCompositeBar.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/customViewNode.fixture.ts:10` | `src/vs/sessions/services/customView/browser/customView.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/customViewNode.fixture.ts:12` | `src/vs/sessions/browser/parts/customViewNode.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionHeader.fixture.ts:13` | `src/vs/sessions/browser/parts/sessionHeader.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionHeader.fixture.ts:15` | `src/vs/sessions/services/sessions/browser/sessionsListModelService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionHeader.fixture.ts:17` | `src/vs/sessions/services/sessions/common/session.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionHeader.fixture.ts:19` | `src/vs/sessions/services/sessions/common/sessionsManagement.ts` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/sessionHeader.fixture.ts:23` | `src/vs/sessions/browser/parts/media/chatCompositeBar.css` |
| `src/vs/workbench/test/browser/componentFixtures/sessions/mockCodeReviewService.ts:9` | `src/vs/sessions/contrib/codeReview/browser/codeReviewService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:28` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:29` | `src/vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:30` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:31` | `src/vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:32` | `src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:33` | `src/vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:35` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:36` | `src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:37` | `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:38` | `src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:39` | `src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:40` | `src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:41` | `src/vs/workbench/contrib/chat/browser/chatTipService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:42` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:43` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:44` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:45` | `src/vs/workbench/contrib/chat/common/chatModes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:46` | `src/vs/workbench/contrib/chat/common/languageModels.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:47` | `src/vs/workbench/contrib/chat/common/participants/chatAgents.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:48` | `src/vs/workbench/contrib/chat/common/participants/chatSlashCommands.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:49` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:50` | `src/vs/workbench/contrib/chat/common/tools/chatArtifactsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:51` | `src/vs/workbench/contrib/chat/common/tools/chatTodoListService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:52` | `src/vs/workbench/contrib/chat/common/chatDebugService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:53` | `src/vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:54` | `src/vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:55` | `src/vs/workbench/contrib/chat/common/widget/chatLayoutService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:56` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:57` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:58` | `src/vs/platform/agentHost/common/state/agentSubscription.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:59` | `src/vs/platform/agentHost/common/state/sessionState.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:60` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:61` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:62` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:63` | `src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:72` | `src/vs/platform/webContentExtractor/common/webContentExtractor.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:78` | `src/vs/workbench/contrib/inlineChat/browser/inlineChatZoneWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:79` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:80` | `src/vs/workbench/contrib/chat/common/editing/chatEditingService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:81` | `src/vs/workbench/contrib/chat/common/promptSyntax/promptTypes.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:82` | `src/vs/workbench/contrib/chat/common/customizationHarnessService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:86` | `src/vs/workbench/contrib/chat/browser/widget/input/editor/chatInputEditorContrib.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:89` | `src/vs/workbench/contrib/inlineChat/browser/media/inlineChat.css` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:90` | `src/vs/workbench/contrib/chat/browser/widget/media/chat.css` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatZoneWidget.fixture.ts:93` | `src/vs/workbench/contrib/chat/test/common/mockChatModeService.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts:10` | `src/vs/workbench/contrib/inlineChat/browser/inlineChatAffordanceWidget.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts:16` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts:22` | `src/vs/workbench/contrib/inlineChat/browser/inlineChatActions.ts` |
| `src/vs/workbench/test/browser/componentFixtures/editor/inlineChatAffordance.fixture.ts:25` | `src/vs/workbench/contrib/inlineChat/browser/media/inlineChatEditorAffordance.css` |
| `src/vs/workbench/test/common/workbenchTestServices.ts:36` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/contrib/languageDetection/browser/languageDetection.contribution.ts:23` | `src/vs/workbench/contrib/notebook/common/notebookContextKeys.ts` |
| `src/vs/workbench/contrib/comments/browser/commentThreadBody.ts:19` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/comments/browser/commentService.ts:15` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/comments/browser/commentThreadWidget.ts:24` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/comments/browser/commentReply.ts:30` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/comments/browser/commentNode.ts:40` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/comments/browser/commentThreadAdditionalActions.ts:17` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/contrib/codeEditor/browser/dictation/editorDictation.ts:15` | `src/vs/workbench/contrib/speech/common/speechService.ts` |
| `src/vs/workbench/contrib/codeEditor/browser/dictation/editorDictation.ts:16` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/codeEditor/browser/dictation/editorDictation.ts:17` | `src/vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.ts` |
| `src/vs/workbench/contrib/codeEditor/browser/dictation/editorDictation.ts:18` | `src/vs/workbench/contrib/chat/browser/speechToText/dictationSession.ts` |
| `src/vs/workbench/contrib/browserView/test/electron-browser/tools/openBrowserTool.test.ts:17` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/contrib/browserView/test/electron-browser/tools/openBrowserTool.test.ts:22` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:24` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:26` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:33` | `src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditorInput.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:34` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:39` | `src/vs/platform/agentHost/common/copilotHome.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/browserViewWorkbenchService.ts:40` | `src/vs/workbench/contrib/chat/common/chatSessionsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/listBrowserPagesTool.ts:10` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/runPlaywrightCodeTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/readBrowserTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/navigateBrowserTool.ts:12` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/screenshotBrowserTool.ts:20` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/hoverElementTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserToolNonAgentic.ts:13` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/clickBrowserTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts:19` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts:20` | `src/vs/workbench/contrib/chat/common/constants.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts:21` | `src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatQuestionCarouselData.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts:22` | `src/vs/workbench/contrib/chat/common/model/chatModel.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/openBrowserTool.ts:23` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/browserToolHelpers.ts:14` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/typeBrowserTool.ts:14` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/dragElementTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts:14` | `src/vs/workbench/contrib/chat/browser/contextContrib/chatContextService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts:15` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/browserTools.contribution.ts:16` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/tools/handleDialogBrowserTool.ts:11` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:25` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:26` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:27` | `src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:28` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:43` | `src/vs/workbench/contrib/chat/browser/attachments/chatDynamicVariables.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:44` | `src/vs/workbench/contrib/chat/common/attachments/chatVariables.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:49` | `src/vs/workbench/contrib/chat/browser/chatPetAchievements.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserEditorChatFeatures.ts:50` | `src/vs/workbench/contrib/chat/browser/chatPetService.ts` |
| `src/vs/workbench/contrib/browserView/electron-browser/features/browserWelcomeFeature.ts:12` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignalDebuggerContribution.ts:10` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/accessibilitySignals/browser/editorTextPropertySignalsContribution.ts:20` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/update/browser/updateTitleBarEntry.ts:27` | `src/vs/workbench/contrib/chat/common/chatService/chatService.ts` |
| `src/vs/workbench/contrib/markers/browser/markersChatContext.ts:20` | `src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts` |
| `src/vs/workbench/contrib/markers/browser/markersChatContext.ts:21` | `src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.ts` |
| `src/vs/workbench/contrib/markers/browser/markersChatContext.ts:22` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/contrib/workspace/browser/workspaceTrustEditor.ts:43` | `src/vs/workbench/contrib/debug/browser/debugColors.ts` |
| `src/vs/workbench/contrib/bulkEdit/test/browser/bulkCellEdits.test.ts:14` | `src/vs/workbench/contrib/notebook/common/model/notebookTextModel.ts` |
| `src/vs/workbench/contrib/bulkEdit/test/browser/bulkCellEdits.test.ts:15` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/bulkEdit/test/browser/bulkCellEdits.test.ts:16` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/contrib/bulkEdit/browser/bulkCellEdits.ts:15` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/bulkEdit/browser/bulkCellEdits.ts:16` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/bulkEdit/browser/bulkCellEdits.ts:17` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/contrib/extensions/browser/fileBasedRecommendations.ts:25` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/extensions/common/installExtensionsTool.ts:10` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/extensions/common/searchExtensionsTool.ts:12` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/extensions/electron-browser/debugExtensionHostAction.ts:25` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchTestCommon.ts:18` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchTestCommon.ts:19` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchNotebookHelpers.test.ts:10` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchNotebookHelpers.test.ts:11` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchNotebookHelpers.test.ts:13` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findModel.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchNotebookHelpers.test.ts:19` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchResult.test.ts:27` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchResult.test.ts:30` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchResult.test.ts:31` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchResult.test.ts:32` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchViewlet.test.ts:22` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchActions.test.ts:19` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts:28` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts:31` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts:34` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts:35` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/test/browser/searchModel.test.ts:38` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/contrib/search/browser/searchFindInput.ts:12` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findFilters.ts` |
| `src/vs/workbench/contrib/search/browser/searchFindInput.ts:13` | `src/vs/workbench/contrib/notebook/browser/contrib/find/notebookFindReplaceWidget.ts` |
| `src/vs/workbench/contrib/search/browser/replaceService.ts:30` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/browser/replaceService.ts:31` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/contrib/search/browser/searchChatContext.ts:14` | `src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts` |
| `src/vs/workbench/contrib/search/browser/searchView.ts:58` | `src/vs/workbench/contrib/notebook/browser/notebookEditor.ts` |
| `src/vs/workbench/contrib/search/browser/searchView.ts:76` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/contrib/search/browser/searchWidget.ts:39` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findFilters.ts` |
| `src/vs/workbench/contrib/search/browser/searchWidget.ts:42` | `src/vs/workbench/contrib/notebook/common/notebookEditorInput.ts` |
| `src/vs/workbench/contrib/search/browser/searchWidget.ts:47` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/browser/AISearch/aiSearchModel.ts:17` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService.ts:12` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService.ts:21` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService.ts:23` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers.ts:10` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:15` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:16` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findModel.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:17` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:18` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:19` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModel.ts:20` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModelBase.ts:7` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/search/browser/notebookSearch/notebookSearchModelBase.ts:8` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/searchTreeModel/folderMatch.ts:21` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/searchTreeModel/searchResult.ts:13` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/search/browser/searchTreeModel/searchResult.ts:14` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/search/browser/searchTreeModel/fileMatch.ts:19` | `src/vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel.ts` |
| `src/vs/workbench/contrib/search/browser/searchTreeModel/searchTreeCommon.ts:14` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/testing/test/common/testingChatAgentTool.test.ts:18` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/testing/browser/testResultsView/testResultsViewContent.ts:31` | `src/vs/workbench/contrib/debug/browser/callStackWidget.ts` |
| `src/vs/workbench/contrib/testing/common/testingChatAgentTool.ts:31` | `src/vs/workbench/contrib/chat/common/tools/languageModelToolsService.ts` |
| `src/vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.ts:11` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:22` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:23` | `src/vs/workbench/contrib/notebook/browser/notebookEditorExtensions.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:24` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:25` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:27` | `src/vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:28` | `src/vs/workbench/contrib/notebook/common/notebookKernelService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:32` | `src/vs/workbench/contrib/interactive/browser/interactiveCommon.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:34` | `src/vs/workbench/contrib/notebook/browser/notebookOptions.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:46` | `src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:47` | `src/vs/workbench/contrib/notebook/common/notebookContextKeys.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:51` | `src/vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:52` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:59` | `src/vs/workbench/contrib/interactive/browser/replInputHintContentWidget.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditor.ts:63` | `src/vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:38` | `src/vs/workbench/contrib/debug/browser/repl.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:39` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:40` | `src/vs/workbench/contrib/inlineChat/browser/inlineChatController.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:41` | `src/vs/workbench/contrib/interactive/browser/interactiveHistoryService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:42` | `src/vs/workbench/contrib/notebook/browser/controller/coreActions.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:43` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:44` | `src/vs/workbench/contrib/notebook/browser/notebookEditorWidget.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:45` | `src/vs/workbench/contrib/notebook/browser/notebookIcons.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:46` | `src/vs/workbench/contrib/notebook/browser/replEditorAccessibleView.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:47` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:48` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:49` | `src/vs/workbench/contrib/notebook/common/notebookContextKeys.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:50` | `src/vs/workbench/contrib/notebook/common/notebookEditorInput.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:51` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/repl.contribution.ts:52` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorAccessibilityHelp.ts:12` | `src/vs/workbench/contrib/notebook/common/notebookContextKeys.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:15` | `src/vs/workbench/contrib/interactive/browser/interactiveHistoryService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:16` | `src/vs/workbench/contrib/notebook/common/model/notebookTextModel.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:17` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:18` | `src/vs/workbench/contrib/notebook/common/notebookEditorInput.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:19` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/contrib/replNotebook/browser/replEditorInput.ts:20` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/contrib/inlineCompletions/browser/inlineCompletionLanguageStatusBarContribution.ts:14` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts:23` | `src/vs/workbench/contrib/chat/browser/chat.ts` |
| `src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts:24` | `src/vs/workbench/contrib/chat/browser/attachments/chatContextPickService.ts` |
| `src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts:25` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts:26` | `src/vs/workbench/contrib/chat/common/attachments/chatVariableEntries.ts` |
| `src/vs/workbench/contrib/quickaccess/browser/viewQuickAccess.ts:24` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts:20` | `src/vs/workbench/contrib/chat/common/actions/chatContextKeys.ts` |
| `src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts:21` | `src/vs/workbench/contrib/mcp/common/mcpTypes.ts` |
| `src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts:16` | `src/vs/workbench/contrib/mcp/common/mcpTypes.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:14` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:15` | `src/vs/platform/agentHost/common/agentHostConnectionsService.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:16` | `src/vs/platform/agentHost/common/agentHostUri.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:17` | `src/vs/platform/agentHost/common/fileEditAttribution.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:18` | `src/vs/platform/agentHost/common/state/protocol/common/actions.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:19` | `src/vs/platform/agentHost/common/state/protocol/commands.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:20` | `src/vs/platform/agentHost/common/state/sessionActions.ts` |
| `src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts:21` | `src/vs/platform/agentHost/common/state/sessionState.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/editTelemetryContribution.ts:18` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/editTelemetry.contribution.ts:17` | `src/vs/platform/agentHost/common/agentHostSchema.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:12` | `src/vs/platform/agentHost/common/state/protocol/common/actions.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:13` | `src/vs/platform/agentHost/common/state/sessionState.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:14` | `src/vs/platform/agentHost/common/agentHostConnectionsService.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:15` | `src/vs/platform/agentHost/common/agentHostUri.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:16` | `src/vs/platform/agentHost/common/fileEditAttribution.ts` |
| `src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts:18` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/contrib/customEditor/browser/customEditorInputFactory.ts:17` | `src/vs/workbench/contrib/notebook/common/notebookEditorInput.ts` |
| `src/vs/workbench/contrib/remote/test/browser/urlFinder.test.ts:12` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/remote/browser/remoteExplorer.ts:22` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/contrib/remote/browser/urlFinder.ts:9` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/browser/layout.ts:19` | `src/vs/platform/chat/common/chatSettings.ts` |
| `src/vs/workbench/browser/actions/quickAccessActions.ts:14` | `src/vs/platform/chat/common/chatSettings.ts` |
| `src/vs/workbench/browser/actions/developerActions.ts:62` | `src/vs/platform/agentHost/common/agentService.ts` |
| `src/vs/workbench/browser/actions/developerActions.ts:63` | `src/vs/platform/agentHost/common/agentHostEnablementService.ts` |
| `src/vs/workbench/browser/parts/titlebar/commandCenterControl.ts:27` | `src/vs/platform/chat/common/chatSettings.ts` |
| `src/vs/workbench/api/test/browser/TestMainThreadNotebookKernels.ts:9` | `src/vs/workbench/contrib/notebook/common/notebookKernelService.ts` |
| `src/vs/workbench/api/test/browser/TestMainThreadNotebookKernels.ts:12` | `src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts` |
| `src/vs/workbench/api/test/browser/TestMainThreadNotebookKernels.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/api/test/browser/TestMainThreadNotebookKernels.ts:14` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/api/test/browser/extHostNotebookKernel.test.ts:22` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/test/browser/extHostNotebookKernel.test.ts:23` | `src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts` |
| `src/vs/workbench/api/test/browser/extHostNotebook.test.ts:16` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/test/browser/mainThreadVariableProvider.test.ts:15` | `src/vs/workbench/contrib/notebook/common/notebookKernelService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookSaveParticipant.ts:16` | `src/vs/workbench/contrib/notebook/common/notebookEditorModel.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDto.ts:7` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDto.ts:8` | `src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDto.ts:9` | `src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocuments.ts:11` | `src/vs/workbench/contrib/notebook/common/model/notebookTextModel.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocuments.ts:12` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocuments.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.ts` |
| `src/vs/workbench/api/browser/mainThreadDebugService.ts:8` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/browser/mainThreadDebugService.ts:15` | `src/vs/workbench/contrib/debug/common/abstractDebugAdapter.ts` |
| `src/vs/workbench/api/browser/mainThreadDebugService.ts:17` | `src/vs/workbench/contrib/debug/common/debugUtils.ts` |
| `src/vs/workbench/api/browser/mainThreadDebugService.ts:19` | `src/vs/workbench/contrib/debug/common/debugVisualizers.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookKernels.ts:16` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookKernels.ts:17` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookKernels.ts:18` | `src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookKernels.ts:19` | `src/vs/workbench/contrib/notebook/common/notebookKernelService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookKernels.ts:22` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/api/browser/viewsExtensionPoint.ts:25` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookRenderers.ts:9` | `src/vs/workbench/contrib/notebook/common/notebookRendererMessagingService.ts` |
| `src/vs/workbench/api/browser/mainThreadEditorTabs.ts:20` | `src/vs/workbench/contrib/interactive/browser/interactiveEditorInput.ts` |
| `src/vs/workbench/api/browser/mainThreadEditorTabs.ts:23` | `src/vs/workbench/contrib/notebook/common/notebookEditorInput.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocumentsAndEditors.ts:16` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocumentsAndEditors.ts:17` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocumentsAndEditors.ts:18` | `src/vs/workbench/contrib/notebook/common/model/notebookTextModel.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookDocumentsAndEditors.ts:19` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/api/browser/mainThreadComments.ts:26` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/api/browser/mainThreadInteractive.ts:10` | `src/vs/workbench/contrib/interactive/browser/interactiveDocumentService.ts` |
| `src/vs/workbench/api/browser/mainThreadBulkEdits.ts:14` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebook.ts:16` | `src/vs/workbench/contrib/notebook/common/notebookCellStatusBarService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebook.ts:17` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebook.ts:18` | `src/vs/workbench/contrib/notebook/common/notebookService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookEditors.ts:11` | `src/vs/workbench/contrib/notebook/browser/notebookBrowser.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookEditors.ts:12` | `src/vs/workbench/contrib/notebook/browser/services/notebookEditorService.ts` |
| `src/vs/workbench/api/browser/mainThreadNotebookEditors.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/api/common/extHostNotebookDocuments.ts:10` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHostNotebookKernels.ts:23` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHostNotebookKernels.ts:24` | `src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts` |
| `src/vs/workbench/api/common/extHostNotebookKernels.ts:28` | `src/vs/workbench/contrib/notebook/common/notebookKernelService.ts` |
| `src/vs/workbench/api/common/extHostApiCommands.ts:21` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHost.api.impl.ts:26` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/common/extHostDebugService.ts:18` | `src/vs/workbench/contrib/debug/common/abstractDebugAdapter.ts` |
| `src/vs/workbench/api/common/extHostDebugService.ts:19` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/common/extHostDebugService.ts:20` | `src/vs/workbench/contrib/debug/common/debugUtils.ts` |
| `src/vs/workbench/api/common/extHostNotebookDocument.ts:13` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHost.protocol.ts:57` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/common/extHost.protocol.ts:58` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHost.protocol.ts:59` | `src/vs/workbench/contrib/notebook/common/notebookExecutionService.ts` |
| `src/vs/workbench/api/common/extHost.protocol.ts:60` | `src/vs/workbench/contrib/notebook/common/notebookExecutionStateService.ts` |
| `src/vs/workbench/api/common/extHost.protocol.ts:61` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/api/common/extHostNotebook.ts:27` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHostTypeConverters.ts:39` | `src/vs/workbench/contrib/debug/common/debug.ts` |
| `src/vs/workbench/api/common/extHostTypeConverters.ts:40` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHostTypeConverters.ts:41` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/common/extHostTypeConverters.ts:42` | `src/vs/workbench/contrib/notebook/common/notebookRange.ts` |
| `src/vs/workbench/api/common/extHostTypes/workspaceEdit.ts:10` | `src/vs/workbench/contrib/notebook/common/notebookCommon.ts` |
| `src/vs/workbench/api/node/extHostDebugService.ts:15` | `src/vs/workbench/contrib/debug/common/abstractDebugAdapter.ts` |
| `src/vs/workbench/api/node/extHostDebugService.ts:16` | `src/vs/workbench/contrib/debug/node/debugAdapter.ts` |
| `src/vs/workbench/api/node/extHostDebugService.ts:17` | `src/vs/workbench/contrib/debug/node/terminals.ts` |
| `src/vs/workbench/services/assignment/test/common/assignmentFilters.test.ts:14` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/services/assignment/common/assignmentFilters.ts:14` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/services/workspaces/test/common/workspaceTrust.test.ts:24` | `src/vs/platform/agentHost/common/agentHostUri.ts` |
| `src/vs/workbench/services/workspaces/common/workspaceTrust.ts:17` | `src/vs/platform/agentHost/common/agentHostUri.ts` |
| `src/vs/workbench/services/policies/test/browser/accountPolicyGateContribution.test.ts:21` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/services/policies/browser/accountPolicyGateContribution.ts:22` | `src/vs/workbench/services/chat/common/chatEntitlementService.ts` |
| `src/vs/workbench/services/localTranscription/browser/localTranscriptionService.ts:9` | `src/vs/platform/localTranscription/common/localTranscription.ts` |
| `src/vs/workbench/services/localTranscription/electron-browser/localTranscriptionService.ts:11` | `src/vs/platform/localTranscription/common/localTranscription.ts` |


## 人工核对与实施分工

127 API候选现已完成，精确最终pure data/actor/prune与验证见 [M6-legacy-api.md](M6-legacy-api.md)。下文pure data表是只读调查时的迁出候选；实施删除无保留消费者的旧wire DTO后，Debug仅三项data声明、Notebook仅24项data声明，无需保留Config/Adapter/Execution wire types。

本调查以最终完整 source/build 可达图为边界：先解绑 retained owner，再删除专属源；专属 owner 本身退休时整文件/目录 prune，不用其报错恢复运行服务。root 的 126 已接 `workbench/browser/workbench.contribution.ts` 四个 AI 配置、`workbench/browser/quickaccess.ts` 对应 typing、`platform/accessibilitySignal/browser/accessibilitySignalService.ts` Chat / voice / edits kept / undone 专属 signal/sound。保留通用 progress、nextEditSuggestion、inlineSuggestion。本记录只给定位，不重复编辑。

### 追加 exact prune 父目录

| Exact path | 处置前提 / 理由 |
| --- | --- |
| `src/vs/workbench/services/localTranscription` | 两个 browser/electron-browser 实现仅平台 transcription 的客户端；删除入口后与平台目录一起退休。 |
| `src/vs/platform/networkFilter` | 五文件含专属测试。当前 source 外部消费者只有 agentHost / sandbox / Chat fetchPageTool/chat.shared.contribution；不是普通网络、HTTP、socket 安全模块。消费者退休后 prune。 |
| `src/vs/workbench/contrib/replNotebook` | 六文件；Notebook 派生 Interactive/REPL editor，入口 `workbench.common.main.ts` 的 contribution 先删。 |
| `src/vs/workbench/contrib/remoteCodingAgents` | 两文件，remote coding agent 的贡献与服务，仅 AI 域；不是普通 extension host / remote connection。 |
| `src/vs/workbench/contrib/search/browser/notebookSearch` | 五文件，Notebook 搜索 runtime；普通 Search owner 必须先拆 cell/output 搜索分支。 |
| `src/vs/workbench/contrib/search/browser/AISearch` | 两文件，AITextSearchHeading/AIFolderMatch 实现；不能直接删，目前普通 searchResult/searchView/searchCompare/searchResultsView/searchActionsRemoveReplace 仍引用。完整 AI Search 分支解绑后 prune。 |
| `src/vs/workbench/services/notebook` | 先将下文 URI 纯数据 helper 迁出并解绑普通 labels；余下 NotebookDocumentWorkbenchService 是运行服务，应随 Notebook 退休。 |

首表 23 父目录加本表七项形成 30 个尚存在父目录候选；Notebook / Debug 仅在稳定数据迁出后可整父目录删除。已有 `patches/light/prune.json` 内 agentHost / sessions 子项必须在最终 light manifest 合并到这些父目录，避免父子重叠与重复缺失检查。不要改前置 root prune 的执行历史来掩盖路径缺失。

### 追加 exact 叶路径

以下路径在本次交付时仍存在于事实 snapshot，专属功能，不应为了完整编译留在保留域。代码入口可能已在 121 等补丁解除，仍需实际 prune。dictation、markersChatContext/scmHistoryChatContext/searchChatContext、installExtensionsTool/searchExtensionsTool现已由root移除，不再加入最终prune，避免missing path exit4。

```text
src/vs/workbench/contrib/authentication/browser/actions/manageTrustedMcpServersForAccountAction.ts
src/vs/workbench/contrib/authentication/browser/actions/manageAccountPreferencesForMcpServerAction.ts
src/vs/workbench/services/authentication/browser/authenticationMcpAccessService.ts
src/vs/workbench/services/authentication/browser/authenticationMcpUsageService.ts
src/vs/workbench/services/authentication/browser/authenticationMcpService.ts
src/vs/workbench/services/authentication/test/browser/authenticationMcpAccessService.test.ts
src/vs/workbench/services/userDataProfile/browser/mcpProfileResource.ts
src/vs/workbench/contrib/editTelemetry/browser/telemetry/agentHostEditMarkerService.ts
src/vs/workbench/contrib/editTelemetry/test/browser/agentHostEditMarkerService.test.ts
src/vs/workbench/contrib/testing/common/testingChatAgentTool.ts
src/vs/workbench/contrib/testing/test/common/testingChatAgentTool.test.ts
src/vs/workbench/test/browser/aiCustomizationManagementSectionRegistry.test.ts
src/vs/workbench/contrib/accessibilitySignals/browser/accessibilitySignalDebuggerContribution.ts
src/vs/workbench/contrib/extensions/electron-browser/debugExtensionHostAction.ts
src/vs/workbench/contrib/bulkEdit/browser/bulkCellEdits.ts
src/vs/workbench/contrib/bulkEdit/test/browser/bulkCellEdits.test.ts
src/vs/workbench/contrib/welcomeGettingStarted/common/media/notebookProfile.ts
src/vs/workbench/contrib/welcomeGettingStarted/common/media/notebookThemes
src/vs/workbench/contrib/welcomeGettingStarted/common/media/debug.svg
src/vs/workbench/contrib/welcomeGettingStarted/common/media/ai-powered-suggestions.svg
src/vs/workbench/contrib/welcomeGettingStarted/common/media/customize-ai.svg
src/vs/workbench/contrib/welcomeGettingStarted/common/media/multi-file-edits.svg
```

`mcpProfileResource.ts` 是运行导入/导出和 UI 实现；持久 profile DTO 的 `mcpResource` / `mcp` 字段不等同 MCP runtime。遵守 D8，不能用字符串清零删除既有用户目录或让旧 profile validation 全失败。root 必须决定旧 metadata 的容错形状；删除 UI resource handler 与 initializer，保存其他 profile 资源。

Component fixtures 专属 Chat / agentsVoice / Sessions / Notebook / Debug 内容及公共 helper 拆分由 fixture worker 接，不直接把整 `componentFixtures/editor` 或整个 fixtureUtils 删掉。上表测试叶仅供最终 prune；需要 root 确认 path 在新基线存在，若此前补丁已删除，应从最终清单移出。

### 保留普通消费者的具体解绑

| Retained owner | 必須拆出的边 / 保留行为 |
| --- | --- |
| `services/authentication/test/browser/authenticationQueryServiceMocks.ts:10,12,13,134,203,293` | 删除 MCP 三 import 和 `TestMcpUsageService` / `TestMcpAccessService` / `TestMcpService`。全 src TestMcp 查询只有这三个定义，无普通 query test 引用。保留 BaseTestService、TestPreferencesService、普通 extension access/usage/provider/session helper。`authenticationQueryService.test.ts` 当前已经没有 MCP 测试。 |
| `contrib/welcomeGettingStarted/common/gettingStartedContent.ts:8,13,55,430–435,508–529` | 删 notebookProfile import/provider、NotebookSetting import、完整 Notebooks walkthrough、Debug step/command `workbench.action.debug.selectandstart`；更新 New File 文案不推介退休 notebook，保留手填 Welcome/普通语言扩展/Task walkthrough。媒体 SVG 中普通 `--vscode-debugToolBar-background` 是颜色引用，不能机械删除普通 openFolder.svg。 |
| `contrib/comments/**` 与 `api/browser/mainThreadComments.ts:26` | 普通 editor comments 保留，`ICellRange`/`isICellRange` 数据迁出；Notebook comment editor 运行分支需另删。不能整 Comments 目录 prune。 |
| `contrib/search/browser/searchFindInput.ts:12–13`, `searchWidget.ts:39,42,47`, `searchView.ts:58,76`, `replaceService.ts:30–31` | 去 Notebook FindFilters/widget/input/service DI 与 cell URI replace 分支；保留普通文本 FindInput/搜索结果/文件批量 replace。 |
| `contrib/search/browser/searchTreeModel/{folderMatch,fileMatch,searchResult,searchTreeCommon}.ts` | 移除 NotebookEditorWidget / Notebook find decoration models / Notebook result interfaces。AI search heading/cancel/query/render/result compare 和 action 分支须同步删除，不把任何 ordinary Search 文件从 tsconfig 排除。 |
| `contrib/search/test/**` | 去 Notebook stubs/cases 与 AI search cases；普通 searchModel/searchResult/query/action 测试保留。 |
| `contrib/bulkEdit/browser/bulkEditService.ts` 与 retained preview files | 先撤 BulkCellEdits 和 Notebook edit-preview 分支，再删上述专属 runtime/test；普通 text/file WorkspaceEdit 仍有效，稳定 Notebook WorkspaceEdit DTO 形状仍可构造，执行须明确不可用。 |
| `contrib/customEditor/browser/customEditorInputFactory.ts:17` | 去 NotebookEditorInput instance 分支，保留普通 custom editor/serializer。 |
| `contrib/languageDetection/browser/languageDetection.contribution.ts:23` | 去 NotebookContextKeys gate，只保留普通文本语言检测。 |
| `services/extensions/common/fileBasedRecommendations.ts:25` | Notebook editor/文件推荐路径不应加载 Notebook runtime；保留普通文件扩展推荐。 |
| `contrib/remote/browser/urlFinder.ts:9,54,70–80,106–127`、`remoteExplorer.ts:22` 与 URLFinder tests | 删 IDebugService 参数、debug session/repl listeners、processNewReplElements/replPositions，仅保留 Terminal URL 检测。普通 terminal/link forwarding 不随 Debug 退休。 |
| `contrib/accessibilitySignals/browser/editorTextPropertySignalsContribution.ts:20` | 移除 Debug breakpoint DI/分支；普通 marker/error/warning/line signals 保留；Debug 专属 contribution 可 prune。 |
| `contrib/workspace/browser/workspaceTrustEditor.ts:43` | Debug colors 中普通警告色共享引用迁到通用颜色落点或明确普通色；不为单色保留完整 Debug 注册。 |
| `contrib/testing/browser/testResultsViewContent.ts:31` | DebugCallStackWidget 运行依赖必须解绑；Testing 域整体是否也既已退休应按现有 root prune 事实判断，不能为它恢复 Debug runtime。 |
| `contrib/update/browser/updateTitleBarEntry.ts:27,90,107,109` | 删 IChatService DI/chat progress 隐藏 gate；保留普通更新提示。 |
| `contrib/inlineCompletions/browser/inlineCompletionLanguageStatusBarContribution.ts:14,31,37` | 去 ChatEntitlement sentiment gate；若整个贡献仅 Copilot 状态则撤注册并精确 prune，不删普通 extension inline-completion provider runtime。 |
| `contrib/editTelemetry/browser/editTelemetryContribution.ts:18`、`contribution.ts:17` | 去 entitlement/agentHost schema/marker provider；普通编辑 telemetry 依计划保留。 |
| `services/assignment/common/assignmentFilters.ts:14` 与测试 | 去 ChatEntitlement filter；普通 assignment / tas-client 保留。 |
| `services/workspaces/common/workspaceTrust.ts:17` 与测试 | 去 isAgentHostUri 信任快捷分支；普通 workspace trust 保留。 |
| `contrib/policies/browser/accountPolicyGateContribution.ts:22` 与测试 | 去 entitlement/AI 消费；普通账户 policy gate 保留。 |
| `services/userDataProfile/browser/userDataProfileInit.ts:19,84–85`、`userDataProfileImportExportService.ts` | 撤 MCP initializer/import/export UI resource，实现旧数据宽容；保留 profile/settings/extensions/keybindings/tasks 的普通导入导出。 |
| `browser/layout.ts:19,135–136,3043`、`browser/actions/quickAccessActions.ts:14,21,183`、`browser/parts/titlebar/commandCenterControl.ts:27,29,168` | 去 Chat settings / unified agent bar / agent status imports、配置 gate与UI分支；普通 layout/quickAccess/command center 保留。 |
| `contrib/developer/browser/developerActions.ts:62–63` | 去 agentHost 专属诊断 process/provider，普通开发者进程/extension-host工具保留。 |

完整逐条 import 行在前面的扫描表；上表是人工确认的行为处置，不替代最终全图编译。

## 稳定 API 纯数据最小迁出落点

`notebookCommon.ts` 与 `debug.ts` 都不是纯 types 文件。前者 import NotebookTextModel / Kernel / Execution、创建 RawContextKey、实现 MIME排序/工作副本；后者 import DebugModel/Source/CompoundRoot、定义 context keys/createDecorator/运行服务。不能整文件或整个 common 目录保留后声称运行实现已移除。

| 当前 source 与 symbols | 保留/迁出方案 |
| --- | --- |
| `contrib/notebook/common/notebookRange.ts:6–22` | `ICellRange` + `isICellRange` 完全纯数据/guard，无 import/DI。建议迁 `workbench/common/notebookRange.ts`，普通 Comments/API 改 import。余下 cellRanges 算法只有 Notebook 功能消费者时可随父目录删；若保留稳定 API converter 所需算法，逐函数选择。 |
| `contrib/notebook/common/notebookCommon.ts:45,88–147,203–212,297–415,447–578,890–901,924–937,1002–1005,1026–1037,1130` | 新 `api/common/notebookTypes.ts` 仅迁调用方仍需要的 CellKind/CellEditType/CellStatusbarAlignment/NotebookCellsChangeType、Metadata/TransientOptions/输出与 cell edits/事件 DTO/ContributionData/ExtensionDescription/Filter/StatusBarItem/KernelSourceAction。不得迁 NotebookTextModel/service/context keys。保持现有 enum 数值和 WorkspaceEdit 序列化字段。 |
| `contrib/notebook/common/notebookExecutionService.ts:13–31` + `notebookExecutionStateService.ts:14–50` | protocol 还存在 Notebook contract 时，仅迁 CellExecutionUpdateType、输出 edit DTO、ICellExecutionStateUpdate、ICellErrorStackFrame/ICellExecutionError/ICellExecutionComplete；不得迁 createDecorator 或执行服务。 |
| `services/notebook/common/notebookDocumentService.ts:23–99` | `parse/generate/parseMetadataUri/generateMetadataUri/extractCellOutputDetails` 只处理 URI/base64，可独立迁 `workbench/common/notebookUri.ts`；`INotebookDocumentService`/NotebookDocumentWorkbenchService/Singleton 是运行服务，不保留。普通 labels 不应因 URI helper 带入 Notebook 服务。 |
| `contrib/debug/common/debug.ts:230–235,837–873,904–925,932–936,978–987,1384–end` | 新 `api/common/debugTypes.ts` 可迁纯 session REPL/test reference、config DTO、adapter descriptor DTO、DebugConfigurationProviderTriggerKind、DebugVisualization DTO/枚举/URI序列化；IConfig 的类型闭包包含 IEnvConfig/ITaskIdentifier/ConfigurationTarget，逐项核对，不复制 DebugModel/Source/service。 |
| `api/common/extHostTypes.ts`、`api/common/extHostTypes/workspaceEdit.ts:10` | 原稳定 Notebook/Debug constructors/enums 保留；WorkspaceEdit 当前仅需 CellEditType/ICellMetadataEdit/IDocumentMetadataEdit。不能把 API 纯标准数据误当 retired runtime。 |
| `contrib/debug/common/abstractDebugAdapter.ts`、`debugUtils.ts` | 前者有 timer/request/response/queue 的真实 adapter runtime，后者有 Debug runtime依赖。旧 extHostDebugService actor 不能用“types兼容”理由保留，稳定 API调用需本地 unavailable 外壳。 |

root 已分配 127 API worker（本 agent）在私有副本处理 `workbench/api/**` Notebook/Interactive/Debug actor/runtime 边、上述纯 data 落点与对应 API factory/protocol/converter/service entry。root 自己仍拥有 main/shared/workbench entry/CLI/build/metadata；fixtures 由另一个 worker 管理。127 不重复改已完成 AI/Browser 契约。纯数据保留不等同授权重新启用任何 retired API/后台。

## 主进程、IPC、CLI 与构建入口

| 文件与定位 | 处理内容 / 不可误删 |
| --- | --- |
| `code/electron-main/app.ts:47–48,134–142,1197–1199,1235–1242` | 撤 sandbox helper、Native MCP discovery/gateway、webContentExtractor DI 与 channel server：`webContentExtractor`、`sandboxHelper`、`NativeMcpDiscoveryHelper`、`mcpGateway`。通用 platform/debug extension-host close/reload bridge 必须保留。 |
| `code/electron-utility/sharedProcess/sharedProcessMain.ts:125–134,353–357,403,419–420,473–474` | 撤 MCP management/gallery/resource/allowedServers DI 与 `mcpManagement` IPC、shared extractor server/DI。保留文件/pty/普通共享进程服务。 |
| `code/node/cliProcessMain.ts:68,71–77,242–246,337–338` | 撤 MCP CLI/management 配置实例化与 add-mcp执行；旧参数入口改可读拒绝 exit1。 |
| `code/node/cli.ts:40,99–101,266,305–306,326`、`platform/environment/node/argv.ts:18,51–61,135,465,516`、`environment/common/argv.ts:28` | 去 Chat subcommand/help/stdin/context与add-mcp运行链；保留识别 legacy 形式并拒绝的最小 parser，显式 `-- chat` 应是普通同名文件。root 实施/实际CLI验收。 |
| `code/electron-main/main.ts:600–609`、`platform/windows/electron-main/windowsMainService.ts:292,497,521–538` | 去 handleChatRequest 与 `vscode:handleChatRequest`、chat profile/new/reuse window转发。 |
| `code/electron-main/app.ts:1054,1084–1086` | 去 openChatSession 特殊 URL 路由及 session extraction。普通 extension URI/external opener fallback保留。 |
| `platform/localTranscription/node/localTranscriptionMain.ts:19` | 专属utility server `localTranscription`，父目录退休后 build entry同步删。 |
| `workbench.common.main.ts`、`workbench.desktop.main.ts`、`workbench.web.main.ts` | 前表列出了 service + contribution side effects，每一个都先撤；还需撤 replNotebook、remoteCodingAgents、services/notebook entry（初始23父目录未覆盖）。不能只删 renderer contribution而保留 utility/client后台。 |
| `build/buildfile.ts:24,56–57` | localTranscriptionMain、agentHostMain、agentHost diffWorkerMain入口必须删，否则打包/编译仍找退休路径。 |
| `build/gulpfile.vscode.ts:33,109,252–253,325–337` | dictation runtime/agent SDK imports与复制stamp、Chat pets媒体、MXC filters随专属实现清除；普通 packaging/i18n/task仍保留。 |
| `build/gulpfile.reh.ts:416–423` | agent SDK stamp生产复制清除；普通 extension host打包继续存在。 |
| `build/dictation-runtime`、`build/agent-sdk` | 专属下载/produce/package/stamp闭包候选。M7 manifest/copy全图核实后 prune，不把 source 已删误当下载已停。 |
| `build/npm/postinstall.ts:322–365` | FoundrySdk patches/loadAddon/core override专属逻辑移除；普通 node-gyp/platform生产安装继续。 |
| `build/codex/check-protocol-sync.ts` 与其专属测试、`build/lib/test/agentHostDependencies.test.ts` | 生成 agentHost protocol 校验/依赖测试随退休代码精确删除；不是普通 API protocol校验。 |
| `build/darwin/create-universal-app.ts:87,125–126,142` | MXC crosscopy/unpacked/singleArchFiles移除，普通 universalmerge保留。 |
| `build/npm/dirs.ts:53`、`test/mcp` | MCP 专属安装/测试fixture入口退休；不是普通测试 Playwright。 |
| `build/filters.ts:216,247,257` | agentHost generated protocol / 专属资源 filters精简；仍有普通同名资源时精确匹配。 |
| `build/lib/i18n.resources.json:374,672` 等 | 已退休 service/sessions contribution 的翻译metadata精确对象删除，不删普通翻译构建。 |
| `package.json:87–88,128,282` | perf:chat scripts、Foundry生产dependency/allowScripts清理；root/remote manifests、lock生产图由M7核实。测试 @playwright/test、profiling chrome-remote-interface必须保留；DEV @vscode/telemetry-extractor 不是 webContentExtractor。 |
| `product.json` API proposal allowlist 与 branding metadata | 移除 retired proposed API / defaultChatAgent 对象；混合allowlist中的 ordinary proposals/auth数据保留。 |

## 验证界限与剩余未知

仅做只读 source/import/registration/package/build 文件核对，未运行任何新测试、构建、GUI或CI。731条 graph包含语法 import，不包含 manifest字符串、configuration/command IDs、IPC channel名的隐式可达边；上述人工项补足关键入口，不能把 import表数量当完整构建证明。

M6 尚需全 source typecheck验证迁出 DTO 闭包、shared helper实际消费者与 prune重叠；M7 尚需 npm productiongraph +asar/unpacked/copy/download实证。稳定 API无能力行为、enum/data constructors保持及actor ID集合应由127独立合同测试验证。CLI legacy拒绝与同名文件、旧profile Chat/Browser恢复及普通extension-host启动属于root实机验收，未在本调查完成。

需要实施时作最终判断的两项：Testing剩余 owner是否已在 root退休域（若保留则拆 DebugCallStackWidget）；旧 userDataProfile MCP persisted DTO以D8兼容保存到何种最小形状。其余路径处置由本记录明确给出。另由129调查追加的普通Search actors内AI provider/RPC、protocol/factory AISearchKeyword数据边界见127记录末尾，待root共同闭包。snapshot在并行worker只改私有copy时仍是fact来源；后续patch串行集成改变行号后以symbol/源路径定位。
