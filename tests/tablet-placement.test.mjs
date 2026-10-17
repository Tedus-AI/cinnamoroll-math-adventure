import test from 'node:test';
import assert from 'node:assert/strict';
import {MIN_SCALE,cornerScale,boundProp,resizeProp} from '../public/game/placement-geometry.js';
import {newState,unlockAdministrator,applyAction,publicState} from '../public/game/engine.js';
import {MUSIC} from '../public/game/music-score.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
test('all four corners preserve the opposite anchor and respond to inward/outward movement',()=>{
 for(const corner of ['nw','ne','sw','se']){
  const sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1,p={x:50,y:50,scale:1,z:1};
  for(const distance of [-70,70]){
   const n=resizeProp(p,corner,sx*distance,sy*distance,1000,800);
   near(n.x*10-sx*140*n.scale,500-sx*140);
   near(n.y*8-sy*140*n.scale,400-sy*140);
   near(n.scale,1+distance/280);
  }
  assert.equal(cornerScale(1,corner,-sx*1000,-sy*1000,280,280,1.6),MIN_SCALE);
 }
});
test('movement and scale respect visible bounds without changing again on persistence',()=>{
 const s=unlockAdministrator(newState());let id=0;
 const run=(type,p)=>applyAction(s,{id:'tablet-'+(++id),type,...p});
 run('equip',{item:'cloud-sofa'});
 const p=boundProp({x:1,y:99,scale:.05,z:1},1000,600);
 run('place-prop',{item:'cloud-sofa',...p});
 assert.deepEqual(publicState(s).wardrobe.props['cloud-sofa'],p);
 run('equip',{item:'hat-starlight'});run('resize-wear',{item:'hat-starlight',scale:.05});
 assert.equal(publicState(s).wardrobe.wearScales['hat-starlight'],.05);
 assert.throws(()=>run('resize-wear',{item:'hat-starlight',scale:0}));
 assert.throws(()=>run('place-prop',{item:'cloud-sofa',...p,scale:.001}));
 for(const corner of ['nw','ne','sw','se']){
  const sx=corner.includes('e')?1:-1,sy=corner.includes('s')?1:-1;
  const n=resizeProp({x:50,y:50,scale:.5,z:1},corner,sx*10000,sy*10000,1000,600);
  assert.ok(n.x-14*n.scale>=-1e-8&&n.x+14*n.scale<=100+1e-8);
  assert.ok(n.y-14*n.scale*1000/600>=-1e-8&&n.y+14*n.scale*1000/600<=100+1e-8);
 }
});
test('six world arrangements use distinct instruments and valid repeating rhythms',()=>{
 const tracks=Array.from({length:6},(_,i)=>MUSIC['world-'+i]);
 assert.equal(new Set(tracks.map(t=>t.instrument)).size,6);
 for(const t of tracks){assert.equal(t.notes.length,t.beats);assert.ok(t.notes.some(Boolean));assert.ok(t.swing>=0&&t.swing<1);assert.ok(t.arp.every(Number.isFinite));}
 assert.equal(tracks[1].beats,6);
});
