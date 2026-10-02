# M3/M6/M8 · 150 Mermaid 定向持久化验收

计划：[lean-core.md](../lean-core.md) V3/V9；最近更新：2026-10-02 17:40 +1000。状态：本地子门通过。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，最终150 app，生产补丁未改。当前双arch CI未验，不据此完成M8。

从重启安全副本复制已绿149的真实profile，经150准备profile再复制到 `/private/tmp/lcfinal-chkarkup/mermaid/u`，仅迁移私有路径与按macOS目录birthtime计算的workspace ID。测试app是冻结150未签名产物的APFS副本，四个main/shared/renderer/executable指纹启动前后相同。没有操作用户profile、installed app或生成树。

| 退出条件 | 实际步骤/环境 | 结果与证据 |
| --- | --- | --- |
| 两surface恢复 | 普通命令显示已有Markdown Preview与独立editor，quit→同profile重启 | PASS；main35743→37256、host36475→37987，均真实父wait、exit0/signal null；[汇总](M3-storage150-final.evidence/summary.json) |
| tabs顺序/active/preview/pinned | 新host的公共tabGroups在操作前与退出前严格比较 | PASS，三tab与全部flags相同；[before](M3-storage150-final.evidence/before-snapshot.json)/[after](M3-storage150-final.evidence/after-snapshot.json) |
| 原文/ID/主题/transform | ID与active两路copySource严格等于未trim原文；实际DOM与numeric矩阵相等 | PASS，ID165d2776、dark、scale1.25/x429.75/y225，四次精确复制 |
| 实际序列化状态 | 每次正常quit后只读SQLite immutable，无WAL；完整editor memento比较 | PASS，含editor与Markdown Preview资源/状态，原始source与panZoom保留；[cold](M3-storage150-final.evidence/cold-sqlite.json)/[restart](M3-storage150-final.evidence/restart-sqlite.json) |
| 历史/假凭据/旧配置保留 | copied global/workspace DB增加synthetic Chat history/MCP/opaque secret/auth grant与历史文件哨兵 | PASS，正常quit/restart后原值和文件逐字相同；不冒充真实用户历史或真实账户token |
| 中文/控制/图形 | 四张真实workbench viewport原图逐张查看 | PASS，无缺字或裁剪；[editor前](M3-storage150-final.evidence/before-editor.png)/[后](M3-storage150-final.evidence/after-editor.png)、[preview前](M3-storage150-final.evidence/before-preview.png)/[后](M3-storage150-final.evidence/after-preview.png) |
| 清理与剪贴板 | 全item/type私有0600备份、finally恢复并删除；普通quit | PASS，四个main进程均正常退出，clipboard restored/backupDeleted；不打印原内容 |

首次尝试保留为[红汇总](M3-storage150-final.evidence/attempt1-red/summary.json)：重启后公共tabs相同，但后台独立editor尚未resolve，直接按图表ID查询没有已注册webview，DOM超时。源码 `editorManager.deserializeWebviewPanel` 在resolve时才注册图表，`extension.ts`的ID路由只读取已注册webview；第一次退出时active为Markdown Preview，与149验收active为editor不同。用公共 `workbench.action.firstEditorInGroup` 显示原后台tab，等待其原ID实际渲染后，ID命令、原文与完整持久化比较全绿。没有重建source editor替代恢复，没有放宽ID/原文/transform，没有修改生产代码。

保存[实际控制器](M3-storage150-final.evidence/run-final.mjs)与[SQLite审计](M3-storage150-final.evidence/persisted.py)。本项只补150 Storage变动的定向门，不重复或扩大149的32图/33交互证据。
