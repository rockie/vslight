import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {WebviewCdp} from '../mermaid/ext/webview-cdp.mjs';
const root=import.meta.dirname, exec=promisify(execFile), evidence=root+'/evidence';
const identity=JSON.parse(await fs.readFile(root+'/../identity.json','utf8'));
const launch=JSON.parse(await fs.readFile(evidence+'/cold-launch.json','utf8'));
const ps=(await exec('ps',['-p',String(launch.pid),'-o','pid=,ppid=,command='])).stdout;
assert.ok(ps.includes(identity.app+'/Contents/MacOS/VSLight'));assert.ok(ps.includes(root+'/u'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const id=randomUUID();await fs.writeFile(root+'/request.json',JSON.stringify({id,action:'command',command:'workbench.action.openWalkthrough',args:[]}));
let response;
for(let i=0;i<300;i++){try{const r=JSON.parse(await fs.readFile(root+'/response.json','utf8'));if(r.id===id){response=r;break;}}catch{}await pause(100);}
assert.equal(response?.status,'PASS');
const c=await WebviewCdp.connect('http://127.0.0.1:19560',{expectedApp:identity.app});
try {
 const all=await c.contextsWithDom(), row=all.find(x=>x.dom.url.endsWith('/workbench/workbench.html'));assert.ok(row);
 const context=c.contexts.get(row.context.key);
 let dom;
 for(let i=0;i<50;i++){
  dom=await c.evaluate(context,`(() => {const welcome=document.querySelector('.gettingStartedContainer'),t=document.querySelector('.part.titlebar');return {titlebar:{text:t?.innerText,labels:[...(t?.querySelectorAll('[aria-label],[title]')??[])].map(x=>({aria:x.getAttribute('aria-label'),title:x.getAttribute('title'),class:x.className})),rect:t?{width:t.getBoundingClientRect().width,height:t.getBoundingClientRect().height}:null},welcome:{present:!!welcome,text:welcome?.innerText,rect:welcome?{width:welcome.getBoundingClientRect().width,height:welcome.getBoundingClientRect().height}:null},tabs:[...document.querySelectorAll('.tabs-container .tab')].map(x=>({text:x.innerText,title:x.getAttribute('aria-label')}))};})()`);
  if(dom.welcome.present&&dom.welcome.rect.width>100)break;await pause(100);
 }
 await fs.writeFile(evidence+'/welcome-titlebar150-actual.json',JSON.stringify({pid:launch.pid,authority:ps,response,dom},null,2)+'\n');
 const shot=await c.wire.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},context.sessionId);await fs.writeFile(evidence+'/welcome-titlebar150-actual.png',Buffer.from(shot.data,'base64'));
 assert.ok(dom.welcome.present&&dom.welcome.rect.width>100&&dom.welcome.rect.height>100);
 assert.ok(dom.titlebar.rect.width>100&&dom.titlebar.rect.height>10);
 const prohibited=/\b(Chat|MCP|Speech|Dictation|Integrated Browser|Simple Browser|Agent Sessions|Copilot)\b/i;
 assert.ok(!prohibited.test(dom.welcome.text));for(const label of dom.titlebar.labels)assert.ok(!prohibited.test((label.aria??'')+' '+(label.title??'')));
 console.log(JSON.stringify({status:'WELCOME_TITLEBAR150_PUBLIC_RENDERER_PASS',pid:launch.pid,welcome:dom.welcome,titlebar:dom.titlebar}));
}finally{await c.close();}
