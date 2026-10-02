#!/usr/bin/env node
// Clicks only the independently launched product's links. Chrome is read only.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { WebviewCdp } from './webview-cdp.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const hash = value => createHash('sha256').update(value).digest('hex');
const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i]?.startsWith('--') || !process.argv[i + 1]) throw new Error('Use --name value pairs.');
  const key = process.argv[i].slice(2);
  if (key in options) throw new Error('Duplicate option.');
  options[key] = process.argv[i + 1];
}
const allowed = ['action', 'root', 'pid', 'expected-app', 'profile-root', 'endpoint', 'expected-port', 'output', 'surface', 'index', 'receipt-timeout-ms', 'receipt-mode'];
if (Object.keys(options).some(key => !allowed.includes(key))) throw new Error('Unknown option.');
for (const key of ['action', 'root', 'pid', 'expected-app', 'profile-root', 'endpoint', 'expected-port', 'output']) if (!options[key]) throw new Error(`Missing --${key}.`);
if (!['matrix', 'row', 'contexts'].includes(options.action)) throw new Error('Action must be matrix, row or contexts.');
const surfaces = ['webview', 'markdown', 'terminal-visible', 'terminal-osc8'];
const receiptTimeout = Number(options['receipt-timeout-ms'] ?? 12000);
const receiptMode = options['receipt-mode'] ?? 'bridge';
if (!['bridge', 'native-chrome'].includes(receiptMode)) throw new Error('Unknown receipt mode.');
if (!Number.isInteger(receiptTimeout) || receiptTimeout < 12000 || receiptTimeout > 120000) throw new Error('Receipt timeout must be 12000..120000 ms.');
const run = (cmd, args) => { try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { throw new Error(`Authority check failed: ${cmd}`); } };
const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let client;
let output;

class LinkHost {
  constructor(root) { this.root = root; }
  async request(action, values = {}, timeoutMs = 15000) {
    const request = { id: randomUUID(), action, ...values };
    const temporary = path.join(this.root, `request-${request.id}.tmp`);
    await fs.writeFile(temporary, JSON.stringify(request));
    await fs.rename(temporary, path.join(this.root, 'request.json'));
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      let response;
      try { response = JSON.parse(await fs.readFile(path.join(this.root, 'response.json'), 'utf8')); } catch {}
      if (response?.id === request.id && response.status !== 'RUNNING') {
        if (response.status !== 'COMMAND_COMPLETED') throw new Error(response.error || 'Private fixture action failed.');
        return response;
      }
      await sleep(40);
    }
    throw new Error(`Private fixture timed out; request not resent: ${action}`);
  }
}

async function authority() {
  const pid = Number(options.pid), port = Number(options['expected-port']);
  if (!Number.isSafeInteger(pid) || pid < 1 || port !== 19520) throw new Error('Only this task PID and port19520 are allowed.');
  const endpoint = new URL(options.endpoint);
  if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || endpoint.port !== String(port) || endpoint.pathname !== '/' || endpoint.search || endpoint.hash || endpoint.username || endpoint.password) throw new Error('Expected isolated loopback CDP endpoint.');
  const app = await fs.realpath(options['expected-app']);
  const root = await fs.realpath(options.root);
  const profile = await fs.realpath(options['profile-root']);
  if (!root.startsWith('/private/tmp/ell145-') || profile !== path.join(root, 'u')) throw new Error('Wrong isolated link profile.');
  const launch = JSON.parse(await fs.readFile(path.join(root, 'launch.json'), 'utf8'));
  const ready = JSON.parse(await fs.readFile(path.join(root, 'ready.json'), 'utf8'));
  if (await fs.realpath(launch.app) !== app || launch.cdpPort !== port || ready.parentPID !== pid || ready.root !== root || ready.extensionId !== 'lean-tests.lean-links-runtime-fixture') throw new Error('Launch/fixture authority mismatch.');
  const executableName = run('/usr/bin/plutil', ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', path.join(app, 'Contents/Info.plist')]);
  const executable = await fs.realpath(path.join(app, 'Contents/MacOS', executableName));
  const command = run('/bin/ps', ['-p', String(pid), '-ww', '-o', 'args=']);
  const extracted = new RegExp(`^(.+?/Contents/MacOS/${escapeRE(executableName)})(?=\\s|$)`).exec(command)?.[1];
  const commandProfile = /(?:^|\s)--user-data-dir(?:=|\s)([^\s]+)(?=\s|$)/.exec(command)?.[1];
  if (!extracted || await fs.realpath(extracted) !== executable || !commandProfile || await fs.realpath(commandProfile) !== profile || !/(?:^|\s)--remote-debugging-port(?:=|\s)19520(?=\s|$)/.test(command)) throw new Error('Product executable/profile/port does not match PID.');
  const listener = run('/usr/sbin/lsof', ['-nP', '-a', '-p', String(pid), '-iTCP:19520', '-sTCP:LISTEN', '-Fpn']);
  if (!listener.split('\n').includes(`p${pid}`) || listener.split('\n').filter(line => line.startsWith('n')).join() !== 'n127.0.0.1:19520') throw new Error('Expected PID does not own exact loopback listener.');
  const script = await fs.realpath(path.join(app, 'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js'));
  const scriptHash = hash(await fs.readFile(script));
  if (scriptHash !== launch.expectedWorkbenchSHA256) throw new Error('Workbench differs from launch-before hash.');
  if (JSON.stringify(ready.legacyConfiguration) !== JSON.stringify({ '*': 'simpleBrowser.open' })) throw new Error('Verified old opener configuration absent.');
  const fixture = path.join(root, 'e/lean-links-runtime-fixture/links.js');
  if (hash(await fs.readFile(fixture)) !== launch.fixtureSHA256) throw new Error('Loaded private fixture differs from launch-before hash.');
  return { app, root, profile, pid, port, script, scriptHash, fixtureSHA256: launch.fixtureSHA256, bootId: ready.bootId, runId: ready.runId, hostPID: ready.hostPID, urls: ready.urls, legacyConfiguration: ready.legacyConfiguration };
}

async function bridge(action, args) {
  // Task constraints permit only these two operations and this exact expression.
  if (action !== 'find_tab' && action !== 'evaluate' || action === 'evaluate' && args.code !== 'location.href') throw new Error('Disallowed Chrome operation.');
  const response = await fetch('http://127.0.0.1:10086/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, args, session: 'lean-core-runtime' }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Bridge HTTP failed.');
  return response.json();
}

async function verifyLoadedWorkbench(a) {
  const session = [...client.sessions.values()].find(s => s.targetId === client.workbenchTargetId && s.type === 'page');
  if (!session) throw new Error('Expected product workbench session unavailable.');
  const scripts = [];
  const listener = message => { if (message.sessionId === session.sessionId && message.method === 'Debugger.scriptParsed') scripts.push(message.params); };
  client.wire.listeners.add(listener);
  try {
    await client.wire.send('Debugger.enable', {}, session.sessionId);
    const matches = [];
    for (const entry of scripts) {
      if (!entry.url) continue;
      let actual;
      try {
        const parsed = new URL(entry.url);
        actual = parsed.protocol === 'file:' ? fileURLToPath(parsed) : parsed.protocol === 'vscode-file:' && parsed.hostname === 'vscode-app' ? decodeURIComponent(parsed.pathname) : null;
        if (actual && await fs.realpath(actual) === a.script) matches.push(entry);
      } catch { if (path.isAbsolute(entry.url) && await fs.realpath(entry.url).catch(() => null) === a.script) matches.push(entry); }
    }
    if (matches.length !== 1) throw new Error('Expected workbench bundle is not uniquely already loaded.');
    const source = (await client.wire.send('Debugger.getScriptSource', { scriptId: matches[0].scriptId }, session.sessionId)).scriptSource;
    if (hash(source) !== a.scriptHash) throw new Error('Loaded workbench hash differs from the launch app.');
    return { scriptId: matches[0].scriptId, SHA256: hash(source), workbenchTargetId: client.workbenchTargetId };
  } finally { client.wire.listeners.delete(listener); }
}

async function findLink(a, surface, index, url) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const candidates = [];
    for (const row of await client.contextsWithDom()) {
      if (row.context.rootTargetId !== client.workbenchTargetId) continue;
      const context = client.contexts.get(row.context.key);
      const probe = await client.evaluate(context, `(() => {
        const run = ${JSON.stringify(a.runId)}, label = ${JSON.stringify('External URL ' + index)}, surface = ${JSON.stringify(surface)};
        const valid = surface === 'webview' ? document.body?.dataset.leanLinks === run && document.body.dataset.leanSurface === 'webview' : document.body?.textContent.includes('Ordinary Markdown ' + run);
        if (!valid) return null;
        const links = [...document.querySelectorAll('a')].filter(anchor => anchor.textContent.trim() === label);
        if (links.length !== 1) return null;
        const anchor = links[0]; return { documentURL: location.href, href: anchor.href, attributeHref: anchor.getAttribute('href'), dataHref: anchor.getAttribute('data-href'), text: anchor.textContent, run, index: ${index} };
      })()`).catch(() => null);
      if (probe) candidates.push({ ...row, probe });
    }
    if (candidates.length > 1) throw new Error('More than one actual link document matches this private row.');
    if (candidates.length === 1) return candidates[0];
    await sleep(120);
  }
  throw new Error('Actual Webview/Markdown link document was not found.');
}

async function domClick(a, surface, index, url) {
  const candidate = await findLink(a, surface, index, url);
  const context = client.contexts.get(candidate.context.key);
  const selector = surface === 'webview' ? '#link-' + index : `a[data-href*="surface=markdown"][data-href*="index=${index}"],a[href*="surface=markdown"][href*="index=${index}"]`;
  const point = await client.elementPoint(candidate, selector);
  if (point.targetId !== client.workbenchTargetId) throw new Error('Link input root differs from this isolated workbench.');
  const send = params => client.wire.send('Input.dispatchMouseEvent', params, point.sessionId);
  await send({ type: 'mouseMoved', x: point.x, y: point.y });
  await send({ type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1 });
  await send({ type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0, clickCount: 1 });
  return { surface, context: candidate.context, anchor: candidate.probe, selector, point, mode: 'limited product-target CDP trusted mouse click' };
}

async function terminalClick(state) {
  const row = (await client.contextsWithDom()).find(row => row.context.targetId === client.workbenchTargetId && row.context.targetType === 'page');
  if (!row) throw new Error('Expected terminal workbench context unavailable.');
  const context = client.contexts.get(row.context.key);
  const point = await client.evaluate(context, `(() => {
    const screens = [...document.querySelectorAll('.xterm-screen')].filter(element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.height > 0 && element.innerText.includes(${JSON.stringify(state.banner)}); });
    if (screens.length !== 1) throw Error('Terminal screen is absent or ambiguous');
    const screen = screens[0], r = screen.getBoundingClientRect(), cols = ${state.dimensions.columns ?? state.dimensions.cols}, rows = ${state.dimensions.rows};
    if (!cols || !rows || r.width < 100 || r.height < 30) throw Error('Invalid actual terminal geometry');
    const cellWidth = r.width / cols, cellHeight = r.height / rows;
    return { x: r.left + 5.5 * cellWidth, y: r.top + 1.5 * cellHeight, rectangle: { x:r.left,y:r.top,width:r.width,height:r.height }, cols, rows, cellWidth, cellHeight, text: screen.innerText.slice(0, 1000) };
  })()`);
  const session = client.rootSession(context);
  if (session?.targetId !== client.workbenchTargetId || session.type !== 'page') throw new Error('Terminal input root differs from the isolated product workbench.');
  const send = params => client.wire.send('Input.dispatchMouseEvent', params, session.sessionId);
  await send({ type: 'mouseMoved', x: point.x, y: point.y, modifiers: 4 });
  await sleep(450);
  await send({ type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1, modifiers: 4 });
  await send({ type: 'mouseReleased', x: point.x, y: point.y, button: 'left', buttons: 0, clickCount: 1, modifiers: 4 });
  return { surface: state.surface, context: row.context, point, mode: 'limited product-target CDP Meta+mouse click', targetId: session.targetId, terminalState: state };
}

function nativeChromeTabs(url) {
  // Read only exact test URLs; keep browser selection and page contents untouched.
  const script = `on run argv
tell application "Google Chrome"
set matches to ""
repeat with w in windows
repeat with t in tabs of w
if URL of t is item 1 of argv then set matches to matches & (id of t as text) & linefeed & (id of w as text) & linefeed & (URL of t) & linefeed
end repeat
end repeat
return matches
end tell
end run`;
  const output = execFileSync('/usr/bin/osascript', ['-e', script, url], { encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (!output) return [];
  const lines = output.split('\n'), tabs = [];
  if (lines.length % 3) throw new Error('Malformed native Chrome receipt.');
  for (let i = 0; i < lines.length; i += 3) {
    if (lines[i + 2] !== url || !/^\d+$/.test(lines[i]) || !/^\d+$/.test(lines[i + 1])) throw new Error('Unexpected native Chrome receipt.');
    tabs.push({ tabId: Number(lines[i]), windowId: Number(lines[i + 1]), actualHref: lines[i + 2] });
  }
  return tabs;
}

async function browserReceipt(url, knownTabs) {
  const deadline = Date.now() + receiptTimeout;
  let last = 'test active tab not received';
  while (Date.now() < deadline) {
    if (receiptMode === 'native-chrome') {
      const matches = nativeChromeTabs(url).filter(tab => !knownTabs.has(tab.tabId));
      if (matches.length === 1) {
        knownTabs.add(matches[0].tabId);
        return { receiptSource: 'native Chrome exact tab URL, read only', ...matches[0], exactOriginalURI: true };
      }
      last = 'unique new exact native Chrome test tab not received';
      await sleep(250);
      continue;
    }
    const found = await bridge('find_tab', { url, active: true });
    if (!found.ok) { last = found.error?.code || 'bridge find failed'; await sleep(250); continue; }
    // find_tab matches only the host. Never evaluate another same-host user tab.
    if (found.data?.url !== url) { last = 'active same-host tab lacks exact test URI; evaluation skipped'; await sleep(250); continue; }
    const tabId = found.data.tabId;
    if (knownTabs.has(tabId)) { last = 'earlier test tab still active; waiting for actual new tab'; await sleep(250); continue; }
    const evaluation = await bridge('evaluate', { code: 'location.href' });
    if (!evaluation.ok) throw new Error(`Chrome location evaluation rejected: ${evaluation.error?.code || 'unknown'}`);
    const href = evaluation.data?.value;
    if (href !== url) throw new Error('Chrome location.href differs from the exact original test URI.');
    knownTabs.add(tabId);
    return { session: 'lean-core-runtime', findAction: 'find_tab matching URL active=true', tabId, borrowed: found.data.borrowed, tabURL: found.data.url, evaluationCode: 'location.href', actualHref: href, exactOriginalURI: true };
  }
  throw new Error(`Chrome new active test tab blocked: ${last}`);
}

const atomic = async (file, value) => { const temporary = `${file}.${randomUUID()}.tmp`; await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n'); await fs.rename(temporary, file); };

try {
  const a = await authority(); // Must precede HTTP/CDP/Chrome operations.
  output = path.resolve(options.output);
  if (!output.startsWith(a.root + '/evidence/') || output.startsWith(a.profile + '/')) throw new Error('Output must be in this fixture evidence directory.');
  await fs.mkdir(output, { recursive: false });
  const host = new LinkHost(a.root);
  client = await WebviewCdp.connect(options.endpoint, { expectedApp: a.app });
  const loaded = await verifyLoadedWorkbench(a);
  await atomic(path.join(output, 'authority.json'), { ...a, urls: undefined, loaded });
  if (options.action === 'contexts') {
    await atomic(path.join(output, 'contexts.json'), await client.contextsWithDom());
    const row = (await client.contextsWithDom()).find(row => row.context.targetId === client.workbenchTargetId && row.context.targetType === 'page');
    if (row) await atomic(path.join(output, 'terminal-dom.json'), await client.evaluate(client.contexts.get(row.context.key), `(() => ({ screens: [...document.querySelectorAll('.xterm-screen')].map(screen => { const r=screen.getBoundingClientRect(); return {rectangle:{x:r.x,y:r.y,width:r.width,height:r.height},classes:screen.className,text:screen.innerText.slice(0,1000),parents:[screen.parentElement?.className,screen.parentElement?.parentElement?.className,screen.parentElement?.parentElement?.parentElement?.className]}; }), instances: [...document.querySelectorAll('.terminal-instance')].map(element => ({classes:element.className,display:getComputedStyle(element).display})) }))()`));
    if (row) await atomic(path.join(output, 'dialogs.json'), await client.evaluate(client.contexts.get(row.context.key), `(() => [...document.querySelectorAll('[role="dialog"],.monaco-dialog-box')].filter(element => {const r=element.getBoundingClientRect();return r.width>0&&r.height>0;}).map(element => ({role:element.getAttribute('role'),classes:element.className,text:element.innerText,buttons:[...element.querySelectorAll('button,.monaco-button')].map(button=>({text:button.innerText,classes:button.className}))})))()`));
  } else {
    const selectedSurfaces = options.action === 'row' ? [options.surface] : surfaces;
    const indices = options.action === 'row' ? [Number(options.index)] : [0, 1, 2, 3, 4];
    if (selectedSurfaces.some(surface => !surfaces.includes(surface)) || indices.some(index => !Number.isInteger(index) || index < 0 || index > 4)) throw new Error('Invalid matrix row selection.');
    const rows = [], knownTabs = new Set();
    // A retry cannot use a receipt from an earlier test click as new-tab evidence.
    for (const directory of await fs.readdir(path.join(a.root, 'evidence'), { withFileTypes: true })) {
      if (!directory.isDirectory()) continue;
      for (const name of await fs.readdir(path.join(a.root, 'evidence', directory.name))) {
        if (!/^(webview|markdown|terminal-visible|terminal-osc8)-[0-4]\.json$/.test(name)) continue;
        try {
          const prior = JSON.parse(await fs.readFile(path.join(a.root, 'evidence', directory.name, name), 'utf8'));
          if (prior.originalURI?.includes(`run=${a.runId}&`) && prior.chrome?.tabId) knownTabs.add(prior.chrome.tabId);
        } catch {}
      }
    }
    for (const surface of selectedSurfaces) {
      if (surface === 'webview' || surface === 'markdown') await host.request(surface);
      for (const index of indices) {
        const url = a.urls[surface][index];
        const result = { surface, index, originalURI: url, startedAt: new Date().toISOString() };
        try {
          if (receiptMode === 'native-chrome') {
            result.chromeTabsBeforeClick = nativeChromeTabs(url);
            for (const tab of result.chromeTabsBeforeClick) knownTabs.add(tab.tabId);
          }
          if (surface.startsWith('terminal-')) {
            const prepared = await host.request('terminal', { surface, index });
            await sleep(250);
            result.click = await terminalClick(prepared.result.terminal);
          } else result.click = await domClick(a, surface, index, url);
          console.log(JSON.stringify({ surface, index, event: 'REAL_PRODUCT_CLICK_DISPATCHED', originalURI: url, receiptTimeout }));
          result.chrome = await browserReceipt(url, knownTabs);
          result.status = 'REAL_ROUTE_EXACT_CHROME_URI_PASS';
        } catch (error) { result.status = 'BLOCKED_OR_FAIL_NO_ACCEPTANCE'; result.reason = error.message; }
        try {
          const tabs = await host.request('tabs');
          result.productTabs = tabs.result.tabs;
          result.browserTabs = tabs.result.browserTabs;
          if (result.browserTabs.length) { result.status = 'BLOCKED_OR_FAIL_NO_ACCEPTANCE'; result.reason = 'Product created a retired Browser tab.'; }
        } catch (error) { result.status = 'BLOCKED_OR_FAIL_NO_ACCEPTANCE'; result.tabObservationError = error.message; }
        result.completedAt = new Date().toISOString(); rows.push(result);
        await atomic(path.join(output, `${surface}-${index}.json`), result);
        await atomic(path.join(output, 'matrix.json'), { status: rows.every(row => row.status === 'REAL_ROUTE_EXACT_CHROME_URI_PASS') && rows.length === 20 ? 'TWENTY_REAL_SYSTEM_ROUTES_PASS' : 'PARTIAL_OR_ROW_ONLY', authority: { ...a, urls: undefined, loaded }, rows });
        console.log(JSON.stringify({ surface, index, status: result.status, reason: result.reason }));
      }
    }
    const after = await authority();
    if (after.pid !== a.pid || after.bootId !== a.bootId || after.scriptHash !== a.scriptHash) throw new Error('Product authority changed during matrix.');
    await atomic(path.join(output, 'authority-after.json'), { ...after, urls: undefined });
    console.log(JSON.stringify({ status: rows.length === 20 && rows.every(row => row.status === 'REAL_ROUTE_EXACT_CHROME_URI_PASS') ? 'TWENTY_REAL_SYSTEM_ROUTES_PASS' : 'PARTIAL_OR_ROW_ONLY', passed: rows.filter(row => row.status === 'REAL_ROUTE_EXACT_CHROME_URI_PASS').length, total: rows.length, output }));
    if (rows.some(row => row.status !== 'REAL_ROUTE_EXACT_CHROME_URI_PASS')) process.exitCode = 1;
  }
} catch (error) {
  if (output) await atomic(path.join(output, 'failure.json'), { status: 'FAILED_NO_ACCEPTANCE', at: new Date().toISOString(), reason: error.message }).catch(() => {});
  console.error(JSON.stringify({ status: 'FAILED_NO_ACCEPTANCE', reason: error.message })); process.exitCode = 1;
} finally { if (client) await client.close(); }
