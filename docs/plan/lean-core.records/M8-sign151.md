# M8 · 151 独立签名、公证与最终 signed ZIP

记录时间：2026-10-02T19:37:19.745580+10:00。151实际完整构建与unsigned产物见 [M8-build151.md](M8-build151.md)、[M8-artifact151.md](M8-artifact151.md)。本轮 **signed链子门 PASS**；native/151实际runtime/普通退出生命周期及当前输入双arch CI仍为独立门，不代表 M8 或 Release 完成。

独立签名根 /private/tmp/sign151-8n2nwj4c（0700）；以APFS clone从151 unsigned app生成独立副本，clone contents匹配。调用真实151 source/build/darwin/sign.ts，固定Node24.18.0。原unsigned151前后1199个regular payload hash完全一致，150应用未触碰。本轮只写新私有签名根、三份151签名记录与对应.evidence附件；未触发CI/Release，未运行或修改smoke，未提交/推送。

## 实际链结果

当前runner真实 exit0，2026-10-02T19:32:30.101935+10:00 至 2026-10-02T19:36:41.674762+10:00；所有20个keychain/sign/verify/notary/staple/spctl/ZIP/CRC/checker/content/cleanup阶段真实exit0。首次子agent旧沙箱在创建keychain时报206，未开始签名/公证，cleanup0；已单独保存，不冒充成功。主agent当前full-access重启同一控制器后成功，notary --wait只有该次提交，没有超时重试。

- codesign deep strict公证前及staple后各exit0；spctl execute assessment exit0。
- Apple公证 **Accepted**，submission ID 8570069d-e2a5-40fe-8b7a-54f0dc93bdff；staple与validate各exit0。
- signed package checker --signed exit0，整app与14个长度变化Mach-O各strict成功（15/15）；完整保留/退休闭包准确，验证前后整个signed app摘要一致。
- signed ZIP独立CRC exit0：entries=3858 firstBad=None。ZIP中的1209 regular files/14 symlinks与最终signed app逐字节及目标一致，缺失/额外/失配0。
- 签名前后内容审计PASS：43处预期签名metadata/staple/Mach-O/五项usage descriptions变化，0 unexpected、0 removed，1166 regular files不变。所有Mach-O各arch非LINKEDIT section payload逐字节hash相同；见 [M8-sign151-content.json](M8-sign151-content.json)。

## 产物与清理

signed app /private/tmp/sign151-8n2nwj4c/VSCode-darwin-arm64/VSLight.app：1209 regular files，421,985,205 B。最终ZIP /private/tmp/sign151-8n2nwj4c/VSLight-151-signed.zip：157,386,282 B，SHA-256 5a6768d4c9dfb126eaa65f66c64080baf993145352d77707a9c2d5b4b9b618eb。

签名前精确捕获user keychain search list和default。退出trap删除本次私有keychain/P12并验证：private keychain removed=true、P12 removed=true、search list equal=true、default unchanged=true；search list restored=false。未修改default/login keychain，凭据仅从既有授权env加载，未打印/附入证书、密码或token。

完整真实命令/退出、hash、notary、checker、精确pre/post与清理在 [M8-sign151.json](M8-sign151.json)。selected真实日志及首次206边界保留于 M8-sign151.evidence；敏感import/store/signing原始日志只留0700私有根，不附入仓库记录。root live执行handle由主agent保持并真实wait完成。
