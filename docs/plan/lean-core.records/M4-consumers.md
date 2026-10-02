# M4 普通消费者解绑

- 计划：[lean-core.md](../lean-core.md) §5.4–5.7 / M4 / V6–V8。
- 最近更新：2026-10-01 22:28 +1000。
- 状态：消费者补丁已交付；M4 整体验收未完成。
- 仓库基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；源码为 prepared + `114-light-extension-host-lifecycle.patch`，上游 `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。本补丁为 `patches/121-light-ordinary-consumers.patch`，不把生成树或私有提交冒充产品构建来源。
- 私有源码：`/tmp/lean-core-consumers-63n1yg22`；输入取自 `dev/lean-core-baseline.env` 所指根目录的 `vscodium/vscode`。复制参数为 `rsync -a --exclude=/.git/ --exclude=/out*/ --exclude=node_modules/`，保留 source 中的 outline/output；node_modules 仅 symlink 只读使用，编译输出到 `privateout`，未改共享 vscode/、依赖目录或基线。

## 实现

| 保留面 | 解绑与保留行为 |
| --- | --- |
| 设置 / JSON | `PreferencesSearchService.getAiSearchProvider`、EmbeddingsSearchProvider/AiSearchProvider/SettingsRecordProvider 删除；LocalSearchProvider、TfIdfSearchProvider、RemoteSearchProvider（本地 TF-IDF）保留。SettingsEditor2 的 AI toggle、异步后台搜索、ChatEntitlement DI 删除；普通筛选、结果排序/去重、JSON、扩展推荐保留。McpSettingsRenderer、MCP workspace 特例、AI TOC/命令/快捷键/图标删除。 |
| 扩展市场与 enablement | 删除 plugin update DI 和语言模型 SearchExtensionsTool 注册、@mcp/@agentPlugins 自动补全/独立路由、AI enable/disable 动作、Copilot unification 与 builtin Chat 迁移。普通 installed/enabled/disabled/recommended 分类、普通全局/工作区启用、由环境启用、扩展包卸载保持普通规则。历史 `@mcp @installed` 不再走独立 MCP 市场。 |
| Quick Access / Symbols / Outline | 命令语义 AI picks、Ask in Chat、Quick Chat command center、文件/符号 Chat 附件删除；普通 fuzzy picks、打开/侧边打开、历史、文件/工作区符号与非文本 editor Outline 保留。基类要求的 additional-picks 钩子明确返回 false/[]，没有替代 AI 服务。 |
| SCM / Problems | 删除 resolve-conflict/commit-message AI setup 动作、ChatEditing dirty-diff 抑制分支和 Chat context contributions。普通 SCM 输入动作、取消、diff、历史、问题列表保留。`SCMHistoryItemTransferData` 从专属 Chat context 文件迁至 `scm/common/history.ts`，保留历史视图 Drag & Drop；两个 ChatContext 可选方法删除。 |
| Accessibility | Speech 动态设置/贡献、Chat 语音与信号设置、Chat hints、Chat codeblock DI/bridge/导航菜单与快捷键删除；platform AccessibleView 契约同步移除 Chat context/导航方法。普通 Help/View、编辑器/终端/hover/通知/评论与 diff signals 保留。状态查询的 isInCodeBlock 返回 false；没有 Null 服务。 |
| 空编辑器 / Welcome / Issue | 删除 Dictation 入口、empty editor Chat DI/生成提示、Welcome Agent banner/路由/启动选项/newWorkspaceChat、dictation walkthrough。语言选择空编辑器提示、普通 walkthrough 与手填 Issue 标题/描述/提交保留；Issue LM DI、生成按钮/事件/处理与独占 CSS 删除。 |
| ImageCarousel | 仅删除 imageCarousel.chat.enabled 和 workbench.action.chat.openImageInCarousel 的附件参数/动作；普通 Explorer action、editor、输入、serializer、媒体分类/读取保留。 |

未引入 Null Chat/MCP 服务、any 或 tsconfig 排除。`services/accessibility/**` 调查未发现待解绑专属服务入边，无需修改。

补丁源路径（51 个文件；141 行新增、2307 行删除）：

```text
src/vs/platform/accessibility/browser/accessibleView.ts
src/vs/workbench/contrib/accessibility/browser/accessibility.contribution.ts
src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts
src/vs/workbench/contrib/accessibility/browser/accessibleView.ts
src/vs/workbench/contrib/accessibility/browser/accessibleViewActions.ts
src/vs/workbench/contrib/accessibility/browser/editorAccessibilityHelp.ts
src/vs/workbench/contrib/codeEditor/browser/codeEditor.contribution.ts
src/vs/workbench/contrib/codeEditor/browser/emptyTextEditorHint/emptyTextEditorHint.ts
src/vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess.ts
src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts
src/vs/workbench/contrib/extensions/browser/extensionsActions.ts
src/vs/workbench/contrib/extensions/browser/extensionsViewlet.ts
src/vs/workbench/contrib/extensions/browser/extensionsViews.ts
src/vs/workbench/contrib/extensions/browser/extensionsWorkbenchService.ts
src/vs/workbench/contrib/extensions/common/extensionQuery.ts
src/vs/workbench/contrib/extensions/common/extensions.ts
src/vs/workbench/contrib/extensions/test/common/extensionQuery.test.ts
src/vs/workbench/contrib/extensions/test/electron-browser/extensionsActions.test.ts
src/vs/workbench/contrib/extensions/test/electron-browser/extensionsViews.test.ts
src/vs/workbench/contrib/imageCarousel/browser/imageCarousel.contribution.ts
src/vs/workbench/contrib/imageCarousel/browser/imageCarouselEditor.ts
src/vs/workbench/contrib/issue/browser/baseIssueReporterService.ts
src/vs/workbench/contrib/issue/browser/issueReporterOverlay.ts
src/vs/workbench/contrib/issue/browser/media/issueReporterOverlay.css
src/vs/workbench/contrib/issue/electron-browser/issueReporterEditorPane.ts
src/vs/workbench/contrib/markers/browser/markers.contribution.ts
src/vs/workbench/contrib/preferences/browser/preferences.contribution.ts
src/vs/workbench/contrib/preferences/browser/preferencesActions.ts
src/vs/workbench/contrib/preferences/browser/preferencesIcons.ts
src/vs/workbench/contrib/preferences/browser/preferencesRenderers.ts
src/vs/workbench/contrib/preferences/browser/preferencesSearch.ts
src/vs/workbench/contrib/preferences/browser/settingsEditor2.ts
src/vs/workbench/contrib/preferences/browser/settingsLayout.ts
src/vs/workbench/contrib/preferences/browser/settingsTree.ts
src/vs/workbench/contrib/preferences/browser/settingsTreeModels.ts
src/vs/workbench/contrib/preferences/common/preferences.ts
src/vs/workbench/contrib/quickaccess/browser/commandsQuickAccess.ts
src/vs/workbench/contrib/scm/browser/quickDiffModel.ts
src/vs/workbench/contrib/scm/browser/scm.contribution.ts
src/vs/workbench/contrib/scm/browser/scmHistoryViewPane.ts
src/vs/workbench/contrib/scm/browser/scmInput.ts
src/vs/workbench/contrib/scm/common/history.ts
src/vs/workbench/contrib/search/browser/anythingQuickAccess.ts
src/vs/workbench/contrib/search/browser/search.contribution.ts
src/vs/workbench/contrib/search/browser/symbolsQuickAccess.ts
src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution.ts
src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.ts
src/vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent.ts
src/vs/workbench/services/extensionManagement/browser/extensionEnablementService.ts
src/vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test.ts
src/vs/workbench/services/preferences/browser/preferencesService.ts
```

## 统一删除清单与剩余入边

以下专属实现/测试由主 agent 加入最终 prune；本补丁已移除普通消费者对这些模块的导入与注册，不直接删除文件：

```text
src/vs/workbench/contrib/codeEditor/browser/dictation/
src/vs/workbench/contrib/markers/browser/markersChatContext.ts
src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts
src/vs/workbench/contrib/search/browser/searchChatContext.ts
src/vs/workbench/contrib/extensions/common/installExtensionsTool.ts
src/vs/workbench/contrib/extensions/common/searchExtensionsTool.ts
```

跨范围保留文件的下一步：

- `workbench/browser/workbench.contribution.ts`：删 workbench.settings.showAISearchToggle、commandPalette.showAskInChat/experimental.enableNaturalLanguageSearch/askChatLocation schema；settings.enableNaturalLanguageSearch 属于保留本地 TF-IDF 开关，不能连带删除。
- `workbench/browser/quickaccess.ts`：清除上述 command palette 的三项 config typing。
- `platform/accessibilitySignal/browser/accessibilitySignalService.ts`：统一删 Chat 信号注册；本补丁已删除所属设置。
- `services/extensions/common/extensionManifestPropertiesService.ts` 的 Agents window metadata、普通 extension enablement 的 isSessionsWindow 分类仍为纯 window 支持判断，未连接 Chat/agentHost；与主 agent metadata/Sessions 收口一起处理，勿误删普通 enablement。
- `welcomeGettingStarted/common/gettingStartedContent.ts` 仍导入 NotebookSetting 与 notebookProfile media，仍有 debugging/notebooks walkthrough；`contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint.ts` 使用旧父类签名。属于已退休 Debug/Notebook/Interactive 闭包，交 M6 统一删除/解绑，不以保留其目录绕过编译。

普通保留消费者扫描中剩余的 Chat/MCP 字符串只有查询行为的负向测试；未改专属源码仍有专属导入，不能宣称完整源码图零引用。

## 验证

| 条件 | 命令 / 环境 | 结果与证据 |
| --- | --- | --- |
| 基线全量 src | `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`，prepared +114 | 退出 0；`/tmp/lean-core-consumers-63n1yg22/baseline-tsc.log` 空。 |
| 行为红 / 绿 | `node test/unit/node/index.js --run src/vs/workbench/contrib/extensions/test/common/extensionQuery.test.ts`；红使用 git show HEAD 的原生产 extensionQuery.ts 单独转译，测试为新增断言 | 原模块 6 passing /1 failing，失败为仍提供 @mcp；最终模块 7 passing（含 runner Errors 检查）。日志 query-red.log / query-green.log。其他主线修改没有声称均先写红测试。 |
| SettingsTreeModels / SCM History / Markers | `node test/unit/browser/index.js --browser chromium --run …settingsTreeModels.test.ts --run …scmHistory.test.ts --run …markersModel.test.ts` | 25 passing，实际 headless Chromium。初次同批另四模块因漏复制源 JS 404 未加载，已纠正资源复制，不能算初次通过。affected-browser.log。 |
| Settings renderer / SettingsEditor2 / 手填 Issue | 同 runner，settingsTree.test.ts、settingsEditor2.test.ts、issueReporterOverlay.test.ts | 8 passing；remaining-browser.log 中另124个 enablement 测试最初2项失败、122通过，不以整批退出码作通过。 |
| ExtensionEnablement | 同 runner，仅重跑受失败影响的 extensionEnablementService.test.ts | 修复普通 EnabledByEnvironment 分支后124 passing。enablement-green.log。 |
| ExtensionsViews / ExtensionsActions | 同 runner、私有 runner 放开 electron-browser suite 的 headless 加载（不进入交付补丁） | 254 passing /4个5000ms超时。仅这4项在原三个生产模块恢复后重复：0 passing /4个相同超时。保留缺口，不声称 Electron suite 正式通过。extensions-headless.log / extensions-baseline-failing.log。 |
| 最终全量 src | `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit` | 退出1，42条错误；普通保留域零错误，退休域清单见下表。final-tsc.log / tsc-errors.json。没有 exclude。 |
| 输出仅供测试 | `tsc -p src/tsconfig.json --noCheck --outDir privateout`，源 JS/CSS/JSON/assets 复制至 privateout，out 为本地 symlink | 仅生成私有测试 JS；不把 noCheck 当类型验证或产品构建通过。 |
| 补丁重放 | `/tmp/lean-core-consumers-check-63n1yg22` 为私有干净 HEAD worktree；`git apply --check …121…patch`、实际 apply、`git diff --check`；修改侧 reverse --check | 全部退出0。 |
| GUI / CI / packing / 完整 DI/actor 闭包 | 未运行 | 主 agent 集成其余层及 M6 prune 后验收；这里不冒充完整 M4/M6、真实 UI 或 CI 通过。 |

4个超时分别为 ExtensionsViews 的 Test default view actions required sorting，ExtensionsActions 的 Test Install action when state is uninstalled、Test UpdateAction when extension is installed outdated and user extension、Test UpdateAction when extension is installing and outdated and user extension。没有扩大超时时间或跳过这些测试。

所有日志在私有源码根目录，上述日志未写入用户生成树。最终42条 TypeScript 错误对应入边：

| 待退休 sourcepath | 条数 |
| --- | --- |
| `src/vs/sessions/contrib/chat/browser/newChatInput.ts` | 2 |
| `src/vs/sessions/contrib/chat/browser/sessionsChatAccessibilityHelp.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityProvider.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityService.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatResponseAccessibleView.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/accessibility/chatTerminalOutputAccessibleView.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp.ts` | 2 |
| `src/vs/workbench/contrib/chat/browser/actions/chatCodeblockActions.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/agentPluginsView.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/chatPetAchievements.contribution.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatCollapsibleContentPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownContentPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatProgressContentPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatQuestionCarouselPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatToolInputOutputContentPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/codeBlockPart.ts` | 2 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatOtherClientToolProgressPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatTerminalToolProgressPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolProgressPart.ts` | 1 |
| `src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts` | 2 |
| `src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts` | 2 |
| `src/vs/workbench/contrib/chat/electron-browser/actions/voiceChatActions.ts` | 2 |
| `src/vs/workbench/contrib/chat/test/browser/widget/chatContentParts/chatSubagentContentPart.test.ts` | 1 |
| `src/vs/workbench/contrib/inlineChat/browser/inlineChatWidget.ts` | 3 |
| `src/vs/workbench/contrib/mcp/browser/mcpServersView.ts` | 1 |
| `src/vs/workbench/contrib/notebook/browser/contrib/editorHint/emptyCellEditorHint.ts` | 1 |
| `src/vs/workbench/contrib/scm/browser/scmHistoryChatContext.ts` | 2 |
| `src/vs/workbench/contrib/terminalContrib/chat/browser/terminalChatAccessibilityHelp.ts` | 1 |
| `src/vs/workbench/contrib/terminalContrib/chat/browser/terminalChatAccessibleView.ts` | 1 |
| `src/vs/workbench/contrib/terminalContrib/inlineHint/browser/terminal.initialHint.contribution.ts` | 2 |
| `src/vs/workbench/contrib/terminalContrib/voice/browser/terminalVoice.ts` | 1 |

主 agent 可从这份清单合并 M6 prune 与 API/协议更改后重新做完整 src 编译，不能以本 worker 的局部通过判定 M4 已完成。
