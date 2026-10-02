'use strict';

const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

async function prepareRestoreProfile() {
	const requested = process.env.LEAN_TEST_WORKSPACE;
	assert.ok(requested && path.isAbsolute(requested), 'Set the isolated LEAN_TEST_WORKSPACE absolute path.');
	const folders = vscode.workspace.workspaceFolders;
	assert.equal(folders?.length, 1, 'Restore preparation requires one workspace folder.');
	const root = await fs.realpath(folders[0].uri.fsPath);
	assert.equal(root, await fs.realpath(requested));
	const uris = ['A.txt', 'B.txt'].map(name => vscode.Uri.file(path.join(root, name)));
	for (const uri of uris) {
		await vscode.workspace.fs.writeFile(uri, Buffer.from(`Lean restore fixture ${path.basename(uri.fsPath)}\n`));
	}
	const a = await vscode.workspace.openTextDocument(uris[0]);
	await vscode.window.showTextDocument(a, { viewColumn: vscode.ViewColumn.One, preview: false });
	await vscode.commands.executeCommand('workbench.action.pinEditor');
	const b = await vscode.workspace.openTextDocument(uris[1]);
	await vscode.window.showTextDocument(b, { viewColumn: vscode.ViewColumn.One, preview: true });
	await fs.writeFile(path.join(root, 'restore-prepared.json'), JSON.stringify({
		status: 'PREPARED_AWAITING_SHUTDOWN_STATE', appVersion: vscode.version,
		workspace: root, documents: uris.map(uri => uri.toString()),
		operations: ['show A preview:false', 'pin A sticky', 'show B preview:true'],
		createdAt: new Date().toISOString()
	}, null, 2) + '\n');
	await new Promise(resolve => setTimeout(resolve, 1000));
}

function activate(context) {
	const events = new vscode.EventEmitter();
	const session = {
		id: 'lean-baseline-session',
		accessToken: 'lean-baseline-fake-token',
		account: { id: 'lean-baseline-account', label: 'Lean Baseline Account' },
		scopes: ['baseline']
	};
	let sessionReads = 0;
	context.subscriptions.push(events);
	context.subscriptions.push(vscode.authentication.registerAuthenticationProvider(
		'lean-baseline-auth', 'Lean Baseline Authentication', {
			onDidChangeSessions: events.event,
			getSessions: async scopes => {
				sessionReads++;
				return !scopes || scopes.every(scope => session.scopes.includes(scope)) ? [session] : [];
			},
			createSession: async () => session,
			removeSession: async () => { throw new Error('The fixture session must remain available.'); }
		}, { supportsMultipleAccounts: false }
	));
	context.subscriptions.push(vscode.commands.registerCommand('leanBaseline.echo', value => value));
	context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'plaintext' }, {
		provideHover: () => new vscode.Hover('Lean baseline hover content: ordinary accessibility remains available.')
	}));
	if (process.env.LEAN_PREPARE_RESTORE_PROFILE === '1' || process.env.LEAN_RUN_BASELINE === '1') {
		assert.ok(!(process.env.LEAN_PREPARE_RESTORE_PROFILE === '1' && process.env.LEAN_RUN_BASELINE === '1'), 'Select one fixture mode.');
		setImmediate(async () => {
			try {
				if (process.env.LEAN_PREPARE_RESTORE_PROFILE === '1') {
					await prepareRestoreProfile();
				} else {
					await require('./run').run();
				}
			} catch (error) {
				console.error('Lean baseline fixture failed:', error);
			} finally {
				await vscode.commands.executeCommand('workbench.action.quit');
			}
		});
	}
	return { context, getSessionReads: () => sessionReads };
}

module.exports = { activate };
