# M7 · 构建入口与产品元数据闭包

- 对应计划：[lean-core.md](../lean-core.md) §5.7、M7 / V8；最近更新：2026-10-02 00:34 +1000。
- 根基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；状态：已集成；完整构建通过，实机验收进行中。
- 主事实源码 `/tmp/lean-core-api-5_lg434f/vscode`，preimage `/tmp/lean-core-build134-preimage`。
- [134补丁](../../../patches/134-light-retired-build-entrypoints-metadata.patch)：17文件、22394字节，SHA256 `034dc1045fea2cc84574afda380acfbd48609b7ae0fe296bee97dd08739c62fc`。

134去 buildfile/next 的 Agent Host、transcription、Notebook worker 和 Sessions入口，web/mangle的 Sessions引用，desktop/web资源copy的专属Chat/voice/Debug素材。保留普通editor/extensionhost/language detection/search/PTY/watcher/profiling入口与Webview资源。清理i18n专属resource/project和Codex协议生成scripts/CI检查，解绑独占AI SDK native检查与musl Claude清理步骤。

普通NotebookDocument服务入口和旧扩展宿主environment的Sessions字段最后补漏，同时修131改变后的实际profile构造参数数目。源product不再按依赖自动写copilotVersions，也不在web开发fallback里生成默认Chat agent。

根 [product.json](../../../product.json) 去48个退休proposal grants；[retired-api-proposals.json](../../../build/retired-api-proposals.json) 固定53个退休提议。 [prepare_vscode.sh](../../../prepare_vscode.sh) 在上游与根合并后逐项过滤，防止只删根映射、上游授权重新出现。相同扩展的普通authentication/search/inline-completions/css等授权保留，不按扩展ID中的AI字样删除。稳定纯数据声明与原proposed permission检查保留，allowlist不能恢复运行服务。

prepare另外精确删除 Agents telemetry、Agent SDK、Copilot版本、dictation下载配置、MCP gallery/trusted auth、Chat participant registry/session recommendations等运行配置键，沿用既有默认Chat/服务端/隧道键删除。普通OpenVSX和Webview URL配置保持。

| 检查 | 实际结果 |
| --- | --- |
| 真实prepare内jq表达式 | 输入实际合并product及注入退休键/全部53proposals；62个extension映射逐项与原普通值比较通过，9个运行键缺失；普通gallery/Webview值相同。证据 `/tmp/lean-product134-check.json` |
| 受影响 i18n resource mapper | 实际 Node测试按 `JSON file source path` 只运行对应case，1 passing、0 skip/fail；普通八个模块映射与退休Sessions拒绝通过，未重跑未影响XLF parser cases |
| 源码/配置解析 | 17变更文件中12TS AST parseDiagnostics为0，JSON与三workflow YAML实际解析通过 |
| shell语法 | `bash -n prepare_vscode.sh` exit0 |
| 独立重放 | replay `lean-replay-134-lnn_7su6`，apply-check/apply/reverse-check均0，17文件逐字节一致 |

133下载任务与136依赖已集成。第一次完整构建exit5：proposal数据JSON误放在patches/light动作目录；移到build/retired-api-proposals.json并同步prepare/smoke后，第二次完整构建exit0。静态/CLI通过；semver启动copy缺口及138修复见[M8](M8.md)。M7未完成。
