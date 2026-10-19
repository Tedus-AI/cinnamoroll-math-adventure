// First season is capped at 100; every cleared floor is a permanent checkpoint.
export const TOWER_MAX=100;
const rewards=[
 ['scene-tower-aurora','極光雲端觀測台','scene','aurora'],
 ['character-cappuccino','卡布奇諾','character','cappuccino'],
 ['scene-tower-blossom','櫻花流水庭園','scene','blossom'],
 ['character-mocha','摩卡','character','mocha'],
 ['scene-tower-meteor','流星祈願露台','scene','meteor'],
 ['character-chiffon','戚風','character','chiffon'],
 ['scene-tower-lagoon','彩虹水晶潟湖','scene','lagoon'],
 ['character-espresso','濃縮咖啡','character','espresso'],
 ['scene-tower-palace','天界星光宮殿','scene','palace'],
 ['character-milk','牛奶','character','milk']
];
export const TOWER_REWARDS=rewards.map(([id,name,kind,asset],i)=>({id,name,kind,asset,file:'tower-'+asset,cost:0,floor:(i+1)*10,desc:'天梯第 '+((i+1)*10)+' 層魔王首通獎勵'+(kind==='scene'?' · 特殊動態場景':' · 可換裝角色')}));
export const CHARACTERS=TOWER_REWARDS.filter(i=>i.kind==='character');
export const TOWER_SCENES=TOWER_REWARDS.filter(i=>i.kind==='scene');
export function ensureTower(s){s.tower??={cleared:0,stars:{}};s.tower.stars??={};return s.tower;}
export function towerRules(floor){
 if(!Number.isInteger(floor)||floor<1||floor>TOWER_MAX)throw new Error('天梯目前開放第 1～100 層');
 const tier=floor<=10?1:floor<=20?2:floor<=40?3:floor<=60?4:floor<=80?5:6,boss=floor%10===0;
 return {floor,tier,boss,world:tier-1,count:boss?5:3,seconds:boss?([0,300,360,420,480,540,600][tier]):0,bonus:(boss?100:20)+floor*(boss?5:2),xp:20+Math.ceil(floor/10)*5,reward:TOWER_REWARDS.find(i=>i.floor===floor)||null};
}
export function towerUnlocked(s,floor){return Number.isInteger(floor)&&floor>=1&&floor<=TOWER_MAX&&(Boolean(s.adminUnlocked)||floor<=ensureTower(s).cleared+1);}
export function clearTower(s,run,stars){
 const t=ensureTower(s),rules=towerRules(run.floor),first=!t.stars[run.floor];
 t.stars[run.floor]=Math.max(t.stars[run.floor]||0,stars);
 // Only contiguous completion opens the next floor, including admin test runs.
 while(t.cleared<TOWER_MAX&&t.stars[t.cleared+1])t.cleared++;
 let reward=null;if(rules.reward&&!s.inventory.includes(rules.reward.id)){reward=rules.reward;s.inventory.push(reward.id);}
 return {first,bonus:first?rules.bonus:Math.floor(rules.bonus/4),xp:rules.xp,reward:reward?.id||null};
}
export function expireTower(s,now){
 const r=s.run;if(r?.kind!=='tower'||!r.boss||now<r.deadline)return null;
 const entry={outcome:'lost',reason:'timeout',kind:'tower',floor:r.floor,world:r.world,stage:r.stage,boss:true,difficulty:0,stars:0,perfect:r.perfect,count:r.questions.length,bonus:0,first:false,at:now,answers:r.answers,playerHp:r.playerHp,maxPlayerHp:r.maxPlayerHp,bossHp:r.bossHp,maxBossHp:r.maxBossHp};
 s.lastResult=entry;s.history.push(entry);s.history=s.history.slice(-60);s.run=null;
 return {correct:false,finished:true,failed:true,result:entry,reason:'魔王挑戰時間到了，下次再試一次！'};
}
