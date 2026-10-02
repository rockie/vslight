'use strict';

const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');

const bases = ['http://localhost:19481', 'http://127.0.0.1:19481', 'http://[::1]:19481', 'http://0.0.0.0:19481', 'https://example.com'];
const suffix = '/lean%20core/%E4%B8%AD?encoded=%252F&plain=value';
const fragment = '#fragment%20space';
const surfaces = ['webview', 'markdown', 'terminal-visible', 'terminal-osc8'];
exports.matrix = { bases, suffix, fragment, surfaces };

exports.activate = async context => {
  if (context.extension.id !== 'lean-tests.lean-links-runtime-fixture') throw new Error('Wrong independent link fixture ID.');
  const configuredRoot = process.env.LEAN_LINKS_ROOT;
  if (!configuredRoot) throw new Error('Set LEAN_LINKS_ROOT to a private link fixture directory.');
  const root = await fs.realpath(configuredRoot);
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspace || await fs.realpath(workspace) !== await fs.realpath(path.join(root, 'w'))) throw new Error('Link fixture requires its own isolated workspace.');
  const runId = createHash('sha256').update(root).digest('hex').slice(0, 12);
  const bootId = randomUUID();
  const urlsFor = surface => {
    if (!surfaces.includes(surface)) throw new Error('Unknown link surface.');
    return bases.map((base, index) => `${base}${suffix}&run=${runId}&surface=${surface}&index=${index}${fragment}`);
  };
  const atomic = async (file, data) => {
    const temporary = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(data, null, 2) + '\n');
    await fs.rename(temporary, file);
  };
  const tabs = () => vscode.window.tabGroups.all.flatMap(group => group.tabs.map(tab => ({ label: tab.label, input: tab.input?.constructor.name, viewType: tab.input?.viewType, uri: tab.input?.uri?.toString(true), active: tab.isActive })));
  const legacyConfiguration = () => vscode.workspace.getConfiguration('workbench').get('externalUriOpeners');
  if (JSON.stringify(legacyConfiguration()) !== JSON.stringify({ '*': 'simpleBrowser.open' })) throw new Error('Independent profile must retain the verified old simpleBrowser.open opener mapping.');
  let panel, terminal, terminalState;
  let busy = false;
  const seen = new Set();
  const handle = async request => {
    if (request.action === 'status') return { runId, bootId, urls: Object.fromEntries(surfaces.map(surface => [surface, urlsFor(surface)])), legacyConfiguration: legacyConfiguration(), tabs: tabs(), terminal: terminalState };
    if (request.action === 'tabs') return { tabs: tabs(), browserTabs: tabs().filter(tab => /browser|simpleBrowser/i.test(`${tab.input} ${tab.viewType || ''}`)) };
    if (request.action === 'webview') {
      terminal?.dispose(); terminal = undefined;
      panel?.dispose();
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      const urls = urlsFor('webview');
      panel = vscode.window.createWebviewPanel('leanLinks', 'Ordinary external links', vscode.ViewColumn.One, { enableScripts: false });
      context.subscriptions.push(panel);
      panel.webview.html = '<!doctype html><html><head><meta charset="utf-8"></head><body data-lean-links="' + runId + '" data-lean-surface="webview"><h1>Ordinary Webview</h1>' + urls.map((url, i) => '<p><a id="link-' + i + '" href="' + url.replaceAll('&', '&amp;') + '">External URL ' + i + '</a></p>').join('') + '</body></html>';
      return { surface: 'webview', urls, runId, tabs: tabs() };
    }
    if (request.action === 'markdown') {
      terminal?.dispose(); terminal = undefined;
      panel?.dispose(); panel = undefined;
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      const urls = urlsFor('markdown');
      const file = path.join(root, 'w', 'ordinary-links.md');
      await fs.writeFile(file, '# Ordinary Markdown ' + runId + '\n\n' + urls.map((url, i) => '[External URL ' + i + '](<' + url + '>)').join('\n\n'));
      const uri = vscode.Uri.file(file);
      await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri), { preserveFocus: true });
      await vscode.commands.executeCommand('markdown.showPreview', uri);
      return { surface: 'markdown', urls, runId, file, tabs: tabs() };
    }
    if (request.action === 'terminal') {
      const surface = request.surface;
      if (!['terminal-visible', 'terminal-osc8'].includes(surface) || !Number.isInteger(request.index) || request.index < 0 || request.index >= bases.length) throw new Error('Invalid terminal matrix row.');
      panel?.dispose(); panel = undefined;
      terminal?.dispose();
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      const url = urlsFor(surface)[request.index];
      const write = new vscode.EventEmitter();
      context.subscriptions.push(write);
      terminalState = { surface, index: request.index, url, ready: false, name: `Lean ${surface} ${request.index}`, banner: `LEAN ${runId} ${surface} ${request.index}` };
      const pty = {
        onDidWrite: write.event,
        open(dimensions) {
          terminalState.dimensions = dimensions;
          terminalState.openedAt = new Date().toISOString();
          const link = surface === 'terminal-osc8' ? `\x1b]8;;${url}\x07External URL ${request.index}\x1b]8;;\x07` : url;
          write.fire(`\x1b[2J\x1b[H${terminalState.banner}\r\n${link}\r\n`);
          terminalState.ready = true;
        },
        setDimensions(dimensions) { terminalState.dimensions = dimensions; },
        close() {}
      };
      terminal = vscode.window.createTerminal({ name: terminalState.name, pty });
      context.subscriptions.push(terminal);
      terminal.show(true);
      const deadline = Date.now() + 10000;
      while (!terminalState.ready && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 30));
      if (!terminalState.ready) throw new Error('Actual integrated terminal did not open its pty.');
      return { surface, index: request.index, url, runId, terminal: terminalState, tabs: tabs() };
    }
    if (request.action === 'quit') {
      await atomic(path.join(root, 'quit-intent.json'), { id: request.id, bootId, hostPID: process.pid, parentPID: process.ppid, at: new Date().toISOString() });
      await vscode.commands.executeCommand('workbench.action.quit');
      return { quitRequested: true };
    }
    throw new Error('Unknown private link fixture action.');
  };
  const timer = setInterval(async () => {
    if (busy) return;
    let request;
    try { request = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')); } catch { return; }
    if (!request || !/^[A-Za-z0-9_-]{1,80}$/.test(request.id || '') || seen.has(request.id)) return;
    busy = true; seen.add(request.id);
    await fs.unlink(path.join(root, 'request.json')).catch(() => {});
    const response = { id: request.id, action: request.action, bootId, hostPID: process.pid, at: new Date().toISOString(), status: 'RUNNING' };
    try {
      await atomic(path.join(root, 'response.json'), response);
      const result = await handle(request);
      const complete = { ...response, completedAt: new Date().toISOString(), status: 'COMMAND_COMPLETED', result };
      await atomic(path.join(root, 'response.json'), complete);
      await atomic(path.join(root, 'responses', request.id + '.json'), complete);
    } catch (error) {
      const failed = { ...response, completedAt: new Date().toISOString(), status: 'FAIL', error: String(error.message) };
      await atomic(path.join(root, 'response.json'), failed);
      await atomic(path.join(root, 'responses', request.id + '.json'), failed);
    } finally { busy = false; }
  }, 100);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  await fs.mkdir(path.join(root, 'responses'), { recursive: true });
  await atomic(path.join(root, 'ready.json'), { extensionId: context.extension.id, root, runId, bootId, hostPID: process.pid, parentPID: process.ppid, vscodeVersion: vscode.version, workspace, legacyConfiguration: legacyConfiguration(), matrix: { bases, suffix, fragment, surfaces }, urls: Object.fromEntries(surfaces.map(surface => [surface, urlsFor(surface)])) });
};
