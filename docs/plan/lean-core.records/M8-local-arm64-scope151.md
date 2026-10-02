# 最终验收范围：本地 macOS arm64

计划：[lean-core.md](../lean-core.md)，更新：2026-10-02 21:59 +1000。用户明确指示：“x64 不用跑了，本地跑过 arm64就可以”。此指示取代原NFR-5、V10、§9.2/§9.4及M2/M8退出条件中的当前输入双架构CI门；本次完成条件改为当前输入的本地macOS arm64完整构建、实机及分发校验。

未运行x64或CI，不把它们记为通过；它们在本次验收中为“不要求”。三workflow/双架构Python供给配置保留，未修改生产代码或发布配置。不提交/推送/触发CI/发布及停用smoke的既有指示继续有效，其他功能、数据、全图编译、资源、安全失败、签名公证、ZIP和文档退出条件不变。

[最终本地逐项审查](M8-final-local-audit151.md)覆盖V1–V10本地项，必要缺口0；[当前输入及实际产物复核](M8-completion-input-artifact151.json)证明1475输入生产/helper/workflow漂移0，签名app全部1223文件/链接及两ZIP/manifest与已验载体完全一致。原build/noEmit/package各exit0、Apple Accepted和全部签名阶段exit0保持有效；未重跑未变绿测试。

旧[阻塞记录](M8-blocked-ci151.md)和双架构未验记录保留其历史事实，已由本次用户指示解除，不代表当前仍阻塞。
