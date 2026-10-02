# M8 · 暂停时的剩余验收门

最终完成（2026-10-02 22:01 +1000）：**已完成，进度8/8**。用户明确取消x64/CI验收门、接受本地arm64结果；其余退出条件全通过，见[最终验收](M8-final-acceptance151.md)与[范围指示](M8-local-arm64-scope151.md)。当前输入/实际签名app及两ZIP复核一致，生产漂移0。未提交/推送/触发CI或发布。以下保留历史时点的未验CI/阻塞事实，已由最新指示解除。


最终更新（2026-10-02 21:38 +1000）：必要本地验收均已通过，进度6/8，M1/M3/M4/M5/M6/M7已完成。[151逐项覆盖与原始证据](M8-final-local-audit151.md)涵盖真实键盘/用户覆盖、四项完整A11Y、全注册/菜单、Cold/Reload及普通数据持久化；独立151签名公证/CRC全绿。**唯一未验门是当前输入arm64/x64 CI**，依用户仅本地限制未触发，M2/M8保持进行中，未提交/推送/发布。下文保留各原记录时点的历史事实和缺口，不代表当前仍缺这些本地项。


历史快照（以下包括当时的本地缺口）：

当前更新（2026-10-02 19:20 +1000）：[151终端补丁](M4-terminal-skip151.md)已真实全序重放，[完整build/全图noEmit/production图/实际包检查](M8-build151.md)通过；[新unsigned账/ZIP CRC](M8-artifact151.md)通过，app422,443,727B、ZIP157,530,299B。仅terminal.ts改变，其余5212源码项与冻结150相同。真实151注册表/schema、受影响普通terminal controls及独立签名链仍未验，旧150签名不替代151。150的13快捷键、public synthetic Beta偏好、实际主题CSS与精确禁用扩展显示已归档于[退出前证据](M8-ui150-before.md)，尚未经真实退出重启/SQLite保留验证。当前app46653/host47396由真实parent持有并保持打开，readonly AX仍trusted=false，等待用户手动添加当前会话codex CLI辅助功能；不操作TCC，不直接触发旧父controller的continue文件。150 Mermaid恢复与原签名/CRC/文档证据保持原来源。用户仅本地、停用smoke、无提交/推送/CI/Release的限制继续有效；当前两arch CI未验，进度2/8。下文保持历史快照，不作为151全部验收通过。



历史快照（以下包括当时的本地缺口）：



历史快照（以下包括当时的本地缺口）：



计划：[lean-core.md](../lean-core.md) §9.1–9.4/§10，最近更新：2026-10-02 11:01 +1000。用户要求暂停等待新对话，机器将重启。所有临时载体已保存，[续做入口](M8-next-session.md)为下一轮起点。进度2/8，不以局部绿代替整体退出。

| 验收门 | 当前证据 | 仍须做 |
| --- | --- | --- |
| V1图标/65关联/文件打开 | 150非icon字段与URLTypes一致；149三类文件/四语言GUI通过；150 Finder/Dock/关于用户观察、AX与截图通过 | 当前两arch CI属于M2前置，未验 |
| V2资源及普通图标 | 150实际包checker；149Explorer/terminal/第三方主题/Markdown/Mermaid实际图标通过 | 无新增资源缺口 |
| V3 Mermaid | 149真实32矩阵/33交互/quit-restart通过，preview下降27.86%，editor增量计入账 | 150Storage变动后双surface定向quit/restart未执行 |
| V4原生语言/工作台包 | en/zh-CN/zh-TW/fr四GUI和7资源选择通过；德语工作台及真实CLI语言包保留 | 当前两arch CI未验 |
| V5 Browser闭包与外链 | 150实际源码/包退休项0；旧opener配置保留；20条实际完整URI覆盖已齐 | 实际Keyboard Shortcuts、完整native菜单、标题栏GUI仅准备 |
| V6 AI/API/runtime | 145双权限89paths真实host及普通inline/Webview通过，API/protocol未变；149 cold/Welcome/Reload runtime所有分类退休0/main24/shared17/DI RPC0；150package/compile绿 | 150GUI走查/最终影响范围汇总 |
| V7编辑/文件/搜索/Git/终端/tasks/主题/市场/下载 | 149普通运行、真实内容搜索/One Dark Pro、Git/NPM/tasks及终端/公共paste通过；144市场装卸、138 Downloads真实1237B绿项按旧来源沿用 | 无需重跑未受影响子项，不称全部为150实测 |
| V7认证/secrets/Webview/profiling/A11Y | 149普通accounts16项和完整A11Y4项通过；150SecretStorage即时删除/Reload/三次quit重启通过；145Webview/profiling沿用 | 整体保留门汇总待续做 |
| V8重放/typecheck/compile/production/package | 150完整254-prune重放/compile/packing、native noEmit0B、实际production图/checker绿；旧三物理布局、helper幂等/失败注入、prune exit4绿，相关实现未变 | 79既有Electron测试中保留1个disabled developer clear，仅补充证据，不声称zero skip |
| V9旧profile/窗口/用户数据/CLI | 既有12类旧profile绿；150普通/混合/全退休3类各冷启动+重启6/6绿，SQLite精确；CLI两个拒绝exit1和显式chat文件绿项保留 | Mermaid150定向持久化未验；实际150GUI入口未验 |
| §9.2替代验收 | 用户停用smoke；实际CLI/产物、公共API/真实host、限定PID原生GUI替代，原负向/保留功能与完整焦点不削弱 | 最终逐项覆盖汇总尚未完成，不运行/修改smoke |
| V10同条件体积/Electron43.7.5/macOS12 | 150unsigned app 422,444,482 B / ZIP 157,532,426 B，下降20.01%/18.27%，1199文件；signed独立计量 | 已保存，不改旧149账 |
| V10签名/公证/staple/ZIP | 150独立strict/spctl/Accepted/staple/validate、signing内容审计与cleanup exit0，原始search list相同 | 最终signed ZIP独立CRC未运行；unsigned CRC已通过 |
| V10/M2/M8当前输入两arch CI | 用户明确仅本地，未提交/推送/dispatch/Release | 未验；不能用旧CI或本地build冒充，也不再次询问授权 |
| §9.4/六文档/最终结构 | 验收记录保存150真实结果与红例、重启安全载体映射；发布文档更新新字节/签名边界 | 恢复后补剩余结果并最终审查；不宣已发布或M8完成 |
