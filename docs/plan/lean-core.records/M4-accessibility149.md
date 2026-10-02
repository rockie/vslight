# 149 普通可访问性：真实内容子项与原生焦点阻挡

2026-10-02（Australia/Sydney）。最终149（147 +148 +149）在全新独立profile中完成四项真实DOM/Chromium AX内容、可见性、限定目标Escape关闭和逻辑控件恢复验证；Editor Help完整内容的退休文字计数0。系统全程锁屏且app未在前台，四项完整原生焦点门均保持blocked，未替代 [138完整焦点证据](M4-accessibility.md)，未将§9.3(7)/V7/M4/M8标为全部通过。完整对象见 [M4-accessibility149.json](M4-accessibility149.json)。

## 真实来源和身份

证据根 `/private/tmp/av149-ir9ah1br`，发现指针 `/tmp/lean-accessibility149-path`；主PID3740，实际宿主5123/API1.135.0，CDP只绑定127.0.0.1:19540。user-data、extensions、shared-data、workspace和extension-development目录全为该根的私有u/e/s/w/ext。使用正式149独立app，通过 `open -g -n` 后台启动；没有app激活或全局输入。

复用冻结 [accessibility.js](../../../dev/test-fixtures/lean-core/accessibility.js)，仓库文件和实际宿主副本SHA-256都为 `e76a854510114d61385ff6e648c63075730a11e87ca89b7f39a7f6268c3c9842`，未改fixture、hover provider或生产源码。Manifest为lean-private.lean-accessibility149、engines.vscode=`^1.130.0`、activationEvent=`*`。私有终端profile显式使用 `/bin/sh -f`；未更改全局shell偏好。

私有controller位于 `/private/tmp/av149-ir9ah1br/capture-driver.mjs`，只读原生窗口探针位于同根window-state.swift。每次HTTP前核对真实CFBundleExecutable、主PID、精确profile/19540参数、listener owner、fixture和预读app hash、实际host身份。只连接19540经验证的own workbench target，Debugger getScriptSource验证实际已经加载的workbench SHA-256为 `ca30c3f30a81950153d7d9b433d32c4c78f3099bbfbef254b386088ed6786e97`；末尾再次核对全部权威身份。

首次输入前读取实际document.hasFocus=false。限定PID的只读AppKit/AX结果：locked=true、onConsole=false、appActive=false、AXWindowsStatus0、AXWindowCount1。没有通过activating、Page.bringToFront、FocusEmulation或全局键盘纠正这些状态。

## 最后有效一轮的四项实证

每项由冻结fixture实际执行普通命令后，读取DOM `.accessible-view` 和 Chromium Accessibility.getFullAXTree的textbox真实value；再向已验证ownrenderer target发送可信Escape rawKeyDown/keyUp，复读DOM尺寸和document.activeElement。fixture的response PASS只表示命令完成，不用它代替行为验收。

| 动作 | 实际内容 | DOM/AX内容与可见性 | Escape与逻辑恢复 | 完整原生焦点门 |
|---|---|---|---|---|
| terminal-view | A11Y_TERMINAL_MARKER | 子项PASS | view关闭，回xterm textarea | BLOCKED |
| terminal-help | Focus Accessible Terminal View | 子项PASS | view关闭，回xterm textarea | BLOCKED |
| editor-help | You are in a code editor | 子项PASS | view关闭，回editor | BLOCKED |
| hover-view | A11Y_HOVER_MARKER | 子项PASS | view关闭，回hover row | BLOCKED |

四个原始行文件分别为根下evidence/terminal-view、terminal-help、editor-help、hover-view的JSON；完整值、原始DOM文本/尺寸、AX textbox属性、actualTargetId、Escape后状态和每项只读原生状态均附在总JSON。DOM渲染中的NBSP仅在匹配自然语言marker时转换为空格；原始DOM与AX值保留，未由DOM内容伪造AX。

Editor Help来自正确editor provider，完整AX值包含You are in a code editor，实际Debug/Debugger/Debugging/Chat/Copilot/Notebook/Jupyter/MCP/Agent词边界扫描0；四项完整AX内容均非空且同一扫描0。根下evidence/editor-help.json保留完整实际内容，不能以空字符串零命中充当退休文字通过。

Escape确实使view的实际width/height变为0，并恢复对应DOM逻辑控件。可信CDP目标输入后document.hasFocus变true，但所有原生复读仍locked=true/onConsole=false/appActive=false。因此不把Chromium逻辑焦点等同于系统前台焦点；完整门同时要求实际原生前台、解锁以及DOM/AX可见性、Escape关闭和返回，四项全部blocked。

## 两轮失败与私有配置

首轮保留在 `/private/tmp/av149-ir9ah1br/first-round/summary.json`。该私有profile当时未启用屏幕阅读器优化，AX textbox提示editor不可访问且不提供内容value，首个terminal-view也未可见；未将这些空内容、零退休匹配或fixture response计为PASS。

只在该新私有profile把editor.accessibilitySupport设为on，未改真实用户全局偏好或provider。第二轮实际AX内容可读，但首轮hover-view Escape正确返回hover后遗留打开的hover；下一次editor-help选择到hover Help，实际值是A11Y_HOVER_MARKER而非You are in a code editor。该行失败保留在 `/private/tmp/av149-ir9ah1br/second-round/editor-help.json`，没有将错误provider当editor内容。

最终一轮先发送额外一次限定ownrenderer的真实Escape关闭遗留hover，实际context-reset保存在根下evidence/context-reset.json；再跑四项。配置on只使真实AX内容可读，没有弱化全局焦点、可见性或Escape返回断言。三份controller版本和前两轮数据都保留在私有根，冻结fixture仍逐字相同。

## 日志、清理与未完入口

[日志计数](/private/tmp/av149-ir9ah1br/evidence/log-counts.json) 保存此独立profile文本logs的当次bytes/hash和六类DI/RPC计数，Unknown service、Missing proxy、customer/actor初始化、Unknown channel、缺RPC method、RPC protocol均0。error0，保留5条warning：Git两字段和markdown.math.macros共3条resource-scoped configuration缺resource；1条/bin/sh -f不能启用shell integration；1条私有extensions manifest重复创建file already exists。没有声称所有级别0，也没有删除warning。

冻结fixture实际接收唯一quit请求并执行workbench.action.quit，主PID3740正常退出，19540已无listener，见 [cleanup.json](/private/tmp/av149-ir9ah1br/cleanup.json)。不退出主线程91720 app、不触认证19480或其请求、不读取真实账户和token。普通新根配置与证据保留供复核。

[TODO] 解锁后在全新同类独立profile、实际ownapp前台上重新执行四项完整门，保留真实document.hasFocus、原生appActive/console状态、DOM/AX内容和尺寸、可信Escape及各自返回控件。仍使用冻结fixture，不用focus emulation、synthetic状态、降低可见性断言或本次逻辑焦点替代系统焦点。若获得允许实际前台的运行上下文，再按原138严格方式验证；本次不自行抢焦点。
