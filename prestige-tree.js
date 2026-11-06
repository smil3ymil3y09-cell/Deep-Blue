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
  draco:'Eltanin — The Dragon’s Hoard: EQUIP this active ability in a numbered slot and activate once each expedition to arm a ×25 final banked gold multiplier on successful return.',
  scorpius:'Shaula — The Scorpion’s Sting: equip this legendary ability in a numbered slot to erase asteroids within 1,000 units and add 100,000 unbanked gold to your haul. 10-second cooldown.',
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
 // Draco / Greed: 13 permanent passives and 2 numbered-slot active abilities.
 const GREED=[
  ['GILDED CONTRACT','PASSIVE · All crates give ×2 gold before other earnings bonuses.'],
  ['MIDAS TOUCH','PASSIVE · Every 10th crate collected becomes a Gilded Crate worth ×20 normal gold.'],
  ['DRAGON’S VAULT','PASSIVE · Every 20 seconds away from the station, unbanked gold compounds by +2%.'],
  ['METAL ALCHEMY','PASSIVE · Every 8th ordinary asteroid destroyed (including by DAN and Shaula) creates a bronze asteroid for 60 seconds.'],
  ['ROYAL DEPOSITS','PASSIVE · Each generated Golden, Obsidian and Magma formation contains an extra Crown Crate worth 250 base gold.'],
  ['BLOOD TAX','PASSIVE · Disabling an outpost awards an additional 2,000 unbanked gold.'],
  ['EMERGENCY TREASURY','PASSIVE · Recover 25% of adjusted expedition earnings on failure, without Eltanin.'],
  ['GOLDEN EPIDEMIC','PASSIVE · Bronze asteroids generate ×10 gold and can convert a nearby ordinary asteroid into another bronze asteroid every 15 seconds.'],
  ['MIDAS SURGE','ACTIVE · Collect five Gilded Crates to charge. Equip and activate from a number slot for ×5 crate earnings over 20 seconds.'],
  ['CROWN CHAMBER','PASSIVE · A bonus Golden Chamber appears around 6,000 distance with a central Crown Crate worth 10,000 gold.'],
  ['ANCIENT TRIBUTE','PASSIVE · All formation crates are worth ×10. Clearing a Golden, Obsidian or Magma formation spawns three rare crates.'],
  ['COMPOUND EMPIRE','PASSIVE · Dragon’s Vault compounds unbanked gold by +10% every 20 seconds instead of +2%.'],
  ['DRAGON’S TRIBUTE','PASSIVE · Blood Tax now gives 25,000 unbanked gold per disabled outpost and drops five rare crates.'],
  ['UNBREAKABLE VAULT','PASSIVE · Recover 75% of adjusted expedition earnings on failure instead of 25%, without Eltanin.'],
  ['THE LAST LAUGH','ACTIVE · Equip and activate during the last 10 seconds of the return countdown. Dock successfully for ×10 final banked gold.']
 ];
 const greedNodes=TREE.filter(n=>n.path==='draco'&&!n.capstone);
 if(greedNodes.length!==GREED.length)throw new Error('Greed pathway requires 15 upgrades');
 greedNodes.forEach((n,i)=>{n.name=GREED[i][0];n.desc=GREED[i][1];n.greed=true;n.greedIndex=i+1});
 // Approved Scorpius route. Upgrade indices map to the binary 1-2-4-8 star path.
 const WRATH=[
  ['DAN · DESTROY ASTEROID NANOBOT','A permanent autonomous companion follows your ship, navigates among asteroids and destroys one nearby ordinary asteroid every 8 seconds. 600-unit hunting range.'],
  ['HIVE PROTOCOL','Deploy a second independent DAN nanobot. Each follows, finds targets and destroys asteroids independently.'],
  ['CHUNKSHIFT','Equip this active ability in a numbered slot to teleport to a randomly chosen Golden, Obsidian or Magma asteroid formation generated in the current expedition. Momentum is preserved; 60-second recharge.'],
  ['TACTICAL INTELLIGENCE','DAN prioritises asteroids on your flight path, selecting threats ahead of your moving ship instead of merely choosing the closest.'],
  ['SELF-REPLICATION','Increase your permanent DAN swarm from two to four independent nanobots.'],
  ['EXTINCTION PULSE','Equip this active ability in a numbered slot to instantly erase all asteroids on screen. This screen-wide destructive ability has a 30-second cooldown.'],
  ['DOUBLE JUMP','Chunkshift stores two independent charges, each recharging every 60 seconds.'],
  ['INTERCEPTOR MODE','DAN actively hunts and intercepts nearby hostile outpost projectiles before they reach your ship.'],
  ['OUTPOST ASSASSIN','DAN can identify active hostile outposts, approach them and disable them, awarding normal outpost bounties.'],
  ['RECURSIVE SWARM','Every 25 asteroids destroyed by DAN generates another nanobot for this expedition, up to 12 total nanobots.'],
  ['CHAIN REACTION','When a DAN nanobot destroys an asteroid, the blast can destroy two other nearby ordinary asteroids.'],
  ['BULLET ERASURE','Extinction Pulse also erases every hostile projectile currently visible on screen.'],
  ['SCORCHED SECTOR','For 15 seconds after Extinction Pulse, erased regions of the screen cannot regenerate new ordinary asteroids.'],
  ['TARGETED LANDING','Chunkshift opens a formation list so you can choose a specific generated Golden, Obsidian or Magma location instead of jumping to a random one.'],
  ['METEORIC ARRIVAL','Every Chunkshift arrival creates an impact shockwave that destroys asteroids within a 300-unit radius.']
 ];
 const wrathNodes=TREE.filter(n=>n.path==='scorpius'&&!n.capstone);
 if(wrathNodes.length!==WRATH.length)throw new Error('Wrath pathway requires 15 upgrades');
 wrathNodes.forEach((n,i)=>{n.name=WRATH[i][0];n.desc=WRATH[i][1];n.wrath=true;n.wrathIndex=i+1});
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
 function owned(id){const n=BY_ID[id];return id==='pr-root'?prestigeLevel()>0:!!n&&prestigeLevel()>=(n.capstone?20:1)&&save.prestigeNodes?.[id]===true}
 function canBuy(n){return !active&&!owned(n.id)&&prestigePoints()>=1&&(n.capstone?prestigeLevel()>=20:(n.wrath||n.greed)&&prestigeLevel()>=1&&owned(n.parent))}
 function purchaseNode(n){
  if(!canBuy(n))return;
  save.prestigePoints-=1;
  (save.prestigeNodes??={})[n.id]=true;
  const newlyUnlocked=n.id==='pr-scorpius-2-1'?'chunkshift':n.id==='pr-scorpius-3-2'?'extinction':n.id==='pr-scorpius-capstone'?'shaula':n.id==='pr-draco-4-1'?'midas':n.id==='pr-draco-4-7'?'lastlaugh':n.id==='pr-draco-capstone'?'eltanin':null;
  if(newlyUnlocked)autoEquipPrestigeAbility(newlyUnlocked);
  persist();renderTree();renderClasses();renderAbilities();renderGameAbilityBar();window.updatePrestigeUI?.();
 }
 function lockMessage(n){
  if(owned(n.id))return '★ PERMANENTLY UNLOCKED';
  if(n.capstone)return prestigeLevel()<20?'LOCKED — Reach Prestige 20 to purchase this capstone.':'Legendary capstone available for purchase.';
  if(!n.wrath&&!n.greed)return 'COMING SOON — cannot purchase this pathway yet.';
  if(prestigeLevel()<1)return 'LOCKED — Prestige once to unlock the research tree.';
  if(!owned(n.parent))return 'LOCKED — First purchase '+BY_ID[n.parent].name+'.';
  if(prestigePoints()<1)return 'NEED 1 PRESTIGE POINT';
  return 'READY TO PURCHASE · Permanent research';
 }
 function enableTab(tab){
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
   btn.setAttribute('aria-label',n.root?'A New Beginning':n.capstone?n.name+' legendary capstone':n.wrath?n.name+' permanent Wrath upgrade':n.greed?n.name+' permanent Greed upgrade':PATHS.find(p=>p.id===n.path).label+' pathway, coming soon');
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
  el('prestigeTreeCount').textContent=TREE.filter(n=>owned(n.id)).length+' / 81';
  for(const btn of el('prestigeNodes').children){
   const n=BY_ID[btn.dataset.node];const active=selected===n.id;
   btn.classList.toggle('selected',active);btn.classList.toggle('owned',owned(n.id));
   btn.innerHTML='<b>'+(n.root?'✦':n.capstone?'★':'✧')+' '+n.name+'</b><small>'+(n.root?(owned(n.id)?'UNLOCKED · FREE':'LOCKED'):owned(n.id)?'★ OWNED':n.capstone?(prestigeLevel()<20?'LOCKED · PRESTIGE 20':'AVAILABLE · 1 PP'):(n.wrath||n.greed)?(canBuy(n)?'AVAILABLE · 1 PP':prestigeLevel()<1?'LOCKED · PRESTIGE 1':!owned(n.parent)?'LOCKED · PREREQUISITE':'NEED 1 PP'):'COMING SOON')+'</small>';
  }
  const n=BY_ID[selected],path=PATHS.find(p=>p.id===n.path);
  const heading=n.root?'A NEW BEGINNING':n.capstone?n.name:(n.wrath||n.greed)?n.name:(path.constellation+' · '+path.label);
  el('prestigeDetail').innerHTML='<h3>'+heading+'</h3><p>'+n.desc+'</p><p>'+(n.root?'Free upon your first prestige · Permanent':n.capstone?'Legendary star capstone · 1 Prestige Point · Requires Prestige 20':(n.wrath||n.greed)?(n.wrath?'Scorpius · Wrath':'Draco · Greed')+' pathway · 1 Prestige Point · Permanent':'Pathway upgrade · 1 Prestige Point when released')+'</p><p>'+ (n.root?(owned(n.id)?'✓ Unlocked':'Prestige once to unlock'):lockMessage(n))+'</p>';
  if(n.capstone||n.wrath||n.greed){
   const button=document.createElement('button');button.type='button';
   button.textContent=owned(n.id)?'PERMANENTLY OWNED':n.capstone&&prestigeLevel()<20?'REQUIRES PRESTIGE 20':!n.capstone&&!owned(n.parent)?'UNLOCK PREVIOUS NODE':'UNLOCK UPGRADE · 1 PP';
   button.disabled=!canBuy(n);
   button.onclick=()=>purchaseNode(n);
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
 el('prestigeOpen').onclick=()=>{enableTab('prestige');el('prestigeResearch').scrollIntoView({behavior:'smooth',block:'start'})};
 function purchasePrestige(){
  if(active||prestigeLevel()>=40)return;
  const cost=nextCost(),level=prestigeLevel();
  if(save.gold<cost)return;
  const reward=pointReward(level+1);
  if(!window.confirm('PRESTIGE '+(level+1)+'?\n\nCost: '+fmt(cost)+' gold.\nAll gold, regular research, discovered formations and equipped research abilities will reset.\nYou keep your cosmetics, Scrap and permanent Prestige Points.\nYou gain '+reward+' Prestige Point'+(reward===1?'':'s')+', +1,000 starting gold, and permanent earnings multipliers at Prestige 1, 10, 20 and 40.\n\nThis cannot be undone.'))return;
  // Preserve player settings and cosmetic purchases, not gameplay progression.
  const next=level+1,points=prestigePoints()+reward;
  const equippedPermanent=Array.from({length:10},(_,i)=>['dedication','chunkshift','extinction','shaula','midas','lastlaugh','eltanin'].includes(save.abilityLoadout?.[i])?save.abilityLoadout[i]:null);
  if(!equippedPermanent.includes('dedication')){
   const free=equippedPermanent.indexOf(null);
   if(free>=0)equippedPermanent[free]='dedication';
  }
  const retained={keybinds:save.keybinds,scrap:save.scrap,customShip:save.customShip,customOwned:save.customOwned,customSlots:save.customSlots,prestigeNodes:{...save.prestigeNodes,'pr-root':true},prestigeAbilitySlotsVersion:2};
  save={...defaults,...retained,
   prestigeLevel:next,prestigePoints:points,prestigePointScheduleVersion:2,prestigeNodes:retained.prestigeNodes,prestigeAbilitySlotsVersion:2,
   gold:1000,core:0,speed:0,fuel:0,returnfuel:0,hullbonus:0,selectedClass:'hoarder',
   shipLevels:{},shipSpent:{},luckLevels:{},luckSpent:{},bonusLevels:{},bonusSpent:{},profitLevels:{},profitSpent:{},radarLevels:{},radarSpent:{},legacySpent:{},
   abilityLoadout:equippedPermanent,
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
  const tab=el('prestigeResearchTab');tab.hidden=false;
  el('prestigePreview').hidden=level>=1;
  if(viewTab==='prestige'){buildTree();renderTree()}
 };
 // Permanent expedition capstone effects. Pathways intentionally remain placeholders.
 let shaulaCooldown=0,alcorClock=5,shaulaZones=[];
 const isClearedRock=rock=>shaulaZones.some(z=>Math.hypot(rock.x-z.x,rock.y-z.y)<=1000);
 function clearShaulaRocks(){
  if(!shaulaZones.length)return;
  const affected=new Set();
  for(const r of rocks)if(isClearedRock(r)){window.dracoRockDestroyed?.(r);window.wrathRecordDestroyed?.(r);if(r.chunk)affected.add(r.chunk)}
  rocks=rocks.filter(r=>!isClearedRock(r));
  for(const key of affected)if(!rocks.some(r=>r.chunk===key))window.wrathMarkEmptyChunk?.(key);
  goldenRocks=goldenRocks.filter(r=>!isClearedRock(r));
  bronzeRocks=bronzeRocks.filter(r=>r.dracoLife!==undefined||!isClearedRock(r));
 }
 function updateActionButtons(){
  const returnButton=el('alsephinaReturn'),bar=el('prestigeActionBar');
  const canReturn=active&&phase==='collect'&&hasPrestigeCapstone('vela');
  returnButton.hidden=!canReturn;
  bar.hidden=!canReturn;
 }
 function activateShaula(){
  if(!active||!hasPrestigeCapstone('scorpius')||!equipped('shaula')||shaulaCooldown>0)return;
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
 window.prestigeActivateShaula=activateShaula;
 window.prestigeShaulaStatus=()=>({ready:shaulaCooldown<=0,label:shaulaCooldown>0?Math.ceil(shaulaCooldown)+'s':'READY'});
 el('alsephinaReturn').onclick=activateAlsephina;
 addEventListener('keydown',e=>{
  if(!active||e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select'))return;
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