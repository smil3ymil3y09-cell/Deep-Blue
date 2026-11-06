/* DEEP BLUE — SCORPIUS / WRATH. 15 purchased prestige research upgrades.
   Only this constellation is implemented here. All state below is per expedition. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 // Star positions in the existing 1 → 2 → 4 → 8 constellation layout.
 const IDS=['pr-scorpius-1-0','pr-scorpius-2-0','pr-scorpius-2-1',
 'pr-scorpius-3-0','pr-scorpius-3-1','pr-scorpius-3-2','pr-scorpius-3-3',
 'pr-scorpius-4-0','pr-scorpius-4-1','pr-scorpius-4-2','pr-scorpius-4-3',
 'pr-scorpius-4-4','pr-scorpius-4-5','pr-scorpius-4-6','pr-scorpius-4-7'];
 const has=n=>(Number(save.prestigeLevel)||0)>=1&&save.prestigeNodes?.[IDS[n-1]]===true;
 let drones=[],destroyed=new Set(),emptyChunks=new Set(),zones=[],effects=[];
 let danKills=0,pulseCooldown=0,shiftCharges=0,shiftRecharge=0,navOpen=false;
 const SHOOT_INTERVAL=8,SHIFT_COOLDOWN=60,PULSE_COOLDOWN=30;
 const len=(x,y)=>Math.hypot(x,y);
 const near=(a,b,dist)=>len(a.x-b.x,a.y-b.y)<=dist;
 const bounded=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&withinWorld(x,y)&&!altarContains(x,y);
 const anyRock=(x,y,r=55)=>[...rocks,...goldenRocks,...bronzeRocks].some(a=>Math.abs(a.x-x)<r+a.s/2&&Math.abs(a.y-y)<r+a.s/2);
 const inZone=(x,y,z)=>Math.abs(x-z.x)<=z.halfW&&Math.abs(y-z.y)<=z.halfH;
 const activeZone=(x,y)=>zones.some(z=>inZone(x,y,z));
 const markRock=r=>{if(r.id)destroyed.add(r.id)};
 function checkEmptyChunk(key){
  if(key&&!rocks.some(r=>r.chunk===key))emptyChunks.add(key);
 }
 function removeOrdinary(r,source){
  const i=rocks.indexOf(r);
  if(i<0)return false;
  window.dracoRockDestroyed?.(r);
  rocks.splice(i,1);markRock(r);checkEmptyChunk(r.chunk);
  if(source==='dan'){
   danKills++;
   if(has(10)&&danKills%25===0&&drones.length<12)createDrone(true);
  }
  effects.push({x:r.x,y:r.y,t:.3,r:30,color:source==='dan'?'#ff7a85':'#ffb4b4'});
  return true;
 }
 function destroyRadius(x,y,radius,source){
  const take=r=>len(r.x-x,r.y-y)<=radius;
  for(const r of rocks.slice())if(take(r))removeOrdinary(r,source);
  goldenRocks=goldenRocks.filter(r=>!take(r));
  bronzeRocks=bronzeRocks.filter(r=>!take(r));
 }
 function createDrone(temporary=false){
  const a=drones.length*2.39996;
  drones.push({x:player.x+Math.cos(a)*35,y:player.y+Math.sin(a)*35,
   vx:0,vy:0,aiClock:0,target:null,shootClock:0,interceptClock:0,temporary});
 }
 function expectedDrones(){return !has(1)?0:has(5)?4:has(2)?2:1}
 function direction(){
  if(flightWASD&&!isMobile){
   const dx=Number(pressedKeys.has('KeyD'))-Number(pressedKeys.has('KeyA'));
   const dy=Number(pressedKeys.has('KeyS'))-Number(pressedKeys.has('KeyW'));
   if(len(dx,dy)>.1)return {x:dx/len(dx,dy),y:dy/len(dx,dy)};
  }
  const speed=len(player.vx,player.vy);
  if(speed>2)return {x:player.vx/speed,y:player.vy/speed};
  const dx=mouse.x-W/2,dy=mouse.y-H/2;
  if(len(dx,dy)>5)return {x:dx/len(dx,dy),y:dy/len(dx,dy)};
  return {x:0,y:-1};
 }
 function chooseTarget(bot){
  let best=null,score=Infinity;
  const ahead=direction(),velocity=len(player.vx,player.vy);
  // A genuine target selection policy: proximity, projected collision path,
  // and outposts if the associated technology has been researched.
  for(const r of rocks){
   if(len(r.x-player.x,r.y-player.y)>600)continue;
   const d=len(r.x-bot.x,r.y-bot.y),fromPlayer=len(r.x-player.x,r.y-player.y);
   let value=d*.8+fromPlayer*.25;
   if(has(4)&&velocity>35){
    const dot=((r.x-player.x)*ahead.x+(r.y-player.y)*ahead.y)/Math.max(1,fromPlayer);
    if(dot>.65)value-=260*dot;
   }
   if(value<score){best={type:'rock',obj:r};score=value}
  }
  if(has(9)){
   for(const o of outposts){
    if(!o.active||disabledOutpostKeys.has(o.key)||len(o.x-player.x,o.y-player.y)>750)continue;
    const value=len(o.x-bot.x,o.y-bot.y)*.7-95;
    if(value<score){best={type:'outpost',obj:o};score=value}
   }
  }
  if(has(8)){
   for(const b of outpostBullets){
    if(len(b.x-player.x,b.y-player.y)>360)continue;
    const value=len(b.x-bot.x,b.y-bot.y)*.6-200;
    if(value<score){best={type:'bullet',obj:b};score=value}
   }
  }
  return best;
 }
 function validTarget(t){
  if(!t)return false;
  if(t.type==='rock')return rocks.includes(t.obj);
  if(t.type==='outpost')return t.obj.active&&!disabledOutpostKeys.has(t.obj.key);
  return outpostBullets.includes(t.obj);
 }
 function shootDanRock(r){
  const x=r.x,y=r.y;
  if(!removeOrdinary(r,'dan'))return;
  if(has(11)){
   const neighbours=rocks.filter(a=>len(a.x-x,a.y-y)<145).sort((a,b)=>len(a.x-x,a.y-y)-len(b.x-x,b.y-y)).slice(0,2);
   for(const other of neighbours)removeOrdinary(other,'dan');
  }
 }
 function tickDrones(dt){
  if(!has(1))return;
  while(drones.length<expectedDrones())createDrone();
  for(let i=0;i<drones.length;i++){
   const bot=drones[i];
   bot.shootClock=Math.max(0,bot.shootClock-dt);
   bot.interceptClock=Math.max(0,bot.interceptClock-dt);
   bot.aiClock-=dt;
   if(bot.aiClock<=0||!validTarget(bot.target)){
    bot.target=chooseTarget(bot);bot.aiClock=.25+i*.018;
   }
   const target=bot.target?.obj;
   // Catch up if the player teleports or accelerates far beyond nanobot speed.
   if(len(bot.x-player.x,bot.y-player.y)>1900){
    bot.x=player.x+(i%3-1)*26;bot.y=player.y-70-Math.floor(i/3)*22;
    bot.vx=player.vx;bot.vy=player.vy;bot.target=null;
   }
   let toX=target?.x??(player.x-45+(i%4)*30);
   let toY=target?.y??(player.y+85+Math.floor(i/4)*26);
   // Avoid nearby non-target obstacles with repulsion, not scripted teleporting.
   let avoidX=0,avoidY=0;
   for(const r of rocks){
    if(target===r)continue;
    const dx=bot.x-r.x,dy=bot.y-r.y,dist=len(dx,dy);
    const safe=75+r.s*.55;
    if(dist<safe&&dist>.01){const strength=(safe-dist)/safe;avoidX+=dx/dist*strength*2;avoidY+=dy/dist*strength*2}
   }
   const dx=toX-bot.x,dy=toY-bot.y,dist=len(dx,dy);
   const norm=Math.max(1,dist);
   const normAvoid=Math.max(1,len(avoidX,avoidY));
   const maxSpeed=Math.max(360,len(player.vx,player.vy)+180);
   const aimX=dx/norm+avoidX/normAvoid*.75,aimY=dy/norm+avoidY/normAvoid*.75;
   const aimLen=Math.max(1,len(aimX,aimY));
   const idealX=aimX/aimLen*Math.min(maxSpeed,Math.max(55,dist*2.8));
   const idealY=aimY/aimLen*Math.min(maxSpeed,Math.max(55,dist*2.8));
   const smooth=1-Math.exp(-5*dt);
   bot.vx+=(idealX-bot.vx)*smooth;bot.vy+=(idealY-bot.vy)*smooth;
   bot.x+=bot.vx*dt;bot.y+=bot.vy*dt;
   if(!target)continue;
   const attackRange=bot.target.type==='outpost'?80:bot.target.type==='bullet'?46:Math.max(50,target.s*.5+16);
   if(len(bot.x-target.x,bot.y-target.y)>attackRange)continue;
   if(bot.target.type==='bullet'&&has(8)&&bot.interceptClock<=0){
    const index=outpostBullets.indexOf(target);
    if(index>=0){outpostBullets.splice(index,1);bot.interceptClock=1.1;
     effects.push({x:target.x,y:target.y,t:.28,r:32,color:'#ffde8f'})}
    bot.target=null;
   }else if(bot.shootClock<=0){
    if(bot.target.type==='rock')shootDanRock(target);
    else if(bot.target.type==='outpost'&&has(9))disableOutpost(target,'DAN');
    bot.shootClock=SHOOT_INTERVAL;bot.target=null;
   }
  }
 }
 function interceptBullets(){
  if(!has(8)||!drones.length)return;
  // Predictive point defence: drones guard their ship even when chasing rocks.
  for(let j=outpostBullets.length-1;j>=0;j--){
   const b=outpostBullets[j];
   if(len(b.x-player.x,b.y-player.y)>320)continue;
   for(const bot of drones){
    if(bot.interceptClock>0)continue;
    const aheadX=b.x+b.vx*.14,aheadY=b.y+b.vy*.14;
    if(len(aheadX-bot.x,aheadY-bot.y)>85&&len(b.x-bot.x,b.y-bot.y)>65&&!(len(b.x-player.x,b.y-player.y)<110&&len(bot.x-player.x,bot.y-player.y)<500))continue;
    outpostBullets.splice(j,1);bot.interceptClock=1.1;
    effects.push({x:b.x,y:b.y,t:.28,r:35,color:'#ffd48b'});
    break;
   }
  }
 }
 function pulse(){
  if(!active||!has(6)||!equipped('extinction')||pulseCooldown>0)return;
  pulseCooldown=PULSE_COOLDOWN;
  const halfW=W/(2*CAMERA_SCALE)+12,halfH=H/(2*CAMERA_SCALE)+12;
  const x=player.x,y=player.y,inside=r=>Math.abs(r.x-x)<=halfW&&Math.abs(r.y-y)<=halfH;
  for(const r of rocks.slice())if(inside(r))removeOrdinary(r,'pulse');
  goldenRocks=goldenRocks.filter(r=>!inside(r));
  bronzeRocks=bronzeRocks.filter(r=>!inside(r));
  if(has(12))outpostBullets=outpostBullets.filter(b=>!inside(b));
  if(has(13))zones.push({x,y,halfW,halfH,t:15});
  effects.push({x,y,t:1,r:Math.max(halfW,halfH),color:'#ff5477',pulse:true});
  audioSound('ability');notify('EXTINCTION PULSE — SCREEN CLEARED!');
 }
 // Chunkshift now travels to a real seeded Golden / Obsidian / Magma formation.
 // Only actual formations from the current expedition are eligible.
 const availableFormations=()=>specialFormations.filter(f=>
  ['golden','obsidian','magma'].includes(f.type)&&
  bounded(f.x,f.y)&&len(f.x-player.x,f.y-player.y)>500
 );
 function safeLanding(f){
  // Formations have a clear central pocket. Try it before spiral samples.
  // Check actual asteroid positions, derelict structures and spawned outposts.
  maintainRockField(f.x,f.y);
  const safe=(x,y)=>{
   if(!bounded(x,y)||rockOverlapsWreck(x,y,52)||rockOverlapsStation(x,y,52)||anyRock(x,y,52))return false;
   const cx=Math.floor(x/OUTPOST_CELL),cy=Math.floor(y/OUTPOST_CELL);
   for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
    const o=validOutpost(cx+ox,cy+oy);
    if(o&&!disabledOutpostKeys.has(o.key)&&len(o.x-x,o.y-y)<145)return false;
   }
   return true;
  };
  if(safe(f.x,f.y))return {x:f.x,y:f.y};
  const angles=16;
  for(const radius of [75,145,230,335,465,630,810,1020]){
   for(let i=0;i<angles;i++){
    const theta=(i+.5)*(Math.PI*2/angles);
    const x=f.x+Math.cos(theta)*radius,y=f.y+Math.sin(theta)*radius;
    if(safe(x,y))return {x,y};
   }
  }
  return null;
 }
 function shiftToFormation(form){
  if(!active||!has(3)||!equipped('chunkshift')||shiftCharges<=0)return false;
  if(!specialFormations.includes(form)){notify('CHUNKSHIFT — TARGET NO LONGER EXISTS!');return false}
  const landing=safeLanding(form);
  if(!landing){notify('CHUNKSHIFT — NO SAFE LANDING IN '+form.type.toUpperCase()+' FORMATION!');return false}
  const from={x:player.x,y:player.y};
  player.x=landing.x;player.y=landing.y;
  shiftCharges--;
  if(shiftCharges<maxCharges()&&shiftRecharge<=0)shiftRecharge=SHIFT_COOLDOWN;
  navOpen=false;$('wrathTargetPanel').hidden=true;
  // Brief protection avoids immediate damage from surviving entry momentum.
  invuln=Math.max(invuln,.8);
  effects.push({x:from.x,y:from.y,t:.5,r:95,color:'#a883ff'});
  effects.push({x:player.x,y:player.y,t:.5,r:105,color:'#ff6688'});
  if(has(15))destroyRadius(player.x,player.y,300,'arrival');
  audioSound('ability');notify('CHUNKSHIFT — '+form.type.toUpperCase()+' FORMATION FOUND!');
  return true;
 }
 function maxCharges(){return has(7)?2:has(3)?1:0}
 function activateShift(){
  if(!active||!has(3)||!equipped('chunkshift')||shiftCharges<=0)return;
  const targets=availableFormations();
  if(!targets.length){notify('CHUNKSHIFT — NO OTHER GOLDEN, OBSIDIAN OR MAGMA FORMATION AVAILABLE!');return}
  if(has(14)){
   navOpen=!navOpen;
   const panel=$('wrathTargetPanel'),grid=$('wrathTargetGrid');
   panel.hidden=!navOpen;
   if(!navOpen)return;
   grid.innerHTML='';
   for(const f of targets){
    const button=document.createElement('button');button.type='button';
    button.textContent=f.type.toUpperCase()+' · '+Math.round(len(f.x-player.x,f.y-player.y)).toLocaleString('en-GB')+'u';
    button.title='Teleport to this '+f.type+' formation';
    button.onclick=()=>shiftToFormation(f);
    grid.appendChild(button);
   }
  }else{
   // Random destination from the actual formations; try all candidates
   // in shuffled order so one obstructed landing does not block the ability.
   const pool=targets.slice();
   while(pool.length){
    const index=Math.floor(Math.random()*pool.length);
    const target=pool.splice(index,1)[0];
    if(shiftToFormation(target))return;
   }
  }
 }
 function abilityStatus(id){
  if(id==='chunkshift')return {
   ready:shiftCharges>0,
   label:shiftCharges+'/'+maxCharges()+(shiftCharges<maxCharges()?' · '+Math.ceil(Math.max(0,shiftRecharge))+'s':'')
  };
  if(id==='extinction')return {ready:pulseCooldown<=0,label:pulseCooldown>0?Math.ceil(pulseCooldown)+'s':'READY'};
  return null;
 }
 function start(){
  drones=[];destroyed=new Set();emptyChunks=new Set();zones=[];effects=[];danKills=0;
  pulseCooldown=0;shiftCharges=maxCharges();shiftRecharge=0;navOpen=false;
  for(let i=0;i<expectedDrones();i++)createDrone();
  $('wrathTargetPanel').hidden=true;
 }
 function end(){drones=[];zones=[];effects=[];navOpen=false;$('wrathTargetPanel').hidden=true}
 function tick(dt){
  if(!active)return;
  if(pulseCooldown>0)pulseCooldown=Math.max(0,pulseCooldown-dt);
  if(shiftCharges<maxCharges()){
   shiftRecharge-=dt;
   if(shiftRecharge<=0){
    shiftCharges++;
    shiftRecharge=shiftCharges<maxCharges()?shiftRecharge+SHIFT_COOLDOWN:0;
   }
  }
  for(const z of zones)z.t-=dt;
  zones=zones.filter(z=>z.t>0);
  if(zones.length){
   for(const r of rocks.slice())if(activeZone(r.x,r.y))removeOrdinary(r,'pulse');
  }
  for(const fx of effects)fx.t-=dt;
  effects=effects.filter(f=>f.t>0);
  tickDrones(dt);
 }
 function draw(camX,camY){
  if(!active)return;
  for(const fx of effects){
   const x=fx.x-camX,y=fx.y-camY;
   ctx.save();ctx.globalAlpha=Math.max(0,Math.min(.65,fx.t));
   ctx.strokeStyle=fx.color;ctx.lineWidth=fx.pulse?8:3;
   ctx.beginPath();ctx.arc(x,y,fx.r*(1.2-Math.min(.65,fx.t)*.4),0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  for(let i=0;i<drones.length;i++){
   const d=drones[i],x=d.x-camX,y=d.y-camY;
   if(Math.abs(x-W/2)>W/CAMERA_SCALE||Math.abs(y-H/2)>H/CAMERA_SCALE)continue;
   ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(d.vy,d.vx));
   ctx.shadowColor=d.temporary?'#ffd05e':'#ff617f';ctx.shadowBlur=18;
   ctx.fillStyle=d.temporary?'#ffc75c':'#ff5577';
   ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-9,-10);ctx.lineTo(-5,0);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();
   ctx.shadowBlur=0;ctx.strokeStyle='#ffe8eb';ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle='#310e28';ctx.fillRect(0,-3,5,6);ctx.restore();
   if(d.target?.obj){
    ctx.save();ctx.strokeStyle='rgba(255,101,138,.17)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(d.target.obj.x-camX,d.target.obj.y-camY);ctx.stroke();ctx.restore();
   }
  }
 }
 // Active powers are triggered through the normal numbered ability slots.
 $('wrathTargetCancel').onclick=()=>{navOpen=false;$('wrathTargetPanel').hidden=true};
 addEventListener('keydown',e=>{
  if(!active||e.code!=='Escape'||!navOpen)return;
  navOpen=false;$('wrathTargetPanel').hidden=true;
 });
 window.wrathActivateShift=activateShift;
 window.wrathActivatePulse=pulse;
 window.wrathAbilityStatus=abilityStatus;
 window.wrathHas=has;
 window.wrathStart=start;
 window.wrathEnd=end;
 window.wrathTick=tick;
 window.wrathDraw=draw;
 window.wrathInterceptBullets=interceptBullets;
 window.wrathSkipRock=(id,x,y)=>destroyed.has(id)||activeZone(x,y);
 window.wrathIsClearedChunk=key=>emptyChunks.has(key);
 window.wrathRecordDestroyed=markRock;
 window.wrathMarkEmptyChunk=key=>{if(key)emptyChunks.add(key)};
 window.wrathDebug=()=>({drones:drones.length,danKills,pulseCooldown,shiftCharges,shiftRecharge,cleared:destroyed.size});
})();
