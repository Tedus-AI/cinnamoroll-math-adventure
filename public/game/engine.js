import {LEGACY_SLOTS,SCENES,MOTIONS,ensureWardrobe,useCollection} from "./wardrobe.js";
import {seeded,divisionSteps,generateDivision} from "./modules/division.js";
import {registerMathModule,mathModule} from "./math-modules.js";
export {seeded,divisionSteps,generateDivision};
registerMathModule({id:"division",title:"除法冒險",version:1,answerFields:["quotient","remainder"],generate:(options,rng)=>generateDivision(options.tier,rng),validate:(q,a)=>Number(a.quotient)===q.q&&Number(a.remainder)===q.r,steps:q=>divisionSteps(q.a,q.b)});
export const WORLDS = [
{id:0,name:"雲朵草原",subtitle:"二位數暖身",icon:"☁️",color:"#c1eadb",digits:2,tier:1,boss:"迷糊雲球"},
{id:1,name:"奶油森林",subtitle:"三位數過渡",icon:"🌳",color:"#d9eac2",digits:3,tier:2,boss:"焦糖藤蔓"},
{id:2,name:"彩虹港灣",subtitle:"四位數主線",icon:"🌈",color:"#b9e7fa",digits:4,tier:3,boss:"烏雲咕嚕"},
{id:3,name:"星光雪原",subtitle:"試商與餘數",icon:"❄️",color:"#d8d7fa",digits:4,tier:4,boss:"冰晶巨人"},
{id:4,name:"月光城堡",subtitle:"商裡的零",icon:"🏰",color:"#f0d8ec",digits:4,tier:5,boss:"迷霧魔法師"},
{id:5,name:"天空王國",subtitle:"除法大師",icon:"👑",color:"#f8e4b5",digits:4,tier:6,boss:"黑雲大魔王"}
];
const ORIGINAL_COLLECTION = [
{id:"cloud",name:"第一朵小雲",emoji:"☁️",desc:"第一次完成任何一關",cost:0},
{id:"rainbow",name:"彩虹船票",emoji:"🌈",desc:"征服彩虹港灣魔王",cost:0},
{id:"snow",name:"星光雪花",emoji:"❄️",desc:"征服星光雪原魔王",cost:0},
{id:"moon",name:"月光徽章",emoji:"🌙",desc:"征服月光城堡魔王",cost:0},
{id:"crown",name:"天空王冠",emoji:"👑",desc:"征服天空王國魔王",cost:0},
{id:"tea",name:"奶油下午茶",emoji:"🫖",desc:"累計答對 25 題",cost:0},
{id:"ribbon",name:"友誼蝴蝶結",emoji:"🎀",desc:"累計答對 75 題",cost:0},
{id:"master",name:"除法大師獎盃",emoji:"🏆",desc:"累計答對 200 道四位數題",cost:0},
{id:"star",name:"星星髮飾",emoji:"⭐",desc:"戴上閃亮的小星星",cost:60,wear:"star"},
{id:"flower",name:"花花髮飾",emoji:"🌸",desc:"讓今天像春天一樣",cost:90,wear:"flower"},
{id:"bow",name:"天空藍領結",emoji:"🦋",desc:"冒險家的新領結",cost:120,wear:"bow"},
{id:"hat",name:"小船長帽",emoji:"⚓",desc:"出發，去彩虹的另一端",cost:150,wear:"hat"},
{id:"cupcake",name:"雲朵杯子蛋糕",emoji:"🧁",desc:"收藏一份甜甜的回憶",cost:40},
{id:"balloon",name:"飛行氣球",emoji:"🎈",desc:"帶著夢想飛得更高",cost:70},
{id:"shell",name:"彩虹貝殼",emoji:"🐚",desc:"聽見海邊的聲音",cost:80},
{id:"book",name:"魔法除法書",emoji:"📘",desc:"每一頁都是新的發現",cost:100}
];
export const COLLECTION=[...ORIGINAL_COLLECTION.map(i=>({...i,kind:"accessory",slot:LEGACY_SLOTS[i.id]})),...SCENES,...MOTIONS];
export const MODULES = [{id:"division",name:"除法冒險",status:"ready"},{id:"mixed",name:"四則混合",status:"planned"},{id:"fractions",name:"分數樂園",status:"planned"}];
export function taipeiDay(now=Date.now()) {return new Date(now+8*3600000).toISOString().slice(0,10);}
export function newState(name="小小冒險家") {
 return {schema:1,module:"division",name,xp:0,coins:0,correct:0,fourCorrect:0,attempts:0,streak:0,lastDay:null,days:[],levels:{},inventory:[],equipped:null,mistakes:[],history:[],daily:null,run:null,lastResult:null,actions:[]};
}
export function dailyReset(s,now=Date.now()) {
 const day=taipeiDay(now);if(s.daily?.day!==day)s.daily={day,four:0,levels:0,review:0,claimed:[]};return s.daily;
}
export function playerLevel(s){return 1+Math.floor(s.xp/100);}
export function worldUnlocked(s,w){return w<=2||Boolean(s.levels[(w-1)+":5"]);}
export function stageUnlocked(s,w,l){return worldUnlocked(s,w)&&(l===0||Boolean(s.levels[w+":"+(l-1)]));}
export function badges(s){
 ensureWardrobe(s);
 if(s.history.length)addItem(s,"cloud");
 if(s.correct>=25)addItem(s,"tea");
 if(s.correct>=75)addItem(s,"ribbon");
 if(s.fourCorrect>=200)addItem(s,"master");
 for(const [w,id]of [[2,"rainbow"],[3,"snow"],[4,"moon"],[5,"crown"]])if(s.levels[w+":5"])addItem(s,id);
}
function addItem(s,id){if(!s.inventory.includes(id))s.inventory.push(id);}
function todayVisit(s,now){
 const day=taipeiDay(now);if(s.lastDay!==day){s.streak=s.lastDay===taipeiDay(now-86400000)?s.streak+1:1;s.lastDay=day;if(!s.days.includes(day))s.days.push(day);s.days=s.days.slice(-60);}
}
export function startRun(s,options={},rng=Math.random,now=Date.now()) {
 if(s.run&&!options.replace)throw new Error("還有一場冒險，請先繼續或結束");
 const kind=options.kind||"practice";const difficulty=Math.min(2,Math.max(0,Number(options.difficulty)||0));
 const world=Number(options.world??2),stage=Number(options.stage??0);let tier=Number(options.tier)||3,boss=false,questions=[];
 if(kind==="level"){
 if(!Number.isInteger(world)||!WORLDS[world]||!Number.isInteger(stage)||stage<0||stage>5||!stageUnlocked(s,world,stage))throw new Error("這一關尚未解鎖");
 tier=WORLDS[world].tier;boss=stage===5;
 }else if(kind==="review"){
 if(!s.mistakes.length)for(let i=0;i<2;i++)questions.push(generateDivision(3,rng));
 if(s.mistakes.length)questions=s.mistakes.slice(0,5).map(m=>({...m.question,id:"r"+m.question.id}));
 }else if(kind!=="practice")throw new Error("未知的冒險類型");
 if(!questions.length)for(let i=0;i<(boss?8:5);i++)questions.push(mathModule(s.module).generate({tier:Math.min(6,Math.max(1,tier+(difficulty===2&&tier>=3?1:0)))},rng));
 const id="run"+now+"-"+Math.floor(rng()*1e8);
 s.run={id,kind,world,stage,tier,difficulty,boss,questions,index:0,wrong:0,perfect:0,assisted:0,questionAttempts:0,startedAt:now,answers:[],combo:0,playerHp:boss?[5,4,3][difficulty]:null,maxPlayerHp:boss?[5,4,3][difficulty]:null,bossHp:boss?questions.length:null,maxBossHp:boss?questions.length:null};
 s.lastResult=null;dailyReset(s,now);return s.run;
}
export function publicQuestion(q){return {a:q.a,b:q.b,id:q.id,topic:q.topic,digits:q.digits,tier:q.tier};}
export function publicState(s){
 const copy=JSON.parse(JSON.stringify(s));ensureWardrobe(copy);
 if(copy.run)copy.run.questions=copy.run.questions.map(publicQuestion);
 copy.mistakes=copy.mistakes.map(m=>({...m,question:publicQuestion(m.question)}));
 return copy;
}
export function applyAction(s,action,rng=Math.random,now=Date.now()){
 if(!action||!action.id||typeof action.id!=="string"||action.id.length>100)throw new Error("缺少操作編號");
 if(s.actions.includes(action.id))return {duplicate:true};
 dailyReset(s,now);ensureWardrobe(s);
 let result;
 switch(action.type){
 case"start":result={run:startRun(s,action.options,rng,now)};break;
 case"abandon":s.run=null;result={abandoned:true};break;
 case"answer":result=answerRun(s,action,now);break;
 case"step-answer":result=stepAnswer(s,action,now);break;
 case"claim":result=claim(s,action.key);break;
 case"buy":{const item=COLLECTION.find(x=>x.id===action.item);if(!item||!item.cost)throw new Error("無法購買這個收藏");if(s.inventory.includes(item.id))throw new Error("已經收藏了");if(s.coins<item.cost)throw new Error("雲朵幣還不夠");s.coins-=item.cost;addItem(s,item.id);result={bought:item.id};break;}
 case"equip":{useCollection(s,action.item,COLLECTION);result={equipped:action.item};break;}
 case"unequip-slot":{const w=ensureWardrobe(s);if(!Object.values(LEGACY_SLOTS).includes(action.slot))throw new Error("無效的配件位置");if(w.slots[action.slot]===s.equipped)s.equipped=null;delete w.slots[action.slot];result={removed:action.slot};break;}
 default:throw new Error("未知的操作");
 }
 s.actions.push(action.id);s.actions=s.actions.slice(-100);return result;
}
function answerRun(s,a,now){
 const run=s.run;if(!run)throw new Error("沒有進行中的冒險");
 const q=run.questions[run.index];if(a.questionId!==q.id)throw new Error("題目已經更新，請重新同步");
 if(!/^\d{1,4}$/.test(String(a.quotient))||!/^\d{1,2}$/.test(String(a.remainder)))throw new Error("請填入商與餘數，整除時填 0");
 s.attempts++;const ok=mathModule(q.topic).validate(q,a);
 if(!ok)return wrongAnswer(s,q,now,Number(a.remainder)>=q.b?"餘數要比除數小喔！":"用除數 × 商 ＋ 餘數檢查答案。");
 const perfect=run.questionAttempts===0&&!a.assisted;run.perfect+=perfect?1:0;run.assisted+=a.assisted?1:0;
 run.combo++;s.correct++;if(q.digits===4){s.fourCorrect++;s.daily.four++;}
 if(run.kind==="review")s.daily.review++;
 s.mistakes=s.mistakes.filter(m=>m.question.a!==q.a||m.question.b!==q.b);
 s.coins+=perfect?5:3;s.xp+=perfect?12:8;todayVisit(s,now);
 if(run.boss){ensureBattle(run);run.bossHp=Math.max(0,run.bossHp-1);}
 run.answers.push({a:q.a,b:q.b,q:q.q,r:q.r,perfect});run.index++;run.questionAttempts=0;
 if(run.index===run.questions.length){
 const stars=run.perfect===run.questions.length?3:run.perfect>=Math.ceil(run.questions.length*.6)?2:1;
 const key=run.world+":"+run.stage;const first=run.kind==="level"&&!s.levels[key];
 if(run.kind==="level"){s.levels[key]=Math.max(s.levels[key]||0,stars);s.daily.levels++;}
 const bonus=first?(run.boss?60:25):10;s.coins+=bonus;s.xp+=run.boss?40:20;
 const entry={outcome:"won",difficulty:run.difficulty,playerHp:run.playerHp,maxPlayerHp:run.maxPlayerHp,bossHp:run.bossHp,maxBossHp:run.maxBossHp,kind:run.kind,world:run.world,stage:run.stage,boss:run.boss,stars,perfect:run.perfect,count:run.questions.length,bonus,first,at:now,answers:run.answers};
 s.lastResult=entry;s.history.push(entry);s.history=s.history.slice(-60);s.run=null;badges(s);
 return {correct:true,finished:true,result:entry};}
 badges(s);return {correct:true,finished:false,combo:run.combo};
}
export const QUESTS=[{key:"four",name:"四位數小勇士",desc:"答對 5 道四位數除法",goal:5,reward:25},{key:"levels",name:"今天也去冒險",desc:"完成 1 個世界關卡",goal:1,reward:20},{key:"review",name:"把迷糊變成進步",desc:"答對 2 道錯題複習",goal:2,reward:20}];
function claim(s,key){const q=QUESTS.find(q=>q.key===key);if(!q||s.daily[key]<q.goal)throw new Error("任務還沒完成");if(s.daily.claimed.includes(key))throw new Error("今天已經領過了");s.daily.claimed.push(key);s.coins+=q.reward;s.xp+=15;return {reward:q.reward};}

function ensureBattle(r){if(!r.boss)return;r.maxPlayerHp??=[5,4,3][r.difficulty];r.playerHp??=r.maxPlayerHp;r.maxBossHp??=r.questions.length;r.bossHp??=r.questions.length-r.index;}
function wrongAnswer(s,q,now,reason){
 const r=s.run;r.wrong++;r.questionAttempts++;r.combo=0;
 const old=s.mistakes.find(m=>m.question.a===q.a&&m.question.b===q.b);
 if(old){old.errors++;old.lastAt=now;}else s.mistakes.push({question:q,errors:1,lastAt:now});
 s.mistakes=s.mistakes.slice(-40);
 if(r.boss){ensureBattle(r);r.playerHp=Math.max(0,r.playerHp-1);
 if(r.playerHp===0){const entry={outcome:"lost",kind:r.kind,world:r.world,stage:r.stage,boss:true,difficulty:r.difficulty,stars:0,perfect:r.perfect,count:r.questions.length,bonus:0,first:false,at:now,answers:r.answers,playerHp:0,maxPlayerHp:r.maxPlayerHp,bossHp:r.bossHp,maxBossHp:r.maxBossHp};s.lastResult=entry;s.run=null;return {correct:false,finished:true,failed:true,result:entry,reason};}}
 return {correct:false,reason,tries:r.questionAttempts,damage:r.boss?1:0};
}
function stepAnswer(s,a,now){
 const r=s.run;if(!r)throw new Error("沒有進行中的冒險");
 const q=r.questions[r.index];if(a.questionId!==q.id)throw new Error("題目已更新，請重新同步");
 const steps=mathModule(q.topic).steps(q),step=steps[a.step];
 if(!Number.isInteger(a.step)||!step||!Number.isInteger(a.phase)||a.phase<0||a.phase>2||!/^\d{1,4}$/.test(String(a.value)))throw new Error("無效的直式步驟");
 const expected=[step.q,step.product,step.remainder][a.phase];
 if(Number(a.value)===expected)return {correct:true,step:true};
 s.attempts++;
 return wrongAnswer(s,q,now,["試商再想一想：乘積不能超過目前要除的數。","再乘一次看看，可以拆成十位和個位。","再檢查減法，剩下的數要比除數小。"][a.phase]);
}
