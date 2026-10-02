# M8 · 150 完整原生菜单、Welcome 与标题栏

状态：本轮实际原生菜单与 Welcome/标题栏子门通过，未据此标 M8 或 151 完整验收完成。实际主进程 46653、host47396、父控制器46652仍在运行；原观察窗口保持打开。机器证据：[M8-native150-actual.json](M8-native150-actual.json)，原生树、DOM 与已查看的截图保存在 M8-native150-actual.evidence。

用户指出 Codex CLI 从 Ghostty 启动，并为 Ghostty 开启辅助功能。此后同一只读 helper 由 trusted=false/AX 错误变为真实 exit0、trusted=true、menuBarError=0、421节点。此前仅根据 CLI 可执行文件路径要求添加 codex，不能证明系统权限归属；本会话的实际变化确认 Ghostty 授权解决读取问题，未修改 TCC 或自动点击授权。

完整 AXMenuBar 包含 Apple、VSLight、File、Edit、Selection、View、Go、Terminal、Window、Help，含递归子菜单与隐藏/disabled 项；节点数远低于 helper 的3000上限。退休专属标题 Chat/MCP/Speech/Dictation/Integrated Browser/Simple Browser/Agent Sessions/Copilot 匹配0；普通 File/Edit/View/Terminal/Help正控齐。第二次只读采集同样真实exit0，完整原始树有独立哈希，不以仅顶部标签代替递归检查。

经公共 workbench.action.openWalkthrough 打开实际 Welcome：容器1092×794，Start、New File/Open/Clone Git Repository、两类普通Walkthrough与Announcements可见；退休文字0。标题栏1440×35，普通Back/Forward、布局及侧栏/Panel开关保持，退休入口0。实际截图已查看：主题、图标和文字清晰，布局没有异常裁剪，当前扩展禁用列表与普通tabs正常。

151主进程代码、菜单实现与这些UI源码未变化（151仅terminal.ts的24条过滤默认项变化），但新packaged registry/schema和真实终端controls还须由151实际进程验收；账户偏好、主题和扩展状态仍须真实退出/新host重启及SQLite/file保留验证。151签名子门另见[M8-sign151](M8-sign151.md)，本地独立载体见[M8-local151-carriers.json](M8-local151-carriers.json)。当前两arch CI按用户仅本地限制未验，未运行或修改smoke、未提交/推送/发布。
