# M5 · 真实普通扩展宿主采样

- 对应[lean-core.md](../lean-core.md) §4.2、V7/M5；最近更新：2026-10-02 03:47 +1000。
- 状态：实际start/stop与CPU数据本项通过；native Save对话框未操作。基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33，145+146正式app、隔离runtime profile。
- [机器证据](M5-profiling145.json)绑定两个普通命令的实际响应及数据hash；完整私有root由`/tmp/lean-runtime145-path`定位。

通过保留命令`workbench.extensions.action.extensionHostProfile`实际启动，读取已存在ExtensionHostProfileService实例own `_state`确认为Running=2；随后stop命令完成，实例state=None=0，实际返回profile含70 nodes、1,021,093 samples/timeDeltas，endTime大于startTime。CRI生产包确实用于这条实际链路。

helper只从既有singleton descriptor取得constructor，再queryObjects已存在实例；只读own `_state`/`_profile`，CPU树要求plain对象/数组且无getter或循环。未调用DI.get/服务工厂或伪造CPU数据。将实际返回数据写成私有`actual-extension-host.cpuprofile`（16,365,536 B）；这是取证文件，未把原生Save操作写为通过。浏览器删除没有破坏普通extension profiling采样/停止。
