'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const vscode = require('vscode');
const execFileAsync = promisify(execFile);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const shellQuote = value => "'" + value.replace(/'/g, "'\\''") + "'";

async function bounded(promise, label, milliseconds = 30000) {
	let timer;
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out`)), milliseconds); })
		]);
	} finally {
		clearTimeout(timer);
	}
}

async function waitForFile(file, text) {
	const deadline = Date.now() + 30000;
	while (Date.now() < deadline) {
		try {
			if (await fs.readFile(file, 'utf8') === text) { return; }
		} catch (error) {
			if (error.code !== 'ENOENT') { throw error; }
		}
		await delay(100);
	}
	throw new Error(`Expected file content did not appear: ${path.basename(file)}`);
}

async function run() {
	const requestedWorkspace = process.env.LEAN_TEST_WORKSPACE;
	assert.ok(requestedWorkspace && path.isAbsolute(requestedWorkspace), 'Set LEAN_TEST_WORKSPACE to the isolated absolute workspace path.');
	const folders = vscode.workspace.workspaceFolders;
	assert.equal(folders?.length, 1, 'The fixture requires exactly one isolated workspace folder.');
	const root = await fs.realpath(folders[0].uri.fsPath);
	assert.equal(root, await fs.realpath(requestedWorkspace), 'Workspace does not match the explicitly supplied test directory.');
	const results = [];
	const selectedCheck = process.env.LEAN_BASELINE_CHECK;
	const resources = [];
	const reportPath = path.join(root, 'baseline-results.json');
	async function progress(stage) {
		await fs.writeFile(path.join(root, 'baseline-progress.json'), JSON.stringify({ stage, results }, null, 2) + '\n');
	}
	async function check(name, operation) {
		if (selectedCheck && name !== selectedCheck) { return; }
		await progress(name);
		await bounded(operation(), name, 60000);
		results.push({ name, result: 'PASS' });
		await progress(`completed: ${name}`);
		console.log(`PASS: ${name}`);
	}
	try {
		const extension = vscode.extensions.getExtension('lean-tests.lean-baseline-fixture');
		assert.ok(extension);
		const api = await bounded(extension.activate(), 'fixture activation');
		const documentUri = vscode.Uri.file(path.join(root, 'baseline.txt'));
		await check('ordinary document, command and status bar', async () => {
			await vscode.workspace.fs.writeFile(documentUri, Buffer.from('baseline initial\n'));
			const document = await vscode.workspace.openTextDocument(documentUri);
			await vscode.window.showTextDocument(document);
			const edit = new vscode.WorkspaceEdit();
			edit.replace(documentUri, new vscode.Range(0, 0, document.lineCount, 0), 'baseline edited\n');
			assert.equal(await vscode.workspace.applyEdit(edit), true);
			assert.equal(await document.save(), true);
			assert.equal(Buffer.from(await vscode.workspace.fs.readFile(documentUri)).toString(), 'baseline edited\n');
			assert.equal(await vscode.commands.executeCommand('leanBaseline.echo', 'command round trip'), 'command round trip');
			const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
			resources.push(status);
			status.text = 'Lean baseline status';
			status.command = 'leanBaseline.echo';
			status.show();
			assert.equal(status.text, 'Lean baseline status');
			status.hide();
		});
		await check('ordinary terminal sendText writes a file', async () => {
			const file = path.join(root, 'terminal-proof.txt');
			await fs.rm(file, { force: true });
			const terminal = vscode.window.createTerminal({ name: 'Lean baseline terminal', shellPath: '/bin/sh', cwd: root });
			resources.push(terminal);
			terminal.show();
			await bounded(terminal.processId, 'terminal process');
			terminal.sendText(`printf '%s' TERMINAL_OK > ${shellQuote(file)}`, true);
			await waitForFile(file, 'TERMINAL_OK');
		});
		await check('shell task executes and exits', async () => {
			const file = path.join(root, 'task-proof.txt');
			await fs.rm(file, { force: true });
			const task = new vscode.Task({ type: 'shell' }, folders[0], 'Lean baseline task', 'lean-tests',
				new vscode.ShellExecution(`printf '%s' TASK_OK > ${shellQuote(file)}`, { cwd: root, executable: '/bin/sh', shellArgs: ['-c'] }));
			let listener;
			const ended = new Promise(resolve => {
				listener = vscode.tasks.onDidEndTaskProcess(event => { if (event.execution.task.name === task.name) { resolve(event.exitCode); } });
			});
			try {
				const execution = await vscode.tasks.executeTask(task);
				resources.push({ dispose: () => { if (vscode.tasks.taskExecutions.includes(execution)) { execution.terminate(); } } });
				assert.equal(await bounded(ended, 'task process exit'), 0);
				await waitForFile(file, 'TASK_OK');
			} finally { listener.dispose(); }
		});
		await check('running shell task can be stopped', async () => {
			const file = path.join(root, 'task-stop-proof.txt');
			await fs.rm(file, { force: true });
			const task = new vscode.Task({ type: 'shell' }, folders[0], 'Lean baseline stop task', 'lean-tests',
				new vscode.ShellExecution(`printf '%s' TASK_RUNNING > ${shellQuote(file)}; while :; do sleep 1; done`, { cwd: root, executable: '/bin/sh', shellArgs: ['-c'] }));
			let listener;
			const ended = new Promise(resolve => {
				listener = vscode.tasks.onDidEndTask(event => { if (event.execution.task.name === task.name) { resolve(); } });
			});
			let execution;
			try {
				execution = await vscode.tasks.executeTask(task);
				await waitForFile(file, 'TASK_RUNNING');
				assert.ok(vscode.tasks.taskExecutions.includes(execution));
				execution.terminate();
				await bounded(ended, 'terminated task end');
				assert.ok(!vscode.tasks.taskExecutions.includes(execution));
			} finally {
				listener.dispose();
				if (execution && vscode.tasks.taskExecutions.includes(execution)) { execution.terminate(); }
			}
		});
		await check('built-in Git diff, stage and commit', async () => {
			const gitExtension = vscode.extensions.getExtension('vscode.git');
			assert.ok(gitExtension, 'Built-in Git extension is missing.');
			await gitExtension.activate();
			await execFileAsync('git', ['init', root]);
			await execFileAsync('git', ['-C', root, 'config', '--local', 'user.name', 'Lean Baseline Test']);
			await execFileAsync('git', ['-C', root, 'config', '--local', 'user.email', 'lean-baseline@example.invalid']);
			await execFileAsync('git', ['-C', root, 'config', '--local', 'commit.gpgsign', 'false']);
			const repository = await gitExtension.exports.getAPI(1).openRepository(vscode.Uri.file(root));
			assert.ok(repository, 'Built-in Git could not open the isolated repository.');
			const file = path.join(root, 'git-proof.txt');
			await fs.writeFile(file, 'before\n');
			await repository.add([file]);
			await repository.commit('baseline initial');
			await fs.writeFile(file, 'after\n');
			assert.match(await repository.diff(false), /\+after/);
			await repository.add([file]);
			assert.match(await repository.diff(true), /\+after/);
			await repository.commit('baseline update');
			const { stdout } = await execFileAsync('git', ['-C', root, 'log', '-1', '--format=%s']);
			assert.equal(stdout.trim(), 'baseline update');
			const committed = await execFileAsync('git', ['-C', root, 'show', 'HEAD:git-proof.txt']);
			assert.equal(committed.stdout, 'after\n');
		});
		await check('Webview script and bidirectional message round trip', async () => {
			const panel = vscode.window.createWebviewPanel('leanBaseline.webview', 'Lean baseline Webview', vscode.ViewColumn.Active,
				{ enableScripts: true, localResourceRoots: [] });
			resources.push(panel);
			let listener;
			const reply = new Promise((resolve, reject) => {
				listener = panel.webview.onDidReceiveMessage(message => {
					if (message.type === 'ready') {
						panel.webview.postMessage({ type: 'ping', value: 'HOST_TO_WEBVIEW' }).then(sent => {
							if (!sent) { reject(new Error('Webview rejected the host message.')); }
						}, reject);
					} else if (message.type === 'pong') { resolve(message); }
				});
			});
			panel.webview.html = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-leanbaseline';"></head><body><p>Lean baseline Webview</p><script nonce="leanbaseline">
				const api = acquireVsCodeApi();
				window.addEventListener('message', event => {
					if (event.data.type === 'ping') { api.postMessage({ type: 'pong', value: event.data.value }); }
				});
				api.postMessage({ type: 'ready' });
			</script></body></html>`;
			try {
				assert.deepEqual(await bounded(reply, 'Webview round trip'), { type: 'pong', value: 'HOST_TO_WEBVIEW' });
			} finally { listener.dispose(); panel.dispose(); }
		});
		await check('hover content and ordinary accessibility command registrations', async () => {
			const document = await vscode.workspace.openTextDocument(documentUri);
			await vscode.window.showTextDocument(document);
			const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', documentUri, new vscode.Position(0, 0));
			assert.ok(hovers.some(hover => hover.contents.some(content => content.value?.includes('Lean baseline hover content'))));
			const commands = await vscode.commands.getCommands(true);
			for (const command of ['editor.action.accessibleView', 'editor.action.accessibilityHelp', 'editor.action.showHover']) {
				assert.ok(commands.includes(command), `Missing command: ${command}`);
			}
		});
		await check('authentication provider, session and secret storage', async () => {
			await progress('authentication.getAccounts');
			const accounts = await vscode.authentication.getAccounts('lean-baseline-auth');
			assert.equal(accounts.length, 1);
			assert.equal(accounts[0].id, 'lean-baseline-account');
			assert.equal(accounts[0].label, 'Lean Baseline Account');
			await progress('authentication.getSession');
			const session = await vscode.authentication.getSession('lean-baseline-auth', ['baseline'], { silent: true });
			assert.ok(session, 'Seed the isolated profile authentication allow-list before launching this fixture.');
			assert.equal(session.accessToken, 'lean-baseline-fake-token');
			assert.equal(session.id, 'lean-baseline-session');
			assert.ok(api.getSessionReads() > 0);
			await progress('secrets.store');
			await api.context.secrets.store('baseline-fake-secret', 'lean-baseline-fake-token');
			await progress('secrets.get');
			assert.equal(await api.context.secrets.get('baseline-fake-secret'), 'lean-baseline-fake-token');
			await progress('secrets.delete');
			await api.context.secrets.delete('baseline-fake-secret');
			await progress('secrets.get-after-delete');
			assert.equal(await api.context.secrets.get('baseline-fake-secret'), undefined);
		});
		assert.ok(results.length > 0, 'The selected baseline check does not exist.');
		await fs.writeFile(reportPath, JSON.stringify({ status: 'PASS', selectedCheck, results }, null, 2) + '\n');
	} catch (error) {
		await fs.writeFile(reportPath, JSON.stringify({ status: 'FAIL', selectedCheck, results, error: error.stack || String(error) }, null, 2) + '\n');
		throw error;
	} finally {
		for (const resource of resources.reverse()) { resource.dispose(); }
	}
}

module.exports = { run };
