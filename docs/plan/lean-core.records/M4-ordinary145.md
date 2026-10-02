# M4 · 145+146 普通真实宿主

- 对应[lean-core.md](../lean-core.md) V7/M4；最近更新：2026-10-02 03:21 +1000。
- 状态：所列检查通过，完整GUI/认证门仍待验。基线dirty@f1961b7546139a6aa722ff0b8a001296d3041e33；[机器证据](M4-ordinary145.json)绑定正式app、PID、fixture hash和实际响应。

私有后台进程PID27483、扩展宿主PID28808、独立profile/workspace运行普通fixture，未操作锁屏桌面或auth PID62872。HTML language识别、editor编辑保存、文件搜索通过；内置Git真实打开repository，完成diff/stage/两次commit，commit数为2；task实际落盘后terminate收到结束事件；SecretStorage store/get/delete通过。请求`retained145-01`返回PASS，不能将命令返回替代这些实际断言。

profile故意保留`editor.aiStats.enabled=true`和`git.addAICoAuthor=all`，供145旧设置惰性验证。随后普通openWalkthrough确实打开Welcome，注册表实例与30步骤已捕获；界面截图及完整walkthrough分类另验。完整session/account/sign-out仍停在原138实例的同一Allow请求。
