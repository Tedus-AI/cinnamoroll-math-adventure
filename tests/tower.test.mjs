import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,applyAction,seeded,publicState,unlockAdministrator,COLLECTION} from '../public/game/engine.js';
import {towerRules,towerUnlocked,TOWER_REWARDS} from '../public/game/tower.js';
import {roomMarkup} from '../public/game/room-layout.js';
import {towerPage,towerIntro,towerResult,sceneEffects} from '../public/game/tower-ui.js';
import {animatedCharacter} from '../public/game/character.js';
import {musicTrack,MUSIC} from '../public/game/music-score.js';
let seq=0;const now=1900000000000;
const action=(s,type,props={},time=now)=>applyAction(s,{id:'tower-'+(++seq),type,...props},seeded(seq),time);
function finish(s,floor){action(s,'start',{options:{kind:'tower',floor,difficulty:2}});while(s.run){const q=s.run.questions[s.run.index];action(s,'answer',{questionId:q.id,quotient:q.q,remainder:q.r});}return s.lastResult;}
test('100 sequential floors, 10 unique rewards, 300 independent stars, persisted state and no campaign corruption',()=>{
 let s=newState();for(let f=1;f<=100;f++){
  assert.ok(towerUnlocked(s,f));if(f<100)assert.equal(towerUnlocked(s,f+1),false);
  const result=finish(s,f);assert.equal(result.count,f%10?3:5);assert.equal(result.stars,3);assert.equal(s.tower.cleared,f);
  assert.equal(result.bonus,towerRules(f).bonus);assert.equal(result.reward,TOWER_REWARDS.find(r=>r.floor===f)?.id||null);
  s=JSON.parse(JSON.stringify(s));
 }
 assert.equal(TOWER_REWARDS.length,10);assert.equal(TOWER_REWARDS.filter(r=>r.kind==='scene').length,5);
 assert.ok(TOWER_REWARDS.every(r=>s.inventory.includes(r.id)));assert.equal(Object.values(s.tower.stars).reduce((a,b)=>a+b),300);
 assert.deepEqual(s.levels,{});assert.equal(towerUnlocked(s,101),false);assert.throws(()=>finish(s,101));
 const inventory=[...s.inventory],repeat=finish(s,100);assert.equal(repeat.reward,null);assert.equal(repeat.bonus,150);assert.deepEqual(s.inventory,inventory);
 assert.equal(publicState(s).tower.cleared,100);
});
test('boss deadlines survive reload, reject late answers and steps, ignore forged deadlines, and allow a fresh retry',()=>{
 for(const type of ['answer','step-answer','tower-timeout']){
  let s=newState();s.tower={cleared:9,stars:{}};action(s,'start',{options:{kind:'tower',floor:10,deadline:Infinity,seconds:9999}});
  assert.equal(s.run.deadline,now+300000);assert.equal(s.run.playerHp,5);s=JSON.parse(JSON.stringify(s));
  const q=s.run.questions[0],a={id:'late',type,questionId:q.id,quotient:q.q,remainder:q.r,step:0,phase:0,value:'0',deadline:Infinity};
  const before=s.coins,r=applyAction(s,a,seeded(1),s.run.deadline);assert.equal(r.failed,true);assert.equal(s.run,null);assert.equal(s.coins,before);assert.equal(s.tower.cleared,9);assert.ok(!s.inventory.includes(TOWER_REWARDS[0].id));
  assert.equal(applyAction(s,a).duplicate,true);action(s,'start',{options:{kind:'tower',floor:10}},now+400000);assert.equal(s.run.deadline,now+700000);
 }
 const s=newState();s.tower={cleared:9,stars:{}};action(s,'start',{options:{kind:'tower',floor:10}});assert.equal(action(s,'tower-timeout').waiting,true);assert.ok(s.run);
});
test('invalid floors and unowned rewards cannot bypass progression; admin access invents no completion',()=>{
 const s=newState();for(const floor of [0,2,10,101,1.5,'10'])assert.throws(()=>action(s,'start',{options:{kind:'tower',floor}}));
 assert.throws(()=>action(s,'equip',{item:'character-milk'}));assert.throws(()=>action(s,'equip',{item:'scene-tower-palace'}));
 unlockAdministrator(s);assert.ok(towerUnlocked(s,100));assert.equal(s.tower.cleared,0);assert.equal(s.inventory.length,69);
 finish(s,100);assert.equal(s.tower.cleared,0);assert.equal(s.tower.stars[100],3);
});
test('five characters and animated scenes equip persistently, retain accessories, have unique scores and render rewards',()=>{
 const s=unlockAdministrator(newState());action(s,'equip',{item:'hat'});
 for(const r of TOWER_REWARDS){
  action(s,'equip',{item:r.id});const copy=publicState(s);
  assert.equal(copy.wardrobe[r.kind],r.id);assert.equal(copy.wardrobe.slots.head,'hat');
  const html=roomMarkup(copy,r.kind,0);assert.ok(html.includes('角色'));
  if(r.kind==='character')assert.ok(animatedCharacter({},0,'original',{}, {},r.id).includes('character-'+r.asset+'.png'));
  else {assert.ok(html.includes('effect-'+r.asset));assert.ok(sceneEffects(r).includes('aria-hidden="true"'));assert.ok(MUSIC[musicTrack('dressing',0,false,r.id)]);}
  assert.ok(towerIntro(r.floor).includes(r.name));assert.ok(towerResult({floor:r.floor,reward:r.id,stars:3,bonus:10}).includes(r.name));
 }
 action(s,'equip',{item:'character-original'});assert.equal(s.wardrobe.character,'original');
 assert.ok(towerPage(s,9).includes('第 100 層'));assert.equal(new Set(COLLECTION.map(i=>i.id)).size,69);
 assert.ok(towerRules(100).seconds===600&&towerRules(30).seconds===420);
});
test('losing all five hearts preserves checkpoint and grants no boss reward',()=>{
 const s=newState();s.tower={cleared:19,stars:{}};action(s,'start',{options:{kind:'tower',floor:20}});const q=s.run.questions[0];
 for(let i=0;i<5;i++)action(s,'answer',{questionId:q.id,quotient:9999,remainder:99});
 assert.equal(s.run,null);assert.equal(s.lastResult.floor,20);assert.equal(s.lastResult.outcome,'lost');assert.equal(s.tower.cleared,19);assert.ok(!s.inventory.includes('character-cappuccino'));
});
