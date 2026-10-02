#!/usr/bin/env node
// Inspector snapshot of existing main/shared objects. Never starts or imports the app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const inside = (candidate, root) => candidate === root || candidate.startsWith(`${root}${path.sep}`);
const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const run = (program, args) => {
  try { return execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch { fail(`Local authority check failed: ${program}.`); }
};
const integer = (value, label, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(value);
  if (!/^[0-9]+$/.test(String(value)) || !Number.isSafeInteger(n) || n < 1 || n > max) fail(`Invalid ${label}.`);
  return n;
};
const parseOptions = () => {
  const options = {};
  const allowed = new Set(['role', 'endpoint', 'output', 'expected-app', 'pid', 'main-pid', 'profile-root', 'expected-port', 'expected-sha256']);
  for (let i = 2; i < process.argv.length; i += 2) {
    const name = process.argv[i]?.slice(2);
    if (!process.argv[i]?.startsWith('--') || !allowed.has(name) || !process.argv[i + 1] || name in options) fail('Use unique --name value pairs from the documented options.');
    options[name] = process.argv[i + 1];
  }
  for (const name of ['role', 'endpoint', 'output', 'expected-app', 'pid', 'profile-root', 'expected-port', 'expected-sha256']) if (!options[name]) fail(`Missing --${name}.`);
  if (!['main', 'shared'].includes(options.role)) fail('Role must be main or shared.');
  if (!/^[a-f0-9]{64}$/.test(options['expected-sha256'])) fail('Expected SHA256 must be independently recorded lowercase hex.');
  return options;
};

async function preflight(options) {
  const pid = integer(options.pid, '--pid');
  const mainPID = options.role === 'main' ? pid : integer(options['main-pid'], '--main-pid');
  if (options.role === 'main' && options['main-pid'] && integer(options['main-pid'], '--main-pid') !== pid) fail('Main PID mismatch.');
  if (options.role === 'shared' && mainPID === pid) fail('Shared PID must be a child of the expected main process.');
  const port = integer(options['expected-port'], '--expected-port', 65535);
  if (port === 19480) fail('Authentication port 19480 is forbidden; no network request was made.');
  const endpoint = new URL(options.endpoint);
  if (endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || endpoint.port !== String(port) || endpoint.pathname !== '/json/list' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) fail('Endpoint must be the exact expected 127.0.0.1 inspector /json/list URL.');
  const app = await fs.realpath(options['expected-app']);
  const profile = await fs.realpath(options['profile-root']);
  if (/\s/.test(profile) || /[\r\n]/.test(app)) fail('Use an isolated profile path without whitespace.');
  if (!app.endsWith('.app') || inside(profile, app)) fail('Invalid expected app/profile separation.');
  const executableName = run('/usr/bin/plutil', ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', path.join(app, 'Contents/Info.plist')]);
  if (!executableName || executableName.includes('/') || /[\r\n]/.test(executableName)) fail('Invalid app executable name.');
  const executable = await fs.realpath(path.join(app, 'Contents/MacOS', executableName));
  if (!inside(executable, app)) fail('App executable escapes the expected bundle.');
  const mainCommand = run('/bin/ps', ['-p', String(mainPID), '-ww', '-o', 'args=']);
  const mainComm = await fs.realpath(run('/bin/ps', ['-p', String(mainPID), '-o', 'comm=']));
  const commandExecutable = new RegExp(`^(.+?/Contents/MacOS/${escapeRE(executableName)})(?=\\s|$)`).exec(mainCommand)?.[1];
  if (!commandExecutable || mainComm !== executable || await fs.realpath(commandExecutable) !== executable) fail('Expected main PID is not the expected app executable.');
  const exactFlag = (name, value) => new RegExp(`(?:^|\\s)--${escapeRE(name)}(?:=|\\s)${escapeRE(String(value))}(?=\\s|$)`).test(mainCommand);
  const commandProfiles = [...mainCommand.matchAll(/(?:^|\s)--user-data-dir(?:=|\s)([^\s]+)(?=\s|$)/g)];
  if (commandProfiles.length !== 1 || await fs.realpath(commandProfiles[0][1]) !== profile) fail('Expected main PID does not use the exact isolated profile.');
  const inspectFlag = options.role === 'main' ? 'inspect' : 'inspect-sharedprocess';
  if (!exactFlag(inspectFlag, port)) fail(`Expected main launch does not contain --${inspectFlag}=${port}.`);
  const tree = new Map();
  for (const line of run('/bin/ps', ['-axo', 'pid=,ppid=']).split('\n')) {
    const match = /^\s*(\d+)\s+(\d+)\s*$/.exec(line);
    if (match) tree.set(Number(match[1]), Number(match[2]));
  }
  const descendants = new Set([mainPID]);
  for (let changed = true; changed;) {
    changed = false;
    for (const [child, parent] of tree) if (!descendants.has(child) && descendants.has(parent)) { descendants.add(child); changed = true; }
  }
  if (!tree.has(pid) || !descendants.has(pid)) fail('Target PID is not in the expected app process tree.');
  const targetExecutable = await fs.realpath(run('/bin/ps', ['-p', String(pid), '-o', 'comm=']));
  if (options.role === 'main' ? targetExecutable !== executable : !inside(targetExecutable, path.join(app, 'Contents/Frameworks'))) fail('Inspector target executable is outside the expected app role.');
  const listener = run('/usr/sbin/lsof', ['-nP', '-a', '-p', String(pid), `-iTCP:${port}`, '-sTCP:LISTEN', '-Fpn']);
  let listenerPID;
  const sockets = [];
  for (const line of listener.split('\n')) {
    if (line.startsWith('p')) listenerPID = Number(line.slice(1));
    if (line.startsWith('n')) sockets.push(line.slice(1));
  }
  if (listenerPID !== pid || sockets.length !== 1 || sockets[0] !== `127.0.0.1:${port}`) fail('Expected PID does not exclusively expose the expected loopback listener.');
  const relativeScript = options.role === 'main' ? 'main.js' : 'vs/code/electron-utility/sharedProcess/sharedProcessMain.js';
  const script = await fs.realpath(path.join(app, 'Contents/Resources/app/out', relativeScript));
  if (!inside(script, app)) fail('Expected script escapes app.');
  const diskSource = await fs.readFile(script, 'utf8');
  const diskSHA256 = sha256(diskSource);
  if (diskSHA256 !== options['expected-sha256']) fail('App script SHA256 differs from the independently supplied expected hash.');
  const outputRequested = path.resolve(options.output);
  const outputParent = await fs.realpath(path.dirname(outputRequested));
  const output = path.join(outputParent, path.basename(outputRequested));
  if (inside(output, app) || inside(output, profile)) fail('Output must be separate from app and profile.');
  try { await fs.lstat(output); fail('Output must be a new directory.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return { options, pid, mainPID, port, endpoint, app, profile, executable, targetExecutable, script, diskSource, diskSHA256, output, tree, descendants, parentPID: tree.get(pid) };
}

class Inspector {
  constructor(socket) {
    this.socket = socket;
    this.serial = 0;
    this.pending = new Map();
    this.scripts = [];
    this.stage = 'initialization';
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (message.method === 'Debugger.scriptParsed') this.scripts.push(message.params);
      if (!message.id || !this.pending.has(message.id)) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(`Inspector command ${pending.method} rejected.`));
      else pending.resolve(message.result);
    });
    socket.addEventListener('close', () => { for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Inspector socket closed.')); } this.pending.clear(); });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { socket.close(); reject(new Error('Inspector connection timed out.')); }, 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Inspector connection failed.')); }, { once: true });
    });
    return new Inspector(socket);
  }
  send(method, params = {}) {
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Inspector command ${method} timed out.`)); }, 10000);
      this.pending.set(id, { resolve, reject, timer, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  props(object) {
    if (!object?.objectId) fail('Expected inspector object reference.');
    return this.send('Runtime.getProperties', { objectId: object.objectId, ownProperties: true, accessorPropertiesOnly: false, generatePreview: false });
  }
  async evaluate(expression, byValue = false) {
    const response = await this.send('Runtime.evaluate', { expression, objectGroup: 'lean-main-shared-readonly', returnByValue: byValue, generatePreview: false, silent: true });
    if (response.exceptionDetails || !response.result) fail('Read-only inspector expression failed.');
    return byValue ? response.result.value : response.result;
  }
  async call(object, functionDeclaration, args = []) {
    const response = await this.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration, arguments: args.map(value => value?.objectId ? { objectId: value.objectId } : { value }), objectGroup: 'lean-main-shared-readonly', returnByValue: true, generatePreview: false, silent: true });
    if (response.exceptionDetails || !response.result) {
      const firstLine = response.exceptionDetails?.exception?.description?.split('\n')[0];
      const safeCause = /^Error: (Expected own data descriptor|Unexpected query result|Unexpected channel name|Unexpected role field|Unexpected process PID|Configuration is not a plain data object|Utility registry PID mismatch)$/.test(firstLine || '') ? firstLine : 'exception detail suppressed';
      fail(`Read-only ${this.stage} failed: ${safeCause}.`);
    }
    return response.result.value;
  }
}

function bindingBefore(source, marker) {
  const first = source.indexOf(marker);
  if (first < 0 || source.indexOf(marker, first + marker.length) !== -1) fail('Class storage marker is missing or ambiguous in the verified bundle.');
  const prefix = source.slice(Math.max(0, first - 1800), first);
  const candidates = [...prefix.matchAll(/([A-Za-z_$][\w$]*)=class(?:\s|\{)/g)];
  if (!candidates.length) fail('No exact class binding precedes the verified storage marker.');
  return candidates.at(-1)[1];
}

function functionLocation(source, offset) {
  const prefix = source.slice(0, offset);
  const lineNumber = (prefix.match(/\n/g) || []).length;
  const lastNewline = prefix.lastIndexOf('\n');
  return { lineNumber, columnNumber: offset - lastNewline - 1 };
}
function constructorLocation(source, binding) {
  const occurrences = [...source.matchAll(new RegExp(`\\b${escapeRE(binding)}=class(?:\\s|\\{)`, 'g'))];
  if (occurrences.length !== 1) fail('Exact class assignment location is ambiguous.');
  const offset = source.indexOf('constructor(', occurrences[0].index);
  if (offset < 0 || offset - occurrences[0].index > 20000) fail('Exact constructor source location is unavailable.');
  return functionLocation(source, offset + 'constructor'.length);
}
function sharedIPCAnchor(source, ipcBinding) {
  const matches = [...source.matchAll(new RegExp(`([A-Za-z_$][\\w$]*)=class(?:\\s+[A-Za-z_$][\\w$]*)?\\s+extends\\s+${escapeRE(ipcBinding)}(?=\\s|\\{)`, 'g'))];
  if (matches.length !== 1) fail('Existing IPC subclass anchor in the verified shared bundle is ambiguous.');
  return matches[0][1];
}

async function moduleBindings(c, loaded, names, ipcAnchor) {
  const eventMap = await c.evaluate("Object.getOwnPropertyDescriptor(process, '_events')?.value");
  const events = (await c.props(eventMap)).result;
  const callbacks = [];
  for (const name of ['uncaughtException', 'unhandledRejection']) {
    const event = events.find(property => property.name === name && property.value)?.value;
    if (!event) continue;
    if (event.type === 'function') callbacks.push({ name, object: event });
    else if (event.subtype === 'array') {
      for (const item of (await c.props(event)).result) if (/^\d+$/.test(item.name) && item.value?.type === 'function') callbacks.push({ name, object: item.value });
    }
  }
  if (!callbacks.length || callbacks.length > 32) fail('Existing process error callbacks are unavailable or ambiguous.');
  const matches = [];
  let verifiedCallbackCount = 0, moduleScopeCount = 0;
  const bindingTypes = [];
  for (const callback of callbacks) {
    const properties = await c.props(callback.object);
    const location = properties.internalProperties?.find(property => property.name === '[[FunctionLocation]]')?.value?.value;
    if (!location || location.scriptId !== loaded.scriptId) continue;
    verifiedCallbackCount++;
    const scopes = properties.internalProperties?.find(property => property.name === '[[Scopes]]')?.value;
    if (!scopes?.objectId) continue;
    for (const scope of (await c.props(scopes)).result) {
      if (scope.value?.description !== 'Module') continue;
      moduleScopeCount++;
      const bindings = (await c.props(scope.value)).result;
      const selected = Object.fromEntries(Object.entries(names).map(([kind, name]) => [kind, bindings.find(property => property.name === name)?.value]));
      bindingTypes.push(Object.fromEntries(Object.entries(selected).map(([kind, value]) => [kind, value?.type || 'absent'])));
      if (!selected.ipcServer?.objectId && ipcAnchor) {
        const anchor = bindings.find(property => property.name === ipcAnchor)?.value;
        if (anchor?.objectId && anchor.type === 'function') { delete selected.ipcServer; selected.ipcServerAnchor = anchor; }
      }
      if (Object.values(selected).every(value => value?.objectId && value.type === 'function')) matches.push({ callback: callback.name, selected });
    }
  }
  if (!matches.length) fail(`Existing callback Module identity unavailable: verifiedCallbacks=${verifiedCallbackCount}, moduleScopes=${moduleScopeCount}, bindingTypes=${JSON.stringify(bindingTypes)}; imports/factories are forbidden.`);
  // Multiple error listeners may expose the same Module; object identity is checked below.
  const candidate = matches[0];
  for (const other of matches.slice(1)) for (const kind of Object.keys(candidate.selected)) {
    if (!other.selected[kind]?.objectId) fail('Callback Module candidates use different class identity paths.');
    c.stage = `${kind} Module identity comparison`;
    if (!await c.call(candidate.selected[kind], 'function(other) { return this === other; }', [other.selected[kind]])) fail('More than one distinct Module class candidate exists.');
  }
  return candidate;
}

function requireLocation(actual, expected, scriptId, label) {
  if (!actual || actual.scriptId !== scriptId || actual.lineNumber !== expected.lineNumber || actual.columnNumber !== expected.columnNumber) fail(`${label} constructor is not at the exact verified script source location.`);
}

async function checkedPrototype(c, ctor, kind, scriptId, expectedLocation) {
  const props = await c.props(ctor);
  const location = props.internalProperties?.find(property => property.name === '[[FunctionLocation]]')?.value?.value;
  requireLocation(location, expectedLocation, scriptId, kind);
  const prototype = props.result.find(property => property.name === 'prototype')?.value;
  if (!prototype?.objectId) fail(`${kind} exact prototype unavailable.`);
  c.stage = `${kind} exact prototype identity`;
  const identity = await c.call(ctor, `function(prototype) {
    const d = Object.getOwnPropertyDescriptor(prototype, 'constructor');
    const methods = Object.getOwnPropertyNames(prototype).filter(name => typeof Object.getOwnPropertyDescriptor(prototype, name)?.value === 'function');
    return { constructorMatches: d?.value === this, methods };
  }`, [prototype]);
  const required = { channelServer: ['registerChannel', 'onRawMessage', 'sendResponse', 'dispose'], ipcServer: ['registerChannel', 'getChannel', 'dispose'], utilityProcess: ['start', 'doStart', 'registerListeners', 'kill', 'enableInspectPort'] }[kind];
  if (!identity.constructorMatches || required.some(method => !identity.methods.includes(method))) fail(`${kind} exact prototype identity failed.`);
  return { prototype, identity, location };
}

async function existingIPCBase(c, anchor, anchorName, source, scriptId) {
  const anchorProps = await c.props(anchor);
  const location = anchorProps.internalProperties?.find(property => property.name === '[[FunctionLocation]]')?.value?.value;
  requireLocation(location, constructorLocation(source, anchorName), scriptId, 'Existing IPC subclass anchor');
  const prototype = anchorProps.result.find(property => property.name === 'prototype')?.value;
  if (!prototype?.objectId) fail('Existing IPC subclass has no own prototype.');
  const prototypeProps = await c.props(prototype);
  const ownConstructor = prototypeProps.result.find(property => property.name === 'constructor')?.value;
  c.stage = 'existing IPC subclass own constructor identity';
  if (!ownConstructor?.objectId || !await c.call(anchor, 'function(other) { return this === other; }', [ownConstructor])) fail('Existing IPC subclass own constructor does not match the Module anchor.');
  const parentPrototype = prototypeProps.internalProperties?.find(property => property.name === '[[Prototype]]')?.value;
  if (!parentPrototype?.objectId) fail('Existing IPC subclass has no available prototype parent.');
  const base = (await c.props(parentPrototype)).result.find(property => property.name === 'constructor')?.value;
  if (!base?.objectId || base.type !== 'function') fail('Existing IPC prototype parent has no own constructor.');
  return { base, parentPrototype, anchorLocation: location };
}

const serverSnapshot = `function(kind) {
  const own = (object, key) => { const d = Object.getOwnPropertyDescriptor(object, key); if (!d || !('value' in d)) throw Error('Expected own data descriptor'); return d.value; };
  const mapSize = Object.getOwnPropertyDescriptor(Map.prototype, 'size').get;
  const setSize = Object.getOwnPropertyDescriptor(Set.prototype, 'size').get;
  const result = [];
  let excludedDerivedPrototypeCount = 0;
  if (!Array.isArray(this) || this.length > 10000) throw Error('Unexpected query result');
  for (const instance of this) {
    const ctor = Object.getOwnPropertyDescriptor(instance, 'constructor')?.value;
    if (typeof ctor === 'function' && Object.getOwnPropertyDescriptor(ctor, 'prototype')?.value === instance) { excludedDerivedPrototypeCount++; continue; }
    const channels = own(instance, 'channels');
    const names = Array.from(Map.prototype.keys.call(channels));
    if (names.some(name => typeof name !== 'string' || name.length > 256 || /[\\r\\n]/.test(name))) throw Error('Unexpected channel name');
    const item = { registeredChannels: names.sort(), channelCount: mapSize.call(channels) };
    if (kind === 'channelServer') { item.activeRequestCount = mapSize.call(own(instance, 'activeRequests')); item.pendingChannelCount = mapSize.call(own(instance, 'pendingRequests')); }
    if (kind === 'ipcServer') item.connectionCount = setSize.call(own(instance, '_connections'));
    result.push(item);
  }
  return { instances: result, excludedDerivedPrototypeCount };
}`;
const utilitySnapshot = `function(ctor) {
  const own = (object, key, optional = false) => { const d = Object.getOwnPropertyDescriptor(object, key); if ((!d || !('value' in d)) && !optional) throw Error('Expected own data descriptor'); return d?.value; };
  const text = value => { if (typeof value !== 'string' || value.length > 1024 || /[\\r\\n]/.test(value)) throw Error('Unexpected role field'); return value; };
  const pid = value => { if (!Number.isSafeInteger(value) || value < 1) throw Error('Unexpected process PID'); return value; };
  if (!Array.isArray(this) || this.length > 10000) throw Error('Unexpected query result');
  const instances = [];
  let inactiveInstanceCount = 0;
  let excludedDerivedPrototypeCount = 0;
  for (const instance of this) {
    const instanceCtor = Object.getOwnPropertyDescriptor(instance, 'constructor')?.value;
    if (typeof instanceCtor === 'function' && Object.getOwnPropertyDescriptor(instanceCtor, 'prototype')?.value === instance) { excludedDerivedPrototypeCount++; continue; }
    const processPid = own(instance, 'processPid');
    const configuration = own(instance, 'configuration');
    if (!processPid || !configuration) { inactiveInstanceCount++; continue; }
    if (![Object.prototype, null].includes(Object.getPrototypeOf(configuration))) throw Error('Configuration is not a plain data object');
    instances.push({ pid: pid(processPid), type: text(own(configuration, 'type')), name: text(own(configuration, 'name')), entryPoint: text(own(configuration, 'entryPoint')) });
  }
  const registry = own(ctor, 'all');
  const registered = [];
  for (const [key, info] of Map.prototype.entries.call(registry)) {
    if (pid(own(info, 'pid')) !== pid(key)) throw Error('Utility registry PID mismatch');
    registered.push({ pid: pid(key), name: text(own(info, 'name')) });
  }
  return { instances, inactiveInstanceCount, excludedDerivedPrototypeCount, registered };
}`;

async function capture(authority) {
  const { options, pid, endpoint, port, script, diskSource, diskSHA256 } = authority;
  // All app/PID/profile/listener/hash checks completed before the first HTTP request.
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000), redirect: 'error' });
  if (!response.ok) fail('Inspector target list request failed.');
  const targets = await response.json();
  if (!Array.isArray(targets) || targets.length !== 1 || targets[0].type !== 'node' || typeof targets[0].webSocketDebuggerUrl !== 'string') fail('Expected exactly one Node inspector target.');
  const websocket = new URL(targets[0].webSocketDebuggerUrl);
  if (websocket.protocol !== 'ws:' || websocket.hostname !== '127.0.0.1' || websocket.port !== String(port) || websocket.username || websocket.password || websocket.search || websocket.hash) fail('Inspector websocket differs from the verified local listener.');
  const c = await Inspector.connect(websocket.href);
  try {
    await c.send('Runtime.enable');
    await c.send('Debugger.enable');
    const runtimeProcess = await c.evaluate('({pid:process.pid, ppid:process.ppid})', true);
    if (runtimeProcess?.pid !== pid || runtimeProcess?.ppid !== authority.parentPID) fail('Inspector process PID/parent differs from OS authority.');
    const matches = [];
    for (const loaded of c.scripts) {
      if (!loaded.url) continue;
      let loadedPath;
      try { loadedPath = loaded.url.startsWith('file:') ? fileURLToPath(loaded.url) : path.isAbsolute(loaded.url) ? loaded.url : undefined; } catch { continue; }
      if (!loadedPath) continue;
      try { if (await fs.realpath(loadedPath) === script) matches.push(loaded); } catch { /* Unrelated script, do not read it. */ }
    }
    if (matches.length !== 1) fail('Expected app script is not uniquely already loaded.');
    const loaded = matches[0];
    const actualSource = (await c.send('Debugger.getScriptSource', { scriptId: loaded.scriptId })).scriptSource;
    if (typeof actualSource !== 'string' || sha256(actualSource) !== diskSHA256 || actualSource !== diskSource) fail('Actual loaded script does not match expected app script bytes.');
    const names = {
      channelServer: bindingBefore(actualSource, 'this.channels=new Map,this.activeRequests=new Map'),
      ipcServer: bindingBefore(actualSource, 'this.channels=new Map,this._connections=new Set'),
      ...(options.role === 'main' ? { utilityProcess: bindingBefore(actualSource, 'static{this.all=new Map}') } : {})
    };
    const ipcAnchor = options.role === 'shared' ? sharedIPCAnchor(actualSource, names.ipcServer) : undefined;
    const module = await moduleBindings(c, loaded, names, ipcAnchor);
    let ipcSourceChain;
    if (module.selected.ipcServerAnchor) {
      const existing = await existingIPCBase(c, module.selected.ipcServerAnchor, ipcAnchor, actualSource, loaded.scriptId);
      delete module.selected.ipcServerAnchor;
      module.selected.ipcServer = existing.base;
      ipcSourceChain = { moduleAnchorBinding: ipcAnchor, anchorLocation: existing.anchorLocation, parentPrototype: existing.parentPrototype };
    }
    const identity = {};
    const servers = {};
    let utilities;
    for (const [kind, ctor] of Object.entries(module.selected)) {
      const checked = await checkedPrototype(c, ctor, kind, loaded.scriptId, constructorLocation(actualSource, names[kind]));
      identity[kind] = { binding: names[kind], ...checked.identity, location: checked.location };
      if (kind === 'ipcServer' && ipcSourceChain) {
        c.stage = 'existing IPC prototype parent exact identity';
        if (!await c.call(checked.prototype, 'function(other) { return this === other; }', [ipcSourceChain.parentPrototype])) fail('Existing IPC prototype parent differs from the exact verified base prototype.');
        identity[kind].existingSourceChain = { moduleAnchorBinding: ipcSourceChain.moduleAnchorBinding, anchorLocation: ipcSourceChain.anchorLocation, ownPrototypeParentIsExactBase: true };
      }
      const objects = await c.send('Runtime.queryObjects', { prototypeObjectId: checked.prototype.objectId, objectGroup: 'lean-main-shared-readonly' });
      if (!objects.objects?.objectId) fail(`${kind} existing object query failed.`);
      c.stage = `${kind} existing object descriptor snapshot`;
      if (kind === 'utilityProcess') utilities = await c.call(objects.objects, utilitySnapshot, [ctor]);
      else servers[kind] = await c.call(objects.objects, serverSnapshot, [kind]);
    }
    const channelNames = [...new Set(Object.values(servers).flatMap(collection => collection.instances).flatMap(server => server.registeredChannels))].sort();
    if (!channelNames.length) fail('Verified IPC objects have no registered channels; initialization cannot be accepted.');
    if (utilities) {
      for (const item of [...utilities.instances, ...utilities.registered]) {
        if (!authority.descendants.has(item.pid) || !authority.tree.has(item.pid)) fail('Utility PID is absent from the verified app process tree; capture again after stable startup.');
        item.parentPID = authority.tree.get(item.pid);
      }
    }
    return {
      capturedAt: new Date().toISOString(), status: 'RUNTIME_CAPTURED_UNASSESSED', role: options.role,
      authority: { app: authority.app, profile: authority.profile, pid, parentPID: authority.parentPID, mainPID: authority.mainPID, port, listener: `127.0.0.1:${port}`, executable: authority.targetExecutable },
      module: { script, scriptId: loaded.scriptId, diskSHA256, loadedSHA256: sha256(actualSource), callback: module.callback, bindingNames: names },
      identity, servers, channelNames, ...(utilities ? { utilities } : {}),
      boundaries: { noAppLaunch: true, noImports: true, existingCallbackModuleOnly: true, exactPrototypesOnly: true, noServiceFactories: true, noDIGet: true, noChannelCalls: true, noEnvironmentOrStartupArgumentsSerialized: true, noAcceptanceVerdict: true }
    };
  } finally {
    try { await c.send('Runtime.releaseObjectGroup', { objectGroup: 'lean-main-shared-readonly' }); } catch { /* Socket may already have closed. */ }
    c.socket.close();
  }
}

try {
  const authority = await preflight(parseOptions());
  const result = await capture(authority);
  const after = await preflight(authority.options);
  if (after.pid !== authority.pid || after.parentPID !== authority.parentPID || after.mainPID !== authority.mainPID || after.app !== authority.app || after.profile !== authority.profile || after.diskSHA256 !== authority.diskSHA256) fail('App/process/profile/hash authority changed during capture.');
  result.authorityRecheckedAfterCapture = true;
  await fs.mkdir(authority.output, { mode: 0o700 });
  await fs.writeFile(path.join(authority.output, 'snapshot.json'), `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ status: result.status, role: result.role, pid: result.authority.pid, channelCount: result.channelNames.length, output: authority.output }));
} catch (error) {
  console.error(JSON.stringify({ status: 'FAILED_NO_ACCEPTANCE', reason: error.message }));
  process.exitCode = 1;
}
