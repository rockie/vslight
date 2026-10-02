# M4/M6 · ordinary Welcome与退休注册项修复

142恢复普通Welcome、Accessibility walkthrough和Interactive Editor Playground，同时删除真实退休菜单、旧AI设置说明和Editor Help的退休Debug文案。候选全量类型检查通过，已进入主线程144完整构建；最终app的普通Welcome及媒体/链接/焦点验收尚待执行。

## 红证据

[正式138运行枚举](M6-runtime-registries.md) 证明 walkthrough descriptor/instance/step全为0，但workbench.action.getStartedWithAccessibilityFeatures仍注册，调用的workbench.action.openWalkthrough不存在。95曾删普通GettingStarted和welcomeWalkthrough入口，98又删整组Welcome媒体copy；仅隐藏Help action不能满足计划§5.4普通引导保留要求。

同次真实菜单枚举还发现15项退休Chat/InlineChat context注册；两项普通settings schema仍提MCP/agent sessions。[四项真实可访问性](M4-accessibility.md) 行为已经通过，Editor Help却无条件包含Start Debugging、Inline Breakpoint、Execute Selection、Add to Watch帮助文字。142按红证据清理这些入边，并保留普通编辑器、终端及可访问性路径。

## 独立候选

- 补丁：[142-light-ordinary-welcome-registry.patch](../../../patches/142-light-ordinary-welcome-registry.patch)，14文件，43 additions /142 deletions。
- 私有源码：`/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-welcome142-sjvrnv51/vscode`，指针 `/tmp/lean-welcome142-path`。不改共享prune、既有95/98/121/129补丁或用户生成树；入口与构建媒体copy仅为候选diff，主线程应用。

| 补丁中对应文件 | 处理 |
| --- | --- |
| files/browser、files/electron-browser 两个 fileActions.contribution | 删退休Chat attachment/anchor菜单的普通open/copy/reveal/Finder入边 |
| codeActionCommands | 去InlineChatEditorAffordance QuickFix入边及未用MenuId import，普通QuickFix保留 |
| extensions.contribution、workbench.contribution、layout、themeMainServiceImpl | 清退休MCP/agent说明与启动布局override，普通sidebar/theme行为保持 |
| editorAccessibilityHelp、standaloneStrings | 删4项Debug帮助与唯一消费者对应字符串，普通Editor Help保留 |
| gettingStartedContent | 删退休Remote/Debug入口，修Go to Symbol目标，普通settings替代死sync链接；增普通editor playground步骤，保留terminal/tasks/Git/theme/accessibility引导 |
| gettingStarted.contribution、gettingStartedService | 清旧agent专属注释与walkthrough自动打开的agent启动分支；121/129已撤的AI DI不恢复 |
| workbench.common.main | 恢复ordinary GettingStarted和welcomeWalkthrough contribution，不恢复agent sessions Welcome |
| build/gulpfile.vscode | 恢复14个普通SVG与4个主题PNG的精确copy，共1,158,107 source bytes；不恢复AI/Debug媒体 |

普通GettingStarted入口闭包由 contribution、service、page、common content及普通editor/input/context/provider实现组成；welcomeWalkthrough贡献恢复真实editor playground action及其内容provider。Playground内容来自bundle中的普通TS，不需要额外物理Markdown资源。build/next的既有Welcome SVG/PNG规则已覆盖；现有light prune只删退休Welcome媒体，142不需另改prune。

## 验证与回归步骤

| 检查 | 实际结果 |
| --- | --- |
| parent私有源码 `git apply --check` | exit0；共享源码未由本worker apply |
| private全源码 native `tsc -p src/tsconfig.json --noEmit` | 最终exit0，typecheck-final.log为空；保留完整actor校验 |
| GettingStarted候选内容与入边检查 | 无Chat/agent/MCP/speech专属内容或Debug命令；普通module/媒体保留由精确diff列出 |
| 最终144 app | 已包含142并由主线程完整prepare/compile/packing通过；[TODO] ordinary Welcome/媒体加载/链接/焦点尚未实机通过 |

最终app须枚举全部walkthrough collections/steps（包括context不可见项），确认ordinary Accessibility/Beginner内容注册、退休item与链接为0；打开Welcome与Keyboard Shortcuts查看实际内容。Help的Get Started with Accessibility Features要真正打开普通引导；打开editor playground并验证普通编辑/选择/导航，检查18媒体文件实际存在且加载无错误。再执行Editor Help的DOM/AX与关闭后焦点验收，确认4条退休Debug帮助消失；沿用未受影响的终端/hover绿项，不拿去掉Help action代替普通功能恢复。
