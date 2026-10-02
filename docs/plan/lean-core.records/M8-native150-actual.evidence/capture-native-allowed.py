import datetime, json, pathlib, re, subprocess
root=pathlib.Path('/private/tmp/lcfinal-chkarkup/ui')
pid=46653
run=subprocess.run([str(root/'menu-readonly'),str(pid)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
menu=json.loads(run.stdout)
assert run.returncode==0 and menu['trusted'] and menu['menuBarError']==0
assert 100<menu['nodeCount']<3000
(root/'evidence/native-menu-allowed150.json').write_text(json.dumps(menu,indent=2)+'\n')
titles=[]
def visit(node):
    if node.get('AXTitle'):titles.append({'path':node['path'],'title':node['AXTitle']})
    for child in node.get('children',[]):visit(child)
visit(menu['menuBar'])
positive=[node.get('AXTitle') for node in menu['menuBar']['children']]
for title in ['File','Edit','View','Terminal','Help']:assert title in positive
pattern=re.compile(r'\b(Chat|MCP|Speech|Dictation|Integrated Browser|Simple Browser|Agent Sessions|Copilot)\b',re.I)
matches=[row for row in titles if pattern.search(row['title'])]
result={'at':datetime.datetime.now().astimezone().isoformat(),'pid':pid,'exit':run.returncode,'trusted':bool(menu['trusted']),'menuBarError':menu['menuBarError'],'nodeCount':menu['nodeCount'],'positiveTopMenus':positive,'retiredTitleMatches':matches,'retiredTitleMatchCount':len(matches),'rawFile':str(root/'evidence/native-menu-allowed150.json')}
(root/'evidence/native-menu-allowed150-summary.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
assert not matches
