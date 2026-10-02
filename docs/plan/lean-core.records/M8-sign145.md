# M8 · 145+146 最终输入签名链

- 对应[lean-core.md](../lean-core.md) V10/M8；最近更新：2026-10-02 03:21 +1000。
- 状态：最终输入独立签名、公证、staple和ZIP检查通过；完整GUI/双arch CI仍未齐，未发布。
- 基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；[机器证据](M8-sign145.json)绑定冻结inputs145、实际app、ZIP及日志。

现有`vscode/build/darwin/sign.ts`对独立app副本执行Developer ID/hardened runtime/既有entitlements签名，资源整理先于签名。strict codesign在staple前后通过；Apple notary Accepted（ID `eebc9e69-4c8a-444d-95f3-8506c0220e57`），staple/validate、spctl Notarized Developer ID、最终ZIP CRC均通过。另一次strict/spctl/stapler复核各exit0。

凭据只进入临时keychain和600权限日志。临时keychain/P12已删除，用户keychain search list相同。未写用户应用或公开产物。signed app422,035,077 B、1210普通文件，staple后ZIP157,407,111 B；unsigned同条件账另见[M8-final-artifact](M8-final-artifact.json)，不混算比例。

[签名前后内容核对](M8-sign145-content.json)：1167普通文件原字节不变，43处变化仅10签名文件、Info.plist和32 Mach-O，没有意外内容变化。签名链通过不代表剩余GUI或CI完成。
