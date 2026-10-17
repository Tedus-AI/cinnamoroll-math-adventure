import {COLLECTION} from './engine.js';
import {MIN_SCALE,clamp,cornerScale,boundProp,resizeProp} from './placement-geometry.js';
let selected=null;
export function bindRoomPlacement(root,state,save){
 const scene=root.querySelector('.doll-scene');if(!scene)return;
 let drag=null,saving=false,w=state.wardrobe;
 const toolbar=root.querySelector('.placement-toolbar'),status=toolbar.querySelector('#placement-status');
 const all=()=>[...scene.querySelectorAll('[data-prop],[data-wear-item]')];
 const info=id=>COLLECTION.find(i=>i.id===id);
 const get=id=>all().find(el=>(el.dataset.prop||el.dataset.wearItem)===id);
 const isWear=id=>Boolean(get(id)?.dataset.wearItem);
 const value=id=>isWear(id)?{scale:w.wearScales[id]||1}:w.props[id];
 const bounds=()=>{const r=scene.getBoundingClientRect();return {left:r.left+scene.clientLeft,top:r.top+scene.clientTop,width:scene.clientWidth,height:scene.clientHeight};};
 for(const el of all())el.insertAdjacentHTML('beforeend',['nw','ne','sw','se'].map(c=>'<span class="resize-handle" data-corner="'+c+'" aria-hidden="true"></span>').join(''));
 const gear=document.createElement('div');gear.className='wear-edit-controls';gear.innerHTML=Object.values(w.slots).map(id=>'<button class="small-button" data-select-wear="'+id+'">調整'+info(id).name+'</button>').join('');toolbar.append(gear);
 function select(id){selected=id;const wear=isWear(id),v=value(id);all().forEach(el=>el.classList.toggle('selected',(el.dataset.prop||el.dataset.wearItem)===id));toolbar.querySelectorAll('[data-place]').forEach(el=>el.disabled=saving||!v||(wear&&!['smaller','larger'].includes(el.dataset.place)));toolbar.querySelector('#selected-prop').textContent=v?info(id).name+(wear?' · 固定在身上，拖角落改大小':' · 拖曳移動，拖角落改大小'):'點選擺設或下方「調整配件」；點其他地方取消選取';}
 function paint(el,p){if(el.dataset.wearItem)el.style.setProperty('--wear-scale',p.scale);else{el.style.left=p.x+'%';el.style.top=p.y+'%';el.style.width=28*p.scale+'%';el.style.zIndex=p.z;}}
 async function commit(id,p,remove=false){
  if(saving)return;const wear=isWear(id),el=get(id),old={...value(id)};saving=true;select(id);status.textContent='儲存調整…';
  // Persist precisely the geometry already on screen; no second clamp on release.
  const payload=wear?{item:id,scale:p.scale}:{item:id,...p,remove};
  const next=await save(payload,wear?'resize-wear':'place-prop');
  if(next){w=next;if(remove)el?.remove();else if(el)paint(el,value(id));status.textContent='已儲存';}
  else{if(el)paint(el,old);status.textContent='尚未儲存，請稍後重試';}
  saving=false;scene.classList.remove('editing-appearance');select(remove?null:selected);
 }
 // Convert screen movement to the wearable's rotated/scaled local coordinates.
 function localMatrix(el){let matrix=new DOMMatrix();for(let n=el;n&&n!==scene;n=n.parentElement){const t=getComputedStyle(n).transform;if(t!=='none')matrix=new DOMMatrix(t).multiply(matrix);}return matrix.inverse();}
 scene.addEventListener('pointerdown',e=>{
  const el=e.target.closest('[data-prop],[data-wear-item]');if(!el||saving||drag||e.button>0)return;
  const id=el.dataset.prop||el.dataset.wearItem,corner=e.target.closest('[data-corner]')?.dataset.corner,wear=Boolean(el.dataset.wearItem);
  select(id);if(wear&&!corner)return;
  scene.classList.add('editing-appearance');
  drag={id,el,p:{...value(id)},wear,corner,rect:bounds(),startX:e.clientX,startY:e.clientY,pointer:e.pointerId,moved:false,inverse:wear?localMatrix(el):null};
  el.setPointerCapture(e.pointerId);e.preventDefault();
 });
 function update(e){
  if(!drag||drag.pointer!==e.pointerId)return;const d=drag,dx=e.clientX-d.startX,dy=e.clientY-d.startY;
  if(Math.hypot(dx,dy)>2)d.moved=true;
  if(d.corner&&d.wear){const m=d.inverse,v={x:m.a*dx+m.c*dy,y:m.b*dx+m.d*dy};d.next={scale:cornerScale(d.p.scale,d.corner,v.x,v.y,d.el.offsetWidth,d.el.offsetHeight,2)};}
  else if(d.corner)d.next=resizeProp(d.p,d.corner,dx,dy,d.rect.width,d.rect.height);
  else d.next=boundProp({...d.p,x:d.p.x+dx/d.rect.width*100,y:d.p.y+dy/d.rect.height*100},d.rect.width,d.rect.height);
  paint(d.el,d.next);
 }
 scene.addEventListener('pointermove',update);
 scene.addEventListener('pointerup',e=>{if(!drag||drag.pointer!==e.pointerId)return;update(e);const d=drag;drag=null;d.el.releasePointerCapture(e.pointerId);if(d.moved)void commit(d.id,d.next);else scene.classList.remove('editing-appearance');});
 const cancel=()=>{if(!drag)return;paint(drag.el,drag.p);drag=null;scene.classList.remove('editing-appearance');};
 scene.addEventListener('pointercancel',cancel);scene.addEventListener('lostpointercapture',cancel);
 scene.addEventListener('click',e=>{const el=e.target.closest('[data-prop],[data-wear-item]');if(el&&!saving)select(el.dataset.prop||el.dataset.wearItem);});
 function operate(op){const p=value(selected);if(!p||saving)return;let next={...p};const wear=isWear(selected),r=bounds();if(!wear){if(op==='left')next.x-=2;if(op==='right')next.x+=2;if(op==='up')next.y-=2;if(op==='down')next.y+=2;if(op==='back')next.z=1;if(op==='front')next.z=3;}if(op==='smaller')next.scale=Math.max(MIN_SCALE,next.scale*.8);if(op==='larger')next.scale=Math.min(wear?2:1.6,next.scale*1.25);if(!wear)next=boundProp(next,r.width,r.height);paint(get(selected),next);void commit(selected,next,op==='remove');}
 toolbar.addEventListener('click',e=>{if(saving)return;const wear=e.target.closest('[data-select-wear]')?.dataset.selectWear;if(wear){select(wear);return;}const op=e.target.closest('[data-place]')?.dataset.place;if(op)operate(op);});
 scene.addEventListener('keydown',e=>{const el=e.target.closest('[data-prop]'),op={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(el&&op){e.preventDefault();select(el.dataset.prop);operate(op);}});
 root.onpointerdown=e=>{if(!e.target.closest('[data-prop],[data-wear-item],.placement-toolbar')&&!drag)select(null);};
 if(selected&&value(selected))select(selected);else select(null);
}
