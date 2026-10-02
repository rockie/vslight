# M6 · 显式参数后的同名 chat 文件

- 计划：[lean-core.md](../lean-core.md) §5.4/9.1；最近更新：2026-10-02 01:00 +1000。
- 状态：正式138产品本项通过；dirty@f1961b7546139a6aa722ff0b8a001296d3041e33。

从隔离工作目录使用正式app的bin/vslight，以私有profile/extensions/shared-data和开发fixture运行 --new-window --wait -- chat。原文件内容固定为ordinary chat file stays unchanged。没有传extensionTestsPath，不重复两权限API检查。

[真实结果](M6-cli-file.json)：CLI PID53625正常exit0，fixture宿主PID53651、parentPID53644；activeTextEditor实际打开file:///private/tmp/fc138-5bx6ysyo/w/chat，内容相等且isDirty=false。fixture请求正常Quit后CLI的--wait进程退出，文件磁盘内容仍相同，没有走退休chat命令拒绝分支。

根目录/tmp/fc138-5bx6ysyo保留launch/process/result/acceptance；[私有fixture](fixtures/cli-file/main.js)与[manifest](fixtures/cli-file/package.json)原样保存便于复核，不发布、不进入内置扩展。观察当前真实activeTextEditor，不通过调用openTextDocument或showTextDocument自行打开文件来掩盖CLI错误。
