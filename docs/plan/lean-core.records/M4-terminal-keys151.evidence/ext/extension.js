const vscode=require('vscode'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
exports.activate=async context=>{
 const root=process.env.LEAN_KEYS_ROOT,workspace=vscode.workspace.workspaceFolders[0].uri.fsPath;assert.equal(workspace,path.join(root,'w'));let term,counter=0,previous,busy=false;
 const write=async(name,data)=>{await fs.writeFile(path.join(root,name+'.tmp'),JSON.stringify(data));await fs.rename(path.join(root,name+'.tmp'),path.join(root,name));};
 context.subscriptions.push(vscode.commands.registerCommand('lean-tests.terminalKeys.thirdParty',async()=>{counter++;await write('third-party.json',{counter});}));
 const config=vscode.workspace.getConfiguration('terminal.integrated'),original=config.inspect('commandsToSkipShell').globalValue;
 async function handle(q){
  if(q.action==='quit')return vscode.commands.executeCommand('workbench.action.quit');
  if(q.action==='config'){await config.update('commandsToSkipShell',q.value,vscode.ConfigurationTarget.Global);return {value:config.get('commandsToSkipShell')};}
  if(q.action==='restore'){if(term)term.dispose();await config.update('commandsToSkipShell',original,vscode.ConfigurationTarget.Global);return {restored:true,original,counter};}
  if(q.action==='command')return vscode.commands.executeCommand(q.command);
  if(q.action==='counter')return {counter};
  if(q.action==='collector'){
   if(term)term.dispose();term=vscode.window.createTerminal({name:'Keys '+q.id,shellPath:'/bin/sh',shellArgs:['-f'],cwd:workspace});term.show();
   const ready=path.join(workspace,'ready-'+q.id),input=path.join(workspace,'input-'+q.id);
   term.sendText('stty -echo -icanon min 1 time 0; printf ready > '+quote(ready)+'; dd bs=1 count=1 of='+quote(input)+' 2>/dev/null; stty sane');
   const deadline=Date.now()+15000;while(Date.now()<deadline){try{if(await fs.readFile(ready,'utf8')==='ready')return {ready,input,shellPID:await term.processId,terminalName:term.name,counter};}catch(e){if(e.code!=='ENOENT')throw e;}await sleep(100);}throw Error('Collector shell did not become ready');
  }
  throw Error('Unknown action '+q.action);
 }
 const timer=setInterval(async()=>{if(busy)return;let q;try{q=JSON.parse(await fs.readFile(root+'/request.json','utf8'));}catch(e){if(e.code==='ENOENT'||e instanceof SyntaxError)return;throw e;}if(q.id===previous)return;previous=q.id;busy=true;try{await write('response.json',{id:q.id,status:'PASS',result:await handle(q)});}catch(e){await write('response.json',{id:q.id,status:'FAIL',error:e.stack});}finally{busy=false;}},100);
 context.subscriptions.push({dispose:()=>clearInterval(timer)});await write('ready.json',{pid:process.pid,parentPID:process.ppid,extensionId:context.extension.id});
};
