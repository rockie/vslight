#!/usr/bin/env python3
"""Read captured files only. Never connect to or alter a running app."""
import collections, copy, datetime, hashlib, json, pathlib, re, shutil, sys

BASE = pathlib.Path(__file__).resolve().parent
RECORDS = BASE.parent
UI = pathlib.Path('/private/tmp/lcfinal-chkarkup/ui')
SOURCE = pathlib.Path('/private/tmp/lean-core-build151-c480juxs/vscodium/vscode')
def read(p): return json.loads(pathlib.Path(p).read_text())
def sha(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def itemsha(x): return hashlib.sha256(json.dumps(x, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
def strings(x):
    if isinstance(x, str): yield x
    elif isinstance(x, dict):
        for v in x.values(): yield from strings(v)
    elif isinstance(x, list):
        for v in x: yield from strings(v)
def itemid(x):
    return x.get('id', x.get('command', x.get('serviceId', ''))) if isinstance(x, dict) else ''

raw = pathlib.Path(sys.argv[1]); label = sys.argv[2]
dest = BASE / label
dest.mkdir(parents=True, exist_ok=True)
manifest=[]
for f in sorted(raw.rglob('*')):
    if not f.is_file(): continue
    # Do not retain profile LevelDB blobs; captured logs.json still describes their hashes.
    if f.suffix != '.json' and not (f.suffix == '.log' and 'logs/logs/' in str(f.relative_to(raw))): continue
    t=dest/f.relative_to(raw); t.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(f,t)
    manifest.append({'path':str(t.relative_to(BASE)), 'source':str(f), 'bytes':t.stat().st_size, 'sha256':sha(t)})
reg=read(dest/'registries.json'); audit=read(dest/'audit.json'); summary=read(dest/'summary.json')
old=read(RECORDS/'M6-runtime150-final.json'); prov=read(UI/'retired-provenance149.json')
identity=read(dest/'identity.json'); before=read(dest/'authority-before.json'); after=read(dest/'authority-after.json')
counts={k:len(reg[k]) for k in ['commands','commandMetadata','settings','excludedSettings','keybindings','containers','singletons']}
counts.update(statusbarModels=len(reg['statusbars']),statusbarEntries=sum(len(x['entries']) for x in reg['statusbars']), menuIDs=len(reg['menus']),menuIDsWithItems=sum(bool(x['items']) for x in reg['menus']), menuItems=sum(len(x['items']) for x in reg['menus']), views=sum(len(x['descriptors']) for x in reg['views']),viewsWelcomeIDs=len(reg['viewsWelcome']),viewsWelcomeEntries=sum(len(x['entries']) for x in reg['viewsWelcome']),workbenchInstances=len(read(dest/'renderer-services.json')),rendererChannelServers=len(read(dest/'renderer-channels.json')),walkthroughInstances=len(reg['walkthroughs']['instances']),walkthroughSteps=len(reg['walkthroughSteps']),commandLinks=len(audit['commandLinks']))
surfaces={
 'handlers':{x['id'] for x in reg['commands']},
 'metadata':{x['id'] for x in reg['commandMetadata']},
 'defaultBindings':{x['command'] for x in reg['keybindings']},
 'commandLinks':{x['id'] for x in audit['commandLinks']},
 'menuCommandAndAlt':{x[k]['id'] for m in reg['menus'] for x in m['items'] for k in ['command','alt'] if isinstance(x.get(k),dict) and 'id' in x[k]},
 'walkthroughOnCommandEvents':{s[len('onCommand:'):] for s in strings(reg['walkthroughs']) if s.startswith('onCommand:')},
}
ordinary=set(prov['ordinaryReferencedIDExceptions']); cand=prov['candidateIDs']; shapes=set(cand['registrationShaped']); commands=set(cand['command']); settings={x['id'] for x in reg['settings']+reg['excludedSettings']}
static={k:{'retiredMatches':sorted(v&commands-ordinary),'ordinarySupersetMatches':sorted(v&ordinary),'registrationShapedRetiredMatches':sorted(v&shapes-ordinary)} for k,v in surfaces.items()}
static['settings']={'retiredMatches':sorted(settings&set(cand['setting']))}
static['scalarSuperset']={'actualNonCommandCollisions':sorted(set(strings(reg))&commands-ordinary),'note':'Exact scalar comparison is not a prose/description or object-key parser.'}
dynamic=[]; commandUnion=set().union(*surfaces.values())
for idx,row in enumerate(prov['dynamicRows']):
    r=copy.deepcopy(row); cls=r['classification']; pattern=r.get('idPattern'); finite=set(r.get('resolvedIDs',[]))
    scope=commandUnion if cls in ['dynamic command family','dynamic request command'] else settings if cls=='resolved global setting' else commandUnion|settings
    matches=sorted({x for x in scope if (pattern and re.search(pattern,x)) or x in finite})
    r.update(index=idx,producerPresentInFrozen151=(SOURCE/r['source']).exists(),current151Matches=matches,evaluatedSurfaceScope='command surfaces' if cls in ['dynamic command family','dynamic request command'] else 'global settings' if cls=='resolved global setting' else 'finite command/settings IDs; arbitrary/product/nested schema producer absence')
    if pattern:r['otherSurfaceNameCollisions']=sorted({x for x in settings-commandUnion if re.search(pattern,x)})
    dynamic.append(r)

# Every narrow and broad match is classified anew by semantic entity, with unchanged
# item hashes demonstrating when a former source-based reason still applies.
classified={}; changed=[]; unclassified=[]
for tier in ['narrow','broad']:
    classified[tier]={}
    for surface,rows in audit[tier].items():
        prior=old['ordinaryMetadataClassifications'][tier].get(surface,[]); out=[]
        for x in rows:
            item=x['item']; ident=itemid(item); h=itemsha(item)
            exact=[y for y in prior if y.get('itemSHA256')==h]
            same=[y for y in prior if y.get('id')==ident]
            sameidx=[y for y in same if y.get('index')==x['index']]
            match=(exact or sameidx or same)
            entry={'index':x['index'],'id':ident,'itemSHA256':h,'rawItemLocation':f'{label}/audit.json:{tier}.{surface}[index={x["index"]}]','classification':match[0]['classification'] if match else 'UNCLASSIFIED','reason':match[0]['reason'] if match else 'Needs source review','sameItemSHAAs150':bool(exact)}
            if surface=='menus':entry['itemCount']=len(item['items'])
            if surface=='configurations':entry['aggregatePropertiesCount']=len(item.get('properties',{}))
            if surface=='settings':entry['annotations']={k:item['schema'][k] for k in ['agentsWindow','agentHost'] if k in item['schema']}
            if len(json.dumps(item))<1500:entry['item']=item
            if not exact:changed.append({'tier':tier,'surface':surface,'index':x['index'],'id':ident,'matchedPrior':bool(match),'priorIndex':match[0]['index'] if match else None})
            if not match:unclassified.append(entry)
            out.append(entry)
        classified[tier][surface]=out

schema={x['id']:x['schema'] for x in reg['settings']}; excluded={x['id']:x['schema'] for x in reg['excludedSettings']}
retired147=['notebook.codeActionsOnSave','search.experimental.closedNotebookRichContentResults','accessibility.verbosity.notebook','accessibility.verbosity.debug','accessibility.signals.lineHasBreakpoint','accessibility.signals.onDebugBreak','accessibility.signals.notebookCellCompleted','accessibility.signals.notebookCellFailed','accessibility.debugWatchVariableAnnouncements']
precise={'retired147SchemaIDsPresent':sorted(settings&set(retired147)),'ordinaryVerbosityCount':sum(k.startswith('accessibility.verbosity.') for k in schema),'ordinarySignalCount':sum(k.startswith('accessibility.signals.') for k in schema),'languageDetectionHints':schema.get('workbench.editor.languageDetectionHints'),'autoLockGroups':schema.get('workbench.editor.autoLockGroups'),'npmScriptExplorerAction':schema.get('npm.scriptExplorerAction'),'npmDebugHandlers':sorted(surfaces['handlers']&{'npm.debugScript','npm.debugScriptFromHover'}),'npmCodeLensSchemaPresent':any(k.startswith('npm.') and 'codelens' in k.lower() for k in settings),'populatedRetiredMenuIDs':[m['id'] for m in reg['menus'] if m['items'] and re.search('Chat|AgentSession|Notebook|BrowserView|Speech|Mcp|Dictation',m['id'])]}
precise['autoLockInteractivePresent']='workbench.input.interactive' in set(strings(precise['autoLockGroups'])) or any('workbench.input.interactive' in precise['autoLockGroups'].get(k,{}) for k in ['properties','default','defaultDefaultValue'])
precise['mermaidNotebookOutputPositiveReferences']=[x for m in reg['menus'] for x in m['items'] if '_mermaid' in json.dumps(x) and 'notebook.output' in json.dumps(x)]
serviceIDs=[x['id'] for inst in read(dest/'renderer-services.json') for x in inst['services']]
retiredRE=re.compile(r'chat|mcp|speech|dictation|agents?voice|agent.?host|agent.?sessions|browser.?view|simple.?browser|playwright|languageModels|inlineCompletionsUnification|localTranscription|webContentExtractor',re.I)
channels=read(dest/'renderer-channels.json'); trees=read(dest/'process-tree.json')
missingLinks=[x for x in audit['commandLinks'] if x['id'] not in surfaces['handlers']]
logs=[]; sessions=collections.defaultdict(lambda:{'warningCount':0,'errorCount':0,'warnings':[],'errors':[],'retiredPatternHits':[]})
logRE=re.compile(r'Unknown service|Missing proxy|No proxy|customer.*(?:error|missing)|actor.*(?:error|missing)|Unknown channel|channel.*not found|Model.*download|Foundry|localTranscription|agentHost|NativeMcp|mcpGateway|playwright',re.I)
for f in sorted((dest/'logs'/'logs').rglob('*.log')):
    rel=str(f.relative_to(dest)); sess=f.relative_to(dest/'logs'/'logs').parts[0]
    logs.append({'file':rel,'bytes':f.stat().st_size,'sha256':sha(f)})
    for n,line in enumerate(f.read_text(errors='replace').splitlines(),1):
        hit={'file':rel,'line':n,'text':line}
        if re.search(r'\[(?:warn|warning)\]',line):sessions[sess]['warningCount']+=1;sessions[sess]['warnings'].append(hit)
        if re.search(r'\[(?:error|critical)\]',line):sessions[sess]['errorCount']+=1;sessions[sess]['errors'].append(hit)
        if logRE.search(line):sessions[sess]['retiredPatternHits'].append(hit)

expected=read(RECORDS/'M4-terminal-skip151.json')['isolatedRuntime']['after']['schema']
term=schema['terminal.integrated.commandsToSkipShell']; desc=term['markdownDescription']
retired24=['sessions.focusActiveSession']+[f'sessions.focusSessionInGrid{i}' for i in range(1,10)]+['sessions.goBack','sessions.goForward','sessionsViewPane.navigateNextSession','sessionsViewPane.navigatePreviousSession']+[f'workbench.action.debug.{x}' for x in ['continue','disconnect','pause','restart','run','start','stepInto','stepOut','stepOver','stop']]
aggregates=[{'index':i,'schemaEqualExpected':x['properties']['terminal.integrated.commandsToSkipShell']==expected} for i,x in enumerate(reg['configurations']) if 'terminal.integrated.commandsToSkipShell' in x.get('properties',{})]
terminal={'retiredIDs':retired24,'schemaEqualExpected':term==expected,'markdownDescriptionSHA256':hashlib.sha256(desc.encode()).hexdigest(),'retiredLiteralMatches':[x for x in retired24 if x in desc],'listedCommandCount':sum(line.startswith('- ') for line in desc.splitlines()),'default':term['default'],'aggregates':aggregates,'actualServiceSet':'NOT_EXECUTED_IN_FIRST_ATTEMPT; schema/default is not actual built-in Set proof'}
appJs=pathlib.Path(summary['expectedApp'])/'Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js'
checks={'authorityBeforeAfterExact':before==after,'actual151LoadedDiskSHAEqual':identity['loadedSHA256']==identity['diskSHA256']==sha(appJs),'sameURLImportNewModuleCountZero':identity['cachedImportNewModuleCount']==0,'provenanceSHAEquals150':sha(UI/'retired-provenance149.json')==old['sourceProvenance']['sha256'],'rawCountsMatchHelperSummary':counts==summary['counts'],'allRetiredCommandSurfaceMatchesZero':all(not static[k]['retiredMatches'] and not static[k]['registrationShapedRetiredMatches'] for k in surfaces),'retiredSettingsZero':not static['settings']['retiredMatches'],'all57ProducersAbsent':len(dynamic)==57 and all(not x['producerPresentInFrozen151'] for x in dynamic),'all57DynamicMatchesZero':all(not x['current151Matches'] for x in dynamic),'allNarrowBroadRowsClassified':not unclassified,'retired147SchemasZero':not precise['retired147SchemaIDsPresent'],'ordinaryA11yPreserved':precise['ordinaryVerbosityCount']==13 and precise['ordinarySignalCount']==23,'interactiveAutoLockAbsent':not precise['autoLockInteractivePresent'],'populatedRetiredMenusZero':not precise['populatedRetiredMenuIDs'],'mermaidNotebookOutputAbsent':not precise['mermaidNotebookOutputPositiveReferences'],'rendererRetiredServicesZero':not [x for x in serviceIDs if retiredRE.search(x)],'logsRetiredDIActorDownloadPatternsZero':all(not x['retiredPatternHits'] for x in sessions.values()),'terminalSchemaEquals151Expected':terminal['schemaEqualExpected'] and all(x['schemaEqualExpected'] for x in aggregates),'terminal24DescriptionLiteralsAbsent':not terminal['retiredLiteralMatches']}
result={'recordedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':label,'rawSnapshot':str(raw),'capturedAtUTC':summary['capturedAtUTC'],'status':'REGISTRY_ENTITY_CHECKS_PASS' if all(checks.values()) else 'REGISTRY_ENTITY_CHECKS_FAIL','snapshotManifest':manifest,'authorityBefore':before,'authorityAfter':after,'identity':identity,'counts':counts,'configurations':len(reg['configurations']),'registryEntries':len(reg['registryEntries']),'rendererServiceEntries':len(serviceIDs),'candidateCounts':{k:len(v) for k,v in cand.items()},'staticCandidateComparison':static,'dynamicRows151':dynamic,'unresolvedClassificationCounts':prov['unresolvedClassificationCounts'],'narrowCounts':{k:len(v) for k,v in audit['narrow'].items()},'broadCounts':{k:len(v) for k,v in audit['broad'].items()},'ordinaryMetadataClassifications':classified,'changedClassifiedItemsSince150':changed,'unclassifiedItems':unclassified,'currentDirectSchemaAgentAnnotations':{k:sum(k in x['schema'] for x in reg['settings']) for k in ['agentsWindow','agentHost']},'precise147149Current':precise,'terminalSkip151Schema':terminal,'statusbars':reg['statusbars'],'rendererServiceIDs':serviceIDs,'rendererServiceRetiredNameMatches':[x for x in serviceIDs if retiredRE.search(x)],'rendererChannels':channels,'profiling':read(dest/'profiling.json'),'walkthroughSummary':{'descriptorCount':reg['walkthroughs']['descriptorCount'],'instanceCount':len(reg['walkthroughs']['instances']),'stepCount':len(reg['walkthroughSteps']),'sourceSymbolEvidence':reg['walkthroughs']['sourceSymbolEvidence']},'commandLinks':audit['commandLinks'],'missingWelcomeLinkExceptions':missingLinks,'processes':[{'pid':x['pid'],'parentPID':x['parentPID'],'retiredNameMatches':retiredRE.findall(x['command'])} for x in trees],'logs':{'textLogCount':len(logs),'files':logs,'sessions':dict(sessions),'binaryLevelDBSkipped':True},'checks':checks,'limitations':old['limitations']}
(dest/'offline-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':result['status'],'failedChecks':[k for k,v in checks.items() if not v],'counts':counts,'changedItems':changed,'sessions':{k:{'warnings':v['warningCount'],'errors':v['errorCount'],'retiredPatternHits':len(v['retiredPatternHits'])} for k,v in sessions.items()},'terminal':terminal,'out':str(dest/'offline-audit.json')},ensure_ascii=False,indent=2))
