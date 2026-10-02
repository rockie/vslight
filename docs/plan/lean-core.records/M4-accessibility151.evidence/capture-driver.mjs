import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { WebviewCdp } from '/Users/rockie/Documents/gh-xgent/vscodium/dev/test-fixtures/lean-core/webview-cdp.mjs';
const root='/private/tmp/av151-4dvltjmt', hash=b=>createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const run=(p,a)=>execFileSync(p,a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const launch=JSON.parse(await fs.readFile(root+'/launch.json','utf8'));
const app=await fs.realpath(launch.app), profile=await fs.realpath(root+'/u'), pid=launch.pid;
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
async function authority(){
 if(launch.port!==19540||launch.root!==root||profile!==root+'/u')throw Error('Wrong private authority');
 const executable=run('/usr/bin/plutil',['-extract','CFBundleExecutable','raw','-o','-',app+'/Contents/Info.plist']);
 const command=run('/bin/ps',['-p',String(pid),'-ww','-o','args=']);
 const cpath=new RegExp(`^(.+?/Contents/MacOS/${escapeRE(executable)})(?=\\s|$)`).exec(command)?.[1];
 const ppath=/--user-data-dir(?:=|\s)(\S+)/.exec(command)?.[1];
 if(!cpath||await fs.realpath(cpath)!==await fs.realpath(app+'/Contents/MacOS/'+executable)||!ppath||await fs.realpath(ppath)!==profile||!/(?:^|\s)--remote-debugging-port(?:=|\s)19540(?=\s|$)/.test(command))throw Error('App PID/profile/port mismatch');
 const listener=run('/usr/sbin/lsof',['-nP','-a','-p',String(pid),'-iTCP:19540','-sTCP:LISTEN','-Fpn']);
 if(!listener.split('\n').includes('p'+pid)||listener.split('\n').filter(s=>s.startsWith('n')).join()!=='n127.0.0.1:19540')throw Error('Wrong exact listener');
 if(hash(await fs.readFile(root+'/ext/accessibility.js'))!==launch.fixtureSHA256||hash(await fs.readFile(app+'/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js'))!==launch.expectedWorkbenchSHA256)throw Error('Independent fixture/app hash mismatch');
 const ready=JSON.parse(await fs.readFile(root+'/ready.json','utf8'));
 if(ready.parentPid!==pid||ready.hostPid!==launch.hostPID)throw Error('Actual extension-host identity changed');
 return {pid,app,profile,port:19540,hostPID:ready.hostPid,fixtureSHA256:launch.fixtureSHA256,workbenchSHA256:launch.expectedWorkbenchSHA256};
}
async function request(action){
 const q={id:randomUUID(),action},temporary=root+'/request-'+q.id+'.tmp';await fs.writeFile(temporary,JSON.stringify(q));await fs.rename(temporary,root+'/request.json');
 for(let end=Date.now()+15000;Date.now()<end;){let r;try{r=JSON.parse(await fs.readFile(root+'/response.json','utf8'));}catch{}
  if(r?.id===q.id){await fs.writeFile(root+'/evidence/command-'+q.id+'.json',JSON.stringify(r,null,2));if(r.status!=='PASS')throw Error('Fixture command failed');return r;}await sleep(40);}
 throw Error('Fixture timed out; not resent');
}
const probe=`(()=>{const e=document.activeElement,v=document.querySelector('.accessible-view');return {documentHasFocus:document.hasFocus(),visibility:document.visibilityState,active:{tag:e?.tagName,classes:e?.className,role:e?.getAttribute('role'),ariaLabel:e?.getAttribute('aria-label'),text:e?.textContent?.slice(0,12000)},view:{present:!!v,width:v?.offsetWidth??0,height:v?.offsetHeight??0,visible:!!v&&v.offsetWidth>0&&v.offsetHeight>0,text:v?.innerText??''},terminal:!!e?.classList.contains('xterm-helper-textarea'),editor:!!e?.closest('.editor-instance'),hover:!!e?.closest('.hover-row')};})()`;
let client;
const results=[];
try{
 const before=await authority();client=await WebviewCdp.connect('http://127.0.0.1:19540/',{expectedApp:app});
 const rows=await client.contextsWithDom();const row=rows.find(r=>r.context.targetId===client.workbenchTargetId&&r.context.targetType==='page');if(!row)throw Error('No verified own workbench context');
 const context=client.contexts.get(row.context.key),session=client.rootSession(context);if(session.targetId!==client.workbenchTargetId||session.type!=='page')throw Error('Not own workbench session');
 const scripts=[], listener=m=>{if(m.sessionId===session.sessionId&&m.method==='Debugger.scriptParsed')scripts.push(m.params);};client.wire.listeners.add(listener);await client.wire.send('Debugger.enable',{},session.sessionId);
 const loaded=[];for(const s of scripts){try{const u=new URL(s.url);if(['vscode-file:','file:'].includes(u.protocol)&&await fs.realpath(decodeURIComponent(u.pathname))===await fs.realpath(app+'/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js'))loaded.push(s);}catch{}}
 if(loaded.length!==1)throw Error('Loaded workbench not unique');const source=(await client.wire.send('Debugger.getScriptSource',{scriptId:loaded[0].scriptId},session.sessionId)).scriptSource;if(hash(source)!==before.workbenchSHA256)throw Error('Actual already-loaded workbench differs');client.wire.listeners.delete(listener);
 const native=JSON.parse(run(root+'/window-state',[String(pid)])),initial=await client.evaluate(context,probe);await fs.writeFile(root+'/evidence/preflight.json',JSON.stringify({authority:before,loadedScriptId:loaded[0].scriptId,context:row.context,native,initial},null,2));
 console.log(JSON.stringify({event:'PREFLIGHT',pid,hostPID:before.hostPID,native,documentHasFocus:initial.documentHasFocus}));
 // The previous real hover-view Escape correctly returned focus to the hover.
 // Close that hover with another real renderer Escape before the next matrix.
 await client.wire.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:53},session.sessionId);await client.wire.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:53},session.sessionId);await sleep(400);
 await fs.writeFile(root+'/evidence/context-reset.json',JSON.stringify(await client.evaluate(context,probe),null,2));
 await request('terminal-output');await sleep(500);
 for(const [action,expected,restore] of [['terminal-view','A11Y_TERMINAL_MARKER','terminal'],['terminal-help','Focus Accessible Terminal View','terminal'],['editor-help','You are in a code editor','editor'],['hover-view','A11Y_HOVER_MARKER','hover']]){
  const response=await request(action);await sleep(400);const beforeNative=JSON.parse(run(root+'/window-state',[String(pid)]));const beforeView=await client.evaluate(context,probe);
  const ax=(await client.wire.send('Accessibility.getFullAXTree',{},session.sessionId)).nodes.filter(n=>n.role?.value==='textbox').map(n=>({nodeId:n.nodeId,ignored:n.ignored,role:n.role?.value,name:n.name?.value,value:n.value?.value,properties:n.properties?.filter(p=>['focused','focusable','editable'].includes(p.name))}));
  const contentBoxes=ax.filter(n=>n.name?.startsWith(action.endsWith('help')?'Accessibility Help':'Accessible View'));const content=contentBoxes.map(n=>n.value??'').join('\n');const textMatches=content.replaceAll('\u00a0',' ').includes(expected),domMatches=beforeView.view.text.replaceAll('\u00a0',' ').includes(expected);
  const retiredMatches=[...content.matchAll(/\b(?:debug|debugger|debugging|chat|copilot|notebook|jupyter|mcp|agent)\b/gi)].map(m=>m[0]);
  await client.wire.send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:53},session.sessionId);await client.wire.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:53},session.sessionId);await sleep(400);
  const afterView=await client.evaluate(context,probe),afterNative=JSON.parse(run(root+'/window-state',[String(pid)]));const fullFocusGate=beforeView.documentHasFocus&&afterView.documentHasFocus&&beforeNative.appActive&&afterNative.appActive&&beforeNative.onConsole&&afterNative.onConsole&&!beforeNative.locked&&!afterNative.locked;
  const behaviorPass=fullFocusGate&&textMatches&&domMatches&&beforeView.view.visible&&!afterView.view.visible&&afterView[restore]&&retiredMatches.length===0;
  const result={action,expected,fixtureResponse:response,before:beforeView,beforeNative,ax,accessibleContent:content,contentCheck:textMatches&&domMatches&&beforeView.view.visible?'REAL_DOM_AX_CONTENT_SUBSET_PASS':'CONTENT_NOT_OBSERVED_NO_ACCEPTANCE',retiredTextCheck:{patterns:'debug/debugger/debugging/chat/copilot/notebook/jupyter/mcp/agent',matches:retiredMatches,status:content.length&&retiredMatches.length===0?'CONTENT_SUBSET_ZERO_RETIRED_TEXT':'NO_CONTENT_OR_RETIRED_MATCH'},escapeInput:{mode:'trusted key event only to verified own renderer target',targetId:session.targetId,sessionId:session.sessionId},after:afterView,afterNative,fullFocusGate,status:behaviorPass?'FOUR_GATE_ROW_PASS':'BLOCKED_FULL_FOCUS_OR_BEHAVIOR_GATE'};results.push(result);await fs.writeFile(root+'/evidence/'+action+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify({action,status:result.status,contentCheck:result.contentCheck,retired:retiredMatches.length,visible:beforeView.view.visible,documentHasFocus:beforeView.documentHasFocus,closed:!afterView.view.visible,restore:afterView[restore]}));
 }
 const after=await authority();await fs.writeFile(root+'/evidence/summary.json',JSON.stringify({status:results.every(r=>r.status==='FOUR_GATE_ROW_PASS')?'FOUR_REAL_A11Y_BEHAVIORS_PASS':'PARTIAL_CONTENT_SUBSETS_FULL_FOCUS_BLOCKED',sourceGeneration:launch.sourceGeneration,authority:before,authorityAfter:after,native,initial,results,boundaries:{frozenFixture:true,noFocusEmulation:true,noAppActivation:false,noGlobalInput:true,noProviderOrSourceChanges:true,CDP19540Only:true,noAuthTouch:true}},null,2));
}catch(error){await fs.writeFile(root+'/evidence/failure.json',JSON.stringify({status:'FAILED_NO_ACCEPTANCE',reason:error.message},null,2));throw error;}finally{if(client)await client.close();}
