/* URSA MAJOR — SLOTH: deliberate exploration, timer relief, manual control. */
(function(){
 'use strict';
 const ids=['1-0','2-0','2-1','3-0','3-1','3-2','3-3','4-0','4-1','4-2','4-3','4-4','4-5','4-6','4-7'];
 const own=n=>!!save.prestigeNodes?.['pr-ursa-'+ids[n-1]]&&save.prestigeLevel>=1;
 const slot=id=>save.abilityLoadout?.includes(id);
 let warp=0,warpCD=0,rest=0,restCD=0,shield=0,alcor=false,alcorClock=5;
 let bonusTime=0,emergencyUsed=false,magnetClock=0,drones=[],lastPhase='collect';
 const hasAlcor=()=>save.prestigeLevel>=20&&save.prestigeNodes?.['pr-ursa-capstone']===true;
 const normalSpeed=()=>Math.hypot(player.vx,player.vy);
 function collectNear(x,y,range,limit){
  let count=0;
  const candidates=crates.map((c,i)=>({c,i,d:Math.hypot(c.x-x,c.y-y)})).filter(e=>e.d<=range).sort((a,b)=>a.d-b.d).slice(0,limit);
  for(const {c} of candidates){const at=crates.indexOf(c);if(at<0)continue;crates.splice(at,1);collectCrate(c);count++}
  return count;
 }
 function start(){
  warp=warpCD=rest=restCD=shield=bonusTime=0;alcor=false;alcorClock=5;emergencyUsed=false;magnetClock=0;lastPhase='collect';
  drones=[{x:player.x,y:player.y,carrying:null},{x:player.x,y:player.y,carrying:null}];
 }
 function activateWarp(){
  if(!active||!slot('timewarp')||!own(5)||warpCD>0)return false;
  warp=own(10)?25:15;warpCD=40;notify(own(10)?'FROZEN UNIVERSE — ASTEROIDS STOPPED':'TIME WARP — ASTEROIDS SLOWED');return true;
 }
 function activateRest(){
  if(!active||!slot('taketime')||!own(7)||restCD>0)return false;
  rest=20;restCD=90;if(own(14))shield=8;
  notify('TAKE YOUR TIME — EXPEDITION CLOCK PAUSED');return true;
 }
 function activateAlcor(){
  if(!active||!hasAlcor()||!slot('alcor')||alcor)return false;
  alcor=true;alcorClock=5;notify('ALCOR — THE UNSEEN HAND AWAKENS');return true;
 }
 function status(id){
  if(id==='timewarp')return {ready:active&&own(5)&&warpCD<=0,label:warp>0?Math.ceil(warp)+'s ACTIVE':warpCD>0?Math.ceil(warpCD)+'s':'READY'};
  if(id==='taketime')return {ready:active&&own(7)&&restCD<=0,label:rest>0?Math.ceil(rest)+'s PAUSED':restCD>0?Math.ceil(restCD)+'s':'READY'};
  if(id==='alcor')return {ready:active&&hasAlcor()&&!alcor,label:alcor?'ACTIVE':'READY'};
  return null;
 }
 function timeRate(){
  if(rest>0&&own(7))return 0;
  return own(2)&&normalSpeed()<300?.5:1;
 }
 function timeBonus(){
  if(!own(4)||phase!=='collect'||!active)return;
  const cap=own(8)?600:120,amount=own(8)?5:2;
  const added=Math.max(0,Math.min(amount,cap-bonusTime));
  remaining+=added;bonusTime+=added;
 }
 function returnTime(base){return own(9)?(base+ (own(1)?30:0))*2:base+(own(1)?30:0)}
 function initialTime(base){return base+(own(1)?30:0)}
 function emergency(){
  if(!own(15)||emergencyUsed||phase!=='return')return false;
  emergencyUsed=true;remaining=120;notify('THE LAZY VOYAGE — 120 EMERGENCY SECONDS!');return true;
 }
 function asteroidSpeed(){return warp>0?(own(10)?0:.15):1}
 function bulletSpeed(){return warp>0&&own(11)?.1:1}
 function outpostSpeed(){return warp>0&&own(11)?.1:1}
 function protectedShip(){return shield>0&&own(14)}
 function droneTick(dt){
  if(!own(13))return;
  for(const d of drones){
   if(!d.carrying&&!d.target){
    const available=crates.filter(c=>!drones.some(other=>other!==d&&other.target===c)&&Math.hypot(c.x-player.x,c.y-player.y)<=900);
    available.sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y));
    if(available.length)d.target=available[0];
   }
   if(d.target&&!crates.includes(d.target))d.target=null;
   const destination=d.carrying?player:d.target||player;
   const dx=destination.x-d.x,dy=destination.y-d.y,len=Math.hypot(dx,dy),step=Math.min(len,600*dt);
   if(len>0){d.x+=dx/len*step;d.y+=dy/len*step}
   if(d.target&&!d.carrying&&Math.hypot(d.x-d.target.x,d.y-d.target.y)<22){
    const c=d.target;d.target=null;
    const i=crates.indexOf(c);if(i>=0){crates.splice(i,1);d.carrying=c}
   }
   if(d.carrying&&Math.hypot(d.x-player.x,d.y-player.y)<25){
    const c=d.carrying;d.carrying=null;collectCrate(c);
   }
   if(!d.carrying&&!d.target&&Math.hypot(d.x-player.x,d.y-player.y)>1500){d.x=player.x;d.y=player.y}
  }
 }
 function draw(camX,camY,ctx){
  if(!active||!own(13))return;
  ctx.save();
  for(const d of drones){ctx.fillStyle='#b5e5ff';ctx.shadowColor='#8ebff1';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(d.x-camX,d.y-camY,8,0,Math.PI*2);ctx.fill()}
  ctx.restore();
 }
 function tick(dt){
  if(!active)return;
  warp=Math.max(0,warp-dt);warpCD=Math.max(0,warpCD-dt);rest=Math.max(0,rest-dt);restCD=Math.max(0,restCD-dt);shield=Math.max(0,shield-dt);
  if(own(3)){
   magnetClock-=dt;
   const interval=own(12)?2:own(6)?3:4;
   if(magnetClock<=0){
    magnetClock+=interval;
    collectNear(player.x,player.y,own(12)?450:own(6)?300:150,own(12)?8:own(6)?5:3);
   }
  }
  droneTick(dt);
  if(alcor&&hasAlcor()){
   alcorClock-=dt;
   if(alcorClock<=0){alcorClock+=5;collectNear(player.x,player.y,750,Infinity)}
  }
 }
 window.ursaStart=start;window.ursaEnd=()=>{alcor=false;warp=rest=shield=0};
 window.ursaTick=tick;window.ursaDraw=draw;
 window.ursaInitialTime=initialTime;window.ursaReturnTime=returnTime;
 window.ursaTimeRate=timeRate;window.ursaCrateCollected=timeBonus;window.ursaEmergency=emergency;
 window.ursaAsteroidSpeed=asteroidSpeed;window.ursaBulletSpeed=bulletSpeed;window.ursaOutpostSpeed=outpostSpeed;
 window.ursaProtected=protectedShip;window.ursaActivateWarp=activateWarp;window.ursaActivateRest=activateRest;window.ursaActivateAlcor=activateAlcor;window.ursaRefundCooldowns=()=>{if(save.abilityLoadout?.includes('timewarp'))warpCD=0;if(save.abilityLoadout?.includes('taketime'))restCD=0};
 window.ursaAbilityStatus=status;
 window.ursaDebug=()=>({warp,warpCD,rest,restCD,shield,alcor,bonusTime,emergencyUsed,droneCount:drones.length});
})();
