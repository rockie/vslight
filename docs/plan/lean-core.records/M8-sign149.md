# M8 · 最终149独立签名、公证与staple

计划：[lean-core.md](../lean-core.md) V10/§9.4。最近更新：2026-10-02 04:55 +1000。状态：签名/公证/staple/ZIP分项通过，原runner清理记录失败已单独复核；完整GUI和双arch CI仍待验。代码基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，实际147+148+149；未发布，raw app未改。

在独立副本沿用现有build/darwin/sign.ts和已授权凭据。Apple notary **Accepted**，ID **538bae3e-3e94-483e-8653-cfe10f27e190**。签名前后strict codesign、spctl Notarized Developer ID、staple/validate及最终ZIP CRC各实际exit0；主线程另做严格最终复核，见[原始身份与结果](M8-sign149.json)。签名app 421,987,283 B/1209 regular files，ZIP 157,387,197 B；不与unsigned基线混算。

内容审计：1166个普通文件字节不变；新增10个签名/公证ticket文件，33个已有文件变化为32个Mach-O签名与主Info.plist的5个既有权限说明；没有删除或未知变化，文档关联/URLTypes一致、macOS12.0保持。[全部变动及hash](M8-sign149-content.json)可逐项复核。

原runner最终退出 **2**：所有发行物分项完成后，克隆遗漏restore-search-list.py，清理记录辅助步骤失败。临时keychain/P12删除在此之前已执行，主线程再次证明没有任务私有凭据文件、当前search list等于145已保存参照；不修改search list，独立清理复核exit0。149签名前未另捕获search-list快照，记录明确这一边界，不伪称原runner0、不重复已绿公证。受限runner日志不输出凭据。
