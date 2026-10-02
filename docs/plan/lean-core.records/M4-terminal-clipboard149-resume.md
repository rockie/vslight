# M4/V7 · 最终149终端和剪贴板独立fixture

计划：[lean-core.md](../lean-core.md) §9.2用户调整、V7、M4/M8。最近更新：2026-10-02 10:16 +1000。基线：dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，最终147–149 app。状态：本子项PASS，不代表M4/M8整体完成。

[ordinary.js](../../../dev/test-fixtures/lean-core/ordinary.js)新增terminal-clipboard动作。实际隔离profile `/private/tmp/ord149-02m3s2vk` 的宿主已执行；[响应/身份/hash](M4-terminal-clipboard149-resume.json)。没有运行smoke、合成键盘输入或更改系统输入法。

| 验收 | 实际路径 | 结果 |
| --- | --- | --- |
| 普通集成终端执行 | 公共createTerminal以/bin/sh -f启动真实PTY，sendText发送命令；旧proof先删除，宿主读取真实文件内容 | PASS，TERMINAL_RUN_MARKER落盘 |
| 剪贴板往返与编辑器粘贴保存 | 公共env.clipboard写/读自己的marker，公开editor.action.clipboardPasteAction命令，真实document.save与磁盘读回 | PASS，ORDINARY_CLIPBOARD_MARKER落盘；finally恢复原剪贴板，不记录原内容 |
| 宿主退出 | fixture公开quit，父控制器wait实际exit0 | PASS |

该证据覆盖终端/API与编辑器粘贴命令的保留行为；不将它描述为验证了拼音输入法下的全局按键交互。用户指出的IME改写输入和终端命令落入editor的旧轮仍是失败，未改写为绿。
