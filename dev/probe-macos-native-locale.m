#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#import <unistd.h>

// Injected into an unsigned Electron executable. Read resources before Electron
// main, and exit without constructing NSApplication or displaying any window.
static id valueOrNull(id value) {
    return value ?: NSNull.null;
}

static NSDictionary *bundleEvidence(NSBundle *bundle) {
    return @{
        @"path": valueOrNull(bundle.bundlePath),
        @"identifier": valueOrNull(bundle.bundleIdentifier),
        @"developmentLocalization": valueOrNull(bundle.developmentLocalization),
        @"localizations": valueOrNull(bundle.localizations),
        @"preferredLocalizations": valueOrNull(bundle.preferredLocalizations),
    };
}

__attribute__((constructor)) static void probeNativeLocale(void) {
    if (!getenv("LEAN_NATIVE_LOCALE_PROBE")) return;
    @autoreleasepool {
        NSBundle *main = NSBundle.mainBundle;
        NSBundle *framework = [NSBundle bundleWithPath:[main.bundlePath
            stringByAppendingPathComponent:@"Contents/Frameworks/Electron Framework.framework"]];
        NSBundle *appkit = [NSBundle bundleForClass:NSApplication.class];
        NSUserDefaults *defaults = NSUserDefaults.standardUserDefaults;
        NSDictionary *arguments = [defaults volatileDomainForName:NSArgumentDomain];
        NSDictionary *global = [defaults persistentDomainForName:NSGlobalDomain];
        NSDictionary *appDomain = [defaults persistentDomainForName:main.bundleIdentifier];
        NSMutableDictionary *frameworkInfo = [bundleEvidence(framework) mutableCopy];
        frameworkInfo[@"selectedLocalePak"] = valueOrNull([framework pathForResource:@"locale" ofType:@"pak"]);
        NSMutableDictionary *appkitInfo = [bundleEvidence(appkit) mutableCopy];
        appkitInfo[@"commonStringsResource"] = valueOrNull([appkit pathForResource:@"Common" ofType:@"strings"]);
        NSMutableDictionary *strings = [NSMutableDictionary dictionary];
        for (NSString *key in @[@"Cancel", @"OK", @"Don’t Save"]) {
            strings[key] = [appkit localizedStringForKey:key value:@"__MISSING_NATIVE_STRING__" table:@"Common"];
        }
        appkitInfo[@"commonStrings"] = strings;
        NSDictionary *evidence = @{
            @"schemaVersion": @1,
            @"phase": @"dyld-constructor-before-electron-main",
            @"processId": @(getpid()),
            @"executable": valueOrNull(NSProcessInfo.processInfo.arguments.firstObject),
            @"nsApplicationExists": @(NSApp != nil),
            @"argumentDomainAppleLanguages": valueOrNull(arguments[@"AppleLanguages"]),
            @"effectiveAppleLanguages": valueOrNull([defaults objectForKey:@"AppleLanguages"]),
            @"nsLocalePreferredLanguages": NSLocale.preferredLanguages,
            @"persistentGlobalAppleLanguages": valueOrNull(global[@"AppleLanguages"]),
            @"persistentGlobalAppleLocale": valueOrNull(global[@"AppleLocale"]),
            @"persistentAppAppleLanguages": valueOrNull(appDomain[@"AppleLanguages"]),
            @"mainBundle": bundleEvidence(main),
            @"electronFramework": frameworkInfo,
            @"appKit": appkitInfo,
        };
        NSError *error = nil;
        NSData *json = [NSJSONSerialization dataWithJSONObject:evidence
            options:NSJSONWritingPrettyPrinted | NSJSONWritingSortedKeys error:&error];
        if (!json) {
            const char *message = error.localizedDescription.UTF8String;
            write(STDERR_FILENO, message, strlen(message));
            _exit(43);
        }
        write(STDOUT_FILENO, json.bytes, json.length);
        write(STDOUT_FILENO, "\n", 1);
        _exit(0);
    }
}
