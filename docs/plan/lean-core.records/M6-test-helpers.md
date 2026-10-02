# M6 普通共享测试 helper 收口

[135-light-retired-shared-test-helpers.patch](../../../patches/135-light-retired-shared-test-helpers.patch) 仅从三个保留测试/helper 文件删除 9 行退休服务 imports/stubs。普通 inline completion provider/editor/model 测试、editor tab bar fixtures 和 multi-diff fixtures 保留。没有添加产品代码、空 service adapter 或新增 prune 项，没有运行 GUI。

验证快照 `/tmp/th-q3wbncbh` 从 root 当前 `/tmp/lean-core-api-5_lg434f/vscode` 独立复制；已读到 127 纯数据与 131 managed interface 解绑、专属 prune。根 out/out-build 排除复制，node_modules 只读 symlink，transpile 输出写私有 out。原件、修改清单和源/结果哈希分别在 original135、changed135.json、imports135.json。

| sourcepath | 精确修改 |
| --- | --- |
| `src/vs/editor/contrib/inlineCompletions/test/browser/utils.ts` | 去五个 managedSettings fetch/status/compatibility stub 成员；普通 IDefaultAccountService stub、provider 注册、editor/model 构造与 cleanup 保留 |
| `src/vs/workbench/test/browser/componentFixtures/editor/editorTabBar.fixture.ts` | 去 NotebookDocumentService/NotebookDocumentWorkbenchService import 与实例化 stub；普通 tab bar 场景、主题、tree DnD、breadcrumb、菜单与布局保留 |
| `src/vs/workbench/test/browser/componentFixtures/editor/multiDiffEditor.fixture.ts` | 去 NotebookDocumentService import 与 partial stub；普通 diff/editor/text-file/decorations/context/trust services 保留 |

三文件 imports 核对：没有保留指向退休 Chat / Sessions / agentHost / MCP / speech / Notebook / Debug 服务的直接静态或动态 imports；证据 `/tmp/th-q3wbncbh/imports135.json`。这次处理的是 `workbench/services/notebook` 服务绑定，区别于已经迁移的 Notebook 纯 URI/data helper；没有重新引回原 service。

## 实际验证

以下命令 cwd 均为 `/tmp/th-q3wbncbh`，没有重跑已绿 auth 39、128 helper 或 131 既有 suite。

- `node build/next/index.ts transpile`：exit 0；`transpile135.log`。
- `node test/unit/browser/index.js --browser chromium --run out/vs/editor/contrib/inlineCompletions/test/browser/helperLoad135.test.js`：exit 0，1 passing，0 BAD；`helper-load135.log`。私有新增加载检查在 Mocha test 内动态导入真实修改后的 helper，进入带 provider 的 `withAsyncTestCodeEditorAndInlineCompletionsModel` 构造路径，验证普通 editor 文本/model、account getter/URL resolver 和五个退休成员不存在。模型由实际编辑器 helper/controller 构造；未以另写的 mock 代替被测 helper。此检查文件只在私有 out，不进入 patch。
- `node node_modules/@typescript/native/bin/tsc -p src/tsconfig.json --noEmit`：exit 1，366 个诊断，三个修改文件均 0；`tsc135.log`。剩余诊断属于完整图的未完成闭包，不能声称全图编译通过。

component fixtures 的普通服务绑定仅完成 transpile、类型与 import 闭包验证；本次没有运行 component-explorer 渲染。上游 unit runner 的 bare package import-map 限制已在 [M6-test-fixtures.md](M6-test-fixtures.md) 实证，不能把单纯 exit 0 / 0 passing 当作组件加载成功。

发现并交 root 收口的共享入口残留：`src/vs/code/electron-main/main.ts` 仍向 UserDataProfilesMainService 直接传六个参数，而 131 移除 product DI 后签名为五个参数；其 join import 也未使用。本 worker 未修改 main/build/entry。

补丁 SHA-256：`fc28e095c0b43d4973bcee95fcceb2e9caa96d81c07e955699a9a41d2ef7f62d`。独立重放 `/tmp/r135-g5hcga10` 的 git apply --check/apply 均 exit 0，3/3 文件与验证快照逐字节一致；证据 `/tmp/th-q3wbncbh/replay135.json`。另在 root 当前私有 source 只读执行 apply --check，exit 0；实际集成由 root 执行。
