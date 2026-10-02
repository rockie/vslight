"""Regressions for signed ASAR unpacked files and package closure checks."""

import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


sys.dont_write_bytecode = True
SCRIPT = Path(__file__).with_name("check-lean-runtime.py")
SPEC = importlib.util.spec_from_file_location("check_lean_runtime", SCRIPT)
runtime = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runtime)


class SignedRuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.app = self.root / "VSLight.app"
        self.content = self.app / "Contents/Resources/app"
        self.content.mkdir(parents=True)
        (self.content / "product.json").write_text("{}")
        for entry in runtime.REQUIRED_OUT:
            path = self.content / "out" / entry
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b"retained entry")
        for package in ("semver", "node-pty", "@vscode/sqlite3", "@vscode/ripgrep-universal"):
            path = self.content / "node_modules" / package / "package.json"
            path.parent.mkdir(parents=True)
            path.write_text("{}")
        self.native = self.content / "node_modules.asar.unpacked/@parcel/watcher/watcher.node"
        self.native.parent.mkdir(parents=True)
        self.original = b"\xcf\xfa\xed\xfe" + b"native payload"
        self.native.write_bytes(self.original)
        self.write_asar()

    def write_asar(self, extra=None):
        files = {
            "chrome-remote-interface": {"files": {"index.js": {"size": 1, "offset": "0"}}},
            "katex": {"files": {"index.js": {"size": 1, "offset": "1"}}},
            "@parcel": {"files": {"watcher": {"files": {
                "watcher.node": {"size": len(self.original), "unpacked": True}}}}},
        }
        if extra:
            files.update(extra)
        header = json.dumps({"files": files}).encode()
        padded = header + b"\0" * (-len(header) % 4)
        header_size = 8 + len(padded)
        framing = struct.pack("<4I", 4, header_size, header_size - 4, len(header))
        (self.content / "node_modules.asar").write_bytes(framing + padded + b"ab")

    def signed_check(self, side_effect=None):
        success = subprocess.CompletedProcess([], 0, "", "valid on disk")
        with mock.patch.object(runtime.subprocess, "run", return_value=success,
                               side_effect=side_effect) as codesign:
            report = runtime.check_app(self.app, signed=True)
        return report, codesign

    def test_unsigned_original_and_signed_original_pass(self):
        self.assertEqual(runtime.check_app(self.app)["status"], "pass")
        report, codesign = self.signed_check()
        self.assertEqual(report["status"], "pass", report)
        self.assertEqual(codesign.call_count, 1)
        self.assertTrue(report["signed_app_state"]["unchanged"])

    def test_signed_native_size_change_keeps_full_inventory(self):
        self.native.write_bytes(self.original + b"signature bytes")
        self.assertEqual(runtime.check_app(self.app)["status"], "fail")
        report, codesign = self.signed_check()
        self.assertEqual(report["status"], "pass", report)
        self.assertEqual(codesign.call_count, 2)
        self.assertIn("--deep", codesign.call_args_list[0].args[0])
        self.assertNotIn("--deep", codesign.call_args_list[1].args[0])
        self.assertEqual(codesign.call_args_list[1].args[0][-1], str(self.native.resolve()))
        self.assertTrue(report["required_packages"]["CRI"]["present"])
        self.assertTrue(report["required_packages"]["katex"]["present"])
        self.assertEqual(report["stores"]["asar"]["signed_unpacked_size_changes"],
                         [{"path": "@parcel/watcher/watcher.node", "header_bytes": len(self.original),
                           "physical_bytes": self.native.stat().st_size}])

    def test_native_size_shrink_still_requires_valid_signature(self):
        self.native.write_bytes(self.original[:8])
        report, codesign = self.signed_check()
        self.assertEqual(report["status"], "pass", report)
        self.assertEqual(codesign.call_count, 2)

    def test_invalid_app_signature_stops_before_accepting_inventory(self):
        failure = subprocess.CompletedProcess([], 1, "", "invalid signature")
        report, codesign = self.signed_check(lambda *a, **k: failure)
        self.assertEqual(report["status"], "fail")
        self.assertEqual(report["errors"][0]["check"], "signed_app_signature")
        self.assertEqual(codesign.call_count, 1)
        self.assertNotIn("asar", report["stores"])

    def test_invalid_native_signature_is_not_accepted(self):
        self.native.write_bytes(self.original + b"corruption")
        calls = iter((subprocess.CompletedProcess([], 0, "", ""),
                      subprocess.CompletedProcess([], 1, "", "invalid native signature")))
        report, codesign = self.signed_check(lambda *a, **k: next(calls))
        self.assertEqual(report["status"], "fail")
        self.assertEqual(codesign.call_count, 2)
        self.assertIn("invalid native signature", report["errors"][0]["detail"])

    def test_non_macho_size_change_fails_before_local_verification(self):
        self.native.write_bytes(b"changed ordinary JavaScript payload")
        report, codesign = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertIn("not Mach-O", report["errors"][0]["detail"])
        self.assertEqual(codesign.call_count, 1)

    def test_missing_file_remains_failure(self):
        self.native.unlink()
        report, _ = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertTrue(any(e["check"] == "asar_structure" for e in report["errors"]))

    def test_external_symlink_remains_failure(self):
        external = self.root / "external.node"
        external.write_bytes(self.original + b"signature")
        self.native.unlink()
        self.native.symlink_to(external)
        report, _ = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertTrue(any("external symlink" in e["detail"] for e in report["errors"]))

    def test_internal_symlink_cannot_bypass_size_mismatch(self):
        target = self.native.parent / "other.node"
        target.write_bytes(self.original + b"signature")
        self.native.unlink()
        self.native.symlink_to(target.name)
        report, codesign = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertEqual(codesign.call_count, 1)

    def test_corrupt_asar_offsets_remain_failure(self):
        self.write_asar({"bad": {"size": 9, "offset": "1000"}})
        report, _ = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertTrue(any("out-of-bounds" in e["detail"] for e in report["errors"]))

    def test_retired_package_and_missing_required_package_remain_failure(self):
        self.write_asar({"playwright-core": {"files": {"index.js": {"size": 1, "offset": "0"}}}})
        (self.content / "node_modules/node-pty/package.json").unlink()
        report, _ = self.signed_check()
        self.assertEqual(report["status"], "fail")
        self.assertEqual(report["retired_packages"][0]["package"], "playwright-core")
        self.assertFalse(report["required_packages"]["node-pty"]["present"])

    def test_app_mutation_during_verification_remains_failure(self):
        def mutate(*args, **kwargs):
            (self.content / "product.json").write_text('{"changed":true}')
            return subprocess.CompletedProcess([], 0, "", "")
        report, _ = self.signed_check(mutate)
        self.assertEqual(report["status"], "fail")
        self.assertFalse(report["signed_app_state"]["unchanged"])
        self.assertTrue(any(e["check"] == "signed_app_state" for e in report["errors"]))


if __name__ == "__main__":
    unittest.main()
