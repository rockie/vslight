# M4 / V7 · 普通认证与 SecretStorage 真宿主 fixture

- 对应计划：[lean-core.md](../lean-core.md)，§4.1/§9.3，V7，M4/M8。
- 最近更新：2026-10-02 02:24 +1000。
- 状态：主线程已启动正式 138 真宿主，SecretStorage 跨 Reload 持久化及前置查询通过，共 6 个 request PASS。create-alpha 的 Allow 仍 RUNNING；主线程报告系统已锁定，等待用户解锁，没有重发/取消/重启请求。普通认证完整验收尚未通过。
- 代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，目标为正式 114–138 集成 app。本子任务只新增 [auth.js](../../../dev/test-fixtures/lean-core/auth.js) 和本记录；未修改共享 package.json、extension.js、普通 fixture、计划、prune、构建或已安装应用。

## fixture 的验证路径

独立扩展 ID 必须是 `lean-tests.lean-auth-runtime-fixture`，workspace 必须是 `LEAN_AUTH_ROOT/w`，不符合即停止激活。provider ID、两个账户 ID/label、session ID 和 secret key 均由私有根目录 hash 派生；从不向 github/microsoft 等真实 provider 请求账户或 session。

fixture 通过真实 `vscode.authentication.registerAuthenticationProvider` 注册支持多账户的合成 provider。`getAccounts` 和 `getSession` 每次都经过 VS Code API；provider 的 `getSessions/createSession/removeSession` 调用计数、参数、返回的合成 ID/账户/scopes 将写入生成的 state.json。accessToken 只在内存构造和比对，不写日志或 response。公共 `authentication.onDidChangeSessions` 必须收到自己的新增/删除事件。

创建账户必须用真实 `getSession(..., {createIfNone, account})`，需要主线程确认产品弹出的 Allow 对话框；重取则用同一 scopes、指定 account、`silent:true`，断言实际 session ID 相同、provider getSessions 计数增加且 createSession 不增加。两个账户使用同一 scopes，验证账户过滤没有串用 session。

公共 authentication API 没有 removeSession 函数，因此退出账户动作执行产品 `_signOutOfAccount` 命令，只传自己的 providerId/accountLabel。主线程点击真实 Sign Out 后，fixture 必须观察到主线程/RPC 调用 provider.removeSession、session 消失和公共变化事件；不直接调用 provider 方法来冒充完整产品链路。源事实已核对隔离源码的 [SignOutOfAccountAction](/tmp/lean-core-api-5_lg434f/vscode/src/vs/workbench/contrib/authentication/browser/actions/signOutOfAccountAction.ts:22) 与 [ExtHostAuthentication](/tmp/lean-core-api-5_lg434f/vscode/src/vs/workbench/api/common/extHostAuthentication.ts:181)。

SecretStorage 只读写独立扩展自身的 `lean-auth-private-<runId>` 一项合成值，验证 store/get/keys、覆盖、delete 和 change events。`secret-read` 支持 Reload Window 后确认值仍在；不读取真实账户 token、整个 secrets 表、keychain 或真实用户 profile。这里测试默认产品 SecretStorage API，没有换成内存 mock。

## 已备启动目录

`/tmp/lean-auth-runtime-path` 指向：

`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/auth138-21j6zn0w`

其 [独立 manifest](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/auth138-21j6zn0w/e/lean-auth-runtime-fixture/package.json)：name=`lean-auth-runtime-fixture`，publisher=`lean-tests`，main="./auth.js"，displayName=`Lean Private Auth Fixture`，activationEvents=`[onStartupFinished]`。auth.js 已复制进去。`u` 是全新用户数据，`w` 是全新 workspace；私有 settings 关闭 telemetry/startup editor/窗口恢复。准备时未 launch app；后续由主线程启动，实际结果见下段。

启动由主线程在独占 GUI 会话执行，正式 app 由 `/tmp/lean-core-final-build-path` 找到。设置 `LEAN_AUTH_ROOT` 为上述根目录后，传 `--user-data-dir "$LEAN_AUTH_ROOT/u" --extensions-dir "$LEAN_AUTH_ROOT/e" --locale en "$LEAN_AUTH_ROOT/w"`。CDP 端口由主线程安排；fixture 不创建窗口、不自行切换 GUI 焦点。

等待生成的 ready.json，核对 hostPid/parentPid、vscodeVersion、extensionId、root 和 `registeredThroughPublicApi=true`。每次 Reload Window 会产生新 bootId；请求读取器不会重放 reload 前残留的 request。

## request / response 与点击步骤

请求写到根目录的 request.json；id 必须是每次唯一的 1–80 字符字符串，仅字母、数字、`_`、`-`。例如：

```json
{"id":"auth-01","action":"create-alpha"}
```

生成的 response.json 先为 RUNNING，实际操作结束后为 PASS 或 FAIL；返回真实 API 断言结果及各 provider 调用增量。根目录生成的 state.json 可在等待 UI 时读取当前 pending、计数与不含 token 的轨迹；最终 response 另存 `responses/<id>.json`，保留顺序证据。一次只发一个请求，上一请求未结束时不要覆盖；PASS 表示该动作的 API 断言通过，完整 UI 仍需对应真实对话框证据与宿主 logs。

先做 SecretStorage persistence，再做认证，避免 Reload Window 清空合成 provider 的内存 sessions：

| 顺序 | action / 额外字段 | 断言与主线程动作 |
| --- | --- | --- |
| 1 | `secret-store` | 原值缺失；存 v1、读取相同、keys 包含私有 key、change event 到达 |
| 2 | 主线程 Developer: Reload Window | 等新 ready.json，核对新 bootId；不重发 secret-store |
| 3 | `secret-read`，`expectedVersion:"v1"` | 新宿主读取同一私有合成值，证明跨 Reload Window 持久化 |
| 4 | `secret-update` | v1 覆盖为 v2，读取一致、change event 到达 |
| 5 | `secret-delete` | 删除后 get 为 undefined、keys 不含私有 key、change event 到达 |
| 6 | `accounts-empty`、`silent-empty`（各独立 request） | 实际 getAccounts 空，silent getSession 为 undefined，未 create |
| 7 | `create-alpha` | 产品对话框应明确 `Lean Private Auth Fixture` 和 `Lean Synthetic Auth <runId>`；主线程点击 Allow。provider.createSession 一次，返回 Alpha 合成账户、scopes/token API roundtrip 与 public event 都正确 |
| 8 | `accounts-alpha`、`reuse-alpha` | 实际枚举仅 Alpha；重取同账户同 session，未 create |
| 9 | `create-beta` | 同样点击该合成 provider 的 Allow；创建 Beta，同 scopes、独立 session |
| 10 | `accounts-two`、`reuse-alpha`、`reuse-beta` | 实际枚举两账户；两次按 account 重取各自 session，未 create |
| 11 | `signout-alpha` | 产品对话框账户必须是 `Lean Synthetic Alpha <runId>`，主线程点击 Sign Out；实际 removeSession 一次、public event 到达 |
| 12 | `accounts-beta`、`silent-removed-alpha`、`reuse-beta` | Alpha 消失，silent 查 Alpha 为 undefined；Beta 仍可取，未 create |
| 13 | `signout-beta` | 只对 `Lean Synthetic Beta <runId>` 点击 Sign Out，实际 removeSession 与 public event 到达 |
| 14 | `accounts-empty`、`unregister` | 账户为空；dispose 后真实 getAccounts 拒绝 provider 已不存在 |
| 15 | `quit` | 请求正常退出；宿主可能在写最终 response 前退出，应另以进程 exit 证明退出 |

若用户取消 Allow 或 Sign Out，动作应 FAIL；不能跳过点击后把调用成功或自建 sessions 当通过。fixture 不打开浏览器或外部登录页面；若出现真实 provider、真实账户或外部 OAuth 页面，先核对是否启动了此私有扩展/profile。

## 2026-10-02 实机进度与当前等待点

来源为主线程启动的正式 138 app，版本 1.135.06566、真实 `vscode.version=1.135.0`，主进程 PID 62872。主线程说明 139/141/142 未修改认证链路，后续可沿用此产物对应的认证绿项。fixture SHA256 为 `1585680ae83194ae1127d413517edc155354136c8d257feb68ec8a18b1422531`，repo 与实际扩展副本相同。

初始 bootId 为 `2b287ebe-0036-40b8-9882-5b7171712d9d`，hostPid=64091；主线程实际执行 Reload Window 后，新的 bootId 为 `fac595c4-ee5f-41c8-b255-b5be5537bfc2`，hostPid=65169，两次 parentPid 都是 62872。第二宿主通过同一私有 key 读回 v1，没有重放旧 secret-store 请求。

| request | action | 实际结果 |
| --- | --- | --- |
| auth-live-01 | secret-store | PASS：合成值 store/get 一致，keys 包含私有 key，secretEvents +1 |
| 主线程 GUI | Reload Window | 通过：新 bootId/hostPID 确认，主进程不变 |
| auth-live-02 | secret-read / expectedVersion=v1 | PASS：新宿主读取旧宿主存的同一合成值 |
| auth-live-03 | secret-update | PASS：v1 覆盖 v2、读回一致，secretEvents +1 |
| auth-live-04 | secret-delete | PASS：get 为 undefined、keys 不含私有 key，secretEvents +1 |
| auth-live-05 | accounts-empty | PASS：真实 getAccounts 返回空，provider getSessions +1 |
| auth-live-06 | silent-empty | PASS：真实 silent getSession 返回 undefined，provider getSessions +1，createSession 无调用 |
| auth-live-07 | create-alpha | RUNNING：真实 provider 已查询 Alpha，无 session；尚未点击产品 Allow，createSession=0 |

主线程确认系统锁定并停止键操作；本子任务随后只读 CGSession 复核得到 `locked=true/onConsole=true`，未读写 GUI。该字典的 console 键实际是 `kCGSSessionOnConsoleKey`（双 S），先前主线程报告的 onConsole=false 不能沿用为当前判断；`kCGSessionOnConsoleKey` 不存在。锁定状态仍成立，状态证据另存 [session-lock-check.json](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/auth138-21j6zn0w/runtime-evidence/session-lock-check.json)，只输出锁定/console 布尔值，没有用户身份值。

当前等待对象是 PID62872 的实际认证对话框及 auth-live-07 request，不是已结束的旧会话。保留该进程与 request；解锁后只点击 `Lean Private Auth Fixture` / `Lean Synthetic Auth d418c6dd6a` 的 Allow，再观察同一 request 的 PASS，继续上表后续动作。不要重发、取消或重启宿主。全部动作最后停在 unregister 通过，由主线程退出 app。

实际证据保存于 [auth-summary.json](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/auth138-21j6zn0w/runtime-evidence/auth-summary.json)，包括两次 ready、6 份 PASS response、待 Allow 的 response/state、实际 app 命令、fixture hash 与私有日志副本索引。原始 response 在根目录 responses/，已存 snapshots 与 main/renderer/exthost/sharedprocess 日志在 runtime-evidence/。当前日志未检出 Unknown service/Missing proxy/customer/actor/authentication 错误；这是截至等待点的检查，完整后还需复查。

## 验证记录

| 项目 | 命令/证据 | 结果 |
| --- | --- | --- |
| JS 语法 | `node --check dev/test-fixtures/lean-core/auth.js` | exit 0 |
| 私有目录/manifest | 独立临时目录、复制 auth.js 与新 manifest；共享入口未改 | 已由主线程启动，真实 ready 确认独立身份 |
| 真实 provider/accounts/getSession/create/remove RPC | 上表动作、真实 response/state 与宿主 logs | 注册、空账户与 silent 查询通过；create-alpha 待 Allow，create/remove/双账户重取尚未通过 |
| 真实授权/退出账户对话框 | Alpha/Beta 的 Allow / Sign Out 截图及 response 调用增量 | create-alpha 请求已在真实对话框等待；系统锁定，尚未授权或退出 |
| SecretStorage 包括 Reload Window 持久化 | 新 bootId、keys/change events 与 API 返回断言 | 通过上述 4 个请求及实际 Reload，合成值已删除 |

完整验收后继续回写每项实际 PASS/FAIL、dialogs 和最终 logs。当前仅上述子项通过，不改变 M4/M8 里程碑状态。
