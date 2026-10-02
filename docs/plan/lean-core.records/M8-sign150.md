# M8 · 150独立签名副本

计划：[lean-core.md](../lean-core.md) V10/M8。最近更新：2026-10-02 10:53 +1000。基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33、150实际完整构建。状态：sign/notary/staple/strict/spctl与清理通过；最终signed ZIP独立CRC因用户暂停未运行，不宣称M8或Release完成。

签名在 `/private/tmp/sign150-hktfpzl0` 的独立APFS副本进行，149签名与150未签名app均保留原件。沿用实际150 build/darwin/sign.ts、既有授权凭据与临时keychain/P12，不打印凭据、不推送或发布。实际runner exit0；codesign deep strict、spctl、Apple公证Accepted `e1cc1ecb-a94b-430a-9f81-d3803d092e32`、staple及validate均exit0。退出trap清理完成，私有keychain/P12不存在，精确pre-sign search list与清理后相同（无需restore）。

[完整产物数值、ZIP SHA与清理](M8-sign150.json)；[签名前后内容审计](M8-sign150-content.json)43处签名相关变化、0意外变化/0删除。非native文件仅签名metadata、staple ticket及signer的5项usage descriptions变化；全部Mach-O各arch非LINKEDIT代码/数据section payload逐字节hash相同。新unsigned ZIP CRC exit0；signed ZIP的独立CRC还须续做，不以生成成功代替它。

原始scripts、logs、ZIP与app的重启安全副本见[M8续做入口](M8-next-session.md)。未运行当前输入CI，未发布。
