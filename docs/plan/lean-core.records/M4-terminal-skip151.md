# M4 · Terminal skip-shell 151 退休命令入边

计划：[lean-core.md](../lean-core.md) §5.4、M4/M6。记录时间：2026-10-02 08:34:28 UTC。状态：151 最小补丁、隔离应用/回退、实际源码模块载入通过；新完整构建与真实 151 应用注册表验收待集成人完成，M4/M6 不据此记完成。机器证据：[M4-terminal-skip151.json](M4-terminal-skip151.json)。

实际 150 注册表 `/private/tmp/lcfinal-chkarkup/ui/evidence/registry-active/registries.json` 的 `/configurations/46/properties/terminal.integrated.commandsToSkipShell` 描述仍列出 14 条 `sessions.*` / `sessionsViewPane.*` 和 10 条 `workbench.action.debug.*`。该设置的 schema `default` 是空数组；真正的内置默认集合由 `DEFAULT_COMMANDS_TO_SKIP_SHELL` 提供。退休服务实体为零不能证明这条保留终端消费者入边已删除。

根因经 debugging 四阶段核对：只读最终 150 源码 `src/vs/workbench/contrib/terminal/common/terminal.ts:499` 的默认集合仍含 594–617 行这 24 个字符串。`terminalConfiguration.ts:426` 从这个集合生成设置说明；`browser/terminalConfigurationService.ts:25,64–76` 从相同集合构造实际 Set，再处理用户追加或 `-command` 删除；`browser/terminalInstance.ts:1167` 在键盘分发时调用 `shouldCommandSkipShell`。因此共同来源需要删除这些退休 ID。

[151 补丁](../../../patches/151-light-terminal-retired-command-filters.patch) 以只读 `/Users/rockie/Documents/gh-xgent/lean-core-resume-20261002/build150/vscodium/vscode` 中最终 150 `terminal.ts` 为 preimage，顺序在 150 之后。只删除连续 24 行，新增 0 行，涉及 1 个文件；普通 editor、terminal、tasks、Accessibility Help 和 terminal contribution 展开保持。用户覆盖代码和第三方命令追加代码完整保留，用户主动配置的命令仍按既有规则处理。

| 冻结项 | SHA-256 |
| --- | --- |
| 151 补丁 | `92282c3d51a074371264fdf60232207d1ecfffe10190d006d851b126a81fc77b` |
| 最终 150 terminal.ts | `77a81b4db4b04ea8e897ab9a2ab877136c67bb274b82f8c1a3faa98daa907baf` |
| 应用 151 后 terminal.ts | `5fd803f6451e977bb288b9aaab35b93a27661ca581ecea9fdc0a45184d482deb` |

隔离证据根为 `/private/tmp/lc-terminal-skip151-_htr6feg`。`load-terminal.cjs` 使用已有 TypeScript `transpileModule`，通过 CommonJS 载入完整真实 `terminal.ts`、`terminalConfiguration.ts` 与 81 个实际源码模块；候选只在载入目标 `terminal.ts` 时读取隔离补丁副本，其余依赖读取最终 150 源码。没有空服务或重写 skip-shell 算法。真实配置注册函数的 font-snippet callback 返回 `Promise.resolve([])`，该回调只填字体片段，与 skip-shell 规则无关。

| 检查 | 实际结果 |
| --- | --- |
| 缺陷重现 | 150 实际载入默认集合 168 条，24 条退休 ID 仍存在 |
| 候选实际载入 | 151 默认集合 144 条，24 条退休 ID 全部消失 |
| 全量集合差异 | 新集合恰好等于旧集合删除这 24 条；无新增、无其它缺失；81 个载入模块中只有 terminal.ts 哈希改变 |
| 普通 controls | Quick Open、nextEditor、terminal copy/paste/new、tasks.runTask、editor Accessibility Help、terminal accessible buffer 和 terminal suggest 均保留；全部其它 144 条也逐项比较 |
| 实际 schema 注册 | 150 源码注册生成的 markdownDescription 与 live150 捕获逐字一致；151 描述恰好删除 24 个命令行，其余字段与空数组 default 保持 |
| 应用和回退 | `git apply --check`、apply、reverse check、reverse 均 exit0、无输出；应用后符合候选哈希，回退后与只读 150 源字节完全一致 |

`before.json`、`after.json` 保留实际常量、schema 与全部载入模块哈希；`verification.json` 保留四步补丁操作及完整集合比较，`schema-verification.json` 冻结原 live150 注册表、audit、identity、summary 的哈希。上述结果已汇入仓库 JSON 记录；临时 runner 和输出哈希一并冻结。

本次没有执行类型检查或打包构建，也没有启动 GUI，因此实际源码执行不能代替真实应用键盘分发验收。集成人仍需在新隔离树重放完整补丁序列至 151、完成全图类型检查/构建，冻结新应用及 workbench 身份并重新捕获实际注册表，核对这 24 条 ID 从设置说明/内置默认列表消失，普通终端与任务、编辑器和可访问性 controls 以及用户/第三方覆盖继续符合既有行为。本 worker 未改用户生成树、持久 build150 或已安装应用，未运行 smoke，未清理用户数据，未 commit/push/CI。
