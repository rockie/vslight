# M6 普通 platform/base 消费者解绑

[131-light-retired-platform-consumers.patch](../../../patches/131-light-retired-platform-consumers.patch) 修改 25 个保留文件，解绑 Agents 窗口派生、agent plugins profile 路径、agent-host-only tunnel、专属 managed-settings 账号契约、CustomEndpoint telemetry 契约与默认 Chat gallery 迁移。普通窗口/native IPC、Remote Tunnel Access、profile、配置 registry、OS policy 与普通 telemetry 保留。没有运行 app/GUI，也没有修改用户生成树或基线 app。

来源为 `/tmp/lean-core-api-5_lg434f/vscode` 在复制时的 prepared +114–126 与 130 候选入口改动；验证快照 `/tmp/pc-gmddp8i_`。根 out/out-build 排除复制，node_modules 只读 symlink，编译输出写私有 out。127/128/129 的整体集成不在此快照；唯一额外同步文件为 root 已集成 128 的 fixtureUtils，作为本次精确修改的 preimage。

## 保留消费者的修改

| 范围 / sourcepath | 最终行为 |
| --- | --- |
| `src/vs/platform/userDataProfile/common/userDataProfile.ts`、`src/vs/platform/userDataProfile/electron-main/userDataProfile.ts` | 去 Agents profile 特殊创建/默认继承/更新禁令/工作区关联，去 agentPluginsHome 及 CLI/env/path 派生；普通命名/临时 profile 和关联保留 |
| `src/vs/platform/window/common/window.ts`、`src/vs/platform/windows/electron-main/windows.ts`、`src/vs/platform/windows/electron-main/windowsMainService.ts`、`src/vs/platform/windows/electron-main/windowImpl.ts` | 去 openAgentsWindow、Sessions window config/profile 派生、Chat request/handoff IPC；普通新建/复用窗口、文件夹/文件、hot-exit 与普通 profile 选择保留 |
| `src/vs/platform/native/common/native.ts`、`src/vs/platform/native/electron-main/nativeHostMainService.ts`、`src/vs/platform/launch/electron-main/launchMainService.ts` | 去 Agents opening 与 Chat session handoff；普通 native channel/open/openEmpty/system-wide keybindings 等保留 |
| `src/vs/workbench/test/electron-browser/workbenchTestServices.ts` | 经 root/129 协调，仅去多余 TestNativeHostService.openAgentsWindow 方法与其专用 UriComponents import |
| `src/vs/platform/workspaces/electron-main/workspacesHistoryMainService.ts` | 去 AgentSessions workspace 的 canonicalize/重命名；普通历史合并、去重、recent documents/jump list 保留，原历史条目不转换为 Agents Window |
| `src/vs/platform/update/electron-main/updateRelaunchArguments.ts` | 更新重启不再携带三个 agents/plugin 专属目录参数；普通数据目录、扩展目录、locale、proxy、渲染和诊断参数保留 |
| `src/vs/platform/remoteTunnel/node/tunnelProcessCoordinator.ts` | 去 agent sharing request/API/target/CLI 分支；普通 remoteAccess 与 service 的 login、停止、替换、重启、machine-status events 保留 |
| `src/vs/platform/configuration/common/configurationRegistry.ts` | 去 agentHost 镜像 map/getter/隐藏设置 side table/重复镜像验证；普通配置、default override、policy 与 policyReference registry 保留 |
| `src/vs/platform/defaultAccount/common/defaultAccount.ts` | 去 managedSettings fetch/status/compatibility 专属接口、事件与常量；普通账户/provider/政策元数据、token 元数据、GitHub URL resolver 保留 |
| `src/vs/workbench/test/browser/componentFixtures/fixtureUtils.ts` | 从 root 的最终 128 原件冻结 preimage，仅删五个 managed-settings stub 成员，不覆盖 128 的 AI import/DI 解绑 |
| `src/vs/platform/telemetry/common/telemetry.ts`、`src/vs/platform/telemetry/common/telemetryUtils.ts` | 去只有退休 DebugSession 使用的 CustomEndpoint interface/endpoint DTO/Null 实现；普通 TelemetryService、TelemetryAppenderChannel、LogAppender 保留 |
| `src/vs/platform/extensionManagement/common/extensionGalleryService.ts` | 保留远端普通 extension control manifest，停止额外注入默认 Chat agent 的 Copilot Chat 迁移规则 |

普通配置 descriptor 的 agentHost / agentsWindow 属性仍作为兼容 schema 元数据存在；没有镜像值、连接 Agent Host 或特殊窗口配置行为。相关纯数据 strings/types 不等于运行服务。Profile 的 prompts/mcp/languageModels URI 字段也暂保留为历史数据形状：URI 构造/revive 不读取其文件内容。本次没有为退休实现增加空 adapter 或重新注册服务。

数据保护边界：`src/vs/platform/userDataProfile/common/userDataProfile.ts` 的历史 `builtin` 目录清理保护仍保留，停止特殊创建不等于删除历史目录。root 单独处理 storageDataCleaner，将旧 workspace 的纯 hash 保护从退休 environment getter 改为固定旧路径，已自行验证原字节保护；这不是本 worker 的测试结果。environment argv 与 agentSessionsWorkspace getter 属于 root 130，131 未越界修改。

## root 集成的精确 prune 叶路径

仅报告以下 26 个专属文件，由 root 写 prune；131 补丁不含整文件删除。静态入边审计在 `/tmp/pc-gmddp8i_/prune-consumers131.json`：NetworkFilter / OTEL 外部 owner 只有退休 AgentHost / Sessions / Chat / Sandbox / WebContentExtractor；managed policy 的普通旧入边由 129 与 root 130 解绑。普通 network/request/socket、base SQLite、常规 telemetry、历史和 OS policy 不在删除清单。

```text
src/vs/base/common/managedSettings.ts
src/vs/platform/policy/common/copilotManagedSettings.ts
src/vs/platform/policy/common/fileManagedSettingsIpc.ts
src/vs/platform/policy/common/fileManagedSettingsService.ts
src/vs/platform/policy/common/nativeManagedSettingsIpc.ts
src/vs/platform/policy/node/nativeManagedSettingsService.ts
src/vs/platform/policy/test/common/copilotManagedSettings.test.ts
src/vs/platform/policy/test/common/fileManagedSettingsService.test.ts
src/vs/platform/policy/test/node/nativeManagedSettingsService.test.ts
src/vs/platform/telemetry/node/customEndpointTelemetryService.ts
src/vs/platform/telemetry/electron-browser/customEndpointTelemetryService.ts
src/vs/platform/networkFilter/common/domainMatcher.ts
src/vs/platform/networkFilter/common/networkFilterService.ts
src/vs/platform/networkFilter/common/settings.ts
src/vs/platform/networkFilter/test/common/domainMatcher.test.ts
src/vs/platform/networkFilter/test/common/networkFilterService.test.ts
src/vs/platform/otel/common/genAiAttributes.ts
src/vs/platform/otel/common/spanData.ts
src/vs/platform/otel/node/otlp/localOtlpReceiver.ts
src/vs/platform/otel/node/otlp/otlpJsonDecode.ts
src/vs/platform/otel/node/otlp/otlpJsonTypes.ts
src/vs/platform/otel/node/otlp/outboundForwarder.ts
src/vs/platform/otel/node/sqlite/otelSqliteStore.ts
src/vs/platform/otel/test/node/otlp/localOtlpReceiver.test.ts
src/vs/platform/otel/test/node/otlp/otlpJsonDecode.test.ts
src/vs/platform/otel/test/node/otlp/outboundForwarder.test.ts
```

`src/vs/base/common/managedSettings.ts` 是专属 marketplace 转换；实际 import/re-export 仅 Copilot policy 和退休 Chat plugins。普通 `src/vs/base/common/defaultAccount.ts` 的政策/token 元数据来自纯 `src/vs/base/common/policy.ts`，不依赖此专属实现，均保留。

协同边界已报告：root 130 去 main/app/shared/desktop/web 的 managed-settings 与 CustomEndpoint import/DI/channel；129 去 AccountPolicyService managed DI/projection/gate、DefaultAccount 后台 managed fetch 与 developerActions。131 删除 agentPluginsHome 后，普通 profile import/export 与三个工作台测试对象上的多余字段由 129 同步。剩余退休 Chat/Sessions 对删除 API/字段的引用应随父目录 retirement 关闭，不能恢复假实现。

## 实际验证

以下命令 cwd 均为 `/tmp/pc-gmddp8i_`。没有重跑旧 auth 39 或 128 helper suite。

- `node build/next/index.ts transpile`：exit 0，`transpile131-final.log`。后来新增的两个 test 及最后 registry 调整使用同一 `build/next/transpile.ts` 的 transpileFile 写私有 out。
- `node test/unit/node/index.js --run src/vs/platform/remoteTunnel/test/node/tunnelProcessCoordinator.test.ts --run src/vs/platform/userDataProfile/test/electron-main/userDataProfileMainService.test.ts --run src/vs/platform/update/test/electron-main/updateRelaunchArguments.test.ts`：runner 31 passing、exit 0；`ordinary131.log`。RemoteTunnel 与 relaunch 检查没有错误，但 profile 清理有 40 次 Canceled unhandled rejection，故这次不能按全套干净绿记录。
- 原 profile 实现/测试 control：`node profile-control131.mjs`，仅暂换私有 out 的三份原 profile 模块，finally 恢复。原件也出现 44 次相同 Canceled，runner 10 passing；`profile-control131.log`。根因为测试在延迟 state 保存完成前销毁 store，未执行 `StateService.close()`。
- 仅改受影响 profile test teardown 正常 close，未改产品 StateService。重跑 `node test/unit/node/index.js --run src/vs/platform/userDataProfile/test/electron-main/userDataProfileMainService.test.ts`：exit 0，runner 9 passing，0 unhandled rejection；`profile-final131.log`。删除的唯一案例属于 Agents profile 专属行为，其它普通案例保留。
- `node test/unit/browser/index.js --browser chromium --run src/vs/platform/configuration/test/common/configurationRegistry.test.ts --run src/vs/platform/telemetry/test/common/telemetryUtils.test.ts --run src/vs/platform/extensionManagement/test/common/extensionGalleryService.test.ts`：exit 0，64 passing，0 BAD；`common-final131.log`。这是受影响普通模块的既有 suite。

两个新增行为 case 实际先红后绿，红阶段只将对应产品模块的私有 out 暂换为 original131 版本，test 用新增版本；绿阶段恢复最终产品模块。命令仍用上述 Chromium runner 的单文件 run，加以下 grep：

| 新增场景 | grep | 红 / 绿 / 日志 |
| --- | --- | --- |
| 普通 extension control manifest 保留普通迁移，不因历史 defaultChatAgent metadata 注入 Chat 迁移 | `control manifest keeps ordinary` | 原实现 0 passing / 1 failing；最终 1 passing；`gallery-red131.log`、`gallery-green131.log` |
| 旧 agent schema metadata 不拒绝普通同 key descriptor 设置，也不将隐藏设置加入更新事件 | `legacy agent metadata` | 原实现 0 passing / 1 failing；最终 1 passing；`registry-red131.log`、`registry-green131.log` |

`node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`：exit 1，310 个诊断；`tsc131-delivery.log`。25 个修改文件均 0 诊断。全图仍包含未串行集成的 127/128/129、旧 shared entry 与退休父目录引用，不能称完整编译通过。Native/Electron 窗口行为这里只完成受影响源码类型检查，实际普通窗口/IPC/app 验收待 root；没有把 Chromium unit suite 当作真实 app 验收。

补丁 SHA-256：`0a12cd4459e250135e66bcfc97d9a5c90a18cc9db3e8ee60ea282b075567dd70`。重放 `/tmp/p131-zcdgdx41`：git apply --check 与 git apply 均 exit 0，25/25 文件与验证快照逐字节一致；证据 `/tmp/pc-gmddp8i_/replay131.json`。源码清单与 prune 清单分别为 `/tmp/pc-gmddp8i_/changed131.json`、`/tmp/pc-gmddp8i_/prune131.json`。
