'use strict';
const vscode = require('vscode');
const fs = require('node:fs/promises');

exports.activate = async context => {
  const root = process.env.LEAN_ACCESSIBILITY_ROOT;
  if (!root) throw new Error('Set LEAN_ACCESSIBILITY_ROOT to the isolated fixture directory.');
  const document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'hover_target\nordinary editor\n' });
  context.subscriptions.push(vscode.languages.registerHoverProvider('plaintext', {
    provideHover: () => new vscode.Hover('A11Y_HOVER_MARKER: ordinary hover documentation')
  }));
  const terminal = vscode.window.createTerminal({ name: 'Accessibility fixture' });
  context.subscriptions.push(terminal);
  let previous;
  const handle = async request => {
    if (request.action === 'quit') return vscode.commands.executeCommand('workbench.action.quit');
    if (request.action.startsWith('terminal')) {
      terminal.show();
      if (request.action === 'terminal-output') {
        terminal.sendText("printf 'A11Y_TERMINAL_MARKER\\n'");
        return;
      }
    } else {
      const editor = await vscode.window.showTextDocument(document);
      editor.selection = new vscode.Selection(0, 1, 0, 1);
      await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
      if (request.action === 'hover-view') {
        await vscode.commands.executeCommand('editor.action.showHover', { focus: 'autoFocusImmediately' });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    await vscode.commands.executeCommand(request.action.endsWith('help') ? 'editor.action.accessibilityHelp' : 'editor.action.accessibleView');
  };
  const timer = setInterval(async () => {
    let request;
    try { request = JSON.parse(await fs.readFile(root + '/request.json', 'utf8')); } catch { return; }
    if (request.id === previous) return;
    previous = request.id;
    try {
      await handle(request);
      await fs.writeFile(root + '/response.json', JSON.stringify({ id: request.id, action: request.action, status: 'PASS' }));
    } catch (error) {
      await fs.writeFile(root + '/response.json', JSON.stringify({ id: request.id, action: request.action, status: 'FAIL', error: error.stack }));
    }
  }, 100);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  await fs.writeFile(root + '/ready.json', JSON.stringify({ hostPid: process.pid, parentPid: process.ppid, version: vscode.version }));
};
