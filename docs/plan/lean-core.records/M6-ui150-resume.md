# M6/V5/V6 · 150 GUI走查暂停检查点

计划：[lean-core.md](../lean-core.md) V5/V6、§9.2、M6/M8。保存时间：2026-10-02 10:53 +1000。状态：`PAUSED_BEFORE_APP_LAUNCH`。用户明确要求立即暂停、保存进度并重启机器，本轮未启动150应用，未取得实际GUI结果，没有新增通过项。

[JSON检查点](M6-ui150-resume.json)保存准备输入、四个关键app文件指纹、私有验证文件指纹、未执行项和清理状态。此前[149注册表证据](M6-runtime149.md)和[149搜索/主题补验](M4-search-theme149-resume.md)保留原来源，不改标为150的实际GUI证据。

## 已完成准备

私有根为 `/private/tmp/ui150-l8chxb3s`，仅准备独立 `u/e/s/w`、开发扩展目录和evidence目录。目标为 `/private/tmp/lean-core-build150-z3fs7f_q/vscodium/VSCode-darwin-arm64/VSLight.app`。已复制当前 ordinary 夹具到私有ext，未修改共享fixture；已冻结目标 executable/main/shared/workbench 指纹和现有 registry helper 指纹。

实际150构建树源码确认公开命令 `workbench.action.openGlobalKeybindings` 接受首个字符串参数作为初始查询，再调用真实Keyboard Shortcuts编辑器的search方法。证据为 [preferences.contribution.ts](/private/tmp/lean-core-build150-z3fs7f_q/vscodium/vscode/src/vs/workbench/contrib/preferences/browser/preferences.contribution.ts:895) 与 [preferencesService.ts](/private/tmp/lean-core-build150-z3fs7f_q/vscodium/vscode/src/vs/workbench/services/preferences/browser/preferencesService.ts:364)。这只是执行方式的源码依据，还没有命令调用或GUI结果。

已复制149来源分类的1375个command候选、57条动态producer分类及普通引用例外，供新150实际注册表对照。私有 [menu-readonly.m](/private/tmp/ui150-l8chxb3s/menu-readonly.m)已写入，只实现限定PID的AXMenuBar/AXChildren属性递归读取；尚未编译或执行。150控制器和CDP走查helper尚未创建。

## 清理状态与待续项

本轮 main/host PID均为空，没有启动任何150进程，没有连接CDP，没有需要quit的自有应用。保存检查点时，19560监听检查无输出、exit1，表示端口无监听。上一轮149搜索/主题实例已正常退出并释放端口，本轮未重开。

恢复后只需续做以下缺口，不重跑搜索或主题：

1. 核对或重建私有目录及150产物身份，完成私有controller/CDP helper与只读AX helper。重启后临时目录是否保留需重新检查，不能假设其存在。
2. 启动独立150实例，用真实父进程持有并wait；核对自身PID、profile、19560监听者和实际已加载workbench源指纹。
3. 对该实际runtime运行既有registry helper，复用退休候选与动态来源分类，保留普通例外。
4. 以公共命令字符串参数查询真实Keyboard Shortcuts的Browser/Chat等退休族及普通正向控制；读实际DOM/AX输入值、结果总数和command IDs，与注册表交叉核对。不能把普通标题栏截图当作快捷键负向，也不能按词误删合法市场分类或开发者入口。
5. 只读递归完整自有PID原生菜单，捕获标题栏普通按钮及无Browser/Chat入口的实际DOM；保存原始树和截图。
6. 公共quit、真实父wait、PID/端口释放检查、关键app前后指纹和DI/RPC日志核对，再按实际结果记录通过或失败。

本次没有修改生产补丁、根计划、共享fixture或smoke，没有操作用户vscode生成树、已安装app或浏览器资源，没有CI动作。暂停后未新增任何UI操作。续做请求为：用户明确恢复后，在原隔离约束下完成上述150实际GUI检查。
