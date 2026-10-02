'use strict';
const vscode = require('vscode');

exports.activate = context => {
  context.subscriptions.push(vscode.commands.registerCommand('leanCore.echo', value => value));
  if (process.env.LEAN_RESTORE_CASE) {
    setTimeout(() => {
      require('./restore').run(vscode, context).catch(error => {
        console.error('Lean restore fixture runner failed:', error);
        return vscode.commands.executeCommand('workbench.action.quit');
      });
    }, 250);
  }
  return { context };
};
