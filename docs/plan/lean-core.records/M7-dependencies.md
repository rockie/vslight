# M7 生产依赖与复制闭包

136 已删除专属生产依赖和开发 SDK、重算 root/remote locks，并撤销 sandbox 独立 Node 的冗余复制规则。最终构建 attempt2 退出 0，产物依赖检查报告 pass/exit 0；remote 的独立实际生产安装及 npm ls 也退出 0。此记录只整理已存在证据，没有重新安装、构建或运行旧测试；不将依赖图和静态包检查当作真实宿主/UI 验收。

## 补丁和输入

交付为 [136-light-retired-production-dependencies.patch](../../../patches/136-light-retired-production-dependencies.patch)，SHA-256：`f122ac06f6db5c94468a4099b05b5d7a3f375c974274d49b6fcf3929ffc6aea7`。实际核对恰有六个 diff：root package.json/package-lock.json、remote/package.json/package-lock.json、build/gulpfile.vscode.ts、build/package.json。

重算结果目录由 `/tmp/lean-core-deps136-path` 指向 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-deps136-_x59epje`；原件在 `/tmp/lean-core-deps136-preimage`。差异统计为 `/tmp/lean-deps136-lock-comparison.json`。前置普通消费者调查见 [M7-dependencies-inventory.md](M7-dependencies-inventory.md)，remote 实际安装方法和完整字节口径见 [M7-remote-graph.md](M7-remote-graph.md)。这些调查中的“建议/待集成”是其当时状态，最终字段处置以 136 和本记录为准。

## 实际依赖处置

| 范围 | 最终字段变化 | 普通行为依据 |
|---|---|---|
| root dependencies | 删除 @microsoft/mxc-sdk、@vscode/sandbox-runtime、foundry-local-sdk、playwright-core、ssh2；zod 移到 dev；增加 semver=7.8.5 | 前五项分别属于退休 sandbox、语音、Browser 和 AgentHost；zod 保留普通 fixture 开发用途；semver 保留普通更新 runtime。 |
| remote dependencies | 删除 @microsoft/mxc-sdk、@vscode/sandbox-runtime、ssh2、zod | remote 普通运行图不需要这些专属根包；普通通用包保留。 |
| root devDependencies | 删除 @anthropic-ai/claude-agent-sdk、@openai/codex、@types/ssh2；增加 zod ^4.4.3 | Codex/Claude 原先是 dev 声明，不能把其 lock 删除量全称作生产包节省。专属 SDK/SSH 类型消费者均随退休 AgentHost 离开。 |
| root/remote 其他字段 | 普通直接依赖、root optional 平台能力保持；既有 remote 1DS 不调整 | 保留 PTY、SQLite、rg、KaTeX、Git helper、编码/代理/watcher 等普通能力，不扩大退休范围。 |

最终 root 有 52 dependencies、103 devDependencies、1 optionalDependency；remote 有 44 dependencies，没有 optional/dev 项。

普通更新服务原本 bare import semver 并使用 compareBuild。其旧生产来源既有 MXC，也有 kerberos→prebuild-install→node-abi→semver；136 选择显式声明原 lock 版本 7.8.5，使普通 runtime 不再依赖偶然存在的传递包。semver 仍在产品 ASAR；删除其 sandbox duplicate 规则只取消冗余真实目录副本。

根 zod 4.4.3 在 componentFixtures 公共普通 helper 中仍有真实 import，因此保留为显式 devDependency。退休 sandbox 的嵌套 zod 3 则退出闭包；没有独立的 zod4 manifest key。root dev graph 仍可合理保留 zod、shell-quote、Playwright，不能要求同名开发包也消失。

ssh2 的全部四处模块入边均在退休 AgentHost：唯一 runtime 为 sshRemoteAgentHostService 的 nativeRequire，另外三处是其实现/专属测试类型 import。普通 terminal/tasks、Git auth 和通用网络没有该入边；因此 root/remote ssh2 与 root dev @types/ssh2 一并退出。

@playwright/test、@playwright/cli 和普通 component-explorer 开发工具保持。旧根生产 playwright-core alpha 节点删除后，最终 lock 仍保留三条 dev playwright-core 路径（browser-chromium 和 playwright 的 1.61.1、CLI 的 1.60.0-alpha-1777077614000）；这些开发依赖不是运行 Browser 复活。普通 profiling 用的 chrome-remote-interface 及其类型保持，最终产品检查也确认 CRI 在 ASAR。

## 离线锁重算与差异

集成人用 Node 24.18/npm 11.16，在没有 node_modules 的独立目录执行 root 和 remote 的离线 package-lock-only 重算：

```sh
npm install --package-lock-only --ignore-scripts --legacy-peer-deps --offline
```

两组重算均退出 0。legacy-peer-deps 沿用仓库已有 .npmrc 的 true 策略，未新增依赖解析例外；ignore-scripts 防止锁生成阶段执行安装 lifecycle。本文没有重跑该重算，而是读实际结果，并独立比较 preimage 与最终 lock 的所有共有非根 package 路径。

| lock 口径 | 原条目 | 新条目 | 删除路径 | 新增路径 | 保留依赖 version/resolved/integrity |
|---|---:|---:|---:|---:|---|
| root packages | 1,582 | 1,549 | 33 | 0 | 全部不变 |
| remote packages | 148 | 133 | 15 | 0 | 全部不变 |

条目计数包含项目根路径及所有平台/dev 路径，不是实际安装唯一包名或最终包体文件数。根项目空路径版本随发布版本由 1.135.0 更新为 1.135.06566；“版本不变”专指保留的已解析依赖包，不包括项目自身。字段分类可变化，例如 root zod 变 dev；不存在借本次清理升级保留依赖或替换下载完整性。

root 的 33 条删除包含 Claude/Codex SDK 及平台 optional 分发、MXC/sandbox/Foundry、SSH 和其专属类型/传递包，以及旧根生产 playwright-core。remote 的 15 条删除覆盖 MXC/sandbox/SSH/zod 与专属传递包。完整 exact 路径保存在差异 JSON；不手工删除 shared hoist。remote 中 commander 仍由 KaTeX 使用，退休的是 sandbox 的嵌套 commander 路径。

差异 JSON 的 production_nodes 分别为 root 156、remote 132，retired_production_nodes 均为空；这是 lock 分类条目统计。实际当前平台安装图必须另外核对，不能把这些数字当作 npm ls 的唯一包名数。最终 root lock SHA-256 为 `8b9862130842f249edce52ffa073e7aafa0cdc663c0e2a066bf709475de8ce51`，remote lock 为 `f1f3317d249985009294caae5898dfb391e0251c47713141e2964566aa0af6b7`。

## 构建入口和复制规则

136 删除 desktop ASAR 的 MXC bin unpack 专属项，并删除 standalone sandbox 五项 duplicate：sandbox-runtime、@pondwader/socks5-server、semver、shell-quote、zod 及其解释注释。普通 native .node、rg bin、PTY worker/conpty/package.json、WASM 等规则仍保留。root/build 其余专属入口退休由前序补丁完成；136 不以 moduleignore 隐藏仍可达的运行模块。

build/package.json 的 test glob 从 lib/next/agent-sdk/codex 收到 lib/next，移除已经退休目录的测试入口，保留普通构建测试。此记录没有重跑这些旧绿测试。

## 实际构建和安装图证据

最终构建目录是 `/var/folders/cv/pn7p1v7s737cqlt605jyl7lm0000gn/T/lean-core-final-build-ugv6jlev`。实读 build-final-attempt2.exit 为 0，对应 build-final-attempt2.log；同目录较早的 build-final.exit 为 5，不能当作成功证据。最终静态 smoke 的 smoke-final-static.exit 为 0。

`/tmp/lean-final-runtime-report.json` 实读 status=pass、exit_code=0、errors=[]、missing_out=[]，retired_packages/retired_out/retired_extensions 全为空。六个 required packages 均 present：CRI、KaTeX、node-pty、ripgrep、semver、SQLite；普通原生包保留相应 ASAR unpacked 位置。报告中的真实 node_modules copy 不存在，sandbox 冗余目录没有保留。以上是静态归档/实际目录检查，没有冒充这些包的所有 runtime API 已测。

remote 另外在 `/tmp/lean-remote-ed6xg2xq/install` 实际执行离线 npm ci --omit=dev --ignore-scripts --legacy-peer-deps 与 npm ls --omit=dev --all --json，均 exit 0，零 problems/退休包。实际图为 110 个唯一包名、114 个包名/版本组合、118 个磁盘 package 目录；普通保留包与既有 1DS 均存在，输入和复制件 manifest/lock hash 未变。普通文件逻辑长度 192,066,255 字节；详细方法见 remote 记录。

remote 使用 ignore-scripts，且最终构建 SHOULD_BUILD_REH=no；这项独立安装证据不证明 REH 构建、原生 ABI 或 remote server 运行。本次记录没有新增 GUI 会话、真实宿主验证或依赖安装，也没有修改主计划/M7 总记录及任何源码。
