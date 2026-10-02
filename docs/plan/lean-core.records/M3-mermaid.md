本轮更新（2026-10-02 17:46 +1000）：150仅Storage有变化，[双surface定向真实退出重启](M3-storage150-final.md)已补验，raw source/ID/theme/numeric panZoom/public tabs/完整序列化状态严格一致，四原图已复核；首次后台tab懒加载的测试红及修正保留。149的32图/33交互沿用，不改来源。

# M3 · Mermaid 压缩与 Chat 适配拆除

- 对应计划：[lean-core.md](../lean-core.md) §5.3、V3、M3。
- 最近更新：2026-10-02 04:55 +1000。
- 状态：已完成。最终149完整构建、包检查、32真实矩阵/原图、33交互与正常quit/restart精确恢复均通过。
- 基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，114–139/141–149；保持冻结Mermaid/addon版本、普通Webview与CSP。

[最终产品记录](M3-product149-runtime.md)含全部PID/profile/script hash、32原图、中文与8非法态、CSP/font、clipboard还原和精确原始source/ID/theme/panZoom恢复。139恢复独立editor addon注册，141内嵌原Zen字体；148修长错误换行与serializer模板空白增长。旧state按原source恢复，不trim用户文字或更改ID算法。Chat index和注册不存在，普通open/reset/copy保留。

最终普通preview **18,642,002 B**，比实际同Node24构建的M1 baseline25,842,004 B减少7,200,002 B（27.86%）；独立editor **18,502,766 B**，恢复全部addons的13,768,951 B增量已计入[最终app/ZIP账](M8-final-artifact.json)。[同条件Mermaid字节账](M3-final-size149.json)明确preview下降、editor增量和家族合计；不声称全部Mermaid家族总字节下降。压缩收益不混入删图类、改版本或字体阉割。暗色Zen固定白底、dark tidy部分弱对比及旧版已有的重启layout/pan-mode transient边界均逐项记录，标签可读；恢复门验证精确保存值，不额外要求旧版没有承诺的像素等同。

以下保存116早期测量及后续红例，段中当时的“未完成”不代表当前149状态。

## 116阶段与历史测量

- root 基线：`f1961b7546139a6aa722ff0b8a001296d3041e33`；生成上游 HEAD `08d4889f9ec4a1685d257b9b95de036c8e1ce1e5`。
- 私有代码基线：现有已 prepared 生成树的源码副本 + `114-light-extension-host-lifecycle.patch`，Mermaid 子树 baseline commit `90ae85d3b8f14dfaee695c9768ca65463bf61d1a`（私有 git，仅记录该扩展输入）。开发态为 dirty@该 SHA；最终持久差异仅以下 116。115 仅修改 build/.moduleignore，与 116 无文件交集。
- 补丁：[116-light-lean-mermaid.patch](../../../patches/116-light-lean-mermaid.patch)，SHA256 `7061b252e076cc6a92bb39a1376c436ac11a62899323af1fbdf24ace2e8f890d`。
- 运行环境：macOS arm64，Node `v26.1.0`，extensions 的 esbuild `0.28.1`，基线和最终使用同一依赖/参数；不修改 Electron/依赖版本。

## 实现记录

116 仅修改 `extensions/mermaid-markdown-features` 内 9 个源码/声明文件，25 行新增、312 行删除；不包含生成 bundle：

| 文件（相对 vscode/extensions/mermaid-markdown-features） | 最终行为 |
| --- | --- |
| esbuild.webview.mts | 去普通 preview 的 minify:false，继承 esbuild-webview-common 的 minify:true；去 chat index.ts 构建入口，保留 index-editor.ts 与 codicon.css；注释改为 editor preview。 |
| src/extension.ts | 去 registerChatSupport；把原 openInEditor handler 原样迁至普通 activate subscriptions，与 resetPanZoom/copySource 共存。source/title 参数、按 webviewId 查找、activeWebview fallback 三条普通路径保留。 |
| src/chatOutputRenderer.ts | 删除 Chat renderer、LM render tool 注册与结果编码；不再调用 vscode.chat 或 vscode.lm。 |
| preview-src/chat/index.ts | 删除聊天入口和其按钮 postMessage 适配；保留 index-editor/mermaidWebview/vscodeApi。 |
| package.json | 去 enabledApiProposals、chatOutputRenderers、languageModelTools 贡献及 webview/context 的 chatOutputItem 条件；普通命令、markdown script、Markdown 插件与配置原样保留。 |
| tsconfig.json | 去 Chat/LM 五个 proposed d.ts include；普通稳定 vscode.d.ts 保留，browser config 仍继承该文件。 |
| src/webviewManager.ts / src/editorManager.ts | 去仅用于区分 chat/editor 的未消费 type 字段/参数；普通 preview 注册、tracking、serializer 与 resetPanZoom 的调用链保留。 |
| preview-src/chat/mermaidWebview.ts | 仅修正 Chat-only 注释；运行代码无改动，最终 editor bundle 哈希与基线完全一致。 |

普通 editor 仍使用 [chat-webview-out/index-editor.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/index-editor.js) 与 [codicon.css](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/codicon.css)；目录名保持。`preview-src/shared` 的 addon 注册、icon pack、diagram types、ELK/tidy-tree/ZenUML、主题/CSS/font 输入未更改。`esbuild-webview-common.mts` 的 bundle=true、ESM、browser、es2024、sourcemap=false 原样继承；CSS-text 插件和 ttf/woff/woff2 data URL loader 保留；editor 的 CSP 文本未改。

## 隔离和构建测量

私有根：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k`；源码 [source/](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/source)，未覆盖用户 `vscode/` 或既有 app。使用 rsync 复制源码，排除 .git、node_modules、out/out*/dist、*-out 和 .build；根、build、extensions、Mermaid 的 node_modules 都只读使用既有目录 symlink，未运行 npm install。源码不是 symlink。

在 source/ 执行以下命令，两次不同 outputRoot，避免基线/final 互相覆盖：

```sh
node extensions/mermaid-markdown-features/esbuild.webview.mts --outputRoot ../baseline-output
node extensions/mermaid-markdown-features/esbuild.webview.mts --outputRoot ../final-output
node extensions/mermaid-markdown-features/esbuild.mts --outputRoot ../final-extension-output
```

前两个命令都 exit 0。文件长度实测（不混入 ZIP 压缩或磁盘块分配）：

| 输出 | baseline bytes | final bytes | 减少 bytes |
| --- | ---: | ---: | ---: |
| [markdown-preview-out/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/markdown-preview-out/index.js) | 25,947,052 | 18,622,953 | 7,324,099 |
| [chat-webview-out/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/baseline-output/chat-webview-out/index.js) | 4,733,391 | 0 | 4,733,391 |
| [chat-webview-out/index-editor.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/index-editor.js) | 4,733,815 | 4,733,815 | 0 |
| [chat-webview-out/codicon.css](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/codicon.css) | 133,000 | 133,000 | 0 |
| 四项总计 | 35,547,258 | 23,489,768 | 12,057,490 |

普通 markdown preview 单项减少 **7,324,099 bytes（28.23%）**；Chat index 删除另外减少 4,733,391 bytes；四项总计减少 11.50 MiB。独立 editor 与 codicon.css 没有变化，不把它们计为压缩收益。不是最终 app/ZIP 体积结论。

| 输出 | baseline SHA256 | final SHA256 |
| --- | --- | --- |
| [markdown-preview-out/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/markdown-preview-out/index.js) | `623e44c07193fcebeb425fbc4f9dc52698f88d8a20b5cd2492eec4b32884f2ad` | `3f347b739f2eba09faf8051f23e8cebb60e3bef37ea068ba3d52b7fd957de0f2` |
| [chat-webview-out/index.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/baseline-output/chat-webview-out/index.js) | `2a9b50b3e3a7684b9669a36167376831441fc7f05a8b4b399671ef86986fecc7` | `不存在` |
| [chat-webview-out/index-editor.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/index-editor.js) | `0e15726aaf233fe825277740b7bdf5af8a0d9a9787718c23dae600f0fa9a4cd1` | `0e15726aaf233fe825277740b7bdf5af8a0d9a9787718c23dae600f0fa9a4cd1` |
| [chat-webview-out/codicon.css](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/final-output/chat-webview-out/codicon.css) | `36b3e52baa002edf1502580acd7a778347ff4b455473d96a64a28bd57e81f641` | `36b3e52baa002edf1502580acd7a778347ff4b455473d96a64a28bd57e81f641` |

## 验收记录

| 退出条件 | 命令或走查步骤 | 环境/代码基线 | 结果与必要证据 |
| --- | --- | --- | --- |
| preview minify=true，实际更小 | 两次私有 outputRoot 源码构建；对 index.js stat/sha256；核 common baseOptions 与本地 override | 同 Node/esbuild/依赖、baseline 与 dirty@私有 SHA | 通过；25,947,052→18,622,953 bytes。 |
| index-editor/CSS/font 共享产物保留 | stat/hash baseline/final 两项；检查 data URL loader、shared 源码和 package-lock 与私有 git HEAD bytes 相等 | 私有 snapshot | 通过；editor JS 与 codicon.css bytes、SHA256 完全相同；loader 和版本不变。 |
| Chat index/renderer/tool/声明解绑 | 检查两专属源码不存在，manifest 无 enabledApiProposals/chatOutputRenderers/languageModelTools/chatOutputItem，最终 chat index.js 不存在 | 私有 final | 通过；最终 chat-webview-out 仅 index-editor.js/codicon.css。 |
| 普通命令有绑定 | 校验 openInEditor/resetPanZoom/copySource 在 manifest 各一条且普通 activate 各注册一次；source handler diff 人工比对迁移前后 | 私有 final | 静态通过；未据此宣称真实宿主执行/菜单/UI 通过。 |
| Notebook 构建产物不重新引入 | fresh final-output 目录枚举 | 私有 final | 通过；无 notebook-out。原 notebook preview 源文件保持现状；没有新建构建/复制入口。 |
| 扩展源码编译 | `node node_modules/@typescript/native/bin/tsc -p extensions/mermaid-markdown-features/tsconfig.json --noEmit` | 私有 final，依赖只读 symlink | 通过，exit 0。 |
| Preview 源码编译 | 同 tsc，对 preview-src/tsconfig.json 和 preview-src/chat/tsconfig.json 各执行 --noEmit | 私有 final | 两项通过，exit 0。 |
| 全源码图无新增错误 | `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit` | 私有 source（prepared+114+116） | 通过，exit 0；不是最终 app build。 |
| Node 扩展 bundle | `node extensions/mermaid-markdown-features/esbuild.mts --outputRoot ../final-extension-output` | 私有 final | 通过，exit 0，dist/extension.js 11,629 bytes；bundle 不进入持久补丁。 |
| 同前置源码可重放 | 从私有 baseline commit git archive Mermaid 子树；git apply --check 116、git apply 116；9 个改变路径与 final 逐字节/存在性比对 | [patch-replay/](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-m3-mermaid-a7_j9c0k/patch-replay)，114 前置不触碰 Mermaid，115 亦无交集 | 通过，9 文件一致；git diff --check 通过。完整根补丁顺序重放由集成人再验证。 |
| flowchart/sequence/state/ELK/tidy-tree/ZenUML、中文/font、light/dark、非法语法 | 构建后 app 的 Markdown preview 与独立 editor 实际渲染矩阵 | 未运行 | 待主 agent 集成验收；源码/loader 不变不能替代真实渲染。 |
| 独立 editor/openInEditor/缩放/复制/恢复 | 真实 app command/menu/Webview 交互及 serializer 恢复 | 未运行 | 待主 agent；不得预填通过。 |

## 未验收项与继续动作

1. 集成人把 116 纳入 114/115 同前置全补丁重放、生成扩展/最终 app 后执行 V3 真 UI 矩阵与普通 standalone editor 命令、复制、缩放、恢复；确认 app 实际打包没有旧 chat index.js。fresh outputRoot 证明新构建不产旧文件，不代替发行包复制检查。
2. 独立 editor 入口与基线 byte-identical。源码核对发现它原本不调用 `registerMermaidAddons`，而普通 markdown/index.ts 调用；这不是本补丁新增差异，但独立 editor 的 ELK/tidy-tree/ZenUML 实际支持须在矩阵中核验，失败应定位基线行为后修复，不能凭普通 preview 成功推断全部 editor 能力。
3. 本子任务没有修改共享生成源码、计划、prune、其他补丁或基线 app；M3 仍待真实 UI 和集成产物退出条件，不宣布里程碑完成。

[真实产品CDP执行准备](M3-webview-cdp.md)已交付matrix、interactions、真实重启后的restore-check；helper只在独立样本验证，产品未执行，不计V3通过。

最近更新：2026-10-02 03:48 +1000。正式145+146的[32项产品矩阵](M3-product145-matrix.md)DOM/CSP/24合法图与中文通过；4个standalone错误长行裁剪待148修正，ZenUML暗色白底是冻结addon原生SVG固定样式，图内可读。33真实交互通过，private root由`/tmp/lean-mermaid145-path`定位。正常quit后main38895→49358、host40129→50085，同profile恢复图源/theme/panZoom；实际DOM transform与baseline精确相同（1.25/429.75/225）。HTML模板的额外缩进存入原source导致ID165d2776→7a0fcdc9，逐轮source空白增长；148按原source inline pre修，不放宽ID或trim用户source，不删旧状态。整个恢复门尚未通过，后续fresh profile复验。
