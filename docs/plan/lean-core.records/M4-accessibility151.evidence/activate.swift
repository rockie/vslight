import AppKit
let pid=pid_t(CommandLine.arguments[1])!
let expected=CommandLine.arguments[2]
guard let app=NSRunningApplication(processIdentifier:pid), app.bundleURL?.resolvingSymlinksInPath().path == expected else { fatalError("Wrong own app identity") }
let accepted=app.activate(options:[.activateAllWindows,.activateIgnoringOtherApps])
print("activationAccepted=\(accepted)")
