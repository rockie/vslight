# M6/M8 · main/shared-process 运行注册表探针

独立 [main-shared-registry.mjs](../../../dev/test-fixtures/lean-core/main-shared-registry.mjs) 已对主线程启动的正式 **145+146** app 完成 cold 与真实 Reload 后 main/shared 的既有对象验收：24/17 个 channel，4 个普通 utility；23 个已核对退休 channel 名称均无命中，完整 profile 的六类 RPC/DI 错误 pattern 均为零。**这是 main/shared 注册实体与角色子项通过，完整 V5/V6/M6/M8 未判定通过**。历史测试 driver 连续重放 Reload 造成的 199 条 tasks 输出文件碰撞保留并单独分类；最终单次 Reload 区间无 warning/error。认证 PID62872 与 19480 原请求保持不变。

- 对应 [lean-core.md](../lean-core.md) §5.5/5.6、§9.3，V5/V6、M6/M8；与 [renderer 注册表记录](M6-runtime-registries.md) 互补。
- 代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；本任务仅新增独立 helper 与本记录，不改共享 fixture、计划、prune、源码或构建脚本。
- 静态来源：正式 144 prepared 源码；正式 144 未签名 bundle 读取后，再与 [保留的签名 144 app](M8-sign144.json) 两个 JS bundle 的 SHA256 复核相同。主线程随后复用 build144 临时根重建 145+146，根目录不能被当作冻结的 144 源快照。
- 准备证据：[preparation.json](/tmp/lean-main-shared-prep-88hyqy1v/preparation.json)，status 为 STATIC_PREPARATION_ONLY_NO_PRODUCT_RUNTIME；它保留准备期 helper 的历史 hash。最终运行 helper/hash 与 cold 判定见 [main-shared-assessment-cold.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/main-shared-assessment-cold.json)。
- 最终 cold/Reload 判定：[main-shared-assessment-cold-reload.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/main-shared-assessment-cold-reload.json)，status 为 COLD_RELOAD_MAIN_SHARED_REGISTERED_ENTITIES_PASS_DI_RPC_ZERO。helper SHA256=`c24aa7b0f12a1d143134579f14745c8e19b0be3d9530e559024aea54bbc392e0`。

## 正式产物与 CLI 的已核对事实

main 入口是 app/out/main.js，不是 app/out/vs/code/electron-main/main.js；后者不存在。main bundle 没有可用 main export。shared bundle 导出 main，但本 helper 也不导入它。

| 正式 144 bundle | 字节 | SHA256 | 精确类绑定 |
| --- | ---: | --- | --- |
| main | 1,056,300 | `09643e096b5489af8d3a308581af7b94d81c30c78afbf32775491bda3e3f16ce` | ChannelServer=Vf，IPCServer=qf，UtilityProcess=Ls |
| sharedProcessMain | 1,009,934 | `13778cd8bcb9c5f61def3054dbd60c7c9c80253886b188e524524f59a8978707` | ChannelServer=Gw，IPCServer=Kw |

以上绑定只描述实读的 144 包。helper 每次从已核对 SHA256 的实际加载源码重新找唯一存储标记，不能把这些短名盲用到 145/146。

[argv.ts](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/environment/node/argv.ts:157) 接受 inspect-sharedprocess / inspect-brk-sharedprocess，main 接受 inspect / inspect-brk。[parseDebugParams](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/environment/common/environmentService.ts:315) 对 built app 的空字符串不提供默认端口，因此最终 launch 必须有显式数值，例如：

```text
--inspect=19501 --inspect-sharedprocess=19502
```

不使用 inspect-brk，避免把正常启动停在断点。这里的 main/shared inspector 与 renderer 的 remote-debugging-port 是不同接口；Electron 官方也明确区分 main inspector 与 renderer DevTools。[Electron main 调试说明](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)

[SharedProcess.createUtilityProcess](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/sharedProcess/electron-main/sharedProcess.ts:160) 将 shared port 放入 utility 的 execArgv。shared 在首个窗口请求连接后才创建；未形成普通窗口连接，不能把没有 shared listener 当成退休后台不存在。[firstWindowConnectionBarrier](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/sharedProcess/electron-main/sharedProcess.ts:124)

## 只读路径与失败边界

helper 在任何 HTTP/CDP 前验证：expected-app 的实际 CFBundleExecutable、main PID 的 executable 和 user-data-dir realpath、精确 inspect 参数、目标 PID 的 app 父子关系、目标 executable 所属 bundle、该 PID 独占的 127.0.0.1 listener、磁盘 JS 与独立传入的 expected-sha256。输出须是 app/profile 外的新目录。19480 硬拒绝，即使调用者错误指定也不联网。

连接只能是该监听端口提供的唯一 Node inspector target。取得 runtime pid/ppid 后再次与 OS 身份核对；Debugger 已加载脚本中要求唯一匹配该 app 的实际 main/shared 路径，getScriptSource 的完整字节和 SHA256 必须与磁盘及独立预期相同。

main/shared 现有 process uncaughtException / unhandledRejection 回调用于访问已存在的 Module scope。回调 FunctionLocation 和每个候选 constructor FunctionLocation 都必须属于上述已验脚本，constructor 的行/列还必须精确匹配该 bundle 的静态位置；缺少 Module scope、存储标记不唯一或精确 prototype 身份不符即失败。**没有 import、factory 或 DI fallback**。

shared 的 Kw 不在 V8 暴露的 Module bindings 中，但已经初始化的 UtilityProcessMessagePortServer 类 Yw 存在。helper 用该 Module 中真实 Yw constructor 的 own prototype，再读其 [[Prototype]] 的 own constructor 取得现存 Kw。Yw/Kw 的精确脚本位置、own constructor/prototype 身份和方法集合全部核验；没有构造实例、加载新模块或调用产品方法。若这个真实对象关系不可验证仍失败，不能把缺失 binding 当成空注册表。

[ChannelServer](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/base/parts/ipc/common/ipc.ts:332) 和 [IPCServer](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/base/parts/ipc/common/ipc.ts:828) 都把已注册 channel 保存在 own channels Map。IPCServer 还保留连接集合，并把新注册 channel 复制到已有连接的 ChannelServer；只枚举其中一个类会丢掉部分服务端证据。[registerChannel](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/base/parts/ipc/common/ipc.ts:985)

helper 使用经过身份校验的 prototype 做 Runtime.queryObjects，只读取已存在实例的 own 数据描述符，再用原生 Map/Set 方法读取 channel **名称与数量**、连接数和请求数量；不读取 channel 值、参数、service 对象或 RPC proxy。queryObjects 同时返回派生类的 prototype 对象；仅当其 own constructor 的 own prototype 严格等于该对象时才排除，并单独计数，未知形状仍失败。没有注册 channel 的快照失败，不能代表产品初始化完成。

[UtilityProcess](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/utilityProcess/electron-main/utilityProcess.ts:153) 的 own configuration 在实际 start 保存；spawn 后 processPid 和静态 all Map 保存活进程信息。helper 只取 **pid/type/name/entryPoint**，以及 OS 父进程 PID；静态 Map 只取 pid/name。不会输出 env、payload、任意 options、完整 startup args、tokens 或服务对象。[配置保存](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/utilityProcess/electron-main/utilityProcess.ts:243)、[活进程登记](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/utilityProcess/electron-main/utilityProcess.ts:322)

worker 角色的 entryPoint 来自实际 process.moduleId，因此可以辨认普通 utility 的模块，避免只根据通用 NodeService 命令行推断角色。[UtilityProcessWorkerMainService](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/platform/utilityProcess/electron-main/utilityProcessWorkerMainService.ts:130)

结束时 releaseObjectGroup 释放 inspector 引用，再复核 app/PID/profile/listener/disk hash；不暂停/恢复进程、不调用断言开关、DI.get、service factory、getAll、代理 channel.call、注册方法或产品命令。

## 最终实例交给主线程执行

主线程独占 app launch 与窗口。145+146 重构建后，主线程已提供实际 app、main PID、全新普通 fixture 的 user-data-dir、19501/19502 监听，以及两个独立记录的 bundle SHA256。下面命令已在该会话实跑；本 worker 不启动 GUI、不连接 19480。

下面变量必须使用同一次最终会话的真实值；DIAG_PROFILE 是实际 user-data-dir 本身，路径不得有空白。DIAG_MAIN_SHA / DIAG_SHARED_SHA 是主线程在 launch 前独立记录的最终 bundle hash，不能照抄 144 值。

```bash
node dev/test-fixtures/lean-core/main-shared-registry.mjs \
  --role main \
  --endpoint http://127.0.0.1:19501/json/list \
  --expected-app "$DIAG_APP" --pid "$DIAG_MAIN_PID" \
  --profile-root "$DIAG_PROFILE" --expected-port 19501 \
  --expected-sha256 "$DIAG_MAIN_SHA" \
  --output "$DIAG_OUTPUT/main-cold"
```

读取 main 快照中的 utilities.instances，选 type=shared-process、entryPoint=vs/code/electron-utility/sharedProcess/sharedProcessMain 的唯一活 PID，再用该 PID 和同一 main PID 执行：

```bash
node dev/test-fixtures/lean-core/main-shared-registry.mjs \
  --role shared \
  --endpoint http://127.0.0.1:19502/json/list \
  --expected-app "$DIAG_APP" --pid "$DIAG_SHARED_PID" \
  --main-pid "$DIAG_MAIN_PID" --profile-root "$DIAG_PROFILE" \
  --expected-port 19502 --expected-sha256 "$DIAG_SHARED_SHA" \
  --output "$DIAG_OUTPUT/shared-cold"
```

DIAG_OUTPUT 父目录须先存在；main-cold/shared-cold 子目录须不存在，helper 成功后各生成一份 snapshot.json。status 为 RUNTIME_CAPTURED_UNASSESSED，仅表示来源和对象读取成功。最终 V5/V6 仍须审核全部 channel 名称与实际 utility roles，匹配 §5.5/5.6 的完整退休清单，并验证普通保留 channels 仍在。主线程 Reload 后用新的输出目录、当前 shared PID 再捕获，不混用旧快照。

## 当前实际检查与剩余门

| 检查 | 已执行结果 | 范围 |
| --- | --- | --- |
| node --check | exit 0 | helper 语法 |
| 缺必填参数 | exit 1，Missing --role | 网络与输出前失败 |
| expected-port=19480 | exit 1，明确 forbidden；未创建 output | 网络前认证端口守卫 |
| endpoint 端口与 expected-port 不同 | exit 1；未创建 output | HTTP 前 |
| live main PID 但 profile 错误 | exit 1，精确隔离 profile 不匹配 | HTTP 前 |
| live main PID/listener 但 expected SHA256 错误 | exit 1，磁盘 hash 不匹配 | HTTP 前 |
| 已退出/不存在的 PID | exit 1，ps 权威检查失败 | HTTP 前 |
| 144 存储标记和绑定 | 两份实际 bundle 标记均唯一 | 静态准备 |
| 签名 144 对照 | main/shared SHA256 与先前未签名 144 实读值相同 | 来源复核 |
| 最终 app 的 callback Module scope/精确 prototype | cold 已验证，含 shared 的 Yw→Kw 来源链 | 真实既有对象 |
| 最终 main/shared registered channels、utility roles | cold 与真实 Reload 后子项通过 | 不是完整 V5/V6/M6/M8 判定 |

最终 helper 的六个失败守卫已在实际会话参数上重跑，全部 exit 1 且未创建输出目录，按代码顺序均未到 HTTP/CDP。原始原因和 helper hash 见 [main-shared-guard-results.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/main-shared-guard-results.json)；这些 guard PASS 只证明身份失败时拒绝，不代替产品验收。

## 正式 145+146 cold 实测

主线程后台冷启动 app，无需桌面焦点；实际 app 为复用 build144 根中的最终 145+146 产物。会话根为 `/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy`，user-data-dir 为其中 u。main PID27483/port19501，shared PID27724/port19502。主线程 launch.json 已在 launch 前独立记录 main/shared SHA256，恰与上表 144 相同；helper 仍逐次验证磁盘和实际已加载源码相同，没有因 hash 相同而跳过会话身份核查。

最终 [main cold 快照](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/cold-main-final/snapshot.json) 捕获于 2026-10-01T17:21:02.176Z，scriptId141；[shared cold 快照](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/cold-shared/snapshot.json) 为 scriptId154。两者都有 capture 前后完整权威复核，status 为 RUNTIME_CAPTURED_UNASSESSED；下面子项判定由离线审核完整名称/角色给出。

| 真实集合 | main | shared |
| --- | ---: | ---: |
| ChannelServer 实例 | 3 | 2 |
| IPCServer 实例 | 2 | 1 |
| 排除的 IPC 派生类 prototype 对象 | 2 | 1 |
| 已注册 channel 的唯一名称 | 24 | 17 |
| pending channel 数 | 0 | 0 |

main 的完整 24 名称为 diagnostics、encryption、extensionHostStarter、extensionhostdebugservice、externalTerminal、keyboardLayout、launch、localFilesystem、localPty、logger、menubar、meteredConnection、nativeHost、policy、process、profileStorageListener、sign、storage、update、url、userDataProfiles、utilityProcessWorker、webview、workspaces。Electron server 保留 21 项、Node server 保留 launch/diagnostics 2 项，另有 main→shared 逆向 ChannelServer 的 profileStorageListener。

shared 的完整 17 名称为 IUserDataSyncResourceProviderService、checksum、diagnostics、extensionGalleryManifest、extensionTipsService、extensions、languagePacks、localGit、remoteTunnel、sharedProcessTunnel、telemetryAppender、userDataAutoSync、userDataSync、userDataSyncAccount、userDataSyncMachines、userDataSyncStoreManagement、v8InspectProfiling。extensionGalleryManifest 在普通 service constructor 中实际注册，不能只按 initChannels 的显式调用行数计数。

| 活 UtilityProcess PID / parentPID | type / name | 实际 entryPoint |
| --- | --- | --- |
| 27724 / 27483 | shared-process / shared-process | vs/code/electron-utility/sharedProcess/sharedProcessMain |
| 27725 / 27483 | fileWatcher / file-watcher | vs/platform/files/node/watcher/watcherMain |
| 28808 / 27483 | extensionHost / extension-host | vs/workbench/api/node/extensionHostProcess |
| 29164 / 27483 | ptyHost / pty-host | vs/platform/terminal/node/ptyHostMain |

UtilityProcess 静态 all 的 PID 集合与实际实例集合一致；inactive 实例 0，排除的 WindowUtilityProcess prototype 1。上述四个 type/entryPoint 全是普通保留模块，没有退休模块前缀或未知角色。

退休 channel 精确表从 [125 撤浏览器入口](../../../patches/125-light-browser-runtime-closure.patch)、[130 撤后台入口](../../../patches/130-light-retired-background-entrypoints.patch) 和只读 upstream 常量解析：browserView、browserViewGroup、playwright、nativeManagedSettings、fileManagedSettings、webContentExtractor、sharedWebContentExtractor、sandboxHelper、NativeMcpDiscoveryHelper、mcpGateway、mcpGatewayToolBroker、mcpManagement、mcpGalleryManifest、customEndpointTelemetry、localTranscription、agentHost、agentHostLogger、agentHostConnectionTracker、agentHostProtocol、agentHostManagement、agentHostProxy、agentHostClientProxy、agentHostClientByokLm。两份完整 channel 表对这 **23 个名称均无命中**。

名称来源包括 [BrowserView 常量](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/browserView/common/browserView.ts:460)、[group 常量](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/browserView/common/browserViewGroup.ts:11)、[NativeMcpDiscoveryHelper](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/mcp/common/nativeMcpDiscoveryHelper.ts:12)、[MCP gateway/broker](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/mcp/common/mcpGateway.ts:13)、[MCP gallery 注册](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/mcp/common/mcpGalleryManifestServiceIpc.ts:31)、[transcription 常量](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/localTranscription/common/localTranscription.ts:13)、[AgentHost enum](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/agentHost/common/agentService.ts:52) 及两个 [client proxy](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/agentHost/common/agentHostClientProxyChannel.ts:19)/[BYOK](/Users/rockie/Documents/gh-xgent/vscodium/vscode/src/vs/platform/agentHost/common/agentHostClientByokLmChannel.ts:27) 常量。只读用户生成树以获取原退休契约，没有修改它。agent/transcription 部分名称属于其独立 retired worker 的协议，当前无对应 utility；这里的名称无命中只说明捕获的 main/shared server 范围，不冒充这些不存在 worker 的内部枚举。

精确判定与源文件 hashes 保存于上面的 main-shared-assessment-cold.json，状态为 COLD_MAIN_SHARED_REGISTERED_ENTITIES_PASS_RELOAD_PENDING。它只将当前 registered channels/活 UtilityProcess 子项判为 cold 通过，未将未来下载、按需后台、原生 UI 或完整 V5/V6 判为通过。

cold 等待点对 main/sharedprocess/renderer/exthost 四份实际 log 做只读 pattern 计数，Unknown service、Missing proxy、customer 初始化错误、Unknown channel、Method not found 均为 0。只保存文件 hash/字节与计数，没有复制原始配置、env 或 startup args；见 [main-shared-cold-log-counts.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/main-shared-cold-log-counts.json)。这不是整个产品 clean logs 的完整判定，Reload 后仍需复核。

首轮探针 fail-closed 与原因保留在会话根的 main-probe-cold*.stderr、shared-probe-cold*.stderr：IPC queryObjects 包含 2 个派生类 prototype，第一版把它们误当实例，own channels 断言失败；只读形状复核证明 ownChannels=2、derivedPrototypes=2、unexplained=0 后才增加精确排除。shared 首两轮证明 verifiedCallbacks=2、moduleScopes=2、Gw=function、Kw=absent；随后按真实 Yw 原型父链恢复并验证 Kw 的 scriptId154 / line29 / column2467，anchor Yw 为 line29 / column7021。失败没有生成验收快照，也没有触发 RPC、factory 或 assert 关闭。

## 真实 Reload 后复验与完整日志分类

主线程通过普通 fixture 执行最终单次 reload145-04。实际 [after-reload.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/after-reload.json) 记录 before extension host PID48687、after PID48841；exthost log 在 2026-10-02 03:28:10.480 +1000 确认新宿主启动。main PID27483、隔离 profile 不变；lsof 重新核对 shared listener 仍为 PID27724/19502。

[main Reload 快照](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/reload-main/snapshot.json) 和 [shared Reload 快照](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/reload-shared/snapshot.json) 各自重新执行全部前后权威、实际已加载脚本字节、callback Module、精确 ctor 位置/prototype 检查。两者完整 channel 名称与 cold 相同，数量仍为 24/17，ChannelServer 为 3/2、IPCServer 为 2/1，pending channel 均为 0；23 个精确退休名称均无命中。

Reload 时当前活 utility 为 shared27724、PTY29164、新 fileWatcher48840、新 extensionHost48841，父进程均为27483。四个角色的实际入口保持普通模块，静态 all 的 PID 集合与现有实例相同，无退休前缀或未知角色。没有把旧 extensionHost28808 当作当前活角色。

Reload driver 的来源边界：较早 reload145-03 在 response 写入过程中被实际 Reload 打断，留下 0B response；持久 request 随新宿主激活反复重放。主线程删除旧请求并修正独立普通 fixture 为 **consume-before-reload + 原子 response 写入**，随后才执行 reload145-04。最终 fixture SHA256 为 `12d3435630641dd0e044bf79564ee41d6077c104f15441bc4a97120fe34fb531`；最终 commandResponse 为 null，不能依赖它声称命令 response PASS，而以真实宿主 PID 变化、实际日志和重新捕获的活注册表证明 Reload 完成。本 worker没有改该 fixture或请求，也没有将测试 driver 重放记作退休服务初始化故障。

完整 profile 四类日志的原始字节 hash、全部 warning/error 行的安全分类、六类 RPC/DI pattern 计数，以及最终 Reload 区间计数保存在 [main-shared-reload-log-counts.json](/private/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-runtime145-kfi5v0yy/main-shared-reload-log-counts.json)。不输出 raw config/env/args。结果如下：

| 范围 | RPC/DI 六类 pattern | warning/error 分类 |
| --- | --- | --- |
| 整个当前 profile，含 driver 重放时期 | Unknown service、Missing proxy、customer/actor 初始化、Unknown channel、Method not found、RPC protocol 均为 0 | renderer 的 tasks 输出文件碰撞 error 共 199 条，其余三份 log 无 warning/error；不声称全 profile zero-error |
| 最终 reload145-04 区间，以新宿主生命周期行为界 | 同上全部 0 | warning/error 0 |

199 条历史 error 集中在 03:24:13–03:26:46 +1000，内容均为秒级 output 目录下 tasks.log 已存在且没有 overwrite。普通 [outputLocation](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/workbench/contrib/output/browser/outputServices.ts:350) 使用精确到秒的时间戳，[createFile](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/workbench/contrib/output/common/outputChannelModel.ts:813) 不传 overwrite；与 driver 在同秒内反复 Reload 的区间和资源形状相符。该原因判定结合主线程的真实 driver 重放记录与源码，是人工高频重放触发的普通日志文件碰撞；原始错误没有删除，不把它们归为主/shared 的 DI/RPC 故障。

sharedprocess.log 当前 0 字节，因此它的零命中不能单独证明初始化。真实 shared callback/ctor、2个连接、17个现存注册 channel 的直接快照提供独立初始化证据。单次快照不能证明将来没有按需 worker/download；最终源/生产闭包与运行区间观察仍由主线程整体验收。

144 shared 源 initChannels 的保留项包括 extensions、languagePacks、diagnostics、extensionTipsService、checksum、v8InspectProfiling、userDataSyncMachines/Account/StoreManagement、userDataSync、userDataAutoSync、IUserDataSyncResourceProviderService、共享 tunnel、remoteTunnel、localGit；telemetryAppender 按产品遥测条件注册。[shared initChannels](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/code/electron-utility/sharedProcess/sharedProcessMain.ts:387)

main 保留 launch/diagnostics、policy、localFilesystem、profiles/update/metered/process/encryption/sign/keyboardLayout/nativeHost/workspaces/menubar/url/webview/storage/pty/externalTerminal/logger、extension host 与 utility worker 的通用 channels。[main initChannels](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode/src/vs/code/electron-main/app.ts:1249) 这是源核对参考，不能充当 runtime 注册清单。

若未来实例的 inspector 无现有 callback Module scope 或无法验证精确 prototype，helper 必须保持 FAILED_NO_ACCEPTANCE；不把替代静态证据改写成 runtime PASS。可用 [M6 entrypoints](M6-entrypoints.md)、[源码闭包调查](M6-closure-inventory.md)、[144 生产包检查](M7-runtime144.json) 和最终重构建的 source/production graph、四类 logs 说明删除闭包。本次 145+146 已实际验证 cold/Reload 的直接 main/shared 对象；最终仍需结合普通 API/Webview/terminal、原生 UI 与运行区间证据完成整体 V5/V6/M8。
