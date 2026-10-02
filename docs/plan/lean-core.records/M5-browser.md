# M5 Browser 消费者候选实现

本记录交付补丁 124 与专属删除清单，不将 M4/M5 标为完成。真实宿主、GUI、旧 profile 的恢复与最终打包图仍由主 agent 在完整候选上验收。仅运行本次受影响的服务检查；之前已绿且未受影响的 namespace、Mermaid 等检查沿用。

## 基线与隔离

- root HEAD：`f1961b7546139a6aa722ff0b8a001296d3041e33`。
- 上游 vscode HEAD：`08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`；输入为 prepared 生成态，包含既有裁剪补丁与本轮 M4 集成候选，不能直接把 124 应到裸上游。
- 主集成私有源码：`/tmp/lean-core-api-5_lg434f/vscode`，其 git HEAD `ad154d6d582ac01dda528c738d8e09c9da765a10` 之外还有 114–120/122/123 与 119 修改、45+14 个专属文件删除；输入不是干净 HEAD。创建快照后单独同步 121 最终的 `src/vs/workbench/contrib/preferences/browser/settingsLayout.ts`、`src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts`，再冻结消费者 preimage。
- worker 源码：`/tmp/lean-core-m5-browser-wf39i60l/source`，7 个修改文件的独立 preimage commit：`7b72b07323759a3496465bcfcdc722e513f9b76a`。重放目录：`/tmp/lean-core-m5-browser-wf39i60l/replay`。
- rsync 排除 `.git`、所有 `node_modules`、锚定根 `/out*/`、精确目录名 `out`/`dist`/`*-out`、`.build`；没有使用全树 `out*`，普通 `src/vs/editor/contrib/documentSymbols/browser/outlineModel.ts` 等文件保留。根/build node_modules 为只读使用的 symlink；没有安装包或写入它们。生成的 headless bundle、metafile 与 replay 均落在 worker 私有根；用户 `vscode/`、既有 app、root 计划和共享 source 未修改。
- 源码修改只写以下 7 个普通消费者；专属目录/文件只在独立快照中物理删除以调查闭包，不导出整文件删除补丁。主 agent 单写 factory/protocol、app/sharedProcess、workbench 入口和 build/product/prune。

## 补丁 124 的普通功能边界

补丁：[124-light-browser-consumers.patch](../../../patches/124-light-browser-consumers.patch)，10,560 字节，SHA-256 `9b8e39c9619efb323ea541497f7eb95f0a79529c9f73e27c26e028ab5a0f7a5b`。7 files，5 insertions / 35 deletions；没有生成 bundle。

以下路径均相对 vscode 源码根。

| 文件/符号 | 实施结果 | 保留边界与证据 |
| --- | --- | --- |
| `src/vs/platform/native/electron-main/auth.ts:ProxyAuthService` | 去 BrowserSession import、专属 WebContents 分类与 login 跳过分支；去 LoginEvent 中无消费者的 webContents 字段，Electron listener 的位置参数保留为 `_webContents`。 | 普通代理 credentials、retry suppression、同目标请求合并、Electron callback/preventDefault、storage/dialog 服务和 listener disposal 保留。auth dialog 中其他 webContents 用途不动。实际类 headless 验证见下。 |
| `src/vs/workbench/browser/parts/editor/editorConfiguration.ts:DynamicEditorConfigurations` | 从 auto-lock 默认集合和额外 editor 列表去 `mainThreadWebview-simpleBrowser.view`。 | 保留 markdown.preview、terminalEditor、processExplorer 与第三方 Live Preview 的 `mainThreadWebview-browserPreview`；没有修改普通 HTML text editor resolver 或普通 Webview API。 |
| `src/vs/workbench/contrib/preferences/browser/settingsLayout.ts` | 去 `workbench/browser` 分类与 `workbench.browser.*` 独占分组。 | 基线已经包含 121 的 AI 搜索解绑，124 不带回旧 AI 节点；普通设置分类保留。旧设置存储不迁移、不删除。 |
| `src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts` | 去 BrowserElementCommenting 的 verbosity enum 和注册属性。 | 只改 Browser 两处，121 的其他改动保持；其他 accessible view 解绑已在完整 121 实现；本快照只补同步两个与 124 重叠的文件，类型审计中会看见这个不完整前置。 |
| `src/vs/platform/accessibility/browser/accessibleView.ts:AccessibleViewProviderId` | 去 BrowserElementCommenting 内部 provider ID。 | 引用只在 Browser 专属功能，普通 accessible-view provider/navigation 不动；Chat/Sessions 的其他 ID 留 M6 收口。 |
| `src/vs/platform/actions/common/actions.ts:MenuId` | 去 BrowserNavigationToolbar、BrowserActionsToolbar、BrowserChatActionsMenu、BrowserEmulationToolbar。 | 全源码逐项引用检查：仅本文件定义及 `workbench/contrib/browserView/electron-browser/features/**` 使用。普通菜单及外链动作保留。 |
| `src/vs/workbench/contrib/remote/common/remote.contribution.ts` | 3 条端口转发 OpenBrowser/OpenBrowserOnce 说明改为 external browser，去 embedded browser 提示。 | 原 enum 值、OpenPreview 与 generic tunnel/action/service 保留。`tunnelView.ts:OpenPortInBrowserAction` 使用 `allowContributedOpeners:false`；OpenPortInPreviewAction 沿用 generic opener。第三方预览扩展可继续提供 opener。 |

旧 `workbench.externalUriOpeners` 的 `simpleBrowser.open` 映射不做修复写入。Simple Browser provider 不存在时，现有 `ExternalUriOpenerService.getConfiguredOpenerForUri` 找不到 ID 后继续 eligible opener 选择；没有候选时 `openExternal` 返回 false。普通 `editor/browser/services/openerService.ts:_doOpenExternal` 随后执行 default external opener。保留这个现有契约，未新增兼容服务或空实现。

## 专属退休清单（交 root prune）

4 个目录 + 14 个精确文件，均在独立快照删除。补丁 124 本身不包含这些删除。

```text
src/vs/platform/browserView
src/vs/workbench/contrib/browserView
src/vs/workbench/services/browserView
extensions/simple-browser
src/vs/workbench/api/browser/mainThreadBrowsers.ts
src/vs/workbench/api/common/extHostBrowsers.ts
src/vs/workbench/api/test/browser/extHostBrowsers.test.ts
src/vs/workbench/api/browser/mainThreadBrowserTunnelProxy.ts
src/vs/workbench/api/common/extHostBrowserTunnelProxy.ts
src/vs/workbench/api/node/extHostBrowserTunnelProxy.ts
src/vs/platform/tunnel/common/tunnelProxy.ts
src/vs/platform/tunnel/node/tunnelProxy.ts
src/vs/platform/tunnel/node/selfSignedCert.ts
src/vs/platform/tunnel/test/node/tunnelProxy.test.ts
src/vs/platform/tunnel/test/node/selfSignedCert.test.ts
extensions/vscode-api-tests/src/singlefolder-tests/browser.test.ts
extensions/vscode-api-tests/src/singlefolder-tests/browser.cdp.test.ts
extensions/vscode-api-tests/src/singlefolder-tests/browser.tools.test.ts
```

目录覆盖底层 BrowserSession/View/Group、内置 CDP transport/target/types、Browser UI/editor/input/serializer/localhost opener、preload 与 Electron inspector、Playwright service/channel/tab，以及 Simple Browser activation、Webview serializer/provider、preview declarations/CSS/media/package manifest。`src/vs/workbench/services/browserView/**` 的 PlaywrightWorkbenchService 同属退休，不只是 contrib/platform 两个目录。

`platform/tunnel/common/tunnelProxy.ts:ITunnelProxyInfo` 的生产消费者仅 BrowserSessionRemote、BrowserView 的 DTO/服务、MainThreadBrowserTunnelProxy，以及 shared protocol 的对应 Shapes。`node/tunnelProxy.ts:TunnelProxy` 的唯一生产使用是 NodeExtHostBrowserTunnelProxy；`node/selfSignedCert.ts:generateSelfSignedCert` 只被 TunnelProxy 使用。其两个单测只测这一专属代理。因此精确删这 5 个 tunnel 文件，保留其他 tunnel 文件、MainThreadTunnel/ExtHostTunnel、远程 resolver、node-pty 与端口转发。

Browser API 稳定声明并非整个普通 Webview 声明：全局 proposed Browser d.ts 如仍用于 factory 的原权限检查/类型签名，应由 root 按不可用 API 契约保留纯声明，不能通过删声明掩盖实现错误。内置 Simple Browser 私有 declarations 随专属目录删除。`vscode-api-tests` 只列 Browser 3 个专属用例，其余扩展 API 测试和 extension manifest 由 root 独立保留。

## shared 面交接与构建项补漏

主 agent 的 125负责 Browser/BrowsersTunnel 4 actor IDs/Shapes、factory imports/构造获取/7 个 proposed 入口原权限后 unavailable、common/node DI、main/shared services/channels、桌面入口、构建/安装/预加载资产。124 不修改这些文件，ExtHost/MainThread actor assert 未过滤。

针对 M1 冻结入边，逐一交接的安装/构建项为：

| shared 文件 | Browser/Simple Browser 专属项 |
| --- | --- |
| `build/gulpfile.extensions.ts` | Simple Browser tsconfig compilation entry |
| `build/npm/dirs.ts` | `extensions/simple-browser` dependency install dir |
| `build/lib/extensions.ts` | Simple Browser preview esbuild entry |
| `build/filters.ts` | Simple Browser JS/codicon.css filter |
| `build/gulpfile.vscode.ts` | BrowserView preload output/copy path |
| `build/next/index.ts` | BrowserView standalone preload build entry |
| `build/checker/layersChecker.ts`、`build/checker/tsconfig.electron-browser.json` | BrowserView preload layer/include special cases |
| `build/lib/i18n.resources.json` | BrowserView resource bundle |
| `src/vs/code/electron-main/app.ts` | BrowserView/Group service/channel 与特定导航例外，普通服务/频道方法结构必须完整 |
| `src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts` | PlaywrightChannel 注册 |
| `src/vs/workbench/workbench.desktop.main.ts` | BrowserView 与 PlaywrightWorkbenchService 入口 |
| `src/vs/workbench/workbench.web.main.ts` | BrowserView contribution side-effect import，初版 125 漏此普通 Web 入口，root 已补入新版 125 |

root build/product/prepare/prune 必须保证退休 extension 不再打包或安装，preload literal 资产不复制。CRI profiling 的 `chrome-remote-interface` 等普通诊断消费者未动；不能按 CDP/Browser 字眼删 Electron 窗口/DOM、`base/browser`、微软认证 loopback/openExternal 或普通 browser window API。

## 验证与当前缺口

受影响 headless 检查：`node /tmp/lean-core-m5-browser-headless.mjs`，最终 exit 0，日志 `/tmp/lean-core-m5-browser-headless.log`，386 字节，SHA-256 `c41c9384c3bbc568298aebfe31b0923cdfccd4f2aac9230772cc9c1840c636b6`。

- bundle 的确是私有源码实际 `ProxyAuthService` 和实际 `ExternalUriOpenerService`，不是抽取方法或复写实现。Electron 只替代 app EventEmitter；四个未调用的 native UI/storage DI 模块仅替代 decorator 声明，实例方法调用会由测试 forbidden proxy 抛错。没有修改源实现。
- ProxyAuthService：config credential lookup、第二次失败不复用 config credential、并发请求只读取一次 config、Electron login callback + preventDefault、普通非 proxy request 透传、dispose 移除 listener，均通过；无网络请求/GUI。
- ExternalUriOpenerService：localhost、127.0.0.1、[::1]、0.0.0.0、含 encoded path/query 的 HTTPS 共 5 URL；旧 `simpleBrowser.open` 配置与 preferred ID 无 provider 时返回默认回退信号；第三方 provider 仍可接管，显式 default 恢复回退；disposal 通过。系统外部浏览器是否实际打开仍属 root GUI 验收。
- private headless metafile 84 inputs，0 BrowserView/Simple Browser inputs；产物位于 `/tmp/lean-core-m5-browser-wf39i60l/headless`。
- `git diff --check` 通过；从独立 preimage 导出 7 文件，`git apply --check` + apply 通过，重放后与私有最终源码逐字节一致。

类型审计只执行一次：先 apply 初版 125（SHA-256 `c8be4431961a6c36d241ea6bc5a3e517b55def6ca5e0e67cdc23f52ad87f810e`），然后在 private source 执行：

```sh
node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit
```

exit 1；日志 `/tmp/lean-core-m5-browser-tsc.log`，58,141 字节，SHA-256 `051e7437e35cad667b51fcae9a14488273767a0888c72ccec0508dc5f281746d`。332 条诊断，7 个 124 修改文件均没有诊断；不是全量通过。

| 范围 | 诊断数 | 分类/最小收口建议 |
| --- | --- | --- |
| `src/vs/code/electron-main/app.ts` | 128 | 初版 125 用宽范围删除把两 Browser binding 区段之间普通 initServices 后半、initChannels method header 等一起摘掉，导致 accessor/disposables/mainProcessElectronServer 未定义及普通 imports unused。已即时通知 root；root 从 preimage 恢复普通块，仅逐项删 2 services.set 与专属 Browser channels，新版 125 已纠正。绝不能以 Null/any/排除编译修补。 |
| `src/vs/workbench/api/browser/mainThreadSCM.ts` | 4 | 私有快照尚未合完整 121：MainThreadSCM 先去 Chat context 方法，history interface 仍旧。root 当前完整 121 已去 history.ts 的 ChatContext 方法；不是当前 root 集成故障。 |
| `contrib/accessibility/browser/{accessibility.contribution,accessibleView,accessibleViewActions}.ts` | 4 | 私有快照只同步了 121 配置文件，其他对应 consumers 尚旧。root 当前完整 121 已无 speech 注册/code-block context 引用；不是当前 root 集成故障。124 不带入或修补这些无关文件。 |
| `src/vs/workbench/workbench.web.main.ts` | 1 | 初版 125 漏删 Browser side-effect import；新版 125 已补。 |
| Chat / Sessions /对应 component fixtures | 122 / 29 / 14 | 退休域待 M6 删除/fixture精确清理，不视为普通功能损坏。 |
| MCP 专属 + authentication MCP actions + inlineChat | 6 + 21 + 3 | 待 M6 退休专属文件，不改普通 auth/inline completion。 |

新版 125 为 18 files / 25,670 字节，SHA-256 `19ba3e27f39a66df307ce46d6a98c902280a8065f18982ded5599dd26432e168`。worker 已从 root 当前源码覆盖私有 app.ts，并删除私有 Web 入口 import；未额外跑全量检查。

这是初版 125 + 私有不完整 121 上的诊断证据，root 已修正 125 的 app 跨区段误删与 Web 入口遗漏；完整 121 在 root 当前候选也已应用。此 worker 不重复跑全 TS，最终完整候选的类型结果由 root 回报并独立记账，本记录不推定已绿。没有重复已绿普通消费者旧用例，也没有跑 GUI。

专属目录私有删除并 apply 初版 125 后，正则解析实际 import/export/dynamic-import 路径，初次留下 33 条 Browser 直接路径入边（不是宽泛 Browser 文本匹配）：1 条普通 Web 入口已在新版 125 纠正，32 条来自退休 Chat/Sessions/对应 fixtures 留 M6。证据 `/tmp/lean-core-m5-browser-imports.txt`，初版 125 运行留下的完整 import 证据文件未改，以下明细仅列待 M6 的 32 条。

```text
src/vs/sessions/sessions.web.main.ts:222: ../workbench/contrib/browserView/browser/browserView.contribution.js
src/vs/sessions/sessions.common.main.ts:489: ./contrib/browserView/browser/sessionBrowserView.contribution.js
src/vs/sessions/sessions.desktop.main.ts:97: ../workbench/services/browserView/electron-browser/playwrightWorkbenchService.js
src/vs/sessions/sessions.desktop.main.ts:189: ../workbench/contrib/browserView/electron-browser/browserView.contribution.js
src/vs/sessions/contrib/browserView/browser/sessionBrowserView.ts:10: ../../../../workbench/contrib/browserView/common/browserView.js
src/vs/sessions/contrib/browserView/browser/sessionBrowserView.ts:11: ../../../../workbench/contrib/browserView/common/browserEditorInput.js
src/vs/sessions/contrib/chat/test/browser/sessionBrowsersControl.test.ts:12: ../../../../../workbench/contrib/browserView/common/browserEditorInput.js
src/vs/sessions/contrib/chat/test/browser/sessionBrowsersControl.test.ts:13: ../../../../../workbench/contrib/browserView/common/browserView.js
src/vs/sessions/contrib/chat/browser/sessionBrowsersControl.ts:11: ../../../../workbench/contrib/browserView/common/browserEditorInput.js
src/vs/sessions/contrib/chat/browser/sessionBrowsersControl.ts:12: ../../../../workbench/contrib/browserView/common/browserView.js
src/vs/sessions/contrib/layout/test/browser/desktopSessionLayoutController.test.ts:24: ../../../../../workbench/contrib/browserView/common/browserEditorInput.js
src/vs/sessions/contrib/layout/browser/singlePane/singlePaneSharedHelpers.ts:8: ../../../../../workbench/contrib/browserView/common/browserEditorInput.js
src/vs/sessions/contrib/editor/browser/addTabActions.ts:15: ../../../../workbench/contrib/browserView/common/browserView.js
src/vs/workbench/test/browser/componentFixtures/chat/chatFixtureUtils.ts:41: ../../../../contrib/browserView/common/browserView.js
src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:13: ../../../../contrib/browserView/common/browserEditorInput.js
src/vs/workbench/test/browser/componentFixtures/sessions/sessionChatInputToolbar.fixture.ts:14: ../../../../contrib/browserView/common/browserView.js
src/vs/workbench/contrib/chat/test/browser/chatAttachmentResolveService.test.ts:15: ../../../browserView/common/browserView.js
src/vs/workbench/contrib/chat/test/browser/chatAttachmentResolveService.test.ts:16: ../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/test/browser/chatAttachmentResolveService.test.ts:17: ../../../../../platform/browserView/common/browserViewUri.js
src/vs/workbench/contrib/chat/test/browser/widget/chatTurnPills.test.ts:18: ../../../../browserView/common/browserView.js
src/vs/workbench/contrib/chat/browser/tools/clientToolSetsContribution.ts:11: ../../../../../platform/browserView/common/browserChatToolReferenceNames.js
src/vs/workbench/contrib/chat/browser/widget/chatTurnPills.ts:20: ../../../browserView/common/browserView.js
src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatInlineAnchorWidget.ts:55: ../../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/browser/actions/chatContextActions.ts:39: ../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgets.ts:70: ../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgets.ts:71: ../../../browserView/common/browserView.js
src/vs/workbench/contrib/chat/browser/attachments/chatImplicitContext.ts:32: ../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/browser/attachments/implicitContextAttachment.ts:41: ../../../browserView/common/browserView.js
src/vs/workbench/contrib/chat/browser/attachments/implicitContextAttachment.ts:42: ../../../../../platform/browserView/common/browserViewUri.js
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts:32: ../../../../../platform/browserView/common/browserViewUri.js
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts:33: ../../../browserView/common/browserEditorInput.js
src/vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.ts:34: ../../../browserView/common/browserView.js
```

待最终验收：root 全 source 类型检查/生产图及资产包闭包，真实宿主 Browser proposal 有权/无权错误与普通 command/document/Webview，真实外链/local URL/HTML text editor、第三方 Webview/SimpleBrowser旧配置回退、旧 Browser editor profile 恢复、无 CDP/backend 注册。以上均未在本 worker 预填通过。
