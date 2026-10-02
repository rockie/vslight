# M4 · 退休设置、听写与可访问性信号

- 计划：[lean-core.md](../lean-core.md) §5.4–5.7 / M4 / V6–V8。
- 最近更新：2026-10-01 22:53 +1000；状态：切片已交付，完整 M4 验收未完成。
- 根基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；私有集成源码 `/tmp/lean-core-api-5_lg434f/vscode`。用户生成树未修改。

[126 补丁](../../../patches/126-light-retired-ai-settings-signals.patch) 修改 6 个源文件，16,913 字节，SHA256 `7caefc2797db3cf7b2326c19badd72654e664ea6d99d4a819fb942351c907d9b`。前置为 121/124 对应普通消费者改动与完整 114–125 候选。

`vscode/src/vs/workbench/browser/workbench.contribution.ts` 去除 AI settings toggle、Ask in Chat、命令语义搜索和 Chat location 四项 schema；`vscode/src/vs/workbench/browser/quickaccess.ts` 对应三项 typing 删除。保留 Settings 本地 TF-IDF 开关及普通命令建议。

`vscode/src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.ts` 删除 Chat、voice、Chat 编辑确认的 10 个信号与 11 个独占声音定义；`vscode/src/vs/workbench/contrib/accessibility/browser/accessibilityConfiguration.ts` 补删此前保留的 6 项 voice/edit schema。精确声音资产进入统一 prune。通用 progress 保留，只去 Chat pending 旧别名；普通编辑器、终端、task、save/format、diff、inline/next-edit signals 保留。既有 Debug/Notebook signal 闭包留待 M6，不把字符串为零当验收。

真实完整 noEmit 暴露 Comments 编辑器、SCM 输入框仍引用已退休 Dictation；126 精确移除这两文件的 import 和贡献列表项，保留其他 editor contributions。

| 验收 | 命令 / 环境 | 实际结果 |
| --- | --- | --- |
| 注册表与普通信号 | `node /tmp/lean-schema126-check.mjs`；真实 headless Chromium，esbuild 装载实际模块及原件 | 10 个退休 signal absent；27 个其他信号逐字段与原件相同（progress 的退休别名除外）；6 个影响模块解析通过。证据 `/tmp/lean-schema126-check/registry-comparison.json`。 |
| runner 失败审查 | 初次 Node 装载、首次 Browser 原件拦截与 undefined 字段断言 | Node 不提供 window；原件插件需 realpath 匹配；progress undefined 字段需同形比较。均属测试装配问题，未为测试添加产品 mock/Null，最终改在真实 Chromium执行。 |
| 补丁重放 | 6 个精确 preimage 在独立 tmp 上 apply-check/apply/reverse-check，最终逐字节比对 | 全部通过；`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-replay-126-mxcmz8e6`。 |
| 全源码集成检查 | `node node_modules/@typescript/native/bin/tsc --noEmit -p src/tsconfig.json`；114–125＋126首四文件＋Browser prune | exit1，231 diagnostics。229 在后续退休域；2 为上述 Dictation 入边，已在126后两文件修正。日志 `/tmp/lean-root-125126-tsc.log`；没有据此宣称最终 noEmit 通过。主进程 app.ts 旧128诊断已消失。 |
| GUI 与最终完整图 | 未运行 | M4/M6/M8 统一集成后验证。已绿且未受影响的旧 suites 沿用，不重跑。 |
