# 149 main/shared 现存注册表实机记录

2026-10-02（Australia/Sydney）。最终 149（147 + 148 + 149）的新有效普通 profile 已完成 cold 和唯一真实 Reload 后 main/shared 现存对象捕获：两阶段均为24 /17个 registered channel，23个精确退休名称均无命中；Reload 当前四个活 utility 均为普通保留角色，新 host2142 与真实生命周期证据一致。状态为 `COLD_RELOAD_MAIN_SHARED_REGISTERED_ENTITIES_PASS_DI_RPC_ZERO`；只是现存 main/shared 注册实体和活 utility 子项，不是完整 V5/V6/M6/M8 结论。完整评估见 [M6-main-shared149.json](M6-main-shared149.json)。

## 来源和只读约束

实际根 `/private/tmp/lc149-my6ky2od`，发现指针 `/tmp/lean-runtime149-path`。main PID91720 / 19501，shared PID91890 / 19502；实际 app 是 `/tmp/lean-core-build144-path` 指向的独立构建根内 `vscodium/VSCode-darwin-arm64/VSLight.app`，使用 profile `/private/tmp/lc149-my6ky2od/u`。主线程 launch 前独立记录的 main.js SHA-256 为 `2a407501836d01512c561f90950fbfc3f1d6730fe8ac52bb0f519331d889215c`；sharedProcessMain.js 为 `87b88f7e8393b86e2396d40728990ab95e99ab9ed2f5b498c351ba8ecc3e3048`。

冻结 [main-shared-registry.mjs](../../../dev/test-fixtures/lean-core/main-shared-registry.mjs) SHA-256 保持 `c24aa7b0f12a1d143134579f14745c8e19b0be3d9530e559024aea54bbc392e0`，本次没有修改 helper 或产品源码。逐次先核对实际 app executable、主 PID、精确 profile/inspect 参数、实际 listener owner/子进程关系和独立磁盘 hash，才连接 inspector。随后实际已加载 script 的完整字节和 hash 必须一致，callback Module、constructor 精确位置、prototype 和现存对象身份必须通过，末尾再复核权威身份。

捕获仅用 19501 和 19502，没有连接 renderer19500、认证19480，没有写普通 request、启动 app、调用 DI/service factory/channel 或 import 产品模块。utility 输出仅 pid/type/name/entryPoint/parentPID，未输出 env、任意 options、完整 startup args 或服务对象。

最初无效 fixture 的 engines.vscode=`*` 被宿主拒绝，主线程改为 `^1.130.0` 后关闭旧 main88231，并启动本记录的全新根。该失败只作 driver 来源边界，未将旧 profile 或旧宿主作为 149 clean cold 实证。当前 ready 的实际宿主为92930 / API1.135.0，与 main 的活 UtilityProcess 对象相符。

## 冷启动结果

[main cold 快照](/private/tmp/lc149-my6ky2od/cold-main149/snapshot.json) 捕获于 `2026-10-01T18:29:55.994Z`，scriptId141；[shared cold 快照](/private/tmp/lc149-my6ky2od/cold-shared149/snapshot.json) 捕获于 `2026-10-01T18:30:19.413Z`，scriptId154。两个快照原始 status 为 `RUNTIME_CAPTURED_UNASSESSED`，下面结果来自对完整名称、实例、utility 对象与日志的离线评估。

| 现存对象 | main | shared |
|---|---:|---:|
| ChannelServer 实例 | 2 | 2 |
| IPCServer 实例 | 2 | 1 |
| 唯一 registered channel 名称 | 24 | 17 |
| pending channel 数 | 0 | 0 |

main 24 个完整名称：diagnostics、encryption、extensionHostStarter、extensionhostdebugservice、externalTerminal、keyboardLayout、launch、localFilesystem、localPty、logger、menubar、meteredConnection、nativeHost、policy、process、profileStorageListener、sign、storage、update、url、userDataProfiles、utilityProcessWorker、webview、workspaces。

shared 17 个完整名称：IUserDataSyncResourceProviderService、checksum、diagnostics、extensionGalleryManifest、extensionTipsService、extensions、languagePacks、localGit、remoteTunnel、sharedProcessTunnel、telemetryAppender、userDataAutoSync、userDataSync、userDataSyncAccount、userDataSyncMachines、userDataSyncStoreManagement、v8InspectProfiling。

shared Kw 不在 callback Module 的直接 binding 中，使用该 Module 中真实 Yw 的 own prototype → 实际 prototype 父链 → own constructor 取得既有 Kw；Yw 位置 script154 / line29 / column7021，Kw 为 script154 / line29 / column2467，ownPrototypeParentIsExactBase=true。没有创建实例或把缺失 binding 当作空集合。这条来源链与 main 的精确 Vf/qf/Ls 构造器身份都保存在快照。

| 活 PID / parentPID | type / name | 实际 entryPoint |
|---|---|---|
| 91890 / 91720 | shared-process / shared-process | vs/code/electron-utility/sharedProcess/sharedProcessMain |
| 91892 / 91720 | fileWatcher / file-watcher | vs/platform/files/node/watcher/watcherMain |
| 92930 / 91720 | extensionHost / extension-host | vs/workbench/api/node/extensionHostProcess |

UtilityProcess 静态 all 的 PID 集合与实际活实例集合一致，inactive 实例0；没有未知或退休角色。PTY 在这个冷启动等待点尚未 spawn，所以不把缺少 ptyHost 活实例当成保留功能失败，也不据此宣称 PTY 已通过。

退休精确表沿用已核对的 [125 browser runtime closure](../../../patches/125-light-browser-runtime-closure.patch)、[130 retired background entrypoints](../../../patches/130-light-retired-background-entrypoints.patch) 与原契约来源，方法和源引用见 [前次探针记录](M6-main-shared-probe.md)。完整23名为 browserView、browserViewGroup、playwright、nativeManagedSettings、fileManagedSettings、webContentExtractor、sharedWebContentExtractor、sandboxHelper、NativeMcpDiscoveryHelper、mcpGateway、mcpGatewayToolBroker、mcpManagement、mcpGalleryManifest、customEndpointTelemetry、localTranscription、agentHost、agentHostLogger、agentHostConnectionTracker、agentHostProtocol、agentHostManagement、agentHostProxy、agentHostClientProxy、agentHostClientByokLm。两份实际集合对23名均无命中，普通保留通道完整集合等于上面的24 /17名。

## 冷日志时间窗

[cold 日志计数](/private/tmp/lc149-my6ky2od/main-shared149-cold-log-counts.json) 记录新有效 profile 从实际 launch `2026-10-01T18:27:59.890990Z` 到冷等待点读取时的四类日志字节数、hash、首末本地时间戳和明确 regex。Unknown service、Missing proxy、customer/actor 初始化、Unknown channel、缺 RPC method、RPC protocol 六类均0；error0。

保留实际两条 vscode.git warning：`git.openRepositoryInParentFolders`、`git.showProgress` 的 resource-scoped configuration 查询没有提供 resource，时间均为本地04:28:01.776。它们不是 DI/RPC pattern 命中，记录也不声称全 profile zero-warning。sharedprocess.log 在这个等待点为空；实际17个注册 channel 和真实 callback/prototype 独立证明 shared 初始化，不能仅靠空日志。

每份日志 hash 对应当时读取的实际字节，不代表之后普通测试继续写入的可变日志。Reload 后将重新审查整个有效 profile 和最终 Reload 区间；不混入无效 engines=`*` 的旧根。

## 已执行命令和 Reload 等待

下面两条在该会话实际执行并 exit0；输出目录成功创建后禁止重用覆盖。

```sh
node dev/test-fixtures/lean-core/main-shared-registry.mjs \
  --role main --endpoint http://127.0.0.1:19501/json/list \
  --expected-app /var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app \
  --pid 91720 --profile-root /private/tmp/lc149-my6ky2od/u --expected-port 19501 \
  --expected-sha256 2a407501836d01512c561f90950fbfc3f1d6730fe8ac52bb0f519331d889215c \
  --output /private/tmp/lc149-my6ky2od/cold-main149

node dev/test-fixtures/lean-core/main-shared-registry.mjs \
  --role shared --endpoint http://127.0.0.1:19502/json/list \
  --expected-app /var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/VSCode-darwin-arm64/VSLight.app \
  --pid 91890 --main-pid 91720 --profile-root /private/tmp/lc149-my6ky2od/u --expected-port 19502 \
  --expected-sha256 87b88f7e8393b86e2396d40728990ab95e99ab9ed2f5b498c351ba8ecc3e3048 \
  --output /private/tmp/lc149-my6ky2od/cold-shared149
```

## 唯一真实 Reload 后结果

主线程完成普通、NPM 与 Welcome 检查后执行真实 Reload，见 [reload149-after.json](/private/tmp/lc149-my6ky2od/reload149-after.json)：before宿主92930，after宿主2142/API1.135.0，main91720保持不变，oldHostExited=true，requestConsumedBeforeReload=true。command response=null，因为实际 Reload 结束旧宿主；本记录依赖真实生命周期和对象捕获，不制造 response PASS，也没有重新写该 request。

实际 exthost 日志本地04:40:03.398收到 renderer terminate，04:40:03.405旧宿主退出code0，04:40:03.744新宿主2142启动。worker 在任何 inspector 请求前重新以 lsof 核实 shared91890拥有19502 listener，然后重新执行上面两条冻结 helper 命令，只把输出目录分别换成根下 `reload-main149` / `reload-shared149`。两条exit0，各次均重新通过前后PID/profile/hash/listener、实际加载字节、callback Module、精确constructor/prototype身份核查。

[main Reload 快照](/private/tmp/lc149-my6ky2od/reload-main149/snapshot.json) 于 `2026-10-01T18:40:38.673Z` 捕获；[shared Reload 快照](/private/tmp/lc149-my6ky2od/reload-shared149/snapshot.json) 的实际时间保存在其对象与总JSON。完整保留名称分别仍为24 /17，与cold逐项相等，23个退休名均无命中；pending channel均0。当前ChannelServer实例为main3/shared2，IPCServer为main2/shared1；连接对象数量按当次实证报告，不把cold的main2或前次145的数量当固定产品契约。

| Reload 活PID / parentPID | type / name | 实际entryPoint |
|---|---|---|
| 91890 / 91720 | shared-process / shared-process | vs/code/electron-utility/sharedProcess/sharedProcessMain |
| 1348 / 91720 | ptyHost / pty-host | vs/platform/terminal/node/ptyHostMain |
| 2142 / 91720 | extensionHost / extension-host | vs/workbench/api/node/extensionHostProcess |
| 2143 / 91720 | fileWatcher / file-watcher | vs/platform/files/node/watcher/watcherMain |

UtilityProcess静态all与当前实例PID集合相等、inactive0、未知或退休角色0；不将旧host92930/watcher91892作为Reload现存角色。Shared Yw→Kw既有来源链再次验证，使用同一已加载script154、精确位置和原型身份。

## 完整有效profile与Reload日志分类

[Reload日志计数](/private/tmp/lc149-my6ky2od/main-shared149-reload-log-counts.json) 审查有效profile的全部20个文本log文件，包含main/shared/renderer/exthost及Git、HTML/JSON language server、PTY等辅助日志。原始文件不删除；记录当次bytes/hash、全部level计数、warning/error逐行元数据分类和明确regex，不复制env、任意配置/参数、token或inspector UUID。没有读LevelDB或把registry复制日志重复计数。

Reload区间从旧exthost实际收到terminate的04:40:03.398开始，比新宿主启动更早，包含旧宿主退出与新宿主初始化。所有20份profile日志的六类DI/RPC pattern在整个profile和该区间均0；实际级别另行保留：

| 范围 | warning / error | 真实分类 |
|---|---:|---|
| 完整有效profile | 19 /5 | 12条resource-scope配置warning；3条Git config query非0warning；4条synthetic未提交main查找warning；1条首commit前merge-base error；HTML/JSON各2条inspector stderr以error级别记录 |
| 唯一Reload区间 | 4 /0 | 2条Git resource-scope配置warning；2条Git config query非0warning |

四条HTML/JSON error级别内容为Node `Debugger listening`与debugging help提示，属于真实language-server inspector stderr，不是错误初始化；仍保留error计数。Synthetic Git fixture在 `/private/tmp/lc149-my6ky2od/ext/ordinary.js:83` 执行init、`:88`首commit前触发异步GitHistoryProvider读取未出生main/merge-base，日志位于04:34:26；当前私有repo HEAD为refs/heads/main，实际只读rev-list计数2，与fixture `:96`的两commit检查一致。普通Git config query非0warning保持原类别，不声称所有Git日志正常返回。12条resource-scope warning包括冷与Reload Git两字段，以及普通search.useIgnoreFiles测试路径。

根下launch.log未提供各行时间戳，因此不将它伪归进Reload区间。其实际分类为：main inspector listening1、DevTools listening1、remote-debugging-port转发Electron warning1、Node DEP0169 url.parse弃用warning1、Debugger attached2/ending2。只是只读stderr分类，没有连接19500或额外language-server inspector端口。该记录不声称完整profile或stderr全级别0。

完成后通知主线程可正常quit其91720 app；worker不自行退出该共享实例。后续按需worker/download、普通界面门和整体通过结论仍由主线程结合源码/生产闭包与其他实际回归验收。
