# M8 · 150 普通 profile 数据保护与持久化准备

计划：[lean-core.md](../lean-core.md) §3、§9.2/V7/V9。状态：私有 fixture/profile 准备完成、静态检查通过；本 worker 没有 launch GUI，没有将待执行的退出/重启验收记通过。实际 controller 与单一 GUI 由主 agent 串行执行。

所有本轮准备仅写 `/private/tmp/lcfinal-chkarkup/ui` 和本文。未修改共享 fixture、六产品文档、生产源码、allowlist、用户 generated vscode 或 installed app；未读取真实用户 profile/keychain/token。基线数据是旧普通149测试 profile 的副本及本轮明确构造的 synthetic 哨兵，不能称为真实历史 Chat 导出。

## 来源与路径

- 只读来源：持久 `ordinary149/u/User/globalStorage/state.vscdb`，通过 SQLite backup 复制为新 profile globalDB。旧 fixture settings.json 同样复制；未复制旧 workspace/editor 状态或依赖旧 workspace ID。
- 只读来源：持久 `search-theme149/e/zhuangtongfa.material-theme-3.20.2-universal`。完整目录复制到私有 e，extensions.json 的实际绝对路径改为新目录；版本 3.20.2、主题 One Dark Pro。
- 新 profile：`/private/tmp/lcfinal-chkarkup/ui/u`；扩展目录 e；development fixture ext/ordinary.js，id `lean-tests.lean-ui-final`；workspace w。controller 必须按 `file:///private/tmp/lcfinal-chkarkup/ui/w` 打开，不替换为 `/tmp` URI。
- globalDB：`ui/u/User/globalStorage/state.vscdb`；workspaceDB：`ui/u/User/workspaceStorage/87222462cdda108ffb51174a9c4d8430/state.vscdb`。workspace ID 按 150 workspaces.ts 的 macOS fsPath+birthtime.getTime() MD5 算法计算。workspace.json 指向新 URI。
- 可复核构造脚本 `/private/tmp/lcfinal-chkarkup/ui/prepare-persistence.py`；原 ordinary.js 备份为 `/private/tmp/lcfinal-chkarkup/ui/ordinary.pre-persistence.js`；插入探针为 `/private/tmp/lcfinal-chkarkup/ui/persistence-insert.js`；全部 baseline 在 `/private/tmp/lcfinal-chkarkup/ui/preservedKeys.json`。这些路径均为测试 root 内载体。

## synthetic 账户、偏好与数据保护

依据只读 150 源码 authenticationAccessService.ts 的授权键 `${providerId}-${accountName}`，authenticationExtensionsService.ts 的 account preference 键 `${extensionId}-${providerId}`、session preference 键 `${extensionId}-${providerId}-${scopes.join(' ')}`，以及 extensionStorage.ts 的扩展 globalState 键实际格式，注入以下纯假数据：

- provider `lean-final-synthetic-auth`，两账户 Synthetic Alpha 150 / Synthetic Beta 150；两会话均存在、均授权当前 fixture。globalState 预置两会话与仅 fake token；account preference 指向 beta，legacy session preference 亦指向 beta。workspaceDB 与 globalDB 偏好一致。
- provider 通过公开 registerAuthenticationProvider 注册。persistence-status 通过真实 getAccounts 及 getSession(silent=true、无显式 account) 检查 beta 会话，provider getSessions 计数须增加，create/remove 计数必须为0。两个会话均允许访问，避免只剩一个会话时的 fallback 掩盖偏好损失。token 仅比较相等布尔，结果不返回 token。
- globalDB 共9个注入键；workspaceDB 共3个。包括 ordinary extension globalState、auth grant/preference、退休域 chat.sessions/mcp.synthetic.legacyState、workspace history，以及一个 synthetic secret:// 旧凭据占位。后者是明确假的字节哨兵，**不是可解密的真实 SecretStorage 密文**，本轮只验证删除退休服务未删除该旧字节；真实 SecretStorage 语义仍由 [150 原实测](M4-secret150-runtime.md)负责。
- User/mcp.json、synthetic chat history 文件、fake credential 文件保留 SHA256/字节数。旧 chat.agent.enabled=true 和 mcp.discovery.enabled=true 设置预置留盘，不恢复退休功能。

## 扩展状态与主题

创建纯普通扩展 `lean-tests.lean-disabled-final`（0.0.1），在同一私有 e 安装清单里存在，启动激活会写本测试 root 的 marker。依据实际 extensionManagement.ts 的 `extensionsIdentifiers/disabled` 和 GlobalExtensionEnablementService 的 JSON identifier 列表格式，预置为禁用。persistence-status 断言该扩展 manifest 存在、公共 getExtension 不可见、activation marker 不存在；controller 仍应核对真实 renderer enablement 状态，不能只把 DB 里有这个键当产品读取通过。

One Dark Pro 的 apply-theme 仍使用原公开配置/manifest 检查 action；persistence-status 返回 configuredTheme、实际扩展 id/path/version 与 activeColorThemeKind。这些 API 结果不能独立证明具体主题 token/显示，controller 应沿现有 renderer/CSS/截图核对，并在真实 quit/restart 后复取。

## action 与 controller 执行顺序

request.json 接口：`{id, action: 'persistence-status', phase: 'before' | 'after'}`；响应写同 root response.json，失败保留原 assert stack，不绕过认证 RPC。

1. controller 启动150实际 app，使用私有 u/e/w/ext 与 LEAN_ORDINARY_ROOT；等本轮 PID 的 ready.json，不复用历史 ready/PID。
2. 执行 content-search、apply-theme 并完成实际 renderer/截图断言；执行 persistence-status phase=before。此步检验所有 seeded globalState 及真实 auth，并**仅此步**真实 globalState.update persistenceWritten=`SYNTHETIC_WRITE_BEFORE_QUIT_150`。
3. 真 quit 并 wait 主进程正常 exit0。运行 `python3 /private/tmp/lcfinal-chkarkup/ui/check-preservation.py --stage afterquit`：只读 DB 核对12个 baseline key，扩展 state 唯一允许新增 persistenceWritten 且必须精确相等；核对6个文件 SHA/字节、退休设置和禁用 activation marker。不得重跑准备脚本。controller 的等价接口为 `python3 /private/tmp/lcfinal-chkarkup/ui/persistence-audit.py cold`，分别保存 cold/restart 回执，失败不改写。
4. 以同一个 URI/u/e/ext 重启、复核实际新 main/host PID；执行 persistence-status phase=after。after 只读验证 pre-quit 写入，不能再次写该值掩盖丢失。复核 renderer 的实际主题与扩展禁用；再次实际 quit0 与 `python3 /private/tmp/lcfinal-chkarkup/ui/persistence-audit.py restart`。

准备验收：ordinary.js 使用现有 Node24.18.0 --check 退出0；两 SQLite integrity_check 均 ok；`check-preservation.py --stage prepared` 退出0，12 keys/6 files 通过，回执 `/private/tmp/lcfinal-chkarkup/ui/evidence/preservation-prepared.json`。一次 Node shim 命中 mise 的 Operation not permitted；未安装或改配置，已核对现有实际 Node24.18.0 路径后完成同一只读计算。该准备检查不运行宿主，也不把实际数据保护、主题、账户授权或退出/重启判绿。
