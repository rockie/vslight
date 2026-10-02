# M8 · final150 signed ZIP CRC 与静态检查

核验时间：2026-10-02T17:40:05.534534+10:00。基线 dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，冻结输入时间 2026-10-02T10:32:04.728531+10:00。本轮 CRC、生产输入真实性与静态子门 **PASS**；不代表 M8 或发布完成。原 build150/sign150、ZIP、app 与冻结 manifest 均只读，未重构建、未运行或修改 smoke、未提交/推送/触发 CI/发布。

## 最终 signed ZIP

持久 ZIP：/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/sign150/VSLight-150-signed.zip。157,388,380 B，SHA-256 55f2e2ce6e34246e9ddb023f49c5b3be2cdd89625c3deda7bdced2c2f33e7d4f，精确匹配 [M8-sign150.json](M8-sign150.json)。独立 Python zipfile.testzip 真实 exit **0**：3858 entries，firstBad=None；不以 ZIP 生成成功代替 CRC。

ZIP 中 1209 个 regular files、14 个 symlinks 和持久 signed app 的全部文件及链接目标逐字节一致，缺失/额外/失配均 0；472 个 app directories，2163 个 AppleDouble entries 也由 CRC 全量覆盖。unsigned ZIP 的字节数与 SHA-256 也精确匹配 [M8-artifact150.json](M8-artifact150.json)。

## 冻结输入

原 manifest SHA-256 6e6f35ba16815bbe7db96434d32c3b04456b31600db2e57f67bd94e9933fa894 前后相同；持久 build150 仓库副本中的 1421/1421 条目精确匹配。当前工作区快照 2026-10-02T17:40:05.534534+10:00：1405 匹配、16 偏离，其中 3 个验收 helper、13 个文档；454 个生产/构建输入和 19 个 workflow 条目全部匹配，无生产/工作流失配。patches 下全部 137 个输入条目（含 prune.json）、150 Storage 补丁、254-entry prune、product、build/prepare、resource helper、退休 API 清单保持冻结输入。

后改项（精确旧/新 hash 见 JSON，不改写原 manifest）：

- dev/check-lean-runtime.py (validation_helper)
- dev/test-fixtures/lean-core/external-links-cdp.mjs (validation_helper)
- dev/test-fixtures/lean-core/ordinary.js (validation_helper)
- docs/plan/lean-core.records/M2-resources.md (documentation)
- docs/plan/lean-core.records/M4-secret-delete-investigation.md (documentation)
- docs/plan/lean-core.records/M4.md (documentation)
- docs/plan/lean-core.records/M5.md (documentation)
- docs/plan/lean-core.records/M8-next-session.md (documentation)
- docs/plan/lean-core.records/M8-remaining-gates.md (documentation)
- docs/plan/lean-core.records/M8-resume-audit.md (documentation)
- docs/plan/lean-core.records/M8.md (documentation)
- README.md (documentation)
- docs/extensions-compatibility.md (documentation)
- docs/plan/lean-core.md (documentation)
- docs/vslight-migration.md (documentation)
- docs/vslight-release.md (documentation)

未纳入原 manifest 且位于证据记录目录外的当前新增项：

- dev/test-fixtures/lean-core/ordinary-visual-cdp.mjs (validation_helper)
- dev/test_check_lean_runtime.py (validation_helper)

证据记录目录内新增记录与本文件不作为冻结生产输入。当前快照会包含其他并行验收/文档工作，不能把当前 hash 冒充 build150 原执行输入。

## 签名验证环境与检查器根因

原沙箱内 codesign --verify --deep --strict --verbose=4 真实 exit 1，stderr 为 invalid signature (code or signature have been modified)，arm64。只验证主可执行文件/独立 helper 也立即失败，display 显示 Authority=(unavailable)。同一路径、同一未改 app 在沙箱外同命令真实 exit **0**，所有 helper/framework validated，主 app valid on disk / satisfies its Designated Requirement。已区分为沙箱对系统签名/信任服务的限制，未重签或修改产物；原失败保留在 JSON。

原 checker 对 signed app 真实 exit 1：首先拒绝 @parcel/watcher/build/Release/watcher.node，导致整个 ASAR inventory 丢失，继发 CRI/katex 的缺失报告。根因是 14 个 unpacked Mach-O 的签名后长度变化，ASAR 索引仍保持签名前长度；ASAR 本身签名前后逐字节相同。本轮重算签名前后内容审计 PASS：43 处预期签名变化，0 unexpected/0 removed；全部非 LINKEDIT section payload 保持不变。每处旧/新长度和 hash 见 JSON。

经授权，仅修改验收工具 [check-lean-runtime.py](../../../dev/check-lean-runtime.py)，新增 [test_check_lean_runtime.py](../../../dev/test_check_lean_runtime.py)。显式 --signed 先验证整个 app deep/strict 签名；只有内部 regular Mach-O 的长度差异且该文件独立 strict 签名通过才接受；仍检查 ASAR framing/offset/link、路径、包和退休闭包。整 app 的路径/mode/regular bytes/symlink target 摘要前后必须相同。默认 unsigned 模式保持严格长度要求。

## 实际静态结果

- 最终 unsigned checker：真实 exit 0。
- 最终 signed checker --signed（沙箱外只读）：真实 exit 0；整 app + 14 个长度变化 Mach-O，共 15/15 签名 exit 0；ASAR 2134 nodes、26 unpacked；CRI、katex、node-pty、sqlite、ripgrep、physical semver 全齐，退休项和结构错误全部 0。前后文件状态摘要相同：ea2498024a70028171aa1283a98baa272708aef976e78c51fca7a4813a548ea0。
- checker 回归：12/12 PASS，覆盖签名前后原文件、增长/缩短、整包及局部坏签名、非 Mach-O、丢文件、内部/外部 symlink、坏 offset、退休/必需包与验证期间修改。fixture 只 mock codesign 外部服务；真实产物签名验证未 mock。
- resource helper：Python 3.12.13 下 27/27 PASS。默认 /usr/bin/python3 3.9.6 的首次 26/27 + CLI version gate failure 真实保留；生产已要求 Python 3.11+，未改测试以绕过门。
- build/prepare 脚本 bash -n exit 0；product/prune/退休 API JSON 解析成功，prune 254；两项后改 fixture 用固定 Node 24.18.0 --check exit 0，未执行 GUI/smoke。

完整命令、原始 stdout/stderr、退出、冻结/当前每项 hash、签名及包闭包在 [M8-crc-static-final.json](M8-crc-static-final.json)。双 arch 当前输入 CI 及其他未关闭的运行时/UI/文档门仍按主记录处理，不从本轮静态检查推定完成。
