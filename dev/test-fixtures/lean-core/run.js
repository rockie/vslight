'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const proposals = [
  'agentEditorComments', 'chatStatusItem', 'chatParticipantPrivate', 'agentSessionsWorkspace',
  'interactive', 'aiRelatedInformation', 'aiSettingsSearch', 'mappedEditsProvider',
  'chatSessionsProvider', 'chatOutputRenderer', 'chatContextProvider', 'chatPromptFiles',
  'chatDebug', 'chatSessionCustomizationProvider', 'chatInputNotification', 'languageModelProxy',
  'embeddings', 'languageModelToolSupportsModel', 'chatParticipantAdditions',
  'browser', 'mcpServerDefinitions', 'speech', 'defaultChatParticipant', 'aiTextSearchProvider', 'textSearchProvider2', 'findFiles2', 'inlineCompletionsAdditions'
];
exports.proposals = proposals;

function poisonProvider() {
  const counts = { reads: 0, methods: 0, subscriptions: 0 };
  const target = {
    onDidChange: () => { counts.subscriptions++; throw new Error('Provider event subscribed'); },
    provideLanguageModelChatInformation: () => { counts.methods++; throw new Error('Provider executed'); },
    provideLanguageModelChatResponse: () => { counts.methods++; throw new Error('Provider executed'); },
    provideTokenCount: () => { counts.methods++; throw new Error('Provider executed'); },
    provideMcpServerDefinitions: () => { counts.methods++; throw new Error('Provider executed'); },
    resolveMcpServerDefinition: () => { counts.methods++; throw new Error('Provider executed'); },
    invoke: () => { counts.methods++; throw new Error('Tool executed'); }
  };
  return { counts, provider: new Proxy(target, { get(object, key) { counts.reads++; return object[key]; } }) };
}

function checkNeverEvent(event, listeners) {
  let calls = 0;
  const receiver = { expected: true };
  const disposable = event(function () { assert.equal(this, receiver); calls++; }, receiver, listeners);
  assert.equal(listeners.at(-1), disposable);
  disposable.dispose();
  disposable.dispose();
  assert.equal(calls, 0);
  return () => assert.equal(calls, 0);
}

exports.checkStable = async (vscode, context) => {
  let handlerCalls = 0;
  let followupCalls = 0;
  const handler = () => { handlerCalls++; return {}; };
  const replacement = () => { handlerCalls++; return {}; };
  const participant = vscode.chat.createChatParticipant('lean-fixture', handler);
  assert.equal(participant.id, 'lean-fixture');
  assert.equal(participant.requestHandler, handler);
  participant.requestHandler = replacement;
  assert.equal(participant.requestHandler, replacement);
  assert.throws(() => { participant.requestHandler = undefined; });
  const icon = new vscode.ThemeIcon('check');
  participant.iconPath = icon;
  assert.equal(participant.iconPath, icon);
  const followups = { provideFollowups() { followupCalls++; return []; } };
  participant.followupProvider = followups;
  assert.equal(participant.followupProvider, followups);
  const listeners = [];
  const checks = [checkNeverEvent(participant.onDidReceiveFeedback, listeners), checkNeverEvent(vscode.lm.onDidChangeChatModels, listeners)];
  checks.push(checkNeverEvent(context.languageModelAccessInformation.onDidChange, listeners));
  assert.equal(context.languageModelAccessInformation.canSendRequest({ id: 'absent' }), undefined);
  assert.deepEqual(await vscode.lm.selectChatModels(), []);
  assert.deepEqual(await vscode.lm.selectChatModels({ vendor: 'lean-fixture' }), []);
  const tools = vscode.lm.tools;
  assert.deepEqual(tools, []);
  assert.equal(Object.isFrozen(tools), true);
  assert.throws(() => tools.push({ name: 'forbidden' }), TypeError);
  const poisoned = [poisonProvider(), poisonProvider(), poisonProvider()];
  const registrations = [
    vscode.lm.registerTool('lean-fixture', poisoned[0].provider),
    vscode.lm.registerLanguageModelChatProvider('lean-fixture', poisoned[1].provider),
    vscode.lm.registerMcpServerDefinitionProvider('lean-fixture', poisoned[2].provider)
  ];
  assert.equal(vscode.lm.tools, tools);
  assert.deepEqual(await vscode.lm.selectChatModels(), []);
  for (const registration of registrations) {
    assert.equal(typeof registration.dispose, 'function');
    registration.dispose();
    registration.dispose();
  }
  let invocation;
  assert.doesNotThrow(() => { invocation = vscode.lm.invokeTool('lean-fixture', { input: {} }); });
  assert.equal(typeof invocation.then, 'function');
  await assert.rejects(invocation, error => error instanceof vscode.LanguageModelError && error.name === 'LanguageModelError' && error.code === 'NotFound' && /unavailable.*product/i.test(error.message));
  participant.dispose();
  participant.dispose();
  assert.equal(handlerCalls, 0);
  assert.equal(followupCalls, 0);
  await new Promise(resolve => setTimeout(resolve, 30));
  checks.forEach(check => check());
  poisoned.forEach(({ counts }) => assert.deepEqual(counts, { reads: 0, methods: 0, subscriptions: 0 }));
  listeners.forEach(disposable => disposable.dispose());
  assert.equal(new vscode.LanguageModelTextPart('text').value, 'text');
  assert.equal(vscode.LanguageModelChatMessage.User('message').role, vscode.LanguageModelChatMessageRole.User);
  assert.equal(new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart('result')]).content[0].value, 'result');
  const stdio = new vscode.McpStdioServerDefinition('local', 'must-not-run', ['--fixture']);
  assert.equal(stdio.command, 'must-not-run');
  const http = new vscode.McpHttpServerDefinition('http', vscode.Uri.parse('http://127.0.0.1:1/never'));
  assert.equal(http.uri.toString(), 'http://127.0.0.1:1/never');
};

function proposedCases(vscode, participant, provider) {
  const uri = vscode.Uri.parse('file:///lean-fixture.md');
  const token = new vscode.CancellationTokenSource().token;
  const cases = [];
  const add = (proposal, label, invoke, async = false) => cases.push({ proposal, label, invoke, async });
  for (const name of ['browserTabs', 'activeBrowserTab']) add('browser', `window.${name}`, () => vscode.window[name]);
  for (const name of ['onDidOpenBrowserTab', 'onDidCloseBrowserTab', 'onDidChangeActiveBrowserTab', 'onDidChangeBrowserTabState']) add('browser', `window.${name}`, () => vscode.window[name](() => {}));
  add('browser', 'window.openBrowserTab', () => vscode.window.openBrowserTab('https://example.invalid/lean-core'), true);
  add('agentEditorComments', 'window.createAgentEditorComments', () => vscode.window.createAgentEditorComments(uri));
  add('chatStatusItem', 'window.createChatStatusItem', () => vscode.window.createChatStatusItem('lean'));
  add('chatParticipantPrivate', 'window.activeChatPanelSessionResource', () => vscode.window.activeChatPanelSessionResource);
  add('chatParticipantPrivate', 'window.onDidChangeActiveChatPanelSessionResource', () => vscode.window.onDidChangeActiveChatPanelSessionResource(() => {}));
  add('agentSessionsWorkspace', 'workspace.isAgentSessionsWorkspace', () => vscode.workspace.isAgentSessionsWorkspace);
  add('inlineCompletionsAdditions', 'languages.inlineCompletionsUnificationState', () => vscode.languages.inlineCompletionsUnificationState);
  add('inlineCompletionsAdditions', 'languages.onDidChangeCompletionsUnificationState', () => vscode.languages.onDidChangeCompletionsUnificationState(() => {}));
  add('aiTextSearchProvider', 'workspace.registerAITextSearchProvider', () => vscode.workspace.registerAITextSearchProvider('file', provider));
  add('interactive', 'interactive.transferActiveChat', () => vscode.interactive.transferActiveChat(uri), true);
  add('aiRelatedInformation', 'ai.getRelatedInformation', () => vscode.ai.getRelatedInformation('query', []), true);
  add('aiRelatedInformation', 'ai.registerRelatedInformationProvider', () => vscode.ai.registerRelatedInformationProvider(1, provider));
  add('aiRelatedInformation', 'ai.registerEmbeddingVectorProvider', () => vscode.ai.registerEmbeddingVectorProvider('lean', provider));
  add('aiSettingsSearch', 'ai.registerSettingsSearchProvider', () => vscode.ai.registerSettingsSearchProvider(provider));
  for (const method of ['registerMappedEditsProvider', 'registerMappedEditsProvider2']) add('mappedEditsProvider', `chat.${method}`, () => vscode.chat[method](provider, provider));
  add('chatParticipantPrivate', 'chat.createDynamicChatParticipant', () => vscode.chat.createDynamicChatParticipant('lean', provider, () => ({})));
  add('chatParticipantPrivate', 'chat.registerChatParticipantDetectionProvider', () => vscode.chat.registerChatParticipantDetectionProvider(provider));
  add('chatParticipantPrivate', 'chat.onDidDisposeChatSession', () => vscode.chat.onDidDisposeChatSession(() => {}));
  add('chatParticipantPrivate', 'chat.updateQuotas', () => vscode.chat.updateQuotas(provider));
  add('chatSessionsProvider', 'chat.registerChatSessionItemProvider', () => vscode.chat.registerChatSessionItemProvider('lean', provider));
  add('chatSessionsProvider', 'chat.createChatSessionItemController', () => vscode.chat.createChatSessionItemController('lean', () => Promise.resolve()));
  add('chatSessionsProvider', 'chat.registerChatSessionContentProvider', () => vscode.chat.registerChatSessionContentProvider('lean', provider, participant));
  add('chatOutputRenderer', 'chat.registerChatOutputRenderer', () => vscode.chat.registerChatOutputRenderer('lean', provider));
  for (const method of ['registerChatWorkspaceContextProvider', 'registerChatAttachContextProvider', 'registerChatTabContextProvider', 'registerChatExplicitContextProvider', 'registerChatResourceContextProvider']) add('chatContextProvider', `chat.${method}`, () => vscode.chat[method]('lean', provider, provider));
  for (const method of ['registerCustomAgentProvider', 'registerInstructionsProvider', 'registerPromptFileProvider', 'registerSkillProvider', 'registerHookProvider']) add('chatPromptFiles', `chat.${method}`, () => vscode.chat[method](provider));
  for (const noun of ['CustomAgents', 'Instructions', 'Skills', 'SlashCommands', 'Hooks', 'Plugins']) {
    add('chatPromptFiles', `chat.get${noun}`, () => vscode.chat[`get${noun}`](token), true);
    add('chatPromptFiles', `chat.onDidChange${noun}`, () => vscode.chat[`onDidChange${noun}`](() => {}));
  }
  add('chatDebug', 'chat.registerChatDebugLogProvider', () => vscode.chat.registerChatDebugLogProvider(provider));
  add('chatDebug', 'chat.onDidReceiveChatDebugEvent', () => vscode.chat.onDidReceiveChatDebugEvent(() => {}));
  add('chatSessionCustomizationProvider', 'chat.registerChatSessionCustomizationProvider', () => vscode.chat.registerChatSessionCustomizationProvider('lean', provider, provider));
  add('chatInputNotification', 'chat.createInputNotification', () => vscode.chat.createInputNotification('lean'));
  add('languageModelProxy', 'lm.isModelProxyAvailable', () => vscode.lm.isModelProxyAvailable);
  add('languageModelProxy', 'lm.onDidChangeModelProxyAvailability', () => vscode.lm.onDidChangeModelProxyAvailability(() => {}));
  add('languageModelProxy', 'lm.getModelProxy', () => vscode.lm.getModelProxy(), true);
  add('chatParticipantPrivate', 'lm.registerLanguageModelProxyProvider', () => vscode.lm.registerLanguageModelProxyProvider(provider));
  add('embeddings', 'lm.embeddingModels', () => vscode.lm.embeddingModels);
  add('embeddings', 'lm.onDidChangeEmbeddingModels', () => vscode.lm.onDidChangeEmbeddingModels(() => {}));
  add('embeddings', 'lm.registerEmbeddingsProvider', () => vscode.lm.registerEmbeddingsProvider('lean', provider));
  add('embeddings', 'lm.computeEmbeddings', () => vscode.lm.computeEmbeddings('lean', 'text'), true);
  add('languageModelToolSupportsModel', 'lm.registerToolDefinition', () => vscode.lm.registerToolDefinition(provider, provider));
  add('chatParticipantAdditions', 'lm.invokeTool', () => vscode.lm.invokeTool(provider, { input: {} }), true);
  add('chatParticipantAdditions', 'lm.fileIsIgnored', () => vscode.lm.fileIsIgnored(uri), true);
  add('chatParticipantPrivate', 'lm.registerIgnoredFileProvider', () => vscode.lm.registerIgnoredFileProvider(provider));
  add('mcpServerDefinitions', 'lm.onDidChangeMcpServerDefinitions', () => vscode.lm.onDidChangeMcpServerDefinitions(() => {}));
  add('mcpServerDefinitions', 'lm.mcpServerDefinitions', () => vscode.lm.mcpServerDefinitions);
  add('mcpServerDefinitions', 'lm.startMcpGateway', () => vscode.lm.startMcpGateway(), true);
  add('chatParticipantAdditions', 'lm.onDidChangeChatRequestTools', () => vscode.lm.onDidChangeChatRequestTools(() => {}));
  add('speech', 'speech.registerSpeechProvider', () => vscode.speech.registerSpeechProvider('lean', provider));
  for (const name of ['helpTextPrefix', 'helpTextPostfix', 'additionalWelcomeMessage', 'titleProvider', 'summarizer']) {
    add('defaultChatParticipant', `ChatParticipant.${name}`, () => participant[name]);
    add('defaultChatParticipant', `ChatParticipant.${name}`, () => { participant[name] = provider; });
  }
  for (const [name, proposal] of [['supportIssueReporting', 'chatParticipantPrivate'], ['participantVariableProvider', 'chatParticipantAdditions']]) {
    add(proposal, `ChatParticipant.${name}`, () => participant[name]);
    add(proposal, `ChatParticipant.${name}`, () => { participant[name] = provider; });
  }
  for (const name of ['onDidPerformAction', 'onDidChangePauseState']) add('chatParticipantAdditions', `ChatParticipant.${name}`, () => participant[name]);
  return cases;
}
exports.checkProposed = async (vscode, authorized) => {
  const { provider, counts } = poisonProvider();
  const participant = vscode.chat.createChatParticipant('lean-proposed', () => ({}));
  const cases = proposedCases(vscode, participant, provider);
  for (const item of cases) {
    const expected = error => error instanceof Error && (authorized ? error.message === `${item.label} is unavailable in this product.` : error.message.includes(item.proposal) && /CANNOT use API proposal/.test(error.message));
    if (authorized && item.async) {
      let result;
      assert.doesNotThrow(() => { result = item.invoke(); }, item.label);
      assert.equal(typeof result.then, 'function', item.label);
      await assert.rejects(result, expected, item.label);
    } else {
      await assert.rejects(async () => item.invoke(), expected, item.label);
    }
  }
  participant.dispose();
  assert.deepEqual(counts, { reads: 0, methods: 0, subscriptions: 0 });
  return cases.length;
};

async function checkOrdinaryInlineCompletion(vscode, authorized) {
  const document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'INLINE_HEAD:' });
  const editor = await vscode.window.showTextDocument(document);
  const position = document.positionAt(document.getText().length);
  editor.selection = new vscode.Selection(position, position);
  let calls = 0;
  let shown = 0;
  const provider = {
    provideInlineCompletionItems(current, currentPosition) {
      assert.equal(current, document);
      assert.equal(currentPosition.character, position.character);
      calls++;
      return [{ insertText: 'INLINE_TAIL', range: new vscode.Range(position, position) }];
    }
  };
  const selector = { language: 'plaintext', scheme: 'untitled' };
  const metadata = { groupId: 'lean-tests.ordinary-inline', displayName: 'Ordinary Inline Fixture' };
  if (authorized) {
    provider.handleDidShowCompletionItem = () => { shown++; };
  } else {
    assert.throws(() => vscode.languages.registerInlineCompletionItemProvider(selector, provider, metadata), /CANNOT use API proposal: inlineCompletionsAdditions/);
  }
  const registration = vscode.languages.registerInlineCompletionItemProvider(selector, provider, authorized ? metadata : undefined);
  try {
    await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    assert.ok(calls > 0, 'Ordinary inline provider was not invoked');
    await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
    assert.equal(document.getText(), 'INLINE_HEAD:INLINE_TAIL');
    if (authorized) {
      for (let attempt = 0; shown === 0 && attempt < 50; attempt++) await new Promise(resolve => setTimeout(resolve, 100));
      assert.ok(shown > 0, 'Authorized ordinary inline proposal callback was not invoked');
    }
  } finally {
    registration.dispose();
    registration.dispose();
  }
}

exports.run = async () => {
  const vscode = require('vscode');
  const workspace = process.env.LEAN_TEST_WORKSPACE;
  const runId = process.env.LEAN_TEST_RUN_ID;
  assert.ok(workspace && path.isAbsolute(workspace), 'LEAN_TEST_WORKSPACE must be an isolated absolute path');
  assert.ok(runId, 'LEAN_TEST_RUN_ID must identify this invocation');
  const result = { runId, started: new Date().toISOString(), status: 'running', checks: [] };
  const resultPath = path.join(workspace, 'lean-core-results.json');
  await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  try {
    assert.equal(vscode.workspace.workspaceFolders[0].uri.fsPath, workspace);
    const { context } = await vscode.extensions.getExtension('lean-tests.lean-core-fixture').activate();
    await exports.checkStable(vscode, context);
    result.checks.push('stable local APIs, pure constructors, inert registrations and never events');
    const authorized = process.env.LEAN_TEST_PROPOSALS === 'authorized';
    const cases = await exports.checkProposed(vscode, authorized);
    result.checks.push(`${authorized ? 'authorized unavailable' : 'unauthorized permission failure'}: ${cases} proposed paths`);
    if (authorized) {
      const controlFile = path.join(workspace, 'ordinary-proposal-control.txt');
      await fs.writeFile(controlFile, 'ordinary proposal');
      const found = await vscode.workspace.findFiles2(['**/ordinary-proposal-control.txt']);
      assert.ok(found.some(uri => uri.fsPath === controlFile));
      result.checks.push('authorized ordinary findFiles2 proposal retains behavior');
    } else {
      assert.throws(() => vscode.workspace.findFiles2([]), /CANNOT use API proposal: findFiles2/);
      result.checks.push('ordinary findFiles2 proposal retains permission check');
    }
    await checkOrdinaryInlineCompletion(vscode, authorized);
    result.checks.push('ordinary inline provider produces accepted text; additions proposal retains permission and callback');
    assert.equal(await vscode.commands.executeCommand('leanCore.echo', 'ordinary-command'), 'ordinary-command');
    const document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'ordinary document' });
    await vscode.window.showTextDocument(document);
    assert.equal(document.getText(), 'ordinary document');
    const status = vscode.window.createStatusBarItem();
    status.text = 'Lean core fixture';
    status.show();
    status.hide();
    status.dispose();
    result.checks.push('ordinary command, document and status bar');
    const commands = await vscode.commands.getCommands(true);
    assert.equal(commands.includes('vscode.editorChat.start'), false);
    assert.equal(commands.includes('vscode.extensionPromptFileProvider'), false);
    result.checks.push('retired API commands absent');
    await new Promise((resolve, reject) => {
      const panel = vscode.window.createWebviewPanel('leanCoreFixture', 'Lean Core Fixture', vscode.ViewColumn.One, { enableScripts: true });
      const timer = setTimeout(() => { panel.dispose(); reject(new Error('Ordinary Webview ping/pong timed out')); }, 30000);
      panel.webview.onDidReceiveMessage(message => {
        if (message.kind === 'ready') panel.webview.postMessage({ kind: 'ping', runId });
        if (message.kind === 'pong') {
          try { assert.equal(message.runId, runId); clearTimeout(timer); panel.dispose(); resolve(); }
          catch (error) { clearTimeout(timer); panel.dispose(); reject(error); }
        }
      });
      panel.webview.html = '<!doctype html><meta charset="utf-8"><title>Lean Core Fixture</title><script>const vscode=acquireVsCodeApi();window.addEventListener("message",event=>{if(event.data.kind==="ping")vscode.postMessage({kind:"pong",runId:event.data.runId});});vscode.postMessage({kind:"ready"});</script>';
    });
    result.checks.push('ordinary Webview ping/pong');
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = { message: error.message, stack: error.stack };
    throw error;
  } finally {
    result.finished = new Date().toISOString();
    await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
  }
};
