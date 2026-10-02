# M4/M6 · inline completion unification 运行链清理

144 候选解绑了普通语言功能中残留的 AI migration/unification 服务、状态 RPC 和旧设置重启消费者。普通第三方 inline completion、`inlineCompletionsAdditions` 的普通 provider 成员及其遥测继续保留。真实最终 app 的双权限宿主与注册表复验尚待集成后执行，不把源码进程测试写成真实宿主通过。

## 红证据与根因

- 基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33 +114–138；实际 app、PID6084、隔离 profile 和已加载脚本身份见 [M6-runtime-registries.json](M6-runtime-registries.json)。捕获时间 2026-10-01T15:47:44.377Z。
- 已加载 workbench.desktop.main.js 的 SHA256 与 app 磁盘文件一致：`ad53b5cb14fe1142dfc0f8ba0a048971f59b41c350a59b499e1f40df049d95e9`。真实 singleton descriptors 有 `inlineCompletionsUnificationService`，现有 Workbench ServiceCollection 中已为 instance-or-proxy，不能因其 delayed 声明便认定没有运行链。
- MainThreadLanguageFeatures 原第42/58/92行分别为 import、DI 和订阅/初始状态推送；ExtHostLanguageFeatures 原第2167/2717行存储状态、触发事件；extHost protocol 原第2124行声明状态 RPC。实际服务构造器读取 defaultChatAgent、监听 `chat.extensionUnification.enabled` 与扩展变化，并查询 assignment treatments；其最终默认状态为 false 不等于运行实现已移除。
- `SettingsChangeRelauncher` 原第32/70/95/194行包含 Chat 配置类型、监听项、observers 和重启处理。完整原类源码测试中，9项 Chat/agent 设置及 `accessibility.verbosity.debug` 各产生一次重启确认；旧设置虽无 schema，仍有运行作用。前后测试明细保存在 [M4-inline-unification.json](M4-inline-unification.json)。

## 候选及精确闭包

[144-light-inline-unification.patch](../../../patches/144-light-inline-unification.patch) 基于142私有后态生成。私有根由 `/tmp/lean-unification144-path` 指向；本轮没有改主集成源、共享 run.js、prune 或用户生成树。

| 文件（vscode/ 指私有快照中的目录） | 最终处理 |
| --- | --- |
| `vscode/src/vs/workbench/api/browser/mainThreadLanguageFeatures.ts` | 删除 unification import、DI、状态订阅和初始 RPC；普通语言与 inline provider 注册保持 |
| `vscode/src/vs/workbench/api/common/extHostLanguageFeatures.ts` | 删除状态字段、Emitter、状态 getter/event/RPC 接收器及未用 import；普通 adapter 与 provider RPC 保持 |
| `vscode/src/vs/workbench/api/common/extHost.protocol.ts` | 删除 unification 类型 import 和状态 RPC；未删普通 LanguageFeatures actor |
| `vscode/src/vs/workbench/api/common/extHost.api.impl.ts` | 两个 unification proposed 入口先执行原 `inlineCompletionsAdditions` 权限检查，再明确 unavailable；普通 provider 权限与转发保持 |
| `vscode/src/vs/workbench/workbench.common.main.ts` | 删除服务 import；共享入口由主线程应用 |
| `vscode/src/vs/editor/contrib/inlineCompletions/browser/model/inlineCompletionsSource.ts` | 删除 `isRunningUnificationExperiment` 对 ordinary empty-response telemetry 配置的旁路；其他请求、遥测逻辑保持 |
| `vscode/src/vs/workbench/contrib/relauncher/browser/relauncher.contribution.ts` | 删除9项 Chat/agent 和1项退休 Debug 配置的监听、observers、配置类型与重启分支；普通 accessibilitySupport、其他普通重启条件保持 |

主线程单写 prune，需要添加精确文件 `vscode/src/vs/workbench/services/inlineCompletions/common/inlineCompletionsUnification.ts`。私有验证已物理移除该文件；144补丁不与 prune 重复拥有删除动作。整个 `inlineCompletionsAdditions` 不能列为退休 proposal，普通 `IAiEditTelemetryService` 不能按名字删除。`EnablementState.DisabledByUnification` 仅余兼容枚举值，保持既有数字；assignment filter 的通用缓存测试也没有被按样例字符串删除。

工厂 [extHost.api.impl.ts](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-unification144-4lowcmmj/vscode/src/vs/workbench/api/common/extHost.api.impl.ts:216) 仍对 `Object.values(ExtHostContext)` 执行完整 `assertRegistered`；补丁没有过滤 actor 校验或新增空服务。

## 验证和待补验

| 检查 | 结果与边界 |
| --- | --- |
| `git apply --check` | 在142私有后态通过；没有在共享源实际 apply |
| 全源码 native `tsc -p src/tsconfig.json --noEmit` | 最终 exit0，日志0 bytes；服务文件已实际删除，未改 tsconfig/skipLibCheck |
| 实际 MainThread/ExtHost 双侧源码回归 | 完整两类源码 bundle，173 runtime inputs、0退休域输入；未授权/授权两轮均完成普通 provider 注册、提供 TAIL、遥测和幂等 dispose；授权 show callback 执行，未授权普通 metadata 注册仍受原 proposal 检查 |
| 两个实际 factory 成员 | 从原 factory 逐字提取三个相关成员，使用真实权限检查与本地 unavailable；双权限两退休入口符合预期。这不是完整 factory/DI 或 Electron 宿主测试 |
| 实际 SettingsChangeRelauncher 红绿 | 完整实际类源码，10项退休配置提示由各1次变为0；普通 workbench.enableExperiments 改动前后均提示1次。测试不启动 GUI、不重启 app |
| 共享宿主 fixture 建议 | 私有 `fixture-run.suggestion.patch` 增加两个 proposed case、仅测试授权列表的 inlineCompletionsAdditions，以及普通 provider 触发/接受实际文本和授权 callback；`node --check` 通过，主线程审查后应用 |

[TODO] 集成144及精确 prune 后，在最终 app 的两个真实 extension host 权限模式运行新增 fixture，核对宿主结果和实际插入文本；重新枚举 singleton、ServiceCollection、协议/已加载输入确认 unification 不在运行链。使用 fresh profile 做 cold/reload 日志验收。注册表旧探针的 serialize 错误保留在 M6 记录，不复用其 profile 宣称 clean logs。
