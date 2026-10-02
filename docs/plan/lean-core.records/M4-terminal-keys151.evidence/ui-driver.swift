import AppKit
import ApplicationServices

let args = CommandLine.arguments
guard args.count >= 3, let pid = Int32(args[1]), pid > 0,
      let app = NSRunningApplication(processIdentifier: pid) else { exit(1) }
if let session = CGSessionCopyCurrentDictionary() as? [String: Any],
   session["CGSSessionScreenIsLocked"] as? Bool == true { exit(2) }
let element = AXUIElementCreateApplication(pid)

func attribute(_ object: AXUIElement, _ name: CFString) -> CFTypeRef? {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(object, name, &value) == .success else { return nil }
    return value
}

func descendants(_ object: AXUIElement, depth: Int = 0) -> [AXUIElement] {
    if depth >= 8 { return [object] }
    let children = (attribute(object, kAXChildrenAttribute as CFString) as? [AXUIElement]) ?? []
    let sheets = (attribute(object, "AXSheets" as CFString) as? [AXUIElement]) ?? []
    return [object] + (children + sheets).flatMap { descendants($0, depth: depth + 1) }
}

switch args[2] {
case "focus":
    guard app.activate(options: [.activateAllWindows]) else { exit(1) }
case "frontmost":
    exit(app.isActive ? 0 : 2)
case "windows":
    guard let windows = attribute(element, kAXWindowsAttribute as CFString) as? [AXUIElement], !windows.isEmpty else { exit(1) }
    print(windows.count)
case "menus":
    guard let bar = attribute(element, kAXMenuBarAttribute as CFString) else { exit(1) }
    let menuBar = bar as! AXUIElement
    guard let items = attribute(menuBar, kAXChildrenAttribute as CFString) as? [AXUIElement] else { exit(1) }
    for item in items {
        if let title = attribute(item, kAXTitleAttribute as CFString) as? String { print(title) }
    }
case "dialog", "press":
    guard let windows = attribute(element, kAXWindowsAttribute as CFString) as? [AXUIElement] else { exit(1) }
    let items = windows.flatMap { descendants($0) }
    if args[2] == "dialog" {
        let text = items.compactMap { item -> [String: String]? in
            let role = attribute(item, kAXRoleAttribute as CFString) as? String ?? ""
            let title = attribute(item, kAXTitleAttribute as CFString) as? String ?? ""
            let value = attribute(item, kAXValueAttribute as CFString) as? String ?? ""
            guard !title.isEmpty || !value.isEmpty else { return nil }
            return ["role": role, "title": title, "value": value]
        }
        print(String(data: try JSONSerialization.data(withJSONObject: text), encoding: .utf8)!)
    } else {
        guard args.count == 4, app.isActive else { exit(2) }
        let buttons = items.filter {
            attribute($0, kAXRoleAttribute as CFString) as? String == "AXButton" &&
            attribute($0, kAXTitleAttribute as CFString) as? String == args[3]
        }
        guard let button = buttons.first else { exit(1) }
        guard AXUIElementPerformAction(button, kAXPressAction as CFString) == .success else { exit(1) }
    }
default:
    exit(1)
}
