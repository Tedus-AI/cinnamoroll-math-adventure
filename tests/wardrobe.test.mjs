import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,applyAction,COLLECTION,publicState,badges} from '../public/game/engine.js';
import {ensureWardrobe,randomMotion,SCENES,MOTIONS,SLOT_LABELS} from '../public/game/wardrobe.js';
let seq=0;const event=(s,type,item)=>applyAction(s,{id:'wardrobe-'+(++seq),type,item});
test('old saves keep accessories and gain the starter room and five random animations',()=>{
 const s=newState();s.inventory=['star','book'];s.equipped='star';const copy=publicState(s);
 assert.equal(copy.wardrobe.slots.ear,'star');assert.equal(copy.wardrobe.motions.length,5);assert.ok(copy.inventory.includes('book'));
 assert.deepEqual(s.inventory,['star','book']);
 const once=JSON.stringify(ensureWardrobe(copy));assert.equal(JSON.stringify(ensureWardrobe(copy)),once);
});
test('every original collection has a fixed slot and all types can be equipped',()=>{
 const s=newState();s.inventory=COLLECTION.map(i=>i.id);ensureWardrobe(s);
 for(const i of COLLECTION){if(i.kind!=='motion'||!s.wardrobe.motions.includes(i.id))event(s,'equip',i.id);if(i.kind==='accessory'){assert.ok(SLOT_LABELS[i.slot]);assert.equal(s.wardrobe.slots[i.slot],i.id);}if(i.kind==='scene')assert.equal(s.wardrobe.scene,i.id);}
 event(s,'equip','star');event(s,'equip','crown');event(s,'equip','flower');assert.equal(s.wardrobe.slots.ear,'flower');assert.equal(s.wardrobe.slots.head,'crown');
 event(s,'equip',null);assert.deepEqual(s.wardrobe.slots,{});assert.equal(s.wardrobe.scene,SCENES.at(-1).id);
});
test('unearned collectibles are rejected; last idle cannot be removed; rewards survive reload',()=>{
 const s=newState();ensureWardrobe(s);assert.throws(()=>event(s,'equip','scene-castle'));assert.throws(()=>event(s,'equip','crown'));
 const list=[...s.wardrobe.motions];for(const id of list.slice(1))event(s,'equip',id);assert.throws(()=>event(s,'equip',list[0]));
 s.correct=75;s.fourCorrect=100;s.levels['2:5']=3;s.history=[{stars:1}];badges(s);
 const copy=JSON.parse(JSON.stringify(s));for(const i of [...SCENES.filter(i=>!i.floor),...MOTIONS])assert.ok(copy.inventory.includes(i.id),i.id);
});
test('random motions do not repeat consecutively; repeated equip request does not toggle twice',()=>{
 const s=newState();ensureWardrobe(s);const a=randomMotion(s,null,()=>0),b=randomMotion(s,a,()=>0);assert.notEqual(a,b);
 const cmd={id:'repeat',type:'equip',item:a};applyAction(s,cmd);assert.ok(!s.wardrobe.motions.includes(a));applyAction(s,cmd);assert.ok(!s.wardrobe.motions.includes(a));
});
