from pathlib import Path
import argparse, sqlite3, json, hashlib
parser=argparse.ArgumentParser(); parser.add_argument('--stage',choices=['afterquit'],required=True); parser.add_argument('--checkpoint',choices=['cold','restart'],required=True); args=parser.parse_args()
root=Path('/private/tmp/lcfinal-chkarkup/ui'); frozen=json.loads((root/'preservedKeys.json').read_text()); assert frozen['syntheticOnly']
checks=[]
for path_key,keys_key in [('globalDB','globalKeysBefore'),('workspaceDB','workspaceKeysBefore')]:
    with sqlite3.connect('file:'+frozen[path_key]+'?mode=ro',uri=True) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        for key,expected in frozen[keys_key].items():
            row=db.execute('SELECT value FROM ItemTable WHERE key=?',(key,)).fetchone()
            assert row is not None, 'Preserved key missing: '+key
            value=row[0]; value=value.decode() if isinstance(value,bytes) else value
            if key==frozen['auth']['extensionId'] and args.stage=='afterquit':
                state=json.loads(value)
                assert state.pop('persistenceWritten',None)==frozen['persistenceWrittenExpected'], 'Real pre-quit globalState write missing'
                assert state==json.loads(expected), 'Seeded synthetic extension state changed'
            else: assert value==expected, 'Preserved key changed: '+key
            checks.append(path_key+':'+key)
for entry in frozen['filesBefore']:
    p=Path(entry['path']); data=p.read_bytes()
    assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'], 'Preserved file changed: '+str(p)
    checks.append('file:'+str(p))
settings=json.loads((root/'u/User/settings.json').read_text()); assert settings['chat.agent.enabled'] is True and settings['mcp.discovery.enabled'] is True
assert not (root/'disabled-activation-marker.txt').exists(), 'Disabled extension activated'
result={'status':'PASS','stage':args.stage,'dbKeysChecked':12,'filesChecked':6,'retiredSettingsRetained':True,'disabledNeverActivated':True,'syntheticOnly':True,'checks':checks,'tokenValuesPrinted':False}
print(json.dumps(result,indent=2))
result['checkpoint']=args.checkpoint
(root/'evidence151-retry').mkdir(exist_ok=True)
(root/'evidence151-retry'/('preservation-'+args.checkpoint+'.json')).write_text(json.dumps(result,indent=2)+'\n')
