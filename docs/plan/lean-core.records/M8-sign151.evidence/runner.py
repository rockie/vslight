from pathlib import Path
import subprocess,json,datetime,os,sys
os.umask(0o077)
root=Path(__file__).parent
started=datetime.datetime.now().astimezone().isoformat()
(root/'runner-running.json').write_text(json.dumps({'pid':os.getpid(),'startedAt':started,'command':['/bin/bash',str(root/'sign.sh')]},indent=2)+'\n')
with (root/'runner.log').open('wb') as log:
 result=subprocess.run(['/bin/bash',str(root/'sign.sh')],stdout=log,stderr=subprocess.STDOUT)
(root/'runner-exit.json').write_text(json.dumps({'exit':result.returncode,'startedAt':started,'completedAt':datetime.datetime.now().astimezone().isoformat()},indent=2)+'\n')
print('sign151 runner exit='+str(result.returncode),flush=True)
sys.exit(result.returncode)

