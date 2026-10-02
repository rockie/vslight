import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID, createHash } from 'node:crypto';
import { WebviewCdp } from '../mermaid/ext/webview-cdp.mjs';
const exec=promisify(execFile),root=import.meta.dirname,evidence=path.join(root,'evidence');
const identity=JSON.parse(await fs.readFile(path.join(root,'../identity.json'),'utf8')),app=identity.app,node=identity.node;
const pause=ms=>new Promise(r=>setTimeout(r,ms));const write=(n,v)=>fs.writeFile(path.join(evidence,n),JSON.stringify(v,null,2)+'\n');
const result={status:'RUNNING',app,root,runs:[],queries:[]};let current,client;
async function request(action,values={}){
 const id=randomUUID();await fs.writeFile(path.join(root,'request.json'),JSON.stringify({id,action,...values}));
 for(let i=0;i<300;i++){try{const r=JSON.parse(await fs.readFile(path.join(root,'response.json'),'utf8'));if(r.id===id){assert.equal(r.status,'PASS',JSON.stringify(r));return r.result;}}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}await pause(100);}throw Error('Fixture timeout '+action);
}
async function freeze(){for(const f of identity.files)assert.equal(createHash('sha256').update(await fs.readFile(f.path)).digest('hex'),f.sha256);}
async function launch(label){
 await freeze();for(const n of ['request.json','ready.json'])await fs.rm(path.join(root,n),{force:true});
 const args=['--user-data-dir',path.join(root,'u'),'--extensions-dir',path.join(root,'e'),'--shared-data-dir',path.join(root,'s'),'--extensionDevelopmentPath',path.join(root,'ext'),'--remote-debugging-port=19560','--skip-welcome','--skip-release-notes','--disable-workspace-trust','--new-window',path.join(root,'w')];
 const env={...process.env,LEAN_ORDINARY_ROOT:root};for(const k of ['ELECTRON_RUN_AS_NODE','VSCODE_DEV','VSCODE_PID','VSCODE_CWD','VSCODE_IPC_HOOK_CLI'])delete env[k];
 const log=await fs.open(path.join(evidence,label+'-app.log'),'w');const child=spawn(path.join(app,'Contents/MacOS/VSLight'),args,{env,stdio:['ignore',log.fd,log.fd]});await log.close();
 const run={label,pid:child.pid,args,at:new Date().toISOString()};result.runs.push(run);const exited=new Promise((res,rej)=>{child.once('error',rej);child.once('exit',(code,signal)=>{run.exit={code,signal,at:new Date().toISOString()};res(run.exit);});});current={child,run,exited};
 for(let i=0;i<450;i++){assert.equal(child.exitCode,null);try{const r=JSON.parse(await fs.readFile(path.join(root,'ready.json'),'utf8'));if(r.pid){run.ready=r;break;}}catch{}await pause(100);}assert.ok(run.ready,'Host not ready');
 run.authority=(await exec('ps',['-p',String(run.pid),'-o','pid=,ppid=,command='])).stdout;assert.ok(run.authority.includes(app+'/Contents/MacOS/VSLight'));assert.ok(run.authority.includes(path.join(root,'u')));
 run.listener=(await exec('/usr/sbin/lsof',['-nP','-a','-p',String(run.pid),'-iTCP:19560','-sTCP:LISTEN','-Fpn'])).stdout;assert.ok(run.listener.includes('p'+run.pid));
 client=await WebviewCdp.connect('http://127.0.0.1:19560',{expectedApp:app});await write(label+'-launch.json',run);console.log(JSON.stringify({stage:'READY',label,pid:run.pid,host:run.ready.pid}));
}
async function rootContext(){const all=await client.contextsWithDom();const row=all.find(r=>r.dom.url.endsWith('/workbench/workbench.html'));assert.ok(row);return client.contexts.get(row.context.key);}
async function evaluate(expr){return client.evaluate(await rootContext(),expr);}
async function screen(name){const c=await rootContext();const {data}=await client.wire.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},c.sessionId);await fs.writeFile(path.join(evidence,name+'.png'),Buffer.from(data,'base64'));}
async function quit(){if(client){await client.close();client=undefined;}if(!current||current.child.exitCode!==null)return;await fs.writeFile(path.join(root,'request.json'),JSON.stringify({id:randomUUID(),action:'quit'}));const end=await Promise.race([current.exited,pause(20000).then(()=>{throw Error('Quit timeout');})]);assert.deepEqual({code:end.code,signal:end.signal},{code:0,signal:null});await write(current.run.label+'-launch.json',current.run);await freeze();console.log(JSON.stringify({stage:'QUIT',pid:current.run.pid}));}
const domProbe=`(() => {const e=document.querySelector('.keybindings-editor');return {present:!!e,search:e?.querySelector('.keybindings-header .search-container input')?.value,bodyText:e?.innerText,lists:[...(e?.querySelectorAll('.monaco-list')??[])].map(x=>({role:x.getAttribute('role'),count:x.getAttribute('aria-rowcount'),label:x.getAttribute('aria-label')})),rows:[...(e?.querySelectorAll('.monaco-list-row')??[])].map(x=>({text:x.innerText,aria:x.querySelector('.command')?.getAttribute('aria-label'),id:x.querySelector('.command-id')?.textContent,labels:[...x.querySelectorAll('[aria-label]')].map(y=>y.getAttribute('aria-label'))}))};})()`;
try {
 const live=JSON.parse(await fs.readFile(path.join(evidence,'cold-launch.json'),'utf8'));
 const authority=(await exec('ps',['-p',String(live.pid),'-o','pid=,ppid=,command='])).stdout;assert.ok(authority.includes(app+'/Contents/MacOS/VSLight'));assert.ok(authority.includes(path.join(root,'u')));const listener=(await exec('/usr/sbin/lsof',['-nP','-a','-p',String(live.pid),'-iTCP:19560','-sTCP:LISTEN','-Fpn'])).stdout;assert.ok(listener.includes('p'+live.pid));
 result.live={...live,authority,listener};await freeze();client=await WebviewCdp.connect('http://127.0.0.1:19560',{expectedApp:app});
 const retired=JSON.parse(await fs.readFile(path.join(root,'retired-provenance149.json'),'utf8'));const candidates=new Set(retired.candidateIDs.command.filter(id=>!retired.ordinaryReferencedIDExceptions.includes(id)));const patterns=retired.dynamicRows.filter(x=>x.classification==='dynamic command family'&&x.idPattern).map(x=>new RegExp(x.idPattern));
 for(const query of ['@command:editor.action.clipboardCopyAction','chat','mcp','speech','dictation','integrated browser','simple browser','agent sessions','playwright','@command:simpleBrowser.show','@command:workbench.action.browser.goBack','@command:workbench.action.chat.acceptTool','@command:workbench.action.agentSessions.newBrowserTab']){
  await request('command',{command:'workbench.action.openGlobalKeybindings',args:[query]});let dom;
  for(let i=0;i<50;i++){dom=await evaluate(domProbe);if(dom.present&&dom.search===query)break;await pause(100);}assert.equal(dom.search,query,'Public initial shortcut query did not appear');await pause(400);dom=await evaluate(domProbe);
  await screen('active-keys-'+result.queries.length);await write('active-keys-'+result.queries.length+'.json',dom);result.queries.push({query,dom});
  if(query.startsWith('@command:editor'))assert.ok(dom.rows.some(r=>(r.id||r.aria||r.text).includes('editor.action.clipboardCopyAction')),'Positive ordinary shortcut missing');
  else { const ids=dom.rows.map(r=>r.id || r.aria?.match(/\(([^()]*)\)$/)?.[1] || r.aria);for(const id of ids){assert.ok(id,'Row command ID missing');assert.ok(!candidates.has(id)&&!patterns.some(p=>p.test(id)),'Retired command still displayed: '+id);}if(query.startsWith('@command:'))assert.equal(dom.rows.length,0);result.queries.at(-1).actualCommandIds=ids;result.queries.at(-1).classifiedRetired=0; }
 }
 await request('content-search',{marker:'OST149_SEARCH_FINAL150'});
 result.themeApplied=await request('apply-theme',{extensionId:'zhuangtongfa.material-theme',theme:'One Dark Pro'});
 result.before=await request('persistence-status',{phase:'before'});
 result.cssBefore=await evaluate(`(() => ({bodyClass:document.body.className,editorBackground:getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background').trim(),activityLabels:[...document.querySelectorAll('.activitybar [aria-label]')].map(x=>x.getAttribute('aria-label'))}))()`);

 await screen('theme-before-restart');result.status='BEFORE_QUIT_PUBLIC_CHECKS_PASS';
}catch(e){result.status='FAIL';result.error=e.stack;console.log(result.error);await write('active-probe-failure-dom.json',await evaluate(domProbe).catch(()=>({})));process.exitCode=1;}finally{if(client)await client.close();await write('active-probe-summary.json',result);console.log(JSON.stringify({status:result.status,queries:result.queries.length,error:result.error}));}
