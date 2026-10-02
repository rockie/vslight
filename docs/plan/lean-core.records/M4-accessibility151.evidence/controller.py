import subprocess,pathlib,json,os,time,hashlib,datetime,uuid
r=pathlib.Path('/private/tmp/av151-4dvltjmt');app=pathlib.Path('/Users/rockie/Documents/gh-xgent/lean-core151-local-7_g5sxxp/VSLight.app').resolve()
hash=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def put(n,v):(r/n).write_text(json.dumps(v,ensure_ascii=False,indent=2))
for source,name in [('window-state.swift','window-state'),('activate.swift','activate')]:
 cp=subprocess.run(['/usr/bin/swiftc',str(r/source),'-o',str(r/name)],capture_output=True,text=True);put(name+'-compile.json',{'exit':cp.returncode,'stdout':cp.stdout,'stderr':cp.stderr});assert cp.returncode==0
args=[str(app/'Contents/MacOS/VSLight'),'--user-data-dir',str(r/'u'),'--extensions-dir',str(r/'e'),'--extensionDevelopmentPath',str(r/'ext'),'--remote-debugging-port=19540','--skip-welcome','--skip-release-notes','--disable-workspace-trust',str(r/'w')]
env=os.environ.copy();env['LEAN_ACCESSIBILITY_ROOT']=str(r)
for key in ['ELECTRON_RUN_AS_NODE','VSCODE_DEV','VSCODE_PID','VSCODE_CWD','VSCODE_IPC_HOOK_CLI']:env.pop(key,None)
identity={str(p.relative_to(app)):hash(p) for p in [app/'Contents/MacOS/VSLight',app/'Contents/Resources/app/out/main.js',app/'Contents/Resources/app/out/vs/code/electron-utility/sharedProcess/sharedProcessMain.js',app/'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js']}
put('app-before.json',identity)
log=(r/'launch.log').open('w');child=subprocess.Popen(args,env=env,stdout=log,stderr=subprocess.STDOUT)
put('controller-live.json',{'controllerPID':os.getpid(),'mainPID':child.pid,'args':args,'holdsActualChildPopen':True})
print(json.dumps({'event':'CHILD_STARTED','pid':child.pid}),flush=True)
try:
 end=time.time()+50
 while time.time()<end:
  assert child.poll() is None,'Own app exited before ready'
  try:
   ready=json.loads((r/'ready.json').read_text())
   if ready['parentPid']==child.pid:break
  except (FileNotFoundError,json.JSONDecodeError):pass
  time.sleep(.1)
 else:raise RuntimeError('Own fixture did not become ready')
 launch={'root':str(r),'app':str(app),'pid':child.pid,'hostPID':ready['hostPid'],'profile':str(r/'u'),'port':19540,'fixtureSHA256':hash(r/'ext/accessibility.js'),'expectedWorkbenchSHA256':hash(app/'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js'),'sourceGeneration':'151','startedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'controllerPID':os.getpid(),'args':args}
 put('launch.json',launch)
 cp=subprocess.run([str(r/'activate'),str(child.pid),str(app)],capture_output=True,text=True);put('activation.json',{'exit':cp.returncode,'stdout':cp.stdout,'stderr':cp.stderr});assert cp.returncode==0
 time.sleep(.7)
 with (r/'driver.log').open('w') as out:cp=subprocess.run(['node',str(r/'capture-driver.mjs')],stdout=out,stderr=subprocess.STDOUT)
 put('driver-exit.json',{'exit':cp.returncode});print(json.dumps({'event':'DRIVER_FINISHED','exit':cp.returncode}),flush=True)
finally:
 request={'id':str(uuid.uuid4()),'action':'quit'};put('quit-request.json',request)
 tmp=r/'quit.tmp';tmp.write_text(json.dumps(request));tmp.replace(r/'request.json')
 try:
  code=child.wait(timeout=40);put('process-exit.json',{'exit':code,'forced':False,'controllerPID':os.getpid(),'mainPID':child.pid,'actualPopenWait':True});print(json.dumps({'event':'NORMAL_WAIT_EXIT','exit':code}),flush=True)
 except subprocess.TimeoutExpired:
  put('process-exit.json',{'exit':None,'forced':False,'mainPID':child.pid,'normalQuitTimedOut':True});print('QUIT_TIMEOUT_APP_REMAINS',flush=True)
 log.close()
 put('app-after.json',{str(p.relative_to(app)):hash(p) for p in [app/rel for rel in identity]})
