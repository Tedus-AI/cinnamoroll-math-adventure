import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,applyAction,startRun,seeded,publicState,COLLECTION,unlockAdministrator} from '../public/game/engine.js';
import {difficultyStars,difficultyUnlocked,totalStars,ensureProgression,SKINS} from '../public/game/progression.js';
import {ensureWardrobe} from '../public/game/wardrobe.js';
let seq=0;const action=(s,type,props={})=>applyAction(s,{id:'custom-'+(++seq),type,...props},seeded(seq));
function finish(s,d){action(s,'start',{options:{kind:'level',world:0,stage:0,difficulty:d}});while(s.run){const q=s.run.questions[s.run.index];action(s,'answer',{questionId:q.id,quotient:q.q,remainder:q.r});}}
test('each stage has three independent star records and sequential server-enforced unlocks',()=>{
 const s=newState();assert.throws(()=>startRun(s,{kind:'level',world:0,stage:0,difficulty:1}),/上一個難度/);
 finish(s,0);assert.equal(difficultyStars(s,0,0,0),3);assert.equal(difficultyUnlocked(s,0,0,1),true);assert.equal(difficultyUnlocked(s,0,0,2),false);
 finish(s,1);finish(s,2);assert.equal(totalStars(s),9);
 const coins=s.coins;finish(s,0);assert.equal(totalStars(s),9);assert.equal(s.lastResult.first,false);assert.equal(s.coins-coins,35);
 assert.equal(difficultyUnlocked(s,0,1,1),false);
});
test('legacy stars migrate once, preserve available difficulty history, and do not invent stars',()=>{
 const s=newState();s.levels={'2:0':3,'2:1':2};s.history=[{kind:'level',world:2,stage:0,difficulty:1,stars:2}];
 ensureProgression(s);assert.equal(totalStars(s),7);assert.equal(difficultyStars(s,2,0,1),2);ensureProgression(s);assert.equal(totalStars(s),7);
 const restored=publicState(JSON.parse(JSON.stringify(s)));assert.equal(totalStars(restored),7);
});
test('every skin unlocks at its XP threshold, persists, and cannot be equipped early',()=>{
 const s=newState();for(const skin of SKINS){s.xp=(skin.level-1)*100-1;ensureWardrobe(s);assert.ok(!s.inventory.includes(skin.id));assert.throws(()=>action(s,'equip',{item:skin.id}));s.xp++;ensureWardrobe(s);action(s,'equip',{item:skin.id});assert.equal(publicState(s).wardrobe.skin,skin.id);}
 action(s,'equip',{item:'skin-original'});assert.equal(s.wardrobe.skin,'original');
 const admin=unlockAdministrator(newState());assert.ok(SKINS.every(i=>admin.inventory.includes(i.id)));assert.equal(admin.xp,0);
});
test('multiple props move independently, survive reload, and body items cannot be moved',()=>{
 const s=unlockAdministrator(newState());for(const id of ['cloud-sofa','flower-pot','rainbow-lamp','cloud'])action(s,'equip',{item:id});
 assert.equal(Object.keys(s.wardrobe.props).length,4);
 const p={item:'cloud-sofa',x:28,y:72,scale:1.2,z:3};action(s,'place-prop',p);
 const copy=JSON.parse(JSON.stringify(publicState(s)));assert.deepEqual(copy.wardrobe.props['cloud-sofa'],{x:28,y:72,scale:1.2,z:3});
 assert.throws(()=>action(s,'place-prop',{...p,item:'hat-starlight'}));assert.throws(()=>action(s,'place-prop',{...p,x:NaN}));assert.throws(()=>action(s,'place-prop',{...p,scale:99}));
 action(s,'place-prop',{...p,remove:true});assert.ok(!s.wardrobe.props['cloud-sofa']);action(s,'equip',{item:'cloud-sofa'});assert.equal(s.wardrobe.props['cloud-sofa'].x,28);
 action(s,'equip',{item:null});assert.deepEqual(s.wardrobe.props,{});
});
test('legacy room and floating slots migrate without losing equipped objects',()=>{
 const s=newState();s.inventory=['cloud','rainbow-lamp'];s.wardrobe={slots:{ground:'cloud','room-right':'rainbow-lamp'},motions:['motion-breathe'],scene:'scene-bedroom'};
 ensureWardrobe(s);assert.ok(s.wardrobe.props.cloud);assert.ok(s.wardrobe.props['rainbow-lamp']);assert.deepEqual(s.wardrobe.slots,{});
});
test('wearable sizes persist independently, reject unowned items and keep fixed body slots',()=>{
 const s=unlockAdministrator(newState());action(s,'equip',{item:'hat-starlight'});action(s,'equip',{item:'outfit-sailor'});
 action(s,'resize-wear',{item:'hat-starlight',scale:1.5});action(s,'resize-wear',{item:'outfit-sailor',scale:.8});
 const saved=publicState(s);assert.equal(saved.wardrobe.wearScales['hat-starlight'],1.5);assert.equal(saved.wardrobe.wearScales['outfit-sailor'],.8);assert.equal(saved.wardrobe.slots.head,'hat-starlight');
 assert.throws(()=>action(s,'resize-wear',{item:'hat-bonnet',scale:1}));assert.throws(()=>action(s,'resize-wear',{item:'hat-starlight',scale:3}));assert.throws(()=>action(s,'resize-wear',{item:'cloud-sofa',scale:1}));
});
