'use strict';

// Private extension entry point, selected only in a copied fixture manifest.
// All provider IDs, accounts, sessions and secret keys belong to this fixture.
const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const scopes = Object.freeze(['lean.fixture.read']);
const sameScopes = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

exports.activate = async context => {
  assert.equal(context.extension.id.toLowerCase(), 'lean-tests.lean-auth-runtime-fixture',
    'Use the separate private auth fixture manifest; do not replace the shared extension entry.');
  assert(process.env.LEAN_AUTH_ROOT, 'Set LEAN_AUTH_ROOT to the isolated fixture directory.');
  const root = await fs.realpath(process.env.LEAN_AUTH_ROOT);
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  assert(folder && await fs.realpath(folder) === path.join(root, 'w'), 'Unexpected auth test workspace.');
  await fs.mkdir(path.join(root, 'responses'), { recursive: true });
  const runId = crypto.createHash('sha256').update(root).digest('hex').slice(0, 10);
  const bootId = crypto.randomUUID();
  const providerId = `lean-private-auth-${runId}`;
  const providerLabel = `Lean Synthetic Auth ${runId}`;
  const accounts = Object.freeze({
    alpha: Object.freeze({ id: `lean-${runId}-alpha`, label: `Lean Synthetic Alpha ${runId}` }),
    beta: Object.freeze({ id: `lean-${runId}-beta`, label: `Lean Synthetic Beta ${runId}` })
  });
  const secretKey = `lean-auth-private-${runId}`;
  const secretValues = { v1: `SYNTHETIC_SECRET_V1_${runId}`, v2: `SYNTHETIC_SECRET_V2_${runId}` };
  const counts = { getSessions: 0, createSession: 0, removeSession: 0, providerEvents: 0, publicEvents: 0, secretEvents: 0 };
  const sessions = new Map();
  const createdIds = new Map();
  const trace = [];
  let registered = true;
  let pending = null;
  let writes = Promise.resolve();
  const viewSession = session => ({ id: session.id, account: session.account, scopes: [...session.scopes] });
  const snapshot = () => ({
    bootId, providerId, providerLabel, registered, pending, counts: { ...counts },
    sessions: [...sessions.values()].map(viewSession), trace: [...trace]
  });
  const atomicWrite = async (name, value) => {
    const target = path.join(root, name);
    const temporary = target + `.${bootId}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n');
    await fs.rename(temporary, target);
  };
  const publish = () => {
    const value = snapshot();
    writes = writes.then(() => atomicWrite('state.json', value));
    return writes;
  };
  const record = (kind, details = {}) => {
    trace.push({ sequence: trace.length + 1, time: new Date().toISOString(), kind, ...details });
    void publish().catch(error => console.error('Auth fixture state write failed:', error.message));
  };
  const until = async (predicate, message) => {
    for (let i = 0; i < 100; i++) {
      if (await predicate()) return;
      await delay(50);
    }
    throw new Error(message);
  };
  const events = new vscode.EventEmitter();
  context.subscriptions.push(events);
  context.subscriptions.push(vscode.authentication.onDidChangeSessions(event => {
    if (event.provider.id !== providerId) return;
    counts.publicEvents++;
    record('public-session-event', { provider: event.provider });
  }));
  context.subscriptions.push(context.secrets.onDidChange(event => {
    if (event.key !== secretKey) return;
    counts.secretEvents++;
    record('private-secret-event', { key: event.key });
  }));
  const fire = change => {
    counts.providerEvents++;
    record('provider-session-event', {
      added: (change.added || []).map(viewSession), removed: (change.removed || []).map(viewSession)
    });
    events.fire(change);
  };
  const provider = {
    onDidChangeSessions: events.event,
    async getSessions(requestedScopes, options = {}) {
      counts.getSessions++;
      const returned = [...sessions.values()].filter(session =>
        (!requestedScopes || sameScopes(session.scopes, requestedScopes)) &&
        (!options.account || session.account.id === options.account.id)
      );
      record('provider-getSessions', {
        scopes: requestedScopes ? [...requestedScopes] : null,
        account: options.account || null, returned: returned.map(viewSession)
      });
      return returned;
    },
    async createSession(requestedScopes, options = {}) {
      counts.createSession++;
      assert(sameScopes(requestedScopes, scopes), 'Product passed unexpected scopes to private provider.');
      const account = Object.values(accounts).find(candidate => candidate.id === options.account?.id);
      assert(account, 'Product did not pass the requested private account to createSession.');
      assert(![...sessions.values()].some(session => session.account.id === account.id), 'Unexpected duplicate createSession.');
      const id = `lean-${runId}-session-${counts.createSession}`;
      const session = { id, accessToken: `SYNTHETIC_TOKEN_${id}`, account, scopes: [...requestedScopes] };
      sessions.set(id, session);
      record('provider-createSession', { session: viewSession(session), requestedAccount: options.account });
      fire({ added: [session], removed: [], changed: [] });
      return session;
    },
    async removeSession(sessionId) {
      counts.removeSession++;
      const session = sessions.get(sessionId);
      assert(session, 'Product requested an unknown private session for removal.');
      sessions.delete(sessionId);
      record('provider-removeSession', { session: viewSession(session) });
      fire({ added: [], removed: [session], changed: [] });
    }
  };
  const registration = vscode.authentication.registerAuthenticationProvider(providerId, providerLabel, provider,
    { supportsMultipleAccounts: true });
  context.subscriptions.push(registration);

  const listAccounts = async expected => {
    const before = counts.getSessions;
    const actual = await vscode.authentication.getAccounts(providerId);
    assert(counts.getSessions > before, 'getAccounts did not reach the private provider through the real API.');
    assert.deepEqual(actual.map(account => account.id).sort(), expected.map(name => accounts[name].id).sort());
    return { accounts: actual, providerGetSessionsDelta: counts.getSessions - before };
  };
  const readPrivateSession = async (name, options, expectMissing = false) => {
    const before = { ...counts };
    const session = await vscode.authentication.getSession(providerId, scopes, { ...options, account: accounts[name] });
    assert(counts.getSessions > before.getSessions, 'getSession did not reach the private provider through the real API.');
    if (expectMissing) {
      assert.equal(session, undefined, 'Removed/missing private account still returned a session.');
      assert.equal(counts.createSession, before.createSession, 'Silent lookup unexpectedly created a session.');
      return { session: null, providerGetSessionsDelta: counts.getSessions - before.getSessions };
    }
    assert(session, 'Expected private account session was not returned.');
    assert.equal(session.account.id, accounts[name].id);
    assert(sameScopes(session.scopes, scopes));
    assert.equal(session.accessToken, `SYNTHETIC_TOKEN_${session.id}`, 'Synthetic token did not survive the real API roundtrip.');
    if (options.createIfNone) {
      assert.equal(counts.createSession, before.createSession + 1, 'Creation did not invoke provider.createSession once.');
      createdIds.set(name, session.id);
      await until(() => counts.publicEvents > before.publicEvents, 'Added session event did not reach public authentication API.');
    } else {
      assert.equal(session.id, createdIds.get(name), 'Same-account re-fetch returned a different session.');
      assert.equal(counts.createSession, before.createSession, 'Re-fetch unexpectedly created a session.');
    }
    return { session: viewSession(session), syntheticTokenRoundtripVerified: true,
      providerGetSessionsDelta: counts.getSessions - before.getSessions,
      providerCreateSessionDelta: counts.createSession - before.createSession };
  };
  const signOut = async name => {
    assert(createdIds.has(name), 'Create the private account before signing out.');
    const before = { ...counts };
    // Public API has no removeSession function; use the product's real account
    // sign-out command and dialog. Never call provider.removeSession directly.
    await vscode.commands.executeCommand('_signOutOfAccount', { providerId, accountLabel: accounts[name].label });
    assert.equal(counts.removeSession, before.removeSession + 1, 'Product Sign Out did not invoke provider.removeSession once.');
    assert(!sessions.has(createdIds.get(name)), 'Signed-out private session remained in provider.');
    await until(() => counts.publicEvents > before.publicEvents, 'Removed session event did not reach public authentication API.');
    return { removedAccount: accounts[name], providerRemoveSessionDelta: counts.removeSession - before.removeSession };
  };
  const handle = async request => {
    switch (request.action) {
      case 'snapshot': return snapshot();
      case 'accounts-empty': return listAccounts([]);
      case 'accounts-alpha': return listAccounts(['alpha']);
      case 'accounts-two': return listAccounts(['alpha', 'beta']);
      case 'accounts-beta': return listAccounts(['beta']);
      case 'silent-empty': return readPrivateSession('alpha', { silent: true }, true);
      case 'create-alpha': return readPrivateSession('alpha', { createIfNone: { detail: 'Private synthetic account test; no external login.' } });
      case 'create-beta': return readPrivateSession('beta', { createIfNone: { detail: 'Private synthetic second-account test; no external login.' } });
      case 'reuse-alpha': return readPrivateSession('alpha', { silent: true });
      case 'reuse-beta': return readPrivateSession('beta', { silent: true });
      case 'signout-alpha': return signOut('alpha');
      case 'signout-beta': return signOut('beta');
      case 'silent-removed-alpha': return readPrivateSession('alpha', { silent: true }, true);
      case 'secret-store': {
        assert.equal(await context.secrets.get(secretKey), undefined, 'Private secret key already exists; use a fresh profile.');
        const before = counts.secretEvents;
        await context.secrets.store(secretKey, secretValues.v1);
        assert.equal(await context.secrets.get(secretKey), secretValues.v1);
        assert((await context.secrets.keys()).includes(secretKey));
        await until(() => counts.secretEvents > before, 'Secret store change event did not arrive.');
        return { ownKey: secretKey, storedSyntheticValueVerified: true, keyEnumerated: true };
      }
      case 'secret-read': {
        assert(['v1', 'v2'].includes(request.expectedVersion), 'secret-read requires expectedVersion v1 or v2.');
        assert.equal(await context.secrets.get(secretKey), secretValues[request.expectedVersion]);
        return { ownKey: secretKey, version: request.expectedVersion, storedSyntheticValueVerified: true, bootId };
      }
      case 'secret-update': {
        assert.equal(await context.secrets.get(secretKey), secretValues.v1);
        const before = counts.secretEvents;
        await context.secrets.store(secretKey, secretValues.v2);
        assert.equal(await context.secrets.get(secretKey), secretValues.v2);
        await until(() => counts.secretEvents > before, 'Secret update change event did not arrive.');
        return { ownKey: secretKey, updatedSyntheticValueVerified: true };
      }
      case 'secret-delete': {
        assert.equal(await context.secrets.get(secretKey), secretValues.v2);
        const before = counts.secretEvents;
        await context.secrets.delete(secretKey);
        assert.equal(await context.secrets.get(secretKey), undefined);
        assert(!(await context.secrets.keys()).includes(secretKey));
        await until(() => counts.secretEvents > before, 'Secret delete change event did not arrive.');
        return { ownKey: secretKey, deleted: true, keyAbsent: true };
      }
      case 'unregister': {
        assert.equal(sessions.size, 0, 'Sign out all synthetic accounts before unregistering.');
        registration.dispose(); registered = false;
        await until(async () => {
          try { await vscode.authentication.getAccounts(providerId); return false; }
          catch (error) { return /authentication provider|provider with id|provider.*registered/i.test(error.message); }
        }, 'Unregistered provider was still reachable through public API.');
        return { registered: false, publicLookupRejected: true };
      }
      case 'reload': return vscode.commands.executeCommand('workbench.action.reloadWindow');
      case 'quit': return vscode.commands.executeCommand('workbench.action.quit');
      default: throw new Error('Unknown auth fixture action: ' + request.action);
    }
  };

  // Do not replay the previous interactive request after Reload Window.
  let previous;
  try { previous = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')).id; } catch {}
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    let request;
    try { request = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')); } catch { return; }
    if (!request || request.id === previous) return;
    if (typeof request.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(request.id)) return;
    busy = true; previous = request.id; pending = { id: request.id, action: request.action };
    await publish();
    await atomicWrite('response.json', { ...pending, bootId, status: 'RUNNING' });
    let response;
    try {
      const before = { ...counts };
      const result = await handle(request);
      response = { id: request.id, action: request.action, bootId, status: 'PASS', result,
        callDelta: Object.fromEntries(Object.keys(counts).map(key => [key, counts[key] - before[key]])) };
    } catch (error) {
      response = { id: request.id, action: request.action, bootId, status: 'FAIL', error: error.stack };
    } finally {
      pending = null;
      await publish();
      if (response) {
        await atomicWrite('response.json', response);
        await atomicWrite(path.join('responses', request.id + '.json'), response);
      }
      busy = false;
    }
  }, 100);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  // Dynamic registration is asynchronous in the real extension host. Wait for
  // the public getAccounts path to reach this provider before reporting ready.
  await until(async () => {
    try { assert.deepEqual(await vscode.authentication.getAccounts(providerId), []); return true; }
    catch { return false; }
  }, 'Private authentication provider did not register in the real host.');
  await publish();
  await atomicWrite('ready.json', { bootId, hostPid: process.pid, parentPid: process.ppid,
    vscodeVersion: vscode.version, extensionId: context.extension.id, root, providerId, providerLabel,
    accounts, scopes, secretKey, registeredThroughPublicApi: counts.getSessions > 0 });
};
