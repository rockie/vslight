# M4 · 普通终端与任务解绑

- 计划：[lean-core.md](../lean-core.md)，对应 M4 普通 consumer 解绑；输入清单为 [M1-runtime-inventory.md](M1-runtime-inventory.md) 和 [M1-api-inventory.md](M1-api-inventory.md)。
- 最近更新：2026-10-01 22:09 AEST（UTC+10）。
- 状态：独立补丁与允许范围内验证完成；全 src 类型检查仍红，等待主 agent 删除域外退休 consumer 并处理 telemetry。没有完成 M4 全图验收，也没有运行 M5/M6 实机 GUI。
- 交付：[120-light-terminal-tasks-consumers.patch](../../../patches/120-light-terminal-tasks-consumers.patch)，SHA256 `c89f164bc7d1a64ff52c4a466014eade294f06f78e859eb4ac707b16ebe60b16`。仅 26 个源码/专属测试文件，不含生成物或整目录删除。
- 基线：[dev/lean-core-baseline.env](../../../dev/lean-core-baseline.env) 所指 LEAN_BASELINE_ROOT 下 prepared+114 的 vscodium/vscode，来源 [M1-repaired-baseline-inputs.json](M1-repaired-baseline-inputs.json)。独立实现快照 `/tmp/term-b1lf660d`；原基线复现与补丁重放快照 `/tmp/tb-k57y48s4`。node_modules 是指向基线依赖的只读使用 symlink；out、日志、测试 crash 目录都在私有快照。未修改用户 vscode、基线源树/app、main/shared/API/protocol/prune/manifest/锁或其他 worker 补丁。

## 普通 consumer 枚举及处理

路径以下均相对于 vscode/src/vs；完整文件名单在补丁和 [changed120.json](/tmp/term-b1lf660d/changed120.json)。

| 普通入口/consumer | 退休关联及实现 | 普通行为 |
| --- | --- | --- |
| workbench/contrib/terminal/terminal.all.ts | 移除 chat、chatAgentTools、voice side effect imports | 其余 terminalContrib，包括 developer/profiling、accessibility、suggest 等仍加载 |
| terminal/terminalContribExports.ts | 去 Chat 命令/context key、tool autoApprove/output 与 AgentSandbox settings 导出及配置 spread | 普通 accessibility、restartPtyHost、stickyScroll、suggest 与 commandsToSkipShell 保留 |
| terminal/browser/terminal.contribution.ts | 去 AgentHostTerminalService singleton 注册/导入 | 普通 TerminalService、group/profile/instance 服务注册保留 |
| terminal/browser/terminalTabbedView.ts | 去 Chat 服务 DI、chat entry、隐藏工具终端事件/context、布局高度扣减和 drop target | 普通 tabs hide 条件、group/instance 监听、sash/width/orientation、DND、全高 layout 保留 |
| terminal/browser/terminal.ts | 删除 ITerminalChatService decorator 与 Chat progress/output/service、纯 AHP command source 契约 | 普通 TerminalService、EditingService、instance、group、Xterm 契约保留 |
| terminal/common/terminal.ts、terminalContextKey.ts、browser/terminalMenus.ts | 去 voice 命令/skipShell、dictation/context、Chat 隐藏终端条件与六个 voice menu 项 | 普通终端与任务菜单、focus/context、tabs inline actions 保留 |
| platform/terminal/common/terminal.ts、terminalPlatformConfiguration.ts、terminal/browser/terminalProfileResolverService.ts | 删除三平台 agentHostProfile settings、allowAgentHostShell 和解析分支 | 普通 default profile、automation profile、named/contributed profiles、fallback shell 路径保留 |
| terminal/browser/xterm/decorationAddon.ts、xtermTerminal.ts | 删除 Attach To Chat action、Chat picker/widget/instantiation DI、只用于 attachment 的 resource 参数；更新普通调用和测试 | 普通 decoration/hover、registered actions、copy、rerun、untrusted rerun 确认、visibility 保留 |
| terminalContrib/accessibility/browser/terminalAccessibilityHelp.ts | 去 speech/chat DI context imports 及 dictation 文案 | 普通 screen reader、shell integration、accessible buffer/help 内容保留 |
| terminalContrib/inlineHint/browser/terminal.initialHint.contribution.ts | 去 agent/entitlement DI 与 provider 事件。suggest hint 由普通 suggest setting 控制；aria 提示使用普通 Terminal verbosity | shell prompt/input 事件触发、hint dismissal、suggest keybinding/command 保留；替换四个 Chat provider 测试为三个真实 Xterm prompt 场景 |
| tasks/browser/abstractTaskService.ts、tasks/electron-browser/taskService.ts、tasks/common/tasks.ts | 去 Chat service/agent DI、Fix with AI 错误 action、ChatAgent run source 与仅用于该 source 的通知豁免 map | 普通 run/stop、shell/task profile、完成通知、错误详情写入 output 与 Show Output warning action 保留 |

TabsAllowAgentCliTitle/allowAgentCliTitle 仍用于第三方普通 CLI 的 escape sequence title；profile 菜单的第三方 extension/profile 排序也保留。这两处没有调用宿主 Chat/Agent service，也没有屏蔽外部扩展贡献的普通 profile。本补丁删除的是专属 allowAgentHostShell/profile 分支，没有保留空 adapter。

## 交给主 agent 的 prune 路径

下列 14 个路径已从实现私有快照物理删除来检查断链；补丁不携带这些整文件/目录删除。由主 agent 的统一 prune 处理，以下路径相对于 vscode：

```text
src/vs/workbench/contrib/terminalContrib/chat
src/vs/workbench/contrib/terminalContrib/chatAgentTools
src/vs/workbench/contrib/terminalContrib/voice
src/vs/workbench/contrib/terminal/browser/agentHostPty.ts
src/vs/workbench/contrib/terminal/browser/agentHostTerminalService.ts
src/vs/workbench/contrib/terminal/browser/agentHostOutputChannel.ts
src/vs/workbench/contrib/terminal/browser/ahpTerminalCommandSource.ts
src/vs/workbench/contrib/terminal/browser/terminalTabsChatEntry.ts
src/vs/workbench/contrib/terminal/browser/chatTerminalCommandMirror.ts
src/vs/workbench/contrib/terminal/test/browser/agentHostPty.test.ts
src/vs/workbench/contrib/terminal/test/browser/agentHostTerminalService.test.ts
src/vs/workbench/contrib/terminal/test/browser/ahpTerminalCommandSource.test.ts
src/vs/workbench/contrib/terminal/test/browser/chatTerminalCommandMirror.test.ts
src/vs/workbench/contrib/terminal/terminalContribChatExports.ts
```

机器可读列表：[removed120.json](/tmp/term-b1lf660d/removed120.json)。普通 custom pseudoterminal、PTY host、shell integration、task execution/termination 与 profiling 均未归入删除列表。

## 实际验证

以下实现命令的 cwd 为 `/tmp/term-b1lf660d`。使用上游 runner 的真实 Chromium headless DOM 和 Xterm，不启动 VSLight app 窗口。Node runner 为实际现有普通 suite。

```bash
node build/next/index.ts transpile
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/contrib/terminal/test/browser/xterm/decorationAddon.test.ts \
  --run src/vs/workbench/contrib/terminal/test/browser/xterm/xtermTerminal.test.ts \
  --run src/vs/workbench/contrib/terminal/test/browser/terminalInstance.test.ts \
  --run src/vs/workbench/contrib/terminal/test/browser/terminalProfileService.integrationTest.ts \
  --run src/vs/workbench/contrib/terminalContrib/inlineHint/test/browser/terminalInitialHint.test.ts \
  --run src/vs/workbench/contrib/tasks/test/browser/taskTerminalStatus.test.ts \
  > browser-targeted.log 2>&1
node test/unit/node/index.js \
  --run src/vs/workbench/contrib/terminal/test/node/terminalProfiles.test.ts \
  --run src/vs/workbench/contrib/tasks/test/common/taskConfiguration.test.ts \
  --run src/vs/workbench/contrib/tasks/test/common/problemMatcher.test.ts \
  --run src/vs/workbench/contrib/tasks/test/common/problemCollectors.test.ts \
  > node-targeted.log 2>&1
```

转译 exit 0。第一轮 Chromium **124 passing / 2 pending / 7 failing**、exit 1；[日志](/tmp/term-b1lf660d/browser-targeted.log)。通过项包括普通 decorations/Xterm、terminal label/CLI title、三个不依赖 Chat provider 的 initial hint 场景与 task terminal status。pending 是原 suite 跳过项，没有算作通过。Node **89 passing / 5 pending**、exit 0；[日志](/tmp/term-b1lf660d/node-targeted.log)。这些测试不能替代实机 shell 输出、task stop 的 M5/M6 宿主 fixture。

七个失败均为 TerminalProfileService.integrationTest 测试替身缺少 getRegisteredBackends，在 114 新增 web guard 下抛 TypeError。另用未修改 prepared+114 的独立快照 `/tmp/tb-k57y48s4` 执行转译和同一 profile runner，得到 **5 passing / 7 failing**、exit 1；[基线日志](/tmp/tb-k57y48s4/profile-baseline.log)。已复现原基线缺陷，随后只补专属 TestTerminalInstanceService 的 backend 枚举，使枚举/getBackend 复用相同普通 backend fixture；产品 TerminalProfileService 无改动。

补齐 fixture 并更新 accessibility buffer 的 Xterm constructor 参数后，只重跑受影响 suite：

```bash
node build/next/index.ts transpile
node test/unit/browser/index.js --browser chromium \
  --run src/vs/workbench/contrib/terminal/test/browser/terminalProfileService.integrationTest.ts \
  --run src/vs/workbench/contrib/terminalContrib/accessibility/test/browser/bufferContentTracker.test.ts \
  > browser-followup.log 2>&1
```

**19 passing**、exit 0；[日志](/tmp/term-b1lf660d/browser-followup.log)。最后清理 initial hint 的冗余 disposable holder 后，仅重跑该三个 prompt 测试：**3 passing**、exit 0；[日志](/tmp/term-b1lf660d/initial-hint-final.log)。没有重复已经绿色的普通大 suite。

补丁 apply check 与实际重放在上述第二个私有快照执行；原基线复现发生在重放之前。git apply --check、git apply 均 exit 0，重放后 26 个修改文件逐字节等于实现快照。补丁不包含专属退休目录删除，集成时需配合统一 prune。

## 全图检查与待收口边界

```bash
node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit \
  > full-tsc-final.log 2>&1
```

实际 exit 1，**79 条诊断，18 个文件**；[完整日志](/tmp/term-b1lf660d/full-tsc-final.log)。允许的 platform/terminal、workbench terminal/terminalContrib/tasks/services/terminal 范围内为 **0 条诊断**。首次检查有一个普通 buffer test 参数错误和七个 theme JSON 缺失；已更新该调用，并从基线复制普通 theme JSON 资源到私有快照，最终检查没有这两类错误。

| 仍红的位置 | 诊断数 | 主 agent 收口方向 |
| --- | ---: | --- |
| sessions/contrib/providers/remoteAgentHost 两文件 | 5 | 退休 AgentHostTerminalService 的 import 与派生 implicit-any |
| sessions/contrib/terminal 四源码/测试文件 | 10 | 退休 AgentHostTerminalService；runner/subclass 的派生类型错误 |
| workbench/contrib/chat 十个源码/测试文件 | 61 | 退休 ITerminalChatService、IChatTerminalOutputSource、IAhpTerminalCommandSource、wrapper imports、Chat menu/export、agent profile settings 与 allowAgentHostShell；无需恢复接口 |
| workbench/contrib/telemetry/browser/telemetry.contribution.ts | 2 | 删除 OutputLocation、AgentSandboxEnabled 的 AI settings telemetry references |
| workbench/test/browser/componentFixtures/chat/chatQuestionCarousel.fixture.ts | 1 | 删除退休 Chat fixture 对 ITerminalChatService 的引用 |

这些是当前未统一 prune 的实际 closure errors，不能据此称全图通过。不存在本次新增的普通接口 fallback 或保留 AgentHost allow flag。最终 app 的 terminal shell output、普通 profiles/tabs/layout、task run/stop/error Show Output、accessibility 仍需主 agent 在 M5/M6 真实宿主/GUI 环境验收；本记录没有声称这些操作已在实机跑过。
