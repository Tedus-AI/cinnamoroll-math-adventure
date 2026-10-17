import {COLLECTION} from './engine.js';
import {animatedCharacter} from './character.js';
import {applyMotionPose} from './character-rig.js';
import {itemArt} from './item-art.js';
import {SLOT_LABELS,SCENES,MOTIONS,ensureWardrobe,isUsing,randomMotion} from './wardrobe.js';
let timer,lastMotion=null;
const getItem=id=>COLLECTION.find(i=>i.id===id);
export function dressedCinna(state){
 const w=ensureWardrobe(state);
 return '<div class="doll-rig">'+animatedCharacter(w.slots,0,w.skin,w.wearScales)+'<span class="sleep-bubbles" aria-hidden="true">z Z</span><span class="doll-hearts" aria-hidden="true">♡ ✧ ♡</span></div>';
}
export {roomMarkup,itemCard} from './room-layout.js';
export function stopRoom(){clearTimeout(timer);timer=null;}
export function animateRoom(s,forced=null){
 stopRoom();const rig=document.querySelector('.doll-rig');if(!rig||document.hidden)return;
 lastMotion=forced&&s.inventory.includes(forced)?forced:randomMotion(s,lastMotion);const motion=MOTIONS.find(i=>i.id===lastMotion);
 if(!motion)return;
 rig.dataset.motion=motion.motion;applyMotionPose(rig,motion.motion);
 const descriptions={breathe:'胸口起伏，輕輕搖擺',peek:'轉頭看看左邊，再看看右邊',hop:'蹲一下，開心跳起來',float:'拍動耳朵，飄起來轉一圈',sleep:'趴在雲上，閉眼慢慢呼吸',dance:'左右踏步，跟著節奏揮手',cheer:'舉起雙手，開心歡呼'};
 document.querySelector('#motion-caption').textContent=motion.name+' · '+descriptions[motion.motion];
 timer=setTimeout(()=>animateRoom(s),forced?18000:motion.motion==='float'||motion.motion==='sleep'?11000:8000);
}
