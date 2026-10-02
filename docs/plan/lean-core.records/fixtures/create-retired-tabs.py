#!/usr/bin/env python3
"""Build synthetic retired-tab cases from an explicitly supplied test profile."""

import argparse
import base64
import copy
import hashlib
import json
import pathlib
import shutil
import sqlite3
import tempfile
from datetime import datetime, timezone


KEY = 'memento/workbench.parts.editor'
BROWSER_ID = 'workbench.editorinputs.browser'
CHAT_ID = 'workbench.input.chatSession'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def profile_inventory(root):
    files = []
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            files.append({'path': path.relative_to(root).as_posix(), 'symlink': str(path.readlink())})
        elif path.is_file():
            files.append({'path': path.relative_to(root).as_posix(), 'sha256': digest(path.read_bytes())})
    return {'files': files, 'sha256': digest(json.dumps(files, sort_keys=True).encode())}


def verify_sources(repo):
    paths = {
        'browser': 'vscode/src/vs/workbench/contrib/browserView/common/browserEditorInput.ts',
        'chat': 'vscode/src/vs/workbench/contrib/chat/browser/widgetHosts/editor/chatEditorInput.ts',
        'chat_uri': 'vscode/src/vs/workbench/contrib/chat/common/model/chatUri.ts',
        'network': 'vscode/src/vs/base/common/network.ts',
        'uri': 'vscode/src/vs/base/common/uri.ts',
        'uri_id': 'vscode/src/vs/base/common/marshallingIds.ts',
        'sessions': 'vscode/src/vs/workbench/contrib/chat/common/chatSessionsService.ts',
        'unit_serializer': 'vscode/src/vs/workbench/test/browser/parts/editor/editorGroupModel.test.ts'
    }
    texts = {key: (repo / path).read_text() for key, path in paths.items()}
    required = {
        'browser': [BROWSER_ID, 'JSON.stringify(editorInput.serialize())', 'url: this.url', 'title: this.title', 'id: this._id'],
        'chat': [CHAT_ID, 'options: input.options', 'sessionResource: input.sessionResource', 'resource: input.resource', 'JSON.stringify(obj)'],
        'chat_uri': ['encodeBase64', 'false, true', "path: '/' + encodedId", 'authority: localChatSessionType'],
        'network': ["vscodeChatEditor = 'vscode-chat-editor'", "vscodeLocalChatSession = 'vscode-chat-session'"],
        'uri': ['$mid: MarshalledId.Uri', 'res.authority = this.authority', 'res.scheme = this.scheme'],
        'uri_id': ['Uri = 1'],
        'sessions': ["export const Local = 'local'", 'localChatSessionType = SessionType.Local'],
        'unit_serializer': ['testEditorInputForGroups', 'id: testEditorInput.id', 'JSON.stringify(testInput)']
    }
    for key, fragments in required.items():
        for fragment in fragments:
            if fragment not in texts[key]:
                raise ValueError(f'Serializer source changed; review {paths[key]} before generating fixtures: {fragment}')
    return [{'path': path, 'sha256': digest((repo / path).read_bytes())} for path in paths.values()]


def leaves(node, path=()):
    if node.get('type') == 'leaf':
        yield path + ('data',), node.get('data')
    elif node.get('type') == 'branch':
        for index, child in enumerate(node['data']):
            yield from leaves(child, path + ('data', index))
    else:
        raise ValueError('Unknown serializedGrid node shape.')


def locate_group(source, workspace_id):
    candidates = []
    storage = source / 'User/workspaceStorage'
    for database in sorted(storage.glob('*/state.vscdb')):
        if not database.resolve().is_relative_to(source):
            raise ValueError('Source workspace database points outside the explicitly supplied test profile.')
        if workspace_id and database.parent.name != workspace_id:
            continue
        wal = database.with_name(database.name + '-wal')
        if wal.exists() and wal.stat().st_size:
            raise ValueError('Source workspace SQLite has a nonempty WAL; close the test app before copying.')
        with sqlite3.connect(database.as_uri() + '?mode=ro&immutable=1', uri=True) as connection:
            row = connection.execute('SELECT value FROM ItemTable WHERE key=?', (KEY,)).fetchone()
        if not row:
            continue
        state = json.loads(row[0])
        root = state.get('editorpart.state', {}).get('serializedGrid', {}).get('root')
        if not root:
            continue
        for group_path, group in leaves(root):
            if isinstance(group, dict) and isinstance(group.get('editors'), list) and isinstance(group.get('mru'), list):
                ordinary = [editor for editor in group['editors'] if editor['id'] not in (BROWSER_ID, CHAT_ID)]
                if len(ordinary) >= 2:
                    candidates.append((database, state, group_path, group))
    if len(candidates) > 1:
        active = [item for item in candidates if item[3].get('id') == item[1]['editorpart.state'].get('activeGroup')]
        if len(active) == 1:
            return active[0]
        raise ValueError('Multiple suitable groups; choose a source with one active ordinary editor group.')
    return candidates[0] if candidates else None


def retired_editors():
    encoded_id = base64.urlsafe_b64encode(b'lean-fixture-session').decode().rstrip('=')
    uri = {'$mid': 1, 'scheme': 'vscode-chat-session', 'authority': 'local', 'path': '/' + encoded_id}
    browser = {'id': BROWSER_ID, 'value': json.dumps({
        'id': 'lean-fixture-browser', 'url': 'http://127.0.0.1:18765/lean-fixture', 'title': 'Lean fixture browser'
    }, separators=(',', ':'))}
    chat = {'id': CHAT_ID, 'value': json.dumps({'options': {}, 'sessionResource': uri, 'resource': uri}, separators=(',', ':'))}
    return browser, chat


def expectations(group):
    surviving = [index for index, editor in enumerate(group['editors']) if editor['id'] not in (BROWSER_ID, CHAT_ID)]
    mru = [index for index in group['mru'] if index in surviving]
    preview = group.get('preview')
    return {
        'surviving_original_indices': surviving,
        'mru_original_indices': mru,
        'active_original_index': mru[0] if mru else None,
        'preview_original_index': preview if preview in surviving else None,
        'sticky_count': sum(index <= group.get('sticky', -1) for index in surviving),
        'sequential': [copy.deepcopy(group['editors'][index]) for index in surviving],
        'mru': [copy.deepcopy(group['editors'][index]) for index in mru],
        'active': copy.deepcopy(group['editors'][mru[0]]) if mru else None,
        'preview': copy.deepcopy(group['editors'][preview]) if preview in surviving else None
    }


def cases(original, retired_kind):
    ordinary = [copy.deepcopy(editor) for editor in original['editors'] if editor['id'] not in (BROWSER_ID, CHAT_ID)]
    browser, chat = retired_editors()
    if retired_kind == 'browser':
        chat = copy.deepcopy(browser)
        second = json.loads(chat['value'])
        second['id'] = 'lean-fixture-browser-2'
        chat['value'] = json.dumps(second, separators=(',', ':'))
    for category, variant in [('mru-active', 'retained-active'), ('mru-active', 'retired-active'),
                              ('retired-preview', 'default'), ('consecutive-sticky', 'default'),
                              ('all-retired', 'default'), ('no-retired', 'default')]:
        group = {'id': original['id'], 'editors': [browser] + ordinary,
                 'mru': [1] + list(range(2, len(ordinary) + 1)) + [0]}
        if 'locked' in original:
            group['locked'] = original['locked']
        if variant == 'retired-active':
            group['mru'] = [0] + list(range(len(ordinary), 0, -1))
        elif category == 'retired-preview':
            group['preview'] = 0
        elif category == 'consecutive-sticky':
            group['editors'] = [browser, chat] + ordinary
            group['mru'] = list(range(2, len(ordinary) + 2)) + [1, 0]
            group['sticky'] = 1
        elif category == 'all-retired':
            group.update(editors=[browser, chat], mru=[1, 0], preview=0, sticky=1)
        elif category == 'no-retired':
            group = copy.deepcopy(original)
            if any(editor['id'] in (BROWSER_ID, CHAT_ID) for editor in group['editors']):
                raise ValueError('The no-retired control requires a source group with only ordinary editors.')
        for editor in group['editors']:
            if editor['id'] not in (BROWSER_ID, CHAT_ID) and editor not in ordinary:
                raise ValueError('Ordinary editor data changed during construction.')
        yield category, variant, group


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-profile', type=pathlib.Path, required=True)
    parser.add_argument('--source-app-version', required=True, help='Version of the app that actually generated the test profile.')
    parser.add_argument('--repo-root', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[4])
    parser.add_argument('--workspace-id')
    parser.add_argument('--preparation-metadata', type=pathlib.Path)
    parser.add_argument('--source-artifact-record', type=pathlib.Path)
    parser.add_argument('--retired-kind', choices=['both', 'browser'], default='both')
    parser.add_argument('--allow-unit-fallback', action='store_true')
    args = parser.parse_args()
    source = args.source_profile.resolve(strict=True)
    if not source.is_relative_to(pathlib.Path('/tmp').resolve()) or not (source / 'User').is_dir():
        raise ValueError('Only explicitly supplied temporary test profiles under /tmp are accepted.')
    evidence = verify_sources(args.repo_root.resolve(strict=True))
    preparation = None
    artifact = None
    if args.preparation_metadata:
        preparation = json.loads(args.preparation_metadata.read_text())
        if not preparation.get('appVersion') or preparation.get('status') != 'PREPARED_AWAITING_SHUTDOWN_STATE':
            raise ValueError('Preparation metadata lacks the API version or successful preparation status.')
    if args.source_artifact_record:
        artifact = json.loads(args.source_artifact_record.read_text())
        if artifact.get('version') != args.source_app_version:
            raise ValueError('Generation app version does not match the source artifact record.')
    before = profile_inventory(source)
    located = locate_group(source, args.workspace_id)
    if not located and not args.allow_unit_fallback:
        raise ValueError('No saved editorpart.state group with at least two ordinary inputs. Use --allow-unit-fallback only for explicitly labeled unit states.')
    mode = 'synthetic-profile' if located else 'unit-state-only'
    gap = None if located else 'No persisted workspace state.vscdb/editorpart.state with two ordinary editors; copied profiles are unmodified evidence and are not GUI restore fixtures.'
    original = located[3] if located else {
        'id': 1, 'editors': [{'id': 'testEditorInputForGroups', 'value': json.dumps({'id': label})} for label in ('A', 'B')],
        'mru': [1, 0], 'preview': 1, 'sticky': 0
    }
    for editor in original['editors']:
        if not isinstance(editor.get('value'), str):
            raise ValueError('Expected serialized editor.value to be an untouched string.')
    output = pathlib.Path(tempfile.mkdtemp(prefix='lr-', dir='/tmp'))
    manifest = {
        'created_at': datetime.now(timezone.utc).isoformat(), 'mode': mode, 'gap': gap,
        'source_profile': str(source), 'source_profile_inventory': before,
        'source_app_version': args.source_app_version,
        'source_api_version': preparation.get('appVersion') if preparation else None,
        'source_version_provenance': 'source artifact record' if artifact else 'operator-supplied generation version',
        'source_artifact_record': {'path': str(args.source_artifact_record), 'sha256': digest(args.source_artifact_record.read_bytes()),
                                   'artifact': artifact} if artifact else None,
        'preparation_metadata': preparation,
        'serializer_sources': evidence, 'source_group': original,
        'source_workspace_database': str(located[0].relative_to(source)) if located else None,
        'source_group_path': list(located[2]) if located else None,
        'retired_kind': args.retired_kind,
        'construction': 'Copy source profile; preserve ordinary {id,value} exactly; add Browser/Chat serializer-format strings; set old-index MRU/preview/sticky explicitly; no service/GUI execution.',
        'cases': []
    }
    for category, variant, group in cases(original, args.retired_kind):
        case_number = len(manifest['cases']) + 1
        destination = output / str(case_number)
        destination.mkdir(parents=True)
        profile = destination / 'p'
        shutil.copytree(source, profile, symlinks=True)
        write_json(destination / 'group.before.json', original)
        write_json(destination / 'group.after.json', group)
        expected = expectations(group)
        write_json(destination / 'expected.json', expected)
        if located:
            database, state, group_path, _ = located
            state = copy.deepcopy(state)
            node = state['editorpart.state']['serializedGrid']['root']
            for component in group_path[:-1]:
                node = node[component]
            node[group_path[-1]] = group
            state['editorpart.state']['activeGroup'] = group['id']
            with sqlite3.connect(profile / database.relative_to(source)) as connection:
                connection.execute('UPDATE ItemTable SET value=? WHERE key=?', (json.dumps(state), KEY))
        manifest['cases'].append({'category': category, 'variant': variant, 'profile': str(profile),
                                  'usable_for_gui_restore': bool(located), 'group_state': str(destination / 'group.after.json'),
                                  'expected': expected})
    if profile_inventory(source) != before:
        raise RuntimeError('Source profile changed during generation; output provenance is invalid.')
    write_json(output / 'manifest.json', manifest)
    print(json.dumps({'output': str(output), 'manifest': str(output / 'manifest.json'), 'mode': mode,
                      'categories': 5, 'variants': len(manifest['cases']), 'gap': gap}, ensure_ascii=False))


if __name__ == '__main__':
    main()
