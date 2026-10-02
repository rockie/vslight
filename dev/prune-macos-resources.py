#!/usr/bin/env python3
"""Consolidate document icons and prune native locales before macOS signing."""

import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import stat
import sys
import tempfile


LOCALES = frozenset('af am ar bg bn ca cs da de el en en_GB es es_419 et fa fi fil fr '
                    'gu he hi hr hu id it ja kn ko lt lv ml mr ms nb nl pl pt_BR pt_PT '
                    'ro ru sk sl sr sv sw ta te th tr uk ur vi zh_CN zh_TW'.split())
KEEP = frozenset(('en', 'en_GB', 'zh_CN', 'zh_TW'))
REQUIRED = frozenset(('en', 'zh_CN', 'zh_TW'))
GENDERS = ('_FEMININE', '_MASCULINE', '_NEUTER')
LOCALE_PATTERN = re.compile(r'([a-z]{2,3}(?:_(?:[A-Z]{2}|[0-9]{3}))?)(?:_(FEMININE|MASCULINE|NEUTER))?')


class ResourceError(Exception):
    pass


def inside(path, root):
    try:
        result = path.resolve(strict=True)
        result.relative_to(root)
        return result
    except (OSError, ValueError, RuntimeError) as error:
        raise ResourceError(f'Invalid or out-of-app resource path: {path}') from error


def check_tree(root, app):
    links = []
    for current, directories, files in os.walk(root, followlinks=False):
        for name in directories + files:
            path = Path(current) / name
            inside(path, app)
            mode = path.lstat().st_mode
            if stat.S_ISLNK(mode):
                links.append(path)
            if not (stat.S_ISREG(mode) or stat.S_ISDIR(mode) or stat.S_ISLNK(mode)):
                raise ResourceError(f'Unsupported resource file type: {path}')
    return links


def check_retained_links(links, removals):
    removed_paths = set(removals)
    for link in links:
        if any(parent in removed_paths for parent in (link, *link.parents)):
            continue
        target = link.resolve(strict=True)
        if any(parent in removed_paths for parent in (target, *target.parents)):
            raise ResourceError(f'Retained symlink points to a resource scheduled for deletion: {link} -> {target}')


def read_plist(path, app):
    inside(path, app)
    if path.is_symlink() or not path.is_file():
        raise ResourceError(f'Expected regular plist file: {path}')
    data = path.read_bytes()
    try:
        value = plistlib.loads(data)
    except Exception as error:
        raise ResourceError(f'Cannot parse plist: {path}: {error}') from error
    if not isinstance(value, dict):
        raise ResourceError(f'Expected dictionary plist: {path}')
    return data, value


def locale_name(name, declaration=False):
    if declaration:
        name = name.replace('-', '_')
    if name == 'Base':
        return name
    match = LOCALE_PATTERN.fullmatch(name)
    if not match or match.group(1) not in LOCALES:
        raise ResourceError(f'Unknown locale name or format: {name}')
    return match.group(1)


def update_localizations(value, path):
    if 'CFBundleLocalizations' in value:
        declared = value['CFBundleLocalizations']
        if not isinstance(declared, list) or not all(isinstance(name, str) for name in declared):
            raise ResourceError(f'Invalid CFBundleLocalizations: {path}')
        value['CFBundleLocalizations'] = [name for name in declared
                                         if locale_name(name, declaration=True) in KEEP | {'Base'}]
    if 'CFBundleDevelopmentRegion' in value and not isinstance(value['CFBundleDevelopmentRegion'], str):
        raise ResourceError(f'Invalid CFBundleDevelopmentRegion: {path}')
    value['CFBundleDevelopmentRegion'] = 'en'


def icon_path(name, resources, app):
    if (not isinstance(name, str) or not name or name in ('.', '..')
            or '/' in name or '\\' in name or Path(name).suffix not in ('', '.icns')):
        raise ResourceError(f'Invalid icon reference: {name!r}')
    path = resources / (name if name.endswith('.icns') else name + '.icns')
    resolved = inside(path, app)
    if resolved.parent != resources or not resolved.is_file():
        raise ResourceError(f'Icon is not a file in application Resources: {path}')
    return path


def icon_references(value, icon_field=False):
    if isinstance(value, str):
        if icon_field or value.endswith('.icns'):
            yield Path(value).name
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from icon_references(item, icon_field or 'icon' in key.lower())
    elif isinstance(value, list):
        for item in value:
            yield from icon_references(item, icon_field)


def file_totals(path):
    if path.is_symlink():
        return 0, 0
    if path.is_file():
        return 1, path.stat().st_size
    count = size = 0
    for current, _, files in os.walk(path, followlinks=False):
        for name in files:
            file = Path(current) / name
            if not file.is_symlink():
                count += 1
                size += file.stat().st_size
    return count, size


def apply_changes(app, updates, removals):
    if not updates and not removals:
        return
    transaction = Path(tempfile.mkdtemp(prefix='.prune-resources-', dir=app / 'Contents'))
    staged = []
    moved = []
    replaced = []
    try:
        # Stage every plist before touching either the original plists or resources.
        for index, (path, old, new) in enumerate(updates):
            staged_path = transaction / f'plist-{index}'
            backup_path = transaction / f'backup-{index}'
            mode = stat.S_IMODE(path.stat().st_mode)
            for destination, data in [(staged_path, new), (backup_path, old)]:
                with destination.open('wb') as stream:
                    stream.write(data)
                    stream.flush()
                    os.fsync(stream.fileno())
                destination.chmod(mode)
            if plistlib.loads(staged_path.read_bytes()) != plistlib.loads(new):
                raise ResourceError(f'Plist verification failed: {path}')
            staged.append((path, staged_path, backup_path))
        for index, path in enumerate(removals):
            destination = transaction / f'removed-{index}'
            os.rename(path, destination)
            moved.append((path, destination))
        for path, staged_path, backup_path in staged:
            os.replace(staged_path, path)
            replaced.append((path, backup_path))
    except Exception as error:
        # rename restores on the same filesystem even if a replace operation failed.
        for path, backup_path in reversed(replaced):
            os.rename(backup_path, path)
        for path, destination in reversed(moved):
            os.rename(destination, path)
        raise ResourceError(f'Resource transaction failed: {error}') from error
    finally:
        shutil.rmtree(transaction)


def prune(app):
    try:
        return _prune(Path(app))
    except ResourceError:
        raise
    except (OSError, ValueError, RuntimeError) as error:
        raise ResourceError(f'Resource validation failed: {error}') from error


def _prune(app):
    app = app.resolve(strict=True)
    if app.suffix != '.app' or not app.is_dir():
        raise ResourceError(f'Expected a macOS .app directory: {app}')
    main = inside(app / 'Contents/Resources', app)
    native = inside(app / 'Contents/Frameworks/Electron Framework.framework/Resources', app)
    if not main.is_dir() or not native.is_dir() or main == native:
        raise ResourceError('Expected distinct application and Electron Framework Resources directories')
    roots = [main, native]
    links = []
    for root in roots:
        links.extend(check_tree(root, app))
    plist_paths = [app / 'Contents/Info.plist', native / 'Info.plist']
    originals = [read_plist(path, app) for path in plist_paths]
    values = [copy.deepcopy(value) for _, value in originals]
    main_icon_name = values[0].get('CFBundleIconFile')
    main_icon = icon_path(main_icon_name, main, app)
    icon_hash = hashlib.sha256(main_icon.read_bytes()).digest()
    documents = values[0].get('CFBundleDocumentTypes', [])
    if not isinstance(documents, list) or not all(isinstance(document, dict) for document in documents):
        raise ResourceError(f'Invalid CFBundleDocumentTypes: {plist_paths[0]}')
    candidates = set()
    for document in documents:
        if 'CFBundleTypeIconFile' not in document:
            continue
        path = icon_path(document['CFBundleTypeIconFile'], main, app)
        if hashlib.sha256(path.read_bytes()).digest() != icon_hash:
            raise ResourceError(f'Document icon differs from application icon: {path}')
        candidates.add(path)
        document['CFBundleTypeIconFile'] = main_icon_name
    for value, path in zip(values, plist_paths):
        update_localizations(value, path)
    references = {name for value in values for name in icon_references(value)}
    icon_removals = [path for path in sorted(candidates)
                     if path.resolve() != main_icon.resolve()
                     and path.name not in references and path.stem not in references]
    locale_removals = []
    retained = {}
    for root in roots:
        present = set()
        kept = []
        directories = sorted(path for path in root.iterdir() if path.name.lower().endswith('.lproj'))
        for directory in directories:
            if not directory.name.endswith('.lproj'):
                raise ResourceError(f'Unknown locale directory suffix: {directory}')
            name = directory.name[:-len('.lproj')]
            base = locale_name(name)
            if directory.is_symlink() or not directory.is_dir():
                raise ResourceError(f'Expected a regular locale directory: {directory}')
            present.add(name)
            if base in KEEP or base == 'Base':
                kept.append(directory.name)
                if root == native and base != 'Base':
                    payload = directory / 'locale.pak'
                    if not payload.is_file() or payload.stat().st_size == 0:
                        raise ResourceError(f'Missing native locale payload: {payload}')
            else:
                locale_removals.append(directory)
        missing = REQUIRED - present
        if missing:
            raise ResourceError(f'Missing required locales in {root}: {", ".join(sorted(missing))}')
        retained[str(root.relative_to(app))] = kept
    essential = [native / name for name in ('icudtl.dat', 'resources.pak',
                                            'chrome_100_percent.pak', 'chrome_200_percent.pak')]
    snapshots = list(native.glob('v8_context_snapshot*.bin'))
    if not snapshots:
        raise ResourceError(f'Missing V8 context snapshot: {native}')
    essential += snapshots + [main / 'LICENSES.chromium.html']
    for path in essential:
        if not path.is_file() or path.stat().st_size == 0:
            raise ResourceError(f'Missing required runtime resource: {path}')
    check_retained_links(links, icon_removals + locale_removals)
    updates = []
    for path, (original, value), replacement in zip(plist_paths, originals, values):
        if value != replacement:
            fmt = plistlib.FMT_BINARY if original.startswith(b'bplist00') else plistlib.FMT_XML
            serialized = plistlib.dumps(replacement, fmt=fmt, sort_keys=False)
            if plistlib.loads(serialized) != replacement:
                raise ResourceError(f'Plist serialization verification failed: {path}')
            updates.append((path, original, serialized))
    icon_count, icon_bytes = map(sum, zip(*(file_totals(path) for path in icon_removals))) if icon_removals else (0, 0)
    locale_count, locale_bytes = map(sum, zip(*(file_totals(path) for path in locale_removals))) if locale_removals else (0, 0)
    report = {
        'app': str(app), 'main_icon': main_icon_name,
        'icons': {'deleted_files': icon_count, 'deleted_bytes': icon_bytes},
        'locales': {'deleted_files': locale_count, 'deleted_bytes': locale_bytes,
                    'deleted_directories': len(locale_removals), 'retained': retained},
        'deleted_files': icon_count + locale_count, 'deleted_bytes': icon_bytes + locale_bytes,
        'plist_updates': [str(path.relative_to(app)) for path, _, _ in updates],
        'plist_bytes_delta': sum(len(new) - len(old) for _, old, new in updates),
    }
    apply_changes(app, updates, icon_removals + locale_removals)
    return report


def main():
    if sys.version_info < (3, 11):
        print('prune-macos-resources requires Python 3.11 or newer', file=sys.stderr)
        return 1
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('app', type=Path, help='unsigned macOS app produced by packing')
    args = parser.parse_args()
    try:
        print(json.dumps(prune(args.app), indent=2))
    except ResourceError as error:
        print(f'prune-macos-resources: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
