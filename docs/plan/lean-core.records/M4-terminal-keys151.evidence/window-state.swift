import AppKit
import ApplicationServices
let pid=Int32(CommandLine.arguments[1])!
let app=NSRunningApplication(processIdentifier:pid)
let s=CGSessionCopyCurrentDictionary() as? [String:Any] ?? [:]
let data:[String:Any] = ["pid":Int(pid),"appActive":app?.isActive ?? false,"bundleURL":app?.bundleURL?.path ?? "","locked":s["CGSSessionScreenIsLocked"] as? Bool ?? false,"onConsole":s["kCGSSessionOnConsoleKey"] as? Bool ?? false]
print(String(data:try! JSONSerialization.data(withJSONObject:data),encoding:.utf8)!)
