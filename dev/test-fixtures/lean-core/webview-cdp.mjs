#!/usr/bin/env node
// Connects to an already running, separately selected CDP browser. It never starts
// or focuses a product window. DOM_CHECK_PASS is a subset result, not M3 acceptance.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
const fixture = require('./mermaid.js');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const documentTypes = new Set(['page', 'iframe', 'webview']);
const instrument = `(() => {
  if (!globalThis.__leanMermaidCdpEvidence) {
    const evidence = { installedAt: Date.now(), timeOrigin: performance.timeOrigin, violations: [] };
    Object.defineProperty(globalThis, '__leanMermaidCdpEvidence', { value: evidence });
    document.addEventListener('securitypolicyviolation', e => evidence.violations.push({
      at: Date.now(), directive: e.violatedDirective, effectiveDirective: e.effectiveDirective,
      blockedURI: e.blockedURI, sourceFile: e.sourceFile, lineNumber: e.lineNumber
    }));
  }
  return globalThis.__leanMermaidCdpEvidence;
})()`;
const describe = `(() => ({ url: location.href, title: document.title, readyState: document.readyState,
  visibility: document.visibilityState, bodyClass: document.body?.className ?? '',
  bodyWebviewId: document.body?.dataset.vscodeMermaidWebviewId ?? null,
  diagramCount: document.querySelectorAll('.mermaid').length,
  errorCount: document.querySelectorAll('.mermaid-error').length,
  scriptSources: [...document.scripts].map(s => s.src).filter(Boolean),
  iframeSources: [...document.querySelectorAll('iframe')].map(f => f.src),
  surface: document.body?.dataset.vscodeMermaidWebviewId ? 'standalone-editor' : 'markdown-preview'
}))()`;

class Wire {
  constructor(url) { this.ws = new WebSocket(url); this.next = 0; this.pending = new Map(); this.listeners = new Set(); }
  async connect() {
    await new Promise((resolve, reject) => { this.ws.addEventListener('open', resolve, { once: true }); this.ws.addEventListener('error', reject, { once: true }); });
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id) { for (const listener of this.listeners) listener(message); return; }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.id);
      message.error ? pending.reject(new Error(`${pending.method}: ${JSON.stringify(message.error)}`)) : pending.resolve(message.result);
    });
    this.ws.addEventListener('close', () => {
      for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('CDP disconnected.')); }
      this.pending.clear();
    });
    return this;
  }
  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      this.pending.set(id, { method, resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  close() { this.ws.close(); }
}

export class FixtureClient {
  constructor(root) { this.root = path.resolve(root); }
  async clearPending() {
    // Avoid replaying an old open-editor/theme/quit request after the real restart.
    await fs.rm(path.join(this.root, 'request.json'), { force: true });
  }
  async request(action, values = {}, timeoutMs = 15000) {
    const request = { id: randomUUID(), action, ...values };
    const temporary = path.join(this.root, `request-${request.id}.tmp`);
    await fs.writeFile(temporary, JSON.stringify(request));
    await fs.rename(temporary, path.join(this.root, 'request.json'));
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      let response;
      try { response = JSON.parse(await fs.readFile(path.join(this.root, 'response.json'), 'utf8')); } catch {}
      if (response?.id === request.id) {
        if (response.status !== 'COMMAND_COMPLETED') throw new Error(JSON.stringify(response));
        return response;
      }
      await sleep(50);
    }
    throw new Error(`Fixture command timeout: ${action}`);
  }
}

export class WebviewCdp {
  constructor(wire, expectedApp) {
    this.wire = wire; this.expectedApp = expectedApp; this.sessions = new Map(); this.contexts = new Map();
    this.events = []; this.initializing = new Set(); this.diagnostics = []; this.startedAt = Date.now(); this.closed = false;
    wire.listeners.add(message => this.onEvent(message));
  }
  static async connect(endpoint, { expectedApp } = {}) {
    const url = new URL(endpoint);
    if (url.port === '19480') throw new Error('Port 19480 is reserved for the separate authentication run.');
    let websocket = endpoint;
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const version = await (await fetch(new URL('/json/version', url))).json();
      websocket = version.webSocketDebuggerUrl;
    }
    if (!websocket || new URL(websocket).port === '19480') throw new Error('A separate browser CDP endpoint is required.');
    const client = new WebviewCdp(await new Wire(websocket).connect(), expectedApp && await fs.realpath(expectedApp));
    try {
      const { targetInfos } = await client.wire.send('Target.getTargets');
      client.initialTargets = new Set(targetInfos.map(target => target.targetId));
      if (client.expectedApp) {
        const workbenches = targetInfos.filter(target => target.type === 'page' && target.url.endsWith('/workbench/workbench.html'));
        if (workbenches.length !== 1) throw new Error(`Expected exactly one product workbench; found ${workbenches.length}.`);
        const loadedPath = await fs.realpath(decodeURIComponent(new URL(workbenches[0].url).pathname));
        if (!loadedPath.startsWith(client.expectedApp + '/Contents/')) throw new Error('Workbench URL is outside --expected-app.');
        client.workbenchTargetId = workbenches[0].targetId;
      }
      await client.wire.send('Target.setDiscoverTargets', { discover: true });
      await client.wire.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
      await client.settle();
      for (const target of targetInfos.filter(target => documentTypes.has(target.type))) {
        if (![...client.sessions.values()].some(session => session.targetId === target.targetId)) {
          await client.wire.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
        }
      }
      await client.settle();
      return client;
    } catch (error) { await client.close(); throw error; }
  }
  onEvent(message) {
    const { method, params, sessionId } = message;
    if (method === 'Target.attachedToTarget') {
      const session = { sessionId: params.sessionId, parentSessionId: sessionId, ...params.targetInfo,
        existingAtConnect: this.initialTargets?.has(params.targetInfo.targetId) ?? false,
        waitingForDebugger: params.waitingForDebugger, attachedAt: Date.now() };
      this.sessions.set(session.sessionId, session);
      const promise = this.initialize(session).catch(error => this.diagnostics.push({ sessionId: session.sessionId, error: error.message }));
      this.initializing.add(promise); promise.finally(() => this.initializing.delete(promise));
    } else if (method === 'Target.detachedFromTarget') {
      this.sessions.delete(params.sessionId);
      for (const [key, context] of this.contexts) if (context.sessionId === params.sessionId) this.contexts.delete(key);
    } else if (method === 'Runtime.executionContextCreated') {
      const context = { ...params.context, sessionId, key: sessionId + ':' + params.context.id, createdAt: Date.now() };
      this.contexts.set(context.key, context);
      if (context.auxData?.isDefault !== false && documentTypes.has(this.sessions.get(sessionId)?.type)) {
        this.evaluate(context, instrument).catch(() => {});
      }
    } else if (method === 'Runtime.executionContextDestroyed') {
      this.contexts.delete(sessionId + ':' + params.executionContextId);
    } else if (method === 'Runtime.executionContextsCleared') {
      for (const [key, context] of this.contexts) if (context.sessionId === sessionId) this.contexts.delete(key);
    }
    if (/^(Runtime\.(consoleAPICalled|exceptionThrown)|Log\.entryAdded|Network\.loadingFailed)$/.test(method)) {
      this.events.push({ at: Date.now(), sessionId, method, params });
    }
  }
  async initialize(session) {
    if (!documentTypes.has(session.type)) {
      await this.wire.send('Runtime.runIfWaitingForDebugger', {}, session.sessionId).catch(() => {});
      return;
    }
    try {
      for (const method of ['Runtime.enable', 'Page.enable', 'DOM.enable', 'Log.enable', 'Network.enable']) await this.wire.send(method, {}, session.sessionId);
      await this.wire.send('Page.addScriptToEvaluateOnNewDocument', { source: instrument }, session.sessionId);
      session.newDocumentInstrumentation = true;
      await this.wire.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true }, session.sessionId);
    } finally {
      await this.wire.send('Runtime.runIfWaitingForDebugger', {}, session.sessionId).catch(() => {});
    }
  }
  async settle() {
    await sleep(80);
    for (let attempt = 0; attempt < 5 && this.initializing.size; attempt++) await Promise.allSettled([...this.initializing]);
  }
  async evaluate(context, expression, returnByValue = true) {
    const result = await this.wire.send('Runtime.evaluate', { expression, contextId: context.id, returnByValue, awaitPromise: true }, context.sessionId);
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return returnByValue ? result.result.value : result.result;
  }
  rootSession(context) {
    let session = this.sessions.get(context.sessionId); const seen = new Set();
    while (session?.parentSessionId && !seen.has(session.sessionId)) { seen.add(session.sessionId); session = this.sessions.get(session.parentSessionId); }
    return session;
  }
  async contextsWithDom() {
    await this.settle();
    const results = await Promise.all([...this.contexts.values()].filter(context => context.auxData?.isDefault !== false && documentTypes.has(this.sessions.get(context.sessionId)?.type)).map(async context => {
      try {
        const dom = await this.evaluate(context, describe);
        const session = this.sessions.get(context.sessionId); const root = this.rootSession(context);
        return { context: { key: context.key, id: context.id, uniqueId: context.uniqueId, origin: context.origin, name: context.name, frameId: context.auxData?.frameId, sessionId: context.sessionId, targetId: session?.targetId, targetType: session?.type, rootTargetId: root?.targetId }, dom };
      } catch { return null; }
    }));
    return results.filter(Boolean);
  }
  async waitForMermaid({ caseId, theme = 'light', surface = 'standalone-editor', webviewId, timeoutMs = 15000 }) {
    const end = Date.now() + timeoutMs; let last = [];
    while (Date.now() < end) {
      const candidates = (await this.contextsWithDom()).filter(candidate => candidate.dom.diagramCount === 1 && candidate.dom.surface === surface &&
        (!webviewId || candidate.dom.bodyWebviewId === webviewId) && (!this.workbenchTargetId || candidate.context.rootTargetId === this.workbenchTargetId));
      if (candidates.length > 1) throw new Error('Ambiguous Mermaid documents: ' + JSON.stringify(candidates.map(candidate => candidate.context)));
      if (candidates.length === 1) {
        const candidate = candidates[0]; const context = this.contexts.get(candidate.context.key);
        try {
          const expression = `(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return ${fixture.webviewProbeExpression(caseId, theme, surface)}; })()`;
          const dom = await this.evaluate(context, expression);
          last = [dom];
          if (dom.status === 'PASS') return { ...candidate, dom };
        } catch (error) { last = [{ error: error.message }]; }
      }
      await sleep(120);
    }
    throw new Error('Mermaid DOM did not pass before timeout: ' + JSON.stringify(last));
  }
  async snapshot(row, { since = this.startedAt, screenshot } = {}) {
    const candidate = await this.waitForMermaid(row); const context = this.contexts.get(candidate.context.key);
    const csp = await this.evaluate(context, 'globalThis.__leanMermaidCdpEvidence ?? null');
    const events = this.events.filter(event => event.at >= since && event.sessionId === context.sessionId &&
      (event.method !== 'Runtime.consoleAPICalled' || event.params.executionContextId === context.id));
    const legal = fixture.cases.cases.find(diagram => diagram.id === row.caseId)?.expectValid;
    const failures = [];
    if (!this.sessions.get(context.sessionId)?.newDocumentInstrumentation) failures.push('CDP document/log instrumentation did not initialize.');
    if (csp?.violations?.length) failures.push('Actual document CSP violation.');
    if (events.some(event => event.method === 'Network.loadingFailed' && event.params.blockedReason === 'csp')) failures.push('Actual CDP CSP-blocked request.');
    if (legal && events.some(event => event.method === 'Runtime.exceptionThrown' || event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error' || event.method === 'Log.entryAdded' && event.params.entry.level === 'error' || event.method === 'Network.loadingFailed' && event.params.blockedReason === 'csp')) failures.push('Actual CDP error or CSP-blocked request.');
    if (legal && events.some(event => /not found|fallback|falling back|not registered/i.test(JSON.stringify(event.params)))) failures.push('Actual addon/layout fallback warning.');
    let screenshotInfo;
    if (screenshot) {
      const root = this.rootSession(context);
      if (root?.type !== 'page') throw new Error('Cannot identify root page for screenshot.');
      const { data } = await this.wire.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, root.sessionId);
      await fs.writeFile(screenshot, Buffer.from(data, 'base64'));
      screenshotInfo = { path: screenshot, mode: 'root-page-viewport', rootTargetId: root.targetId, selectedFrameId: candidate.context.frameId };
    }
    return { status: failures.length ? 'FAIL' : 'DOM_CHECK_PASS', scope: 'Selected CDP document only; product identity, screenshots and remaining gates require review',
      productIdentity: this.expectedApp ?? 'UNVERIFIED', ...candidate, failures, events, csp, screenshot: screenshotInfo,
      captureCoverage: { connectedAt: this.startedAt, selectedSessionAttachedAt: this.sessions.get(context.sessionId)?.attachedAt, existingTargetAtConnect: this.sessions.get(context.sessionId)?.existingAtConnect, pausedBeforeScripts: this.sessions.get(context.sessionId)?.waitingForDebugger, newDocumentInstrumentation: this.sessions.get(context.sessionId)?.newDocumentInstrumentation },
      transformNumbers: await this.evaluate(context, `(() => { const el = document.querySelector('.mermaid-content'); if (!el) return null; const m = new DOMMatrix(getComputedStyle(el).transform); return { scale: m.a, x: m.e, y: m.f }; })()`),
      remainingChecks: ['Review Chinese glyphs/clipping in root-page screenshot', 'Verify fresh-load capture coverage', 'Ordinary host commands and serializer restoration', 'Final product input and size gates'] };
  }
  async elementPoint(candidate, selector) {
    const context = this.contexts.get(candidate.context.key);
    const object = await this.evaluate(context, `document.querySelector(${JSON.stringify(selector)})`, false);
    if (!object.objectId || object.subtype === 'null') throw new Error('Element is absent: ' + selector);
    try {
      const { model } = await this.wire.send('DOM.getBoxModel', { objectId: object.objectId }, context.sessionId);
      let x = (model.content[0] + model.content[4]) / 2, y = (model.content[1] + model.content[5]) / 2;
      let session = this.sessions.get(context.sessionId); const seen = new Set();
      while (session?.type === 'iframe') {
        if (!session.parentSessionId || seen.has(session.sessionId)) throw new Error('Missing OOP iframe lineage; trusted input was not dispatched.');
        seen.add(session.sessionId);
        const parent = this.sessions.get(session.parentSessionId);
        const frameId = [...this.contexts.values()].find(item => item.sessionId === session.sessionId && item.auxData?.isDefault)?.auxData?.frameId;
        const { backendNodeId } = await this.wire.send('DOM.getFrameOwner', { frameId }, parent.sessionId);
        const { model: owner } = await this.wire.send('DOM.getBoxModel', { backendNodeId }, parent.sessionId);
        // Fixed product webviews use unrotated iframe rectangles. Reject geometry
        // requiring a transform instead of guessing a different click target.
        if (Math.abs(owner.content[1] - owner.content[3]) > 0.5 || Math.abs(owner.content[0] - owner.content[6]) > 0.5) throw new Error('Transformed iframe requires explicit geometry review.');
        x += owner.content[0]; y += owner.content[1]; session = parent;
      }
      if (session?.type !== 'page') throw new Error('Input root is not a page.');
      return { x, y, sessionId: session.sessionId, targetId: session.targetId };
    } finally { await this.wire.send('Runtime.releaseObject', { objectId: object.objectId }, context.sessionId).catch(() => {}); }
  }
  async interact(row, action, { dx = 65, dy = 35 } = {}) {
    const before = await this.snapshot(row); const selectors = { 'zoom-in': '.zoom-in-btn', 'zoom-out': '.zoom-out-btn', 'pan-toggle': '.pan-mode-btn', 'button-reset': '.zoom-reset-btn', pan: '.mermaid-wrapper' };
    if (!selectors[action]) throw new Error('Unknown interaction: ' + action);
    const point = await this.elementPoint(before, selectors[action]);
    const send = params => this.wire.send('Input.dispatchMouseEvent', params, point.sessionId);
    await send({ type: 'mouseMoved', x: point.x, y: point.y });
    await send({ type: 'mousePressed', x: point.x, y: point.y, button: 'left', buttons: 1, clickCount: 1 });
    if (action === 'pan') for (let step = 1; step <= 4; step++) await send({ type: 'mouseMoved', x: point.x + dx * step / 4, y: point.y + dy * step / 4, buttons: 1 });
    await send({ type: 'mouseReleased', x: point.x + (action === 'pan' ? dx : 0), y: point.y + (action === 'pan' ? dy : 0), button: 'left', buttons: 0, clickCount: 1 });
    await sleep(100);
    const after = await this.snapshot(row); const failures = [];
    if (action === 'zoom-in' && !(after.transformNumbers?.scale > before.transformNumbers?.scale)) failures.push('Zoom-in did not increase scale.');
    if (action === 'zoom-out' && !(after.transformNumbers?.scale < before.transformNumbers?.scale)) failures.push('Zoom-out did not decrease scale.');
    if (action === 'pan' && (Math.abs(after.transformNumbers.x - before.transformNumbers.x - dx) > 1 || Math.abs(after.transformNumbers.y - before.transformNumbers.y - dy) > 1)) failures.push('Drag did not move by the expected CSS pixel delta. Enable pan mode first.');
    if (action === 'pan-toggle' && after.dom.controls.find(control => control.className.includes('pan-mode-btn'))?.pressed === before.dom.controls.find(control => control.className.includes('pan-mode-btn'))?.pressed) failures.push('Pan toggle did not change pressed state.');
    return { status: failures.length ? 'FAIL' : action === 'button-reset' ? 'OBSERVED_REQUIRES_BASELINE_COMPARISON' : 'INTERACTION_CHECK_PASS', action, input: 'CDP Input.dispatchMouseEvent; native trusted events', point, before, after, failures };
  }
  async close() {
    if (this.closed) return; this.closed = true;
    for (const session of this.sessions.values()) await this.wire.send('Runtime.runIfWaitingForDebugger', {}, session.sessionId).catch(() => {});
    await this.wire.send('Target.setAutoAttach', { autoAttach: false, waitForDebuggerOnStart: false, flatten: true }).catch(() => {});
    this.wire.close();
  }
}

export function compareRestored(before, after, tolerance = 1) {
  const failures = [];
  for (const key of ['caseId', 'surface', 'theme', 'mermaidWebviewId']) if (before.dom[key] !== after.dom[key]) failures.push('Changed ' + key);
  if (!before.transformNumbers || !after.transformNumbers) failures.push('Missing pan/zoom transform.');
  else for (const key of ['scale', 'x', 'y']) if (Math.abs(before.transformNumbers[key] - after.transformNumbers[key]) > (key === 'scale' ? 0.001 : tolerance)) failures.push('Changed transform ' + key);
  return { status: failures.length ? 'FAIL' : 'RESTORED_DOM_CHECK_PASS', failures, before: before.transformNumbers, after: after.transformNumbers,
    remainingChecks: ['Copy actual source from the restored webview and compare fixture text', 'Confirm an actual profile restart occurred between captures'] };
}

async function checkHost(client, host, output) {
  const hostStatus = await host.request('status');
  await fs.writeFile(path.join(output, 'fixture-status.json'), JSON.stringify(hostStatus, null, 2));
  if (client.expectedApp) {
    const loaded = await fs.realpath(hostStatus.result.mermaidExtensionPath);
    const expected = await fs.realpath(path.join(client.expectedApp, 'Contents/Resources/app/extensions/mermaid-markdown-features'));
    if (loaded !== expected) throw new Error('Actual activated Mermaid extension is outside --expected-app.');
  }
  return hostStatus;
}

export async function runMatrix(client, host, output) {
  await fs.mkdir(output, { recursive: true }); const rows = [];
  await checkHost(client, host, output);
  for (const surface of fixture.cases.surfaces) for (const theme of fixture.cases.themes) for (const diagram of fixture.cases.cases) {
    const row = { caseId: diagram.id, theme: theme.id, surface };
    await host.request('close-editors'); const since = Date.now();
    const command = await host.request(surface, { caseId: row.caseId, theme: row.theme });
    try {
      const observed = await client.snapshot(row, { since, screenshot: path.join(output, `${surface}-${row.theme}-${row.caseId}.png`) });
      rows.push({ ...row, command, ...observed });
    } catch (error) { rows.push({ ...row, command, status: 'FAIL', error: error.message }); }
    await fs.writeFile(path.join(output, 'matrix.json'), JSON.stringify({ scope: 'Actual selected CDP documents; review remaining gates before M3 acceptance', expectedRows: 32, rows }, null, 2));
    console.log(JSON.stringify({ ...row, status: rows.at(-1).status }));
  }
  return { rows, total: rows.length, domPass: rows.filter(row => row.status === 'DOM_CHECK_PASS').length, fail: rows.filter(row => row.status === 'FAIL').length,
    remainingChecks: ['Review all screenshots for Chinese glyphs and clipping', 'Ordinary route/copy/reset interactions', 'Actual profile restart and serializer restore', 'Final build inputs and size'] };
}

export async function runInteractions(client, host, output) {
  await fs.mkdir(output, { recursive: true }); const steps = [];
  await checkHost(client, host, output);
  const row = { caseId: 'flowchart', theme: 'light', surface: 'standalone-editor' };
  const record = async (name, result) => {
    steps.push({ name, result });
    await fs.writeFile(path.join(output, 'interaction-steps.json'), JSON.stringify(steps, null, 2));
    if (result.status === 'FAIL') throw new Error(name + ': ' + JSON.stringify(result.failures));
  };
  try {
    await host.request('close-editors');
    await record('open source route', await host.request('standalone-editor', row));
    const baseline = await client.snapshot(row, { screenshot: path.join(output, 'interaction-baseline.png') });
    await record('initial DOM', baseline);
    row.webviewId = baseline.dom.mermaidWebviewId;
    await record('open webview-id route', await host.request('standalone-editor', { caseId: row.caseId, mermaidWebviewId: row.webviewId }));
    await record('id route DOM', await client.snapshot(row));
    await record('open active route', await host.request('open-active-editor', { caseId: row.caseId }));
    await record('active route DOM', await client.snapshot(row));
    for (const route of ['webview-id', 'active']) await record('copy ' + route, await host.request('copy-source', { caseId: row.caseId, ...(route === 'webview-id' ? { mermaidWebviewId: row.webviewId } : {}) }));
    for (const action of ['zoom-in', 'zoom-out', 'pan-toggle', 'pan', 'button-reset']) await record(action, await client.interact(row, action));
    await record('button reset comparison', compareRestored(baseline, await client.snapshot(row)));
    for (const route of ['webview-id', 'active']) {
      await record('prepare command reset ' + route, await client.interact(row, 'zoom-in'));
      await record('pan before command reset ' + route, await client.interact(row, 'pan'));
      await record('command reset ' + route, await host.request('reset-zoom', { caseId: row.caseId, ...(route === 'webview-id' ? { mermaidWebviewId: row.webviewId } : {}) }));
      await record('command reset comparison ' + route, compareRestored(baseline, await client.snapshot(row)));
    }
    await record('prepare persisted zoom', await client.interact(row, 'zoom-in'));
    await record('prepare persisted pan', await client.interact(row, 'pan'));
    let previous = await client.snapshot(row);
    for (const theme of ['dark', 'light', 'dark']) {
      await record('live theme ' + theme, await host.request('theme', { theme })); row.theme = theme;
      const next = await client.snapshot(row);
      await record('live theme DOM ' + theme, next);
      await record('preserve transform on theme ' + theme, compareRestored({ ...previous, dom: { ...previous.dom, theme } }, next));
      previous = next;
    }
    const beforeRestart = await client.snapshot(row, { screenshot: path.join(output, 'restore-before.png') });
    await fs.writeFile(path.join(output, 'restore-before.json'), JSON.stringify(beforeRestart, null, 2));
    await host.clearPending();
    return { status: 'INTERACTION_CHECKS_PASS_RESTART_PENDING', steps, restoreBaseline: path.join(output, 'restore-before.json'),
      remainingChecks: ['Root performs an actual graceful profile restart with the editor open', 'Run restore-check with the same private profile', 'Review actual glyph and clipping screenshots'] };
  } catch (error) { return { status: 'FAIL', steps, error: error.message }; }
}

async function main() {
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) { if (!process.argv[i].startsWith('--') || !process.argv[i + 1]) throw new Error('Use --name value pairs.'); options[process.argv[i].slice(2)] = process.argv[i + 1]; }
  if (!options.endpoint || !options.output) throw new Error('Required: --endpoint separate-CDP-endpoint --output file-or-matrix-directory.');
  const client = await WebviewCdp.connect(options.endpoint, { expectedApp: options['expected-app'] });
  try {
    const row = { caseId: options.case ?? 'flowchart', theme: options.theme ?? 'light', surface: options.surface ?? 'standalone-editor', webviewId: options['webview-id'] };
    let result;
    if (options.action === 'matrix' || options.action === 'interactions') {
      if (!options['fixture-root'] || !options['expected-app']) throw new Error('Product matrix/interactions require --fixture-root and --expected-app.');
      const run = options.action === 'matrix' ? runMatrix : runInteractions;
      result = await run(client, new FixtureClient(options['fixture-root']), path.resolve(options.output));
      await fs.writeFile(path.join(options.output, 'summary.json'), JSON.stringify(result, null, 2));
    } else {
      if (options.action === 'probe' || options.action === 'snapshot') result = await client.snapshot(row, { screenshot: options.screenshot });
      else if (options.action === 'interact') result = await client.interact(row, options.interaction);
      else if (options.action === 'restore-check') {
        if (!options.baseline) throw new Error('restore-check requires --baseline snapshot.json.');
        const before = JSON.parse(await fs.readFile(options.baseline, 'utf8'));
        const restoreRow = { caseId: options.case ?? before.dom.caseId, theme: options.theme ?? before.dom.theme, surface: options.surface ?? before.dom.surface, webviewId: before.dom.mermaidWebviewId };
        const after = await client.snapshot(restoreRow, { screenshot: options.screenshot });
        result = { ...compareRestored(before, after), after };
        if (options['fixture-root']) {
          const host = new FixtureClient(options['fixture-root']);
          await checkHost(client, host, path.dirname(path.resolve(options.output)));
          try {
            result.sourceChecks = [await host.request('copy-source', { caseId: restoreRow.caseId, mermaidWebviewId: restoreRow.webviewId }), await host.request('copy-source', { caseId: restoreRow.caseId })];
          } catch (error) { result.status = 'FAIL'; result.sourceCheckError = error.message; }
          finally { await host.clearPending(); }
        }
      } else if (!options.action || options.action === 'contexts') result = { scope: 'CDP context discovery only', contexts: await client.contextsWithDom(), sessions: [...client.sessions.values()], diagnostics: client.diagnostics };
      else throw new Error('Unknown action: ' + options.action);
      await fs.mkdir(path.dirname(path.resolve(options.output)), { recursive: true });
      await fs.writeFile(options.output, JSON.stringify(result, null, 2));
    }
    console.log(JSON.stringify({ output: options.output, status: result.status, total: result.total, domPass: result.domPass, fail: result.fail }));
    if (result.status === 'FAIL' || result.fail) process.exitCode = 1;
  } finally { await client.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
