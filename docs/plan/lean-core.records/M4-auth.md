# M4 · Authentication query 行为验证

- 计划：[lean-core.md](../lean-core.md)，对应 M4 普通 authentication consumer 解绑。
- 最近更新：2026-10-01 22:19 AEST（UTC+10）。
- 状态：root 最新 query 源码的真实 Chromium suite 完成，测试修正后 39 项通过。122 auth 共享补丁由主 agent 生成、重放及全图集成；本记录不宣称 M4 全图、Accounts 菜单 UI 或真实宿主认证验收完成。
- 允许的共享仓库写入仅本记录。没有写产品源码、patch、prune、plan、基线 source/app、用户 vscode 或个人数据；测试修正仅在独立私有 source。

## 验证输入与代码事实

按 [lean-core-baseline.env](../../../dev/lean-core-baseline.env) 的 LEAN_BASELINE_ROOT，从 prepared+114 的 vscodium/vscode 创建 `/tmp/aq-jbs0ik75`。复制 src/test/build/scripts/remote、必要 manifest 与普通 theme JSON，根 out/out-build 未复制；node_modules 只读使用 symlink，转译与测试输出只写私有目录。

随后仅从 root 的 `/tmp/lean-core-api-5_lg434f/vscode` 覆盖下列三个文件，路径相对于 vscode：

```text
src/vs/workbench/services/authentication/common/authenticationQuery.ts
src/vs/workbench/services/authentication/browser/authenticationQueryService.ts
src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts
```

两个产品文件完全未在本任务修改，完成时与 root 源仍逐字节一致：

| 输入 | SHA256 |
| --- | --- |
| common/authenticationQuery.ts | d3da7ceefa8c8ec06ecd2f7268e5b4f937d8c793a3d29f6d47f5f691d0da8467 |
| browser/authenticationQueryService.ts | 8f569470c123e89460e79a23229731585e729979b3c1cfb7cab3a19981df9705 |

所有输入/测试修正哈希：[auth-inputs.json](/tmp/aq-jbs0ik75/auth-inputs.json)。root 原测试全文：[authenticationQueryService.test.root-original.ts](/tmp/aq-jbs0ik75/authenticationQueryService.test.root-original.ts)。

与原件对照可确认：MCP query classes/methods、MCP DI 与事件转发、access/usage/preference 的 MCP 读写均已从 query 产品代码删除。普通 extension/provider/account/access/usage/preference 的 query 路径和事件保留。IActiveEntities 仅有 extensions；getEntityCount 只去重统计 extensions，total 与 extensions 相等。account.remove/clearAllData 清理普通 extension access/usage，不为旧 MCP 历史添加迁移、删除或运行时读取逻辑。普通 preference 本身继续由 extension preference 服务管理，并未把 clearAllData 改成清空所有 storage。

## 红测试、根因与修正

以下命令 cwd 为 `/tmp/aq-jbs0ik75`，Chromium runner 提供真实 headless 浏览器 DOM；没有启动 VSLight app 或操作用户 GUI。

```bash
node build/next/index.ts transpile > auth-transpile-original.log 2>&1
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts \
  > auth-query-original.log 2>&1
```

转译 exit 0。root 提供的未修正 suite 实际 **37 passing / 1 failing**、exit 1；[日志](/tmp/aq-jbs0ik75/auth-query-original.log)。唯一失败为 isTrusted 测试使用未定义 trustedQuery，ReferenceError。原基线该测试是 MCP-only：创建 trusted/non-trusted MCP server 和 mcpServer query；移除这些代码后遗留了两条变量断言。其余普通 entity counts、provider/account listing、extension preferences、事件、access/usage 与清理测试已通过，没有产品计数失败。

私有 test 的修正仅两项：

1. 将失去主体的 MCP-only trusted 测试替换为普通 extension trust metadata 场景：以普通 access service fixture 写 trusted 和 user-managed extension，分别断言普通 extension query 的 isTrusted 为 true/false。
2. 新增一个使用真实普通 access/usage 服务与实际 TestStorageService 的独立集成场景，验证缺少全部 MCP DI 时构造和行为正常，并且不访问旧 MCP storage。

最终测试全文：[authenticationQueryService.test.ts](/tmp/aq-jbs0ik75/src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts)。仅相对 root 提供测试的修正 diff：[auth-query-test-correction.diff](/tmp/aq-jbs0ik75/auth-query-test-correction.diff)，SHA256 `42904d486f505e0ac59786f1e1e30f3b339b386610130d6600a76e2d49aaf2f6`。由主 agent 复制测试全文到主私有 source 并包含于 122；没有改产品源码来使测试通过。

## 新增场景的可断言行为

使用 strict TestInstantiationService + 独立 ServiceCollection，仅注册普通 authentication/provider、log、product、extensions、storage、access、usage 服务。没有 MCP service registration。AuthenticationAccessService 和 AuthenticationUsageService 为真实产品实现；authentication provider 与 extension preference 仍使用已有普通 test fixtures。这是 query/service 行为验证，不能当作 vscode.getSession/SecretStorage 的宿主 API 验收。

历史 key 来自原实际服务，不猜测格式：

| 历史项 | 原实际格式及来源 |
| --- | --- |
| MCP access | mcpserver-providerId-accountName；原 authenticationMcpAccessService.readAllowedMcpServers/updateAllowedMcpServers/removeAllowedMcpServers 使用 APPLICATION |
| MCP usage | providerId-accountName-mcpserver-usages；原 authenticationMcpUsageService.readAccountUsages/removeAccountUsage/addAccountUsage 使用 APPLICATION |
| MCP account preference | mcpServerId-providerId；原 authenticationMcpService._getKey/getAccountPreference 使用 WORKSPACE/APPLICATION |
| MCP session preference | mcpServerId-providerId-scopes；原 authenticationMcpService 使用空格连接 scopes，并读写 WORKSPACE/APPLICATION |

测试给两个账户的 access/usage 和一个 server 的 account/session preference 合成隔离哨兵值。为了同时防止跨 scope 的误读写，全部哨兵在 APPLICATION 与 WORKSPACE 都种入；access/usage 的 WORKSPACE 哨兵是额外防护，不冒称原服务会向该 scope 存储。session id 为测试专用字符串，不包含真实 token、session 或个人数据。

随后执行并明确断言：

- 未注册 MCP 服务的严格 DI 容器成功创建 AuthenticationQueryService。
- provider.getAccountNames 返回普通 provider 的两个账户；只存在 MCP 历史的账户 hasAnyUsage 为 false，entity count 为 `{ extensions: 0, total: 0 }`。
- 给普通 extension 加 access、usage 与 preference；preference 可查询，重合的 access/usage 只算一个实体，返回 `{ extensions: 1, total: 1 }`；active entities 只有普通 extension。
- removeAllAccess 撤销普通 access 但保留普通 usage；account.remove 删除普通 access/usage；重新添加后 clearAllData 同样清理成功。
- get/store/remove spy 均实际观察到普通 storage 操作；三类操作对所有历史 key 的调用数都为零。spy 只观察真实服务，没有替代方法实现。
- 恢复 spy 后，两个 scope 的全部历史哨兵值与初值逐字节相同。

已有其余普通 query suite 保留，未用删除普通断言、放宽产品行为或添加空 MCP adapter 的方式变绿。

## 绿色结果与待集成边界

```bash
node build/next/index.ts transpile > auth-transpile-green.log 2>&1
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/services/authentication/test/browser/authenticationQueryService.test.ts \
  > auth-query-green.log 2>&1
```

转译 exit 0；实际 **39 passing / 0 failing / 0 pending**，runner exit 0；[绿色日志](/tmp/aq-jbs0ik75/auth-query-green.log)。没有重跑已绿色的宿主 auth/session/secret suite。

另外执行 native TypeScript 检查，确认修改后的测试没有转译掩盖的类型错误：

```bash
node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit \
  > auth-full-tsc.log 2>&1
```

实际 exit 1，共 **27 条诊断 / 4 个文件**；[日志](/tmp/aq-jbs0ik75/auth-full-tsc.log)。query 两个产品文件和最终 test 无诊断。其余为 prepared+114 仍未退休的 authentication MCP actions（21 条）与 contrib/mcp 的 query consumer（6 条），等待主 agent prune/shared 集成。本快照只覆盖指定三个新文件，不能代表 root 全图最终状态。

另一个明确边界：root 当前 authenticationQueryServiceMocks 仍包含 unused TestMcp classes 与 MCP service imports。当前 39 绿使用这一原 helper；strict 新场景证明 query 构造不需要 MCP DI，但不能证明裁剪后 helper loader 已断链。主 agent 统一 prune MCP 服务时需同步清理 helper 的退休 imports/classes 及其专属测试。本任务未越界修改该 helper。

122 共享补丁生成、重放、全图编译和真实宿主/Accounts 菜单行为由主 agent 完成。本任务只交以上测试修正与可复查的运行证据。
