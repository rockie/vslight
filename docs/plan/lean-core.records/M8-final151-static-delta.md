# M8 · 151 本轮只读静态增量复核

快照时间：2026-10-02T20:29:16.213059+10:00。状态：**release当轮151事实与冻结输入一致性子门 PASS**，不代表整体Release或M8完成。本轮只读取现有151记录/冻结manifest和当前工作区输入，写本.md/json；未改release、root计划、旧记录、manifest或产物，未重跑sign/包检查/GUI/build/tests/smoke，未触发CI/Release/提交推送。

## Release事实与151记录

[release](../../vslight-release.md)当前SHA-256 6b15c8922fcba5965354d1c107bdd305c7397eec30ecf2a37069c763212fc8d2：

| 当轮151指标 | release数值 | 151已有记录 |
| --- | ---: | --- |
| unsigned app | 422,443,727 B | M8-artifact151.json，匹配 |
| unsigned ZIP | 157,530,299 B | M8-artifact151.json，匹配 |
| signed app | 421,985,205 B | M8-sign151.json，匹配 |
| signed ZIP | 157,386,282 B | M8-sign151.json，匹配 |

同条件下降20.01%/18.27%与unsigned字节账匹配；151仅移除24条退休terminal default filters的描述与已记录整文件preimage匹配。release中的151签名.md及151产物.json相对链接解析到正确现有文件。历史150/149和旧签名证据仍按原版本标明，不改写成151实测。

现有151签名记录的真实runner/shell均0、公证Accepted、signed ZIP CRC0、15项strict全部0；内容43预期/0异常/0删除、cleanup精确search list与default保持、私有keychain/P12删除。首次子agent沙箱206保留。这里只交叉读取证据，未再次签名或验证包。

[M8-local151-carriers.json](M8-local151-carriers.json)记录1223 payload paths=1209 regular+14 links、carrier codesign0、内容不变、installed app未改、未发布。本轮将其3项copies的recorded bytes/hash与151 signed/unsigned原记录及冻结manifest逐项核对，全部匹配；未再次扫描或运行持久载体。signed ZIP hash 5a6768d4c9dfb126eaa65f66c64080baf993145352d77707a9c2d5b4b9b618eb；unsigned ZIP hash 8266e5ab9f6dfc114e94a5dc96e8185689eb42b90695f4b20cf757e854cfe366。

## 当前输入与1475冻结项

冻结时间 2026-10-02T18:34:54.944600+10:00，dirty@f1961b7546139a6aa722ff0b8a001296d3041e33。manifest SHA-256 f6fc4ff04b5b1c4828dc8c1f353f0a2bdb16affa7a5883a8d8fae2ee64fb5cd6，与151 build记录一致，未重写。

当前1475条目中 1465 精确匹配、10 偏离；455个生产/构建输入、23个验收helper、19个workflow **全部精确匹配**，没有实质或字节drift。新增记录目录外输入0。偏离项全部为文档/计划/验收记录的后续进度，不改变151生产产物来源：

- docs/plan/lean-core.md
- docs/plan/lean-core.records/M4.md
- docs/plan/lean-core.records/M6-runtime150-final.json
- docs/plan/lean-core.records/M6-runtime150-final.md
- docs/plan/lean-core.records/M6.md
- docs/plan/lean-core.records/M7.md
- docs/plan/lean-core.records/M8-docs-final-audit.md
- docs/plan/lean-core.records/M8-remaining-gates.md
- docs/plan/lean-core.records/M8.md
- docs/vslight-release.md

每个冻结项的类别、旧/新hash、匹配结果均保存在 [M8-final151-static-delta.json](M8-final151-static-delta.json)，不把当前doc hash回写原manifest。当前freeze输入对比与载体复制记录也没有执行生产helper或触发workflow。

## 仍保持的退出边界

release明确本地未发布、普通GUI/持久化与当前输入双arch CI尚未齐，未宣整体绿。主线程报告的151第一轮UI因taskfixture漏-c/custom task未注册失败、已正常quit，并正在同profile准备复验；账户/主题/禁用扩展/快捷键/native-schema/terminal子门已有局部绿。该运行时信息来自主线程更新，本轮不重跑、不独立重计，也不把fixture失败掩盖或当全UI通过。

签名链、载体与本轮静态一致性通过不替代151剩余runtime/native/普通退出和当前CI门。M8-remaining-gates的19:20快照早于151签名完成，实际151签名依据新M8-sign151记录；旧快照不作为本轮当前签名失败或整体完成结论。
