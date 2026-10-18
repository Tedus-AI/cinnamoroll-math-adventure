import {itemArt} from './item-art.js';
import {fitFor} from './character-fit.js';
import {SKINS} from './progression.js';
export {mountCharacters} from './character-rig.js';
const positions={head:[51,27,31],ear:[73,44,15],eyes:[51,47,37],neck:[49,64,19],chest:[50,72,14],hand:[66,61,24],back:[64,70,24],float:[85,28,28],ground:[22,85,25]};
let serial=0;
export function animatedCharacter(slots={},pose=0,skinId='original',wearScales={},wearOffsets={}){
 const x=pose%3*512,y=Math.floor(pose/3)*512;
 const skin=SKINS.find(s=>s.id===skinId),uid='tint-'+(++serial),rgb=skin?.rgb||[1,1,1];
 const filter=skin?'<defs><filter id="'+uid+'" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="'+rgb[0]+' 0 0 0 0 0 '+rgb[1]+' 0 0 0 0 0 '+rgb[2]+' 0 0 0 0 0 1 0"/></filter></defs>':'';
 const original='<svg class="original-character character-sprite" viewBox="'+x+' '+y+' 512 512" aria-hidden="true">'+filter+'<image href="./assets/cinnamoroll-poses.png" width="1536" height="1024" '+(skin?'filter="url(#'+uid+')"':'')+'/></svg>';
 const accessories=Object.entries(slots).filter(([slot,id])=>fitFor(slot,pose,id)).map(([slot,id])=>{const [left,top,width,height]=fitFor(slot,pose,id),scale=wearScales[id]||1,offset=wearOffsets[id]||{x:0,y:0};return '<span class="rig-accessory rig-slot-'+slot+'" data-wear-slot="'+slot+'" data-wear-item="'+id+'" data-offset-x="'+offset.x+'" data-offset-y="'+offset.y+'" style="--wear-scale:'+scale+';left:'+(left+offset.x)+'%;top:'+(top+offset.y)+'%;width:'+width+'%;height:'+height+'%">'+itemArt(id)+'</span>';}).join('');
 return '<span class="character-live '+(skin?'has-skin':'')+'" data-skin="'+(skin?.id||'original')+'" style="--skin-glow:'+(skin?.color||'transparent')+'" data-pose="'+pose+'" data-motion="'+(pose===1?'float':'breathe')+'" role="img" aria-label="'+(skin?skin.name+' · ':'')+'原版大耳狗：眨眼、動嘴、耳朵與手腳分區動畫">'+(skin?'<span class="skin-aura" aria-hidden="true"></span>':'')+original+'<canvas class="original-rig" data-original-rig="eyes mouth ears arms legs" aria-hidden="true"></canvas>'+accessories+'</span>';
}
