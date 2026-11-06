/* Deep Blue — Draco / Greed permanent prestige route.
 * D01–D15: 13 passives + 2 numbered-slot abilities; Eltanin is a third active.
 * This module owns expedition-only timers and exposes narrowly scoped hooks.
 */
(function(){
 'use strict';
 const paths=[
  'pr-draco-1-0','pr-draco-2-0','pr-draco-2-1',
  'pr-draco-3-0','pr-draco-3-1','pr-draco-3-2','pr-draco-3-3',
  'pr-draco-4-0','pr-draco-4-1','pr-draco-4-2','pr-draco-4-3',
  'pr-draco-4-4','pr-draco-4-5','pr-draco-4-6','pr-draco-4-7'
 ];
 const has=n=>(Number(save.prestigeLevel)||0)>=1&&save.prestigeNodes?.[paths[n-1]]===true;
 const capstone=()=>hasPrestigeCapstone('draco');
 const distance=(x,y,a,b)=>Math.hypot(x-a,y-b);
 const bronzeCap=90;
 let collected=0,gilded=0,midasCharges=0,midasTime=0;
 let vaultClock=0,bronzeClock=0,rockKills=0,lastLaughArmed=false,eltaninArmed=false;
 let dracoRun=false,pendingBronze=[];
 function reset(){
  dracoRun=true;collected=0;gilded=0;midasCharges=0;midasTime=0;
  vaultClock=0;bronzeClock=0;rockKills=0;pendingBronze=[];lastLaughArmed=false;eltaninArmed=false;
 }
 function end(){dracoRun=false}
 function injectCrown(form,amount){
  if(!form||!Number.isFinite(form.x)||!Number.isFinite(form.y))return;
  // Golden formation mazes have a permanently open central 3x3 corridor.
  // Keep the crown at a free position and attach it to completion tracking.
  const offsets=[[0,0],[52,0],[-52,0],[0,52],[0,-52],[52,52],[-52,-52]];
  const found=offsets.find(([ox,oy])=>
   goldenRocks.every(r=>Math.abs(form.x+ox-r.x)>(r.s/2+17)||Math.abs(form.y+oy-r.y)>(r.s/2+17))&&
   crates.every(c=>distance(form.x+ox,form.y+oy,c.x,c.y)>29)
  );
  const [ox,oy]=found||[0,0];
  const crate={x:form.x+ox,y:form.y+oy,rare:true,kind:form.type,value:amount,
   dracoCrown:true,rot:0,formation:true};
  form.crates.push(crate);crates.push(crate);
 }
 function formationsReady(){
  if(has(10)){
   // Guaranteed second Golden Chamber around 6,000 units.
   const angle=Math.random()*Math.PI*2;
   makeGoldenCache(Math.cos(angle)*6000,Math.sin(angle)*6000,'golden');
   const form=specialFormations[specialFormations.length-1];
   form.dracoExtraChamber=true;
   injectCrown(form,10000);
  }
  if(has(5)){
   for(const f of specialFormations)injectCrown(f,250);
  }
 }
 function crateBonus(c,originalValue){
  if(!dracoRun)return originalValue;
  collected++;
  let mult=has(1)?2:1;
  if(has(2)&&collected%10===0){
   gilded++;
   mult*=20;
   notify('MIDAS TOUCH · GILDED CRATE ×20!');
   if(has(9)&&gilded%5===0){
    midasCharges=1;
    notify('MIDAS SURGE CHARGED · EQUIP AND ACTIVATE!');
   }
  }
  if(has(11)&&c.formation&&['golden','obsidian','magma'].includes(c.kind))mult*=10;
  if(midasTime>0&&equipped('midas'))mult*=5;
  return originalValue*mult;
 }
 function outpostBonus(){
  if(!dracoRun)return 0;
  return has(13)?25000:has(6)?2000:0;
 }
 function outpostCrates(o){
  if(!dracoRun||!has(13))return;
  for(let i=0;i<5;i++){
   const angle=(i/5)*Math.PI*2;
   const x=o.x+Math.cos(angle)*120,y=o.y+Math.sin(angle)*120;
   if(withinWorld(x,y)&&!altarContains(x,y))crates.push({x,y,rare:true,kind:'golden',value:12,rot:0});
  }
 }
 function bronzeFromRock(rock){
  if(!rock||!Number.isFinite(rock.x)||!Number.isFinite(rock.y))return false;
  if(bronzeRocks.length>=bronzeCap||!withinWorld(rock.x,rock.y))return false;
  bronzeRocks.push({x:rock.x,y:rock.y,s:60,bronze:true,vx:0,vy:0,
    spawnedInBelt:false,flyIn:false,dracoLife:60,dracoPropagate:15,sparkPhase:0});
  return true;
 }
 // Include Wrath DAN / Pulse / Shaula and ship disintegration. Each rock can count once.
 const counted=new WeakSet();
 function destroyedRock(r){
  if(!dracoRun||!has(4)||!r||r.bronze||r.golden||counted.has(r))return;
  counted.add(r);rockKills++;
  if(rockKills%8===0)pendingBronze.push({x:r.x,y:r.y});
 }
 function tick(dt){
  if(!dracoRun||!active)return;
  for(const r of pendingBronze)bronzeFromRock(r);
  pendingBronze=[];
  if(midasTime>0)midasTime=Math.max(0,midasTime-dt);
  if(has(3)&&distance(player.x,player.y,station.x,station.y)>station.r){
   vaultClock+=dt;
   while(vaultClock>=20){
    vaultClock-=20;
    haul*=has(12)?1.10:1.02;
    notify(has(12)?'COMPOUND EMPIRE · +10% HAUL':'DRAGON’S VAULT · +2% HAUL');
   }
  }else vaultClock=0;
  // Bronze rocks produced by Metal Alchemy expire after one minute.
  for(const b of bronzeRocks)if(b.dracoLife!==undefined)b.dracoLife-=dt;
  bronzeRocks=bronzeRocks.filter(b=>b.dracoLife===undefined||b.dracoLife>0);
  if(has(8)){
   bronzeClock+=dt;
   while(bronzeClock>=15){
    bronzeClock-=15;
    // Each bronze rock converts a nearby grey rock; propagation remains
    // constrained to loaded rocks so it cannot create an infinite offscreen field.
    for(const b of bronzeRocks.slice()){
     if(bronzeRocks.length>=bronzeCap)break;
     const targets=rocks.filter(r=>distance(b.x,b.y,r.x,r.y)<=370);
     if(!targets.length)continue;
     targets.sort((x,y)=>distance(x.x,x.y,b.x,b.y)-distance(y.x,y.y,b.x,b.y));
     const r=targets[0],index=rocks.indexOf(r);
     if(index<0)continue;
     window.wrathRecordDestroyed?.(r);rocks.splice(index,1);
     if(r.chunk&&!rocks.some(other=>other.chunk===r.chunk))window.wrathMarkEmptyChunk?.(r.chunk);
     bronzeFromRock(r);
    }
   }
  }
 }
 function bronzeMultiplier(){return dracoRun&&has(8)?10:1}
 function formationCleared(form){
  if(!dracoRun||!has(11)||!form||form.dracoTribute)return;
  form.dracoTribute=true;
  for(let i=0;i<3;i++){
   const angle=i*2*Math.PI/3,rad=48;
   const x=form.x+Math.cos(angle)*rad,y=form.y+Math.sin(angle)*rad;
   if(withinWorld(x,y)){
    crates.push({x,y,rare:true,kind:form.type,value:form.type==='golden'?12:form.type==='obsidian'?30:100,formation:false,rot:0});
   }
  }
  notify('ANCIENT TRIBUTE · THREE RARE CRATES SPAWNED!');
 }
 function activateMidas(){
  if(!dracoRun||!active||!has(9)||!equipped('midas')||midasCharges<1||midasTime>0)return false;
  midasCharges=0;midasTime=20;notify('MIDAS SURGE · ×5 CRATES FOR 20s!');audioSound('ability');return true;
 }
 function activateLaugh(){
  if(!dracoRun||!active||!has(15)||!equipped('lastlaugh')||lastLaughArmed||phase!=='return'||remaining<=0||remaining>10)return false;
  lastLaughArmed=true;notify('THE LAST LAUGH ARMED · RETURN FOR ×10 GOLD!');audioSound('ability');return true;
 }
 function activateEltanin(){
  if(!dracoRun||!active||!capstone()||!equipped('eltanin')||eltaninArmed)return false;
  eltaninArmed=true;notify('ELTANIN ARMED · ×25 GOLD ON SUCCESSFUL RETURN!');audioSound('ability');return true;
 }
 function status(id){
  if(id==='midas')return {ready:dracoRun&&has(9)&&midasCharges>0&&midasTime<=0,
   label:midasTime>0?'ACTIVE '+Math.ceil(midasTime)+'s':midasCharges?'CHARGED':gilded%5+'/5 GILDED'};
  if(id==='lastlaugh')return {ready:dracoRun&&has(15)&&phase==='return'&&remaining>0&&remaining<=10&&!lastLaughArmed,
   label:lastLaughArmed?'ARMED':phase==='return'?'LAST 10s':'WAITING'};
  if(id==='eltanin')return {ready:dracoRun&&capstone()&&!eltaninArmed,label:eltaninArmed?'ARMED':'READY'};
  return null;
 }
 function finalMultiplier(success){
  return success?(lastLaughArmed&&has(15)&&equipped('lastlaugh')?10:1)*(eltaninArmed&&capstone()&&equipped('eltanin')?25:1):1;
 }
 function recoveryRate(){return dracoRun&&has(14)?.75:dracoRun&&has(7)?.25:0}
 window.dracoHas=has;
 window.dracoStart=reset;
 window.dracoEnd=end;
 window.dracoTick=tick;
 window.dracoFormationsReady=formationsReady;
 window.dracoCrateBonus=crateBonus;
 window.dracoOutpostBonus=outpostBonus;
 window.dracoOutpostCrates=outpostCrates;
 window.dracoRockDestroyed=destroyedRock;
 window.dracoFormationCleared=formationCleared;
 window.dracoBronzeMultiplier=bronzeMultiplier;
 window.dracoActivateMidas=activateMidas;
 window.dracoActivateLastLaugh=activateLaugh;
 window.dracoActivateEltanin=activateEltanin;
 window.dracoAbilityStatus=status;
 window.dracoFinalMultiplier=finalMultiplier;
 window.dracoRecoveryRate=recoveryRate;
 window.dracoDebug=()=>({collected,gilded,midasCharges,midasTime,vaultClock,bronzeClock,rockKills,lastLaughArmed,eltaninArmed});
})();