import test from "node:test";
import assert from "node:assert/strict";
import {newState,generateDivision,divisionSteps,seeded,applyAction,publicState,worldUnlocked,taipeiDay} from "../public/game/engine.js";
test("all generated divisions satisfy digit ranges and reconstruction",()=>{
 const rng=seeded(481201);
 for(let tier=1;tier<=6;tier++)for(let i=0;i<1500;i++){
 const q=generateDivision(tier,rng);assert.ok(q.b>=10&&q.b<=99);assert.equal(String(q.a).length,tier===1?2:tier===2?3:4);
 assert.equal(q.a,q.b*q.q+q.r);assert.ok(q.r>=0&&q.r<q.b);assert.equal(q.steps.map(s=>s.q).join(""),String(q.q));assert.equal(q.steps.at(-1).remainder,q.r);
 }});
test("long division retains internal and trailing zero quotient digits",()=>{
 for(const [a,b,q,r] of [[1005,10,100,5],[2023,20,101,3],[9999,99,101,0],[1000,10,100,0],[1101,11,100,1],[99,99,1,0],[100,99,1,1]]){
 const steps=divisionSteps(a,b);assert.equal(Number(steps.map(s=>s.q).join("")),q);assert.equal(steps.at(-1).remainder,r);
 for(const st of steps){assert.equal(st.value,st.product+st.remainder);assert.ok(st.remainder<b);}
 }});
test("campaign rewards, mistakes and idempotency work without double credit",()=>{
 const s=newState("test"),rng=seeded(40),now=Date.parse("2026-10-14T12:00:00Z");let id=0;
 const event=(type,props={})=>applyAction(s,{id:"t"+(++id),type,...props},rng,now);
 event("start",{options:{kind:"level",world:2,stage:0}});
 const q=s.run.questions[0];event("answer",{questionId:q.id,quotient:"0",remainder:"0"});assert.equal(s.mistakes.length,1);
 while(s.run){const q=s.run.questions[s.run.index];const cmd={id:"answer"+(++id),type:"answer",questionId:q.id,quotient:String(q.q),remainder:String(q.r)};applyAction(s,cmd,rng,now);const coins=s.coins;applyAction(s,cmd,rng,now);assert.equal(s.coins,coins);}
 assert.equal(s.mistakes.length,0);assert.equal(s.levels["2:0"],2);assert.ok(s.inventory.includes("cloud"));assert.equal(s.fourCorrect,5);
 event("claim",{key:"four"});const coins=s.coins;assert.throws(()=>event("claim",{key:"four"}));assert.equal(s.coins,coins);
 assert.equal(worldUnlocked(s,3),false);
 assert.throws(()=>event("start",{options:{kind:"level",world:3,stage:0}}));
 });
test("review fallback, Taipei midnight, and public save serialization",()=>{
 const s=newState(),rng=seeded(1);applyAction(s,{id:"a",type:"start",options:{kind:"review"}},rng);
 assert.equal(s.run.questions.length,2);const pub=publicState(s);assert.equal(pub.run.questions[0].q,undefined);assert.equal(pub.run.questions[0].steps,undefined);
 assert.equal(taipeiDay(Date.parse("2026-10-14T15:59:59Z")),"2026-10-14");assert.equal(taipeiDay(Date.parse("2026-10-14T16:00:00Z")),"2026-10-15");
 });
