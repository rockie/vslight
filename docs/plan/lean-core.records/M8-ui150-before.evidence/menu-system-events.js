function run(argv) {
  const pid=Number(argv[0]);
  if(!Number.isSafeInteger(pid)||pid<1)throw Error('Invalid PID');
  const se=Application('System Events');
  const processes=se.applicationProcesses.whose({unixId:pid})();
  if(processes.length!==1)throw Error('Expected own process');
  let count=0;
  function read(element,depth,path) {
    if(depth>30||++count>3000)throw Error('Menu bounds exceeded');
    const role=element.role(),title=element.name()||'';
    const here=path.concat([title||role]);
    const out={pid,depth,AXRole:role,AXTitle:title,path:here,children:[]};
    for(const child of element.uiElements())out.children.push(read(child,depth+1,here));
    return out;
  }
  const menuBar=read(processes[0].menuBars[0],0,[]);
  return JSON.stringify({pid,readonly:true,trusted:true,permissionMechanism:'Authorized System Events Apple Events',at:new Date().toISOString(),nodeCount:count,menuBar});
}
