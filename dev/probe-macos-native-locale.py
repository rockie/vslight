#!/usr/bin/env python3
"""Read real unsigned app/Foundation/AppKit locale selection, without a GUI.

AppleLanguages is supplied in NSArgumentDomain to each fresh process. This is a
native resource probe; it does not claim Electron menus or workbench UI passed.
No preferences, app resources, keychains, or installed applications are written.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import plistlib
import subprocess
import sys


CASES = {
    "en": ["en"],
    "en-GB": ["en_GB", "en"],
    "zh-CN": ["zh_CN"],
    "zh-TW": ["zh_TW"],
    "fr": ["en"],
    "de": ["en"],
    "ja": ["en"],
}


def run(command: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, timeout=30, **kwargs)


def manifest(app: Path) -> dict[str, object]:
    entries = []
    count = 0
    size = 0
    for path in sorted(app.rglob("*")):
        relative = str(path.relative_to(app))
        if path.is_symlink():
            entries.append([relative, "symlink", os.readlink(path)])
        elif path.is_file():
            data = path.read_bytes()
            entries.append([relative, "file", len(data), hashlib.sha256(data).hexdigest()])
            count += 1
            size += len(data)
        elif path.is_dir():
            entries.append([relative, "directory"])
        else:
            raise ValueError(f"Unsupported app entry: {path}")
    encoded = json.dumps(entries, ensure_ascii=False, separators=(",", ":")).encode()
    return {"sha256": hashlib.sha256(encoded).hexdigest(), "ordinaryFiles": count,
            "ordinaryFileBytes": size, "entries": len(entries)}


def global_language_preferences() -> dict[str, object]:
    # Read only these public preference values, never the full defaults domain.
    result: dict[str, object] = {}
    for key in ("AppleLanguages", "AppleLocale"):
        command = ["/usr/bin/defaults", "read", "-g", key]
        value = run(command)
        result[key] = {"exitCode": value.returncode, "stdout": value.stdout.strip()}
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("app", type=Path)
    parser.add_argument("--output", type=Path, required=True,
                        help="New evidence directory outside the app")
    args = parser.parse_args()
    if sys.platform != "darwin":
        parser.error("Requires macOS")
    app = args.app.resolve(strict=True)
    output = args.output.resolve()
    if output == app or app in output.parents:
        parser.error("Evidence directory must be outside the app")
    if output.exists():
        parser.error("Evidence directory must be new")
    info = plistlib.loads((app / "Contents/Info.plist").read_bytes())
    executable = app / "Contents/MacOS" / info["CFBundleExecutable"]
    signature = run(["/usr/bin/codesign", "--display", "--verbose=4", str(app)])
    signature_text = signature.stdout + signature.stderr
    if "runtime" in signature_text.lower() or (
        "Signature=adhoc" not in signature_text and
        "code object is not signed at all" not in signature_text
    ):
        parser.error("Only unsigned or ad hoc apps without hardened runtime are supported")
    architectures = run(["/usr/bin/lipo", "-archs", str(executable)])
    if architectures.returncode:
        parser.error(architectures.stderr.strip())
    output.mkdir(parents=True)
    (output / "codesign-display.txt").write_text(signature_text)
    source = Path(__file__).with_suffix(".m")
    library = output / "native-locale-probe.dylib"
    compile_command = ["xcrun", "clang", "-dynamiclib", "-fobjc-arc"]
    for arch in architectures.stdout.split():
        compile_command += ["-arch", arch]
    compile_command += ["-framework", "Foundation", "-framework", "AppKit",
                        str(source), "-o", str(library)]
    compiled = run(compile_command)
    (output / "compile.stderr.txt").write_text(compiled.stderr)
    if compiled.returncode:
        raise RuntimeError(f"Native probe compile failed; see {output}")
    # If injection were not honored, Electron Node mode exits with a clear failure.
    fallback = output / "injection-missing.js"
    fallback.write_text("process.stdout.write('NATIVE_PROBE_INJECTION_MISSING\\n');process.exit(42);\n")
    env = os.environ.copy()
    env.update(LEAN_NATIVE_LOCALE_PROBE="1", DYLD_INSERT_LIBRARIES=str(library),
               ELECTRON_RUN_AS_NODE="1")
    before_manifest = manifest(app)
    before_preferences = global_language_preferences()
    results = []
    framework_root = (app / "Contents/Frameworks/Electron Framework.framework").resolve()
    for language, expected in CASES.items():
        command = [str(executable), str(fallback), "-AppleLanguages", f"({language})"]
        process = run(command, env=env)
        (output / f"{language}.stdout.json").write_text(process.stdout)
        (output / f"{language}.stderr.txt").write_text(process.stderr)
        errors = []
        evidence = None
        try:
            evidence = json.loads(process.stdout)
        except json.JSONDecodeError:
            errors.append("Native constructor did not produce JSON")
        if process.returncode != 0:
            errors.append(f"Process exited {process.returncode}")
        if evidence:
            for key in ("argumentDomainAppleLanguages", "effectiveAppleLanguages",
                        "nsLocalePreferredLanguages"):
                if evidence.get(key) != [language]:
                    errors.append(f"{key} did not use isolated requested language")
            if Path(evidence["mainBundle"]["path"]).resolve() != app:
                errors.append("NSBundle.main is not the actual app")
            if Path(evidence["electronFramework"]["path"]).resolve() != framework_root:
                errors.append("NSBundle Electron Framework is not the actual framework")
            if evidence.get("nsApplicationExists"):
                errors.append("NSApplication existed before probe exit")
            for key in ("mainBundle", "electronFramework", "appKit"):
                if evidence[key]["preferredLocalizations"] != expected:
                    errors.append(f"{key} selected unexpected localizations")
            pak = evidence["electronFramework"]["selectedLocalePak"]
            if not pak or not Path(pak).is_file() or Path(pak).parent.name != f"{expected[0]}.lproj":
                errors.append("NSBundle locale.pak lookup did not select expected real resource")
            expected_strings = {"Cancel": "Cancel", "OK": "OK", "Don’t Save": "Don’t Save"}
            if language == "zh-CN":
                expected_strings = {"Cancel": "取消", "OK": "好", "Don’t Save": "不保存"}
            elif language == "zh-TW":
                expected_strings = {"Cancel": "取消", "OK": "好", "Don’t Save": "不儲存"}
            if evidence["appKit"]["commonStrings"] != expected_strings:
                errors.append("AppKit Common native strings did not match expected language")
        results.append({"language": language, "command": command,
                        "exitCode": process.returncode, "errors": errors,
                        "evidenceFile": f"{language}.stdout.json"})
    after_manifest = manifest(app)
    after_preferences = global_language_preferences()
    global_snapshots = [json.loads((output / r["evidenceFile"]).read_text())[
        "persistentGlobalAppleLanguages"] for r in results if not r["errors"]]
    summary = {
        "schemaVersion": 1,
        "time": datetime.datetime.now().astimezone().isoformat(),
        "app": str(app),
        "scope": "Native NSBundle/AppKit resource lookup before Electron main; no GUI verdict",
        "compileCommand": compile_command,
        "compileExitCode": compiled.returncode,
        "mainArchitectures": architectures.stdout.strip(),
        "appManifestBefore": before_manifest,
        "appManifestAfter": after_manifest,
        "appUnchanged": before_manifest == after_manifest,
        "globalPreferencesBefore": before_preferences,
        "globalPreferencesAfter": after_preferences,
        "globalPreferencesUnchanged": before_preferences == after_preferences,
        "persistentGlobalLanguageSnapshots": global_snapshots,
        "cases": results,
    }
    summary["passed"] = (all(not r["errors"] for r in results)
                         and summary["appUnchanged"]
                         and summary["globalPreferencesUnchanged"]
                         and len(global_snapshots) == len(CASES)
                         and all(value == global_snapshots[0] for value in global_snapshots))
    (output / "summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"passed": summary["passed"], "cases": len(results),
                      "appUnchanged": summary["appUnchanged"],
                      "globalPreferencesUnchanged": summary["globalPreferencesUnchanged"],
                      "summary": str(output / "summary.json")}, ensure_ascii=False))
    return 0 if summary["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
