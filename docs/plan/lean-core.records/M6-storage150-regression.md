# M6 Storage150 定向恢复与持久化回归

状态：本地150定向恢复子门通过（2026-10-02 17:46 +1000）。普通恢复6/6保持原证据；Mermaid双surface已在新私有根完成真实quit/restart，完整tabs/source/ID/theme/numeric panZoom/SQLite均严格相等，四原图复核通过，见[M3-storage150-final](M3-storage150-final.md)。下文保留10:59暂停时的事实和来源，不把旧PID/路径改成新执行。完整结果见 [JSON](M6-storage150-regression.json)，嵌入全部六份实际 fixture、launch 和 acceptance。

私有恢复根：/private/tmp/restore150-gp4g8h_0。实际150 app：/private/tmp/lean-core-build150-z3fs7f_q/vscodium/VSCode-darwin-arm64/VSLight.app。

| 旧状态 | 冷启动PID | 重启PID | 结果 |
| --- | ---: | ---: | --- |
| no-retired普通A/B：A sticky，B preview/active，MRU B→A | 39076 | 40536 | 完整公共tabs与持久化group严格一致 |
| 混合Browser+Chat+A/B：连续退休sticky边界 | 42142 | 43608 | 普通tabs顺序、MRU、preview、sticky、active正确，重启精确一致 |
| Browser+Chat全退休 | 45331 | 46808 | 完整15秒稳定观察后为空；正常保存移除状态row，重启仍空 |

每次实际process.wait均exit0、forced=false。正常Quit后以SQLite mode=ro&immutable=1读取memento/workbench.parts.editor，核对sequential、MRU、preview、sticky、active、activeGroup；两次group严格相等，WAL已关闭。全退休按原有空状态正常保存会移除row的行为验收。

未改restore.js、extension.js、package.json，私有副本与仓库字节相同。旧私有source profile、generated profile和workspace仅复制；新目录重算macOS workspace ID，并只在副本迁移普通payload路径和workspace/startup元数据。SQLite准备未DELETE任何历史或凭据row，原目录与A/B文件未修改。这是复制旧profile恢复，不能写成空fresh profile。

启动前及每次退出后核对150 main/shared/workbench、Storage源、editorGroupModel源及helper SHA，全部身份在JSON。实际执行命令为 `python3 -u /private/tmp/restore150-gp4g8h_0/ordinary-runner.py`。没有重跑原12case全集或32图矩阵。

Mermaid只完成把已绿149私有profile、workspace和未变helper复制到/private/tmp/restore150-gp4g8h_0/mermaid，并迁移自己的路径/workspace ID。没有启动app、发送request或连接CDP，19570从未打开且暂停核查无listener。仍需Editor+Preview双surface正常Quit→同profile新进程重启，严格比较公共tabs顺序/flags、原始source、ID、theme、numeric panZoom与Preview序列化资源状态；旧149绿与本次普通tabs绿不能覆盖该缺口。

暂停时六个main和host PID的ps均无行；host40285/41970/43332/44832/46536/48140在各main.log均正常exit0。所有app已真实wait，无强制清理。未操作全局键盘、粘贴、输入法、浏览器或smoke。新增测试已停止，等待用户明确恢复。
