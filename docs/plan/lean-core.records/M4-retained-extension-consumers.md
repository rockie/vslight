# M4 · 保留扩展的退休 API 消费者

- 对应 [lean-core.md](../lean-core.md) §5.4 / V7 / M4。状态：143 候选、隔离模块验证和重放通过；正式 app 的真实 Git 宿主与 SCM 交互待主线程验收，M4 未完成。
- root 基线为 dirty@`f1961b7546139a6aa722ff0b8a001296d3041e33`。私有输入复制自 `/tmp/lean-core-api-5_lg434f/vscode/extensions/git`，已包含 118/127 的严格退休 API；没有把 getter 改为 false。
- 本次只增加 [143-light-retained-extension-consumers.patch](../../../patches/143-light-retained-extension-consumers.patch) 和本记录。补丁改变 Git 的十个文件，并按主线程授权删除共享 `scmHistoryProvider` 声明中的两个 Chat resolver；其他普通 history 成员保留。
- 私有根为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr`，指针为 `/tmp/lean-core-retained-extensions-path`。依赖沿用只读 symlink；用户 `vscode/` 生成树、主私有源码和正式源码均未写入。没有启动 GUI、安装依赖、提交、推送或发布。

## 实际失败与根因

正式 138 的实际日志 [Git.log](/private/tmp/ordinary138b-3n3pk6ty/u/logs/20261002T014430/window1/exthost/vscode.git/Git.log) 在 `01:44:32.143` 显示 `git rev-parse --show-toplevel` 已成功取得仓库路径，随后 `Model.openRepository` 因 `workspace.isAgentSessionsWorkspace is unavailable in this product.` 失败，扫描结果为 repositories (0)。重复打开仍得到同一错误。日志原件 SHA256 为 `870349ce731bc484342c5c0692be43ec8d5ba76736602e9dd14e1e847e063aff`，已复制到私有根的 `formal138-Git.log`。

[extHost.api.impl.ts](/tmp/lean-core-api-5_lg434f/vscode/src/vs/workbench/api/common/extHost.api.impl.ts:1093) 的严格 getter 仍调用 `disabledAi.unavailable('workspace.isAgentSessionsWorkspace')`。普通 Git 的 [Model.openRepository](/tmp/lean-core-api-5_lg434f/vscode/extensions/git/src/model.ts:634) 主动调用 `isRepositoryOutsideWorkspace`，后者在普通目录判断前读取该退休 getter。Git 自身的文件系统、progress、artifact 和 Repository 构造路径也有同类读取。

143 删除这些 Agent 专属入口，让普通路径直接执行原有工作区、worktree、submodule 和配置逻辑。没有恢复 Agent API，也没有用 try/catch 隐藏严格 getter 的失败。

## 删除范围与保留行为

| 改变 | 普通功能保留情况 |
| --- | --- |
| model / fileSystemProvider 去掉 Agent 工作区分支 | 保留工作区内、工作区外、worktree 和空窗口判断；git URI 在空窗口仍可打开仓库 |
| Repository / ProgressManager 去掉 Agent 分支 | 保留普通 parent SCM 关系、worktree 图标、commit 输入状态与 `git.showProgress` 配置 |
| artifactProvider / icons / util 删除 Copilot worktree 特例 | 保留 branches、stashes、tags、worktrees 四组；worktree 不再使用 Chat 图标或被 Agent 条件隐藏 |
| add / commit / revert / restore / clean / checkout / reset 清理退休命令 | 保留实际 Git 操作、普通 diff 编辑器关闭、commit 输入重置和 post-commit 执行 |
| 删除 AI co-author 生成器和设置 | 原提交消息直接交给 Git；普通已有 author/trailer 解析保持原样 |
| historyProvider 删除两个 Chat context resolver | 保留普通 history refs、items、changes、resolveHistoryItem 和 common ancestor |
| package / nls / tsconfig 删除 Agent proposal、九个 agentsWindow override 和 AI co-author 配置 | 普通 Git 设置的默认值保持原值；保留所需普通 API proposals |
| [scmHistoryProvider 声明](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/vscode/src/vscode-dts/vscode.proposed.scmHistoryProvider.d.ts) 删除两个必需 Chat resolver 声明 | 与实际普通实现保持一致；接口其他成员没有改变 |

生产 Git 源码中不再有 `isAgentSessionsWorkspace`、`isAgentSessionsWindow`、`agentSessions`、`agentsWindow`、`_chat.*`、`_aiEdits.*`、AI co-author 或 Chat history 命令分支。对 Agent/Copilot/Chat/AI 的全文搜索只剩 Git HTTP `userAgent` 字段。既有测试里普通 trailer 解析的 Copilot 字符串是输入数据，不是主动消费者，未删除。

## 红例与验证边界

私有 [build-test.mjs](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/build-test.mjs) 分别打包未改的 `baseline-git` 和修复后的真实 Git 源码。唯一测试导出改动是导出原有 `ProgressManager` 类，类的实现没有改变。[test-git-modules.cjs](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/test-git-modules.cjs) 使用普通 VS Code API doubles；退休 getter 永远抛错，退休命令调用也抛错。stage、commit、diff 和 hard reset 执行实际 `/usr/bin/git`，只修改新建的私有仓库。

| 实际模块检查 | 未改输入 | 143 后 |
| --- | --- | --- |
| 普通 repository 范围判断 | 退休 getter 抛错 | PASS |
| progress 配置与 commit 输入状态 | 退休 getter 抛错 | PASS |
| artifact 四组初始化 | 退休 getter 抛错 | PASS |
| git 文件内容的空窗口/工作区行为 | 退休 getter 抛错 | PASS |
| 前端 add 暂存实际文件 | 调用退休 Chat 命令 | PASS |
| 后端实际 commit 与 diff | PASS | PASS |
| 前端实际 commit、消息、输入清理和 post-commit | 清理调用退休 Chat 命令 | PASS |
| 前端实际 hard reset | 调用退休 AI 命令 | PASS |
| commit cleanup 关闭 diff 并重置输入 | 调用退休 Chat 命令 | PASS |
| 合计 | 1 PASS / 8 FAIL | 9 PASS / 0 FAIL |

红例读取严格 getter 四次，并记录三个 `_chat.editSessions.accept` 和一个 `_aiEdits.clearAllAiContributions` 调用；绿例 getter 读取和退休命令调用均为 0。测试覆盖实际模块与 Git 后端，未覆盖完整宿主生命周期、SCM UI、UI operation 锁或 extension API 的真实注册，不能代替正式 app 验收。

## 其他保留扩展审计

从正式 app 的实际 extension package 清单选取有 `main` 或 `browser` 的 25 个保留内置扩展。[audit-retained.mjs](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/audit-retained.mjs) 扫描它们的 722 个生产 TS/JS 文件，以主私有 API 实现的 `disabledAi.unavailable/Async` 字符串为退休成员集合，解析 `vscode` import / require alias 的属性与字符串索引访问，并检查退休命令字符串。6973 个 API 表达式中退休消费者命中 0；无需改变其他扩展。测试、依赖和生成输出未纳入静态结果；动态拼接及反射调用仍须由真实宿主验收。

清单：configuration-editing、css-language-features、emmet、extension-editing、git、git-base、github、github-authentication、grunt、gulp、html-language-features、jake、json-language-features、markdown-language-features、markdown-math、media-preview、merge-conflict、mermaid-markdown-features、microsoft-authentication、npm、php-language-features、references-view、search-result、terminal-suggest、typescript-language-features。

## 可重放结果

143 SHA256：`20e3b99b9805a8a98e14f90bc04e69904bcec61e006759fa55f593a5b98f41d4`。路径为 `a/extensions/...` 和授权的 `a/src/vscode-dts/...`，与 prepare 在 `vscode/` 目录执行 `git apply` 一致。

| 检查 | 结果 |
| --- | --- |
| 主私有 `/tmp/lean-core-api-5_lg434f/vscode` apply --check | exit 0；只读检查 |
| 正式 final 源码的 `vscodium/vscode` apply --check | exit 0；只读检查 |
| 私有未改文件 → 143 独立重放 | check/apply 均 exit 0；11 个改变文件逐字节等于私有 final |
| Git TS noEmit，含两个 Chat 声明删除 | exit 0 |
| Git 普通 esbuild | exit 0；main/askpass/git-editor 输出均生成 |

正式 final 检查目录为 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev/vscodium/vscode`。私有编译为补全缺失的 test runner 声明复制了原始 [testrunner.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/vscode/test/integration/electron/testrunner.js) 与 [testrunner.d.ts](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/vscode/test/integration/electron/testrunner.d.ts)；没有把测试支持文件加入产品补丁。[独立 main.js](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/git-final-output/dist/main.js) 长度 754180 B，SHA256 为 `2f1e19180afd8258cad2c59df94edf7926fec5d3f7ec98ac0529140fe38cce7a`；这是独立扩展输出，不是最终 app 体积结论。

完整结果、红例堆栈、静态审计和逐文件重放哈希保存在私有 [M4-retained-extension-consumers.json](/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-retained-extensions-9apwqxrr/M4-retained-extension-consumers.json)。复核命令：

```sh
# 在私有根执行；red 测试预期 exit 1，green 预期 exit 0
node build-test.mjs red
node test-git-modules.cjs red
node build-test.mjs green
node test-git-modules.cjs green
node audit-retained.mjs

# 在私有根的 vscode/ 执行
node node_modules/@typescript/native/bin/tsc -p extensions/git/tsconfig.json --noEmit
node extensions/git/esbuild.mts --outputRoot ../git-final-output
```

## 主线程未验门

1. 在主私有源码按正式顺序应用 143，重新构建 Git 与共享声明涉及的 API 产物，并复制到最终 app。保持 118/127 的严格 getter。
2. 使用正式 app 和私有普通仓库验证 Git API openRepository 返回 repository、初始扫描注册 SCM、diff / stage / commit 成功，提交消息和真实 post-commit 行为保持普通语义。
3. 查看真实 Git / extension host 日志，核对没有退休 API、退休命令或 Agent 初始化错误；补 worktree/submodule、history/artifact/progress 的实际宿主验收。

本子任务没有遗留常驻测试、Git 或 headless 进程。
