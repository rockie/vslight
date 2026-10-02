# M2 · 正式 138 产物的隔离原生语言验证

- 对应计划：[lean-core.md](../lean-core.md)，§5.1/§9.3，V1/V4，M2。
- 最近更新：2026-10-02 01:38 +1000。
- 状态：真实 app 进程内的 NSBundle/原生 AppKit 资源语言选择与英文 fallback 已通过；完整原生 UI、Finder/Dock/关于框、工作台其他语言包和分发验收仍待主线程执行。
- 代码基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`，正式产物来自 114–138 集成构建；本子任务只新增 [原生 probe](../../../dev/probe-macos-native-locale.m)、[运行 helper](../../../dev/probe-macos-native-locale.py) 和本记录，未修改共享计划、原有 helper、workflow、构建脚本、用户生成树或已安装 app。
- 环境：macOS 26.6.2（25G83），arm64，Python 3.12.13，Xcode 自带 clang/Foundation/AppKit。产物版本 1.135.06566、Electron 43.7.5。可执行文件为 linker ad hoc signature，无 Developer ID、无 TeamIdentifier、无 sealed resources；这里仍称未签名分发产物。

## 隔离方式与实际证据

正式 app 由 `/tmp/lean-core-final-build-path` 找到，实际为：

`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app`

helper 编译一个临时 dylib，以 `DYLD_INSERT_LIBRARIES` 加载到该 app 的真实 `Contents/MacOS/VSLight`。constructor 在 Electron main 前读取原生 API，直接 `_exit(0)`，不调用 `NSApplication.sharedApplication`；七个进程都报告 `nsApplicationExists=0`，exit 0，后续 `ps -p` 均确认已退出。`ELECTRON_RUN_AS_NODE=1` 配合只退出 42 的临时 JS，是注入未生效时的无窗口失败兜底。helper 拒绝带 hardened runtime 或正式签名的 app，不用于正式签名产物。

每次进程只传 `-AppleLanguages '(语言代码)'`。实际 `NSArgumentDomain.AppleLanguages`、有效 defaults 值和 `NSLocale.preferredLanguages` 都等于该次请求，真实 `NSGlobalDomain.AppleLanguages` 则始终为原值 `['zh-Hans-CN']`。前后只读 `defaults read -g AppleLanguages`/`AppleLocale` 相同，后者为 `zh_CN`。未使用 `--locale`、未写 preferences、未用临时 HOME 冒充独立系统偏好，也未读取 keychain。

读取的 `NSBundle.main.bundlePath` 指向正式 app，bundle identifier 为 `com.vslight`；Framework bundle 指向该 app 内真实 `Electron Framework.framework`，不是另造 fixture bundle。使用不带显式语言参数的 `preferredLocalizations` 和 `pathForResource:ofType:`，记录 Framework 实际 `locale.pak`。原生 AppKit bundle 来自 `bundleForClass:NSApplication.class`，路径为 `/System/Library/Frameworks/AppKit.framework`、identifier 为 `com.apple.AppKit`；直接查 `Common` 表的 `Cancel`、`OK`、`Don’t Save`，没有把期待字符串写进 probe 的返回值。

AppKit 本身存在 fr/de/ja 本地化，但在这三个隔离偏好下实际选择 en，这说明 fallback 来自正式 app 的语言选择。该系统的 `Common.strings` 物理路径查询返回 nil，`localizedStringForKey` 仍返回下表真实字符串；记录保留这一区别，不假称读到了不存在的 `.strings` 文件。[Apple 的 NSBundle 说明](https://developer.apple.com/documentation/foundation/bundle/preferredlocalizations)说明该属性按用户偏好与 bundle 可用语言排序；这里的通过结论以实际进程输出为准。

| NSArgumentDomain 系统语言偏好 | main / Framework / AppKit 实际 preferredLocalizations | Framework 实际 locale.pak 所在目录 | AppKit Common 实际字符串：Cancel / OK / Don’t Save | 结果 |
| --- | --- | --- | --- | --- |
| en | `[en]` | `en.lproj` | Cancel / OK / Don’t Save | 通过 |
| en-GB | `[en_GB, en]` | `en_GB.lproj` | Cancel / OK / Don’t Save | 通过 |
| zh-CN | `[zh_CN]` | `zh_CN.lproj` | 取消 / 好 / 不保存 | 通过 |
| zh-TW | `[zh_TW]` | `zh_TW.lproj` | 取消 / 好 / 不儲存 | 通过 |
| fr | `[en]` | `en.lproj` | Cancel / OK / Don’t Save | 英文 fallback 通过 |
| de | `[en]` | `en.lproj` | Cancel / OK / Don’t Save | 英文 fallback 通过 |
| ja | `[en]` | `en.lproj` | Cancel / OK / Don’t Save | 英文 fallback 通过 |

执行命令（实际 exit 0；输出目录应使用新的路径，helper 拒绝覆盖）：

```bash
/opt/homebrew/bin/python3.12 dev/probe-macos-native-locale.py \
  '/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app' \
  --output /tmp/lean-native-138-0de698133b
```

复核证据在 [/private/tmp/lean-native-138-0de698133b/summary.json](/private/tmp/lean-native-138-0de698133b/summary.json) 与同目录七份 `*.stdout.json`、`*.stderr.txt`、编译输出、codesign display。摘要 `passed=true`、cases=7，summary JSON SHA256 为 `fde8b716f045d02114156fcbcc58ab174127885df01395ac27096c4bb408ce77`。

app 前后完整清单含普通文件 hash、相对路径、symlink 文本和目录，均相同：清单 SHA256 `8994cb033fe2e76680b254324ee06e2d61b680085062fe51e2a75b40525dd39e`；1,182 普通文件、407,625,179 bytes、1,655 总条目。helper 输出和 dylib 都在 app 之外。

这些证据证明真实进程的偏好隔离、bundle 映射、原生 AppKit 字符串和 Framework 资源选择。进程在 Electron main 前退出，没有创建原生菜单、打开/保存面板或工作台；不能据此把整个 V4 原生 UI 或 M2 退出条件记成通过。

## V1 图标与关联字段只读复核

用 plistlib 比较正式 app 与 [M1 修复后基线](M1-repaired-baseline-artifact.json) 的原始 `Contents/Info.plist`：65 项 `CFBundleDocumentTypes` 去掉各自 `CFBundleTypeIconFile` 后逐项相同，`CFBundleURLTypes` 相同；文档角色仍为 Editor，URL scheme 仍为 vslight。主 `CFBundleIconFile` 和所有已有文档 icon 字段都是 `VSLight.icns`，每个引用都存在，主 Resources 只有这一份 `.icns`。图标 SHA256 为 `61d819bc17d1cda2d9a4377d765e1518c42df080621a07318d70636bbc8d6be2`。未更改 LaunchServices、文件默认打开程序或 Finder 缓存。

主线程还需在单一 GUI 会话完成：

1. 查看正式 app 的 Finder 图标、运行后 Dock 图标、关于框图标；保存截图和实际窗口身份。
2. 在私有目录创建 .txt/.md/.py 文件，经指定该 app 打开，核对实际工作台中的路径与内容。Finder 默认关联若需变更，须保持用户真实默认打开程序；本子任务没有注册或改默认关联。
3. 原生 GUI 验证可沿用进程级 `-AppleLanguages '(en)'`、`'(zh-CN)'`、`'(zh-TW)'`、`'(fr)'`，各用私有 profile 冷启动。需要同时证明该 GUI 进程的 effective preferences，并看原生面板/按钮；`--locale` 仅用于工作台验收。非中英文工作台语言包的安装仍需独立证据。

## 双架构 CI 与签名公证资源审计

本段为只读审计，没有推送、dispatch、发布、签名、公证请求或 keychain 操作。

| 检查面 | 当前事实与源码依据 | 缺口/状态 |
| --- | --- | --- |
| 双 arch 与 Python | [ci-build-macos.yml](../../../.github/workflows/ci-build-macos.yml):43–69，stable/insider workflow:31–52，矩阵均为 macos-15-intel/x64 与 macos-14/arm64；setup-python 3.11 均无 arch 条件；[build.sh](../../../build.sh):30–38 在 packing 后、touch 前用同一解释器运行整理 helper | 配置具备；三 workflow 当前 dirty 改动对应的两 arch CI 运行结果未取得 |
| 可访问远端 CI | origin 为 `https://git.wsjn.hk/XGENT.ai/vscodium.git`；匿名 GET `/api/v1/version` HTTP 200，Gitea 1.27.0；匿名仓库 API 与 `/actions/runs?limit=5` 都 HTTP 404；当前 callable tools 没有 GitHub/Gitea workflow 连接 | 不能区分私有仓库/不可匿名访问/其他执行目标；没有可核验的 runner、运行 ID 或 green result。不能把本地双 arch YAML 当实跑通过 |
| 本地工具 | `xcrun --find notarytool`、`xcrun --find stapler` 均存在于 Xcode；codesign display 确认当前 app 仅 linker ad hoc signature | 工具存在，未执行正式签名/公证/staple |
| 当前环境变量 | 只查是否非空：五项 `CERTIFICATE_OSX_P12_DATA/P12_PASSWORD/APPLE_ID/TEAM_ID/APP_PASSWORD` 全 false；`GITHUB_TOKEN`、`GH_TOKEN` 全 false | 尚未 source 本地配置，不能据此判断本机缺凭据；本子任务未读 keychain 或远端 secrets |
| 本地签名配置 | 主线程指明后，仅检查 `dev/osx/codesign.env`、`dev/osx/macos-codesign.env` 的变量名和结构：两者均含上述五项非空赋值、无命令替换/变量引用、`bash -n` exit 0，且 `git check-ignore` 均命中；未输出值或解码 P12。主线程已报告 `security find-identity -v -p codesigning` 有 1 valid Developer ID identity，本子任务未重复查 keychain | 本地资源已具备现有流程的输入结构；实际认证、证书匹配、公证成功仍须运行证明。主线程可在最终代码/UI通过后对私有产物执行签名，无需发布 |
| 本地配置接入 | [dev/build.sh](../../../dev/build.sh):172 检查 codesign.env 存在，:173 source macos-codesign.env；两者当前都存在；:175 会输出 Apple ID | 当前路径能接入配置；本子任务没有 source 或执行该分支，主线程受控签名需保持秘密值不进入输出 |
| CI secrets 入口 | [publish-stable-macos.yml](../../../.github/workflows/publish-stable-macos.yml):68–76 与 [publish-insider-macos.yml](../../../.github/workflows/publish-insider-macos.yml):68–76 引用五项 signing/notary secrets，job 使用 publish-osx environment | 声明存在；远端环境/secret 是否配置、runner 是否可用未知。CI-build workflow 的 Prepare assets 未传这些 secrets，本身不能证明分发链 |
| 签名公证流程 | [build/osx/prepare_assets.sh](../../../build/osx/prepare_assets.sh):3–57，仅 P12_DATA 非空才签名；调用真实 build/darwin/sign.ts，其 hardenedRuntime=true；随后 notarytool submit --wait、stapler staple | 完整执行仍欠凭据和受控执行目标；发布 workflow 后续会 release/update versions，不能仅为验证直接触发 |
| 分发验证 | prepare_assets.sh:51 调用 staple；:52 的 spctl 是注释；该 shell 没有显式 `codesign --verify --deep --strict` 或 `stapler validate` | 即使以后流水线成功，也需另存计划要求的严格 codesign/spctl/staple 验证证据 |
| 失败清理 | prepare_assets.sh:9/:81 使用 buildagent.keychain；两 publish workflow 的 always cleanup 使用 build.keychain | 失败路径的清理对象不一致；这里只报告事实，未修改共享脚本。正式 build/darwin/sign.ts 的错误处理另含 security dump-keychain；本审计没有执行该路径 |

## 验收记录

| 退出条件 | 命令/走查 | 环境/基线 | 结果 |
| --- | --- | --- | --- |
| V4 真实原生语言资源选择、英文 fallback 与隔离偏好 | 本文七语言 helper；每次实际 NSArgumentDomain、NSLocale、NSBundle、AppKit lookup | 正式未签名 138 arm64 app，macOS 26.6.2 | 通过这部分；无 GUI verdict |
| V4/V8 app 和真实全局偏好不变 | 前后 manifest 与 defaults 只读比较 | 同上 | 通过；数据见摘要 |
| V1 图标引用、非 icon 字段与 URL 关联 | 正式 Info.plist 与 M1 基线比较、资源存在性/hash | 正式 app 与原始基线 | 通过静态项；Finder/Dock/关于框/文件打开待主线程 |
| V4 原生完整 UI、其他工作台语言包 | 主线程隔离冷启动与真实面板/扩展安装 | 需要 GUI 会话 | 未运行 |
| M2 两 arch CI；V10 签名、公证、staple 与分发 | 原有流程加必要显式验签结果 | 本地签名配置可用，远端 CI 目标/运行结果未核验 | 未运行，不能记通过 |
