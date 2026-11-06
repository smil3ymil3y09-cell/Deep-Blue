/*
 * DEEP BLUE — BASIC ASTEROIDS & ORDINARY RESOURCES
 *
 * Safe place to tweak the regular grey asteroids and ordinary gold crates.
 * Bronze asteroids, Golden/Obsidian/Magma formations, derelict walls,
 * collision damage and rendering remain in index.html.
 *
 * This is a normal browser script, loaded before the main game script.
 * The functions intentionally use the existing game's world, save and
 * collision helpers, so we do not duplicate any state or alter save files.
 */

// Regular asteroid settings: original values retained for identical gameplay.
const BASIC_ASTEROID_CONFIG = {
  chunkSize: 520,            // World units per seeded asteroid chunk
  neighbourChunkRadius: 2,  // Chunks maintained around the ship
  minPerChunk: 7,           // Guaranteed attempts per chunk
  additionalPerChunk: 4,    // 0–3 extra attempts (7–10 total)
  sizeSteps: 3,             // 64, 128, 192 unit rocks (based on SHIP)
  spawnInset: 0.08,         // Keep spawn points away from chunk borders
  spawnSpan: 0.84,
  driftSpread: 44           // Initial velocity range: -22 to +22
};

// Ordinary gold crates only; no changes to special resource formations.
const BASIC_RESOURCE_CONFIG = {
  startingCrates: 17,
  baseChance: 0.12,         // Chance per shared 0.16-second spawn check
  coreBonus: 0.00001,       // Bonus per legacy CORE research level
  densityBonus: 0.00005,    // Bonus per Salvage Density research level
  maxCrates: 3000,
  starryAttempts: 4,       // Starry Sky crate attempts per check
  minSpawnDistance: 350,
  maxSpawnDistance: 1250,
  initialMinDistance: 150,
  initialMaxDistance: 1100
};

const ROCK_CHUNK = BASIC_ASTEROID_CONFIG.chunkSize;
const ROCK_RADIUS = BASIC_ASTEROID_CONFIG.neighbourChunkRadius;

// Asteroids occupy persistent, seeded 520-unit chunks. Every nearby chunk is populated
// immediately, so unlimited ship acceleration cannot outrun a timed spawn queue.

function spawnCrate(x,y){if(!withinWorld(x,y)||altarContains(x,y))return;crates.push({x,y,rare:false,rot:rand(0,6.28)})}

function chunkRandom(cx,cy){let seed=(Math.imul(cx,73856093)^Math.imul(cy,19349663)^expeditionSeed^0x51f15e5d)>>>0;return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
// Keep natural asteroids at least 128px clear of the derelict's visible
// floor AND physical wall tiles, accounting for the asteroid's own radius.
function rockOverlapsWreck(x,y,rockRadius=0){
 if(rockOverlapsStation(x,y,rockRadius))return true;
 for(const w of wrecks){
  if(w.destroyed||Math.abs(x-w.x)>1350+rockRadius||Math.abs(y-w.y)>1100+rockRadius)continue;
  const p=wreckToLocal(w,x,y),r=(128+rockRadius)/WRECK_TILE;
  const nearTile=(tx,ty)=>{const dx=Math.max(Math.abs(p.x-tx)-.5,0),dy=Math.max(Math.abs(p.y-ty)-.5,0);return Math.hypot(dx,dy)<r};
  // This predicate mirrors the actual deck drawn by wreckDraw.
  for(let yy=-13;yy<=12;yy++)for(let xx=-14;xx<=11;xx++){
   const spine=Math.abs(xx)<=2&&Math.abs(yy)<=12;
   const middle=Math.abs(xx)<=5&&Math.abs(yy)<=5;
   const wing=Math.abs(yy)<=Math.max(0,3-Math.floor(Math.abs(xx)/5))&&xx>=-14&&xx<=11;
   if((spine||middle||wing)&&nearTile(xx,yy))return true;
  }
  for(const [wx,wy] of w.walls)if(nearTile(wx,wy))return true;
 }
 return false
}
function ensureRockChunk(cx,cy){const key=cx+','+cy;if(rockChunks.has(key)||window.wrathIsClearedChunk?.(key))return;rockChunks.add(key);const random=chunkRandom(cx,cy);const count=BASIC_ASTEROID_CONFIG.minPerChunk+Math.floor(random()*BASIC_ASTEROID_CONFIG.additionalPerChunk);for(let i=0;i<count;i++){const s=SHIP*(1+Math.floor(random()*BASIC_ASTEROID_CONFIG.sizeSteps));const x=(cx+BASIC_ASTEROID_CONFIG.spawnInset+random()*BASIC_ASTEROID_CONFIG.spawnSpan)*ROCK_CHUNK,y=(cy+BASIC_ASTEROID_CONFIG.spawnInset+random()*BASIC_ASTEROID_CONFIG.spawnSpan)*ROCK_CHUNK,id=key+':'+i;if(!withinWorld(x,y)||altarContains(x,y)||Math.hypot(x,y)<150||overlapsGoldenClearance(x,y,s/2)||rockOverlapsWreck(x,y,s/2)||window.wrathSkipRock?.(id,x,y))continue;rocks.push({id,x,y,s,vx:(random()-.5)*BASIC_ASTEROID_CONFIG.driftSpread,vy:(random()-.5)*BASIC_ASTEROID_CONFIG.driftSpread,rot:random()*6.28,chunk:key})}}
// Load enough existing-density chunks to cover the wider mobile camera.
// Desktop retains the original 2-chunk loading and 3-chunk retention radius.
function rockChunkViewRadius(){
 if(!isMobile)return {x:ROCK_RADIUS,y:ROCK_RADIUS};
 return {
  x:Math.max(ROCK_RADIUS,Math.ceil((W/(2*CAMERA_SCALE))/ROCK_CHUNK+1)),
  y:Math.max(ROCK_RADIUS,Math.ceil((H/(2*CAMERA_SCALE))/ROCK_CHUNK+1))
 };
}
function maintainRockField(x,y){
 const cx=Math.floor(x/ROCK_CHUNK),cy=Math.floor(y/ROCK_CHUNK),radius=rockChunkViewRadius();
 for(let ix=cx-radius.x;ix<=cx+radius.x;ix++)for(let iy=cy-radius.y;iy<=cy+radius.y;iy++)ensureRockChunk(ix,iy);
}
function refreshRockField(oldX,oldY){
 const travel=Math.hypot(player.x-oldX,player.y-oldY);
 const steps=Math.min(48,Math.max(1,Math.ceil(travel/(ROCK_CHUNK*.55))));
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  maintainRockField(oldX+(player.x-oldX)*t,oldY+(player.y-oldY)*t);
 }
 const cx=Math.floor(player.x/ROCK_CHUNK),cy=Math.floor(player.y/ROCK_CHUNK),radius=rockChunkViewRadius();
 rocks=rocks.filter(r=>{
  const parts=r.chunk.split(',');
  return Math.abs(+parts[0]-cx)<=radius.x+1&&Math.abs(+parts[1]-cy)<=radius.y+1;
 });
 rockChunks=new Set(rocks.map(r=>r.chunk));
}

// Called once per existing 0.16-second spawn check (shared with bronze spawns).
function spawnOrdinaryResourceTick(){
const starryCrateMultiplier=biomeAt(player.x,player.y)===3?BASIC_RESOURCE_CONFIG.starryAttempts:1;
 for(let crateAttempt=0;crateAttempt<starryCrateMultiplier;crateAttempt++)if(Math.random()<BASIC_RESOURCE_CONFIG.baseChance+save.core*BASIC_RESOURCE_CONFIG.coreBonus+luckLevel('l04')*BASIC_RESOURCE_CONFIG.densityBonus&&crates.length<BASIC_RESOURCE_CONFIG.maxCrates)spawnAround(BASIC_RESOURCE_CONFIG.minSpawnDistance,BASIC_RESOURCE_CONFIG.maxSpawnDistance,(x,y)=>{
 if(overlapsGoldenClearance(x,y,20))return;
 const cluster=Math.random()<Math.min(1,luckLevel('l01')*.01);
 const count=cluster?1+luckLevel('l02'):1;
 for(let j=0;j<count;j++){const a=Math.random()*6.283,r=j?Math.sqrt(Math.random())*Math.min(200,30+count*5):0;spawnCrate(x+Math.cos(a)*r,y+Math.sin(a)*r)}
 });
}

// Populate the same initial nearby gold crates as the original game.
function spawnStartingResources(){
 for(let i=0;i<BASIC_RESOURCE_CONFIG.startingCrates;i++)spawnAround(BASIC_RESOURCE_CONFIG.initialMinDistance,BASIC_RESOURCE_CONFIG.initialMaxDistance,(x,y)=>{if(!overlapsGoldenClearance(x,y,20))spawnCrate(x,y)});
}

// Drift and world-edge bounce for ordinary grey rocks only.
function moveOrdinaryAsteroids(dt){
const beltRockSpeed=biomeAt(player.x,player.y)===2?2:1;
for(const r of rocks){r.x+=r.vx*dt*beltRockSpeed*(window.ursaAsteroidSpeed?.()??1);r.y+=r.vy*dt*beltRockSpeed*(window.ursaAsteroidSpeed?.()??1);if(!withinWorld(r.x,r.y)){const len=Math.hypot(r.x,r.y)||1;r.x*=(BIOME_LIMIT-1)/len;r.y*=(BIOME_LIMIT-1)/len;r.vx*=-1;r.vy*=-1}keepRockOutsideGoldenZone(r)}
}
