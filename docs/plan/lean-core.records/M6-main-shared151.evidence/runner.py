import pathlib,json,subprocess,time,datetime,uuid,shutil,os,sys
ROOT=pathlib.Path(__file__).parent; PREP=json.loads((ROOT/'prepare.json').read_text()); APP=pathlib.Path(PREP['app']);REPO=pathlib.Path('/Users/rockie/Documents/gh-xgent/vscodium');EVIDENCE=pathlib.Path(PREP['evidence']);CHILD=None
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
def write(name,data): (ROOT/name).write_text(json.dumps(data,indent=2)+'\n')
def emit(message):print(message,flush=True)
def wait_until(fn,seconds=60):
 end=time.monotonic()+seconds
 while time.monotonic()<end:
  v=fn()
  if v:return v
  if CHILD.poll() is not None:raise RuntimeError('Owned app exited before expected readiness')
  time.sleep(.2)
 raise RuntimeError('Readiness timed out')
def ready(exclude=None):
 for p in ROOT.glob('ready-*.json'):
  d=json.loads(p.read_text())
  if d['hostPID']!=exclude:
   try:os.kill(d['hostPID'],0)
   except ProcessLookupError:continue
   return d
 return None
def listener(port):
 r=subprocess.run(['/usr/sbin/lsof','-nP',f'-iTCP:{port}','-sTCP:LISTEN','-Fp'],capture_output=True,text=True)
 p=[int(x[1:]) for x in r.stdout.splitlines() if x.startswith('p')]
 return p[0] if len(set(p))==1 else None
def capture(stage,role):
 port=19551 if role=='main' else 19552;pid=CHILD.pid if role=='main' else wait_until(lambda:listener(port));out=ROOT/'captures'/f'{stage}-{role}151';args=['node',str(REPO/'dev/test-fixtures/lean-core/main-shared-registry.mjs'),'--role',role,'--endpoint',f'http://127.0.0.1:{port}/json/list','--expected-app',str(APP),'--pid',str(pid),'--profile-root',str(ROOT/'u'),'--expected-port',str(port),'--expected-sha256',PREP['loadedHashPreflight'][role]['sha256'],'--output',str(out)]
 if role=='shared':args+=['--main-pid',str(CHILD.pid)]
 start=now();r=subprocess.run(args,capture_output=True,text=True,timeout=90);write(f'{stage}-{role}-execution.json',{'startedAt':start,'finishedAt':now(),'args':args,'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr});emit(f'{stage} {role} exit={r.returncode} {r.stdout.strip()} {r.stderr.strip()}')
 if r.returncode:raise RuntimeError(f'{stage} {role} helper failed')
def request(action):
 id=uuid.uuid4().hex;write('request.json',{'id':id,'action':action});p=ROOT/f'consumed-{id}.json';wait_until(lambda:p.exists(),15);return json.loads(p.read_text())
if sys.argv[1:]!=['--gui-released']:raise RuntimeError('Explicit GUI release required')
for port in [19550,19551,19552]:
 if listener(port):raise RuntimeError(f'Owned task port {port} already occupied; no launch')
args=[str(APP/'Contents/MacOS/VSLight'),'--user-data-dir',str(ROOT/'u'),'--extensions-dir',str(ROOT/'e'),'--shared-data-dir',str(ROOT/'s'),'--extensionDevelopmentPath',str(ROOT/'ext'),'--inspect=19551','--inspect-sharedprocess=19552','--remote-debugging-port=19550','--skip-welcome','--skip-release-notes','--disable-workspace-trust','--new-window',str(ROOT/'w')]
result={'startedAt':now(),'status':'STARTED','launchArgs':args,'guiReleaseAuthorization':'root message GUI已释放 received before launch'}
with (ROOT/'launch.log').open('w') as log:
 CHILD=subprocess.Popen(args,stdout=log,stderr=subprocess.STDOUT);result['mainPID']=CHILD.pid;write('launch.json',result);emit(f'Owned main PID {CHILD.pid}')
 try:
  cold=wait_until(ready);result['coldReady']=cold;write('cold-ready.json',cold);emit(f'Cold host ready {cold["hostPID"]}');wait_until(lambda:listener(19551));wait_until(lambda:listener(19552));time.sleep(1)
  capture('cold','main');capture('cold','shared')
  result['reloadRequestedAt']=now();result['reloadConsumed']=request('reload');new=wait_until(lambda:ready(cold['hostPID']));result['reloadReady']=new;write('reload-ready.json',new)
  try:os.kill(cold['hostPID'],0);result['oldHostExited']=False
  except ProcessLookupError:result['oldHostExited']=True
  if not result['oldHostExited']:raise RuntimeError('Old host did not exit on actual Reload')
  emit(f'Reload host ready {new["hostPID"]}; old exited');time.sleep(1);capture('reload','main');capture('reload','shared');result['status']='CAPTURES_COMPLETE'
 except Exception as e:result['status']='FAILED';result['failure']=str(e);emit(f'Failure: {e}')
 finally:
  if CHILD.poll() is None:
   try:result['publicQuitConsumed']=request('quit');result['waitExitCode']=CHILD.wait(timeout=45);result['quitCompletedAt']=now();emit(f'Public quit owned app wait exit={result["waitExitCode"]}')
   except Exception as e:
    result['quitFailure']=str(e);CHILD.terminate();result['forcedCleanupExitCode']=CHILD.wait(timeout=15);emit('FAILED public quit; terminated owned child only')
  else:result['waitExitCode']=CHILD.wait()
  result['portsReleased']={str(p):listener(p) is None for p in [19550,19551,19552]};result['finishedAt']=now();write('run-result.json',result)
  for p in ROOT.glob('*.json'):shutil.copyfile(p,EVIDENCE/p.name)
  for p in [ROOT/'runner.py',ROOT/'launch.log']:shutil.copyfile(p,EVIDENCE/p.name)
  shutil.copytree(ROOT/'ext',EVIDENCE/'fixture',dirs_exist_ok=True);shutil.copytree(ROOT/'captures',EVIDENCE/'captures',dirs_exist_ok=True)
  # Text logs only. Do not copy profile LevelDB or private account storage.
  for p in (ROOT/'u/logs').rglob('*.log'):
   dest=EVIDENCE/'logs'/p.relative_to(ROOT/'u/logs');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
  emit(json.dumps({'status':result['status'],'mainPID':CHILD.pid,'waitExitCode':result.get('waitExitCode'),'portsReleased':result['portsReleased'],'evidence':str(EVIDENCE)}))
  if result['status']!='CAPTURES_COMPLETE' or result.get('waitExitCode')!=0 or not all(result['portsReleased'].values()):sys.exit(1)
