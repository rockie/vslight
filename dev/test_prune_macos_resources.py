import importlib.util
import json
import os
from pathlib import Path
import plistlib
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


sys.dont_write_bytecode = True
SCRIPT = Path(__file__).with_name('prune-macos-resources.py')
spec = importlib.util.spec_from_file_location('prune_macos_resources', SCRIPT)
resources = importlib.util.module_from_spec(spec)
spec.loader.exec_module(resources)


def snapshot(root):
    return {
        str(path.relative_to(root)): ('link', os.readlink(path)) if path.is_symlink()
        else ('dir',) if path.is_dir() else ('file', path.read_bytes(), path.stat().st_mode)
        for path in root.rglob('*')
    }


class ResourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.app = self.root / 'Editor Insider.app'
        self.main = self.app / 'Contents/Resources'
        self.framework = self.app / 'Contents/Frameworks/Electron Framework.framework'
        self.native = self.framework / 'Versions/A/Resources'
        self.main.mkdir(parents=True)
        self.native.mkdir(parents=True)
        (self.framework / 'Versions/Current').symlink_to('A', target_is_directory=True)
        (self.framework / 'Resources').symlink_to('Versions/Current/Resources', target_is_directory=True)
        self.plist = self.app / 'Contents/Info.plist'
        self.framework_plist = self.native / 'Info.plist'
        self.initial = {
            'CFBundleIconFile': 'Editor Insider.icns',
            'CFBundleIdentifier': 'test.editor',
            'CFBundleDocumentTypes': [
                {'CFBundleTypeIconFile': 'python.icns', 'CFBundleTypeName': 'Python',
                 'CFBundleTypeRole': 'Editor', 'CFBundleTypeExtensions': ['py'],
                 'LSItemContentTypes': ['public.python-script']},
                {'CFBundleTypeIconFile': 'text.icns', 'CFBundleTypeName': 'Text'},
                {'CFBundleTypeName': 'No icon', 'LSHandlerRank': 'Alternate'},
            ],
            'CFBundleURLTypes': [{'CFBundleURLName': 'test', 'CFBundleURLSchemes': ['editor']}],
            'ArbitraryData': {'enabled': True, 'integer': 7, 'bytes': b'unchanged'},
        }
        self.write_plist(self.plist, self.initial)
        self.write_plist(self.framework_plist, {'CFBundleIdentifier': 'test.electron'})
        for name in ['Editor Insider.icns', 'python.icns', 'text.icns']:
            (self.main / name).write_bytes(b'icon-payload')
        for root in [self.main, self.native]:
            for name in ['en', 'en_GB', 'zh_CN', 'zh_TW', 'fr', 'de', 'Base']:
                directory = root / (name + '.lproj')
                directory.mkdir()
                if root == self.native and name != 'Base':
                    (directory / 'locale.pak').write_bytes((name + ' translated').encode())
            for locale in ['en', 'en_GB', 'zh_CN', 'zh_TW', 'fr']:
                for gender in ['FEMININE', 'MASCULINE', 'NEUTER']:
                    directory = root / (locale + '_' + gender + '.lproj')
                    directory.mkdir()
                    if root == self.native:
                        (directory / 'locale.pak').write_bytes(b'variant')
        for name in ['icudtl.dat', 'resources.pak', 'chrome_100_percent.pak',
                     'chrome_200_percent.pak', 'v8_context_snapshot.arm64.bin']:
            (self.native / name).write_bytes(b'essential')
        (self.main / 'LICENSES.chromium.html').write_bytes(b'license')
        (self.main / 'app').mkdir()
        (self.main / 'app/editor.js').write_bytes(b'ordinary editor')

    def write_plist(self, path, value, fmt=plistlib.FMT_XML):
        path.write_bytes(plistlib.dumps(value, fmt=fmt, sort_keys=False))

    def assert_rejected_without_change(self):
        before = snapshot(self.app)
        with self.assertRaises(resources.ResourceError):
            resources.prune(self.app)
        self.assertEqual(snapshot(self.app), before)

    def test_icons_and_non_icon_document_data(self):
        report = resources.prune(self.app)
        expected = dict(self.initial)
        expected['CFBundleDevelopmentRegion'] = 'en'
        expected['CFBundleDocumentTypes'] = [dict(document) for document in self.initial['CFBundleDocumentTypes']]
        for document in expected['CFBundleDocumentTypes']:
            if 'CFBundleTypeIconFile' in document:
                document['CFBundleTypeIconFile'] = 'Editor Insider.icns'
        self.assertEqual(plistlib.loads(self.plist.read_bytes()), expected)
        self.assertEqual(sorted(x.name for x in self.main.glob('*.icns')), ['Editor Insider.icns'])
        self.assertEqual(report['icons']['deleted_files'], 2)
        self.assertEqual(report['icons']['deleted_bytes'], 2 * len(b'icon-payload'))

    def test_retains_all_four_locales_variants_base_and_runtime(self):
        resources.prune(self.app)
        expected = {'Base.lproj'} | {locale + suffix + '.lproj'
                    for locale in ['en', 'en_GB', 'zh_CN', 'zh_TW']
                    for suffix in ['', '_FEMININE', '_MASCULINE', '_NEUTER']}
        for root in [self.main, self.native]:
            self.assertEqual({p.name for p in root.glob('*.lproj')}, expected)
        for name in ['icudtl.dat', 'resources.pak', 'chrome_100_percent.pak',
                     'chrome_200_percent.pak', 'v8_context_snapshot.arm64.bin']:
            self.assertEqual((self.native / name).read_bytes(), b'essential')
        self.assertEqual((self.main / 'LICENSES.chromium.html').read_bytes(), b'license')
        self.assertEqual((self.main / 'app/editor.js').read_bytes(), b'ordinary editor')

    def test_framework_alias_scanned_once_and_counts_physical_files(self):
        report = resources.prune(self.app)
        self.assertEqual(report['locales']['deleted_files'], 5)
        self.assertEqual(report['locales']['deleted_directories'], 10)
        self.assertEqual(len(report['locales']['retained']), 2)
        self.assertTrue((self.framework / 'Resources').is_symlink())
        self.assertTrue((self.framework / 'Versions/Current').is_symlink())

    def test_idempotence(self):
        resources.prune(self.app)
        before = snapshot(self.app)
        report = resources.prune(self.app)
        self.assertEqual(snapshot(self.app), before)
        self.assertEqual(report['deleted_files'], 0)
        self.assertEqual(report['deleted_bytes'], 0)
        self.assertEqual(report['plist_updates'], [])

    def test_other_plist_reference_keeps_duplicate(self):
        value = dict(self.initial, OtherIcon='python.icns')
        self.write_plist(self.plist, value)
        resources.prune(self.app)
        self.assertTrue((self.main / 'python.icns').exists())
        self.assertFalse((self.main / 'text.icns').exists())

    def test_document_extension_names_are_not_icon_references(self):
        value = dict(self.initial)
        value['CFBundleDocumentTypes'] = [dict(document) for document in value['CFBundleDocumentTypes']]
        value['CFBundleDocumentTypes'][0]['CFBundleTypeExtensions'] = ['python', 'text']
        self.write_plist(self.plist, value)
        report = resources.prune(self.app)
        self.assertEqual(report['icons']['deleted_files'], 2)

    def test_icon_without_extension(self):
        value = dict(self.initial, CFBundleIconFile='Editor Insider')
        self.write_plist(self.plist, value)
        resources.prune(self.app)
        docs = plistlib.loads(self.plist.read_bytes())['CFBundleDocumentTypes']
        self.assertEqual(docs[0]['CFBundleTypeIconFile'], 'Editor Insider')

    def test_different_icon_hash_fails_before_locale_or_plist_mutation(self):
        (self.main / 'python.icns').write_bytes(b'future unique document icon')
        self.assert_rejected_without_change()

    def test_missing_document_icon_and_main_icon(self):
        for name in ['python.icns', 'Editor Insider.icns']:
            with self.subTest(name=name):
                file = self.main / name
                data = file.read_bytes()
                file.unlink()
                self.assert_rejected_without_change()
                file.write_bytes(data)

    def test_icon_path_traversal_and_absolute_path(self):
        for name in ['../python.icns', str(self.main / 'python.icns'), 'folder/python.icns']:
            with self.subTest(name=name):
                value = dict(self.initial, CFBundleIconFile=name)
                self.write_plist(self.plist, value)
                self.assert_rejected_without_change()

    def test_external_icon_symlink(self):
        outside = self.root / 'outside.icns'
        outside.write_bytes(b'icon-payload')
        (self.main / 'python.icns').unlink()
        (self.main / 'python.icns').symlink_to(outside)
        self.assert_rejected_without_change()

    def test_external_framework_resources_symlink(self):
        outside = self.root / 'external-resources'
        outside.mkdir()
        (self.framework / 'Resources').unlink()
        (self.framework / 'Resources').symlink_to(outside, target_is_directory=True)
        self.assert_rejected_without_change()

    def test_external_symlink_in_locale_fails(self):
        outside = self.root / 'outside.pak'
        outside.write_bytes(b'outside')
        (self.native / 'fr.lproj/extra.pak').symlink_to(outside)
        self.assert_rejected_without_change()
        self.assertEqual(outside.read_bytes(), b'outside')

    def test_missing_required_locales_and_native_payload(self):
        for locale in ['en', 'zh_CN', 'zh_TW']:
            with self.subTest(locale=locale):
                path = self.native / (locale + '.lproj/locale.pak')
                data = path.read_bytes()
                path.unlink()
                self.assert_rejected_without_change()
                path.write_bytes(data)
        path = self.main / 'zh_CN.lproj'
        path.rmdir()
        self.assert_rejected_without_change()

    def test_unknown_locale_and_wrong_whitelist_format(self):
        for name in ['xx.lproj', 'zh-CN.lproj', 'en_GB_unknown.lproj', 'en_UNKNOWN.lproj']:
            with self.subTest(name=name):
                path = self.native / name
                path.mkdir()
                self.assert_rejected_without_change()
                path.rmdir()

    def test_missing_runtime_resource_fails_before_mutation(self):
        (self.native / 'icudtl.dat').unlink()
        self.assert_rejected_without_change()

    def test_invalid_plist_structures(self):
        for value in [[], dict(self.initial, CFBundleDocumentTypes={}),
                      dict(self.initial, CFBundleDocumentTypes=[7]),
                      dict(self.initial, CFBundleIconFile=12),
                      dict(self.initial, CFBundleLocalizations='en')]:
            with self.subTest(value=value):
                self.write_plist(self.plist, value)
                self.assert_rejected_without_change()
        self.plist.write_bytes(b'not a plist')
        self.assert_rejected_without_change()

    def test_optional_localizations_and_english_fallback(self):
        for path, value in [(self.plist, self.initial), (self.framework_plist, {'CFBundleIdentifier': 'test.electron'})]:
            value = dict(value, CFBundleLocalizations=['en', 'en-GB', 'zh-CN', 'zh-TW', 'fr', 'Base'],
                         CFBundleDevelopmentRegion='fr')
            self.write_plist(path, value)
        resources.prune(self.app)
        for path in [self.plist, self.framework_plist]:
            value = plistlib.loads(path.read_bytes())
            self.assertEqual(value['CFBundleLocalizations'], ['en', 'en-GB', 'zh-CN', 'zh-TW', 'Base'])
            self.assertEqual(value['CFBundleDevelopmentRegion'], 'en')

    def test_absent_localizations_not_created_and_binary_format_retained(self):
        self.write_plist(self.plist, self.initial, plistlib.FMT_BINARY)
        resources.prune(self.app)
        self.assertTrue(self.plist.read_bytes().startswith(b'bplist00'))
        self.assertNotIn('CFBundleLocalizations', plistlib.loads(self.plist.read_bytes()))
        self.assertNotIn('CFBundleLocalizations', plistlib.loads(self.framework_plist.read_bytes()))

    def test_atomic_replacement_failure_rolls_back_all_changes(self):
        before = snapshot(self.app)
        original = resources.os.replace
        calls = []

        def replace(source, destination):
            calls.append(destination)
            if len(calls) == 2:
                raise OSError('simulated replace failure')
            original(source, destination)

        with mock.patch.object(resources.os, 'replace', side_effect=replace):
            with self.assertRaises(resources.ResourceError):
                resources.prune(self.app)
        self.assertEqual(len(calls), 2)
        self.assertEqual(snapshot(self.app), before)

    def test_plist_staging_failure_leaves_app_unchanged(self):
        before = snapshot(self.app)
        with mock.patch.object(resources.os, 'fsync', side_effect=OSError('simulated disk failure')):
            with self.assertRaises(resources.ResourceError):
                resources.prune(self.app)
        self.assertEqual(snapshot(self.app), before)

    def test_locale_link_cannot_make_retained_resource_dangle(self):
        (self.native / 'en.lproj/linked.pak').symlink_to('../fr.lproj/locale.pak')
        self.assert_rejected_without_change()

    def test_ordinary_resource_link_cannot_make_icon_dangle(self):
        (self.main / 'app/document-icon.icns').symlink_to('../python.icns')
        self.assert_rejected_without_change()

    def test_case_mismatch_in_locale_name_fails(self):
        original = self.native / 'en_FEMININE.lproj'
        temporary = self.native / 'renaming'
        original.rename(temporary)
        temporary.rename(self.native / 'en_feminine.lproj')
        self.assert_rejected_without_change()

    def test_case_mismatch_in_locale_directory_suffix_fails(self):
        original = self.native / 'fr.lproj'
        temporary = self.native / 'renaming'
        original.rename(temporary)
        temporary.rename(self.native / 'fr.LPROJ')
        self.assert_rejected_without_change()

    def test_framework_plist_reference_keeps_icon_copy(self):
        self.write_plist(self.framework_plist, {'SharedIcon': 'python'})
        resources.prune(self.app)
        self.assertTrue((self.main / 'python.icns').exists())

    def test_cli_nonzero_and_json_summary(self):
        result = subprocess.run([sys.executable, str(SCRIPT), str(self.app)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['icons']['deleted_files'], 2)
        (self.native / 'zh_CN.lproj/locale.pak').unlink()
        before = snapshot(self.app)
        result = subprocess.run([sys.executable, str(SCRIPT), str(self.app)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('zh_CN', result.stderr)
        self.assertEqual(snapshot(self.app), before)


if __name__ == '__main__':
    unittest.main()
