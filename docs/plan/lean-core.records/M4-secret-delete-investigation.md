# M4 SecretStorage 删除即时回读旧值：调查与私有候选

- 计划：[lean-core.md](../lean-core.md) V7、NFR-2/NFR-4、M4/M8。
- 最近更新：2026-10-02 10:34 +1000（Australia/Sydney）。
- 状态：真实149认证红例保留；确定性原类最终红5/7（初轮红4/5保留），单引用候选边界红1/7，按request身份管理的Set候选绿7/7。独立149仪器副本已实证真实main旧值广播在local delete后回灌，但四轮即时get恰好先完成，未复现原断言红。正式补丁、全图检查与完整认证未交付，不标M4完成。
- 根基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`。实际149事实源码为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-build144-lcib7zyk/vscodium/vscode`。
- 写入范围：本记录、[续做审查](M8-resume-audit.md)及主线程新增授权的 `/private/tmp/lean-secret-race-*` 私有source/test/app/profile/日志。新增后台controller真实持有并wait自己的app子进程；未修改主源码、正式patch、用户生成树、生产app或真实profile/keychain；未focus、操作全局键鼠或浏览器，未运行或修改smoke。

## 真实失败和身份

独立149认证root为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-resume149-pzgqgcap/auth`。controller.py直接启动实际149 app，user-data/extensions/shared-data/workspace均在该root；只有合成provider与自己的合成secret key。冻结auth.js的SHA为 `1585680ae83194ae1127d413517edc155354136c8d257feb68ec8a18b1422531`，这是失败时冻结的版本。当前仓库随后仅新增公开reload action，当前四个诊断副本使用该新版本，SHA为 `52e251de2f6c966c6e29c9d5c78cb78c464d1e574c4111f5d32dfe29bad55894`；secret-delete即时断言未改。

main42552保持，实际Reload使host43959/boot b7a3cb52…正常退出并新建host44091/boot01ba6a94…。源fixture保留即时契约：await secrets.delete之后马上get必须为undefined，然后keys必须不含该key；没有增加retry、等待或放宽断言。

| 实际请求 | 结果 | 原始证据 |
| --- | --- | --- |
| secret-store / v1 | PASS，合成值回读和keys枚举正确，secretEvents+1 | responses/resume-84439326adfc4d0d9f1ba481f5da1ff7.json |
| 真实Reload后secret-read / v1 | PASS，新boot/host读回同一合成值 | evidence/ready-before.json、ready-after.json；responses/resume-61653e7fd6774824a58a487d357e3aeb.json |
| secret-update / v2 | PASS，实际回读v2，secretEvents+1 | responses/resume-f1797f013faa4bc186937cd571910b0f.json；trace本地09:56:29.122 |
| secret-delete | FAIL，await delete后get实际仍为合成v2，期望undefined | responses/resume-0b1b20b61dfa476093989717c22bb9b5.json；auth.js:210 |

delete阶段同一私有key的两条secret change event均在本地09:56:29.324，state.secretEvents最终为3（update1，delete阶段2）。原始事件记录不包含值或external标志，因此这些时戳本身不能证明第二条就是旧set广播。

controller捕获FAIL后进入finally，直接terminate其私有主进程；exthost在09:56:29.446收到renderer terminate、.452以0退出，main在.564确认退出。不是完整认证正常Quit绿例，普通accounts/create/reuse/sign-out尚未跑到。只读private SQLite的合成key在退出后globalStorage/sharedStorage均不存在且无WAL；这说明该key最终落盘删除，不改变即时get已经失败的结果。

## 调用链和已排除边界

以下均实读当前149源码。表中路径相对上面的事实源码根。

| 层 | 精确路径/行 | 实际行为 |
| --- | --- | --- |
| public secrets对象 | src/vs/workbench/api/common/extHostSecrets.ts:34 | ExtensionSecrets的get/store/delete直接代理，无值缓存 |
| extension-host RPC | src/vs/workbench/api/common/extHostSecretState.ts:24 | get/store/delete直接返回MainThreadSecretState RPC Promise |
| renderer customer | src/vs/workbench/api/browser/mainThreadSecretState.ts:38、61 | 每extension的SequencerByKey串行get/set/delete；delete await secretStorageService.delete；三操作使用相同JSON fullKey |
| 本地secret服务 | src/vs/platform/secrets/common/secrets.ts:139、162、186 | 每key再串行；get读加密值并decrypt，delete调用removeValueFromStorage |
| scope选择 | src/vs/platform/secrets/common/secrets.ts:122、213、221 | useSharedStorage只对Windows指定跨app key返回true；本次macOS合成key走APPLICATION |
| storage服务 | src/vs/platform/storage/common/storage.ts:498 | AbstractStorageService.remove为void，调用Storage.delete但不返回/await底层flush Promise |
| renderer本地cache | src/vs/base/parts/storage/common/storage.ts:295 | Storage.delete同步cache.delete、pendingDeletes.add、pendingInserts.delete，然后排队flush |
| renderer外部事件 | src/vs/base/parts/storage/common/storage.ts:146、164 | acceptExternal直接把外部changed写入cache或接受deleted，未检查同key本地pending/in-flight写 |
| renderer flush | src/vs/base/parts/storage/common/storage.ts:117、363 | 默认100ms；flushPending在database.updateItems完成前清空pending集合 |
| storage IPC | src/vs/platform/storage/common/storageIpc.ts:127 | ApplicationStorageDatabaseClient把main广播当onDidChangeItemsExternal传给Storage，事件无来源过滤 |
| main广播 | src/vs/platform/storage/electron-main/storageIpc.ts:20、43、57 | main storage变更经过100ms debounce后读main当前值、向全部监听者广播changed/deleted；未排除发起写入的renderer |

macOS合成key走普通APPLICATION Storage，而不是APPLICATION_SHARED的MigratingStorage。因此不能把本次失败归因于shared fallback自动迁移或已删Sessions分支。NativeSecretStorageService只在set额外排队检查encryption，不覆盖delete/get。

逐字节比较当前149与M1 baseline、正式138和上游08d4889f：extHostSecrets、extHostSecretState、mainThreadSecretState、NativeSecretStorageService、BaseSecretStorageService、Storage、AbstractStorageService、common storageIpc、main storageIpc、RemoteStorageService共10文件完全相同。NativeWorkbenchStorageService与138相同；相对M1仅拆Sessions Window的APPLICATION_SHARED fallback分支，普通APPLICATION构造/调用未改。没有证据把核心删除逻辑变化归因于本轮AI服务裁剪。

## 可证伪假设与确定性实验

原失败归因假设：[INFERRED] 本地delete已更新renderer cache，但此前set v2的延迟main广播随后以external changed重新写回cache，使紧邻get再次读到v2。这个假设具体涉及Storage.acceptExternal、本地pending与IPC广播；不把一般“时序慢”当根因。

私有实验复制当前真实Storage源，原件SHA为 `57241f57e6410de1dd0388994f284ddc1446a3420e7f015442cdc25a0e36012d`，实验后仍与实际149源码字节相同。esbuild仅替换Storage源为私有原件或候选，其余37-input图使用真实base模块；未复制实现逻辑当测试对象。可控database在内存持有数据并发真实Emitter事件，通过DeferredPromise停在指定数据库update边界，不依赖随机sleep。

API的delete Promise在void storageService.remove之后结束，底层Storage.delete flush仍可pending；因此检查本地cache在flush前的删除语义，与原public fixture的即时get契约一致。实验不把await底层数据库flush加入fixture。

| 确定性case | 原类 | 私有候选 |
| --- | --- | --- |
| local delete已完成cache删除，flush尚未开始；送达旧v2 external changed | FAIL：get复活为v2 | PASS：仍undefined；数据库ack后正常新remote值仍接收 |
| local delete flush已开始、数据库update未返回；送达旧v2 external changed | FAIL：get复活为v2 | PASS：仍undefined；数据库ack后恢复接收 |
| local set v2仍pending；送达external delete和旧v1 | FAIL：本地v2被覆盖 | PASS：本地v2保留，其他key的remote值正常接收 |
| local set v2已flush、数据库update未返回；送达external delete和旧v1 | FAIL：本地v2被覆盖 | PASS：本地v2保留，其他key正常接收 |
| 本地写已完成；同值external无事件、新值与删除正常接收 | PASS | PASS |

原件最终为1 PASS/4 FAIL、exit1；私有候选5 PASS/0 FAIL、exit0。此实验确证真实Storage类允许晚到external事件覆盖本地pending/in-flight写，也复现旧v2回灌的具体机制；此时尚无原失败当时的event类别/值trace。后续真实149诊断取证见下节；它确证产品实际回灌链路，但不恢复原失败时已经缺失的trace。

实际命令如下，所有输出均落私有根，不操作正式源码或profile：

```sh
mise exec node@24.18.0 -- node /private/tmp/lean-secret-race-0ruvijo7/build.mjs original
mise exec node@24.18.0 -- node /private/tmp/lean-secret-race-0ruvijo7/runner.cjs original
mise exec node@24.18.0 -- node /private/tmp/lean-secret-race-0ruvijo7/build.mjs candidate
mise exec node@24.18.0 -- node /private/tmp/lean-secret-race-0ruvijo7/runner.cjs candidate
```

[原类最终红日志](/private/tmp/lean-secret-race-0ruvijo7/original-with-control.log) / [实际exit](/private/tmp/lean-secret-race-0ruvijo7/original-with-control-exit.json)；[候选绿日志](/private/tmp/lean-secret-race-0ruvijo7/candidate.log) / [实际exit](/private/tmp/lean-secret-race-0ruvijo7/candidate-exit.json)。首轮4个红例的original.log也保留；随后仅加入正常external对照case再次运行，未覆盖首轮红证据。

## IN_MEMORY重叠与失败清理边界

Storage.doFlush在hint=STORAGE_IN_MEMORY时直接调用flushPending，不经过ThrottledDelayer，因此两个database.updateItems可以同时未完成。最初的单个inFlightUpdate引用会被第二批覆盖；第一批finally又把它清空，失去第二批保护。可控database改为每request各有DeferredPromise gate：同时启动first与second，仅释放first，second仍在flight时发external delete/旧changed。单引用候选真实6 PASS/1 FAIL，second被删；改Set之后7 PASS/0 FAIL。另有database Promise拒绝后马上接收新external changed与deleted的case，确保finally清理恢复接收。

[单引用候选边界红日志](/private/tmp/lean-secret-race-0ruvijo7/candidate-overlap-red.log) / [实际exit1](/private/tmp/lean-secret-race-0ruvijo7/candidate-overlap-red-exit.json)；[Set候选最终绿日志](/private/tmp/lean-secret-race-0ruvijo7/candidate-set-green.log) / [实际exit0](/private/tmp/lean-secret-race-0ruvijo7/candidate-set-green-exit.json)。完整7例也在原149 Storage类重新执行：[原类7例红日志](/private/tmp/lean-secret-race-0ruvijo7/original-seven-red.log) / [实际exit1](/private/tmp/lean-secret-race-0ruvijo7/original-seven-red-exit.json)，2 PASS/5 FAIL；正常external与数据库失败清理为PASS，4个pending/in-flight冲突加IN_MEMORY重叠为FAIL。扩展case仍无随机sleep，失败数据库与并发gate由测试显式控制；没有改变public fixture。

## 独立149真实IPC取证

主线程进一步授权独立app副本与全新profile、后台controller，仅对各自合成fullKey记录类别、cache/pending/in-flight布尔值与SHA256。四个app均从原149 APFS clone；只改副本main.js与workbench.desktop.main.js，acceptExternal仍执行原行为，没有注入假external事件或候选guard。原生产app两份hash复核不变，仪器差异及guard见各根instrumentation.json。所有请求使用真实public extension API；Reload使用公开workbench.action.reloadWindow，新ready必须boot改变、host PID改变、parentPid等于当前存活app PID。controller不退出后遗留Popen，四个app均实际wait正常Quit exit0。

| 仪器副本私有根 | main / Reload前后host | 请求调度 / 实际update→delete | 实际结果 |
| --- | --- | --- | --- |
| /private/tmp/lean-secret-race-live-hd9bs8hq | 63613 / 64924→65110 | response每100ms轮询、无额外间隔；100ms | store/read/update/delete PASS；main合并set/delete，没有旧值回灌 |
| /private/tmp/lean-secret-race-live-x6tn8f72 | 70276 / 71516→71762 | update response后100ms再发delete；实际300ms | 全PASS；v2广播先到，约100ms后才delete |
| /private/tmp/lean-secret-race-live-9yxt2ftu | 72461 / 73762→73933 | response每5ms轮询、update response后110ms再发delete；实际202ms | 全PASS，但delete后真实v2回灌；即时get早约1ms |
| /private/tmp/lean-secret-race-live-6m9j_8pn | 74651 / 75861→76108 | response每5ms轮询、update response后105ms再发delete；实际200ms | 全PASS，但delete后真实v2回灌；即时get早约2ms |

各轮完整responses、ready前后、result与trace落本表各独立根；[汇总及原app未改核验](/private/tmp/lean-secret-race-0ruvijo7/live-summary.json)。仪器副本只供定位，所有PASS均不计作最终app接受或完整auth绿。

第三轮[真实trace](/private/tmp/lean-secret-race-live-9yxt2ftu/trace.json)给出以下直接因果链（UTC，按renderer sequence重排异步hash日志）：

1. renderer seq9在00:24:12.266读到v2 ciphertext hash `bfad6676f47070cf822a22aa04777cf57d9cb566d9545e88ca31bbdabca098f4`。
2. seq11在.267完成delete-local，pendingDelete=true、cachePresent=false；seq12同.267即时get为空。
3. main seq8在.268执行serializeStorageChangeEvents的真实ipc-broadcast，valueHash与上面的v2一致。
4. renderer seq13同.268收到external-before，pendingDelete=true、cachePresent=false；seq14 external-after changed=true、cachePresent=true、cacheHash恢复到同一v2 hash。

第四轮[真实trace](/private/tmp/lean-secret-race-live-6m9j_8pn/trace.json)独立重复该链：.846 delete-local、.847即时get为空、.849 main广播和renderer changed=true回灌，v2 hash为 `3111386a01e00d884a0bd13dc41eee495c8d80c80c5cdb089f0c918f26f204ff`。所以“真实main旧set广播可以在local delete后恢复cache”已确证；“原09:56红例的get恰好落在该回灌之后”仍是与现有原红证据吻合的归因，缺当时trace，不能称逐字复现。没有等待多轮get或删即时assert来计绿。

实际启动命令为每个私有根的 `python3 -u controller.py`。controller本体、完整argv、fixtureSHA及等待退出结果各存controller.py、launch.json、result.json；未设置remote-debugging端口或访问浏览器。

## 最终私有候选与现有suite

[candidate.diff](/private/tmp/lean-secret-race-0ruvijo7/candidate.diff)含Storage源14行增加和一个新172行回归文件。source新增inFlightUpdates Set：pending同key直接保留本地cache，逐request检查in-flight同key；flush提交时加入本批request，finally只删除本批身份。Set覆盖IN_MEMORY重叠，Promise拒绝后清理通过。候选没有诊断trace、规划元数据、新RPC、依赖、配置或特定secret例外。

候选路径相对实际源码根：

- src/vs/base/parts/storage/common/storage.ts，私有SHA `9a2fcf150fbf8c68b8a4c1fb1b4f1e9f4c97c0c95536ab325144cf93092c409a`。
- src/vs/base/parts/storage/test/common/storage.test.ts，私有SHA `1a9f4bb465576a40c55c4f806b9dec4621eca54f718ac142b33e280080f4060a`。

既有storage.integrationTest.ts:138的external changes case先await storage.set完成才发external事件，因此没有覆盖pending或in-flight窗口。既有platform/secrets/test/common/secrets.test.ts:127的persisted套件仍使用InMemoryStorageService，database无IPC echo。此次正常external对照保持既有语义，但新增原生SQLite/基础/secret既有suite执行如下；未运行全图typecheck或候选生产app。

该候选影响所有Storage同key本地写与external事件冲突，数据库ack前以本地写为准，其他key继续接收，ack后恢复接收；不是仅secret。现有事件没有来源/版本，这一策略会忽略同key在pending/in-flight期间的所有external值，集成时需按这项明确语义审查。

## 既有suite实际执行与可行性

最终Set候选还通过真实原suite：base Storage/SQLite integration全20例、platform StorageService in-memory全10例、BaseSecretStorageService全14例，共44 passing、exit0、560ms。esbuild只替换真实Storage源为候选，原suite内容不改，Mocha TDD实际运行所有setup/teardown和泄漏检查；SQLite使用实际Electron的原生模块，不用stub。Electron Node模式实测v24.21.0。相关[44绿日志](/private/tmp/lean-secret-race-0ruvijo7/existing-suite.log)、[实际argv/exit](/private/tmp/lean-secret-race-0ruvijo7/existing-suite-exit.json)、[75输入清单](/private/tmp/lean-secret-race-0ruvijo7/existing-suite-inputs.json)及build/runner均保留。

实际命令（cwd私有根）：

```sh
mise exec node@24.18.0 -- node existing-suite-build.mjs
TMPDIR=/private/tmp/lean-secret-race-0ruvijo7/existing-suite-tmp ELECTRON_RUN_AS_NODE=1 /private/tmp/lean-secret-race-live-hd9bs8hq/TraceVSLight.app/Contents/MacOS/VSLight existing-suite-runner.cjs
```

platform/electron-main StorageMainService suite的私有bundle构建成功，但Electron Node模式load阶段exit1：它静态引入electron runtime，npm electron/index.js尝试找私有cwd下install.js而失败，0个测试实际执行。没有按错误提示安装/删除或重跑，没有stub electron记绿。[load失败日志](/private/tmp/lean-secret-race-0ruvijo7/native-suite.log)与[exitJSON/明确私有profile argv](/private/tmp/lean-secret-race-0ruvijo7/native-suite-exit.json)保留。这是runner环境不可用，不能标候选产品断言失败。

workbench/browser StorageService suite实际依赖IndexedDBStorageDatabase，包含跨connection CAS与BroadcastChannel，不适合Node内存模拟。当前149生产树缺上述suite的未bundled out，也缺scripts/test.sh期待的.build/electron路径。需要主线程在150隔离树准备未bundled输出、实际Electron runner，再运行以下正式模块。scripts/test.sh会在未设VSCODE_SKIP_PRELAUNCH时下载/准备Electron；已有对应runtime时设该变量，不复制仪器main/workbench进正式app。

```sh
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/base/parts/storage/test/common/storage.test
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/base/parts/storage/test/node/storage.integrationTest
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/platform/storage/test/common/storageService.test
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/platform/secrets/test/common/secrets.test
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/platform/storage/test/electron-main/storageMainService.test
VSCODE_SKIP_PRELAUNCH=1 bash scripts/test.sh --run vs/workbench/services/storage/test/browser/storageService.test
```

这些是具备对应输出/runtime后的执行建议，尚未在150执行，不能和已44绿合并为完成。Node runner默认glob只搜.test.js，storage.integrationTest.js不在默认glob内，必须显式--run；Electron runner支持多次--run，可一次收集上述模块。

## 下一项诊断与集成验收

主线程可把最终Set candidate作为正式补丁候选审查。完整相关验证应包括新7例，以及真实src/vs/base/parts/storage/test/node/storage.integrationTest.ts全20例（基础、external、close/flush、conflicting、SQLite恢复/备份/并发/大值/optimize），src/vs/platform/storage/test/common/storageService.test.ts全suite，src/vs/platform/secrets/test/common/secrets.test.ts全suite（含persisted、stale decrypt清理、cross-app边界），以及src/vs/platform/storage/test/electron-main/storageMainService.test.ts与src/vs/workbench/services/storage/test/browser/storageService.test.ts的实际scope/channel/CAS/concurrent套件。不要直接把本次7绿写为真实auth通过。

原node runner支持--run单模块，Electron/native/browser runner应按各suite平台运行；当前149仅有bundle而没有未bundled out，SQLite原生ABI也应使用对应Electron环境，不能把只bundled依赖模拟为完整suite绿。运行这些必要新验证后做全图检查与正式app重建；不重复旧已绿且不相关的验收。

若正式候选app重新出现即时get红，只对该fixture fullKey保留同样取证：记录Storage.delete开始/完成、flush request提交/ack、acceptExternal收到changed还是deleted、值hash、当时pending/in-flight同key布尔值、cache是否存在；在main的serializeStorageChangeEvents记录该合成key对应事件类别和值hash。不得输出secret明文/加密值、整库keys或真实账户数据。若立即get失败前没有同keyexternal changed写回cache，则当前真实失败归因假设被否定，应沿调用链继续调查。

真实复验仍必须保持原fixture的await delete→立即get undefined→keys absent，完整认证后才继续双账户复取、真实Sign Out、unregister和正常Quit。不能通过等待event、重试get或绕过失败项继续记绿。
