// win_id — print the CGWindowID of the first on-screen layer-0 window owned by a process.
// Usage: win_id <owner-name> [pid]
import CoreGraphics
import Foundation

guard (2...3).contains(CommandLine.arguments.count) else {
    FileHandle.standardError.write("usage: win_id <owner-name> [pid]\n".data(using: .utf8)!)
    exit(1)
}
let owner = CommandLine.arguments[1]
let pid = CommandLine.arguments.count == 3 ? Int(CommandLine.arguments[2]) : nil
if CommandLine.arguments.count == 3 && (pid == nil || pid! <= 0) { exit(1) }
let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let list = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] else {
    exit(1)
}
for info in list {
    if let pid, info["kCGWindowOwnerPID"] as? Int != pid { continue }
    guard let name = info["kCGWindowOwnerName"] as? String, name == owner,
          let layer = info["kCGWindowLayer"] as? Int, layer == 0,
          let wid = info["kCGWindowNumber"] as? Int else { continue }
    print(wid)
    exit(0)
}
exit(2) // no matching window
