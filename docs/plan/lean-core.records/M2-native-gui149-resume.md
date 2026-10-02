# M2/V1/V4 · 最终149原生GUI续验

计划：[lean-core.md](../lean-core.md) V1/V4、M2/M8。最近更新：2026-10-02 10:28 +1000。基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，最终147–149未签名app。状态：en/zh-CN/zh-TW/fr四种原生菜单、打开/保存和三类文件打开全部通过；Finder/Dock/About待验，当前两arch CI按用户仅本地限制未验。

独立根 `/private/tmp/native149-igkua3xm`。临时DYLD constructor仅对com.vslight在真实进程的NSArgumentDomain设置AppleLanguages，然后记录真实NSBundle/Framework/AppKit选择并继续正常Electron启动。只改私有进程volatile domain，没有写全局或app的persistent preferences、没有用--locale代替原生偏好，也没有修改app字节。私有native-fixture调用公共showOpenDialog/showSaveDialog，读取限定PID的真实AX按钮并截图，实际按Cancel后断言API返回取消结果。

| 验收门 | 实际结果 | 状态 |
| --- | --- | --- |
| 英文native选择/菜单/打开与保存 | main48761/host50018，三个bundle实际en；原生AX Open/Cancel、Save/Cancel；真实截图和取消返回 | PASS，[原始状态与dialog](M2-native-gui149-resume.json) |
| txt/md/py用指定最终app打开 | 冷启动CLI传三条自己的路径，真实tabs包含各URI，document内容与文件逐字相同；截图显示三类普通图标 | PASS |
| zh-CN/zh-TW/fr fallback完整GUI | main60968/66849/68351，分别实际选择zh_CN/zh_TW/en；真实菜单文件/檔案/File，真实打开/保存面板取消/Cancel，取消后API均返回undefined，三类文件逐字一致 | PASS；每例正常quit 0，原图及AX保留 |
| Finder/Dock/About图标 | 等实际前台走查 | 未运行 |
| 两arch现有CI | 用户要求仅本地，不推送/触发 | 未验 |

原图为同根各语言/evidence/open.png、save.png，主agent已实际查看英文open、繁体open和fr回退save截图。测试源、dylib、控制器与各native-preferences.json保留，全局与app persistent preferences前后相同。首个过长私有profile触发Unix socket长度限制的harness失败，以及-AppleLanguages被VSCode解析成短选项导致--status退出的harness失败均留在原目录；改短路径并用process volatile domain后才完成GUI。首轮中文菜单英文不计通过；最终先让真实工作台生成languagepacks索引，再冷启动完成简繁测试，未修改翻译或降低断言。
