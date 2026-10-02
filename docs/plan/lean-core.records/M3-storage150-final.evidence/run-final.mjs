import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { WebviewCdp, FixtureClient } from './ext/webview-cdp.mjs';
const exec = promisify(execFile), root = import.meta.dirname, evidence = path.join(root, 'evidence');
const identity = JSON.parse(await fs.readFile(path.join(root, '../identity.json'), 'utf8'));
const app = identity.app, endpoint = 'http://127.0.0.1:19570', host = new FixtureClient(root);
const pause = ms => new Promise(r => setTimeout(r, ms));
const write = (name, obj) => fs.writeFile(path.join(evidence, name), JSON.stringify(obj, null, 2) + '\n');
const result = { status: 'RUNNING', app, root, runs: [], reusedProfile: true, clipboard: {} };
let current, client, clipboardSaved = false;
const clip = path.join(root, 'clipboard-snapshot'), backup = path.join(root, 'clipboard.private.json');
const raw = JSON.parse(await fs.readFile(path.join(root, 'ext/mermaid-cases.json'), 'utf8')).cases.find(c => c.id === 'flowchart').source;
async function freeze() { for (const f of identity.files) assert.equal(createHash('sha256').update(await fs.readFile(f.path)).digest('hex'), f.sha256); }
async function launch(label) {
  await freeze(); await host.clearPending(); await fs.rm(path.join(root, 'ready.json'), { force: true });
  const args = ['--user-data-dir',path.join(root,'u'),'--extensions-dir',path.join(root,'e'),'--shared-data-dir',path.join(root,'s'),'--extensionDevelopmentPath',path.join(root,'ext'),'--remote-debugging-port=19570','--skip-welcome','--skip-release-notes','--disable-workspace-trust','--new-window',path.join(root,'w')];
  const env = {...process.env, LEAN_MERMAID_ROOT:root};
  for(const key of ['ELECTRON_RUN_AS_NODE','VSCODE_DEV','VSCODE_PID','VSCODE_CWD','VSCODE_IPC_HOOK_CLI'])delete env[key];
  const log = await fs.open(path.join(evidence,label+'-app.log'),'w');
  const child=spawn(path.join(app,'Contents/MacOS/VSLight'),args,{env,stdio:['ignore',log.fd,log.fd]});await log.close();
  const run={label,pid:child.pid,args,at:new Date().toISOString()};result.runs.push(run);
  const exited=new Promise((res,rej)=>{child.once('error',rej);child.once('exit',(code,signal)=>{run.exit={code,signal,at:new Date().toISOString()};res(run.exit);});});
  current={child,run,exited};
  for(let i=0;i<450;i++){
    assert.equal(child.exitCode,null,'App quit before ready');
    try {const r=JSON.parse(await fs.readFile(path.join(root,'ready.json'),'utf8'));if(r.hostPid){run.ready=r;break;}}catch{}
    await pause(100);
  }
  assert.ok(run.ready,'Fixture host not ready');
  assert.equal(await fs.realpath(run.ready.mermaidExtensionPath),path.join(app,'Contents/Resources/app/extensions/mermaid-markdown-features'));
  const authority = await exec('ps',['-p',String(run.pid),'-o','pid=,ppid=,command=']);
  assert.ok(authority.stdout.includes(app+'/Contents/MacOS/VSLight'));assert.ok(authority.stdout.includes(path.join(root,'u')));
  const listener=await exec('/usr/sbin/lsof',['-nP','-a','-p',String(run.pid),'-iTCP:19570','-sTCP:LISTEN','-Fpn']);assert.ok(listener.stdout.includes('p'+run.pid));
  run.authority=authority.stdout;run.listener=listener.stdout;await write(label+'-launch.json',run);
  client=await WebviewCdp.connect(endpoint,{expectedApp:app});
  console.log(JSON.stringify({stage:'READY',label,pid:run.pid,host:run.ready.hostPid}));
}
async function quit(){
  if(client){await client.close();client=undefined;}
  if(!current||current.child.exitCode!==null)return;
  await fs.writeFile(path.join(root,'request.json'),JSON.stringify({id:randomUUID(),action:'quit'}));
  const end=await Promise.race([current.exited,pause(20000).then(()=>{throw Error('Normal quit timeout');})]);
  assert.deepEqual({code:end.code,signal:end.signal},{code:0,signal:null});
  await write(current.run.label+'-launch.json',current.run);await host.clearPending();await freeze();
  console.log(JSON.stringify({stage:'QUIT',pid:current.run.pid,exit:end}));
}
async function snapshots(label,id){
  await host.request('reveal-first');
  await client.waitForMermaid({caseId:'flowchart',theme:'dark',surface:'standalone-editor',webviewId:id});
  await host.request('standalone-editor',{caseId:'flowchart',mermaidWebviewId:id});
  const editor=await client.snapshot({caseId:'flowchart',theme:'dark',surface:'standalone-editor',webviewId:id},{screenshot:path.join(evidence,label+'-editor.png')});
  assert.equal(editor.status,'DOM_CHECK_PASS');
  const checks=[];
  for(const route of ['id','active']){
    const response=await host.request('copy-source',{caseId:'flowchart',...(route==='id'?{mermaidWebviewId:id}:{})});
    assert.equal(response.result.copiedSource,raw,'Untrimmed raw source differs');checks.push({route,response,exact:true});
  }
  await host.request('preview-existing');
  const preview=await client.snapshot({caseId:'flowchart',theme:'dark',surface:'markdown-preview'},{screenshot:path.join(evidence,label+'-preview.png')});assert.equal(preview.status,'DOM_CHECK_PASS');
  const tabs=(await host.request('status')).result.tabs;
  await write(label+'-snapshot.json',{editor,preview,tabs,exactSource:checks});
  return {editor,preview,tabs,exactSource:checks};
}
try {
  await fs.writeFile(backup,'',{mode:0o600,flag:'wx'});await exec(clip,['save',backup]);clipboardSaved=true;
  await launch('cold');
  // Keep the source file content immutable; only show its existing preview.
  await host.request('preview-existing');
  const sourceBefore=await fs.readFile(path.join(root,'flowchart.md'),'utf8');
  await host.request('standalone-editor',{caseId:'flowchart',mermaidWebviewId:'165d2776'});
  const before=await snapshots('before','165d2776');
  assert.equal(before.editor.dom.mermaidWebviewId,'165d2776');assert.deepEqual(before.editor.transformNumbers,{scale:1.25,x:429.75,y:225});
  await quit();
  await exec('/usr/bin/python3',[path.join(root,'persisted.py'),'cold']);
  await launch('restart');
  assert.notEqual(result.runs[0].pid,result.runs[1].pid);assert.notEqual(result.runs[0].ready.hostPid,result.runs[1].ready.hostPid);
  const restoredTabs=(await host.request('status')).result.tabs;
  assert.deepEqual(restoredTabs,before.tabs,'Automatic restored public tabs differ');
  const after=await snapshots('after','165d2776');
  for(const field of ['theme','mermaidWebviewId','text'])assert.equal(after.editor.dom[field],before.editor.dom[field],field);
  assert.deepEqual(after.editor.transformNumbers,before.editor.transformNumbers);
  assert.equal(after.preview.dom.theme,before.preview.dom.theme);assert.equal(after.preview.dom.text,before.preview.dom.text);
  assert.equal(await fs.readFile(path.join(root,'flowchart.md'),'utf8'),sourceBefore);
  await quit();await exec('/usr/bin/python3',[path.join(root,'persisted.py'),'restart']);
  const a=JSON.parse(await fs.readFile(path.join(evidence,'cold-sqlite.json'),'utf8')),b=JSON.parse(await fs.readFile(path.join(evidence,'restart-sqlite.json'),'utf8'));
  assert.deepEqual(a.editors,b.editors,'Exact serialized editors differ');assert.deepEqual(a.sentinels,b.sentinels);
  result.status='PASS_VISUAL_REVIEW_PENDING';result.publicTabsExact=true;result.rawSourceExact=true;result.idExact=true;result.themeExact=true;result.numericPanZoomExact=true;result.serializedEditorStateExact=true;result.historyCredentialsSentinelsExact=true;
} catch(e) {if(client)await write('failure-contexts.json',{contexts:await client.contextsWithDom(),diagnostics:client.diagnostics});result.status='FAIL';result.error=e.stack;console.log(result.error);process.exitCode=1;}
finally {
  try{await quit();}catch(e){result.cleanupError=e.stack;process.exitCode=1;}
  if(clipboardSaved){try{await exec(clip,['restore',backup]);result.clipboard.restored=true;await fs.rm(backup);result.clipboard.backupDeleted=true;}catch(e){result.clipboard.error=e.message;process.exitCode=1;}}
  await write('summary.json',result);console.log(JSON.stringify(result));
}
