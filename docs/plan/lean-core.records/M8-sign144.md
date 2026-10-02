# M8 · 144签名链实测

- 对应[lean-core.md](../lean-core.md) V10/M8；最近更新：2026-10-02 02:45 +1000。
- 状态：144输入的独立签名副本通过；不是最终UI/CI或M8完成证据。后续voice元数据及145清理会改变输入，最终包须重签。
- 基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，114–139/141–144；[机器证据](M8-sign144.json)绑定冻结输入、实际app、ZIP和日志。

用独立app副本执行现有`vscode/build/darwin/sign.ts`，沿用Developer ID、hardened runtime和现有entitlements，再提交Apple公证。资源整理发生在签名前；未改用户应用、未发布或推送。凭据只进入私有临时keychain和受限日志，不写仓库。

| 退出条件 | 实际验证 | 结果 |
| --- | --- | --- |
| 严格签名 | `codesign --verify --deep --strict`，staple前后各一次 | exit0 |
| 公证 | `notarytool submit --wait` | Accepted；ID `b51a47d8-9900-4f7e-ba6f-23663c637b19` |
| staple | `stapler staple` / `stapler validate` | 两者exit0 |
| 系统评估 | `spctl --assess --type execute` | accepted，Notarized Developer ID |
| ZIP完整性 | 相同ditto参数归档后`unzip -t` | exit0；实际尺寸与SHA见机器证据 |
| 临时凭据清理 | delete-keychain/P12删除及原search list比对 | 临时文件已删，原search list相同 |

signed app与unsigned app分开记账；未拿signed ZIP与unsigned基线混算比例。最新同条件unsigned账见[M8-final-artifact](M8-final-artifact.json)。最终源码仍待145集成和GUI/双arch CI，当前签名通过不代表可发布。
