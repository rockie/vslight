# M3 — 145+146 真实产品矩阵的独立只读复核

2026-10-02。本记录只复核主线程已经保存的真实 macOS Electron webview 矩阵，不连接 CDP、不操作 GUI、不写 fixture request，也不修改源码、已签 app、共享 M3/M8 或主计划。机器记录见 [M3-product145-matrix.json](M3-product145-matrix.json)，保留每行身份、脚本来源、截屏 SHA-256、CSP、捕获时序及日志分类。

本次真实产品 DOM 为 **32/32 `DOM_CHECK_PASS`**。32 张 2880×1784 的 root viewport PNG 均逐张以原尺寸 `view_image` 查看；fixture 中的中文未见缺字方框，24 张合法图的标签未见裁剪，独立 editor 正常态右上四个操作图标可读。视觉复核发现 **4 张独立 editor 错误长行裁剪**，另有 2 张 ZenUML dark 固定白底的上游限制及 2 张 dark tidy-tree 对比度备注。因此不能把 32/32 DOM 通过记作完整 M3 通过。

证据入口：[/private/tmp/mm145-ejdnx3uk/evidence/matrix/summary.json](/private/tmp/mm145-ejdnx3uk/evidence/matrix/summary.json)，大小 533382 字节。原始 JSON 没有整份输出到工具对话。

## 逐图视觉复核

表中“通过”覆盖这张截图中的中文字形、标签完整性和图/控件可读性；不是交互验收。每格对应的 PNG 为 `<surface>-<theme>-<case>.png`，目录同证据入口。逐行备注和每张截图哈希保存在机器记录。

| Case | Markdown light | Markdown dark | Editor light | Editor dark |
| --- | --- | --- | --- | --- |
| flowchart | 通过 | 通过 | 通过 | 通过 |
| sequence | 通过 | 通过 | 通过 | 通过 |
| state | 通过 | 通过 | 通过 | 通过 |
| elk | 通过 | 通过 | 通过 | 通过 |
| tidy-tree | 通过 | 可读，对比度备注 | 通过 | 可读，对比度备注 |
| zenuml | 通过 | 上游固定白底，可读 | 通过 | 上游固定白底，可读 |
| invalid-flowchart | 错误完整换行 | 错误完整换行 | 错误长行裁剪 | 错误长行裁剪 |
| invalid-sequence | 错误完整换行 | 错误完整换行 | 错误长行裁剪 | 错误长行裁剪 |

两个 dark ZenUML 的外层工作台为 dark，图内仍是白底黑字，与各自 light 图内配色相同。标题、参与者和消息本身清楚；当前 `bodyClass`、`themeColors` 取自外层页面，无法证明图内主题正确。证据：[Markdown dark ZenUML](/private/tmp/mm145-ejdnx3uk/evidence/matrix/markdown-preview-dark-zenuml.png)、[Editor dark ZenUML](/private/tmp/mm145-ejdnx3uk/evidence/matrix/standalone-editor-dark-zenuml.png)。后续私有源码与模块边界追踪已确认这是冻结上游 native SVG 的固定配色限制，详见末节；没有将它判为 139/141 导致的产品回归。

四张 editor 非法图均能看到 Parse error、行号和中文代码片段，但末尾 `Expecting` 长列表保持单行，右侧内容超出视口而被裁剪，不能以 DOM 中存在完整错误文本替代视觉通过。证据：[light flowchart](/private/tmp/mm145-ejdnx3uk/evidence/matrix/standalone-editor-light-invalid-flowchart.png)、[light sequence](/private/tmp/mm145-ejdnx3uk/evidence/matrix/standalone-editor-light-invalid-sequence.png)、[dark flowchart](/private/tmp/mm145-ejdnx3uk/evidence/matrix/standalone-editor-dark-invalid-flowchart.png)、[dark sequence](/private/tmp/mm145-ejdnx3uk/evidence/matrix/standalone-editor-dark-invalid-sequence.png)。错误态图操作按钮未显示，符合现有错误 UI。

两张 dark tidy-tree 的左分支和叶节点采用浅灰字/浅绿底，视觉对比较弱，但本次标签仍可辨读，无缺字或裁剪。本次没有测试数值对比度门槛，不能宣称符合某个对比度标准。

## 身份、实际资源与捕获范围

32 行 `productIdentity` 规范化 realpath 后全部等于 [M8-final-artifact.json](M8-final-artifact.json) 的 `generation=145+146` app，`/var` 与 `/private/var` 是本机规范路径别名。fixture 的 `mermaidExtensionPath` 位于该 app 的 `Contents/Resources/app/extensions/mermaid-markdown-features`。没有读开发树 bundle 来替代正式产物。

全部 `scriptSources` 共四个，逐个将实际 webview resource URL 解码为文件并读字节核对，均位于同一 app 内：Markdown host 的 [media/pre.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/markdown-language-features/media/pre.js)（1804 字节，SHA-256 `fc9727a04053759cf768c410588faad706ee61c80ccb447bba453ac9566857d0`）、[media/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/markdown-language-features/media/index.js)（24899 字节，`dd9ddd892d77ac1d7fe95e155cd1d588d10527326777f67e14b77ec9726470a8`），以及下表两个 Mermaid JS。实际文件存在、来源与 hash 均写入机器记录。

| app 中 Mermaid 文件 | 实际字节 | 实际 SHA-256 | 与 M8 记录 |
| --- | ---: | --- | --- |
| [markdown-preview-out/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/markdown-preview-out/index.js) | 18642002 | `0d09676583cd95a5892f74c67cdbb7e2567e0a14cc1461373847c42c9854097e` | 一致 |
| [chat-webview-out/index-editor.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/chat-webview-out/index-editor.js) | 18502766 | `6b6b69f0dc77ab29293edd4a5b45eec226a53c823549c91362efe435d250b776` | 一致 |
| [chat-webview-out/codicon.css](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/chat-webview-out/codicon.css) | 133000 | `36b3e52baa002edf1502580acd7a778347ff4b455473d96a64a28bd57e81f641` | 一致 |

32 行均为连接后新目标（`existingTargetAtConnect=false`）、脚本执行前暂停（`pausedBeforeScripts=true`），已安装新 document instrumentation；时间顺序全部满足 `connectedAt ≤ selectedSessionAttachedAt ≤ csp.installedAt`。每张截图的 root target 与选中的 iframe 身份保存在原始证据。本审查只读这些既有证据，没有重新导航、抓屏或读取会话。

## CSP、字体与日志

32 行 `csp.violations` 全空，未见 `fontFaces.status=error`，无 CSP blocked reason；24 张合法图没有 `Runtime.exceptionThrown`。这与逐张中文检查共同支持这些 fixture 在该产物中未出现字体违规或中文缺字。未使用的 font face 可能保持 unloaded，不能把它误报为字体加载失败；本次也没有声称穷尽所有中文字符或所有字体。

日志并非全空：32 条 `Unrecognized feature: 'local-network-access'.` 为 webview preload 的 Permission Policy warning；17 条 Document `net::ERR_ABORTED` 均 `canceled=true` 且无 `blockedReason`，符合目标/文档切换时取消请求的特征，不能等价于“完全没有网络事件”；4 个 ZenUML 实例共 40 条 info/debug 诊断。另有 4 条 `Uncaught (in promise)` Parse error，恰好出现在 Markdown 两主题 × 两个非法 fixture，错误文本来自正式 Markdown Mermaid bundle，合法图没有此异常。保留这些事实，不以 DOM 通过掩盖控制台记录。

## 未关闭的门

本记录只覆盖这 32 个矩阵样例在保存视口的 DOM、视觉、来源、CSP 和日志。source/copy、pan/zoom/reset、动态主题切换时的 transform 保持、实际 quit/restart 后恢复由主线程另行执行，矩阵截图无法证明。错误截图仍须在最终正式 app 重验，serializer 的 source/身份回归也须走真实 quit/restart；ZenUML 固定白底按已确认的上游范围保留说明。本记录不将准备工作、headless 测试或当前 DOM pass 记为全部 M3 完成。

## 后续独立根因结论（仍不改写产品矩阵状态）

冻结 `@mermaid-js/mermaid-zenuml` 0.2.3 只调用 `renderToSvg(code)`，没有传入 theme/options；冻结 `@zenuml/core` 3.48.3 在 SVG compose 中忽略 options，输出固定白色 frame/header/participant 与 `#222` label。私有 [模块边界追踪](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid148-51j4buri/zenuml-theme-trace.json) 证明 VS Code 的 light/dark 变量都正确到达 Mermaid，而 native SVG 配色仍相同；即使直接给 core 提供 `theme-mermaid` options，inner SVG 也不变。139 的 addon 注册和 141 的同版本字体 URL 定位未删改该主题链。这是上游固定 SVG 样式的已知范围，图内本身仍可读；按主线程授权不新增复杂主题映射。

四张 editor 错误裁剪已在私有候选 148 中修复；同一候选也修复真实 restart 暴露的 source 模板空白累积与 raw hash 身份变化。详见独立 [148-evidence.md](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid148-51j4buri/148-evidence.md)。候选的实际 host HTML 与正式 145 editor bundle 在 headless 中通过错误和 source/identity 回归，但最终正式 app 的错误截图、全矩阵和真实 quit/restart 仍由主线程补验；这里保留 145+146 原始红例与视觉分类。

当主线程后续更新 M8 的当前产物时，本次核对的 145+146 manifest 原字节保存在 [product145-M8-final-artifact.json](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid148-51j4buri/product145-M8-final-artifact.json)，SHA-256 与机器记录的原始 `artifactManifest.sha256` 相同。
