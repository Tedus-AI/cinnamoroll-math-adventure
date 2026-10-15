// Item positions are authored against the 512×512 neutral Cinnamoroll pose.
export const SLOT_LABELS={head:'頭頂',ear:'右耳',neck:'頸部',chest:'胸前',hand:'手邊',float:'身旁',ground:'腳邊'};
export const LEGACY_SLOTS={cloud:'ground',rainbow:'float',snow:'ear',moon:'chest',crown:'head',tea:'hand',ribbon:'ear',master:'ground',star:'ear',flower:'ear',bow:'neck',hat:'head',cupcake:'hand',balloon:'float',shell:'ground',book:'hand'};
export const SCENES=[
{id:'scene-bedroom',name:'雲朵臥室',emoji:'🛏️',file:'bedroom',desc:'初次見面的專屬小房間',starter:true},
{id:'scene-cafe',name:'甜點咖啡館',emoji:'🍰',file:'cafe',desc:'完成第一場冒險獲得',unlock:s=>s.history.length>0},
{id:'scene-beach',name:'彩虹海灘',emoji:'🏖️',file:'beach',desc:'累計答對 25 題獲得',unlock:s=>s.correct>=25},
{id:'scene-garden',name:'星光花園',emoji:'🌷',file:'garden',desc:'累計答對 75 題獲得',unlock:s=>s.correct>=75},
{id:'scene-castle',name:'月光城堡',emoji:'🏰',file:'castle',desc:'通過彩虹港灣魔王獲得',unlock:s=>!!s.levels['2:5']}
].map(i=>({...i,kind:'scene',cost:0}));
export const MOTIONS=[
{id:'motion-breathe',name:'呼吸搖擺',emoji:'☁️',motion:'breathe',starter:true},
{id:'motion-peek',name:'左右探頭',emoji:'👀',motion:'peek',starter:true},
{id:'motion-hop',name:'開心跳跳',emoji:'💗',motion:'hop',starter:true},
{id:'motion-float',name:'漂浮轉圈',emoji:'🪽',motion:'float',starter:true},
{id:'motion-sleep',name:'打瞌睡',emoji:'💤',motion:'sleep',starter:true},
{id:'motion-dance',name:'星光舞步',emoji:'✨',motion:'dance',unlock:s=>s.correct>=50,desc:'累計答對 50 題獲得'},
{id:'motion-cheer',name:'勇者歡呼',emoji:'🎉',motion:'cheer',unlock:s=>s.fourCorrect>=100,desc:'答對 100 道四位數題獲得'}
].map(i=>({...i,kind:'motion',cost:0,desc:i.desc||'初始動作 · 可加入隨機演出'}));
export const STARTER_ITEMS=[...SCENES,...MOTIONS].filter(i=>i.starter).map(i=>i.id);
export function ensureWardrobe(s){
 for(const id of STARTER_ITEMS)if(!s.inventory.includes(id))s.inventory.push(id);
 if(!s.wardrobe){s.wardrobe={slots:{},scene:'scene-bedroom',motions:MOTIONS.filter(i=>i.starter).map(i=>i.id)};if(s.equipped&&s.inventory.includes(s.equipped)&&LEGACY_SLOTS[s.equipped])s.wardrobe.slots[LEGACY_SLOTS[s.equipped]]=s.equipped;}
 for(const i of [...SCENES,...MOTIONS])if(i.unlock?.(s)&&!s.inventory.includes(i.id))s.inventory.push(i.id);
 return s.wardrobe;
}
export function useCollection(s,item,catalog){
 const w=ensureWardrobe(s);
 if(item===null){w.slots={};s.equipped=null;return;}
 const i=catalog.find(i=>i.id===item);if(!i||!s.inventory.includes(item))throw new Error('尚未擁有這個收藏');
 if(i.kind==='scene')w.scene=item;
 else if(i.kind==='motion'){
  if(w.motions.includes(item)){if(w.motions.length===1)throw new Error('至少保留一種待機動作');w.motions=w.motions.filter(id=>id!==item);}
  else w.motions.push(item);
 }else{w.slots[i.slot]=item;if(i.wear)s.equipped=item;}
}
export function isUsing(s,i){const w=ensureWardrobe(s);return i.kind==='scene'?w.scene===i.id:i.kind==='motion'?w.motions.includes(i.id):w.slots[i.slot]===i.id;}
export function randomMotion(s,last,rng=Math.random){const ids=ensureWardrobe(s).motions;const pool=ids.filter(id=>id!==last);return (pool.length?pool:ids)[Math.floor(rng()*(pool.length||ids.length))];}
