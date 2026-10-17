import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,COLLECTION,applyAction,publicState,unlockAdministrator,stageUnlocked} from '../public/game/engine.js';
import {EXTRA_ITEMS} from '../public/game/extra-items.js';
import {MUSIC,musicTrack} from '../public/game/music-score.js';
import {animatedCharacter} from '../public/game/character.js';
import {itemDrawing} from '../public/game/item-art.js';

test('twenty-six distinct additions can be bought, equipped, saved and removed from their slots',()=>{
 assert.equal(EXTRA_ITEMS.length,26);assert.equal(EXTRA_ITEMS.filter(i=>i.kind==='prop').length,8);
 assert.equal(COLLECTION.length,59);assert.equal(new Set(COLLECTION.map(i=>i.id)).size,59);
 const s=newState();s.coins=10000;
 for(const i of EXTRA_ITEMS){
  const before=s.coins;
  applyAction(s,{id:'buy-'+i.id,type:'buy',item:i.id});
  assert.equal(s.coins,before-i.cost);
  applyAction(s,{id:'equip-'+i.id,type:'equip',item:i.id});
  const saved=JSON.parse(JSON.stringify(publicState(s)));
  if(i.kind==='prop')assert.ok(saved.wardrobe.props[i.id]);else assert.equal(saved.wardrobe.slots[i.slot],i.id);
  applyAction(s,i.kind==='prop'?{id:'remove-'+i.id,type:'place-prop',item:i.id,remove:true}:{id:'remove-'+i.id,type:'unequip-slot',slot:i.slot});
  assert.equal(s.wardrobe.slots[i.slot],undefined);
 }
 assert.equal(new Set(EXTRA_ITEMS.map(i=>itemDrawing(i.id))).size,26);
});
test('administrator unlocks all levels and collections without inventing learning results',()=>{
 const s=newState();assert.equal(stageUnlocked(s,5,5),false);
 unlockAdministrator(s);
 for(let w=0;w<6;w++)for(let l=0;l<6;l++)assert.ok(stageUnlocked(s,w,l));
 assert.equal(s.inventory.length,59);assert.equal(s.correct,0);assert.deepEqual(s.levels,{});
 assert.equal(s.history.length,0);assert.equal(s.coins,0);
 assert.throws(()=>applyAction(newState(),{id:'forged',type:'admin-login',adminUnlocked:true}));
});
test('all six worlds and bosses have independent original scores and valid routing',()=>{
 assert.equal(Object.keys(MUSIC).length,15);
 assert.equal(new Set(Object.values(MUSIC).map(x=>JSON.stringify(x.melody))).size,15);
 for(let w=0;w<6;w++){assert.equal(musicTrack('world',w),'world-'+w);assert.equal(musicTrack('play',w,true),'boss-'+w);}
 assert.equal(musicTrack('home'),'home');assert.equal(musicTrack('dressing'),'dressing');
 assert.equal(musicTrack('practice'),'practice');
 for(const t of Object.values(MUSIC)){assert.ok(t.bpm>=60&&t.bpm<=150);assert.ok(t.melody.every(n=>n===null||Number.isInteger(n)));}
});
test('character animation reuses the original artwork and supports all requested body regions',()=>{
 const svg=animatedCharacter({head:'beret',hand:'wand'});
 assert.ok(svg.includes('./assets/cinnamoroll-poses.png'));
 assert.ok(svg.includes('data-original-rig="eyes mouth ears arms legs"'));
 assert.ok(svg.includes('rig-slot-head'));assert.ok(svg.includes('rig-slot-hand'));
 assert.ok(!svg.includes('<path')); // No substituted vector character.
});
