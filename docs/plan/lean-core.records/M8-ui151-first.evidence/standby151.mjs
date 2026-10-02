import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { WebviewCdp } from '../mermaid/ext/webview-cdp.mjs';
const exec=promisify(execFile), root=import.meta.dirname, evidence=path.join(root,'evidence');
const identity=JSON.parse(await fs.readFile(path.join(root,'identity151.json'),'utf8'));
const mode=process.argv[2]??'--preflight';
assert(['--preflight','--finish-after-permission'].includes(mode),'Use --preflight or --finish-after-permission');
const result={status:'PREPARING',mode,generation:'151',startedAt:new Date().toISOString(),runs:[],queries:[],fullRetiredRegistryReview:'PENDING_ROOT_REVIEW'};
let client,newRun,handoffStarted=false;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=data=>createHash('sha256').update(data).digest('hex');
const readJSON=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const write=async(name,value)=>{await fs.mkdir(evidence,{recursive:true});await fs.writeFile(path.join(evidence,name),JSON.stringify(value,null,2)+'\n');};
async function until(check,message,timeout=20000){const end=Date.now()+timeout;while(Date.now()<end){const value=await check();if(value)return value;await sleep(100);}throw Error(message);}
async function ps(pid){try{return (await exec('/bin/ps',['-p',String(pid),'-o','pid=,ppid=,stat=,command='])).stdout.trim();}catch(error){if(error.code===1&&!error.stdout?.trim())return '';throw error;}}
async function freeze(files){for(const file of files)assert.equal(hash(await fs.readFile(file.path)),file.sha256,'Immutable file changed: '+file.path);}
async function ready(file){return readJSON(path.join(root,file));}
async function guard150(){
 await freeze(identity.oldFiles);
 assert.equal(hash(await fs.readFile(identity.oldController)),identity.oldControllerSHA256,'Old controller changed');
 assert.equal(hash(await fs.readFile(identity.fixture)),identity.fixtureSHA256,'Ordinary fixture changed');
 const r=await ready('ready.json');assert.equal(r.pid,identity.oldHostPID);assert.equal(r.parentPID,identity.oldMainPID);assert.equal(r.root,root);assert.equal(r.extensionId,'lean-tests.lean-ui-final');
 const main=await ps(identity.oldMainPID),host=await ps(identity.oldHostPID),parent=await ps(identity.oldParentPID);
 const match=main.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/);assert(match&&Number(match[1])===identity.oldMainPID&&Number(match[2])===identity.oldParentPID&&!match[3].startsWith('Z'));
 assert(main.includes(identity.oldApp+'/Contents/MacOS/VSLight'));assert(main.includes('--user-data-dir '+identity.expectedProfile));assert(main.includes('--remote-debugging-port='+identity.expectedPort));
 assert(host.match(new RegExp('^'+identity.oldHostPID+'\\s+'+identity.oldMainPID+'\\s')));assert(host.includes('--user-data-dir='+identity.expectedProfile));assert(parent.includes(identity.node+' '+identity.oldController));
 const listener=(await exec('/usr/sbin/lsof',['-nP','-a','-p',String(identity.oldMainPID),'-iTCP:'+identity.expectedPort,'-sTCP:LISTEN','-Fpn'])).stdout;
 assert(listener.split('\n').includes('p'+identity.oldMainPID));assert(listener.includes('n127.0.0.1:'+identity.expectedPort));
 try{await fs.access(path.join(root,'continue.json'));throw Error('Old continue signal already exists; parent may have resumed');}catch(error){if(error.code!=='ENOENT')throw error;}
 return {main,host,parent,listener,ready:r,four150HashesVerified:true};
}
function inspectMenu(menu,pid){
 const errors=[],titles=[];let nodes=0,deepest=0;
 function visit(n){nodes++;deepest=Math.max(deepest,n.depth??0);if(n.truncated||n.depth>=30)errors.push('Tree depth/truncation boundary');if(n.pid!==pid)errors.push('Menu node PID differs');if(typeof n.AXTitle==='string')titles.push({path:n.path,title:n.AXTitle});for(const child of n.children??[])visit(child);}
 if(menu.menuBar)visit(menu.menuBar);
 if(menu.readonly!==true||!(menu.trusted===true||menu.trusted===1)||menu.menuBarError!==0)errors.push('Native menu authorization/read failed');
 if(!menu.menuBar||menu.nodeCount<=100||menu.nodeCount>=3000||nodes!==menu.nodeCount)errors.push('Native menu incomplete or node count invalid');
 const positive={File:['File','文件'],Edit:['Edit','编辑'],View:['View','视图','查看'],Terminal:['Terminal','终端'],Help:['Help','帮助']};const positiveHits={};
 const top=(menu.menuBar?.children??[]).map(n=>n.AXTitle?.replaceAll('&','').trim()).filter(Boolean);
 for(const [name,labels]of Object.entries(positive)){positiveHits[name]=top.find(title=>labels.includes(title));if(!positiveHits[name])errors.push('Native positive menu missing: '+name);}
 const retired=/\b(?:Chat|MCP|Speech|Dictation|Integrated Browser|Simple Browser|Agent Sessions|Copilot)\b|集成浏览器|简单浏览器|代理会话|聊天|听写/i;
 const systemDictation=row=>['开始听写…','Start Dictation…'].includes(row.title)&&Array.isArray(row.path)&&row.path.length===4&&row.path[0]==='AXMenuBar'&&row.path[1]==='Edit'&&row.path[2]==='AXMenu'&&row.path[3]===row.title;
 const systemNativeExceptions=titles.filter(systemDictation).map(row=>({...row,classification:'macOS system Edit menu Start Dictation',sourceURL:'https://support.apple.com/en-au/guide/mac-help/mh40584/26/mac/26'}));
 const prohibited=titles.filter(row=>retired.test(row.title)&&!systemDictation(row));if(prohibited.length)errors.push('Retired dedicated native menu titles present');
 return {complete:errors.length===0,errors,nodeCount:nodes,deepest,positiveHits,topTitles:top,titles,prohibited,systemNativeExceptions};
}
async function nativeMenu(pid,label){let call,menu;try{call=await exec(path.join(root,'menu-readonly'),[String(pid)],{maxBuffer:4*1024*1024,timeout:25000});}catch(error){call={stdout:error.stdout??'',stderr:error.stderr??'',exit:error.code,error:error.message};}
 try{menu=JSON.parse(call.stdout);}catch{menu={readonly:true,trusted:false,nodeCount:0};}
 const check=inspectMenu(menu,pid);await write(label+'-native-menu.json',{call,menu,check});return {menu,check};
}
async function request(action,values={},prefix='',timeout=30000){
 const id=randomUUID(),file=path.join(root,prefix+'request.json');await fs.writeFile(file,JSON.stringify({id,action,...values}));
 return until(async()=>{let r;try{r=await readJSON(path.join(root,prefix+'response.json'));}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return false;throw error;}
 if(r.id!==id)return false;assert.equal(r.status,'PASS',JSON.stringify(r));return {value:r.result};},'Private fixture timeout: '+prefix+action,timeout).then(r=>r.value);
}
async function connect(app){client=await WebviewCdp.connect('http://127.0.0.1:'+identity.expectedPort,{expectedApp:app});}
async function rootContext(){const all=await client.contextsWithDom();const rows=all.filter(row=>row.dom.url.endsWith('/workbench/workbench.html'));assert.equal(rows.length,1);return client.contexts.get(rows[0].context.key);}
async function evaluate(expression){return client.evaluate(await rootContext(),expression);}
async function screen(name){const context=await rootContext();const {data}=await client.wire.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},context.sessionId);await fs.writeFile(path.join(evidence,name+'.png'),Buffer.from(data,'base64'));}
async function welcomeTitlebar(label){
 await request('command',{command:'workbench.action.openWalkthrough',args:[]});
 const dom=await until(async()=>{const d=await evaluate(`(() => {const t=document.querySelector('.part.titlebar'),w=document.querySelector('.gettingStartedContainer');return {welcomePresent:!!w,welcomeText:w?.innerText,titlebarPresent:!!t,titlebarText:t?.innerText,titlebarControls:[...(t?.querySelectorAll('[aria-label],[title]')??[])].map(n=>({role:n.getAttribute('role'),label:n.getAttribute('aria-label'),title:n.getAttribute('title')})),activityLabels:[...document.querySelectorAll('.activitybar [aria-label]')].map(n=>n.getAttribute('aria-label'))};})()`);return d.welcomePresent&&d.titlebarPresent?d:false;},'Welcome/titlebar did not appear');
 assert(dom.welcomeText?.length>20);const dedicated=/Integrated Browser|Simple Browser|Agent Sessions|Copilot|MCP|Dictation|集成浏览器|简单浏览器|代理会话/i;assert(!dedicated.test(JSON.stringify(dom.titlebarControls)));await write(label+'-welcome-titlebar.json',dom);await screen(label+'-welcome-titlebar');return dom;
}
async function closeCdp(){if(client){await client.close();client=undefined;}}
async function handoff150(){
 await guard150();handoffStarted=true;
 await fs.writeFile(path.join(root,'request.json'),JSON.stringify({id:randomUUID(),action:'quit'}));
 await closeCdp();await until(async()=>!(await ps(identity.oldMainPID)),'150 did not stop after ordinary Quit',25000);
 // Only now may the legacy parent consume its signal; with no host the next request times out.
 const signalledAt=Date.now();await fs.writeFile(path.join(root,'continue.json'),JSON.stringify({handoff151:true,oldMainPID:identity.oldMainPID,at:new Date().toISOString()}));
 const summary=await until(async()=>{try{const file=path.join(evidence,'summary.json');if((await fs.stat(file)).mtimeMs<signalledAt)return false;const s=await readJSON(file);return s.runs?.some(r=>r.pid===identity.oldMainPID&&r.exit)?s:false;}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return false;throw error;}},'Legacy parent did not publish actual child exit',140000);
 const run=summary.runs.find(r=>r.pid===identity.oldMainPID);assert.deepEqual({code:run.exit.code,signal:run.exit.signal},{code:0,signal:null},'150 actual parent wait was not normal exit');
 assert.equal(summary.status,'FAIL','Legacy stale controller outcome must be preserved as failure');
 await until(async()=>{const p=await ps(identity.oldParentPID);return !p||/^\d+\s+\d+\s+Z/.test(p)?{ps:p}:false;},'Legacy parent is still executing after summary',20000);
 assert.equal(await ps(identity.oldMainPID),'');assert.equal(await ps(identity.oldHostPID),'');
 await write('handoff150-history.json',{status:'NORMAL_150_EXIT_AND_STALE_CONTROLLER_FAILURE_PRESERVED',summary,actualExit:run.exit,notProductFailure:true,parentTerminal:true});result.handoff150={actualExit:run.exit,parentTerminal:true,staleControllerStatus:summary.status};
 const audit=await exec('/usr/bin/python3',[path.join(root,'persistence-audit.py'),'cold'],{maxBuffer:1024*1024});await write('151-handoff-preservation.json',{exit:0,stdout:audit.stdout,stderr:audit.stderr});
 await freeze(identity.oldFiles);
}
async function launch151(){
 const location=await readJSON(path.join(root,'../local151-location.json'));assert.equal(location.app,identity.newApp);await freeze(identity.newFiles);assert.equal(hash(await fs.readFile(identity.newWorkbenchPath)),identity.newWorkbenchSHA256);
 for(const file of ['request.json','ready.json','terminal151-request.json','terminal151-ready.json'])await fs.rm(path.join(root,file),{force:true});
 const args=['--user-data-dir',identity.expectedProfile,'--extensions-dir',path.join(root,'e'),'--shared-data-dir',path.join(root,'s'),'--extensionDevelopmentPath',path.join(root,'ext'),'--extensionDevelopmentPath',path.join(root,'terminal151-ext'),'--remote-debugging-port='+identity.expectedPort,'--skip-welcome','--skip-release-notes','--disable-workspace-trust','--new-window',path.join(root,'w')];
 const env={...process.env,LEAN_ORDINARY_ROOT:root};for(const key of ['ELECTRON_RUN_AS_NODE','VSCODE_DEV','VSCODE_PID','VSCODE_CWD','VSCODE_IPC_HOOK_CLI'])delete env[key];
 const log=await fs.open(path.join(evidence,'151-restart-app.log'),'w');const child=spawn(path.join(identity.newApp,'Contents/MacOS/VSLight'),args,{env,stdio:['ignore',log.fd,log.fd]});await log.close();
 const run={generation:'151',pid:child.pid,args,at:new Date().toISOString(),controllerPID:process.pid};result.runs.push(run);const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>{run.exit={code,signal,at:new Date().toISOString()};resolve(run.exit);});});newRun={child,run,exited};exited.catch(()=>{});
 run.ready=await until(async()=>{if(child.exitCode!==null)throw Error('151 exited before ready');try{const r=await ready('ready.json');return r.parentPID===child.pid&&r.pid!==identity.oldHostPID?r:false;}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return false;throw error;}},'151 ordinary host not ready',45000);
 run.terminalReady=await until(async()=>{try{const r=await ready('terminal151-ready.json');return r.parentPID===child.pid&&r.pid===run.ready.pid&&r.extensionId===identity.secondExtensionID?r:false;}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return false;throw error;}},'151 second terminal extension not ready',45000);
 assert.notEqual(child.pid,identity.oldMainPID);assert.notEqual(run.ready.pid,identity.oldHostPID);assert.equal(run.ready.extensionId,'lean-tests.lean-ui-final');assert.equal(run.ready.root,root);
 run.authority=await ps(child.pid);assert(run.authority.includes(identity.newApp+'/Contents/MacOS/VSLight'));assert(run.authority.match(new RegExp('^'+child.pid+'\\s+'+process.pid+'\\s')));assert(run.authority.includes(identity.expectedProfile));
 run.hostAuthority=await ps(run.ready.pid);assert(run.hostAuthority.match(new RegExp('^'+run.ready.pid+'\\s+'+child.pid+'\\s')));
 run.listener=(await exec('/usr/sbin/lsof',['-nP','-a','-p',String(child.pid),'-iTCP:'+identity.expectedPort,'-sTCP:LISTEN','-Fpn'])).stdout;assert(run.listener.split('\n').includes('p'+child.pid));
 await write('151-restart-launch.json',run);await connect(identity.newApp);console.log(JSON.stringify({stage:'SIGNED151_READY',main:child.pid,host:run.ready.pid}));
}
function stable(value){const v=structuredClone(value);delete v.phase;delete v.syntheticAuth.accountsProviderCalls;delete v.syntheticAuth.sessionProviderCalls;delete v.themeExtension.isActive;return v;}
async function themeDisabled(){
 const old=await readJSON(path.join(evidence,'verified-theme-disabled-before.json'));assert.equal(old.status,'ACTUAL_THEME_AND_DISABLED_RENDERER_BEFORE_PASS');
 assert.equal(hash(await fs.readFile(old.themeFile.path)),old.themeFile.sha256);
 // Opening the existing fixture provides a renderer surface, not evidence that an old tab restored.
 const surface=await request('open-theme-surface',{},'terminal151-');
 const themeProbe=`(() => {const w=document.querySelector('.monaco-workbench'),e=document.querySelector('.part.editor .monaco-editor'),s=w&&getComputedStyle(w);return {classes:w?.className,editorBackground:e&&getComputedStyle(e).backgroundColor,colors:Object.fromEntries(${JSON.stringify(Object.keys(old.theme.colors))}.map(k=>[k,s?.getPropertyValue('--vscode-'+k.replaceAll('.','-')).trim()]))};})()`;
 const theme=await until(async()=>{const t=await evaluate(themeProbe);return t.editorBackground?t:false;},'Existing fixture actual Monaco editor DOM not visible');
 const cls='zhuangtongfa-material-theme-themes-OneDark-Pro-json';assert(theme.classes?.split(' ').includes(cls));for(const [k,v]of Object.entries(old.theme.colors))assert.equal(theme.colors[k]?.toLowerCase(),v.toLowerCase(),k);assert.equal(theme.editorBackground,old.theme.editorBackground);await screen('151-actual-theme');
 await request('command',{command:'workbench.extensions.search',args:['@disabled lean-disabled-final']});
 const disabled=await until(async()=>{const d=await evaluate(`(() => {const v=document.querySelector('.extensions-viewlet');return {query:v?.querySelector('.extensions-search-container [data-uri="extensions:searchinput"] .view-lines')?.innerText.replaceAll(String.fromCharCode(160),' ').trim(),rows:[...(v?.querySelectorAll('.monaco-list-row')??[])].map(r=>({id:r.getAttribute('data-extension-id'),label:r.getAttribute('aria-label'),text:r.innerText}))};})()`);return d.query==='@disabled lean-disabled-final'&&d.rows.length?d:false;},'Disabled extensions query/actual result missing');
 assert.equal(disabled.rows.length,1);assert.equal(disabled.rows[0].id,'lean-tests.lean-disabled-final');assert(disabled.rows[0].label.includes('Synthetic disabled extension persistence sentinel'));await screen('151-disabled-renderer');await write('151-theme-disabled.json',{theme,disabled,surface,themeFile:old.themeFile,onlyReadThemeAndEnablement:true});return {theme,disabled,surface};
}
const keyProbe=`(() => {const e=document.querySelector('.keybindings-editor');return {present:!!e,search:e?.querySelector('.keybindings-header .search-container input')?.value,rows:[...(e?.querySelectorAll('.monaco-list-row')??[])].map(x=>({text:x.innerText,aria:x.querySelector('.command')?.getAttribute('aria-label'),id:x.querySelector('.command-id')?.textContent}))};})()`;
async function shortcuts(){const provenance=await readJSON(path.join(root,'retired-provenance149.json'));const retired=new Set(provenance.candidateIDs.command.filter(id=>!provenance.ordinaryReferencedIDExceptions.includes(id)));const patterns=provenance.dynamicRows.filter(r=>r.classification==='dynamic command family'&&r.idPattern).map(r=>new RegExp(r.idPattern));
 const queries=['@command:editor.action.clipboardCopyAction','chat','mcp','speech','dictation','integrated browser','simple browser','agent sessions','playwright','@command:simpleBrowser.show','@command:workbench.action.browser.goBack','@command:workbench.action.chat.acceptTool','@command:workbench.action.agentSessions.newBrowserTab'];
 for(const query of queries){await request('command',{command:'workbench.action.openGlobalKeybindings',args:[query]});await until(async()=>{const d=await evaluate(keyProbe);return d.present&&d.search===query?d:false;},'Public keybindings query did not appear');await sleep(400);const dom=await evaluate(keyProbe);assert.equal(dom.search,query);const ids=dom.rows.map(r=>r.id?.trim()||r.aria?.match(/\(([^()]*)\)$/)?.[1]||r.aria);
 if(query==='@command:editor.action.clipboardCopyAction')assert(ids.includes('editor.action.clipboardCopyAction'));else{for(const id of ids){assert(id,'Actual row command id absent');assert(!retired.has(id)&&!patterns.some(p=>p.test(id)),'Retired row: '+id);}if(query.startsWith('@command:'))assert.equal(ids.length,0);}
 const index=result.queries.length;result.queries.push({query,ids,dom,retiredMatches:0});await write('151-keys-'+index+'.json',result.queries.at(-1));await screen('151-keys-'+index);
 }}
async function registry151(){const out=path.join(evidence,'registry151-'+randomUUID());assert.equal(hash(await fs.readFile(identity.registryHelper)),identity.registryHelperSHA256);await exec(identity.node,[identity.registryHelper,'--endpoint','http://127.0.0.1:'+identity.expectedPort+'/json/list','--output',out,'--expected-app',identity.newApp,'--pid',String(newRun.run.pid),'--profile-root',identity.expectedProfile,'--expected-port',String(identity.expectedPort)],{maxBuffer:2*1024*1024,timeout:90000});
 const actualIdentity=await readJSON(path.join(out,'identity.json'));assert.equal(actualIdentity.loadedSHA256,identity.newWorkbenchSHA256);assert.equal(actualIdentity.diskSHA256,identity.newWorkbenchSHA256);assert.equal(actualIdentity.cachedImportNewModuleCount,0);
 const registries=await readJSON(path.join(out,'registries.json'));const entry=registries.settings.find(s=>s.id==='terminal.integrated.commandsToSkipShell');assert(entry);assert.equal(entry.schema.markdownDescription,identity.expectedSchema.markdownDescription);assert.deepEqual(entry.schema.default,[]);assert.deepEqual(entry.schema.items,identity.expectedSchema.items);assert.equal(entry.schema.type,identity.expectedSchema.type);
 for(const id of identity.retiredSkipCommands)assert(!entry.schema.markdownDescription.includes('- '+id+'\n')&&!entry.schema.markdownDescription.endsWith('- '+id),'Retired skip-shell default persisted: '+id);
 const commands=new Set(registries.commands.map(c=>c.id));for(const id of ['workbench.action.quickOpen','workbench.action.nextEditor','workbench.action.terminal.copySelection','workbench.action.terminal.paste','workbench.action.terminal.new','workbench.action.tasks.runTask','editor.action.accessibilityHelp','workbench.action.terminal.focusAccessibleBuffer'])assert(commands.has(id),'Ordinary runtime command absent: '+id);
 result.registry={output:out,workbenchIdentityVerified:true,schemaTextSameAsReal151Source:true,retiredSkipStringCount:0,otherRetiredEntitiesReview:'PENDING_ROOT_REVIEW'};await write('151-skip-schema.json',{actual:entry.schema,source:identity.schemaSource,sourceSHA256:identity.schemaSourceSHA256,terminalSource:identity.terminalSource,terminalSourceSHA256:identity.terminalSourceSHA256,result:result.registry});
}
async function liveSkipSet(){
 const context=await rootContext(),wire=client.wire,events=[];const listener=event=>{if(event.sessionId===context.sessionId)events.push(event);};wire.listeners.add(listener);
 const send=(method,params={})=>wire.send(method,params,context.sessionId);const props=object=>send('Runtime.getProperties',{objectId:object.objectId,ownProperties:true});
 try{await send('Debugger.enable');const mains=events.filter(e=>e.method==='Debugger.scriptParsed'&&e.params.isModule&&e.params.url.endsWith('/vs/workbench/workbench.desktop.main.js'));assert.equal(mains.length,1);const script=mains[0].params;const source=(await send('Debugger.getScriptSource',{scriptId:script.scriptId})).scriptSource;assert.equal(hash(source),identity.newWorkbenchSHA256);
 const offset=source.indexOf('this._skipTerminalCommands=new Set(');assert(offset>0);const owners=[...source.slice(Math.max(0,offset-1600),offset).matchAll(/([A-Za-z_$][\w$]*)=class\b/g)];assert(owners.length);const bindingName=owners.at(-1)[1];const eventBefore=events.length;
 const imported=await send('Runtime.evaluate',{expression:`import(${JSON.stringify(script.url)}).then(module=>module.main)`,awaitPromise:true,returnByValue:false,objectGroup:'terminal151-readonly'});assert(!imported.exceptionDetails&&imported.result.type==='function');assert.equal(events.slice(eventBefore).filter(e=>e.method==='Debugger.scriptParsed'&&e.params.isModule).length,0);
 const fun=await props(imported.result),scopes=fun.internalProperties.find(p=>p.name==='[[Scopes]]')?.value;assert(scopes);const rows=await props(scopes),module=rows.result.find(p=>p.value?.description==='Module')?.value;assert(module);const bindings=await props(module),constructor=bindings.result.find(p=>p.name===bindingName)?.value;assert(constructor?.objectId);const ctorProps=await props(constructor),prototype=ctorProps.result.find(p=>p.name==='prototype')?.value;assert(prototype?.objectId);
 const objects=(await send('Runtime.queryObjects',{prototypeObjectId:prototype.objectId,objectGroup:'terminal151-readonly'})).objects;
 const raw=await send('Runtime.callFunctionOn',{objectId:objects.objectId,functionDeclaration:`function(ids){return [...this].map(instance=>{if(!(instance._skipTerminalCommands instanceof Set)||typeof instance.shouldCommandSkipShell!=='function')throw Error('Existing TerminalConfigurationService shape mismatch');return {set:[...instance._skipTerminalCommands].sort(),configured:instance._config?.commandsToSkipShell??[],answers:Object.fromEntries(ids.map(id=>[id,instance.shouldCommandSkipShell(id)]))};});}`,arguments:[{value:[...identity.expectedSkipCommands,...identity.retiredSkipCommands]}],returnByValue:true,objectGroup:'terminal151-readonly'});assert(!raw.exceptionDetails);const instances=raw.result.value;assert(instances.length>0,'No actual terminal configuration instance');
 for(const instance of instances){const expected=new Set(identity.expectedSkipCommands);for(const id of instance.configured)id.startsWith('-')?expected.delete(id.slice(1)):expected.add(id);assert.deepEqual(instance.set,[...expected].sort());for(const [id,value]of Object.entries(instance.answers))assert.equal(value,expected.has(id));}
 const snapshot={status:'PASS',loadedHash:hash(source),bindingName,instances,actualRuntimeInstancesOnly:true,noStandaloneSourceImport:true,noDIInstantiation:true};await write('151-live-terminal-skip-set.json',snapshot);return snapshot;
 }finally{wire.listeners.delete(listener);await send('Runtime.releaseObjectGroup',{objectGroup:'terminal151-readonly'}).catch(()=>{});}
}
async function quit151(){if(!newRun)return;if(newRun.child.exitCode===null){await closeCdp();await fs.writeFile(path.join(root,'request.json'),JSON.stringify({id:randomUUID(),action:'quit'}));}
 const exit=await Promise.race([newRun.exited,sleep(25000).then(()=>{throw Error('Own151 normal Quit timed out; no force kill');})]);assert.deepEqual({code:exit.code,signal:exit.signal},{code:0,signal:null});await write('151-restart-launch.json',newRun.run);await freeze(identity.newFiles);assert.equal(hash(await fs.readFile(identity.newWorkbenchPath)),identity.newWorkbenchSHA256);return exit;
}
try{
 result.guard150=await guard150();const preflight=await nativeMenu(identity.oldMainPID,'151-preflight');result.menu150=preflight.check;
 if(!preflight.check.complete){result.status='WAIT_KEEP_APPLICATION_OPEN';console.log(JSON.stringify({status:result.status,reason:preflight.check.errors,main:identity.oldMainPID}));}
 else if(mode==='--preflight'){result.status='PREFLIGHT_COMPLETE_KEEP_APPLICATION_OPEN';console.log(JSON.stringify({status:result.status,main:identity.oldMainPID,nodeCount:preflight.check.nodeCount}));}
 else{
  await freeze(identity.newFiles);assert.equal(hash(await fs.readFile(identity.schemaSource)),identity.schemaSourceSHA256);assert.equal(hash(await fs.readFile(identity.terminalSource)),identity.terminalSourceSHA256);
  await connect(identity.oldApp);result.tabsBefore150=await request('tabs');await write('151-tabs-before150.json',{tabs:result.tabsBefore150,readonly:true});result.welcome150=await welcomeTitlebar('150-handoff');await handoff150();console.log(JSON.stringify({stage:'150_HANDOFF_NORMAL_EXIT_CONFIRMED'}));await launch151();
  result.tabsAfter151=await request('tabs');await write('151-tabs-after151.json',{tabs:result.tabsAfter151,readonly:true,before:result.tabsBefore150,strictEqual:JSON.stringify(result.tabsAfter151)===JSON.stringify(result.tabsBefore150),fullPreviewStickyRestoreGate:'Historical restore150 evidence; this controller only observes current tabs'});
  const prior=await readJSON(path.join(evidence,'active-probe-summary.json'));assert.equal(prior.status,'BEFORE_QUIT_PUBLIC_CHECKS_PASS');result.after=await request('persistence-status',{phase:'after'});assert(result.after.syntheticAuth.accountsProviderCalls>0&&result.after.syntheticAuth.sessionProviderCalls>0);assert.deepEqual(stable(result.after),stable(prior.before));
  result.themeDisabled=await themeDisabled();result.welcome151=await welcomeTitlebar('151');const menu151=await nativeMenu(newRun.run.pid,'151');assert(menu151.check.complete,JSON.stringify(menu151.check.errors));result.menu151=menu151.check;await shortcuts();await registry151();
  result.terminalControls=await request('controls',{},'terminal151-');result.terminal=await request('terminal',{},'terminal151-');result.task=await request('task',{},'terminal151-');await request('show-terminal',{},'terminal151-');
  result.xtermDOM=await until(async()=>{const d=await evaluate(`(() => ({terminals:[...document.querySelectorAll('.terminal .xterm')].map(e=>({className:e.className,rows:e.querySelector('.xterm-rows')?.innerText,accessibleText:e.querySelector('.xterm-accessibility')?.innerText,canvasCount:e.querySelectorAll('canvas').length,rect:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}))}))()`);return d.terminals.some(t=>t.rect.width>100&&t.rect.height>20)?d:false;},'Actual xterm DOM not visible');await write('151-xterm-dom.json',result.xtermDOM);await screen('151-real-terminal');result.liveSkipSet=await liveSkipSet();
  await freeze(identity.newFiles);result.exit151=await quit151();const audit=await exec('/usr/bin/python3',[path.join(root,'persistence-audit.py'),'restart'],{maxBuffer:1024*1024});await write('151-restart-preservation.json',{exit:0,stdout:audit.stdout,stderr:audit.stderr});
  result.status='PASS_GUI_PERSISTENCE_TERMINAL_SUBSET_FULL_REGISTRY_AND_VISUAL_REVIEW_PENDING';console.log(JSON.stringify({status:result.status,main:newRun.run.pid,host:newRun.run.ready.pid,exit:result.exit151}));
 }
}catch(error){result.status=handoffStarted?'FAIL_HANDOFF_OR_151_RUNTIME':'FAIL_KEEP_150_APPLICATION_OPEN';result.error=error.stack;process.exitCode=1;console.log(JSON.stringify({status:result.status,error:result.error}));if(client)await write('standby151-failure-dom.json',await evaluate(keyProbe).catch(e=>({captureError:e.message})));}
finally{
 await closeCdp().catch(error=>{result.cdpCloseError=error.stack;});
 // Never quit the pre-existing150 window here. Only a child spawned by this controller is owned.
 if(newRun&&newRun.child.exitCode===null)try{result.failureCleanupExit151=await quit151();}catch(error){result.cleanupError=error.stack;process.exitCode=1;}
 result.finishedAt=new Date().toISOString();await write(mode==='--preflight'?'standby151-preflight.json':'standby151-summary.json',result);
}
