export const DIFFICULTIES=['簡單','普通','困難'];
export const SKINS=[
 {id:'skin-rose',name:'櫻花奶霜',level:3,color:'#f5a9cf',rgb:[1,.68,.83]},
 {id:'skin-mint',name:'薄荷精靈',level:5,color:'#83e4ca',rgb:[.52,.91,.79]},
 {id:'skin-lavender',name:'星夜紫羅蘭',level:8,color:'#bf9bf4',rgb:[.73,.62,1]},
 {id:'skin-gold',name:'晨曦蜜糖',level:12,color:'#ffd37d',rgb:[1,.83,.47]},
 {id:'skin-rainbow',name:'彩虹極光',level:16,color:'#b6b5ff',rgb:[1,.8,.9],rainbow:true}
].map(s=>({...s,rgb:s.rainbow?s.rgb:s.rgb.map(v=>(1+v)/2),kind:'skin',cost:0,desc:'冒險 Lv.'+s.level+' 解鎖 · 專屬閃動光暈'}));
export function ensureProgression(s){
 if(s.progressionVersion!==2){
  s.difficultyStars=s.difficultyStars||{};
  for(const [key,stars] of Object.entries(s.levels||{}))if(stars)s.difficultyStars[key+':0']=Math.max(s.difficultyStars[key+':0']||0,stars);
  for(const r of s.history||[])if(r.kind==='level'&&r.stars>0){const key=r.world+':'+r.stage+':'+(r.difficulty??0);s.difficultyStars[key]=Math.max(s.difficultyStars[key]||0,r.stars);}
  s.progressionVersion=2;
 }
 return s.difficultyStars;
}
export function difficultyStars(s,w,l,d){return ensureProgression(s)[w+':'+l+':'+d]||0;}
export function difficultyUnlocked(s,w,l,d){return Boolean(s.adminUnlocked)||d===0||difficultyStars(s,w,l,d-1)>0;}
export function totalStars(s,world=null){return Object.entries(ensureProgression(s)).filter(([k])=>world===null||k.startsWith(world+':')).reduce((n,[,v])=>n+v,0);}
export function rewardSkins(s){for(const i of SKINS)if(1+Math.floor(s.xp/100)>=i.level&&!s.inventory.includes(i.id))s.inventory.push(i.id);}
