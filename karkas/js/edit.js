/* ---------- редактор: выбор, отмена, правки модели ---------- */
const SEL={m:new Set(),n:new Set()};
const UNDO=[],REDO=[];
const snap=()=>JSON.stringify(M);
// любая правка: change() — снимок для отмены, правка, перерисовка
function change(fn){UNDO.push(snap());if(UNDO.length>200)UNDO.shift();REDO.length=0;fn();cleanSel();renderAll();}
function undo(){if(!UNDO.length)return;REDO.push(snap());M=normModel(JSON.parse(UNDO.pop()));cleanSel();renderAll();}
function redo(){if(!REDO.length)return;UNDO.push(snap());M=normModel(JSON.parse(REDO.pop()));cleanSel();renderAll();}
function cleanSel(){[...SEL.m].forEach(id=>{if(!M.members.some(m=>m.id===id))SEL.m.delete(id);});[...SEL.n].forEach(id=>{if(!nodeById(id))SEL.n.delete(id);});}
function select(hit,add){if(!add){SEL.m.clear();SEL.n.clear();}
  if(hit&&hit.member){SEL.m.has(hit.member)&&add?SEL.m.delete(hit.member):SEL.m.add(hit.member);}
  if(hit&&hit.node){SEL.n.has(hit.node)&&add?SEL.n.delete(hit.node):SEL.n.add(hit.node);}
  renderAll(false);}
// нарисовать трубу от выбранного узла вдоль оси
const AX={'+x':[1,0,0],'-x':[-1,0,0],'+y':[0,1,0],'-y':[0,-1,0],'+z':[0,0,1],'-z':[0,0,-1]};
function drawAlong(ax,len,pr){const from=[...SEL.n].pop();if(!from)return 'Сначала выберите узел (клик по синей точке) или создайте первый узел';if(!(len>0))return 'Длина должна быть больше 0';
  const n0=nodeById(from),d=AX[ax];let nid;
  change(()=>{const n1=addNode(n0.x+d[0]*len,n0.y+d[1]*len,n0.z+d[2]*len);nid=n1.id;addMember(n0.id,n1.id,pr,curGrp());});
  SEL.n.clear();SEL.n.add(nid);renderAll(false);return '';}
function joinNodes(pr){const ns=[...SEL.n];if(ns.length!==2)return 'Выберите ровно 2 узла (Shift+клик)';let r='';change(()=>{if(!addMember(ns[0],ns[1],pr,curGrp()))r='Такая труба уже есть';});return r;}
// длина трубы по оси: двигаем конец b вдоль оси
function setAxisLen(id,len){const m=M.members.find(x=>x.id===id);if(!m||!(len>0))return;change(()=>{const f=frame(m),a=nodeById(m.a),b=nodeById(m.b),others=M.members.filter(x=>x!==m&&(x.a===b.id||x.b===b.id));
  // если у конца b есть другие трубы — двигаем узел вместе с ними; иначе тоже двигаем (свободный конец)
  b.x=Math.round(a.x+f.d[0]*len);b.y=Math.round(a.y+f.d[1]*len);b.z=Math.round(a.z+f.d[2]*len);});}
function moveSel(dx,dy,dz){const ids=new Set(SEL.n);SEL.m.forEach(id=>{const m=M.members.find(x=>x.id===id);if(m){ids.add(m.a);ids.add(m.b);}});
  if(!ids.size)return;change(()=>ids.forEach(id=>{const n=nodeById(id);n.x+=dx;n.y+=dy;n.z+=dz;}));}
function delSel(){if(!SEL.m.size&&!SEL.n.size)return;change(()=>{SEL.m.forEach(id=>delMember(id));SEL.n.forEach(id=>delNode(id));gcNodes();});SEL.m.clear();SEL.n.clear();renderAll(false);}
function setMembers(key,val){if(!SEL.m.size)return;change(()=>SEL.m.forEach(id=>{const m=M.members.find(x=>x.id===id);if(m)m[key]=val;}));}
// текущая сборка для новых труб — сборка выбранной трубы
function curGrp(){const id=[...SEL.m][0];const m=id&&M.members.find(x=>x.id===id);return m?m.grp:(ONLY_GRP||'');}
function makeGroup(name){if(!SEL.m.size)return 'Сначала выберите трубы';let gid;change(()=>{gid=nextId(M.groups,'g');M.groups.push({id:gid,name:name||('Сборка '+(M.groups.length+1)),qty:1,mirror:false});SEL.m.forEach(id=>{const m=M.members.find(x=>x.id===id);if(m)m.grp=gid;});});return '';}
function selectGroup(gid){SEL.m.clear();SEL.n.clear();M.members.forEach(m=>{if((m.grp||'')===gid)SEL.m.add(m.id);});renderAll(false);}
