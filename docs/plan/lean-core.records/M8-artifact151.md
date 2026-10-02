# M8 · 151 unsigned app/ZIP 与独立 CRC

测量时间：2026-10-02T19:18:26.676862+10:00。generation151，dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，实际完整构建见 [M8-build151.md](M8-build151.md)。本轮 **unsigned 字节账、归档和独立CRC PASS**；尚未签名、公证、发布，也不代替151实际 registry/terminal/native/quit验收。双arch当前输入CI未跑。

| 指标 | 151实际值 |
| --- | ---: |
| app regular files | 1199 |
| app regular bytes | 422,443,727 |
| unsigned ZIP bytes | 157,530,299 |
| 同条件baseline app bytes | 528,142,131 |
| 同条件baseline ZIP bytes | 192,738,926 |
| app下降 | 20.01% |
| ZIP下降 | 18.27% |

app：/private/tmp/lean-core-build151-c480juxs/vscodium/VSCode-darwin-arm64/VSLight.app。unsigned ZIP：/private/tmp/lean-core-build151-c480juxs/VSLight-151-unsigned.zip。ZIP SHA-256：8266e5ab9f6dfc114e94a5dc96e8185689eb42b90695f4b20cf757e854cfe366。对150 unsigned app少755B、ZIP少2,127B，不能把150签名链当作151签名。

只累加regular files一次，symlinks排除，asar/unpacked不重复累加；沿用同条件 Node24.18.0/Electron43.7.5/CI=true/arm64/ditto unsigned baseline。macOS floor12.0、65项CFBundleDocumentTypes与CFBundleURLTypes均和150 unsigned保持完全相同。归档前后全部app regular payload hash一致，未修改app。

## 实际归档与CRC

归档命令 ditto -c -k --sequesterRsrc --keepParent APP ZIP，真实 exit0。随后独立 Python3.12 zipfile.testzip 全量CRC，真实 exit0；输出 entries=3811 firstBad=None。命令、时间、stdout/stderr和真实exit均保留在 [M8-artifact151.json](M8-artifact151.json) 与私有根 unsigned151-zip/unsigned151-zip-crc 的stdout/stderr/*-exit.json，不以生成ZIP成功代替CRC。

冻结输入manifest SHA-256 f6fc4ff04b5b1c4828dc8c1f353f0a2bdb16affa7a5883a8d8fae2ee64fb5cd6，本轮只读原manifest、生产源码与app；只创建私有根中的unsigned ZIP/证据及四份151记录。151真实运行时/原生/退出生命周期和独立signed/notary/staple链仍待齐，M8/Release不记完成。
