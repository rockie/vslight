# M3 · Mermaid 运行时准备与独立复现

- 对应 [lean-core.md](../lean-core.md) §5.3 / V3 / M3；接续 [M3-mermaid.md](M3-mermaid.md) 与 [M8-next-session.md](M8-next-session.md)。
- root 基线：dirty@`f1961b7546139a6aa722ff0b8a001296d3041e33`。116 保持原样；本次只增加 139、141 候选与 Mermaid 专属 fixture/记录。
- 状态：隔离 headless 渲染矩阵及补丁重放通过；**真实产品 webview、普通命令交互、serializer 恢复和最终 app 体积仍待主线程验收，M3 未完成。**
- 用户 `vscode/` 生成树、已安装应用未改；没有 GUI 会话、安装依赖、提交、推送或发布。
- 私有根：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq`，另有指针 `/tmp/lean-core-mermaid-runtime-path`。源码复制自此前 M3 私有 prepared+114+116 snapshot；依赖沿用只读 symlink。
- 实测版本：Node v26.1.0、Playwright 1.61.1、Mermaid 11.15.0、ELK addon 0.2.1、tidy-tree addon 0.2.2、ZenUML addon 0.2.3、ZenUML core 3.48.3。

## 图源与真实 webview helper

[mermaid-cases.json](../../../dev/test-fixtures/lean-core/mermaid-cases.json) 有六条合法图源：flowchart、sequence、state、ELK flowchart、tidy-tree mindmap、ZenUML。每条包含可断言中文标签；两条非法图源分别验证 flowchart 和 sequence 错误态。合法图始终 `expectValid:true`。

矩阵为八条图源 × Markdown preview / standalone editor × light / dark，共 32 行，其中合法 24 行、非法 8 行。tidy-tree 的合法语法采用已安装 addon README 的 `config.layout: tidy-tree` + `mindmap` 示例。ZenUML 使用其 addon README 的同步嵌套调用语法，另加中文标题。

[mermaid.js](../../../dev/test-fixtures/lean-core/mermaid.js) 是独立 fixture 入口。主线程把它和 cases 文件复制到私有扩展，令私有 package 的 main 为 ./mermaid.js，启动时设置 `LEAN_MERMAID_ROOT` 指向该实机验收目录。它不会自行启动 app。

向该目录的请求文件 request.json 写入唯一 id，例如：

```json
{ "id": "elk-editor-dark-1", "action": "standalone-editor", "caseId": "elk", "theme": "dark" }
```

支持 `markdown-preview`、`standalone-editor`、`open-active-editor`、`theme`、`copy-source`、`reset-zoom`、`status`、`close-editors`、`quit`。copy/reset 可以附 `mermaidWebviewId`，不附则调用普通 active-webview 路径。`status` 返回真正激活的 Mermaid 扩展路径和注册命令。response 的 `COMMAND_COMPLETED` 只表示宿主命令执行完成，不代表 UI 通过。

在实际产品 webview 的 CDP execution context 执行下面 Node helper 返回的 expression：

```js
const fixture = require('./dev/test-fixtures/lean-core/mermaid.js');
const expression = fixture.webviewProbeExpression('elk', 'dark', 'standalone-editor');
```

probe 核对唯一图表、实际 body theme、可见 SVG、中文标签、错误态、standalone 控件和实际布局坐标；返回 SVG 几何、节点坐标、字体、theme CSS 变量、CSP、script URL 和 webview id。ELK/tidy-tree 断言来自相同图源、冻结版本的已注册引擎输出，可抓到静默 fallback。console/CSP 事件须从加载前记录；中文字形、裁剪、交互和恢复须另留实机截图/状态证据。

## 根因、红例和单点修复

Markdown 入口 [markdown/index.ts](../../../vscode/extensions/mermaid-markdown-features/preview-src/markdown/index.ts) 在 initialize 后调用 `registerMermaidAddons`。独立 editor 入口委托 [mermaidWebview.ts](../../../vscode/extensions/mermaid-markdown-features/preview-src/chat/mermaidWebview.ts)，其首次 `mermaid.run` 前缺少同调用。共享 [shared/index.ts](../../../vscode/extensions/mermaid-markdown-features/preview-src/shared/index.ts) 注册 icon packs、ELK、tidy-tree 和 ZenUML。

用正式 138 的实际 bundle，在独立 headless Chromium 页面加载，未重执行源码来代替正式输入。源码缺口得到以下复现：

| 图源 | 正式 138 standalone | Markdown / 修复后 standalone |
| --- | --- | --- |
| ELK | 生成 SVG，但使用 dagre fallback；viewBox `0 0 315 264.5`，根节点位于两分支中点 | 注册 ELK；viewBox `4 4 305 244.5`，节点布局一致 |
| tidy-tree | 生成 SVG，但使用 cose-bilkent fallback；分支纵向排列，根坐标约 `(71.10,222.67)` | 注册 tidy-tree；根 `(0,20)`，左右分支 `(-159.05,14.75)` / `(159.05,14.75)` |
| ZenUML | 显示 `No diagram type detected matching given configuration`，控件隐藏 | 可见 SVG、中文标题、普通控制按钮 |

139 仅对 mermaidWebview.ts 增加共享注册 import 与首次 run 前的 await，保留原 try/catch 错误状态路径。

注册后另复现 ZenUML 字体 CSP 红例：`@zenuml/core/dist/zenuml.esm.mjs` 把 CSS 嵌在 JS 字符串中，其 `@font-face` 使用 `/fonts/MS%20Sans%20Serif.ttf`。普通 esbuild `.ttf` loader 看不到这段运行时字符串。独立 editor 的既有 `font-src data:` 拒绝绝对 URL。最初隔离 harness 也给 Markdown 使用同严格 font CSP；这两条 Markdown CSP 红例仅是 harness 环境结果，**不是实际 Markdown policy 的失败结论**。随后按真实 Markdown policy 的 `font-src 'self' https: data:` 校正，单独保留旧结果。

141 仅修改 Mermaid `esbuild.webview.mts`：在读取 ZenUML JS module 时把该字体 URL 换成依赖里原 TTF 的 data URL，给 Markdown/editor 两构建入口注册同 plugin。没有修改 node_modules、依赖版本或 CSP。字体原文件为 14,280 B，SHA256 `d4a95d0594b3eca2b87a6db0c867f49717ca6f0b2bcf003e77cc3294be8922da`；两个最终 bundle 均包含该文件完整 base64，原绝对 URL 均不存在。

## 可复核结果

独立完整证据已保存到 [M3-mermaid-runtime.json](M3-mermaid-runtime.json)，包含 32 行 DOM、console/pageerror/CSP、实际输入目录、patch 哈希、产物哈希和重放回执。私有目录另保留各行 PNG 与 [run-render.mjs](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-mermaid-runtime-9pajxltq/run-render.mjs)。

| 验证 | 结果 |
| --- | --- |
| 正式138 + 正确surface CSP + 布局断言 | 26 PASS / 6 FAIL；失败均为独立editor ELK/tidy-tree/ZenUML 的 light/dark |
| 139+141 + 同矩阵/同断言 | 32 PASS / 0 FAIL；合法图没有 console error/pageerror/CSP violation |
| 原非法图源 | 八行均显示有内容的语法错误，未把合法图转成非法期望 |
| Preview chat TS noEmit | exit 0 |
| 两补丁在主私有源码与正式 final 源码内 apply --check | 全部 exit 0；使用 `a/extensions/...` 路径，符合 prepare 的工作目录 |
| 独立 replay baseline →139→141 | 两个 check、两个 apply 均 exit 0；两个改变源码逐字节等于私有 final |
| 进程收尾 | 所有 run-render 命令已 exit 0，browser.close/server.close 已执行；无遗留 run-render/headless-shell 进程 |

运行命令（在私有根执行 headless；构建和 noEmit 在其 `vscode/` 执行）：

```sh
node run-render.mjs formal138-checked
node extensions/mermaid-markdown-features/esbuild.webview.mts --outputRoot ../font-fixed-output
node run-render.mjs font-fixed-checked
node node_modules/@typescript/native/bin/tsc -p extensions/mermaid-markdown-features/preview-src/chat/tsconfig.json --noEmit
```

候选补丁哈希：

| 文件 | SHA256 |
| --- | --- |
| [139-light-mermaid-editor-addons.patch](../../../patches/139-light-mermaid-editor-addons.patch) | `fe6fce21bdfa687dcb94ed167ded30ff10ea7d4c9129eca9fea4871f750afbe0` |
| [141-light-mermaid-zenuml-font.patch](../../../patches/141-light-mermaid-zenuml-font.patch) | `d8213ad2b296a9d321ce0a2181b6e63dba41052f98643729a7bdda7838b612ff` |

产物实测变化；这是扩展 bundle 文件长度，不是最终 app/ZIP 结论：

| 文件 | 正式138 B | 139+141 B | 差 B |
| --- | ---: | ---: | ---: |
| markdown-preview-out/index.js | 18,622,953 | 18,642,002 | +19,049 |
| chat-webview-out/index-editor.js | 4,733,815 | 18,502,766 | +13,768,951 |
| chat-webview-out/codicon.css | 133,000 | 133,000 | 0 |

恢复独立 editor addon 会把其实际依赖带回 bundle，必须如实计入集成体积账。普通 preview 仍 minify=true，比此前同条件 baseline 25,947,052 B 少 7,305,050 B（28.15%）。codicon.css 原 SHA256 不变。没有 chat-only index.js 或 notebook-out 新输出。

## 主线程未验门

1. 干净全补丁重放、正式扩展构建/复制及 app 重新打包；检查最终 Chat 专属 index/注册不存在、普通 index-editor/CSS/font 存在，更新最终 app/ZIP 体积账。
2. 在真实 Markdown preview 和 ordinary standalone webview 执行 32 行：实际 script 输入、CSP日志、主题、中文/字体字形截图、ELK/tidy布局和非法语法状态。
3. 真实普通 openInEditor source/webview-id/active 路径；按钮放大缩小、pan、命令 reset；copySource 按真实 webview-id 和 active 路径读回 clipboard。
4. 私有 profile 重启，核对 ordinary serializer 的源码、图表和 pan/zoom 恢复。headless stub 的 state 不能代替真实宿主 serializer 验收。
