import json,sys,subprocess,shlex,datetime
from pathlib import Path
root=Path(__file__).parent
before=json.loads((root/'search-list-before.json').read_text());default_before=json.loads((root/'default-keychain-before.json').read_text())
keychain=root/'buildagent.keychain';p12=root/'certificate.p12'
result={'at':datetime.datetime.now().astimezone().isoformat(),'restored':False}
try:
 p=subprocess.run(['security','delete-keychain',str(keychain)],capture_output=True,text=True)
 result['deleteKeychainExit']=p.returncode
 if p12.exists():p12.unlink()
 after=shlex.split(subprocess.check_output(['security','list-keychains','-d','user'],text=True))
 result['afterDeletion']=after
 if before!=after:
  subprocess.run(['security','list-keychains','-d','user','-s',*before],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  result['restored']=True
 final_raw=subprocess.check_output(['security','list-keychains','-d','user'],text=True)
 final=shlex.split(final_raw)
 default_final=shlex.split(subprocess.check_output(['security','default-keychain','-d','user'],text=True))
 (root/'search-list-after.stdout').write_text(final_raw);(root/'search-list-after.json').write_text(json.dumps(final,indent=2)+'\n')
 result.update(equal=final==before,defaultKeychainUnchanged=default_before==default_final,privateKeychainRemoved=not keychain.exists() and not Path(str(keychain)+'-db').exists(),privateP12Removed=not p12.exists())
except Exception as error:
 result['errorType']=type(error).__name__;result['error']='Cleanup verification failed; raw credentials are not included'
(root/'keychain-cleanup.json').write_text(json.dumps(result,indent=2)+'\n')
ok=all(result.get(k) is True for k in ['equal','defaultKeychainUnchanged','privateKeychainRemoved','privateP12Removed'])
print('cleanup verification '+('PASS' if ok else 'FAIL'),flush=True);sys.exit(0 if ok else 1)

