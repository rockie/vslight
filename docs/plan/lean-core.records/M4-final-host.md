# M4：138 正式包双权限真实宿主记录

138 正式 app 的两轮真实扩展宿主检查通过。未授权轮验证原 proposal 权限失败，授权轮验证退休 API 明确 unavailable；两轮同时验证稳定本地 API 与所列普通功能。本记录只记这次实际执行结果，不重跑测试，也不据此宣称全部 M4 或 M5 已完成。

## 包与证据锚点

- 根仓基线：`dirty@f1961b7546139a6aa722ff0b8a001296d3041e33`；源 API 基线为 `1.135.0`，fixture 的 `engines.vscode` 为 `^1.135.0`。
- 正式 app：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app`，由 `/tmp/lean-core-final-build-path` 指向的构建根定位。包内 `Contents/Resources/app/package.json`、`Contents/Resources/app/product.json` 与 `Contents/Info.plist` 均为 `1.135.06566`；源 API 基线与产品打包版本分开记账。
- 宿主证据目录：`/tmp/lh138-f87q0kgo`。每轮原始证据为该目录下对应 mode 的 `launch.json`、`ext/package.json`、`ext/run.js` 和 `workspace/lean-core-results.json`。
- [M4-final-host.json](M4-final-host.json) 为原始 `summary.json` 的逐字节副本，未重写字段。SHA256：`9a9b99868ac878534301478bc4d9c0e5e61eeb964528c7385ce9429dddd623d0`。
- 只读复核：每轮 workspace 结果对象与 summary 中的 `result` 完全相等；结果 `runId`、启动记录 `runId` 和 `fixtureEnv.LEAN_TEST_RUN_ID` 三者一致。两轮均有实际 PID、进程 exit0、`passed: true` 与 `status: passed`，不以 CLI 返回码单独代替宿主结果。

## 两轮结果

| 模式 | PID | 进程退出 | 结果 | runId | UTC 起止 |
|---|---:|---:|---|---|---|
| unauthorized | 2843 | 0 | passed | `final-host138-unauthorized-1790865535` | 2026-10-01T14:38:58.017Z → 2026-10-01T14:38:58.227Z |
| authorized | 4293 | 0 | passed | `final-host138-authorized-1790865538` | 2026-10-01T14:39:00.222Z → 2026-10-01T14:39:00.537Z |

| 检查面 | 未授权轮 | 授权轮 | 实际断言范围 |
|---|---|---|---|
| 稳定本地 API | passed | passed | Participant id/handler/icon/followup 读写；never events 的 listener disposable 收集及幂等 dispose；handlers/followups 不执行；context.canSendRequest 为 undefined；selectChatModels 解析为 []；tools 同一 frozen 空数组；三类注册 provider 的 getter/method/event subscription 计数为0；invokeTool 返回 Promise 并异步拒绝 LanguageModelError，精确 name=LanguageModelError、code=NotFound；Chat/LM/MCP 纯数据构造。 |
| 87 条退休 proposed API 路径 | 原权限失败 | 明确 unavailable | 未授权错误包含各 proposal 名与 CANNOT use API proposal；授权错误精确匹配该 API label 的 unavailable 文案；标记异步签名的授权调用不同步抛错并返回拒绝的 Promise；poison provider 计数始终为0。 |
| 普通 findFiles2 | 原权限失败 | 普通行为保留 | 未授权调用抛 findFiles2 权限错误；授权创建 ordinary-proposal-control.txt 后，findFiles2 实际找到该文件。 |
| 普通命令、文档、状态栏 | passed | passed | leanCore.echo 返回输入；openTextDocument/showTextDocument 后内容一致；status bar show/hide/dispose 完成。 |
| 两个退休 API 命令 | absent | absent | getCommands(true) 中不存在 vscode.editorChat.start 和 vscode.extensionPromptFileProvider。仅断言这两个命令。 |
| 普通 Webview | passed | passed | 脚本 ready → host ping → Webview pong；返回 runId 与本轮一致；panel dispose。 |

以上范围来自本轮 `ext/run.js` 的实际断言及结果文件；没有把一次构造检查写成所有稳定类型的穷举检查。

## 实际启动参数

直接运行正式 app 的 Electron 可执行文件。下列数组逐项复制两份 launch.json 的 args；每轮使用自己的 user-data、extensions、shared-data 与 workspace。授权轮额外有 `--enable-proposed-api=lean-tests.lean-core-fixture`，未授权轮没有该参数。

### unauthorized

```json
{
  "runId": "final-host138-unauthorized-1790865535",
  "mode": "unauthorized",
  "args": [
    "/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/MacOS/VSLight",
    "--user-data-dir",
    "/tmp/lh138-f87q0kgo/unauthorized/u",
    "--extensions-dir",
    "/tmp/lh138-f87q0kgo/unauthorized/e",
    "--shared-data-dir",
    "/tmp/lh138-f87q0kgo/unauthorized/s",
    "--extensionDevelopmentPath",
    "/tmp/lh138-f87q0kgo/unauthorized/ext",
    "--extensionTestsPath",
    "/tmp/lh138-f87q0kgo/unauthorized/ext/run.js",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    "--new-window",
    "/private/tmp/lh138-f87q0kgo/unauthorized/workspace"
  ],
  "fixtureEnv": {
    "LEAN_TEST_WORKSPACE": "/private/tmp/lh138-f87q0kgo/unauthorized/workspace",
    "LEAN_TEST_RUN_ID": "final-host138-unauthorized-1790865535",
    "LEAN_TEST_PROPOSALS": "unauthorized"
  }
}
```

### authorized

```json
{
  "runId": "final-host138-authorized-1790865538",
  "mode": "authorized",
  "args": [
    "/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/VSCode-darwin-arm64/VSLight.app/Contents/MacOS/VSLight",
    "--enable-proposed-api=lean-tests.lean-core-fixture",
    "--user-data-dir",
    "/tmp/lh138-f87q0kgo/authorized/u",
    "--extensions-dir",
    "/tmp/lh138-f87q0kgo/authorized/e",
    "--shared-data-dir",
    "/tmp/lh138-f87q0kgo/authorized/s",
    "--extensionDevelopmentPath",
    "/tmp/lh138-f87q0kgo/authorized/ext",
    "--extensionTestsPath",
    "/tmp/lh138-f87q0kgo/authorized/ext/run.js",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    "--new-window",
    "/private/tmp/lh138-f87q0kgo/authorized/workspace"
  ],
  "fixtureEnv": {
    "LEAN_TEST_WORKSPACE": "/private/tmp/lh138-f87q0kgo/authorized/workspace",
    "LEAN_TEST_RUN_ID": "final-host138-authorized-1790865538",
    "LEAN_TEST_PROPOSALS": "authorized"
  }
}
```

## 实际 manifest 授权

两轮 extension id 都为 `lean-tests.lean-core-fixture`，main 为 `./extension.js`，activationEvents 为 `onStartupFinished`；贡献普通 `leanCore.echo` 命令。未授权轮 manifest 不含 enabledApiProposals。授权轮 manifest 的 enabledApiProposals 精确为以下 **26 项**；87 是所测 API 调用/属性/事件路径数，二者不混计。

```json
[
  "agentEditorComments",
  "chatStatusItem",
  "chatParticipantPrivate",
  "agentSessionsWorkspace",
  "interactive",
  "aiRelatedInformation",
  "aiSettingsSearch",
  "mappedEditsProvider",
  "chatSessionsProvider",
  "chatOutputRenderer",
  "chatContextProvider",
  "chatPromptFiles",
  "chatDebug",
  "chatSessionCustomizationProvider",
  "chatInputNotification",
  "languageModelProxy",
  "embeddings",
  "languageModelToolSupportsModel",
  "chatParticipantAdditions",
  "browser",
  "mcpServerDefinitions",
  "speech",
  "defaultChatParticipant",
  "aiTextSearchProvider",
  "textSearchProvider2",
  "findFiles2"
]
```

## 137 与 138 的启动证据边界

137 的初版静态包检查曾为绿，但主进程 ESM 启动缺少 semver 物理副本，报 ERR_MODULE_NOT_FOUND；这一轮不能计为 API 真实宿主通过。138 的 [semver copy 修复](../../../patches/138-light-main-process-semver-copy.patch) 已进入真实 min-packing：构建根 packing-138.exit 为0，当前 app 的物理 `Contents/Resources/app/node_modules/semver/package.json` 存在。包检查链另见 [M7-package-check.md](M7-package-check.md)。本记录采用修复后的138 app 和上述两份真实结果。

本轮未重新构建、重跑宿主或修改测试源码；仅只读核对证据并复制 summary。普通可访问性、外链、全部注册表以及窗口恢复需另行验收；本轮 Webview ping/pong、两个命令 absent 和文档操作不覆盖这些项目。M4/M5 的其余验收继续按原依赖记账。
