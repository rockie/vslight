# 从 VSCodium / VS Code 迁移到 VSLight

VSLight 是独立产品：**不承诺原地迁移**。首次启动时它使用全新的数据目录，旧版
VSCodium/VS Code 的设置、扩展、键位不会自动出现。旧目录**原样保留、不会被修改或删除**，
可随时按下表手动搬迁。

## 1. 数据目录对照（macOS）

| 内容 | VSCodium | VSLight |
|---|---|---|
| 用户设置/键位/片段 | `~/Library/Application Support/VSCodium/User` | `~/Library/Application Support/VSLight/User` |
| 扩展 | `~/.vscode-oss/extensions` | `~/.vslight/extensions` |
| 深链协议 | `vscodium://` | `vslight://` |
| 命令行 | `codium` | `vslight` |

Linux：`~/.config/VSCodium` → `~/.config/VSLight`；Windows：`%APPDATA%\VSCodium` → `%APPDATA%\VSLight`。

## 2. 设置 / 键位 / 任务 / 片段（手动拷贝）

拷贝 `User` 目录下的以下条目（存在才拷）：

```bash
OLD="$HOME/Library/Application Support/VSCodium/User"
NEW="$HOME/Library/Application Support/VSLight/User"
mkdir -p "$NEW"
for f in settings.json keybindings.json tasks.json snippets; do
  [[ -e "$OLD/$f" ]] && cp -R "$OLD/$f" "$NEW/$f"
done
```

不要整目录拷贝 `User`（其中的 `globalStorage`、`workspaceStorage`、`Cached*` 与新版本/新数据目录不兼容）。

## 3. 扩展（导出清单 → 重装）

不直接拷贝扩展目录，用清单重装（保证拿到与新版本匹配的构建）：

```bash
# 旧机/旧产品导出
codium --list-extensions > extensions.txt
# 新机重装（逐个从 open-vsx 安装）
cat extensions.txt | xargs -L 1 vslight --install-extension
```

注意：

- 依赖远程开发的扩展（Remote-SSH / Dev Containers / WSL / Tunnels 类）在 VSLight
  **不可用**——VSLight 不支持远程开发（`vscode-remote://` 会给出可读报错）。
- 调试器扩展（js-debug 等内置调试子系统已移除）安装后不会有调试入口。
- 依赖内置 Chat/模型/MCP/语音服务的扩展功能不可用；扩展自行携带的 AI 实现不受这一承诺限制。

## 4. 失效说明

- `codium` CLI 不再随 VSLight 提供；请使用 `vslight`。
- `vscodium://` 深链失效；系统需重新关联 `vslight://`。
- VSLight 不支持：`vslight tunnel`、远程服务器（reh）、调试（Debug）、AI Chat、Notebook。

## 5. 首启发现性

首次启动打开 Welcome 页，其中「迁移指引」链接指向本文件。设置同步（Settings Sync）
不参与主路径；账号认证类扩展仅按需被动触发。

## 从旧版 VSLight 升级

本节适用于已有 VSLight 安装，不是上面的跨产品手动迁移。升级继续使用原
VSLight 数据目录，不需要清空 profile、工作区存储或凭据。操作前可在应用正常退出后
备份数据目录；不要为移除退休功能而删除普通文件、账户或扩展数据。

### AI 服务与旧数据

旧版默认隐藏的 AI 功能，现在改为物理移除内置 Chat、语言模型、MCP、语音及
sessions/agent host 服务和后台运行入口。旧 Chat 历史、MCP 配置与凭据仍留在磁盘，
本产品不再提供这些能力的访问入口；升级不清理它们，也不做数据库降级或迁移。

稳定 Chat/LM/MCP API 保留本地兼容对象：模型与工具列表为空，注册不执行 provider，
事件不会触发，dispose 可重复调用；invokeTool 返回 Promise，并以 LanguageModelError.NotFound 异步拒绝。
本地 languageModelAccessInformation 的 canSendRequest 返回 undefined，不索取模型使用权限。
退休 proposed API 先检查原权限，授权后明确报 unavailable，不会恢复服务。
依赖这些服务的扩展功能不可用；第三方扩展仍可以自带 AI 实现。
138 产物在两种权限模式下的 87 条退休 API 路径及普通命令、文档、状态栏、Webview 已通过
[真实宿主检查](plan/lean-core.records/M4-final-host.md)。

旧窗口中的内置 Browser/Chat 标签不再恢复；其余普通标签保留顺序、活动标签、
preview 与 sticky 状态。138 产物使用两套合成旧 profile 副本的
[12 个实机恢复案例](plan/lean-core.records/M6-final-restore.md)已通过，
其中全退休标签的窗口正常恢复为空。这些检查不代表旧 Chat 会话能在新版重新打开。

### 浏览器与外链

Integrated Browser 和 Simple Browser 两个内置入口都已移除。普通 HTTP(S) 与
localhost 链接默认交给系统浏览器；普通 Webview、Markdown 预览及第三方 external
opener 机制保留。已有 `workbench.externalUriOpeners` 设置若只指向 Simple Browser，
该 opener 无匹配时自然回退系统浏览器，不必批量删除第三方 opener 设置。

### 命令行

`vslight chat` 和 `vslight --add-mcp` 明确提示本产品不支持并以 exit 1 退出，
不再启动 AI 服务。普通版本查询、文件打开与扩展安装入口保留。

文件名恰好为 chat 时，使用 `vslight -- chat`：显式 `--` 后的参数按文件路径解析，
不会触发退休命令拒绝。

### NPM 脚本

内置 NPM 的 Run、Open、Install 和普通悬浮入口保留。旧设置
`npm.scriptExplorerAction=debug` 仍留在设置中，点击脚本会作为普通任务运行；
Debug 入口和仅用于 Debug 的 CodeLens 已移除。

### 界面语言

macOS 原生资源仅保留英文（en/en_GB）、简体中文（zh_CN）与繁体中文（zh_TW），
其他原生界面语言回退英文。此范围针对原生资源，工作台语言包仍可安装和使用。
