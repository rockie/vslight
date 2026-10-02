import AppKit
import ApplicationServices
let pid:pid_t = pid_t(CommandLine.arguments[1])!
let app = NSRunningApplication(processIdentifier:pid)
let session = CGSessionCopyCurrentDictionary() as? [String:Any] ?? [:]
let element=AXUIElementCreateApplication(pid)
var raw:CFTypeRef?
let status=AXUIElementCopyAttributeValue(element,kAXWindowsAttribute as CFString,&raw)
let windows=(raw as? [AXUIElement]) ?? []
let value:[String:Any] = ["pid":Int(pid),"running":app != nil,"appActive":app?.isActive ?? false,"bundleURL":app?.bundleURL?.path ?? "","locked":session["CGSSessionScreenIsLocked"] as? Bool ?? false,"onConsole":session["kCGSSessionOnConsoleKey"] as? Bool ?? false,"AXWindowsStatus":Int(status.rawValue),"AXWindowCount":windows.count]
print(String(data:try! JSONSerialization.data(withJSONObject:value,options:[.sortedKeys]),encoding:.utf8)!)
