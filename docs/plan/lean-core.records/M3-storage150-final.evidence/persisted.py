import pathlib,sqlite3,json,sys
r=pathlib.Path(__file__).resolve().parent
keys=json.loads((r/'preservedKeys.json').read_text());results=[];editors=[]
for db in r.glob('u/User/**/state.vscdb'):
 assert not pathlib.Path(str(db)+'-wal').exists(),'WAL remains after ordinary quit'
 c=sqlite3.connect('file:'+str(db)+'?mode=ro&immutable=1',uri=True)
 values=dict(c.execute('select key,value from ItemTable'));c.close()
 for k,v in keys.items():assert values[k]==v,'Synthetic old profile value changed: '+k
 results.append({'db':str(db.relative_to(r)), 'preserved':{k:values[k] for k in keys}})
 if 'memento/workbench.parts.editor' in values:
  editors.append(json.loads(values['memento/workbench.parts.editor']))
assert len(editors)==1
text=json.dumps(editors,ensure_ascii=False)
assert 'vscode.mermaid-markdown-features.preview' in text
assert 'mainThreadWebview-markdown.preview' in text
assert '165d2776' not in text or 'mermaid' in text
assert 'scale' in text and '1.25' in text and '429.75' in text
assert (r/'historical-chat.json').read_text()=='{"synthetic":true,"history":"preserve untouched"}\n'
(r/'evidence'/f'{sys.argv[1]}-sqlite.json').write_text(json.dumps({'editors':editors,'sentinels':results,'historicalFileExact':True},indent=2)+'\n')
