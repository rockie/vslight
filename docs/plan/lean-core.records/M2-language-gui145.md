# M2 · 德语工作台实机验证

对应 [计划](../lean-core.md) V4。最近更新：2026-10-02 04:12 +1000。状态：工作台德语通过；原生 menu/dialog 门待解锁。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，实际145+146 app；未把语言包显示作为原生 locale 证据。

实际主进程54171以 `--locale de` 使用已有隔离 CLI 安装目录。首次截图仍是英文；[languagepacks.json](/tmp/vslight-smoke.fWrs7O/user-data/languagepacks.json) 的 birth time 为17:53:08.923755 UTC，在17:53:08.245450 UTC 启动之后，且未有翻译缓存。源码 [nls.ts](/tmp/lean-core-api-5_lg434f/vscode/src/vs/base/node/nls.ts:42) 在索引缺失时回退默认英文，因此索引尚未就绪是现有证据支持的原因；未捕获首次主进程 NLS config，不补造该值。

通过 fixture 真实执行普通 quit，确认旧 PID 已退出，清掉仅此 fixture 的 pending quit 后，用同一 profile/pack 真实重启为58637。只读主进程 inspector 确认 userLocale/resolvedLanguage 均为 de，languagePack.messagesFile 指向真实生成缓存。实际工作台 DOM lang=de，Welcome/Outline/Timeline 显示 Willkommen/GLIEDERUNG/ZEITACHSE；主线程复核原始截图，文字可读。未改产品源码、全局语言偏好、用户 profile 或安装应用。

| 退出条件 | 实际步骤 | 环境/基线 | 结果与证据 |
| --- | --- | --- | --- |
| 非中英文语言包仍可安装 | 前序 CLI 安装与列表/卸载普通主题 | 144 app/隔离 extensions，de pack1.131.0 | [CLI记录](M2-language-cli.json) |
| 非中英文工作台实际显示 | 同 profile quit/restart，只读 NLS config +真实 DOM/截图 | 实际145+146 app，main58637/host59385；CDP19530/19531 | PASS；[身份、hash、截图与配置](M2-language-gui145.json) |
| 原生语言回退和 menu/dialog | 独立系统语言实际 GUI | 待解锁 | 未验；本记录不替代原生门 |
