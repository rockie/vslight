'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const FILE_INPUT = 'workbench.editors.files.fileEditorInput';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const within = (child, parent) => child === parent || child.startsWith(parent + path.sep);

function temporaryPath(value, name) {
  assert.ok(typeof value === 'string' && path.isAbsolute(value), `${name} must be an absolute isolated /tmp path.`);
  const resolved = path.resolve(value);
  assert.ok(within(resolved, '/tmp') || within(resolved, '/private/tmp'), `${name} must stay under /tmp.`);
  return resolved;
}

function ordinaryUri(editor) {
  assert.equal(editor?.id, FILE_INPUT, 'Expected an ordinary file editor serializer.');
  const value = JSON.parse(editor.value);
  assert.equal(value.resourceJSON?.scheme, 'file');
  const uri = new URL(value.resourceJSON.external);
  assert.equal(uri.protocol, 'file:');
  assert.equal(decodeURIComponent(uri.pathname), value.resourceJSON.path);
  return uri.href;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function loadCase(input) {
  const casePath = temporaryPath(input, 'LEAN_RESTORE_CASE');
  const document = await readJson(casePath);
  const groupPath = document.group_state ? temporaryPath(document.group_state, 'group_state') : casePath;
  assert.equal(path.basename(groupPath), 'group.after.json', 'Use the generated group.after.json or a manifest case entry.');
  const manifestPath = path.join(path.dirname(path.dirname(groupPath)), 'manifest.json');
  const manifest = await readJson(manifestPath);
  assert.equal(manifest.mode, 'synthetic-profile', 'A unit-state fallback is not a real restore fixture.');
  assert.equal(manifest.gap, null);
  assert.match(manifest.source_profile_inventory?.sha256 || '', /^[a-f0-9]{64}$/);
  assert.ok(manifest.source_app_version && manifest.source_api_version);
  const matches = manifest.cases.filter(entry => path.resolve(entry.group_state) === groupPath);
  assert.equal(matches.length, 1, 'Case must uniquely match its source manifest.');
  const entry = matches[0];
  assert.equal(entry.usable_for_gui_restore, true);
  if (document.group_state) assert.deepStrictEqual(document, entry, 'Case descriptor must be the unmodified manifest entry.');
  const group = document.group_state ? await readJson(groupPath) : document;
  const expected = await readJson(path.join(path.dirname(groupPath), 'expected.json'));
  assert.deepStrictEqual(expected, entry.expected, 'Expected file and manifest disagree.');
  assert.ok(Array.isArray(group.editors) && Array.isArray(group.mru));
  assert.ok(Array.isArray(expected.sequential) && Array.isArray(expected.mru));
  assert.ok(Number.isInteger(expected.sticky_count) && expected.sticky_count >= 0 && expected.sticky_count <= expected.sequential.length);
  assert.equal(expected.surviving_original_indices.length, expected.sequential.length);
  expected.surviving_original_indices.forEach((index, i) => {
    assert.ok(Number.isInteger(index) && index >= 0 && index < group.editors.length);
    assert.deepStrictEqual(group.editors[index], expected.sequential[i], 'Ordinary payload changed.');
  });
  const sourceEditors = manifest.source_group.editors;
  assert.equal(sourceEditors.length, 2, 'This runner accepts the prepared A/B source only.');
  const sourceUris = sourceEditors.map(ordinaryUri);
  assert.deepStrictEqual(sourceUris.map(uri => path.basename(new URL(uri).pathname)), ['A.txt', 'B.txt']);
  const workspace = temporaryPath(manifest.preparation_metadata?.workspace, 'source workspace');
  assert.deepStrictEqual(sourceUris, manifest.preparation_metadata.documents);
  for (const editor of expected.sequential) {
    assert.ok(sourceEditors.some(source => same(source, editor)), 'Retained ordinary payload must equal the source payload.');
  }
  const uris = expected.sequential.map(ordinaryUri);
  assert.equal(new Set(uris).size, uris.length);
  assert.deepStrictEqual(uris, entry.category === 'all-retired' ? [] : sourceUris);
  for (const editor of expected.mru) assert.ok(expected.sequential.some(retained => same(retained, editor)));
  assert.equal(expected.mru.length, expected.sequential.length);
  assert.equal(new Set(expected.mru.map(ordinaryUri)).size, expected.mru.length);
  for (const name of ['active', 'preview']) {
    if (expected[name] !== null) assert.ok(expected.sequential.some(editor => same(editor, expected[name])), `Invalid ${name} expectation.`);
  }
  assert.equal(expected.active === null, uris.length === 0);
  assert.ok(manifest.source_workspace_database && !path.isAbsolute(manifest.source_workspace_database) && !manifest.source_workspace_database.split('/').includes('..'));
  assert.ok(Array.isArray(manifest.source_group_path));
  return {
    casePath, groupPath, manifestPath, category: entry.category, variant: entry.variant,
    profile: temporaryPath(entry.profile, 'generated profile'), workspace,
    source: {
      profile: temporaryPath(manifest.source_profile, 'source profile'),
      profileSha256: manifest.source_profile_inventory.sha256,
      appVersion: manifest.source_app_version, apiVersion: manifest.source_api_version,
      workspaceDatabase: manifest.source_workspace_database, groupPath: manifest.source_group_path
    },
    expected: {
      tabs: uris.map((uri, index) => ({
        uri, isActive: same(expected.sequential[index], expected.active),
        isPreview: same(expected.sequential[index], expected.preview), isPinned: index < expected.sticky_count
      })),
      activeUri: expected.active === null ? null : ordinaryUri(expected.active),
      previewUri: expected.preview === null ? null : ordinaryUri(expected.preview),
      stickyCount: expected.sticky_count, mruUris: expected.mru.map(ordinaryUri)
    }
  };
}

function observe(vscode) {
  const all = vscode.window.tabGroups.all;
  let active;
  try { active = vscode.window.tabGroups.activeTabGroup; } catch { /* API model not initialized yet. */ }
  return {
    initialized: all.length > 0 && all.includes(active),
    groups: all.map(group => ({
      viewColumn: group.viewColumn, isActive: group.isActive, isActiveGroup: group === active,
      activeTabIndex: group.activeTab ? group.tabs.indexOf(group.activeTab) : -1,
      tabs: group.tabs.map(tab => ({
        inputType: tab.input instanceof vscode.TabInputText ? 'TabInputText' : 'Other',
        uri: tab.input instanceof vscode.TabInputText ? tab.input.uri.toString() : null,
        label: tab.label, isActive: tab.isActive, isPreview: tab.isPreview, isPinned: tab.isPinned, isDirty: tab.isDirty
      }))
    }))
  };
}

async function waitForStableTabs(vscode, fixture) {
  const started = Date.now();
  let lastChanged = started;
  let previous;
  const events = { tabs: 0, groups: 0 };
  const subscriptions = [
    vscode.window.tabGroups.onDidChangeTabs(() => { events.tabs++; lastChanged = Date.now(); }),
    vscode.window.tabGroups.onDidChangeTabGroups(() => { events.groups++; lastChanged = Date.now(); })
  ];
  const minimumMs = fixture.expected.tabs.length === 0 ? 15000 : 3000;
  const quietMs = 1500;
  const timeoutMs = 30000;
  try {
    while (true) {
      const observed = observe(vscode);
      const snapshot = JSON.stringify(observed);
      if (snapshot !== previous) { lastChanged = Date.now(); previous = snapshot; }
      const elapsedMs = Date.now() - started;
      const quietForMs = Date.now() - lastChanged;
      // Never accept an initial empty array: require an initialized group model and the full observation window.
      const expectedTabCount = observed.groups.reduce((count, group) => count + group.tabs.length, 0) === fixture.expected.tabs.length;
      if (observed.initialized && elapsedMs >= minimumMs && elapsedMs <= timeoutMs && quietForMs >= quietMs && expectedTabCount) {
        return { observed, settling: { elapsedMs, quietForMs, minimumMs, quietMs, timeoutMs, events, timedOut: false } };
      }
      if (elapsedMs >= timeoutMs) {
        return { observed, settling: { elapsedMs, quietForMs, minimumMs, quietMs, timeoutMs, events, timedOut: true } };
      }
      await sleep(150);
    }
  } finally {
    subscriptions.forEach(subscription => subscription.dispose());
  }
}

async function run(vscode, context) {
  const report = {
    status: 'RUNNING', runId: process.env.LEAN_RESTORE_RUN_ID || null,
    casePath: process.env.LEAN_RESTORE_CASE || null, startedAt: new Date().toISOString(),
    apiVersion: vscode.version, expected: null, observed: null, assertions: [],
    mru: { status: 'REQUIRES_POST_SHUTDOWN_SQLITE', observableViaPublicApi: false },
    quit: { requested: false, completionVerifiedByOuterRunner: false }
  };
  let resultPath;
  let ownsResult = false;
  const write = async () => {
    const temporary = resultPath + '.' + crypto.randomUUID() + '.tmp';
    await fs.writeFile(temporary, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    await fs.rename(temporary, resultPath);
  };
  try {
    resultPath = temporaryPath(process.env.LEAN_RESTORE_RESULTS, 'LEAN_RESTORE_RESULTS');
    assert.match(process.env.LEAN_RESTORE_RUN_ID || '', /^[a-zA-Z0-9_.-]{1,100}$/, 'Set a unique LEAN_RESTORE_RUN_ID.');
    assert.notEqual(context?.extensionMode, vscode.ExtensionMode.Test, 'Use normal activation, not extensionTestsPath/in-memory storage.');
    const fixture = await loadCase(process.env.LEAN_RESTORE_CASE);
    const dataset = path.dirname(fixture.manifestPath);
    assert.ok(!within(resultPath, fixture.source.profile) && !within(resultPath, fixture.profile) && !within(resultPath, dataset) && !within(resultPath, fixture.workspace), 'Results must stay outside source/generated fixture data.');
    // Reserve a fresh result path. A stale previous PASS must never be overwritten or mistaken for this run.
    await fs.mkdir(path.dirname(resultPath), { recursive: true });
    const resultDirectory = await fs.realpath(path.dirname(resultPath));
    temporaryPath(resultDirectory, 'resolved results directory');
    for (const protectedDirectory of [fixture.source.profile, fixture.profile, dataset, fixture.workspace]) {
      const canonicalProtected = protectedDirectory.replace(/^\/tmp(?=\/|$)/, '/private/tmp');
      assert.ok(!within(resultDirectory, canonicalProtected), 'Results directory resolves into protected fixture data.');
    }
    await fs.writeFile(resultPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    ownsResult = true;
    report.case = { category: fixture.category, variant: fixture.variant, manifestPath: fixture.manifestPath, groupPath: fixture.groupPath, generatedProfile: fixture.profile };
    report.source = fixture.source;
    report.expected = fixture.expected;
    report.mru.expectedUris = fixture.expected.mruUris;
    assert.equal(vscode.workspace.workspaceFolders?.length, 1, 'Launch the original isolated one-folder workspace.');
    assert.equal(await fs.realpath(vscode.workspace.workspaceFolders[0].uri.fsPath), await fs.realpath(fixture.workspace), 'Workspace does not match the prepared source.');
    assert.equal(context?.storageUri?.scheme, 'file', 'Expected an initialized workspace storage URI.');
    const workspaceStorage = path.dirname(context.storageUri.fsPath);
    temporaryPath(workspaceStorage, 'actual workspace storage');
    const expectedWorkspaceId = path.basename(path.dirname(fixture.source.workspaceDatabase));
    assert.equal(path.basename(workspaceStorage), expectedWorkspaceId, 'Workspace storage id differs from the injected fixture database.');
    report.actualWorkspaceDatabase = path.join(workspaceStorage, 'state.vscdb');
    await write();
    const stable = await waitForStableTabs(vscode, fixture);
    report.observed = stable.observed;
    report.settling = stable.settling;
    const check = (name, actual, expected) => {
      const passed = same(actual, expected);
      report.assertions.push({ name, passed, expected, actual });
    };
    check('initialized tab group model', report.observed.initialized, true);
    check('tab events stabilized before deadline', stable.settling.timedOut, false);
    check('one restored editor group', report.observed.groups.length, 1);
    const group = report.observed.groups[0];
    check('active group is the restored group', group?.isActiveGroup && group?.isActive, true);
    check('ordinary text tab order and URIs', group?.tabs.map(tab => ({ inputType: tab.inputType, uri: tab.uri })), fixture.expected.tabs.map(tab => ({ inputType: 'TabInputText', uri: tab.uri })));
    check('active/preview/sticky flags', group?.tabs.map(tab => ({ uri: tab.uri, isActive: tab.isActive, isPreview: tab.isPreview, isPinned: tab.isPinned })), fixture.expected.tabs);
    check('group active tab', group?.activeTabIndex ?? -1, fixture.expected.tabs.findIndex(tab => tab.isActive));
    if (fixture.expected.tabs.length === 0) check('all retired leaves no editor in any group', report.observed.groups.flatMap(item => item.tabs), []);
    report.status = report.assertions.every(check => check.passed) ? 'PASS' : 'FAIL';
  } catch (error) {
    report.status = 'FAIL';
    report.error = { name: error.name, message: error.message, stack: error.stack };
    console.error('Lean restore fixture failed:', error.message);
  } finally {
    report.finishedAt = new Date().toISOString();
    report.quit.requested = true;
    try {
      if (ownsResult) await write();
    } catch (error) {
      report.status = 'FAIL';
      console.error('Lean restore result could not be saved:', error.message);
    }
    try {
      await vscode.commands.executeCommand('workbench.action.quit');
    } catch (error) {
      report.status = 'FAIL';
      report.quit.error = error.message;
      try { if (ownsResult) await write(); } catch (writeError) { console.error('Lean restore result write failed:', writeError.message); }
      console.error('Lean restore normal quit failed:', error.message);
    }
  }
}

module.exports = { loadCase, run };

if (require.main === module) {
  if (process.argv.length !== 4 || process.argv[2] !== '--validate-case') {
    console.error('Usage: node restore.js --validate-case /tmp/generated/<n>/group.after.json');
    process.exitCode = 1;
  } else {
    loadCase(process.argv[3]).then(fixture => {
      console.log(JSON.stringify({ status: 'VALIDATED_INPUT_ONLY', ...fixture }, null, 2));
    }).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
