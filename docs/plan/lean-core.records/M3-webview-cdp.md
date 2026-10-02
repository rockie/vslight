# M3 · 实际 webview 的 CDP 执行准备

接续 [M3-mermaid-runtime.md](M3-mermaid-runtime.md)。本记录交付 [webview-cdp.mjs](../../../dev/test-fixtures/lean-core/webview-cdp.mjs) 和实际产品的最小执行顺序。**本次只访问自己新建的无界面 Chromium 样本，没有启动、控制或连接正式 GUI，没有使用认证端口 19480；所有 headless 结果均不计入产品 PASS，M3 仍待主线程实机验收。**

## 获取实际 DOM

VS Code workbench 主 renderer 不一定包含图表 DOM。webview 可能在跨进程 iframe 的独立 CDP target 中，真正内容又可能位于该 target 下的同进程 iframe。helper 从浏览器 `/json/version` 取得 browser WebSocket，递归 auto-attach page/iframe，启用每个 session 的 Runtime，并保留所有默认执行上下文。它逐个上下文读取实际 document，以 Mermaid DOM 和 editor body webview id 判断 surface，不使用 workbench HTML 替代 webview。

每份输出保存 targetId、sessionId、context id/uniqueId、frameId、rootTargetId、实际 URL、实际 scriptSources、body theme、SVG、标签、错误态、字体、CSP 和日志。有多个符合条件的图表 document 时直接拒绝；固定用首个 target 的旧做法不能提供这份证据。context-only 诊断入口为 `--action contexts`。

`--expected-app` 校验唯一 workbench 的实际文件路径位于该 app 内。matrix/interactions 还读取宿主 fixture status，核对真实激活的 Mermaid extensionPath 等于 app 内置扩展路径。helper 硬拒绝端口 19480；不调用 app 启动、bringToFront 或聚焦 API。

在新建 target 首次执行脚本前，helper 暂停调试、安装 CSP listener、启用 Log/Network/Runtime，再继续执行。输出的 captureCoverage 明确记录连接时间、已有/新 target、是否在脚本前暂停和 document instrumentation 状态。连接前已有页面的历史 CSP/console 仍不能从空列表推断为无错误；实际矩阵先连接，再新建每一行页面。没有完成 instrumentation、发现 CSP violation、CSP-blocked request 或合法图的 console/error/fallback 时，输出 FAIL。

## 最小实际执行顺序

主线程准备独立 Mermaid 私有 profile、fixture 目录与专用 CDP 端口，加载更新后的 [mermaid.js](../../../dev/test-fixtures/lean-core/mermaid.js) 和 [mermaid-cases.json](../../../dev/test-fixtures/lean-core/mermaid-cases.json)。启动/退出/重启都由主线程控制。将以下变量设为该实机会话的真实值；不要复用认证的目录、请求文件或端口。

```sh
# 在仓库根执行；这些变量由主线程填入实际会话路径/端口
node dev/test-fixtures/lean-core/webview-cdp.mjs \
  --action matrix --endpoint "$MERMAID_CDP" --expected-app "$MERMAID_APP" \
  --fixture-root "$MERMAID_FIXTURE_ROOT" --output "$MERMAID_EVIDENCE/matrix"

node dev/test-fixtures/lean-core/webview-cdp.mjs \
  --action interactions --endpoint "$MERMAID_CDP" --expected-app "$MERMAID_APP" \
  --fixture-root "$MERMAID_FIXTURE_ROOT" --output "$MERMAID_EVIDENCE/interactions"

# 主线程实际正常退出，再以同一私有 profile 重新启动；保留当前 editor。
# 等待新宿主 ready 后执行；恢复主题、图源和 id 从 baseline 自动读取。
node dev/test-fixtures/lean-core/webview-cdp.mjs \
  --action restore-check --endpoint "$MERMAID_CDP" --expected-app "$MERMAID_APP" \
  --fixture-root "$MERMAID_FIXTURE_ROOT" \
  --baseline "$MERMAID_EVIDENCE/interactions/restore-before.json" \
  --output "$MERMAID_EVIDENCE/restore-after.json" \
  --screenshot "$MERMAID_EVIDENCE/restore-after.png"
```

第一步按 surface → theme → case 的顺序执行 32 行。每行先关闭旧 editor，再通过真实 fixture 创建普通 Markdown preview 或 standalone editor，等待现有 probe 通过，保存 DOM、日志和 root page viewport PNG。合法图一直使用 expectValid=true；错误图验证有内容的语法错误。matrix 和 summary 文件分别保存全部行和统计；fixture-status 文件保存真实扩展激活输入。

第二步用 flowchart 执行 33 个检查步骤：源码打开；webview-id 和 active 两种打开路由；copySource 两种路由；放大、缩小、pan toggle、实际拖动、按钮 reset；命令 reset 的 id/active 两路；dark → light → dark 现场换主题并保留变换。最后保持放大和 pan 后的 dark editor 打开，保存恢复前 JSON 与 PNG，并删除旧 request 文件，防止真实重启后重放打开/主题/退出命令干扰 serializer 结果。

copySource 现在先写本次请求唯一 clipboard sentinel，再调用普通宿主命令，最后读回实际图源。没有写入 clipboard 的 no-op 不会被上一次成功 copy 掩盖。fixture response 仍只表示 COMMAND_COMPLETED；实际 DOM、路由、变换和 clipboard 的组合才提供相应子检查证据。

按钮和 drag 使用 CDP Input.dispatchMouseEvent 的受信任事件。helper 从选定上下文的 DOM objectId 查询几何，再沿 OOP iframe owner 计算 root 坐标；缺少 lineage 或 iframe 有旋转/倾斜时拒绝猜测点击位置。pan 检查实际位移，zoom 检查比例变化，reset 与初始 baseline 对比。

第三步重新发现实际复活的 editor document，核对 case/surface/theme/webview-id 和 scale/x/y，容差为 scale 0.001、平移 1 CSS px；随后通过真实宿主的 id 和 active 两路 copySource 核对恢复源码。copy 失败会记录为 FAIL。主线程另记录 app/profile 与新旧进程事实，证明发生真实正常重启；DOM 比较本身不证明重启发生过。

## 输出状态与人工门

| 状态 | 含义 |
| --- | --- |
| DOM_CHECK_PASS | 所选实际 document 的 probe 和已捕获日志子检查通过 |
| INTERACTION_CHECKS_PASS_RESTART_PENDING | 本轮交互步骤通过，editor 已留待真实重启 |
| RESTORED_DOM_CHECK_PASS | 两次 DOM/变换一致；带 fixture-root 时额外核对实际 clipboard 图源 |
| FAIL | 实际命令、DOM、CSP、错误日志或变换检查失败 |

以上状态不等于 M3 完成。主线程必须查看全部实际 root viewport 截图，确认中文无缺字方框、标签可读且未裁剪、light/dark 实际图像正确；核对每行 captureCoverage 和实际脚本输入；补正常重启与最终 app/ZIP 体积账。截图不会自动聚焦窗口，也不保证最内层 frame 当前未被其他 UI 遮挡，需以图像确认可见性。

已有页面诊断可运行 `--action probe` 或 `--action snapshot`，指定 `--case`、`--theme`、`--surface`、可选 `--webview-id` 与 `--screenshot`。单步操作可运行 `--action interact --interaction zoom-in|zoom-out|pan-toggle|pan|button-reset`；pan 先启用 toggle，按钮 reset 单步只记录变化，完整 interactions 模式才与 baseline 断言。

## 独立验证与可复核证据

自己的样本使用实际 139+141 Mermaid bundle，构造 root page → 跨站 OOP iframe → 同站内层 iframe。32 行全部通过，所选 targetType 均为 iframe，frameId 均不同于 targetId，证明确实检查到更深 document；32 行均完成新 document instrumentation，并在新 OOP target 脚本前暂停。

| helper 验证 | 结果 / 限定 |
| --- | --- |
| 独立 CDP 图源矩阵 | 32/32；是 headless helper 验证，不是产品矩阵 |
| 受信任 zoom/pan/button reset | 八项验证通过，实际 mousedown 的 isTrusted 全为 true |
| CSP 红例 | 人为加载被 CSP 禁止的资源，snapshot 返回 FAIL 并记录 violation |
| 恢复差异红例 | 不同 pan/zoom snapshot 返回 FAIL |
| 完整 interactions 流程 | 33 步通过；宿主路由使用明确 fake host，只验证自动化串联 |
| clipboard 旧值红例 | VS Code doubles 中 no-op 被 sentinel 拒绝；实际写入的 double 通过 |
| FixtureClient 清理 | 请求完成后删除 request 文件，未留下待重放请求 |
| 语法与收尾 | node --check 通过；所有样本命令退出、browser/context/server 均关闭 |

初次受信任输入调查复现了 DOM.requestNode 得到的 frontend node-id 无法用于 DOM.getBoxModel；改为直接传同一上下文的 objectId 后，嵌套 iframe 几何与实际输入检查通过。没有为产品改渲染源码或放宽字体/CSP。

私有样本与结果位于 `/tmp/lean-core-mermaid-runtime-path` 指向目录：

- [test-webview-cdp.mjs](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/test-webview-cdp.mjs)：自己的浏览器、跨站 server、实际 bundle 与全部 guard。
- [32 行结果](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/webview-cdp-headless-results.json)：全部 selected contexts、DOM、日志与 captureCoverage。
- [最终八项 guard](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/webview-cdp-headless-final-guards.json) 与 [33 步串联结果](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/webview-cdp-headless-workflow.json)。
- [clipboard sentinel 红/绿](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/fixture-copy-guard-results.json)。

复核全量 headless 命令为 `node test-webview-cdp.mjs`，只复核最终 guard/串联为 `LEAN_CDP_QUICK=1 node test-webview-cdp.mjs`；在上述私有根执行。fixture guard 为 `node test-mermaid-fixture-copy.mjs`，也只使用 doubles。没有新安装依赖、提交、推送或发布。
