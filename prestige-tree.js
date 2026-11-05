/* Deep Blue prestige star map. Pathway and capstone effects are deliberately unavailable until designed. */
(function(){
 'use strict';
 const el=id=>document.getElementById(id);
 const PATHS=[
  {id:'draco',label:'GREED',constellation:'DRACO',star:'Eltanin',color:'#f2be6a',x:680},
  {id:'scorpius',label:'WRATH',constellation:'SCORPIUS',star:'Shaula',color:'#f47a83',x:1980},
  {id:'ursa',label:'SLOTH',constellation:'URSA MAJOR',star:'Alcor',color:'#8ebff1',x:3280},
  {id:'gemini',label:'ABILITIES',constellation:'GEMINI',star:'Castor',color:'#c4a2f6',x:4580},
  {id:'vela',label:'EXPLORATION',constellation:'VELA',star:'Alsephina',color:'#71e4d9',x:5880}
 ];
 const CAPSTONES={
  draco:'Eltanin — The Dragon’s Hoard: multiply final successfully banked expedition gold by ×25, after all other multipliers.',
  scorpius:'Shaula — The Scorpion’s Sting: press Q (or the SHAULA button) to erase asteroids within 1,000 units and add 100,000 unbanked gold to your haul. 10-second cooldown.',
  ursa:'Alcor — The Unseen Hand: automatically collect all crates within 750 units every 5 seconds, even through asteroids.',
  gemini:'Castor — The Divine Union: gain the full benefits of every current and future ship class simultaneously.',
  vela:'Alsephina — The Endless Voyage: no collection-phase time limit. Press R (or BEGIN RETURN) whenever you want to start your return timer.'
 };
 const TREE=[{id:'pr-root',name:'A NEW BEGINNING',desc:'After every prestige reset, begin with 1,000 gold.',cost:0,tier:0,x:3280,y:145,color:'#ffe6a0',parent:null,root:true}];
 // One shared origin, then 5 / 10 / 20 / 40 nodes, plus one capstone per constellation.
 for(const path of PATHS){
  const previous=[];
  for(let tier=1;tier<=4;tier++){
   const count=Math.pow(2,tier-1),current=[];
   for(let i=0;i<count;i++){
    const position=(i-(count-1)/2)*(tier===1?0:tier===2?510:tier===3?290:142);
    const node={id:'pr-'+path.id+'-'+tier+'-'+i,name:'COMING SOON',desc:'This permanent prestige upgrade is coming soon.',cost:1,tier,x:path.x+position,y:420+(tier-1)*300,color:path.color,path:path.id,parent:tier===1?'pr-root':previous[Math.floor(i/2)]};
    TREE.push(node);current.push(node.id);
   }
   previous.splice(0,previous.length,...current);
  }
  TREE.push({id:'pr-'+path.id+'-capstone',name:path.star.toUpperCase(),desc:CAPSTONES[path.id],cost:1,tier:5,x:path.x,y:1730,color:path.color,path:path.id,capstone:true,parents:previous.slice()});
 }
 if(TREE.length!==81)throw new Error('Prestige tree layout must contain exactly 81 nodes');
 const BY_ID=Object.fromEntries(TREE.map(n=>[n.id,n]));
 let selected='pr-root',viewTab='normal',zoom=.32,panX=0,panY=0,pointer=null,rendered=false;
 const fmt=v=>Math.floor(v).toLocaleString('en-GB');
 function prestigeLevel(){return Math.max(0,Math.min(40,Math.trunc(Number(save.prestigeLevel)||0)))}
 function nextCost(){return Math.ceil(1000*Math.pow(1.5,prestigeLevel())-1e-9)}
 function prestigePoints(){return Math.max(0,Math.floor(Number(save.prestigePoints)||0))}
 // Prestige 1: +5, levels 2-35: +2, 36-39: +1, and level 40: +3.
 function pointReward(level){return level===1?5:level===40?3:level>=36?1:level>=2?2:0}
 function totalPointsEarned(level){let total=0;for(let i=1;i<=Math.min(40,level);i++)total+=pointReward(i);return total}
 // Old prestige accounts earned +5 per level. All placeholder nodes were unpurchasable,
 // so migrate existing unspent points to the new total once, on local or cloud load.
 function migratePointSchedule(){
  if(save.prestigePointScheduleVersion===2)return;
  const level=prestigeLevel(),previousEarned=level*5,newEarned=totalPointsEarned(level);
  save.prestigePoints=Math.max(0,prestigePoints()-(previousEarned-newEarned));
  save.prestigePointScheduleVersion=2;
  persist();
 }
 function owned(id){return id==='pr-root'?prestigeLevel()>0:prestigeLevel()>=20&&BY_ID[id]?.capstone&&save.prestigeNodes?.[id]===true}
 function enableTab(tab){
  if(tab==='prestige'&&prestigeLevel()<1)return;
  viewTab=tab;
  el('normalResearch').hidden=tab!=='normal';
  el('prestigeResearch').hidden=tab!=='prestige';
  el('normalResearchTab').classList.toggle('active',tab==='normal');
  el('prestigeResearchTab').classList.toggle('active',tab==='prestige');
  if(tab==='prestige'){buildTree();renderTree();if(!rendered){rendered=true;focusRoot()}}
 }
 function link(svg,a,b,color,strong){
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);
  line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
  line.setAttribute('stroke',color);line.setAttribute('stroke-width',strong?'4':'2.2');
  line.setAttribute('stroke-opacity',strong?'.56':'.33');
  svg.appendChild(line);
 }
 function buildTree(){
  const world=el('prestigeWorld');if(!world||world.dataset.built)return;
  const lines=el('prestigeLines'),holder=el('prestigeNodes');
  for(const path of PATHS){
   const label=document.createElement('div');label.className='prestige-sector';label.style.left=path.x+'px';label.style.top='285px';label.style.color=path.color;
   label.textContent=path.constellation+' · '+path.label;world.appendChild(label);
  }
  for(const n of TREE){
   if(n.parent)link(lines,BY_ID[n.parent],n,n.color,n.tier===1);
   if(n.parents)for(const id of n.parents)link(lines,BY_ID[id],n,n.color,false);
   const btn=document.createElement('button');btn.type='button';btn.className='prestige-node'+(n.root?' prestige-root':'')+(n.capstone?' prestige-capstone':'');
   btn.style.left=n.x+'px';btn.style.top=n.y+'px';btn.style.setProperty('--star',n.color);btn.dataset.node=n.id;
   btn.setAttribute('aria-label',n.root?'A New Beginning':n.capstone?n.name+' legendary capstone':PATHS.find(p=>p.id===n.path).label+' pathway, coming soon');
   btn.onclick=()=>{selected=n.id;renderTree();el('prestigeDetail').scrollIntoView({block:'nearest',behavior:'smooth'})};
   holder.appendChild(btn);
  }
  const jumps=el('prestigeJump');for(const path of PATHS){
   const btn=document.createElement('button');btn.type='button';btn.textContent=path.constellation;btn.style.setProperty('--star',path.color);btn.onclick=()=>focusPath(path);jumps.appendChild(btn);
  }
  world.dataset.built='1';
 }
 function renderTree(){
  if(!el('prestigeWorld')?.dataset.built)return;
  el('prestigePoints').textContent=fmt(prestigePoints());
  el('prestigeTreeCount').textContent=(prestigeLevel()>0?1:0)+TREE.filter(n=>n.capstone&&owned(n.id)).length+' / 81';
  for(const btn of el('prestigeNodes').children){
   const n=BY_ID[btn.dataset.node];const active=selected===n.id;
   btn.classList.toggle('selected',active);btn.classList.toggle('owned',owned(n.id));
   btn.innerHTML='<b>'+(n.root?'✦':n.capstone?'★':'✧')+' '+n.name+'</b><small>'+(n.root?(owned(n.id)?'UNLOCKED · FREE':'LOCKED'):n.capstone?(owned(n.id)?'★ OWNED':prestigeLevel()<20?'LOCKED · PRESTIGE 20':'AVAILABLE · 1 PP'):'COMING SOON')+'</small>';
  }
  const n=BY_ID[selected],path=PATHS.find(p=>p.id===n.path);
  const heading=n.root?'A NEW BEGINNING':n.capstone?n.name:(path.constellation+' · '+path.label);
  el('prestigeDetail').innerHTML='<h3>'+heading+'</h3><p>'+n.desc+'</p><p>'+(n.root?'Free upon your first prestige · Permanent':n.capstone?'Legendary star capstone · 1 Prestige Point · Requires Prestige 20':'Pathway upgrade · 1 Prestige Point when released')+'</p><p>'+(n.root?(owned(n.id)?'✓ Unlocked':'Prestige once to unlock'):n.capstone?(owned(n.id)?'★ PERMANENTLY UNLOCKED':prestigeLevel()<20?'LOCKED — Reach Prestige 20 to purchase this capstone.':'Capstone available. Other pathway upgrades are still coming soon.'):'COMING SOON — cannot purchase or spend Prestige Points yet.')+'</p>';
  if(n.capstone){
   const button=document.createElement('button');button.type='button';button.textContent=owned(n.id)?'PERMANENTLY OWNED':prestigeLevel()<20?'REQUIRES PRESTIGE 20':'UNLOCK CAPSTONE · 1 PP';
   button.disabled=owned(n.id)||prestigeLevel()<20||prestigePoints()<1||active;
   button.onclick=()=>{
    if(active||prestigeLevel()<20||prestigePoints()<1||owned(n.id))return;
    save.prestigePoints-=1;(save.prestigeNodes??={})[n.id]=true;
    persist();renderTree();renderClasses();window.updatePrestigeUI?.();
   };
   el('prestigeDetail').appendChild(button);
  }
 }
 function applyView(){
  const w=el('prestigeWorld');if(w)w.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
 }
 function focusRoot(){
  const vp=el('prestigeViewport');if(!vp)return;zoom=Math.min(.56,Math.max(.25,vp.clientWidth/1850));
  panX=vp.clientWidth/2-3280*zoom;panY=vp.clientHeight*.34-145*zoom;applyView();
 }
 function focusPath(path){
  const vp=el('prestigeViewport');if(!vp)return;zoom=Math.min(.72,Math.max(.34,vp.clientWidth/1250));
  panX=vp.clientWidth/2-path.x*zoom;panY=vp.clientHeight*.22-420*zoom;applyView();
 }
 function adjustZoom(next,clientX,clientY){
  const vp=el('prestigeViewport'),r=vp.getBoundingClientRect(),x=clientX===undefined?vp.clientWidth/2:clientX-r.left,y=clientY===undefined?vp.clientHeight/2:clientY-r.top;
  const old=zoom;zoom=Math.max(.15,Math.min(1.5,next));panX=x-(x-panX)*zoom/old;panY=y-(y-panY)*zoom/old;applyView();
 }
 const vp=el('prestigeViewport');
 vp.addEventListener('pointerdown',e=>{
  if(e.target.closest('.prestige-node'))return;
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY};vp.setPointerCapture(e.pointerId);vp.classList.add('dragging');
 });
 vp.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;panX+=e.clientX-pointer.x;panY+=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;applyView()});
 const finishDrag=e=>{if(pointer&&e.pointerId===pointer.id){pointer=null;vp.classList.remove('dragging')}};
 vp.addEventListener('pointerup',finishDrag);vp.addEventListener('pointercancel',finishDrag);
 vp.addEventListener('wheel',e=>{e.preventDefault();adjustZoom(zoom*(e.deltaY<0?1.15:.87),e.clientX,e.clientY)},{passive:false});
 el('prestigeZoomIn').onclick=()=>adjustZoom(zoom*1.2);
 el('prestigeZoomOut').onclick=()=>adjustZoom(zoom/1.2);
 el('prestigeCenter').onclick=focusRoot;
 el('normalResearchTab').onclick=()=>enableTab('normal');
 el('prestigeResearchTab').onclick=()=>enableTab('prestige');
 function purchasePrestige(){
  if(active||prestigeLevel()>=40)return;
  const cost=nextCost(),level=prestigeLevel();
  if(save.gold<cost)return;
  const reward=pointReward(level+1);
  if(!window.confirm('PRESTIGE '+(level+1)+'?\n\nCost: '+fmt(cost)+' gold.\nAll gold, regular research, discovered formations and equipped research abilities will reset.\nYou keep your cosmetics, Scrap and permanent Prestige Points.\nYou gain '+reward+' Prestige Point'+(reward===1?'':'s')+', +1,000 starting gold, and permanent earnings multipliers at Prestige 1, 10, 20 and 40.\n\nThis cannot be undone.'))return;
  // Preserve player settings and cosmetic purchases, not gameplay progression.
  const next=level+1,points=prestigePoints()+reward;
  const retained={keybinds:save.keybinds,scrap:save.scrap,customShip:save.customShip,customOwned:save.customOwned,customSlots:save.customSlots,prestigeNodes:{...save.prestigeNodes,'pr-root':true}};
  save={...defaults,...retained,
   prestigeLevel:next,prestigePoints:points,prestigePointScheduleVersion:2,prestigeNodes:retained.prestigeNodes,
   gold:1000,core:0,speed:0,fuel:0,returnfuel:0,hullbonus:0,selectedClass:'hoarder',
   shipLevels:{},shipSpent:{},luckLevels:{},luckSpent:{},bonusLevels:{},bonusSpent:{},profitLevels:{},profitSpent:{},radarLevels:{},radarSpent:{},legacySpent:{},
   abilityLoadout:['dedication',null,null,null,null,null,null,null,null,null],
   brakeSlot:-1,trackerSlot:-1,tasks:[]
  };
  taskInit();customInit();refreshCustomImage();sanitizeLoadout();
  selectedShip='core';persist();updateMenu();renderAbilities();renderGameAbilityBar();renderClasses();centerTree();
  selected='pr-root';enableTab('prestige');renderTree();
 }
 el('prestigeBuy').onclick=purchasePrestige;
 window.updatePrestigeUI=function(){
  migratePointSchedule();
  const level=prestigeLevel(),mult=prestigeGoldMultiplier();
  el('prestigeLevelLabel').textContent='PRESTIGE '+level+' / 40 · ×'+mult+' GOLD';
  const button=el('prestigeBuy');
  button.disabled=active||level>=40||save.gold<nextCost();
  button.textContent=level>=40?'MAX PRESTIGE REACHED':'PRESTIGE '+(level+1)+' · '+fmt(nextCost())+' GOLD · +'+pointReward(level+1)+' PP';
  const tab=el('prestigeResearchTab');tab.hidden=level<1;
  if(level<1&&viewTab==='prestige')enableTab('normal');
  if(level>=1&&viewTab==='prestige'){buildTree();renderTree()}
 };
 // Permanent expedition capstone effects. Pathways intentionally remain placeholders.
 let shaulaCooldown=0,alcorClock=5,shaulaZones=[];
 const isClearedRock=rock=>shaulaZones.some(z=>Math.hypot(rock.x-z.x,rock.y-z.y)<=1000);
 function clearShaulaRocks(){
  if(!shaulaZones.length)return;
  rocks=rocks.filter(r=>!isClearedRock(r));
  goldenRocks=goldenRocks.filter(r=>!isClearedRock(r));
  bronzeRocks=bronzeRocks.filter(r=>!isClearedRock(r));
 }
 function updateActionButtons(){
  const shaula=el('shaulaButton'),returnButton=el('alsephinaReturn'),bar=el('prestigeActionBar');
  const canShaula=active&&hasPrestigeCapstone('scorpius');
  const canReturn=active&&phase==='collect'&&hasPrestigeCapstone('vela');
  bar.hidden=!canShaula&&!canReturn;
  shaula.hidden=!canShaula;returnButton.hidden=!canReturn;
  if(canShaula){
   shaula.disabled=shaulaCooldown>0;
   shaula.textContent=shaulaCooldown>0?'SHAULA · '+Math.ceil(shaulaCooldown)+'s':'Q · SHAULA · +100K';
  }
 }
 function activateShaula(){
  if(!active||!hasPrestigeCapstone('scorpius')||shaulaCooldown>0)return;
  shaulaCooldown=10;shaulaZones.push({x:player.x,y:player.y});
  clearShaulaRocks();haul+=100000;audioSound('ability');
  notify('SHAULA — ASTEROIDS ERASED · +100,000 UNBANKED GOLD!');
  updateActionButtons();
 }
 function activateAlsephina(){
  if(!active||phase!=='collect'||!hasPrestigeCapstone('vela'))return;
  enterReturnPhase('ALSEPHINA — RETURN JOURNEY BEGINS!');
  updateActionButtons();
 }
 el('shaulaButton').onclick=activateShaula;
 el('alsephinaReturn').onclick=activateAlsephina;
 addEventListener('keydown',e=>{
  if(!active||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select'))return;
  if(e.code==='KeyQ'&&!Object.values(save.keybinds||{}).includes('KeyQ')){e.preventDefault();activateShaula()}
  if(e.code==='KeyR'&&!Object.values(save.keybinds||{}).includes('KeyR')){e.preventDefault();activateAlsephina()}
 });
 window.prestigeCapstoneRunStart=function(){shaulaCooldown=0;alcorClock=5;shaulaZones=[];updateActionButtons()};
 window.prestigeCapstoneRunEnd=function(){shaulaZones=[];updateActionButtons()};
 window.prestigeCapstoneTick=function(dt){
  if(!active)return;
  if(shaulaCooldown>0)shaulaCooldown=Math.max(0,shaulaCooldown-dt);
  if(hasPrestigeCapstone('ursa')){
   alcorClock-=dt;
   if(alcorClock<=0){
    alcorClock+=5;
    let collected=0;
    for(let i=crates.length-1;i>=0;i--){
     const c=crates[i];
     if(Math.hypot(c.x-player.x,c.y-player.y)>750)continue;
     crates.splice(i,1);collectCrate(c);collected++;
    }
    if(collected)notify('ALCOR — '+collected+' CRATES AUTOMATICALLY COLLECTED');
   }
  }
  clearShaulaRocks();updateActionButtons();
 };
 window.updatePrestigeUI();
})();