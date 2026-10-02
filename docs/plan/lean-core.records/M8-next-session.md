# M8 · 用户暂停后的续做入口

最终完成（2026-10-02 22:01 +1000）：**已完成，进度8/8**。用户明确取消x64/CI验收门、接受本地arm64结果；其余退出条件全通过，见[最终验收](M8-final-acceptance151.md)与[范围指示](M8-local-arm64-scope151.md)。当前输入/实际签名app及两ZIP复核一致，生产漂移0。未提交/推送/触发CI或发布。以下保留历史时点的未验CI/阻塞事实，已由最新指示解除。


最终更新（2026-10-02 21:38 +1000）：必要本地验收均已通过，进度6/8，M1/M3/M4/M5/M6/M7已完成。[151逐项覆盖与原始证据](M8-final-local-audit151.md)涵盖真实键盘/用户覆盖、四项完整A11Y、全注册/菜单、Cold/Reload及普通数据持久化；独立151签名公证/CRC全绿。**唯一未验门是当前输入arm64/x64 CI**，依用户仅本地限制未触发，M2/M8保持进行中，未提交/推送/发布。下文保留各原记录时点的历史事实和缺口，不代表当前仍缺这些本地项。


计划：[lean-core.md](../lean-core.md)。最近更新：2026-10-02 11:01 +1000。状态：用户明确要求暂停，机器将重启；不继续运行任务，等待新对话恢复。代码基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，主仓master，未提交/推送/发布。实施进度2/8，M1/M3已完成；其余里程碑不因局部门通过提前记完成。

## 重启安全副本

全部当前载体与关键旧证据已用APFS clone复制至 `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002`（权限0700，位于仓库外）。[原路径→持久副本映射](/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/paths.json)记录18个目录。原/tmp、/var/folders临时路径可能重启消失；日志内原路径/PID是历史事实，不能拿ready.json或旧PID判活，也不能把当前hash改写为旧执行输入。

| 载体 | 持久副本 |
| --- | --- |
| 150完整源码/node_modules/out-build、未签名app/ZIP、冻结输入与日志 | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build150` |
| 150独立signed app/ZIP、notary/strict/spctl/staple与内容审计 | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/sign150` |
| SecretStorage三次实际quit、Reload与全部请求 | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/auth150` |
| 普通恢复6例与Mermaid已准备的profile | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/restore150` |
| 快捷键/完整native菜单/标题栏仅准备，尚未launch | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/ui150` |
| 149完整构建源/app/关键旧证据 | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build149` |
| 149 Mermaid真实32矩阵/交互/profile | `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/mermaid149` |

其余native149、icons150、external149、search-theme149、A11Y、ordinary、auth149以及Storage原红/真实IPC trace/原旧profile都在同根，按paths.json定位。两agent均已停止：普通恢复6个main/host全部正常quit/wait；GUI150和Mermaid150未启动，19560/19570无listener。主线程auth150与icon150正常quit0，签名runner exit0且临时keychain/P12已删，精确pre/post search list相同。浏览器测试tab未关闭。

## 已经完成的子项

- [150完整构建](M8-build150.json)：全254-prune prepare/compile/packing exit0，native全图noEmit exit0/0B；新增Storage回归7绿0红0skip，官方Electron六suite79绿0红及1个原有disabled developer clear。实际production graph与package退休项0。
- [真实SecretStorage150](M4-secret150-runtime.md)：原即时delete→get undefined→keys absent契约保持，两次删除、真实Reload、新host和三次实际退出重启均PASS；不用等待或retryget掩盖失败。[普通状态恢复](M6-storage150-regression.md)三类各冷启动/重启6/6PASS，普通tabs/SQLite精确保持。
- [149完整普通认证](M4-auth149-resume.md)、[四类完整A11Y](M4-accessibility149-resume.md)、[终端/剪贴板](M4-terminal-clipboard149-resume.md)、[内容搜索/第三方主题](M4-search-theme149-resume.md)通过；未受150代码影响的子项沿用其实际版本证据。
- [en/zh-CN/zh-TW/fr原生GUI](M2-native-gui149-resume.md)全通过，旧长path/参数解析/中文索引未就绪失败保留；[150 Finder/Dock/关于](M2-icons150.md)已由用户观察和native AX/截图确认。
- [四条外链余项](M5-external-links149-resume.md)补齐，加既有16条形成20条完整覆盖。第一条Kimi自动回执超时保留，用户地址与独立Chrome只读URL一致；后三条自动native回执。新helper加入click前exact URI tab-ID快照，避免旧tab冒充新tab。
- 150unsigned app 422,444,482 B / ZIP 157,532,426 B，比同条件基线下降20.01%/18.27%；[字节账](M8-artifact150.json)。signed app 421,985,960 B / ZIP 157,388,380 B，[新签名记录](M8-sign150.md)。strict/spctl/notary Accepted/staple与内容审计通过，不把旧149签名冒充150。

## 最小继续动作

1. 读计划恢复快照、git status及对应记录，核对当前dirty源码和150冻结生产输入。辅助fixture/GUI helper在build输入冻结后有改动，不能反写原冻结manifest。持久副本路径不同，重新创建短私有测试root并冻结新app/profile/PID/port；旧controller硬编码路径先按新载体改，不直接运行原旧请求。
2. 按[M6-ui150检查点](M6-ui150-resume.md)补真实Keyboard Shortcuts、完整native菜单与标题栏GUI。公共openGlobalKeybindings的第一个字符串可作query；用公共命令与限定PID/renderer，不全局typing/paste或切换用户IME。
3. 按[M6-storage150检查点](M6-storage150-regression.md)补Mermaid Editor+Preview的150真实quit/restart精确恢复；已准备但尚未启动，不重跑32图矩阵或普通6绿。
4. 对持久sign150目录的`VSLight-150-signed.zip`独立运行ZIP CRC并保存exit；用户暂停前未运行，不预填绿。unsigned ZIP CRC已exit0。
5. 汇总[剩余门](M8-remaining-gates.md)与替代验收覆盖、六产品文档和真实退出条件；仅全部退出项通过才更新完成。已绿且未受影响的项不默认重跑。

用户明确要求**停用dev/smoke.sh**，不运行或修改；拼音输入法下的模拟文本输入对比不能计验收。§9.2已明确由实际产物/CLI、真实扩展宿主及限定PID原生GUI逐项替代，保留原功能/负向与完整焦点标准。用户同时明确**仅本地实现和验收**：不提交/推送/触发现有CI或Release，不再次询问同一授权。当前输入双arch CI仍未验，M2/M8保持进行中；旧绿CI或暂存旧worktree不代表当前150输入。
