'use strict';
const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
async function until(check, label) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) { const value = await check(); if (value) return value; await sleep(100); }
  throw new Error(label);
}
exports.activate = async context => {
  const root = process.env.LEAN_ORDINARY_ROOT;
  assert.equal(root, '/private/tmp/lcfinal-chkarkup/ui');
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  assert.equal(workspace, path.join(root, 'w'));
  const write = async (name, value) => { const temporary=path.join(root,name+'.tmp'); await fs.writeFile(temporary,JSON.stringify(value)); await fs.rename(temporary,path.join(root,name)); };
  const terminals = [];
  const handle = async request => {
    assert.match(request.id, /^[a-zA-Z0-9-]+$/);
    const controls = ['workbench.action.quickOpen','workbench.action.nextEditor','workbench.action.terminal.copySelection','workbench.action.terminal.paste','workbench.action.terminal.new','workbench.action.tasks.runTask','editor.action.accessibilityHelp','workbench.action.terminal.focusAccessibleBuffer','workbench.action.terminal.selectAll'];
    if (request.action === 'controls') {
      const commands = new Set(await vscode.commands.getCommands(true));
      const availability = Object.fromEntries(controls.map(id => [id, commands.has(id)]));
      for (const [id, available] of Object.entries(availability)) assert(available, 'Ordinary control absent: '+id);
      return { status:'PASS', extensionId:context.extension.id, availability, clipboardTouched:false, noGlobalStateOrAuthWrites:true };
    }
    if (request.action === 'open-theme-surface') {
      const file=path.join(workspace,'content-proof.txt');
      const before=await fs.readFile(file), digest=value=>createHash('sha256').update(value).digest('hex');
      const document=await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      const editor=await vscode.window.showTextDocument(document,{preview:true,preserveFocus:false});
      assert.equal(editor.document.uri.fsPath,file);assert.equal(document.isDirty,false);
      assert.equal(digest(await fs.readFile(file)),digest(before));
      return {status:'PASS',file,sha256:digest(before),languageId:document.languageId,publicTextDocumentAndEditorAPIs:true,reopenedForThemeSurfaceOnly:true,notTabRestoreEvidence:true,noGlobalStateOrAuthWrites:true};
    }
    if (request.action === 'terminal') {
      const marker='TERMINAL151_'+request.id, file=path.join(workspace,'terminal151-shell-'+request.id+'.txt');
      const terminal=vscode.window.createTerminal({name:'terminal151-'+request.id,shellPath:'/bin/sh',shellArgs:['-f'],cwd:workspace});
      terminals.push(terminal); terminal.show();
      terminal.sendText("printf '%s\\n' "+quote(marker)+' > '+quote(file)+"; printf '%s\\n' "+quote(marker));
      await until(async()=>{try{return (await fs.readFile(file,'utf8'))===marker+'\n';}catch(error){if(error.code==='ENOENT')return false;throw error;}},'Real /bin/sh terminal did not write exact marker');
      const pid=await terminal.processId; assert(Number.isInteger(pid)&&pid>0);
      return {status:'PASS',extensionId:context.extension.id,file,marker,bytes:Buffer.byteLength(marker+'\n'),terminalName:terminal.name,shellPID:pid,terminalRetainedForDOM:true,clipboardTouched:false};
    }
    if (request.action === 'task') {
      const marker='TASK151_'+request.id, file=path.join(workspace,'terminal151-task-'+request.id+'.txt');
      const ended=[]; const processEnded=[];
      const endSub=vscode.tasks.onDidEndTask(event=>ended.push(event.execution));
      const processSub=vscode.tasks.onDidEndTaskProcess(event=>processEnded.push({execution:event.execution,exitCode:event.exitCode}));
      let execution;
      try {
        const task=new vscode.Task({type:'shell'},vscode.TaskScope.Workspace,'terminal151-task-'+request.id,'lean-terminal151',new vscode.ShellExecution("printf '%s\\n' "+quote(marker)+' > '+quote(file)+'; while :; do sleep 1; done',{executable:'/bin/sh',shellArgs:['-f','-c'],cwd:workspace}));
        execution=await vscode.tasks.executeTask(task);
        await until(async()=>{try{return (await fs.readFile(file,'utf8'))===marker+'\n';}catch(error){if(error.code==='ENOENT')return false;throw error;}},'Real long-running task did not write exact marker');
        assert(vscode.tasks.taskExecutions.includes(execution),'Long task ended before explicit terminate');
        execution.terminate();
        await until(()=>ended.includes(execution),'Real task end event absent after terminate');
        await until(()=>!vscode.tasks.taskExecutions.includes(execution),'Task execution still active after end');
        return {status:'PASS',extensionId:context.extension.id,file,marker,taskName:task.name,terminateRequested:true,actualEndEvent:true,stillActive:false,processEndObserved:processEnded.some(e=>e.execution===execution),clipboardTouched:false};
      } finally {
        if(execution&&vscode.tasks.taskExecutions.includes(execution))execution.terminate();
        endSub.dispose();processSub.dispose();
      }
    }
    if(request.action==='show-terminal') { assert(terminals.length,'No retained terminal');terminals[0].show();return {status:'PASS',name:terminals[0].name}; }
    throw new Error('Unknown terminal151 action: '+request.action);
  };
  let previous, busy=false;
  const timer=setInterval(async()=>{
    if(busy)return;let request;
    try{request=JSON.parse(await fs.readFile(path.join(root,'terminal151-request.json'),'utf8'));}catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return;throw error;}
    if(request.id===previous)return;previous=request.id;busy=true;
    try{await write('terminal151-response.json',{id:request.id,action:request.action,status:'PASS',result:await handle(request)});}catch(error){await write('terminal151-response.json',{id:request.id,action:request.action,status:'FAIL',error:error.stack});}finally{busy=false;}
  },100);
  context.subscriptions.push({dispose:()=>clearInterval(timer)});
  await write('terminal151-ready.json',{pid:process.pid,parentPID:process.ppid,root,extensionId:context.extension.id,noGlobalStateOrAuthWrites:true});
};
