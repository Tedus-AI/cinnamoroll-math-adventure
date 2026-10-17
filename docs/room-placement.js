import {COLLECTION} from './engine.js';
let selected=null;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function bindRoomPlacement(root,state,save){
 const scene=root.querySelector('.doll-scene');if(!scene)return;
 let drag=null,saving=false;
 const w=state.wardrobe,props=w.props,toolbar=root.querySelector('.placement-toolbar'),status=toolbar.querySelector('#placement-status');
 const all=()=>[...scene.querySelectorAll('[data-prop],[data-wear-item]')];
 const info=id=>COLLECTION.find(i=>i.id===id);
 const get=id=>all().find(el=>(el.dataset.prop||el.dataset.wearItem)===id);
 const isWear=id=>Boolean(get(id)?.dataset.wearItem);
 const value=id=>isWear(id)?{scale:w.wearScales[id]||1}:props[id];
 for(const el of all())el.insertAdjacentHTML('beforeend',['nw','ne','sw','se'].map(c=>'<span class="resize-handle" data-corner="'+c+'" aria-hidden="true"></span>').join(''));
 const gear=document.createElement('div');gear.className='wear-edit-controls';gear.innerHTML=Object.values(w.slots).map(id=>'<button class="small-button" data-select-wear="'+id+'">調整'+info(id).name+'</button>').join('');toolbar.append(gear);
 function select(id){selected=id;const wear=isWear(id),v=value(id);all().forEach(el=>el.classList.toggle('selected',(el.dataset.prop||el.dataset.wearItem)===id));toolbar.querySelectorAll('[data-place]').forEach(el=>el.disabled=!v||(wear&&!['smaller','larger'].includes(el.dataset.place)));toolbar.querySelector('#selected-prop').textContent=v?info(id).name+(wear?' · 固定在身上，拖角落改大小':' · 拖曳移動，拖角落改大小'):'點選配件或擺設；點其他地方取消選取';}
 function constrain(p){const r=scene.getBoundingClientRect(),half=14*p.scale;return {...p,x:clamp(p.x,half,100-half),y:clamp(p.y,Math.max(8,half*r.width/r.height),Math.min(88,100-half*r.width/r.height))};}
 function paint(el,p){if(el.dataset.wearItem)el.style.setProperty('--wear-scale',p.scale);else{el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.width=28*p.scale+'%';el.style.zIndex=p.z;}}
 async function commit(id,p,remove=false){if(saving)return;saving=true;status.textContent='儲存調整…';const wear=isWear(id),payload=wear?{item:id,scale:p.scale}:{item:id,...constrain(p),remove};const ok=await save(payload,wear?'resize-wear':'place-prop');if(!ok){const el=get(id);if(el)paint(el,value(id));status.textContent='尚未儲存，請稍後重試';}saving=false;}
 scene.addEventListener('pointerdown',e=>{
  const el=e.target.closest('[data-prop],[data-wear-item]');if(!el||saving)return;
  const id=el.dataset.prop||el.dataset.wearItem,corner=e.target.closest('[data-corner]')?.dataset.corner,wear=Boolean(el.dataset.wearItem);
  select(id);if(wear&&!corner)return;
  scene.classList.add('editing-appearance');
  const rect=el.getBoundingClientRect(),p={...value(id)},centerX=rect.x+rect.width/2,centerY=rect.y+rect.height/2;
  drag={id,el,p,wear,corner,rect:scene.getBoundingClientRect(),centerX,centerY,radius:Math.max(10,Math.hypot(e.clientX-centerX,e.clientY-centerY)),startX:e.clientX,startY:e.clientY,moved:false};
  el.setPointerCapture(e.pointerId);e.preventDefault();
 });
 scene.addEventListener('pointermove',e=>{
  if(!drag)return;const d=drag,dx=(e.clientX-d.startX)/d.rect.width*100,dy=(e.clientY-d.startY)/d.rect.height*100;
  if(Math.abs(dx)+Math.abs(dy)>.3)d.moved=true;
  d.next=d.corner?{...d.p,scale:clamp(d.p.scale*Math.hypot(e.clientX-d.centerX,e.clientY-d.centerY)/d.radius,.5,d.wear?2:1.6)}:{...d.p,x:d.p.x+dx,y:d.p.y+dy};
  if(!d.wear)d.next=constrain(d.next);paint(d.el,d.next);
 });
 scene.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;scene.classList.remove('editing-appearance');d.el.releasePointerCapture(e.pointerId);if(d.moved)void commit(d.id,d.next);});
 scene.addEventListener('pointercancel',()=>{if(drag)paint(drag.el,drag.p);drag=null;scene.classList.remove('editing-appearance');});
 scene.addEventListener('click',e=>{const el=e.target.closest('[data-prop],[data-wear-item]');if(el)select(el.dataset.prop||el.dataset.wearItem);});
 function operate(op){const p=value(selected);if(!p||saving)return;const next={...p},wear=isWear(selected);if(!wear){if(op==='left')next.x-=2;if(op==='right')next.x+=2;if(op==='up')next.y-=2;if(op==='down')next.y+=2;if(op==='back')next.z=1;if(op==='front')next.z=3;}if(op==='smaller')next.scale=Math.max(.5,Math.round((next.scale-.1)*10)/10);if(op==='larger')next.scale=Math.min(wear?2:1.6,Math.round((next.scale+.1)*10)/10);void commit(selected,next,op==='remove');}
 toolbar.addEventListener('click',e=>{const wear=e.target.closest('[data-select-wear]')?.dataset.selectWear;if(wear){select(wear);return;}const op=e.target.closest('[data-place]')?.dataset.place;if(op)operate(op);});
 scene.addEventListener('keydown',e=>{const el=e.target.closest('[data-prop]'),op={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(el&&op){e.preventDefault();select(el.dataset.prop);operate(op);}});
 // One property handler per render; it also catches clicks outside the room.
 root.onpointerdown=e=>{if(!e.target.closest('[data-prop],[data-wear-item],.placement-toolbar'))select(null);};
 if(selected&&value(selected))select(selected);else select(null);
}
