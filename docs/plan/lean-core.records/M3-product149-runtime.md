# M3 最终 149 真实 Mermaid 运行验收

更新时间：2026-10-02 04:44 +1000（Australia/Sydney）。本记录只覆盖最终 `147+148+149` 原始 app 的 Mermaid 实机门；共享 M3/M8 状态由集成人回写。

实际 macOS Electron app 在全新私有 profile 上完成 **32/32 图表 DOM、32 张原图逐张视觉复核、33 步真实交互，以及普通退出→同 profile 重启恢复**。148 的四张独立 editor 长错误信息截图已从横向裁剪变为完整换行；恢复后的原始源码、webview ID、dark 主题及 numeric pan/zoom 均严格相等，没有使用 trim 或放宽 ID。

暗色 ZenUML 仍使用冻结上游的白底和 `#222` 字，不标为“图内 dark 适配完成”；两张实际暗色图内中文和标签可读。暗色 tidy-tree 的左侧浅灰字/浅绿分支对比偏弱，但文字完整可辨，保留此既有范围。32 张图均未见中文缺字方框或标签裁剪。

## 产物和执行身份

最终 app canonical 路径：`/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app`。构建 [build149-exit.json](/private/tmp/mm149-931ruovz/evidence/build149-exit.json) 为 `exit=0`，完成于 `2026-10-01T18:22:04.411468Z`。[inputs149.json](/private/tmp/mm149-931ruovz/evidence/inputs149.json) SHA-256 为 `2b69e1a39d1500599c55a31075cac07d06d5b1b3c344666504a88b0b274723e5`；与当前 M8 manifest 的 input 文件逐字节相同。

私有运行根目录：`/private/tmp/mm149-931ruovz`。独立 user-data `u`、extensions `e`、shared-data `s`、workspace `w`；仅连接自己的 CDP **19510**。实际启动 app 二进制，未加 headless 参数，未使用全局键盘或强制系统焦点。19480 和 19500 未被访问。独立测试扩展只通过普通 extension 命令打开真实产品的 preview/editor；渲染脚本全部来自此 app。

| 运行 | main PID | extension host PID | 正常退出 |
| --- | ---: | ---: | --- |
| 首次启动 | 90267 | 91406 | `workbench.action.quit`；exit 0，signal null |
| 同 profile 重启 | 93179 | 93874 | `workbench.action.quit`；exit 0，signal null |

启动前保存 app/version、构建输入、fixture 和 bundle 身份。32 个结果的 `productIdentity` 均为上述 app；4 个不同实际 `scriptSources` 均落在该 app 的 Markdown/Mermaid 扩展目录。三项 M8 Mermaid 资产的实际 bytes/SHA 与启动前和最新 [M8-final-artifact.json](M8-final-artifact.json) 完全一致：

| 资产 | bytes | SHA-256 |
| --- | ---: | --- |
| [markdown-preview-out/index.js](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/markdown-preview-out/index.js) | 18,642,002 | `0d09676583cd95a5892f74c67cdbb7e2567e0a14cc1461373847c42c9854097e` |
| [chat-webview-out/index-editor.js](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/chat-webview-out/index-editor.js) | 18,502,766 | `6b6b69f0dc77ab29293edd4a5b45eec226a53c823549c91362efe435d250b776` |
| [chat-webview-out/codicon.css](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/chat-webview-out/codicon.css) | 133,000 | `36b3e52baa002edf1502580acd7a778347ff4b455473d96a64a28bd57e81f641` |
| [dist/extension.js](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/extensions/mermaid-markdown-features/dist/extension.js)（另行追踪148 host修复） | 11,917 | `59c911a920f53e749adc09421ba3bb5d32cbd5e440adc75577e9e48040c0f6d9` |

最新 M8 快照已保存到私有证据 [M8-final-artifact149.json](/private/tmp/mm149-931ruovz/evidence/M8-final-artifact149.json)：generation `147+148+149`，1199 regular files / 422,445,837 bytes，ZIP 157,531,058 bytes。这里只核对 Mermaid 对应资产和输入身份；签名副本、ZIP 的整体交付门由集成人负责。

## 两 surface × 两主题 × 八 case

冻结合法用例保持 `expectValid=true`；错误用例只有未闭合 flowchart 和非法 sequence 两项。以下每格对应一张实际 root workbench viewport 原图（2880×1784），逐张用 `view_image(detail=original)` 查看，无拼图、裁剪或 headless 替代。32 个默认 execution contexts 均为实际 OOP iframe 的选定文档。

| case | Markdown light | Markdown dark | editor light | editor dark |
| --- | --- | --- | --- | --- |
| flowchart | PASS | PASS | PASS | PASS |
| sequence | PASS | PASS | PASS | PASS |
| state | PASS | PASS | PASS | PASS |
| ELK | PASS | PASS | PASS | PASS |
| tidy-tree | PASS | PASS（对比偏弱） | PASS | PASS（对比偏弱） |
| ZenUML | PASS | 上游固定白底，可读 | PASS | 上游固定白底，可读 |
| invalid-flowchart | PASS 错误态 | PASS 错误态 | PASS 完整换行 | PASS 完整换行 |
| invalid-sequence | PASS 错误态 | PASS 错误态 | PASS 完整换行 | PASS 完整换行 |

正常图的中文根/节点、边、时序注释或 ZenUML 标题均可读；editor 四个 pan/zoom/reset 控件图标清楚。八个错误态均显示真实 parser 的中文上下文、caret、完整 Expecting 和末尾 got；editor 隐藏无效图控制。四张 editor 错误原图完整可读，作为148布局修复的正式产品绿证据；前序145四张横向裁剪红证据保留在 [M3-product145-matrix.md](M3-product145-matrix.md) 和 [JSON](M3-product145-matrix.json)。

ZenUML 的原因已有私有148证据：冻结 `@mermaid-js/mermaid-zenuml 0.2.3` 调用 `renderToSvg(code)` 未传主题，冻结 `@zenuml/core 3.48.3` 的原生 SVG 合成使用固定主题且忽略 options。light/dark variables 实际到达 Mermaid；[vsCodeTheme.ts](/tmp/lean-core-api-5_lg434f/vscode/extensions/mermaid-markdown-features/preview-src/shared/vsCodeTheme.ts) 与冻结 VSCode HEAD `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5` 同 SHA `ced57079d15522367bf8ddb45c2a1c59ddd777c6b9ba9c501b6ffce823441989`。139/141/148 没有破坏原有主题传参，不新增复杂主题系统。

## 交互和严格恢复

33 步实际产品交互覆盖：按 source、webview ID、active 三条路打开；ID/active 两条路复制；真实 trusted mouse zoom-in/out、pan-toggle/drag、按钮 reset；ID/active 普通命令 reset；dark→light→dark 的真实主题切换和 numeric transform 保留。全部断言通过。底层 helper 原始 `INTERACTION_CHECKS_PASS_RESTART_PENDING` 记录保留，其待办由本次真实重启和严格复制证据完成。

恢复门采用83字符原始 flowchart（含原始缩进和末尾 LF），精确 ID `165d2776`。交互中的两次复制，以及重启前/后的 ID 与 active 两条路共六次复制，均直接用 JS 严格字符串相等；没有 trim。实际 profile SQLite `state.vscdb` 与 backup 在两次正常退出后只读核对，均保存同一83字符源码、相同 hash 和 panZoom。

| 恢复字段 | 退出前 | 新进程恢复后 |
| --- | --- | --- |
| 原始 source | 83字符，精确原文 | 83字符，精确原文 |
| webview ID | `165d2776` | `165d2776` |
| theme | dark | dark |
| scale | 1.25 | 1.25 |
| translate x/y | 429.75 / 225 | 429.75 / 225 |

重启前后原图中文、控件均完整可读。图内 viewBox 从 `316×368.5` 变为 `290×336`，pan-mode pressed 从 true 回到 false；numeric transform 始终是 `translate(429.75px,225px) scale(1.25)`。145 的 [145 restore-before.json](/private/tmp/mm145-ejdnx3uk/evidence/interactions/restore-before.json) 与 [145 restore-current-id.json](/private/tmp/mm145-ejdnx3uk/evidence/restore-current-id.json) 已有完全相同的 viewBox/pan-mode 差异。冻结上游的 `PanZoomState` 只保存 scale/translateX/translateY，panModeEnabled 为初始化 false 的临时字段；主题切换重新渲染与重新初始化的布局尺寸差异不属于148新增回归。本记录证明精确 source/ID/theme/panZoom 恢复，没有扩大为像素布局或临时 pan 按钮状态一致。

## CSP、字体和日志边界

32 张矩阵文档均为连接后新建 target、`pausedBeforeScripts=true`、`newDocumentInstrumentation=true`，在新文档初始化即安装 CSP 监听；安装时刻与 timeOrigin 差在约 -0.4～0.7ms。全部实际 DOM 含真实 CSP meta，**0 CSP violation、0 font error face、合法图0 runtime exception**。editor 保持 nonce script CSP 与 `font-src data:`，没有 unsafe-eval；codicon 加载成功、原图四图标可读。Markdown 未使用的 KaTeX face 为 unloaded，不当作字体错误。

矩阵日志逐条分类：32条 `Unrecognized feature: local-network-access` PermissionPolicy 警告；14条 canceled Document `net::ERR_ABORTED`；ZenUML 40条 info/debug；仅4个 Markdown 非法图有预期 parser `Uncaught (in promise)`（均含 parseError）。没有布局 fallback 或合法图异常。

私有 profile 全部 host 日志无 `[error]`，但并非全无 warning：14条 `created a webview without a content security policy`，5条上游扩展 resource scoped configuration，4条正常退出的 backup tracker suspended，以及 Markdown server 的模块类型诊断。145 profile 已有17条相同 missing-CSP warning。冻结 Webview 初始化 HTML 为空，content options 更新会发送当前内容，外层 pre 在没有 meta 时发出 no-csp-found；这是初始/中间文档警告的代码入口。此次没有捕获每个中间空文档的实时内容，不能逐条证明警告仅来自空文档；32个最终图文档均带 CSP且无违反，与 host warning 如实并列记录，不写“全日志干净”。

重启后 target 在 CDP 连接前已存在，`pausedBeforeScripts=false`；其采样观察到0 CSP violation和字体 loaded，但不能据此断言重启启动首段 console/CSP 全覆盖。完整早期监听由32图新建文档矩阵提供；恢复门依赖真实新 PID、host serializer、最终实际 DOM、截图、精确复制和 SQLite 状态。

## 证据和清理

入口：私有 [run-summary.json](/private/tmp/mm149-931ruovz/evidence/run-summary.json)；完整矩阵 [matrix/summary.json](/private/tmp/mm149-931ruovz/evidence/matrix/summary.json)（大文件，不整份 text 输出）；33步交互 [interactions/summary.json](/private/tmp/mm149-931ruovz/evidence/interactions/summary.json)；重启证据 [restore-after.json](/private/tmp/mm149-931ruovz/evidence/restore-after.json) 和 [原图](/private/tmp/mm149-931ruovz/evidence/restore-after.png)、[restore-comparison.json](/private/tmp/mm149-931ruovz/evidence/restore-comparison.json)、[before-restart-exact-source.json](/private/tmp/mm149-931ruovz/evidence/before-restart-exact-source.json)、[after-restart-exact-source.json](/private/tmp/mm149-931ruovz/evidence/after-restart-exact-source.json)；只读持久化证据 [persisted-source-readonly.json](/private/tmp/mm149-931ruovz/evidence/persisted-source-readonly.json)。逐张视觉结论与全部身份/CSP/log/hash核对保存在本记录同名 JSON 和私有 [audit149.json](/private/tmp/mm149-931ruovz/evidence/audit149.json)。

实际运行命令为 `node /private/tmp/mm149-931ruovz/run-product149.mjs`。该命令已执行完毕，不应对这个旧 profile 重跑以冒充 fresh-profile 验收。只读复核可重放 `python3 /private/tmp/mm149-931ruovz/audit-product149.py`；不连接 GUI/CDP、不写请求或源码。

操作复制前，Swift helper 将全部 NSPasteboardItem/type 保存为0600临时备份；finally 逐item/type恢复成功并删除备份，原始剪贴板内容没有打印。两次 app 均普通 quit exit0，main/host PID均已消失，19510没有 listener。冻结源码、patch、prune、fixture及共享计划未改；没有提交、推送或发布。

本次 Mermaid 的矩阵、中文/错误布局、交互、严格恢复实机门已完成，保留上述上游主题/布局及日志覆盖范围。产品整体的签名副本、原生 GUI/auth 和 M8/smoke 由集成人继续验收。
