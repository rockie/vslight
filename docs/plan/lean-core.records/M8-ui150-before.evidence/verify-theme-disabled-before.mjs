import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {WebviewCdp} from '../mermaid/ext/webview-cdp.mjs';
const root=import.meta.dirname, exec=promisify(execFile), evidence=root+'/evidence';
const identity=JSON.parse(await fs.readFile(root+'/../identity.json','utf8'));
const run=JSON.parse(await fs.readFile(evidence+'/cold-launch.json','utf8'));
const before=JSON.parse(await fs.readFile(evidence+'/active-probe-summary.json','utf8'));
const ps=(await exec('ps',['-p',String(run.pid),'-o','pid=,ppid=,command='])).stdout;
assert.ok(ps.includes(identity.app+'/Contents/MacOS/VSLight'));assert.ok(ps.includes(root+'/u'));
for(const file of identity.files)assert.equal(createHash('sha256').update(await fs.readFile(file.path)).digest('hex'),file.sha256);
const c=await WebviewCdp.connect('http://127.0.0.1:19560',{expectedApp:identity.app});
const result={generation:'150',status:'RUNNING',pid:run.pid,authority:ps};
try {
 const all=await c.contextsWithDom(), r=all.find(x=>x.dom.url.endsWith('/workbench/workbench.html'));assert.ok(r);
 const context=c.contexts.get(r.context.key), evaluate=expr=>c.evaluate(context,expr);
 const theme=before.themeApplied;
 result.theme=await evaluate(`(() => {const w=document.querySelector('.monaco-workbench'),e=document.querySelector('.part.editor .monaco-editor'),s=w&&getComputedStyle(w);return {classes:w?.className,editorBackground:e&&getComputedStyle(e).backgroundColor,colors:Object.fromEntries(${JSON.stringify(Object.keys(theme.colors))}.map(k=>[k,s?.getPropertyValue('--vscode-'+k.replaceAll('.','-')).trim()]))};})()`);
 const cls=(theme.extensionId+'-'+theme.declaration.path.replace(/^\.\//,'')).replace(/[^_a-zA-Z0-9-]/g,'-');
 assert.ok(result.theme.classes.split(' ').includes(cls));
 for(const [key,value]of Object.entries(theme.colors))assert.equal(result.theme.colors[key]?.toLowerCase(),value.toLowerCase());
 const rgb=theme.colors['editor.background'].slice(1).match(/../g).map(v=>parseInt(v,16));assert.equal(result.theme.editorBackground,`rgb(${rgb.join(', ')})`);
 result.disabled=await evaluate(`(() => {const v=document.querySelector('.extensions-viewlet');return {query:v?.querySelector('.extensions-search-container [data-uri="extensions:searchinput"] .view-lines')?.innerText.replaceAll(String.fromCharCode(160),' ').trim(),rows:[...(v?.querySelectorAll('.monaco-list-row')??[])].map(r=>({id:r.getAttribute('data-extension-id'),label:r.getAttribute('aria-label'),text:r.innerText}))};})()`);
 assert.equal(result.disabled.query,'@disabled lean-disabled-final');assert.equal(result.disabled.rows.length,1);assert.equal(result.disabled.rows[0].id,'lean-tests.lean-disabled-final');
 assert.ok(result.disabled.rows[0].label.includes('Synthetic disabled extension persistence sentinel'));
 assert.equal(before.before.disabledExtension.hostVisible,false);
 assert.equal(before.before.disabledExtension.activationMarkerPresent,false);
 result.themeFile={path:theme.themeFile,sha256:createHash('sha256').update(await fs.readFile(theme.themeFile)).digest('hex')};
 result.status='ACTUAL_THEME_AND_DISABLED_RENDERER_BEFORE_PASS';
 const shot=await c.wire.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},context.sessionId);await fs.writeFile(evidence+'/verified-theme-disabled-before.png',Buffer.from(shot.data,'base64'));
} catch(error){result.status='FAIL';result.error=error.stack;process.exitCode=1;}
finally {await c.close();await fs.writeFile(evidence+'/verified-theme-disabled-before.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
