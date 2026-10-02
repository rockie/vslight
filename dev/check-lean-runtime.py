#!/usr/bin/env python3
"""Check packaged runtime dependencies and entry files without modifying the app."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import struct
import subprocess
import sys


RETIRED_PACKAGES = (
    "playwright-core", "@microsoft/mxc-sdk", "@vscode/sandbox-runtime",
    "foundry-local-sdk", "@foundry-local-core/*", "@pondwader/socks5-server",
    "@github/copilot*", "@vscode/copilot-api", "copilot-api",
    "vscode-copilot-api", "@openai/codex*", "@anthropic-ai/claude-agent-sdk*",
)
RETIRED_PRODUCT_KEYS = (
    "defaultChatAgent", "trustedExtensionAuthAccess",
    "builtInExtensionsEnabledWithAutoUpdates", "agentsTelemetryAppName",
    "agentSdks", "copilotVersions", "dictationRuntime", "voiceWsUrl",
    "mcpGallery", "trustedMcpAuthAccess", "chatParticipantRegistry",
    "chatSessionRecommendations",
)
REQUIRED_PACKAGES = {
    "node-pty": ("node-pty",),
    "sqlite": ("@vscode/sqlite3",),
    "ripgrep": ("@vscode/ripgrep-universal", "@vscode/ripgrep"),
    "CRI": ("chrome-remote-interface",),
    "semver": ("semver",),
    "katex": ("katex",),
}
RETIRED_OUT = (
    "vs/platform/browserView", "vs/workbench/contrib/browserView",
    "vs/workbench/services/browserView", "vs/workbench/contrib/simpleBrowser",
    "vs/sessions", "media/sessions-icon.svg", "vs/platform/agentHost", "vs/workbench/services/agentHost",
    "vs/workbench/contrib/agentHost", "vs/platform/mcp",
    "vs/workbench/contrib/mcp", "vs/workbench/services/mcp",
    "vs/platform/localTranscription", "vs/workbench/services/localTranscription",
    "vs/workbench/contrib/chat", "vs/workbench/services/chat",
    "vs/workbench/contrib/inlineChat", "vs/workbench/contrib/agentsVoice",
    "vs/workbench/contrib/speech", "vs/workbench/services/speech",
    "vs/platform/speech", "vs/platform/sandbox", "vs/workbench/services/sandbox",
    "vs/platform/webContentExtractor", "vs/workbench/services/webContentExtractor",
)
REQUIRED_OUT = (
    "main.js", "vs/code/electron-utility/sharedProcess/sharedProcessMain.js",
    "vs/workbench/workbench.desktop.main.js",
    "vs/workbench/contrib/webview/browser/pre/index.html",
    "vs/workbench/contrib/webview/browser/pre/fake.html",
    "vs/workbench/contrib/webview/browser/pre/service-worker.js",
    "vs/base/parts/sandbox/electron-browser/preload.js",
    "vs/base/parts/sandbox/electron-browser/preload-aux.js",
    "vs/platform/terminal/node/ptyHostMain.js",
    "vs/platform/files/node/watcher/watcherMain.js",
    "vs/workbench/api/node/extensionHostProcess.js",
    "vs/platform/profiling/electron-browser/profileAnalysisWorkerMain.js",
)
RETIRED_OUT += tuple(
    "vs/platform/accessibilitySignal/browser/media/" + name + ".mp3"
    for name in ("break", "requestSent", "responseReceived1", "responseReceived2",
                 "responseReceived3", "responseReceived4", "voiceRecordingStarted",
                 "voiceRecordingStopped", "chatEditModifiedFile", "chatUserActionRequired",
                 "editsKept", "editsUndone")
)


def inside(path, root):
    resolved = path.resolve(strict=True)
    try:
        resolved.relative_to(root)
    except ValueError:
        raise ValueError("external symlink/path: {} -> {}".format(path, resolved))
    return resolved


def verify_codesign(path, checks, deep=False):
    command = ["codesign", "--verify", "--strict", "--verbose=2"]
    if deep:
        command.append("--deep")
    command.append(str(path))
    result = subprocess.run(command, capture_output=True, text=True)
    checks.append({"path": str(path), "command": command, "exit": result.returncode,
                   "stdout": result.stdout, "stderr": result.stderr})
    if result.returncode:
        raise ValueError("codesign verification failed: {}: {}".format(
            path, result.stderr.strip() or result.stdout.strip()))


def signed_app_state(app_root):
    """Bind signature verification and inventory reads to unchanged file contents."""
    digest = hashlib.sha256()
    for directory, directories, filenames in os.walk(app_root, followlinks=False):
        directories.sort()
        filenames.sort()
        for name in sorted(directories + filenames):
            path = Path(directory) / name
            mode = path.lstat().st_mode
            digest.update(str(path.relative_to(app_root)).encode("utf-8") + b"\0")
            digest.update(str(mode).encode("ascii") + b"\0")
            if stat.S_ISLNK(mode):
                digest.update(os.fsencode(os.readlink(path)) + b"\0")
            elif stat.S_ISREG(mode):
                file_digest = hashlib.sha256()
                with path.open("rb") as handle:
                    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                        file_digest.update(chunk)
                digest.update(file_digest.digest())
            elif not stat.S_ISDIR(mode):
                raise ValueError("unsupported signed artifact entry: " + str(path))
    return digest.hexdigest()


def read_asar(path, app_root, signed_checks=None):
    """Decode Chromium Pickle framing and validate the complete directory index."""
    inside(path, app_root)
    total_size = path.stat().st_size
    with path.open("rb") as handle:
        prefix = handle.read(16)
        if len(prefix) != 16:
            raise ValueError("truncated asar size/header pickle")
        size_payload, header_size, header_payload, json_size = struct.unpack("<4I", prefix)
        if (size_payload != 4 or header_size < 8 or header_size > 64 * 1024 * 1024
                or header_payload != header_size - 4
                or header_size != 8 + ((json_size + 3) // 4) * 4
                or 8 + header_size > total_size):
            raise ValueError("invalid asar pickle sizes")
        raw = handle.read(json_size)
        if len(raw) != json_size:
            raise ValueError("truncated asar JSON")
        header = json.loads(raw.decode("utf-8"), object_pairs_hook=unique_keys)
    if not isinstance(header, dict) or not isinstance(header.get("files"), dict):
        raise ValueError("asar root must contain a files object")
    nodes = {}
    unpacked = []
    signed_size_changes = []
    data_size = total_size - 8 - header_size

    def visit(files, parent="", depth=0):
        if depth > 256:
            raise ValueError("asar directory nesting exceeds 256")
        for name, node in files.items():
            if (not isinstance(name, str) or not name or name in (".", "..")
                    or "/" in name or "\\" in name or "\x00" in name):
                raise ValueError("invalid asar component: {!r}".format(name))
            logical = parent + "/" + name if parent else name
            if not isinstance(node, dict):
                raise ValueError("invalid asar node: " + logical)
            kinds = sum(key in node for key in ("files", "size", "link"))
            if kinds != 1:
                raise ValueError("ambiguous/unknown asar node: " + logical)
            nodes[logical] = node
            if "unpacked" in node and not isinstance(node["unpacked"], bool):
                raise ValueError("invalid unpacked flag: " + logical)
            if "files" in node:
                if not isinstance(node["files"], dict):
                    raise ValueError("invalid asar directory: " + logical)
                visit(node["files"], logical, depth + 1)
            elif "link" in node:
                link = node["link"]
                if (not isinstance(link, str) or not link or "\\" in link
                        or "\x00" in link or PurePosixPath(link).is_absolute()
                        or any(p in (".", "..") for p in link.split("/"))):
                    raise ValueError("invalid asar link: " + logical)
            else:
                size = node["size"]
                if type(size) is not int or size < 0:
                    raise ValueError("invalid asar file size: " + logical)
                if node.get("unpacked"):
                    target = path.parent / (path.name + ".unpacked") / logical
                    inside(target, app_root)
                    if not target.is_file():
                        raise ValueError("missing/size-mismatched unpacked file: " + logical)
                    physical_size = target.stat().st_size
                    if physical_size != size:
                        if signed_checks is None or target.is_symlink():
                            raise ValueError("missing/size-mismatched unpacked file: " + logical)
                        with target.open("rb") as handle:
                            magic = handle.read(4)
                        if magic not in (b"\xcf\xfa\xed\xfe", b"\xce\xfa\xed\xfe",
                                         b"\xfe\xed\xfa\xcf", b"\xfe\xed\xfa\xce",
                                         b"\xca\xfe\xba\xbe", b"\xca\xfe\xba\xbf",
                                         b"\xbe\xba\xfe\xca", b"\xbf\xba\xfe\xca"):
                            raise ValueError("size-mismatched unpacked file is not Mach-O: " + logical)
                        verify_codesign(target, signed_checks)
                        signed_size_changes.append({"path": logical, "header_bytes": size,
                                                    "physical_bytes": physical_size})
                    unpacked.append(logical)
                else:
                    offset = node.get("offset")
                    if (not isinstance(offset, str) or not offset.isascii()
                            or not offset.isdecimal() or int(offset) + size > data_size):
                        raise ValueError("invalid/out-of-bounds asar offset: " + logical)
    visit(header["files"])
    for logical, node in nodes.items():
        seen = {logical}
        while "link" in node:
            target = node["link"]
            if target not in nodes or target in seen:
                raise ValueError("missing/cyclic asar link: " + logical)
            seen.add(target)
            node = nodes[target]
    metadata = {"header_bytes": header_size, "json_bytes": json_size,
                "nodes": len(nodes), "unpacked_files": len(unpacked)}
    if signed_checks is not None:
        metadata["signed_unpacked_size_changes"] = signed_size_changes
    return nodes, metadata


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate asar JSON key: " + key)
        result[key] = value
    return result


def physical_tree(root, app_root):
    """Follow internal links, reject escapes/broken links, avoid directory cycles."""
    if not root.exists() and not root.is_symlink():
        return {}
    nodes = {}

    def visit(directory, parent="", ancestors=None):
        resolved = inside(directory, app_root)
        ancestors = set() if ancestors is None else ancestors
        if resolved in ancestors:
            raise ValueError("directory symlink cycle: " + str(directory))
        for entry in sorted(os.scandir(directory), key=lambda item: item.name):
            path = Path(entry.path)
            inside(path, app_root)
            logical = parent + "/" + entry.name if parent else entry.name
            nodes[logical] = path
            if path.is_dir():
                visit(path, logical, ancestors | {resolved})
            elif not path.is_file():
                raise ValueError("non-file artifact entry: " + str(path))
    if not root.is_dir():
        raise ValueError("expected directory: " + str(root))
    visit(root)
    return nodes


def package_roots(paths):
    """Include top-level/scoped packages and nested node_modules instances."""
    packages = {}
    for logical in paths:
        parts = logical.split("/")
        starts = [0] + [i + 1 for i, part in enumerate(parts) if part == "node_modules"]
        for start in starts:
            if start >= len(parts) or parts[start] == ".bin":
                continue
            end = start + (2 if parts[start].startswith("@") else 1)
            if end > len(parts):
                continue
            name = "/".join(parts[start:end])
            packages.setdefault(name, set()).add("/".join(parts[:end]))
    return {name: sorted(locations) for name, locations in sorted(packages.items())}


def retired_name(name):
    return any(name.startswith(pattern[:-1]) if pattern.endswith("*")
               else name == pattern for pattern in RETIRED_PACKAGES)


def check_app(app, signed=False):
    report = {"schema_version": 1, "app": str(app.absolute()), "status": "fail",
              "errors": [], "stores": {}, "retired_packages": [],
              "required_packages": {}, "retired_out": [], "missing_out": [],
              "retired_extensions": [], "retired_product_keys": []}
    errors = report["errors"]
    try:
        app_root = app.resolve(strict=True)
        content = app_root / "Contents/Resources/app"
        inside(content, app_root)
        if not content.is_dir():
            raise ValueError("missing app resources directory")
    except (OSError, ValueError, RuntimeError) as exc:
        errors.append({"check": "app_structure", "detail": str(exc)})
        return finish(report)
    signed_checks = None
    if signed:
        signed_checks = []
        report["signature_checks"] = signed_checks
        try:
            state_before = signed_app_state(app_root)
            verify_codesign(app_root, signed_checks, deep=True)
        except (OSError, ValueError, RuntimeError) as exc:
            errors.append({"check": "signed_app_signature", "detail": str(exc)})
            return finish(report)
    try:
        product_path = inside(content / "product.json", app_root)
        product = json.loads(product_path.read_text(encoding="utf-8"), object_pairs_hook=unique_keys)
        if not isinstance(product, dict):
            raise ValueError("product.json must contain an object")
        report["retired_product_keys"] = [key for key in RETIRED_PRODUCT_KEYS if key in product]
    except (OSError, ValueError, RuntimeError) as exc:
        errors.append({"check": "product_structure", "detail": str(exc)})
    inventories = {}
    nonempty_packages = {}
    try:
        nodes, metadata = read_asar(content / "node_modules.asar", app_root, signed_checks)
        inventories["asar"] = package_roots(nodes)
        nonempty_packages["asar"] = package_roots(
            path for path, node in nodes.items() if "size" in node and node["size"] > 0)
        report["stores"]["asar"] = metadata
    except (OSError, ValueError, RuntimeError, RecursionError) as exc:
        errors.append({"check": "asar_structure", "detail": str(exc)})
    for store in ("node_modules", "node_modules.asar.unpacked"):
        try:
            nodes = physical_tree(content / store, app_root)
            inventories[store] = package_roots(nodes)
            nonempty_packages[store] = package_roots(
                path for path, target in nodes.items() if target.is_file() and target.stat().st_size > 0)
            report["stores"][store] = {"exists": (content / store).is_dir(), "nodes": len(nodes)}
        except (OSError, ValueError, RuntimeError, RecursionError) as exc:
            errors.append({"check": store + "_structure", "detail": str(exc)})
    for store, packages in inventories.items():
        for name, locations in packages.items():
            if retired_name(name):
                item = {"store": store, "package": name, "paths": locations}
                if store != "asar":
                    item["real_paths"] = [str((content / store / path).resolve()) for path in locations]
                report["retired_packages"].append(item)
    for label, alternatives in REQUIRED_PACKAGES.items():
        matches = [{"store": store, "package": name, "paths": packages[name]}
                   for store, packages in nonempty_packages.items() for name in alternatives if name in packages]
        for match in matches:
            if match["store"] != "asar":
                match["real_paths"] = [str((content / match["store"] / path).resolve())
                                       for path in match["paths"]]
        report["required_packages"][label] = {"present": bool(matches), "locations": matches}
        if not matches:
            errors.append({"check": "required_package", "detail": label})
        elif label == "semver" and not any(match["store"] == "node_modules" for match in matches):
            errors.append({"check": "main_process_esm_package",
                           "detail": "semver requires a physical node_modules copy for startup"})
    try:
        out = content / "out"
        inside(out, app_root)
        paths = physical_tree(out, app_root)
        report["stores"]["out"] = {"nodes": len(paths)}
        for prefix in RETIRED_OUT:
            matches = [p for p in paths if p == prefix or p.startswith(prefix + "/")]
            if matches:
                report["retired_out"].append({"prefix": prefix, "paths": matches})
        for path in REQUIRED_OUT:
            if path not in paths or not paths[path].is_file() or paths[path].stat().st_size == 0:
                report["missing_out"].append(path)
    except (OSError, ValueError, RuntimeError, RecursionError) as exc:
        errors.append({"check": "out_structure", "detail": str(exc)})
    for name in ("simple-browser", "copilot", "github.copilot", "github.copilot-chat"):
        candidate = content / "extensions" / name
        if candidate.exists() or candidate.is_symlink():
            report["retired_extensions"].append(str(candidate.relative_to(content)))
    if signed:
        try:
            state_after = signed_app_state(app_root)
            report["signed_app_state"] = {"before_sha256": state_before,
                                          "after_sha256": state_after,
                                          "unchanged": state_before == state_after}
            if state_before != state_after:
                raise ValueError("signed app changed during signature verification or inventory reads")
        except (OSError, ValueError, RuntimeError) as exc:
            errors.append({"check": "signed_app_state", "detail": str(exc)})
    return finish(report)


def finish(report):
    failed = bool(report["errors"] or report["retired_packages"] or report["retired_out"]
                  or report["missing_out"] or report["retired_extensions"]
                  or report["retired_product_keys"])
    report["status"] = "fail" if failed else "pass"
    report["exit_code"] = 1 if failed else 0
    report["summary"] = {"structure_or_missing_package_errors": len(report["errors"]),
                         "retired_package_instances": len(report["retired_packages"]),
                         "retired_out_groups": len(report["retired_out"]),
                         "missing_required_out": len(report["missing_out"]),
                         "retired_extensions": len(report["retired_extensions"]),
                         "retired_product_keys": len(report["retired_product_keys"])}
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app", required=True, type=Path, help="actual macOS .app path")
    parser.add_argument("--signed", action="store_true",
                        help="verify app and size-changed unpacked Mach-O signatures; requires macOS codesign")
    args = parser.parse_args()
    report = check_app(args.app, signed=args.signed)
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    return report["exit_code"]


if __name__ == "__main__":
    sys.exit(main())
