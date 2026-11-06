/* GEMINI — ABILITIES: 15 independent active powers and legendary Castor. */
(function(){
 'use strict';
 const ids=['loaded','secondheart','mirror','linked','rain','overcharge','absolute','double','restart','blackhole','xray','refund','lastresort','parallel','wildcard'];
 const stars=['1-0','2-0','2-1','3-0','3-1','3-2','3-3','4-0','4-1','4-2','4-3','4-4','4-5','4-6','4-7'];
 const cooldowns=[60,90,75,90,150,45,100,0,0,80,120,180,120,150,0];
 const owned=id=>{const i=ids.indexOf(id);return i>=0&&save.prestigeLevel>=1&&save.prestigeNodes?.['pr-gemini-'+stars[i]]===true};
 const equipped=id=>save.abilityLoadout?.includes(id);
 const capstone=()=>save.prestigeLevel>=20&&save.prestigeNodes?.['pr-gemini-capstone']===true;
 const alive=()=>active&&!ghost;
 let cd={},duration={},used={},anchor=null,linked=false,unstable=0,ghost=false,corpse=null,recovery=null,castor=false;
 let decoy=null,pocket=null,rewindHistory=[],xray=0,blackhole=0,parallel=0,absolute=0,overcharge=0,armedLastResort=false;
 const ready=id=>alive()&&owned(id)&&equipped(id)&&(!cd[id]||cd[id]<=0)&&!used[id]&&!(id==='linked'&&unstable>0);
 function start(){
  cd={};duration={};used={};anchor=null;linked=false;unstable=0;ghost=false;corpse=null;recovery=null;castor=false;
  decoy=null;pocket=null;rewindHistory=[];xray=blackhole=parallel=absolute=overcharge=0;armedLastResort=false;
 }
 function end(){linked=false;ghost=false;castor=false;decoy=null;pocket=null;anchor=null}
 function beginRecovery(){
  if(!active||ghost||!owned('restart')||used.restart||Math.hypot(player.x,player.y)<10000)return false;
  used.restart=true;
  corpse={x:player.x,y:player.y};
  recovery={phase,remaining,haul,hits,shields,velocity:{x:player.vx,y:player.vy}};
  ghost=true;linked=false;anchor=null;player.x=0;player.y=0;player.vx=0;player.vy=0;hits=Math.max(0,maxHull()-1);shields=0;invuln=0;
  notify('RESTART — FIND YOUR SHIP! INFINITE TIME · NO ABILITIES');
  return true;
 }
 function recoveryTick(){
  if(!ghost)return;
  remaining=999999;
  if(Math.hypot(player.x-corpse.x,player.y-corpse.y)<75){
   ghost=false;phase=recovery.phase;remaining=Math.max(1,recovery.remaining);haul=recovery.haul;
   hits=0;shields=recovery.shields;player.vx=recovery.velocity.x;player.vy=recovery.velocity.y;
   invuln=3;corpse=null;recovery=null;notify('RESTART COMPLETE — HULL AND ABILITIES RESTORED!');
  }
 }
 function canCollect(){return !ghost&&unstable<=0}
 function canDamage(){return !ghost&&absolute<=0&&!(armedLastResort&&duration.lastresort>0)}
 function isClass(id){return castor&&capstone()}
 function rate(){return ghost?0:linked?.1:1}
 function acceleration(){return ghost?1:linked||blackhole>0?0:overcharge>0?3:1}
 function lockMovement(){return linked||blackhole>0}
 function playerAim(e){
  if(!linked||!alive())return false;
  const cv=document.getElementById('canvas'),rect=cv.getBoundingClientRect();
  const sx=(e.clientX-rect.left)*cv.width/rect.width,sy=(e.clientY-rect.top)*cv.height/rect.height;
  const tx=player.x+(sx-W/2)/CAMERA_SCALE,ty=player.y+(sy-H/2)/CAMERA_SCALE;
  const dx=tx-player.x,dy=ty-player.y,len=Math.hypot(dx,dy);
  const scale=Math.min(1,1500/(len||1));
  const x=player.x+dx*scale,y=player.y+dy*scale;
  const blocked=!withinWorld(x,y)||rocks.some(r=>Math.abs(r.x-x)<r.s/2+20&&Math.abs(r.y-y)<r.s/2+20)||goldenRocks.some(r=>Math.abs(r.x-x)<r.s/2+20&&Math.abs(r.y-y)<r.s/2+20)||altarContains(x,y);
  return {x,y,blocked};
 }
 function teleport(e){
  if(!linked||!alive())return false;
  const p=playerAim(e);if(!p||p.blocked){notify('LINKED UP — DESTINATION BLOCKED');return true}
  player.x=p.x;player.y=p.y;player.vx=0;player.vy=0;linked=false;unstable=10;cd.linked=90;
  notify('LINKED UP — DESTABILISED · NO COLLECTION FOR 10s');return true;
 }
 function cancelTeleport(){if(linked){linked=false;notify('LINKED UP — CANCELLED');return true}return false}
 function spawnCrates(n,rare){
  for(let i=0;i<n;i++){
   const a=Math.random()*Math.PI*2,d=90+Math.random()*400,x=player.x+Math.cos(a)*d,y=player.y+Math.sin(a)*d;
   if(!withinWorld(x,y)||altarContains(x,y))continue;
   const kind=rare?['golden','obsidian','magma'][Math.floor(Math.random()*3)]:'ordinary';
   crates.push({x,y,kind,rare,value:rare?kind==='magma'?12:kind==='obsidian'?8:3:1,geminiSpawn:true});
  }
 }
 function activate(id,viaWildcard=false){
  if(!alive()||(!viaWildcard&&!owned(id))||(!viaWildcard&&!equipped(id))||(!viaWildcard&&cd[id]>0)||used[id]||id==='restart')return false;
  if(viaWildcard&&id==='wildcard')return false;
  let successful=true;
  switch(id){
   case 'loaded':{
    let changed=0;for(const c of crates){if(Math.hypot(c.x-player.x,c.y-player.y)>600||c.rare||Math.random()>=.2)continue;c.kind=['golden','obsidian','magma'][Math.floor(Math.random()*3)];c.rare=true;c.value=c.kind==='magma'?12:c.kind==='obsidian'?8:3;changed++}
    notify('LOADED DICE — '+changed+' CRATES UPGRADED');break;
   }
   case 'secondheart':{
    const heal=Math.ceil(maxHull()*.5),excess=Math.max(0,heal-hits);hits=Math.max(0,hits-heal);shields=Math.min(5,shields+excess);
    notify('SECOND HEART — HULL RESTORED');break;
   }
   case 'mirror':decoy={x:player.x,y:player.y,t:20};notify('MIRROR IMAGE — DECOY DEPLOYED');break;
   case 'linked':
    if(linked){successful=false;break}
    linked=true;player.vx=0;player.vy=0;notify('LINKED UP — RIGHT CLICK TO TELEPORT · ESC TO CANCEL');break;
   case 'rain':spawnCrates(20,false);spawnCrates(3,true);notify('TREASURE RAIN — 23 CRATES');break;
   case 'overcharge':overcharge=10;notify('OVERCHARGE — TRIPLE ACCELERATION');break;
   case 'absolute':absolute=8;notify('ABSOLUTE ZERO — INTANGIBLE');break;
   case 'double':
    used.double=true;
    if(Math.random()<.5){haul*=2;notify('DOUBLE OR NOTHING — HAUL DOUBLED!')}
    else{haul*=.75;notify('DOUBLE OR NOTHING — 25% HAUL LOST')}
    break;
   case 'blackhole':
    blackhole=12;player.vx=0;player.vy=0;pocket={x:player.x,y:player.y};notify('BLACK HOLE POCKET — IMMOBILISED FOR 12s');break;
   case 'xray':xray=30;notify('X-RAY VISION — TREASURE REVEALED');break;
   case 'refund':
    for(const key of Object.keys(cd))if(key!=='refund'&&key!=='wildcard'&&!used[key])cd[key]=0;
    notify('QUANTUM REFUND — COOLDOWNS RESET');break;
   case 'lastresort':
    if(maxHull()-hits<=1){successful=false;notify('LAST RESORT — INSUFFICIENT HULL');break}
    hits=Math.min(maxHull()-1,hits+Math.ceil((maxHull()-hits)*.5));
    duration.lastresort=20;
    for(const o of outposts)if(o.active&&Math.hypot(o.x-player.x,o.y-player.y)<=1000)disableOutpost(o,'gemini');
    notify('LAST RESORT — 20s INVULNERABILITY');break;
   case 'parallel':parallel=20;notify('PARALLEL UNIVERSE — DUPLICATE EVERY CRATE');break;
   case 'wildcard':{
    if(maxHull()-hits<=1){notify('WILDCARD — NEED AT LEAST TWO HULL');return false}
    const pool=ids.filter(other=>other!=='wildcard'&&other!=='restart'&&!used[other]&&other!=='linked');
    if(!pool.length){notify('WILDCARD — NO AVAILABLE POWERS');return false}
    hits++;const chosen=pool[Math.floor(Math.random()*pool.length)];
    activate(chosen,true);notify('WILDCARD — '+chosen.toUpperCase()+' · -1 HULL');return true;
   }
   default:successful=false;
  }
  if(successful&&id!=='wildcard'&&id!=='restart'&&id!=='double')cd[id]=cooldowns[ids.indexOf(id)];
  return successful;
 }
 function activateCastor(){
  if(!alive()||!capstone()||!equipped('castor')||castor)return false;
  castor=true;notify('CASTOR — ALL FOUR CLASS PERKS ACTIVE');return true;
 }
 function status(id){
  if(id==='restart')return {ready:false,label:ghost?'RECOVER SHIP':used.restart?'USED':'PASSIVE'};
  if(id==='castor')return {ready:alive()&&capstone()&&!castor,label:castor?'ACTIVE':'READY'};
  if(!ids.includes(id))return null;
  return {ready:ready(id),label:ghost?'RECOVER SHIP':used[id]?'USED':id==='linked'&&linked?'AIM · RMB':cd[id]>0?Math.ceil(cd[id])+'s':id==='wildcard'?'-1 HULL':'READY'};
 }
 function onCollect(c){
  if(!alive()||parallel<=0||c.geminiDuplicate)return;
  crates.push({...c,geminiDuplicate:true,x:c.x+36,y:c.y+36,formation:false});
 }
 function onDeath(){return beginRecovery()}
 function tick(dt){
  if(!active)return;
  if(ghost){recoveryTick();return}
  unstable=Math.max(0,unstable-dt);absolute=Math.max(0,absolute-dt);overcharge=Math.max(0,overcharge-dt);blackhole=Math.max(0,blackhole-dt);parallel=Math.max(0,parallel-dt);xray=Math.max(0,xray-dt);
  if(duration.lastresort>0)duration.lastresort=Math.max(0,duration.lastresort-dt);
  for(const id of Object.keys(cd))if(cd[id]>0)cd[id]=Math.max(0,cd[id]-dt);
  if(decoy){decoy.t-=dt;if(decoy.t<=0)decoy=null}
  if(blackhole>0&&pocket){
   for(const c of crates){
    const dx=pocket.x-c.x,dy=pocket.y-c.y,len=Math.hypot(dx,dy);
    if(len>0&&len<=1200){const step=Math.min(len,Math.max(140,1200-len)*dt*2);c.x+=dx/len*step;c.y+=dy/len*step}
   }
  }else pocket=null;
 }
 function draw(camX,camY,ctx){
  ctx.save();
  if(ghost&&corpse){
   ctx.strokeStyle='#83cfff';ctx.lineWidth=4;ctx.shadowColor='#5dd8ff';ctx.shadowBlur=20;
   ctx.beginPath();ctx.arc(corpse.x-camX,corpse.y-camY,30,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#d6f8ff';ctx.font='bold 12px system-ui';ctx.fillText('RECOVER SHIP',corpse.x-camX-45,corpse.y-camY-45);
  }
  if(decoy){ctx.fillStyle='rgba(174,153,255,.55)';ctx.beginPath();ctx.arc(decoy.x-camX,decoy.y-camY,20,0,Math.PI*2);ctx.fill()}
  if(pocket){ctx.strokeStyle='#9d86f5';ctx.lineWidth=4;ctx.beginPath();ctx.arc(pocket.x-camX,pocket.y-camY,50,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
 }
 window.geminiStart=start;window.geminiEnd=end;window.geminiTick=tick;window.geminiDraw=draw;
 window.geminiActivate=activate;window.geminiActivateCastor=activateCastor;window.geminiStatus=status;
 window.geminiOnCollect=onCollect;window.geminiOnDeath=onDeath;window.geminiCanCollect=canCollect;window.geminiCanDamage=canDamage;
 window.geminiIsClass=isClass;window.geminiRate=rate;window.geminiAcceleration=acceleration;window.geminiLockMovement=lockMovement;
 window.geminiGhost=()=>ghost;window.geminiAim=playerAim;window.geminiTeleport=teleport;window.geminiCancelTeleport=cancelTeleport;
 window.geminiDecoy=()=>decoy;window.geminiXray=()=>xray>0;window.geminiLinked=()=>linked;
 window.geminiDebug=()=>({ghost,corpse,castor,linked,unstable,cd:{...cd},used:{...used},absolute,blackhole,parallel});
})();
