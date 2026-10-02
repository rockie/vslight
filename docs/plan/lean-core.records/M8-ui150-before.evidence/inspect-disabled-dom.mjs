import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {WebviewCdp} from '../mermaid/ext/webview-cdp.mjs';
const root=import.meta.dirname, exec=promisify(execFile);
const app=JSON.parse(await fs.readFile(root+'/../identity.json','utf8')).app;
const run=JSON.parse(await fs.readFile(root+'/evidence/cold-launch.json','utf8'));
const ps=(await exec('ps',['-p',String(run.pid),'-o','pid=,ppid=,command='])).stdout;
assert.ok(ps.includes(app+'/Contents/MacOS/VSLight'));
assert.ok(ps.includes(root+'/u'));
const c=await WebviewCdp.connect('http://127.0.0.1:19560',{expectedApp:app});
try {
 const all=await c.contextsWithDom(), r=all.find(x=>x.dom.url.endsWith('/workbench/workbench.html'));
 assert.ok(r);
 const context=c.contexts.get(r.context.key);
 const dom=await c.evaluate(context,`(() => {const sidebar=document.querySelector('.part.sidebar');return {extensionViewlets:document.querySelectorAll('.extensions-viewlet').length,visibleInputs:[...document.querySelectorAll('input')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({value:x.value,label:x.getAttribute('aria-label'),class:x.className,parent:x.parentElement?.className})),sidebarText:sidebar?.innerText,sidebarHtml:sidebar?.outerHTML.slice(0,30000)};})()`);
 await fs.writeFile(root+'/evidence/disabled-dom-diagnostic.json',JSON.stringify({pid:run.pid,ps,dom},null,2)+'\n');
 const shot=await c.wire.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},context.sessionId);
 await fs.writeFile(root+'/evidence/disabled-dom-diagnostic.png',Buffer.from(shot.data,'base64'));
 console.log(JSON.stringify({pid:run.pid,extensionViewlets:dom.extensionViewlets,visibleInputs:dom.visibleInputs,sidebarText:dom.sidebarText}));
} finally {await c.close();}
