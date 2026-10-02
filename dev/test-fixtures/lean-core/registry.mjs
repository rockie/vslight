#!/usr/bin/env node
// Reads registries from an already running product window. Does not start the app.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  if (!process.argv[i].startsWith('--') || !process.argv[i + 1]) throw new Error('Arguments must be --name value pairs.');
  options[process.argv[i].slice(2)] = process.argv[i + 1];
}
for (const name of ['endpoint', 'output', 'expected-app', 'pid', 'profile-root', 'expected-port']) if (!options[name]) throw new Error(`Missing --${name}.`);
const mainPID = Number(options.pid);
const expectedPort = Number(options['expected-port']);
if (!Number.isSafeInteger(mainPID) || mainPID < 1) throw new Error('Invalid --pid.');
if (!Number.isSafeInteger(expectedPort) || expectedPort < 1 || expectedPort > 65535) throw new Error('Invalid --expected-port.');
const endpoint = new URL(options.endpoint);
if (endpoint.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(endpoint.hostname) || endpoint.port !== String(expectedPort) || endpoint.pathname !== '/json/list' || endpoint.username || endpoint.password || endpoint.search) throw new Error('Endpoint is not the expected local CDP port.');
const expectedApp = await fs.realpath(options['expected-app']);
const profileRoot = await fs.realpath(options['profile-root']);
const executableName = execFileSync('plutil', ['-extract', 'CFBundleExecutable', 'raw', '-o', '-', path.join(expectedApp, 'Contents/Info.plist')], { encoding: 'utf8' }).trim();
const expectedExecutable = await fs.realpath(path.join(expectedApp, 'Contents/MacOS', executableName));
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const flagValue = (command, flag) => {
  const match = command.match(new RegExp('(?:^|\\s)' + escapeRegExp(flag) + '(?:=|\\s+)("[^"]*"|\'[^\']*\'|\\S+)'));
  return match?.[1].replace(/^["']|["']$/g, '');
};
// A port can be reused by another private session. Bind the process, executable,
// user-data directory and listener before any HTTP/CDP Runtime/Debugger probe.
const verifyAuthority = async () => {
  const raw = execFileSync('ps', ['-p', String(mainPID), '-o', 'pid=,ppid=,command='], { encoding: 'utf8' }).trim();
  const match = raw.match(/^(\d+)\s+(\d+)\s+(.*)$/);
  if (!match || Number(match[1]) !== mainPID) throw new Error('Expected main PID is not running.');
  const command = match[3];
  const executable = command.match(/^(.+?\/Contents\/MacOS\/[^ ]+)/)?.[1];
  if (!executable || await fs.realpath(executable) !== expectedExecutable) throw new Error('Main PID is not the expected app executable.');
  const userData = flagValue(command, '--user-data-dir');
  if (!userData || await fs.realpath(userData) !== profileRoot) throw new Error('Main PID is not using the expected private profile.');
  if (flagValue(command, '--remote-debugging-port') !== String(expectedPort)) throw new Error('Main PID does not specify the expected CDP port.');
  const listener = execFileSync('/usr/sbin/lsof', ['-nP', '-a', '-p', String(mainPID), '-iTCP:' + expectedPort, '-sTCP:LISTEN', '-Fpn'], { encoding: 'utf8' });
  if (!listener.split('\n').includes('p' + mainPID) || !listener.split('\n').some(line => line.startsWith('n') && line.endsWith(':' + expectedPort))) throw new Error('Expected main PID does not own the CDP listener.');
  return { mainPID, parentPID: Number(match[2]), command, expectedExecutable, profileRoot, expectedPort, endpoint: endpoint.href, listener };
};
const authorityBefore = await verifyAuthority();
const output = path.resolve(options.output);
await fs.mkdir(output, { recursive: true });
if ((await fs.readdir(output)).length) throw new Error('Output directory must be empty to prevent mixed captures.');

class CDP {
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
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async call(object, declaration, args = []) {
    const result = await this.send('Runtime.callFunctionOn', {
      objectId: object.objectId, functionDeclaration: declaration,
      arguments: args.map(arg => arg?.objectId ? { objectId: arg.objectId } : { value: arg }),
      returnByValue: true, objectGroup: 'lean-runtime-registries'
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async props(object) { return this.send('Runtime.getProperties', { objectId: object.objectId, ownProperties: true }); }
}

// All getters below belong to the verified runtime registry objects. The serializer
// uses data descriptors and skips service objects; it never calls constructors,
// commands, DI.get(), channel.call(), or UI actions.
const serialize = `function clean(value, depth = 0, seen = new Set()) {
  if (value === undefined) return undefined;
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'function') return { functionName: value.name };
  if (depth > 14) return { truncated: 'depth' };
  if (seen.has(value)) return { truncated: 'cycle' };
  seen.add(value);
  const localMethod = name => {
    for (let prototype = Object.getPrototypeOf(value); prototype && prototype !== Object.prototype; prototype = Object.getPrototypeOf(prototype)) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor && typeof descriptor.value === 'function') return descriptor.value;
    }
  };
  let result;
  if (value instanceof Map) result = [...value].map(([k, v]) => [clean(k, depth + 1, seen), clean(v, depth + 1, seen)]);
  else if (value instanceof Set || Array.isArray(value)) result = [...value].map(v => clean(v, depth + 1, seen));
  else if (localMethod('serialize') && localMethod('evaluate') && localMethod('keys')) result = { expression: localMethod('serialize').call(value) };
  else {
    result = {};
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable || !('value' in descriptor) || typeof descriptor.value === 'function') continue;
      if (key === 'treeView') { result[key] = { opaqueRuntimeInstance: true }; continue; }
      if (key === 'ctorDescriptor' && descriptor.value && typeof descriptor.value === 'object') {
        const own = Object.getOwnPropertyDescriptors(descriptor.value);
        if (typeof own.ctor?.value === 'function' && Array.isArray(own.staticArguments?.value)) {
          result[key] = { ctor: own.ctor.value.name, supportsDelayedInstantiation: own.supportsDelayedInstantiation?.value,
            staticArguments: own.staticArguments.value.map(arg => arg === null || ['string', 'number', 'boolean'].includes(typeof arg) ? arg : { opaqueArgument: true, type: typeof arg }) };
          continue;
        }
      }
      result[key] = clean(descriptor.value, depth + 1, seen);
    }
  }
  seen.delete(value);
  return result;
}`;
const hash = data => createHash('sha256').update(data).digest('hex');
const assignmentBefore = (source, marker) => {
  const offset = source.indexOf(marker);
  if (offset < 0) throw new Error(`Loaded bundle marker unavailable: ${marker}`);
  const candidates = [...source.slice(Math.max(0, offset - 1500), offset).matchAll(/([A-Za-z_$][\w$]*)=(?:new class|class)(?:\s|\{)/g)];
  if (!candidates.length) throw new Error(`Loaded bundle owner unavailable: ${marker}`);
  return candidates.at(-1)[1];
};
const write = async (name, value) => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2) + '\n');
await write('authority-before.json', authorityBefore);
const targets = await (await fetch(options.endpoint)).json();
await write('targets.json', targets);
const pages = targets.filter(t => t.type === 'page' && t.url.endsWith('/workbench/workbench.html'));
if (pages.length !== 1) throw new Error(`Expected one workbench window; found ${pages.length}.`);
const target = pages[0];
const targetPath = decodeURIComponent(new URL(target.url).pathname);
if (!(await fs.realpath(targetPath)).startsWith(expectedApp + '/Contents/')) throw new Error('CDP window is outside the expected app.');
const debuggerURL = new URL(target.webSocketDebuggerUrl);
if (debuggerURL.protocol !== 'ws:' || !['127.0.0.1', 'localhost'].includes(debuggerURL.hostname) || debuggerURL.port !== String(expectedPort)) throw new Error('Workbench debugger is outside the expected local CDP port.');
const c = await new CDP(target.webSocketDebuggerUrl).connect();
try {
  await c.send('Runtime.enable');
  await c.send('Debugger.enable');
  const scripts = c.events.filter(e => e.method === 'Debugger.scriptParsed').map(e => e.params);
  const mains = scripts.filter(s => s.isModule && s.url.endsWith('/vs/workbench/workbench.desktop.main.js'));
  if (mains.length !== 1) throw new Error('Expected exactly one already-loaded workbench main ES module.');
  const loaded = mains[0];
  const source = (await c.send('Debugger.getScriptSource', { scriptId: loaded.scriptId })).scriptSource;
  const file = decodeURIComponent(new URL(loaded.url).pathname);
  const diskHash = hash(await fs.readFile(file));
  if (hash(source) !== diskHash) throw new Error('Loaded main differs from the expected app file.');
  const beforeImport = c.events.length;
  // Exact URL already verified as loaded. Import resolves the ESM cache. No main()
  // invocation, alternative URL, cache-busting query, or standalone source import.
  const imported = await c.send('Runtime.evaluate', {
    expression: `import(${JSON.stringify(loaded.url)}).then(module => module.main)`,
    awaitPromise: true, objectGroup: 'lean-runtime-registries'
  });
  if (imported.exceptionDetails || imported.result.type !== 'function') throw new Error('Cached main export unavailable.');
  const importedScripts = c.events.slice(beforeImport).filter(e => e.method === 'Debugger.scriptParsed' && e.params.isModule);
  if (importedScripts.length) throw new Error('Cache import unexpectedly parsed a new module.');
  const mainProperties = await c.props(imported.result);
  const scopeList = mainProperties.internalProperties.find(p => p.name === '[[Scopes]]')?.value;
  if (!scopeList) throw new Error('main [[Scopes]] unavailable.');
  const scopeProperties = await c.props(scopeList);
  const moduleScope = scopeProperties.result.find(p => p.value?.description === 'Module')?.value;
  if (!moduleScope) throw new Error('main Module scope unavailable.');
  const bindings = Object.fromEntries((await c.props(moduleScope)).result.map(p => [p.name, p.value]));
  const registryClass = assignmentBefore(source, 'this.data=new Map}add(');
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const requiredMatch = expression => { const value = source.match(expression)?.[1]; if (!value) throw new Error(`Loaded bundle binding unavailable: ${expression}`); return value; };
  const names = options['bindings-file'] ? JSON.parse(await fs.readFile(options['bindings-file'], 'utf8')) : {
    commands: assignmentBefore(source, 'this._onDidRegisterCommand=new'),
    keybindings: requiredMatch(/([A-Za-z_$][\w$]*)=new [A-Za-z_$][\w$]*,[A-Za-z_$][\w$]*=\{EditorModes:"platform\.keybindingsRegistry"\}/),
    registry: requiredMatch(new RegExp('([A-Za-z_$][\\w$]*)=new '+escapeRegExp(registryClass)+'(?:[,;])')),
    menus: assignmentBefore(source, 'this._menuItems=new Map'),
    menuId: assignmentBefore(source, 'this._instances=new Map}static{this.CommandPalette='),
    singletonDescriptors: requiredMatch(/this\.supportsDelayedInstantiation=[A-Za-z_$][\w$]*}},([A-Za-z_$][\w$]*)=\[\]/),
    workbench: assignmentBefore(source, 'this.serviceCollection='),
    channelServer: assignmentBefore(source, 'this.channels=new Map,this.activeRequests=new Map'),
    statusbarModel: assignmentBefore(source, 'workbench.statusbar.hidden')
  };
  names.statusbarModel ??= assignmentBefore(source, 'workbench.statusbar.hidden');
  for (const binding of Object.values(names)) if (!bindings[binding]?.objectId) throw new Error(`Missing runtime binding ${binding}.`);
  const objects = Object.fromEntries(Object.entries(names).map(([kind,name])=>[kind,bindings[name]]));
  const identity = await c.call(objects.registry, `function(commands, keybindings, menus, menuId, descriptors, workbench, channelServer, statusbarModel) {
    const methods = object => { const result = new Set(); for (let p = object; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) for (const k of Object.getOwnPropertyNames(p)) if (typeof Object.getOwnPropertyDescriptor(p, k)?.value === 'function') result.add(k); return [...result]; };
    return {
      commands: methods(commands), keybindings: methods(keybindings), registry: methods(this), menus: methods(menus),
      menuIdMap: menuId._instances instanceof Map, singletonArray: Array.isArray(descriptors),
      keybindingsSameRegistry: this.as('platform.keybindingsRegistry') === keybindings,
      configurations: methods(this.as('base.contributions.configuration')),
      containers: methods(this.as('workbench.registry.view.containers')),
      views: methods(this.as('workbench.registry.view')),
      workbench: methods(workbench.prototype), channelServer: methods(channelServer.prototype),
      statusbarModel: methods(statusbarModel.prototype),
      statusbarModelStorageKey: Object.getOwnPropertyDescriptor(statusbarModel, 'HIDDEN_ENTRIES_KEY')?.value
    };
  }`, [objects.commands, objects.keybindings, objects.menus, objects.menuId, objects.singletonDescriptors, objects.workbench, objects.channelServer, objects.statusbarModel]);
  for (const [kind, required] of Object.entries({ commands: ['getCommands', 'getCommand'], keybindings: ['getDefaultKeybindings'], registry: ['as', 'knows'], menus: ['getMenuItems', 'getCommands'], configurations: ['getConfigurationProperties', 'getExcludedConfigurationProperties'], containers: ['getViewContainers'], views: ['getViews', 'getViewWelcomeContent'], workbench: ['startup', 'initServices'], channelServer: ['registerChannel'], statusbarModel: ['add', 'remove', 'isHidden', 'hide', 'show'] })) {
    if (required.some(m => !identity[kind].includes(m))) throw new Error(`Invalid ${kind} binding identity.`);
  }
  if (identity.statusbarModelStorageKey !== 'workbench.statusbar.hidden') throw new Error('Statusbar model identity mismatch.');
  if (!identity.keybindingsSameRegistry || !identity.menuIdMap || !identity.singletonArray) throw new Error('Runtime registry identity mismatch.');
  await write('identity.json', { names, identity, scriptId: loaded.scriptId, loadedModuleURL: loaded.url, loadedSHA256: hash(source), diskSHA256: diskHash, cachedImportNewModuleCount: importedScripts.length, scopeBindingCount: Object.keys(bindings).length });
  const registries = await c.call(objects.registry, `function(commands, keybindings, menus, menuId, descriptors) {
    ${serialize}
    const config = this.as('base.contributions.configuration');
    const containers = this.as('workbench.registry.view.containers');
    const views = this.as('workbench.registry.view');
    if (!(this.data instanceof Map) || !(views._views instanceof Map) || !(views._viewWelcomeContents?.map instanceof Map)) throw Error('Unexpected registry storage shape');
    const allContainers = containers.all;
    return {
      commands: [...commands.getCommands()].map(([id, command]) => ({ id, description: clean(command.description), handlerName: command.handler.name })),
      commandMetadata: [...menus.getCommands()].map(([id, command]) => ({ id, command: clean(command) })),
      settings: Object.entries(config.getConfigurationProperties()).map(([id, schema]) => ({ id, schema: clean(schema) })),
      excludedSettings: Object.entries(config.getExcludedConfigurationProperties()).map(([id, schema]) => ({ id, schema: clean(schema) })),
      configurations: clean(config.getConfigurations()),
      keybindings: clean(keybindings.getDefaultKeybindings()),
      menus: [...menuId._instances].map(([id, menu]) => ({ id, explicitlyRegistered: menus._menuItems.has(menu), items: clean(menus.getMenuItems(menu)) })),
      containers: allContainers.map(container => ({ location: containers.getViewContainerLocation(container), descriptor: clean(container) })),
      views: [...views._views].map(([container, descriptors]) => ({ container: container.id, descriptors: clean(descriptors) })),
      viewsWelcome: [...views._viewWelcomeContents.map].map(([id, entries]) => ({ id, entries: clean([...entries]) })),
      registryEntries: [...this.data].map(([id, value]) => ({ id, ownFields: Object.getOwnPropertyNames(value) })),
      singletons: descriptors.map(([id, descriptor]) => ({ id: String(id), ctor: descriptor.ctor.name, delayed: descriptor.supportsDelayedInstantiation, staticArguments: descriptor.staticArguments.map(arg => arg === null || typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' ? arg : { type: typeof arg, functionName: typeof arg === 'function' ? arg.name : undefined, ownDataFields: arg && typeof arg === 'object' ? Object.keys(Object.getOwnPropertyDescriptors(arg)) : undefined }) })),
      walkthroughs: { descriptorCount: descriptors.filter(([id]) => /walkthrough|gettingStarted/i.test(String(id))).length, registryEntryIDs: [...this.data.keys()].filter(id => /walkthrough|gettingStarted/i.test(id)), sourceSymbolEvidence: { serviceMethodPresent: ${source.includes('getWalkthroughs(')}, contentCollectionPresent: ${source.includes('gettingStartedContributions')}, contentStepPresent: ${source.includes('setupAccessibility')} } }
    };
  }`, [objects.commands, objects.keybindings, objects.menus, objects.menuId, objects.singletonDescriptors]);
  await write('registries.json', registries);
  // Queries existing instances by prototype. Reading the collection map cannot
  // instantiate delayed DI proxies. Never read properties from a service value.
  const query = async binding => {
    const properties = await c.props(binding);
    const prototype = properties.result.find(p => p.name === 'prototype')?.value;
    if (!prototype?.objectId) throw new Error('Missing constructor prototype.');
    return (await c.send('Runtime.queryObjects', { prototypeObjectId: prototype.objectId, objectGroup: 'lean-runtime-registries' })).objects;
  };
  const statusbars = await c.call(await query(objects.statusbarModel), `function(){
    const ownData = (object, key) => Object.getOwnPropertyDescriptor(object, key)?.value;
    return [...this].map((model, index) => {
      const entries = ownData(model, '_entries');
      if (!Array.isArray(entries)) throw Error('Unexpected statusbar model storage shape');
      return { index, entries: entries.map(entry => {
        const result = {};
        if (typeof ownData(entry, 'id') !== 'string') throw Error('Statusbar entry ID is not own string data');
        for (const key of ['id', 'extensionId', 'alignment']) {
          const value = ownData(entry, key);
          if (value === undefined || value === null || ['string', 'number', 'boolean'].includes(typeof value)) result[key] = value;
          else throw Error('Unexpected statusbar identity field');
        }
        return result;
      }) };
    });
  }`);
  registries.statusbars = statusbars;
  const workbenches = await query(objects.workbench);
  const di = await c.call(workbenches, `function(){ return [...this].map((workbench,index) => {
    const map = Object.getOwnPropertyDescriptor(workbench.serviceCollection, '_entries')?.value;
    if (!(map instanceof Map)) throw Error('Unexpected ServiceCollection storage shape');
    return { index, services: [...map].map(([id,value]) => {
      const own = Object.getOwnPropertyDescriptors(value);
      const ctor = own.ctor?.value;
      return { id: String(id), state: typeof ctor === 'function' ? 'descriptor' : 'instance-or-proxy', descriptorCtor: ctor?.name, ownDataFields: Object.entries(own).filter(([,d]) => 'value' in d).map(([name])=>name) };
    }) };
  }); }`);
  const channels = await c.call(await query(objects.channelServer), `function(){ return [...this].map((server,index) => ({ index, context: typeof server.ctx === 'string' ? server.ctx : undefined, registeredChannelNames: [...server.channels.keys()], pendingChannelNames: [...server.pendingRequests.keys()], activeRequestCount: server.activeRequests.size })); }`);
  const profilerConstructor = await c.send('Runtime.callFunctionOn', { objectId: objects.singletonDescriptors.objectId, functionDeclaration: `function(){return this.find(([id])=>String(id)==='extensionHostProfileService')?.[1].ctor}`, objectGroup: 'lean-runtime-registries' });
  const profiler = profilerConstructor.result.type === 'function' ? await c.call(await query(profilerConstructor.result), `function(){
    const data = (object, key) => Object.getOwnPropertyDescriptor(object, key)?.value;
    function plain(value, seen = new Set()) {
      if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return value;
      if (value === undefined) return undefined;
      if (typeof value !== 'object' || seen.has(value)) throw Error('Profile is not plain data');
      if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error('Unexpected profile object type');
      seen.add(value);
      const result = Array.isArray(value) ? [] : {};
      for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
        if (key === 'length' && Array.isArray(value)) continue;
        if (!('value' in descriptor)) throw Error('Profile accessor is forbidden');
        result[key] = plain(descriptor.value, seen);
      }
      seen.delete(value);
      return result;
    }
    return [...this].map(service => {
      const state = data(service, '_state');
      if (![0, 1, 2, 3].includes(state)) throw Error('Unexpected existing profiler state');
      const profile = data(service, '_profile');
      return { state, data: profile ? plain(data(profile, 'data')) : null };
    });
  }`) : [];
  await write('profiling.json', profiler);
  const walkthroughConstructor = await c.send('Runtime.callFunctionOn', { objectId: objects.singletonDescriptors.objectId, functionDeclaration: `function(){return this.find(([id])=>String(id)==='walkthroughsService')?.[1].ctor}`, objectGroup: 'lean-runtime-registries' });
  if (walkthroughConstructor.result.type === 'function') {
    const instances = await query(walkthroughConstructor.result);
    registries.walkthroughs.instances = await c.call(instances, `function(){ ${serialize} return [...this].map((service,index)=>{
      if (!(service.gettingStartedContributions instanceof Map)) throw Error('Unexpected walkthrough registry storage shape');
      return { index, allContributions: clean([...service.gettingStartedContributions.values()]), allSteps: clean([...service.steps.values()]) };
    }); }`);
    registries.walkthroughSteps = registries.walkthroughs.instances.flatMap(instance=>instance.allSteps);
  } else registries.walkthroughs.instances = [];
  await write('registries.json', registries);
  await write('renderer-services.json', di);
  await write('statusbars.json', statusbars);
  await write('renderer-channels.json', channels);
  await write('scripts.json', scripts.map(s => ({ url: s.url, scriptId: s.scriptId, isModule: s.isModule, hash: s.hash })));

  const rows = Object.fromEntries(Object.entries(registries).filter(([,v])=>Array.isArray(v)));
  const narrow = /chat|inline.?chat|mcp|speech|dictation|agents?voice|agent.?host|agent.?sessions|integrated.?browser|browser.?view|simple.?browser|language.?model|foundry|playwright|sandboxHelper|webContentExtractor|aiStats|aiEdits|aiEditTelemetry|inlineCompletionsUnification|openCopilotSurvey|markdownDefaultEditorInAgentsWindow|verbosity\.(?:sessionsChanges|automations|survey)/i;
  const broad = /\bAI\b|copilot|agent|browser|model|voice|transcri|walkthrough|getting.?started/i;
  const matching = (expression, items) => items.map((item,index)=>({index,item})).filter(({item})=>expression.test(JSON.stringify(item)));
  const audit = { patterns: { narrow: narrow.source, broad: broad.source }, narrow: {}, broad: {}, commandLinks: [] };
  for (const [kind, items] of Object.entries(rows)) { audit.narrow[kind] = matching(narrow, items); audit.broad[kind] = matching(broad, items); }
  const commandIDs = new Set(registries.commands.map(c=>c.id));
  const scanLinks = (value, location) => {
    if (typeof value === 'string') {
      for (const match of value.matchAll(/command:((?:toSide:)?[A-Za-z_$][A-Za-z0-9_$.-]*(?:\?[^\s)\]"<>]*)?)/g)) {
        let id = match[1].replace(/^toSide:/,'').split('?')[0];
        try { id = decodeURIComponent(id); } catch { /* Preserve malformed data for audit. */ }
        audit.commandLinks.push({ location, id, registered: commandIDs.has(id), retiredCandidate: narrow.test(id), value });
      }
    } else if (Array.isArray(value)) value.forEach((v,i)=>scanLinks(v,`${location}[${i}]`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k,v])=>scanLinks(v,`${location}.${k}`));
  };
  for (const [kind, items] of Object.entries(rows)) scanLinks(items, kind);
  await write('audit.json', audit);
  const counts = { commands: registries.commands.length, commandMetadata: registries.commandMetadata.length, statusbarModels: statusbars.length, statusbarEntries: statusbars.reduce((n, model)=>n+model.entries.length,0), settings: registries.settings.length, excludedSettings: registries.excludedSettings.length, keybindings: registries.keybindings.length, menuIDs: registries.menus.length, menuIDsWithItems: registries.menus.filter(m=>m.items.length).length, menuItems: registries.menus.reduce((n,m)=>n+m.items.length,0), containers: registries.containers.length, views: registries.views.reduce((n,v)=>n+v.descriptors.length,0), viewsWelcomeIDs: registries.viewsWelcome.length, viewsWelcomeEntries: registries.viewsWelcome.reduce((n,v)=>n+v.entries.length,0), singletons: registries.singletons.length, workbenchInstances: di.length, rendererChannelServers: channels.length, walkthroughInstances: registries.walkthroughs.instances.length, walkthroughSteps: registries.walkthroughSteps?.length??0, commandLinks: audit.commandLinks.length };
  const summary = { capturedAtUTC: new Date().toISOString(), expectedApp, target, counts, narrowCounts: Object.fromEntries(Object.entries(audit.narrow).map(([k,v])=>[k,v.length])), missingCommandLinks: audit.commandLinks.filter(l=>!l.registered), retiredCommandLinks: audit.commandLinks.filter(l=>l.retiredCandidate), walkthroughs: registries.walkthroughs, limitations: ['Main/shared-process ChannelServer maps are outside the renderer CDP context.', 'Statusbar capture reads existing model entry IDs and alignment only; names, tooltips, commands, DOM and getters are not evaluated.', 'Process and logs prove the observed interval only; they do not prove future background inactivity.', 'Empty MenuId symbols are reported separately from registered menu items.', 'No walkthrough service/collection means no positive evidence that ordinary walkthroughs are retained.'] };
  await write('summary.json', summary);
  console.log(JSON.stringify({ output, counts, narrowCounts: summary.narrowCounts, missingCommandLinks: summary.missingCommandLinks.length, retiredCommandLinks: summary.retiredCommandLinks.length, walkthroughs: summary.walkthroughs }, null, 2));
} finally {
  await c.send('Runtime.releaseObjectGroup', { objectGroup: 'lean-runtime-registries' }).catch(()=>{});
  await c.send('Debugger.disable').catch(()=>{});
  c.ws.close();
}

{
  await write('authority-after.json', await verifyAuthority());
  const all = execFileSync('ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8' }).trim().split('\n').map(line => {
    const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    return match && { pid: Number(match[1]), parentPID: Number(match[2]), command: match[3] };
  }).filter(Boolean);
  const ids = new Set([mainPID]);
  for (let changed = true; changed;) { changed = false; for (const process of all) if (ids.has(process.parentPID) && !ids.has(process.pid)) { ids.add(process.pid); changed = true; } }
  const tree = all.filter(p=>ids.has(p.pid));
  const mainProcess = tree.find(p=>p.pid===mainPID);
  const executable = mainProcess?.command.match(/^(.+?\/Contents\/MacOS\/[^ ]+)/)?.[1];
  if (!executable || !(await fs.realpath(executable)).startsWith(expectedApp + '/Contents/MacOS/')) throw new Error('Main PID is not the expected app.');
  await write('process-tree.json', tree);
}
{
  const root = profileRoot;
  const logs = [];
  const visit = async directory => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.log')) logs.push(file);
    }
  };
  await visit(root);
  const observations = [];
  const errors = /Unknown service|Missing proxy|No proxy|customer.*(?:error|missing)|actor.*(?:error|missing)|Unknown channel|channel.*not found|Model.*download|Foundry|localTranscription|agentHost|NativeMcp|mcpGateway|playwright/i;
  for (const file of logs) {
    const data = await fs.readFile(file);
    const relative = path.relative(root, file);
    await fs.mkdir(path.dirname(path.join(output, 'logs', relative)), { recursive: true });
    await fs.writeFile(path.join(output, 'logs', relative), data);
    observations.push({ file: relative, bytes: data.length, sha256: hash(data), hits: data.toString('utf8').split('\n').map((line,index)=>({line:index+1,text:line})).filter(item=>errors.test(item.text)) });
  }
  await write('logs.json', observations);
}
