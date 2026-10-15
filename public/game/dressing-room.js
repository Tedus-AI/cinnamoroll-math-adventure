import {COLLECTION} from './engine.js';
import {cinna} from './art.js';
import {SLOT_LABELS,SCENES,MOTIONS,ensureWardrobe,isUsing,randomMotion} from './wardrobe.js';
let timer,lastMotion=null;
const getItem=id=>COLLECTION.find(i=>i.id===id);
export function dressedCinna(state){const w=ensureWardrobe(state);return '<div class="doll-rig">'+cinna(null,'doll-base',0)+Object.entries(w.slots).map(([slot,id])=>{const i=getItem(id);return i?'<span class="doll-item slot-'+slot+' item-'+id+'" role="img" aria-label="'+i.name+'">'+i.emoji+'</span>':'';}).join('')+'<span class="sleep-bubbles" aria-hidden="true">z Z</span><span class="doll-hearts" aria-hidden="true">♡ ✧ ♡</span></div>';}
export function itemCard(s,i,action='equip'){
 const owned=s.inventory.includes(i.id),used=owned&&isUsing(s,i),kind=i.kind==='scene'?'場景':i.kind==='motion'?'動作':SLOT_LABELS[i.slot];
 return '<section class="closet-card '+(owned?'':'unowned')+'">'+(i.kind==='scene'?'<img src="./assets/room-'+i.file+'.png" alt="'+i.name+'" loading="lazy">':'<div class="closet-icon">'+i.emoji+'</div>')+'<div><h3>'+i.name+'</h3><small>'+kind+' · '+i.desc+'</small></div>'+(owned?'<button class="small-button" data-action="'+action+'" data-item="'+i.id+'" '+(used&&i.kind!=='motion'?'disabled':'')+'>'+(used?(i.kind==='motion'?'已加入 · 點此停用':'使用中 ✓'):(i.kind==='motion'?'加入隨機演出':'套用'))+'</button>':i.cost?'<button class="small-button" data-action="buy" data-item="'+i.id+'" '+(s.coins<i.cost?'disabled':'')+'>🪙 '+i.cost+' 收藏</button>':'<span class="pill">練習解鎖</span>')+'</section>';
}
export function roomMarkup(s,tab,page){
 const w=ensureWardrobe(s),scene=SCENES.find(i=>i.id===w.scene)||SCENES[0],items=COLLECTION.filter(i=>i.kind===tab),pages=Math.ceil(items.length/4);page=Math.min(page,pages-1);
 return '<div class="room-heading"><div><div class="eyebrow">CINNAMOROLL’S LITTLE ROOM</div><h1>大耳狗的換裝小屋</h1><p>換一套心情，陪你慢慢長大 ♡</p></div><button class="small-button" data-action="equip" data-item="">卸下全部配件</button></div><div class="dressing-layout"><section class="doll-scene" aria-label="'+scene.name+'"><img class="room-background" src="./assets/room-'+scene.file+'.png" alt="'+scene.name+'"><span class="room-name">'+scene.emoji+' '+scene.name+'</span><div class="doll-platform">'+dressedCinna(s)+'</div><div class="room-caption"><span id="motion-caption">☁️ 陪你一起放鬆</span><button class="small-button" data-action="motion-next">換個動作 ↻</button></div><div class="room-glitter" aria-hidden="true">✦　♡　　　✧</div></section><section class="closet-panel"><div class="closet-tabs" role="group" aria-label="收藏類別">'+[['accessory','🎀 配件'],['scene','🏡 場景'],['motion','🪽 動作']].map(([id,n])=>'<button class="secondary '+(tab===id?'chosen':'')+'" data-action="closet-tab" data-tab="'+id+'">'+n+'</button>').join('')+'</div><div class="closet-items">'+items.slice(page*4,page*4+4).map(i=>itemCard(s,i)).join('')+'</div><div class="pager"><button class="secondary" data-action="closet-page" data-page="'+(page-1)+'" '+(page===0?'disabled':'')+'>←</button><span>'+(page+1)+' / '+pages+'</span><button class="secondary" data-action="closet-page" data-page="'+(page+1)+'" '+(page===pages-1?'disabled':'')+'>→</button></div></section></div><div class="slot-strip">'+Object.entries(SLOT_LABELS).map(([slot,label])=>'<button class="slot-chip" data-action="unequip-slot" data-slot="'+slot+'" '+(w.slots[slot]?'':'disabled')+'>'+label+' '+(getItem(w.slots[slot])?.emoji||'—')+(w.slots[slot]?' ×':'')+'</button>').join('')+'</div><p class="room-tip">同一位置會替換配件，點下方位置可卸下。已啟用的動作會隨機輪播。</p>';
}
export function stopRoom(){clearTimeout(timer);timer=null;}
export function animateRoom(s){
 stopRoom();const rig=document.querySelector('.doll-rig');if(!rig||document.hidden)return;
 lastMotion=randomMotion(s,lastMotion);const motion=MOTIONS.find(i=>i.id===lastMotion);
 rig.dataset.motion=motion.motion;document.querySelector('#motion-caption').textContent=motion.emoji+' '+motion.name;
 timer=setTimeout(()=>animateRoom(s),6500+Math.random()*2500);
}
