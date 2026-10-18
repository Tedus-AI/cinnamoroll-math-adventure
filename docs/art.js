import {animatedCharacter} from './character.js';
import {LEGACY_SLOTS} from './wardrobe.js';
function atlas(file,index,klass,label){const x=index%3*512,y=Math.floor(index/3)*512;return '<svg class="'+klass+'" viewBox="'+x+' '+y+' 512 512" role="img" aria-label="'+label+'" overflow="hidden"><image href="./assets/'+file+'.png" width="1536" height="1024"/></svg>';}
export function cinna(wear=null,klass="",pose=0){const w=wear&&typeof wear==='object'?wear:null,slots=w?.slots||(wear&&LEGACY_SLOTS[wear]?{[LEGACY_SLOTS[wear]]:wear}:{});return '<span class="cinna '+klass+'">'+animatedCharacter(slots,pose,w?.skin,w?.wearScales,w?.wearOffsets)+'</span>';}
export function bossArt(world=2){return atlas("bosses",world,"boss-art","世界魔王");}
export function scenery(world=2,klass=""){const x=world%3*512,y=Math.floor(world/3)*512;return '<svg class="scenery '+klass+'" viewBox="'+x+' '+y+' 512 512" preserveAspectRatio="xMidYMid slice" aria-hidden="true" overflow="hidden"><image href="./assets/worlds.png" width="1536" height="1024"/></svg>';}
