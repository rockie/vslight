# M6 · 151 main/shared 现存注册表与 Reload 实机证据

结论：**PASS，限Cold/真实Reload现存main/shared注册channel、活utility及普通宿主生命周期。** 直接runtime actor table没有捕获，不能把源码60/55个ID记成实枚举actor；完整M6/M8结论由主线程汇总。[完整评估JSON](M6-main-shared151.json)与[原始独立证据目录](M6-main-shared151.evidence/)保留逐项身份、hash、执行返回、快照、生命周期和日志。

## 独占载体与身份

收到主线程“GUI已释放”后，于 `2026-10-02T11:13:26.926272+00:00` 才启动自己的child main39925。app为 `/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app`；全新私有根 `/private/tmp/lc151ms-wdn5hck0`，profile为其 `u`；renderer19550/main inspector19551/shared inspector19552。没有访问原profile、installed app或主线程19542，不修改产品/计划/smoke/CI/TCC，没有commit/push。本轮只创建自有私有fixture/runner及本记录、JSON、独立evidence。

helper [main-shared-registry.mjs](../../../dev/test-fixtures/lean-core/main-shared-registry.mjs) SHA `c24aa7b0f12a1d143134579f14745c8e19b0be3d9530e559024aea54bbc392e0`，与149冻结helper一致。采集按149方法：先核验actual executable、main/child PID、精确profile与inspect参数、listener owner、独立磁盘hash；随后核验唯一实际已加载script完整字节、callback Module binding、constructor精确source位置与prototype身份，读取现存对象own数据map，末尾重新核验authority。四次执行exit0、authorityRechecked=true。采集无产品import、DI get、service factory、channel call或实例创建；utility只保留pid/type/name/entryPoint/parentPID，不输出env、任意startup options或服务对象。

实际已加载/disk/预先冻结151产物hash一致：main.js `3c5ab0fabf35928c2ee15650b97fdf5e199603aceaa5d377525e155bcfbe7718`；sharedProcessMain.js `9cd32e165e4ecc37b49889113b7acd38651ac8229920c084481f1211ec160b79`。来源为持久signed151 app和 `/private/tmp/lean-core-build151-c480juxs/vscodium/VSCode-darwin-arm64/VSLight.app` 同路径文件。原始脚本与精确constructor/source chain见各snapshot，不用源文件模拟运行注册表。

## Cold 与真实 Reload

| 捕获 | actual PID | UTC | ChannelServer / IPCServer实例 | 唯一channel名 | pending |
| --- | ---: | --- | --- | ---: | ---: |
| cold main | 39925 | 2026-10-02T11:13:30.278Z | 2 / 2 | 24 | 0 |
| cold shared | 40135 | 2026-10-02T11:13:30.731Z | 2 / 1 | 17 | 0 |
| Reload main | 39925 | 2026-10-02T11:13:32.642Z | 2 / 2 | 24 | 0 |
| Reload shared | 40135 | 2026-10-02T11:13:33.003Z | 2 / 1 | 17 | 0 |

main完整24名：diagnostics, encryption, extensionHostStarter, extensionhostdebugservice, externalTerminal, keyboardLayout, launch, localFilesystem, localPty, logger, menubar, meteredConnection, nativeHost, policy, process, profileStorageListener, sign, storage, update, url, userDataProfiles, utilityProcessWorker, webview, workspaces。

shared完整17名：IUserDataSyncResourceProviderService, checksum, diagnostics, extensionGalleryManifest, extensionTipsService, extensions, languagePacks, localGit, remoteTunnel, sharedProcessTunnel, telemetryAppender, userDataAutoSync, userDataSync, userDataSyncAccount, userDataSyncMachines, userDataSyncStoreManagement, v8InspectProfiling。

Cold/Reload两侧名称逐项一致，与149普通完整名称契约相同。23个精确退休名来自125浏览器闭包、130后台入口和149来源记录：browserView, browserViewGroup, playwright, nativeManagedSettings, fileManagedSettings, webContentExtractor, sharedWebContentExtractor, sandboxHelper, NativeMcpDiscoveryHelper, mcpGateway, mcpGatewayToolBroker, mcpManagement, mcpGalleryManifest, customEndpointTelemetry, localTranscription, agentHost, agentHostLogger, agentHostConnectionTracker, agentHostProtocol, agentHostManagement, agentHostProxy, agentHostClientProxy, agentHostClientByokLm，四次集合交集全部为空。空pending不表示active requests为0；本次实际main两连接有37/13个active requests，shared分别有普通订阅计数，原值保留在snapshot。

shared IPC base不在直接Module binding时，helper从Module中已存在的subclass own prototype、真实父prototype的own constructor取得base，再核验exact constructor/prototype与source位置；两轮existingSourceChain的ownPrototypeParentIsExactBase=true。没有把缺失binding视为空集合，也没有实例化对象。派生prototype的queryObjects结果按helper方法另计排除，不伪报为活server/utility。

普通fixture两轮实际API1.135.0，`workspace.fs.readFile`、openTextDocument、showTextDocument都成功，文本32字节内容保持。Cold host41146的public `workbench.action.reloadWindow` request于 `2026-10-02T11:13:30.826Z` 已被消费，旧host实际exit0；新host41471于 `2026-10-02T11:13:31.206Z`完成普通API readiness，main39925保持不变。旧host的command Promise返回Canceled，保留为真实旧宿主销毁结果；不是命令response PASS。Reload成功由request消费、旧PID实际消失、新PID/普通API结果与重新捕获证明。

| 阶段 | 活utility pid/type | parent | entryPoint |
| --- | --- | ---: | --- |
| cold | 40135 / shared-process | 39925 | vs/code/electron-utility/sharedProcess/sharedProcessMain |
| cold | 40136 / fileWatcher | 39925 | vs/platform/files/node/watcher/watcherMain |
| cold | 41146 / extensionHost | 39925 | vs/workbench/api/node/extensionHostProcess |
| Reload | 41471 / extensionHost | 39925 | vs/workbench/api/node/extensionHostProcess |
| Reload | 40135 / shared-process | 39925 | vs/code/electron-utility/sharedProcess/sharedProcessMain |
| Reload | 41470 / fileWatcher | 39925 | vs/platform/files/node/watcher/watcherMain |

两次utility静态all的PID集合与活实例集合精确相同，inactive0，未知/退休角色0。短普通文件fixture没有spawn ptyHost；main localPty注册保留，不据此宣称本轮PTY执行通过，root另有151实际terminal/task证据。

## RPC assert 与 actor 边界

冻结151 source [extHost.protocol.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/src/vs/workbench/api/common/extHost.protocol.ts:2721) 的MainContext为60个普通ID，`:2784`的ExtHostContext为55个普通ID；Chat/MCP/Speech/Browser/LanguageModel/agentHost/transcription/playwright/notebook/debug退休ID名称匹配0。完整source hash/ID清单在[静态RPC证据](M6-main-shared151.evidence/static-rpc-source.json)。

[extHost.api.impl.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/src/vs/workbench/api/common/extHost.api.impl.ts:216)仍取全部ExtHostContext，`:217`执行assertRegistered；[mainThreadExtensionService.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/src/vs/workbench/api/browser/mainThreadExtensionService.ts:58)将全部MainContext传入，[extensionHostManager.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/src/vs/workbench/services/extensions/common/extensionHostManager.ts:314)执行assertRegistered。[rpcProtocol.ts](/private/tmp/lean-core-build151-c480juxs/vscodium/vscode/src/vs/workbench/services/extensions/common/rpcProtocol.ts:271)实际方法逐项检查locals，`:275`对缺proxy抛错。没有全局关闭校验，完整普通宿主在Cold和Reload两轮实际运行，日志无缺DI/customer/proxy/method/RPC异常。

这是**静态完整校验链加真实普通宿主运行**，没有读取真实remaining actor table；不把这两项扩大为“完整runtime actor实枚举通过”。本次也没有枚举main/shared所有DI service ID，直接覆盖对象为完整ChannelServer/IPCServer现存map与活utility。

## 日志和退出

正常退出后复制自有新profile全部17份文本log；LevelDB未读、未复制。完整profilewarning4、error0；四warning均为Cold/Reload各两条Git resource-scope查询。Reload区间从本地 `2026-10-02 21:13:30.826` request消费开始，warning2/error0。Unknown service、Missing proxy/customer/actor初始化、Unknown channel、缺RPC method/协议、退休后台/download等明示regex全部0。日志每文件bytes/hash和逐行计数见[日志审查](M6-main-shared151.evidence/log-assessment.json)。

launch stderr另保留remote-debugging-port转发warning1、Node DEP0169 url.parse弃用warning1、main inspector attached/ending各2。无时间的stderr部分未冒充Reload区间，不声称全级别zero-warning。

新host41471的public `workbench.action.quit` request于 `2026-10-02T11:13:33.128Z`实际消费；自有child的真实waitExitCode=0，完成于 `2026-10-02T11:13:33.451943+00:00`，没有terminate/kill兜底。再次独立检查main、两轮host、shared及watcher全部已退出，19550/19551/19552无listener，[cleanup核验](M6-main-shared151.evidence/cleanup-verification.json)记录全部PID/端口。已向主线程回报GUI释放。

本轮补齐151直接main/shared注册channel与utility子门。观察窗口只有本次Cold/Reload，不能证明未来所有按需worker/download永不活动；native菜单、renderer实体/实际terminal Set、账户/主题、CLI、全GUI矩阵和M8退出条件依其各自证据验收。
