// win_id — print the CGWindowID of the first on-screen layer-0 window owned by a process.
// Usage: win_id <owner-name>   (e.g. win_id VSLight)
import CoreGraphics
import Foundation

guard CommandLine.arguments.count == 2 else {
    FileHandle.standardError.write("usage: win_id <owner-name>\n".data(using: .utf8)!)
    exit(1)
}
let owner = CommandLine.arguments[1]
let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let list = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
    exit(1)
}
for info in list {
    guard let name = info["kCGWindowOwnerName"] as? String, name == owner,
          let layer = info["kCGWindowLayer"] as? Int, layer == 0,
          let wid = info["kCGWindowNumber"] as? Int else { continue }
    print(wid)
    exit(0)
}
exit(2) // no matching window
