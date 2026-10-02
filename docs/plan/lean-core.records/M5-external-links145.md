# M5 系统外链实机记录：145 + 146

2026-10-02（Australia/Sydney）。本次独立实例执行了 20 次产品链接点击，16 次由 Chrome 收到逐字相同 URI，并确认产品没有新增 Browser tab。余下 4 次终端点击没有获得 Chrome 收据，保持未验；本记录不将 M5、V5 或 V9 标为完成。完整逐行对象见 [M5-external-links145.json](M5-external-links145.json)。范围对应 `docs/plan/lean-core.md:234`、`docs/plan/lean-core.md:387` 和 `docs/plan/lean-core.md:414`。

## 真实实例和隔离

证据根 `/private/tmp/ell145-4kvrbik_`，发现指针 `/tmp/lean-external-links145-path`。正式未签名 145 + 146 app 来自 `/tmp/lean-core-build144-path` 指向的独立构建根。主进程 55759，实际扩展宿主 56970，bootId `70f311f1-c6c3-4f64-a5a1-1ff96f6b0d90`，API 版本 1.135.0。私有 user-data、extensions、workspace 分别为该根的 `u`、`e`、`w`，CDP 仅绑定 `127.0.0.1:19520`。通过 `open -g -n` 后台启动，未发应用激活或系统输入。

独立 HTTP server PID 55757 绑定 `[::]:19481`，`IPV6_V6ONLY=0`，支持 IPv4 和 IPv6；原始 request path 留在根下 `server-requests.jsonl`，不记录 headers、cookies 或凭据。浏览器只验证接收的 URI，不读取页面内容或以网站是否返回成功作为出口验收。HTTP request 不携带 fragment，所以 fragment 以 Chrome `location.href` 为证。

加载 fixture 是 [links.js](../../../dev/test-fixtures/lean-core/links.js)，实际副本 SHA-256 `61ae33eae34a6384a77296fce28838c9e9749a631c6fbd06eaae4bfc414eafe0`，仍与仓库 helper 相同。实际已经加载的 workbench bundle SHA-256 `4d8b395feacab225a3ad8fc8711d15545337f93d4d5ab18720fd89e274a50a1a`。每次 capture 前验证 PID 的真实 CFBundleExecutable、profile 参数、19520 listener owner、launch/ready 身份、fixture 哈希，并由已加载 Debugger script 校验真实 workbench 哈希；运行结束再次核对 PID、bootId 和 hash。没有导入产品模块、获取 service 或调用内部 channel。

## URI、真实点击与旧 opener 配置

五个 base 为 `http://localhost:19481`、`http://127.0.0.1:19481`、`http://[::1]:19481`、`http://0.0.0.0:19481` 和 `https://example.com`。每个原地址保留以下编码部分，只在 query 加入独立标记：

```text
/lean%20core/%E4%B8%AD?encoded=%252F&plain=value&run=0dbb592182a9&surface=SURFACE&index=INDEX#fragment%20space
```

`SURFACE` 的实际值为 `webview`、`markdown`、`terminal-visible`、`terminal-osc8`，`INDEX` 为 0–4；20 个完整原 URI 与逐字 Chrome 值均保存在 JSON 对应行。没有改变失败 URL 的地址、编码或 fragment。

Webview 的 `<a>` 来自普通 `createWebviewPanel`；Markdown 由真实 `markdown.showPreview` 生成；终端由真实 integrated terminal 的 Pseudoterminal 分别输出可见完整 URL 和 OSC8 URI + 标签。终端两种输出进入不同链接探测路径，均真实 Cmd+点击链接。fixture 没有 `env.openExternal` 调用，也没有打开 Chrome 的 API。

[external-links-cdp.mjs](../../../dev/test-fixtures/lean-core/external-links-cdp.mjs) 使用已有 `WebviewCdp` 发现自己的真实 workbench/子 frame；Webview 与 Markdown 按实际 elementPoint 坐标点击，终端按实际 xterm screen、Pty 行列和唯一 banner 定位。鼠标事件只发送到经身份校验的产品 target，未抢 GUI 焦点，未发全局键鼠输入。

私有 profile 实际配置、宿主 `getConfiguration` 读值均为：

```json
{"workbench.externalUriOpeners":{"*":"simpleBrowser.open"}}
```

provider ID 来自只读原始源码 `vscode/extensions/simple-browser/src/extension.ts:33` 的 `openerId`，其 `:89` 确实用于 `registerExternalUriOpener`，不是根据命令名猜测。`vscode/src/vs/workbench/contrib/externalUriOpener/common/configuration.ts:37` 的 schema 接受 URI pattern 到 string opener ID 的映射；`vscode/src/vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService.ts:174` 对失效 configured ID 返回 undefined，`:79` 的空 provider 集合返回空 opener 列表。源码文件哈希附在 JSON。

该配置在真实测试宿主中保持不变。16 条通过证明普通产品点击在保留旧 `simpleBrowser.open` 配置时仍能走到系统浏览器；没有通过删除旧配置或直接调用外链 API 制造 fallback。

## 最后一次完整矩阵

PASS 单元格为实际 Chrome 新 tabId，均有 `location.href === originalURI` 和产品 Browser tab 数量 0。未验单元格没有 Chrome 接收证据。

16 条通过后的完整 tabs 也与 fixture 面相符：Webview 五条各只有 `Ordinary external links` / `mainThreadWebview-leanLinks`；Markdown 五条各只有源文档和 `mainThreadWebview-markdown.preview`；终端六条 tabs 均为空。没有依赖 Browser tab 名称的正则来忽略额外普通或未知 tab。

| URL base | Webview | Markdown | 终端可见 URL | 终端 OSC8 |
|---|---|---|---|---|
| localhost:19481 | PASS 1319598454 | PASS 1319598469 | PASS 1319598484 | PASS 1319598493 |
| 127.0.0.1:19481 | PASS 1319598457 | PASS 1319598472 | PASS 1319598487 | PASS 1319598496 |
| [::1]:19481 | PASS 1319598460 | PASS 1319598475 | PASS 1319598490 | PASS 1319598499 |
| 0.0.0.0:19481 | PASS 1319598463 | PASS 1319598478 | 未验 | 未验 |
| https://example.com | PASS 1319598466 | PASS 1319598481 | 未验 | 未验 |

最后完整矩阵为 `/private/tmp/ell145-4kvrbik_/evidence/matrix-final/matrix.json`，20 个独立行文件留在同目录。每行含真实点击 context/坐标、终端内容/geometry 或实际 anchor、原 URI、Chrome 精确 URI 收据及通过行的产品 tabs。四个未验行实际发送过产品点击，但 `find_tab(active:true)` 一直返回 `extension_error`，不能借前一测试 tab 充当新的收据。旧完整矩阵及前期失败保留在同根 evidence/matrix 等目录，没有删除失败再写全绿。

Chrome 使用已连接的 Kimi daemon 10086，固定 session `lean-core-runtime`。严格限定为真实产品点击新开的 active 测试 tab：`find_tab({url: originalURI, active:true})` 返回的 URL 必须逐字匹配本行唯一 marker，才运行唯一表达式 `location.href`。Kimi 的 find_tab 仅按 host 匹配，因此 helper 对同 host 的其他 URL 跳过 evaluate；等待期间不保存其他页面 URL/内容。不调用 navigate、focus、list_tabs、snapshot、close_tab 或 close_session，不变更 daemon。使用技能：[kimi-webbridge SKILL.md](/Users/rockie/.codex/skills/kimi-webbridge/SKILL.md)。

## 四个未验行与失败边界

四个未验行恰好是两种终端路线的非 localhost/loopback 地址。独立 workbench DOM 的实际 `/private/tmp/ell145-4kvrbik_/evidence/pending-dialog/dialogs.json` 为 `[]`；只读、限定 PID 55759 的 System Events AX 查询返回 `windows: []`。主线程已实际观察到 CGSession locked=1/onConsole=false，本 worker 不发全局输入。

[INFERRED] 可能等待终端外部网站的原生 trust confirmation。源码 `vscode/src/vs/workbench/contrib/terminalContrib/links/browser/terminalLinkOpeners.ts:308` 传 `openExternal:true`，未传 `fromWorkspace`；`vscode/src/vs/workbench/contrib/url/browser/trustedDomainsValidator.ts:50` 只有 trusted workspace + fromWorkspace 才跳过校验，`:82` 的未信任域走 prompt；`vscode/src/vs/workbench/electron-browser/parts/dialogs/dialog.contribution.ts:85` 默认转交 NativeDialogHandler。实际 sheet、按钮和所列 URI 在锁屏时不可读，本次没有确认该推断，更没有把四行写成 PASS。

前期失败各自保留：已加载脚本使用 `vscode-file://vscode-app`，初版仅支持 file URL 的身份守卫先失败；Webview synthetic anchor.click 没有通过真实用户点击路线；初版终端选择器 `.terminal-instance.active` 在实际 DOM 不存在。之后只修改测试 helper，根据实际已加载 URL/DOM 使用真实限定 target 鼠标事件，最终 16 条获得系统浏览器实证。一次前一 Chrome tab 尚 active 的异步时序也被保留，helper 改为等待真实新 tab 并拒绝复用旧 tabId。

本 profile 的 `main.log` 有一条 `04:01:59.245 ERR_BLOCKED_BY_CSP`，本记录不声称整份日志零错误，也没有把它从证据中删去；它没有阻止最后矩阵中 16 次逐字系统出口通过。未验证该历史错误与早期失败点击的因果。

## 清理与补验入口

fixture 已消费唯一 quit request，并先写 `/private/tmp/ell145-4kvrbik_/quit-intent.json` 后执行真实 `workbench.action.quit`。2026-10-02 04:17:12 +1000，主 PID 55759 正常退出；server PID 55757 经核对其私有脚本和 listener 后收到 SIGTERM 并退出。`/private/tmp/ell145-4kvrbik_/cleanup-app.json`、`/private/tmp/ell145-4kvrbik_/cleanup-server.json` 保存实际证据，19481/19520 已无 listener。主线程随后可覆盖独立构建包。认证 PID 62872 / 19480、其他 profile、真实用户全局偏好及浏览器用户页面全程未接触；Chrome 测试 tab 按技能要求保留。

[TODO] 解锁后重新冷启动同类隔离 fixture、双栈 server 和 19520 listener，记录新的真实 app/loaded workbench hash、PID 和 bootId，补四个终端行。不要复用已经退出的 55759、现有 ready PID 或旧 Chrome tabId，也不要修改 trustedDomains 或 URI。当前 helper 增加了 120 秒收据等待和发出真实点击后的进度；这两项与失败时仍记录产品 tabs 是 capture 完成后的续验便利，未冒充本次已经执行的完整矩阵。

新的运行根和进程已准备并核实后，逐行执行以下命令形状；LINK_* 从新 launch/ready 实际值填写。父线程在独立 app 的真实 prompt 出现后，核对 detail 等于本行完整测试 URI，再点 Open。不要选择 Configure Trusted Domains。若未出现 prompt，继续调查实际阻挡；不能仅凭本次推断点击别的对话框。

```sh
node dev/test-fixtures/lean-core/external-links-cdp.mjs \
  --action row --surface terminal-visible --index 3 \
  --root "$LINK_ROOT" --pid "$LINK_PID" --expected-app "$LINK_APP" \
  --profile-root "$LINK_ROOT/u" --endpoint http://127.0.0.1:19520/ \
  --expected-port 19520 --receipt-timeout-ms 120000 \
  --output "$LINK_ROOT/evidence/terminal-visible-3-unlocked"
```

其余三行分别是 `terminal-visible/4`、`terminal-osc8/3`、`terminal-osc8/4`，各用独立 output 目录。fixture 必须新建独立扩展目录并复制当前 links.js，manifest ID 保持 `lean-tests.lean-links-runtime-fixture`、activationEvent `onStartupFinished`，使用自己的 w workspace 与 LEAN_LINKS_ROOT。旧独立根的 settings/manifest/server 脚本可作为构造参考，不能启动真实账户 profile 或读取原认证 fixture。

`node --check` 两个 helper 退出 0。错误 expected-port=19521、错误 endpoint 19521 两项均在任何 HTTP 前明确失败，结果见 `/private/tmp/ell145-4kvrbik_/guard-failures.json`。本记录只供主线程按未改动的外链链路评估 147/148/149 是否沿用；16 条来源始终标注为真实 145 + 146，不写后续版本已重新运行。
