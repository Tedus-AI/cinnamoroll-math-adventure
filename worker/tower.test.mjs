import assert from 'node:assert/strict';
import {localRuntime} from './local-runtime.mjs';
const {mf,db}=await localRuntime('test-only');
try {
 const base=new URL('/api/game/',await mf.ready).href;
 let token,version=0,seq=0;
 async function call(path,body){const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await res.json();if(data.version!==undefined)version=data.version;return {status:res.status,data};}
 const reg=await call('register',{username:'tower_test',pin:'73819264'});assert.equal(reg.status,200);token=reg.data.token;
 const event=(type,props={})=>call('event',{id:'test-'+(++seq),type,version,...props});
 let r=await event('start',{options:{kind:'tower',floor:20,adminUnlocked:true}});assert.equal(r.status,400);
 r=await event('start',{options:{kind:'tower',floor:1}});assert.equal(r.status,200);assert.ok(Number.isFinite(r.data.serverNow));assert.equal(r.data.state.run.questions[0].q,undefined);
 while(r.data.state.run){const q=r.data.state.run.questions[r.data.state.run.index];r=await event('answer',{questionId:q.id,quotient:Math.floor(q.a/q.b),remainder:q.a%q.b});assert.equal(r.status,200);}
 assert.equal(r.data.state.tower.cleared,1);
 let saved=await call('me');assert.equal(saved.data.state.tower.cleared,1);
 // Seed an isolated test save immediately before a boss; never touch production players.
 const row=await db.prepare('SELECT state FROM saves WHERE user_id=?').bind(reg.data.user.id).first();let state=JSON.parse(row.state);state.tower={cleared:19,stars:{}};
 await db.prepare('UPDATE saves SET state=? WHERE user_id=?').bind(JSON.stringify(state),reg.data.user.id).run();
 r=await event('start',{options:{kind:'tower',floor:20,deadline:9999999999999}});assert.equal(r.status,200);assert.ok(Math.abs(r.data.state.run.deadline-r.data.serverNow-360000)<2000);
 while(r.data.state.run){const q=r.data.state.run.questions[r.data.state.run.index];r=await event('answer',{questionId:q.id,quotient:Math.floor(q.a/q.b),remainder:q.a%q.b});assert.equal(r.status,200);}
 assert.equal(r.data.result.result.reward,'character-cappuccino');assert.ok(r.data.state.inventory.includes('character-cappuccino'));
 r=await event('equip',{item:'character-cappuccino'});assert.equal(r.data.state.wardrobe.character,'character-cappuccino');saved=await call('me');assert.equal(saved.data.state.wardrobe.character,'character-cappuccino');
 r=await event('start',{options:{kind:'tower',floor:20}});
 state=JSON.parse((await db.prepare('SELECT state FROM saves WHERE user_id=?').bind(reg.data.user.id).first()).state);state.run.deadline=Date.now()-1000;
 await db.prepare('UPDATE saves SET state=? WHERE user_id=?').bind(JSON.stringify(state),reg.data.user.id).run();
 const q=r.data.state.run.questions[0];r=await event('answer',{questionId:q.id,quotient:Math.floor(q.a/q.b),remainder:q.a%q.b,deadline:9999999999999});
 assert.equal(r.data.result.failed,true);assert.equal(r.data.state.lastResult.reason,'timeout');assert.equal(r.data.state.run,null);assert.equal(r.data.state.tower.cleared,20);
 saved=await call('me');assert.equal(saved.data.state.lastResult.reason,'timeout');
 console.log('PASS: server floor locks, clock, hidden answers, persistent progression, boss reward, character equip, and authoritative expiration.');
} finally {await mf.dispose();}
