'use strict';

const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message) {
  for (let i = 0; i < 100; i++) {
    const value = await check();
    if (value) return value;
    await delay(100);
  }
  throw new Error(message);
}

exports.activate = async context => {
  const root = process.env.LEAN_ORDINARY_ROOT;
  if (!root) throw new Error('Set LEAN_ORDINARY_ROOT to the isolated fixture directory.');
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspace || workspace !== path.join(root, 'w')) throw new Error('Unexpected test workspace.');
  const writeJSON = async (name, value) => {
    const temporary = path.join(root, name + '.tmp');
    await fs.writeFile(temporary, JSON.stringify(value));
    await fs.rename(temporary, path.join(root, name));
  };
  const handle = async request => {
    if (request.action === 'quit') return vscode.commands.executeCommand('workbench.action.quit');
    if (request.action === 'command') {
      if (request.command === 'workbench.action.reloadWindow') {
        await fs.unlink(path.join(root, 'request.json'));
      }
      return vscode.commands.executeCommand(request.command, ...(request.args || []));
    }
    if (request.action === 'tabs') return vscode.window.tabGroups.all.flatMap(group => group.tabs.map(tab => ({ label: tab.label, input: tab.input?.constructor.name, active: tab.isActive })));
    if (request.action === 'content-search') {
      assert.match(request.marker, /^OST149_SEARCH_[a-zA-Z0-9]+$/);
      const file = path.join(workspace, 'content-proof.txt');
      const uri = vscode.Uri.file(file);
      await vscode.workspace.fs.writeFile(uri, Buffer.from('ordinary first line\nneedle: \nordinary last line\n'));
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);
      assert(await editor.edit(edit => edit.insert(new vscode.Position(1, 8), request.marker)));
      assert(await document.save());
      const content = await fs.readFile(file, 'utf8');
      assert.equal(content, 'ordinary first line\nneedle: ' + request.marker + '\nordinary last line\n');
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      const tabClosed = () => !vscode.window.tabGroups.all.some(group => group.tabs.some(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === uri.toString()));
      await until(tabClosed, 'Search proof editor tab did not close');
      await vscode.commands.executeCommand('workbench.action.findInFiles', {
        query: request.marker, filesToInclude: '**/content-proof.txt',
        isCaseSensitive: true, isRegex: false, triggerSearch: true
      });
      return { status: 'SEARCH_REQUESTED_RESULTS_REQUIRE_RENDERER_CHECK', file, uri: uri.toString(), marker: request.marker, content, editorTabClosedBeforeSearch: tabClosed(), documentModelIsClosed: document.isClosed };
    }
    if (request.action === 'apply-theme') {
      assert.equal(request.extensionId, 'zhuangtongfa.material-theme');
      const extension = vscode.extensions.getExtension(request.extensionId);
      assert(extension, 'The installed third-party theme extension was not scanned');
      const extensionPath = await fs.realpath(extension.extensionPath);
      assert(extensionPath.startsWith((await fs.realpath(path.join(root, 'e'))) + path.sep), 'Theme is outside this private extension directory');
      const contributions = extension.packageJSON.contributes?.themes;
      const theme = contributions?.find(item => (item.id || item.label) === request.theme);
      assert(theme, 'Requested theme is not declared in the actual installed manifest');
      const themeFile = await fs.realpath(path.join(extensionPath, theme.path));
      assert(themeFile.startsWith(extensionPath + path.sep), 'Theme file is outside its extension');
      const colors = JSON.parse(await fs.readFile(themeFile, 'utf8')).colors;
      const before = vscode.window.activeColorTheme.kind;
      await vscode.workspace.getConfiguration('workbench').update('colorTheme', theme.id || theme.label, vscode.ConfigurationTarget.Global);
      const expectedKind = theme.uiTheme === 'vs' ? vscode.ColorThemeKind.Light : vscode.ColorThemeKind.Dark;
      await until(() => vscode.window.activeColorTheme.kind === expectedKind, 'Actual activeColorTheme did not change to the contributed theme kind');
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(path.join(workspace, 'content-proof.txt')));
      return { status: 'THEME_API_PASS_RENDERER_COLORS_REQUIRE_CHECK', extensionId: extension.id, extensionPath, version: extension.packageJSON.version,
        declaration: theme, themeFile, colors: Object.fromEntries(['editor.background', 'editor.foreground', 'sideBar.background', 'activityBar.background', 'statusBar.background'].map(key => [key, colors[key]])),
        configuredTheme: vscode.workspace.getConfiguration('workbench').get('colorTheme'), activeColorThemeBefore: before, activeColorThemeKind: vscode.window.activeColorTheme.kind, expectedKind };
    }
    if (request.action === 'terminal-clipboard') {
      const proof = path.join(workspace, 'terminal-proof.txt');
      await fs.unlink(proof).catch(error => { if (error.code !== 'ENOENT') throw error; });
      const terminal = vscode.window.createTerminal({ name: 'Ordinary terminal proof', shellPath: '/bin/sh', shellArgs: ['-f'] });
      try {
        terminal.show();
        terminal.sendText("printf 'TERMINAL_RUN_MARKER\\n' > '" + proof.replaceAll("'", "'\\''") + "'");
        await until(async () => { try { return (await fs.readFile(proof, 'utf8')) === 'TERMINAL_RUN_MARKER\n'; } catch { return false; } }, 'Terminal did not write proof');
      } finally { terminal.dispose(); }

      const clipboard = await vscode.env.clipboard.readText();
      try {
        const marker = 'ORDINARY_CLIPBOARD_MARKER';
        await vscode.env.clipboard.writeText(marker);
        assert.equal(await vscode.env.clipboard.readText(), marker);
        const file = path.join(workspace, 'clipboard-proof.txt');
        await fs.writeFile(file, '');
        const document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        await until(() => document.getText() === marker, 'Editor paste did not read the clipboard');
        assert(await document.save());
        assert.equal(await fs.readFile(file, 'utf8'), marker);
      } finally { await vscode.env.clipboard.writeText(clipboard); }
      return { status: 'PASS', checks: ['integrated terminal sendText and disk proof', 'clipboard roundtrip, editor paste command and disk proof'] };
    }
    if (request.action === 'retained-npm') {
      const npm = vscode.extensions.getExtension('vscode.npm');
      assert(npm, 'Built-in NPM is absent');
      await npm.activate();
      const commands = await vscode.commands.getCommands(true);
      for (const command of ['npm.runScript', 'npm.openScript', 'npm.runInstall', 'npm.runScriptFromHover']) assert(commands.includes(command), command + ' is absent');
      for (const command of ['npm.debugScript', 'npm.debugScriptFromHover']) assert(!commands.includes(command), command + ' is still registered');
      const document = await vscode.workspace.openTextDocument(path.join(workspace, 'package.json'));
      const scriptOffset = document.getText().indexOf('lean-proof');
      assert(scriptOffset >= 0, 'NPM fixture script is absent');
      const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, document.positionAt(scriptOffset + 1));
      const hoverText = hovers.flatMap(hover => hover.contents).map(content => typeof content === 'string' ? content : content.value).join('\n');
      assert(hoverText.includes('npm.runScriptFromHover'), 'Ordinary NPM Run hover is absent');
      assert(!hoverText.includes('npm.debugScriptFromHover'), 'Retired NPM Debug hover is present');
      const tasks = await vscode.tasks.fetchTasks({ type: 'npm' });
      const task = tasks.find(task => task.definition.script === 'lean-proof');
      assert(task, 'Ordinary NPM task provider did not return the script');
      const proof = path.join(workspace, 'npm-proof.txt');
      await fs.unlink(proof).catch(error => { if (error.code !== 'ENOENT') throw error; });
      let execution, ended = false;
      const subscription = vscode.tasks.onDidEndTask(event => { if (event.execution === execution) ended = true; });
      try {
        execution = await vscode.tasks.executeTask(task);
        await until(async () => { try { return (await fs.readFile(proof, 'utf8')) === 'NPM_TASK_MARKER\n'; } catch { return false; } }, 'NPM task did not write proof');
        await until(() => ended, 'NPM task did not end');
        assert(!vscode.tasks.taskExecutions.includes(execution));
      } finally { subscription.dispose(); }
      return { status: 'PASS', checks: ['ordinary NPM Run/Open/Install commands', 'ordinary Run hover without Debug', 'real NPM task provider, execution, proof and end event'], task: { name: task.name, definition: task.definition }, legacyClickSetting: vscode.workspace.getConfiguration('npm').get('scriptExplorerAction') };
    }
    if (request.action === 'retained') {
      const checks = [];
      const file = path.join(workspace, 'ordinary.html');
      await fs.writeFile(file, '<!doctype html>\n<h1>ORDINARY_SEARCH_MARKER</h1>\n');
      const document = await vscode.workspace.openTextDocument(file);
      assert.equal(document.languageId, 'html');
      const editor = await vscode.window.showTextDocument(document);
      assert(await editor.edit(edit => edit.insert(new vscode.Position(2, 0), '<p>ORDINARY_SAVE_MARKER</p>\n')));
      assert(await document.save());
      assert((await fs.readFile(file, 'utf8')).includes('ORDINARY_SAVE_MARKER'));
      assert((await vscode.workspace.findFiles('**/ordinary.html')).some(uri => uri.fsPath === file));
      checks.push('HTML language, editor save, file search');

      const git = vscode.extensions.getExtension('vscode.git');
      assert(git, 'Built-in Git is absent');
      const api = (await git.activate()).getAPI(1);
      execFileSync('git', ['init', '-q', workspace]);
      execFileSync('git', ['-C', workspace, 'config', 'user.name', 'Lean Fixture']);
      execFileSync('git', ['-C', workspace, 'config', 'user.email', 'lean-fixture@example.invalid']);
      const repository = await until(async () => (await api.openRepository(vscode.Uri.file(workspace))) || api.repositories.find(repo => repo.rootUri.fsPath === workspace), 'Git repository did not open');
      await repository.add([file]);
      await repository.commit('ordinary fixture initial commit');
      await fs.appendFile(file, '<p>ORDINARY_DIFF_MARKER</p>\n');
      await repository.status();
      assert((await repository.diffWithHEAD('ordinary.html')).includes('ORDINARY_DIFF_MARKER'));
      await repository.add([file]);
      await repository.status();
      assert(repository.state.indexChanges.some(change => change.uri.fsPath === file));
      await repository.commit('ordinary fixture edited file');
      assert.equal(execFileSync('git', ['-C', workspace, 'rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim(), '2');
      checks.push('built-in Git diff, stage, commit');

      const proof = path.join(workspace, 'task-proof.txt');
      const execution = await vscode.tasks.executeTask(new vscode.Task(
        { type: 'lean-fixture' }, vscode.TaskScope.Workspace, 'ordinary task', 'lean-fixture',
        new vscode.ShellExecution("printf 'TASK_RUN_MARKER\\n' > " + "'" + proof.replaceAll("'", "'\\''") + "'; while :; do sleep 1; done")
      ));
      await until(async () => { try { return (await fs.readFile(proof, 'utf8')).includes('TASK_RUN_MARKER'); } catch { return false; } }, 'Task did not write proof');
      let ended = false;
      const subscription = vscode.tasks.onDidEndTask(event => { if (event.execution === execution) ended = true; });
      execution.terminate();
      await until(() => ended, 'Task did not terminate');
      subscription.dispose();
      assert(!vscode.tasks.taskExecutions.includes(execution));
      checks.push('ordinary task executes and stops');

      await context.secrets.store('ordinary-fixture', 'SECRET_FIXTURE_MARKER');
      assert.equal(await context.secrets.get('ordinary-fixture'), 'SECRET_FIXTURE_MARKER');
      await context.secrets.delete('ordinary-fixture');
      assert.equal(await context.secrets.get('ordinary-fixture'), undefined);
      checks.push('isolated ordinary secret store/get/delete');
      await vscode.commands.executeCommand('workbench.action.findInFiles', { query: 'ORDINARY_SEARCH_MARKER' });
      return { status: 'PASS', checks };
    }
    throw new Error('Unknown ordinary fixture action: ' + request.action);
  };
  let previous;
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    let request;
    try { request = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')); } catch { return; }
    if (request.id === previous) return;
    busy = true; previous = request.id;
    try {
      const result = await handle(request);
      await writeJSON('response.json', { id: request.id, action: request.action, status: 'PASS', result });
    } catch (error) {
      await writeJSON('response.json', { id: request.id, action: request.action, status: 'FAIL', error: error.stack });
    } finally { busy = false; }
  }, 100);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  await writeJSON('ready.json', { pid: process.pid, parentPID: process.ppid, version: vscode.version, root, extensionId: context.extension.id });
};
