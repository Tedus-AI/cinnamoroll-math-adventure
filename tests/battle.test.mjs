import test from 'node:test';
import assert from 'node:assert/strict';
import {newState,applyAction,seeded,divisionSteps,publicState} from '../public/game/engine.js';
function start(difficulty=0){const s=newState();s.levels['2:4']=3;applyAction(s,{id:'start',type:'start',options:{kind:'level',world:2,stage:5,difficulty}},seeded(42));return s;}
test('wrong guided steps damage once per action, defeat gives no clear reward, retry restores life',()=>{
 const s=start(2),q=s.run.questions[0],wrong=String((divisionSteps(q.a,q.b)[0].q+1)%10);
 const a={id:'hit1',type:'step-answer',questionId:q.id,step:0,phase:0,value:wrong};
 applyAction(s,a);assert.equal(s.run.playerHp,2);applyAction(s,a);assert.equal(s.run.playerHp,2);
 applyAction(s,{...a,id:'hit2'});const result=applyAction(s,{...a,id:'hit3'});
 assert.equal(result.failed,true);assert.equal(s.run,null);assert.equal(s.lastResult.outcome,'lost');assert.equal(s.levels['2:5'],undefined);assert.equal(s.coins,0);assert.equal(s.daily.levels,0);assert.equal(s.history.length,0);
 applyAction(s,{id:'retry',type:'start',options:{kind:'level',world:2,stage:5,difficulty:2}},seeded(77));assert.equal(s.run.playerHp,3);assert.equal(s.run.bossHp,8);
});
test('correct questions damage boss, preserve life through serialization, and award victory only at zero',()=>{
 let s=start();for(let i=0;i<8;i++){const q=s.run.questions[s.run.index];applyAction(s,{id:'answer'+i,type:'answer',questionId:q.id,quotient:String(q.q),remainder:String(q.r)});if(i<7){assert.equal(s.run.bossHp,7-i);assert.equal(s.run.playerHp,5);s=JSON.parse(JSON.stringify(s));assert.equal(publicState(s).run.bossHp,7-i);}}
 assert.equal(s.lastResult.outcome,'won');assert.equal(s.lastResult.bossHp,0);assert.equal(s.lastResult.stars,3);assert.equal(s.levels['2:5'],3);assert.ok(s.inventory.includes('rainbow'));
});
test('old saved boss runs gain compatible life values, invalid step never damages',()=>{
 const s=start(1);delete s.run.playerHp;delete s.run.maxPlayerHp;delete s.run.bossHp;delete s.run.maxBossHp;const q=s.run.questions[0];
 assert.throws(()=>applyAction(s,{id:'bad',type:'step-answer',questionId:q.id,step:99,phase:0,value:'0'}));
 applyAction(s,{id:'wrong',type:'answer',questionId:q.id,quotient:'0',remainder:'0'});assert.equal(s.run.playerHp,3);assert.equal(s.run.bossHp,8);
});
