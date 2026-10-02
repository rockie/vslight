# M8 · 正式产物 UI 分段验收

- 计划：[lean-core.md](../lean-core.md) §9.1 / M8；最近更新：2026-10-02 01:00 +1000。
- 状态：分段 UI 项通过，完整单次 smoke / 分发门未完成；dirty@f1961b7546139a6aa722ff0b8a001296d3041e33。
- 正式138产物及同条件体积见[M8](M8.md)。没有修改用户生成树或已安装应用，只操作测试 PID。

用户要求不重跑已通过且未影响的测试。第一次只抽取既有 smoke 的 L3 函数与检查主体，保留原代码、私有工作区初始化和前台/PID保护；L1/L2不执行。把先前已成功安装的私有主题/zh-CN扩展复制到测试目录，不重新联网安装。源码SHA和提取范围在 `/tmp/ui138-dbgdgcyk/meta.json`；实际脚本、日志、退出码同目录，现场 `/tmp/vslight-smoke.10EUl2`。

| UI 项 | 第一次结果 | 最终针对该项的证据 |
| --- | --- | --- |
| 窗口、workbench渲染 | PASS，OCR 12行 | 原L3结果沿用 |
| 编辑保存、剪贴板一致及粘贴保存 | PASS | 原L3结果沿用 |
| 终端物理快捷键与命令执行 | PASS，term-proof.txt落盘，终端OCR 30行 | 旧焦点缺口在正式新app中已通过；无需改产品或再跑同项 |
| 终端下载到Downloads | PASS，1237B | 唯一测试文件已清理 |
| Source Control | PASS | 原L3结果沿用 |
| Remote Explorer / Chat / Notebook / Copilot 命令面板 | PASS | 原L3结果沿用 |
| Debug: Start 命令面板 | FAIL，旧泛化debug正则误判 | 只重跑修改后的该检查，exit0/PASS；`debug-only.log`、`debug-only.exit` |
| zh-CN工作台菜单 | PASS，菜单有文件 | 原L3结果沿用；不冒充其他原生语言fallback |

## Debug 检查根因

真实[命令面板截图](fixtures/ui/debug-palette.png)和[OCR](fixtures/ui/debug-palette.txt) 显示 Developer: Debug Editor GPU Renderer、Developer: Debug Extension Host In Dev Tools 等普通诊断，没有退休的 Debug 分类。完整编译曾证明普通 DevTools action必须保留，不能为泛化正则绿色而删除它。

`dev/smoke.sh` 原检查在剔除查询回显后匹配任意debug字样，因而把Developer命令误判成Debug: Start。修为锚定Debug分类前缀。真实捕获的同一OCR数据上旧正则红、新正则绿，追加实际Debug分类的最小负向控制仍红；随后正式app只执行该项也PASS/exit0。没有重复其他已绿UI项，也没有通过skip隐去失败。

第一次L3进程exit2的历史保留；这是一组完整UI检查加一次明确修复后的定向补验，不写成一次完整smoke exit0。单次完整smoke零SKIP/FAIL仍属于最终分发验收，当前不标M8完成。
