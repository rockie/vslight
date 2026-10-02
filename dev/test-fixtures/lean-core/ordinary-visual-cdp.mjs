#!/usr/bin/env node
// Reads only this task's existing workbench. Product actions use its private host.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i].startsWith('--') || !process.argv[i + 1]) throw new Error('Use --name value pairs.');
  options[process.argv[i].slice(2)] = process.argv[i + 1];
}
for (const name of ['root', 'pid', 'expected-app']) if (!options[name]) throw new Error(`Missing --${name}.`);
const root = await fs.realpath(options.root);
if (!root.startsWith('/private/tmp/ost149-')) throw new Error('Expected a private ost149 fixture directory.');
const app = await fs.realpath(options['expected-app']);
const pid = Number(options.pid), port = 19560;
if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('Invalid main PID.');
const launch = JSON.parse(await fs.readFile(path.join(root, 'launch.json'), 'utf8'));
const ready = JSON.parse(await fs.readFile(path.join(root, 'ready.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const run = (file, args) => execFileSync(file, args, { encoding: 'utf8' }).trim();
const atomic = async (file, value) => { const temporary = file + '.tmp'; await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n'); await fs.rename(temporary, file); };
const verifyAuthority = async () => {
  if (await fs.realpath(launch.app) !== app || launch.pid !== pid || launch.cdpPort !== port || ready.root !== root || ready.parentPID !== pid || ready.extensionId !== 'lean-tests.ordinary-search-theme149') throw new Error('Launch/host identity mismatch.');
  const name = run('/usr/bin/plutil', ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', path.join(app, 'Contents/Info.plist')]);
  const executable = await fs.realpath(path.join(app, 'Contents/MacOS', name));
  const command = run('/bin/ps', ['-p', String(pid), '-ww', '-o', 'args=']);
  if (!command.startsWith(executable + ' ') || !command.includes('--user-data-dir ' + path.join(root, 'u') + ' ') || !command.includes('--remote-debugging-port=19560')) throw new Error('Main executable/profile/port mismatch.');
  const listener = run('/usr/sbin/lsof', ['-nP', '-a', '-p', String(pid), '-iTCP:19560', '-sTCP:LISTEN', '-Fpn']);
  if (!listener.split('\n').includes('p' + pid) || listener.split('\n').filter(line => line.startsWith('n')).join() !== 'n127.0.0.1:19560') throw new Error('Expected PID does not own the exact loopback listener.');
  const script = path.join(app, 'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js');
  if (hash(await fs.readFile(script)) !== launch.appSHA256.workbench || hash(await fs.readFile(path.join(root, 'ext/ordinary.js'))) !== launch.fixtureSHA256) throw new Error('Launch source hashes changed.');
  return { pid, hostPID: ready.pid, root, app, executable, command, listener, port, fixtureSHA256: launch.fixtureSHA256, expectedWorkbenchSHA256: launch.appSHA256.workbench };
};

class Wire {
  constructor(url) { this.ws = new WebSocket(url); this.next = 0; this.pending = new Map(); this.events = []; }
  async connect() {
    await new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); });
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id) { this.events.push(message); return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.id);
      message.error ? pending.reject(new Error(JSON.stringify(message.error))) : pending.resolve(message.result);
    });
    return this;
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
      this.pending.set(id, { resolve, reject, timer }); this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  }
  close() { this.ws.close(); }
}

async function request(action, values = {}) {
  const request = { id: randomUUID(), action, ...values };
  await atomic(path.join(root, 'request.json'), request);
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    let response;
    try { response = JSON.parse(await fs.readFile(path.join(root, 'response.json'), 'utf8')); } catch {}
    if (response?.id === request.id) {
      await atomic(path.join(root, 'evidence', request.id + '.json'), { request, response });
      if (response.status !== 'PASS') throw new Error(response.error || 'Private host action failed.');
      return { request, response };
    }
    await sleep(80);
  }
  throw new Error('Host request timed out; no request replay: ' + action);
}

let client;
const result = { status: 'RUNNING', at: new Date().toISOString(), generation: '147+148+149', scope: 'content-search and actual contributed color theme only' };
try {
  result.authorityBefore = await verifyAuthority(); // Before HTTP/CDP reads.
  await fs.mkdir(path.join(root, 'evidence'), { recursive: true });
  const targets = await (await fetch('http://127.0.0.1:19560/json/list')).json();
  const pages = targets.filter(target => target.type === 'page' && target.url.endsWith('/workbench/workbench.html'));
  if (pages.length !== 1) throw new Error('Expected exactly one own workbench.');
  const page = pages[0];
  if (!(await fs.realpath(decodeURIComponent(new URL(page.url).pathname))).startsWith(app + '/Contents/')) throw new Error('Workbench URL is outside the expected app.');
  const websocket = new URL(page.webSocketDebuggerUrl);
  if (websocket.hostname !== '127.0.0.1' || websocket.port !== '19560') throw new Error('Unexpected page debugger endpoint.');
  client = await new Wire(websocket.href).connect();
  await client.send('Runtime.enable'); await client.send('Page.enable'); await client.send('Debugger.enable');
  const scripts = client.events.filter(event => event.method === 'Debugger.scriptParsed' && event.params.url.endsWith('/vs/workbench/workbench.desktop.main.js'));
  if (scripts.length !== 1) throw new Error('Own loaded workbench is not unique.');
  const loaded = (await client.send('Debugger.getScriptSource', { scriptId: scripts[0].params.scriptId })).scriptSource;
  if (hash(loaded) !== launch.appSHA256.workbench) throw new Error('Loaded workbench differs from launch app.');
  result.loadedWorkbench = { targetId: page.id, url: page.url, scriptId: scripts[0].params.scriptId, sha256: hash(loaded) };

  const marker = 'OST149_SEARCH_' + randomUUID().replaceAll('-', '');
  result.searchHost = await request('content-search', { marker });
  const searchExpression = `(() => {
    const view = document.querySelector('.search-view');
    const visible = element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return { documentURL: location.href, query: view?.querySelector('textarea,input')?.value,
      files: [...(view?.querySelectorAll('.filematch') || [])].filter(visible).map(element => ({ text: element.innerText, titles: [...element.querySelectorAll('[title]')].map(item => item.title), rowAria: element.closest('[aria-label]')?.getAttribute('aria-label') })),
      matches: [...(view?.querySelectorAll('.linematch') || [])].filter(visible).map(element => ({ text: element.innerText, match: element.querySelector('.findInFileMatch')?.textContent, rowAria: element.closest('[aria-label]')?.getAttribute('aria-label') })),
      messages: view?.querySelector('.messages')?.innerText, rectangle: view ? {width:view.getBoundingClientRect().width,height:view.getBoundingClientRect().height} : null };
  })()`;
  const searchDeadline = Date.now() + 25000;
  while (Date.now() < searchDeadline) {
    result.searchDOM = await client.evaluate(searchExpression);
    if (result.searchDOM.files.length === 1 && result.searchDOM.files[0].text.includes('content-proof.txt') && result.searchDOM.matches.length === 1 && result.searchDOM.matches[0].match === marker) break;
    await sleep(150);
  }
  if (result.searchDOM.files.length !== 1 || !result.searchDOM.files[0].text.includes('content-proof.txt') || result.searchDOM.matches.length !== 1 || result.searchDOM.matches[0].match !== marker) throw new Error('Actual content-search result did not contain the unique file and marker.');
  await client.send('Accessibility.enable');
  result.searchAX = (await client.send('Accessibility.getFullAXTree')).nodes.filter(node => !node.ignored && (node.name?.value?.includes(marker) || node.name?.value?.includes('content-proof.txt'))).map(node => ({ role: node.role?.value, name: node.name?.value }));
  if (!result.searchAX.some(node => node.name.includes(marker)) || !result.searchAX.some(node => node.name.includes('content-proof.txt'))) throw new Error('Chromium AX content-search file/marker evidence absent.');
  await fs.writeFile(path.join(root, 'evidence/search.png'), Buffer.from((await client.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));

  result.themeHost = await request('apply-theme', { extensionId: 'zhuangtongfa.material-theme', theme: launch.theme.declaration.id || launch.theme.declaration.label });
  const contribution = result.themeHost.response.result;
  if (contribution.themeFile !== launch.theme.themeFile || hash(await fs.readFile(contribution.themeFile)) !== launch.theme.themeSHA256) throw new Error('Contributed theme file identity mismatch.');
  const expectedClass = (contribution.extensionId + '-' + contribution.declaration.path.replace(/^\.\//, '')).replace(/[^_a-zA-Z0-9-]/g, '-');
  const themeExpression = `(() => {
    const workbench = document.querySelector('.monaco-workbench'), editor = document.querySelector('.monaco-editor');
    const style = workbench && getComputedStyle(workbench);
    return { documentURL: location.href, classes: workbench?.className, editorBackground: editor && getComputedStyle(editor).backgroundColor,
      colors: Object.fromEntries(${JSON.stringify(Object.keys(contribution.colors))}.map(key => [key, style?.getPropertyValue('--vscode-' + key.replaceAll('.', '-')).trim()])),
      rectangle: workbench ? {width:workbench.getBoundingClientRect().width,height:workbench.getBoundingClientRect().height} : null };
  })()`;
  const themeDeadline = Date.now() + 20000;
  while (Date.now() < themeDeadline) {
    result.themeDOM = await client.evaluate(themeExpression);
    if (result.themeDOM.classes?.split(' ').includes(expectedClass) && Object.entries(contribution.colors).every(([key, value]) => result.themeDOM.colors[key]?.toLowerCase() === value.toLowerCase())) break;
    await sleep(150);
  }
  if (!result.themeDOM.classes?.split(' ').includes(expectedClass) || !Object.entries(contribution.colors).every(([key, value]) => result.themeDOM.colors[key]?.toLowerCase() === value.toLowerCase())) throw new Error('Actual theme identity/colors do not match its installed contribution file.');
  const rgb = contribution.colors['editor.background'].slice(1).match(/../g).map(value => parseInt(value, 16));
  if (result.themeDOM.editorBackground !== `rgb(${rgb.join(', ')})` || result.themeDOM.rectangle.width < 100 || result.themeDOM.rectangle.height < 100) throw new Error('Actual editor background/visible workbench does not match the theme.');
  result.themeIdentity = { expectedClass, extensionId: contribution.extensionId, themeFile: contribution.themeFile, themeSHA256: launch.theme.themeSHA256, packageSHA256: launch.theme.packageSHA256 };
  await fs.writeFile(path.join(root, 'evidence/theme.png'), Buffer.from((await client.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  result.authorityAfter = await verifyAuthority();
  result.status = 'CONTENT_SEARCH_AND_CONTRIBUTED_THEME_PASS';
} catch (error) {
  result.status = 'FAIL'; result.error = error.stack; process.exitCode = 1;
} finally {
  client?.close();
  await atomic(path.join(root, 'result.json'), result);
  console.log(JSON.stringify({ status: result.status, root, error: result.error }));
}
