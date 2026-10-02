'use strict';

// Run as the main file of an isolated extension fixture. The response reports
// command completion only. Execute webviewProbeExpression in the actual product
// webview and keep its DOM, console and screenshot evidence separately.
const fs = require('node:fs/promises');
const path = require('node:path');
const cases = require('./mermaid-cases.json');

exports.cases = cases;

exports.webviewProbeExpression = (caseId, themeId, surface) => {
  const diagramCase = cases.cases.find(item => item.id === caseId);
  const theme = cases.themes.find(item => item.id === themeId);
  if (!diagramCase || !theme || !cases.surfaces.includes(surface)) throw new Error('Unknown Mermaid matrix row.');
  return '(' + webviewProbe.toString() + ')(' + JSON.stringify({ diagramCase, theme, surface }) + ')';
};

function webviewProbe({ diagramCase, theme, surface }) {
  const containers = [...document.querySelectorAll('.mermaid')];
  const container = containers[0];
  const svg = container?.querySelector('svg');
  const errors = [...document.querySelectorAll('.mermaid-error')].map(el => el.textContent.trim());
  const labelText = [];
  if (container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement?.closest('style, script') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    while (walker.nextNode()) {
      const value = walker.currentNode.textContent.trim();
      if (value) labelText.push(value);
    }
  }
  const text = labelText.join('\n');
  const labels = diagramCase.expectedLabels ?? [];
  const content = document.querySelector('.mermaid-content');
  const rect = svg?.getBoundingClientRect();
  const bodyStyle = getComputedStyle(document.body);
  const textNode = svg?.querySelector('text, .nodeLabel, .label, foreignObject div');
  const font = textNode ? getComputedStyle(textNode).fontFamily : null;
  const controls = [...document.querySelectorAll('.zoom-controls button')].map(button => ({
    className: button.className,
    label: button.getAttribute('aria-label'),
    pressed: button.getAttribute('aria-pressed'),
    visible: button.getBoundingClientRect().width > 0 && getComputedStyle(button.closest('.zoom-controls')).display !== 'none',
    iconFont: button.querySelector('.codicon') ? getComputedStyle(button.querySelector('.codicon'), '::before').fontFamily : null
  }));
  const nodePositions = [...(svg?.querySelectorAll('g.node, g.mindmap-node') ?? [])].map(node => {
    const transform = node.getAttribute('transform');
    const translate = transform?.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)/);
    return {
      text: node.textContent.trim(), transform,
      layoutX: translate ? Number(translate[1]) : null,
      layoutY: translate ? Number(translate[2]) : null,
      x: node.getBoundingClientRect().x,
      y: node.getBoundingClientRect().y
    };
  });
  const failures = [];
  if (containers.length !== 1) failures.push('Expected exactly one Mermaid diagram.');
  if (!document.body.classList.contains(theme.bodyClass)) failures.push('Actual webview theme does not match matrix row.');
  if (diagramCase.expectValid) {
    if (!svg || !rect || rect.width <= 0 || rect.height <= 0) failures.push('No visible SVG with positive dimensions.');
    if (errors.length) failures.push('Legal diagram produced a Mermaid error.');
    for (const label of labels) if (!text.includes(label)) failures.push('Missing label: ' + label);
    // These assertions distinguish the requested engines from Mermaid's silent
    // fallbacks for these exact fixtures and the frozen Mermaid/addon versions.
    const nodeFor = label => nodePositions.find(node => node.text === label);
    if (diagramCase.id === 'tidy-tree') {
      const root = nodeFor('中文根节点'), left = nodeFor('左侧分支'), right = nodeFor('右侧分支');
      if (!root || !left || !right || !(left.layoutX < root.layoutX && right.layoutX > root.layoutX) || Math.abs(left.layoutY - right.layoutY) > 1) failures.push('Requested tidy-tree layout was replaced by a fallback.');
    }
    if (diagramCase.id === 'elk') {
      const root = nodeFor('中文入口'), left = nodeFor('并行任务甲'), right = nodeFor('并行任务乙');
      if (!root || !left || !right || !(root.layoutX < (left.layoutX + right.layoutX) / 2 - 5)) failures.push('Requested ELK layout does not match the registered-engine reference.');
    }
    if (surface === 'standalone-editor' && (controls.length !== 4 || controls.some(button => !button.visible))) failures.push('Standalone editor controls are missing or hidden.');
  } else {
    if (!errors.length) failures.push('Invalid diagram has no visible Mermaid error element.');
    if (!errors.some(error => new RegExp(diagramCase.expectedErrorPattern, 'i').test(error))) failures.push('Invalid diagram did not show a useful syntax message.');
    if (errors.some(error => error === '[object Object]')) failures.push('Unhelpful object error message.');
    if (surface === 'standalone-editor' && controls.some(button => button.visible)) failures.push('Invalid standalone diagram left zoom controls visible.');
  }
  return {
    caseId: diagramCase.id, surface, theme: theme.id,
    status: failures.length ? 'FAIL' : 'PASS', failures,
    url: location.href, bodyClass: document.body.className,
    mermaidWebviewId: document.body.dataset.vscodeMermaidWebviewId ?? null,
    bodyContext: document.body.dataset.vscodeContext ?? null,
    diagramContext: container?.dataset.vscodeContext ?? null,
    diagramCount: containers.length, svgCount: container?.querySelectorAll('svg').length ?? 0,
    svgRect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
    viewBox: svg?.getAttribute('viewBox') ?? null,
    diagramDescription: svg?.getAttribute('aria-roledescription') ?? null,
    text, errors, controls, nodePositions,
    transform: content?.style.transform ?? null,
    font, fontStatus: document.fonts.status,
    fontFaces: [...document.fonts].map(face => ({ family: face.family, status: face.status })),
    themeColors: {
      foreground: bodyStyle.getPropertyValue('--vscode-editor-foreground').trim(),
      background: bodyStyle.getPropertyValue('--vscode-editor-background').trim(),
      bodyColor: bodyStyle.color,
      bodyBackground: bodyStyle.backgroundColor,
      labelColor: textNode ? getComputedStyle(textNode).color : null
    },
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? null,
    scriptSources: [...document.scripts].map(script => script.src).filter(Boolean),
    remainingChecks: ['console/CSP log', 'Chinese glyph screenshot', 'layout selection/fallback warnings', 'interaction/serializer restoration']
  };
}

exports.activate = async context => {
  const vscode = require('vscode');
  const root = process.env.LEAN_MERMAID_ROOT;
  if (!root) throw new Error('Set LEAN_MERMAID_ROOT to an isolated fixture directory.');
  await fs.mkdir(root, { recursive: true });
  const mermaidExtension = vscode.extensions.getExtension('vscode.mermaid-markdown-features');
  if (!mermaidExtension) throw new Error('The product Mermaid extension is absent.');
  await mermaidExtension.activate();
  let previous;
  let busy = false;
  const themeFor = id => {
    const theme = cases.themes.find(item => item.id === id);
    if (!theme) throw new Error('Unknown theme: ' + id);
    return theme;
  };
  const caseFor = id => {
    const diagramCase = cases.cases.find(item => item.id === id);
    if (!diagramCase) throw new Error('Unknown diagram: ' + id);
    return diagramCase;
  };
  const handle = async request => {
    if (request.action === 'quit') return vscode.commands.executeCommand('workbench.action.quit');
    if (request.action === 'close-editors') return vscode.commands.executeCommand('workbench.action.closeAllEditors');
    if (request.action === 'theme') {
      await vscode.workspace.getConfiguration('workbench').update('colorTheme', themeFor(request.theme).setting, vscode.ConfigurationTarget.Global);
      return { theme: request.theme };
    }
    if (request.action === 'status') return {
      mermaidExtensionPath: mermaidExtension.extensionPath,
      registeredCommands: (await vscode.commands.getCommands(true)).filter(command => command.startsWith('_mermaid-markdown.')),
      tabs: vscode.window.tabGroups.all.flatMap(group => group.tabs.map(tab => ({ label: tab.label, active: tab.isActive, inputType: tab.input?.constructor.name })))
    };
    const diagramCase = caseFor(request.caseId);
    if (request.theme) await vscode.workspace.getConfiguration('workbench').update('colorTheme', themeFor(request.theme).setting, vscode.ConfigurationTarget.Global);
    if (request.action === 'markdown-preview') {
      const file = path.join(root, diagramCase.id + '.md');
      await fs.writeFile(file, '# Mermaid fixture: ' + diagramCase.id + '\n\n```mermaid\n' + diagramCase.source + '```\n');
      const uri = vscode.Uri.file(file);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
      await vscode.commands.executeCommand('markdown.showPreview', uri);
      return { file, caseId: diagramCase.id, expectValid: diagramCase.expectValid };
    }
    if (request.action === 'standalone-editor') {
      const args = request.mermaidWebviewId ? { mermaidWebviewId: request.mermaidWebviewId } : { mermaidSource: diagramCase.source, title: 'Mermaid fixture: ' + diagramCase.id };
      await vscode.commands.executeCommand('_mermaid-markdown.openInEditor', args);
      return { caseId: diagramCase.id, sourceRoute: request.mermaidWebviewId ? 'webview-id' : 'source' };
    }
    if (request.action === 'open-active-editor') {
      await vscode.commands.executeCommand('_mermaid-markdown.openInEditor');
      return { caseId: diagramCase.id, sourceRoute: 'active-webview' };
    }
    if (request.action === 'reset-zoom') {
      await vscode.commands.executeCommand('_mermaid-markdown.resetPanZoom', request.mermaidWebviewId ? { mermaidWebviewId: request.mermaidWebviewId } : undefined);
      return { sourceRoute: request.mermaidWebviewId ? 'webview-id' : 'active-webview' };
    }
    if (request.action === 'copy-source') {
      // A no-op command must not pass by reading an earlier successful copy.
      await vscode.env.clipboard.writeText('lean-mermaid-copy-sentinel:' + request.id);
      await vscode.commands.executeCommand('_mermaid-markdown.copySource', request.mermaidWebviewId ? { mermaidWebviewId: request.mermaidWebviewId } : undefined);
      let copiedSource;
      for (let attempt = 0; attempt < 20; attempt++) {
        copiedSource = await vscode.env.clipboard.readText();
        if (copiedSource.trim() === diagramCase.source.trim()) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (copiedSource.trim() !== diagramCase.source.trim()) throw new Error('copySource did not copy the actual selected diagram source.');
      return { copiedSource, sourceRoute: request.mermaidWebviewId ? 'webview-id' : 'active-webview' };
    }
    throw new Error('Unknown Mermaid action: ' + request.action);
  };
  const timer = setInterval(async () => {
    if (busy) return;
    let request;
    try { request = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')); } catch { return; }
    if (request.id === previous) return;
    previous = request.id;
    busy = true;
    try {
      const result = await handle(request);
      await fs.writeFile(path.join(root, 'response.json'), JSON.stringify({ id: request.id, action: request.action, status: 'COMMAND_COMPLETED', result }));
    } catch (error) {
      await fs.writeFile(path.join(root, 'response.json'), JSON.stringify({ id: request.id, action: request.action, status: 'FAIL', error: error.stack }));
    } finally {
      busy = false;
    }
  }, 100);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  await fs.writeFile(path.join(root, 'ready.json'), JSON.stringify({ hostPid: process.pid, parentPid: process.ppid, version: vscode.version, mermaidExtensionPath: mermaidExtension.extensionPath, matrixRows: cases.matrix.expectedRows }));
};
