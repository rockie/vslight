# vslight 发布清单（Phase 6 落点）

## 当前发行

最新瘦身发行版：[VSLight 1.135.06567](https://github.com/rockie/vslight/releases/tag/1.135.06567)，
仅交付 macOS 12+ arm64。ZIP、DMG 和各自的 SHA-1/SHA-256 校验文件共六项；
应用与 DMG 均经过 Developer ID 签名、Apple 公证及 staple 验证。
发布说明见 [1.135.06567](releases/1.135.06567.md)，构建和产物验证见
[发行记录](releases/1.135.06567.json)。自动升级源位于 `rockie/vslight@versions`。

本次在隔离目录将发行版本递增后完整重建；生成源码的 5,213 个文件和链接与已验收
151 版本一致，生产输入与当前代码一致。沿用本地 arm64 验收范围，x64/CI 不作为发布门。
下方的 151 构建数字和“尚未发布”记录描述本次发行前的历史验收产物。

## 决策记录（沿用计划默认）

- **决策 8（平台交付范围）：B —— 只发 macOS**。决策 7 加注：三平台仅保证可构建
  （patch 不含平台专有条件），本期验收范围 = macOS arm64；上游升级时跑最低验证点
  （linux/windows 各一次可构建验证）。
- **决策 9（sourcemap）：不当 KPI**。体积收益记账口径 = 不产 reh+CLI、摘 sessions/agentHost
  入口、摘 debug/notebook 等 contribution；验收用装机 JS 字节。
- **决策 10（纯本地边界）**：① 断网可完成主路径（编辑/文件/搜索/Git/终端）；
  ② 内置 AI/Remote 网络链移除，扩展市场仍使用 open-vsx，更新源为 `rockie/vslight@versions`；
  ③ 无账号/设置同步参与主路径（认证扩展仅按需被动触发）。普通扩展、认证和外链仍可按用户操作联网。
- 版本号：跟随上游 `1.135.x` + vslight 构建序号；瘦身验收构建为 `1.135.06566`，新发行使用 `1.135.06567`。

## 发布物清单（macOS）

| 物 | 状态 |
|---|---|
| `VSLight-macos-arm64-<ver>.zip`（或 dmg） | 构建产出（prepare_assets.sh，`-p` 开关） |
| `vslight-cli-...` / `vslight-reh-...` | **不发布**（CLI/reh 已裁） |
| checksums（sha1/sha256） | prepare_checksums.sh 产出 |
| release notes | 落点：GitHub releases 页面（`rockie/vslight`） |
| 迁移说明 | 落点：docs/vslight-migration.md + release notes 首段链接 |
| versions feed（latest.json） | 已更新为 `1.135.06567`（`rockie/vslight@versions`） |

## 发布基础设施与历史验收

1. **图标**：正式设计为浅色圆角底、代码尖括号和蓝色闪电，见
   `docs/vslight-icons.md`。打包后文档关联共用主图标，源资产保留；原生语言资源整理在签名前完成。当前150产物的 Finder/Dock/关于框已验，文档关联字段与三类文件打开正常；本次按用户指示以本地 arm64 验收为准，x64/CI 不要求。
2. **GitHub 发行与更新源**：发布仓为 `rockie/vslight`，更新源为同仓 `versions` 分支。
   Docker/AUR/snap/winget 不属于本次 macOS arm64 交付范围；对应 workflow 的外部标识
   仍见 Phase 2 残留清单。
3. **签名/公证链已有历史通过记录（2026-09-28）**：Developer ID Application (KITMI PTY LTD,
   M6B2TDZC9H)；凭据在 `dev/osx/codesign.env`（gitignored）。验证通过：
   `spctl -a -vv` → accepted, source=Notarized Developer ID；`stapler validate` OK。
   历史版本1.135.06493的 ZIP (267MB) 与 DMG (262MB) 含 sha1/sha256。这份记录对应旧产物。当前151独立副本已完成新的 strict codesign、spctl、公证 Accepted、staple/validate、签名内容校验与 ZIP CRC，全部1209文件/14链接与 signed app 相同，signed 包闭包和15项 strict 签名检查通过；临时凭据已清理，见[151签名记录](plan/lean-core.records/M8-sign151.md)。151实际菜单、快捷键、账户偏好、主题和禁用扩展跨重启保留已通过，见[实际运行](plan/lean-core.records/M8-runtime151.md)；本次本地 arm64 开发与验收已完成；用户取消 x64/CI 验收门，未发布。

## 从旧版升级的发布说明

发布说明首段链接到[从旧版 VSLight 升级](vslight-migration.md#从旧版-vslight-升级)，列明：

- 内置 Chat、语言模型、MCP、语音和 agent-host 服务从默认隐藏变为物理移除。旧 Chat 历史、MCP 配置和凭据留盘，产品不再提供访问入口；稳定 API 按无能力契约响应，第三方自行携带的 AI 实现不因此被禁用。
- Integrated Browser 和 Simple Browser 入口移除。普通 HTTP(S)/localhost 默认由系统浏览器打开，第三方 opener 机制保留。
- `vslight chat` 和 `vslight --add-mcp` 提示不可用并 exit 1；`vslight -- chat` 仍可打开同名文件。
- macOS 原生语言资源保留英文（en/en_GB）、简体中文（zh_CN）和繁体中文（zh_TW），其他原生语言回退英文；工作台语言包仍可用。

当前未签名151 arm64 app 为 **422,443,727 B**，同条件 ZIP 为 **157,530,299 B**；相对固定基线分别减少 **20.01%** 和 **18.27%**，见[151产物账](plan/lean-core.records/M8-artifact151.json)。独立 Mermaid editor 恢复 ELK/tidy-tree/ZenUML 的实际增量已计入；149的32项矩阵、33项交互证据保留原版本。150新增存储修复后的独立 editor 与 Markdown Preview 已通过真实 quit/restart 定向恢复：原文、ID、主题、数值 pan/zoom、完整 SQLite editor 状态严格相等，四张原图经复核，见[150持久化记录](plan/lean-core.records/M3-storage150-final.md)。151只删除终端24条退休默认过滤项，签名副本 app **421,985,205 B**、ZIP **157,386,282 B** 另行计量。用户停用 smoke 后按计划逐项替代验收；151的[真实终端按键与用户覆盖](plan/lean-core.records/M4-terminal-keys151.md)、[四项完整可访问性焦点](plan/lean-core.records/M4-accessibility151.md)均通过。本次本地 arm64 验收已完成，见[最终验收](plan/lean-core.records/M8-final-acceptance151.md)。x64/CI 未运行，按用户指示不属于本次验收范围；未发布。

## CI 范围（决策 B 落地）

- `ci-build-macos.yml`：保留完整触发。
- `ci-build-linux.yml` / `ci-build-windows.yml`：降为 `workflow_dispatch` 手动触发
  （保证可构建能力，不纳入发布验收）。
- publish-* workflows：随 vslight org 基础设施启用（当前保留但外部标识未迁移）。
