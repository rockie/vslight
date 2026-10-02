# M4 内容搜索与第三方主题 149 补验

计划：[lean-core.md](../lean-core.md) §9.2、V7、M4/M8。最近更新：2026-10-02 10:41 +1000。状态：两个指定缺口通过。实际输入为最终 `147+148+149` arm64 app，根源码基线 `dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`；只新增验证夹具，未改生产补丁或 app。

[完整结果](M4-search-theme149-resume.json)保存启动参数、源与产物指纹、真实宿主请求回执、DOM/AX结果、主题文件身份、日志及正常退出状态。[此前替代覆盖审计](M8-alternative-validation-audit.md)中的内容搜索、第三方主题实际生效两项缺口由本记录补齐；Storage与其余验收门仍按各自证据判断。

## 实际宿主与产物身份

独立目录为 `/private/tmp/ost149-zaow7iwr`，`u/e/s/w` 分别作为自有 user-data、extensions、shared-data、workspace。Python父进程直接启动最终 app，等待其真实退出。主进程 PID `23527`，扩展宿主 PID `24743`；扩展身份 `lean-tests.ordinary-search-theme149`。CDP仅连接该主进程持有的 `127.0.0.1:19560`，参数采用 `--remote-debugging-port=19560`。

[ordinary-visual-cdp.mjs](../../../dev/test-fixtures/lean-core/ordinary-visual-cdp.mjs)在读端口前核对主进程 executable、profile、参数、监听者及宿主父PID，限定唯一自有 workbench。真实已加载 [workbench.desktop.main.js](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js) 的 SHA256 为 `ca30c3f30a81950153d7d9b433d32c4c78f3099bbfbef254b386088ed6786e97`，与最终149文件一致。启动前后 executable/main/shared/workbench 四个关键文件指纹均一致；该检查未声称枚举整个 app 的每个字节。

## 内容搜索结果

[ordinary.js](../../../dev/test-fixtures/lean-core/ordinary.js)新增 `content-search` 动作，通过公共编辑API在自己的 [w/content-proof.txt](/private/tmp/ost149-zaow7iwr/w/content-proof.txt) 第2行插入唯一标记并保存，严格核对磁盘内容。关闭该文件的编辑器 tab 后，调用公开命令 `workbench.action.findInFiles`，限定 `**/content-proof.txt`、区分大小写、非正则、立即触发搜索。

宿主回执仅标记搜索已请求，最终通过由真实 renderer 结果决定。本次标记为 `OST149_SEARCH_1c92806a713e4b3ea90633843ee1d57d`。DOM实际返回一项文件 content-proof.txt、一项行匹配，`.findInFileMatch` 与标记严格相等，结果消息为 `1 result in 1 file`。实际AX树同时包含自有完整文件路径、文件树项、唯一匹配标记及第9列位置。没有把文件名搜索或命令调用成功当作内容搜索成功。

[搜索原图](/private/tmp/ost149-zaow7iwr/evidence/search.png)已按原始2880×1782分辨率逐图查看：真实Search侧栏显示一文件一结果。窄侧栏对长标记作视觉省略，完整标记由DOM/AX断言验证。

## 第三方主题实际生效

将此前OpenVSX实际安装的 `zhuangtongfa.material-theme` 3.20.2 从已有独立验证目录复制到本次私有 `e`。本次未重新联网安装，也未操作用户安装目录。选择该包真实 `contributes.themes` 声明：`One Dark Pro`、`vs-dark`、[./themes/OneDark-Pro.json](/private/tmp/ost149-zaow7iwr/e/zhuangtongfa.material-theme-3.20.2-universal/themes/OneDark-Pro.json)。主题文件 SHA256 为 `186fbbd1ef99a9fb6548fac7a1d354b925a7f9b98da97ef7649e22e20d08c756`。

宿主通过公共 `workbench.colorTheme` 配置切换；实际 `window.activeColorTheme.kind` 从 Light `1` 变成 Dark `2`。真实workbench包含主题文件对应标识 `zhuangtongfa-material-theme-themes-OneDark-Pro-json`，从而区分第三方主题与其他dark主题。五项CSS实际计算值逐项等于该主题JSON：

| 主题键 | 实际CSS值/主题文件值 |
| --- | --- |
| editor.background | `#282c34` |
| editor.foreground | `#abb2bf` |
| sideBar.background | `#21252b` |
| activityBar.background | `#282c34` |
| statusBar.background | `#21252b` |

实际打开的 `.monaco-editor` 背景为 `rgb(40, 44, 52)`，对应 `#282c34`。[主题原图](/private/tmp/ost149-zaow7iwr/evidence/theme.png)已按原始分辨率查看：真实编辑器、搜索侧栏和工作台显示深色主题，普通图标可辨认。本次验证实际应用与显示；没有补做重启后的主题恢复。

## 失败保留与收尾

首轮 `/private/tmp/ost149-nys1xaxr/complete.json` 如实保留 `FAIL`。原因是夹具要求关闭编辑器后10秒内 `TextDocument.isClosed` 成立；真实产品的 `BoundModelReferenceCollection` 默认保留API文档模型3分钟。首轮尚未开始renderer结果断言，父进程强制结束，不能算作正常退出或产品通过。夹具改为公共Tab API确认该URI的编辑器确已关闭，记录模型仍缓存；搜索结果和主题断言保持严格。最终轮真实 `editorTabClosedBeforeSearch=true`、`documentModelIsClosed=false`。

最终结果为 `CONTENT_SEARCH_AND_CONTRIBUTED_THEME_PASS_NORMAL_QUIT`。宿主公共quit请求后，真实父进程 `wait` 得到 exit `0`，`forced=false`；主日志记录扩展宿主 exit `0`。主PID及19560监听均已消失。该轮自有日志中 `Unknown service`、`Missing proxy`、`assertRegistered`、`unknown customer`、service属性读取错误和 `RPC unknown` 六类计数均为0。

夹具与CDP helper源指纹已冻结在JSON中，当前源匹配实际运行副本；原有 `terminal-clipboard` 动作保持不变。未运行或修改smoke，未使用全局键盘/粘贴、IME切换、focus emulation、浏览器资源操作、用户vscode生成树或已安装app。CI依用户仅本地限制保持未验。最小继续动作是把本记录两项结果并入主线程验收表，再按真实新产物处理Storage与其余未完门；无需重复这两个已绿动作。
