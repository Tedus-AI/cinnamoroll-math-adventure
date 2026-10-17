import {croppedItem} from './item-crops.js';
import {SKINS} from './progression.js';
// Small vector illustrations avoid depending on installed emoji fonts.
const star='<path d="m50 9 12 26 29 4-21 21 5 29-25-14-25 14 5-29L9 39l29-4Z" fill="#ffe394"/>';
const heart='<path d="M50 82C-9 44 12 3 39 20l11 10 11-10C88 3 109 44 50 82Z" fill="#f3a8c6"/>';
const cloud='<path d="M23 74C1 73 1 42 22 40c-1-25 34-33 45-9 28-8 44 37 17 43Z" fill="#fff"/>';
const ribbon='<path d="M44 45 14 24v51l30-20m12-10 30-21v51L56 55" fill="#a8daf1"/><circle cx="50" cy="50" r="11" fill="#f0bfdc"/>';
const flower='<g fill="#f9b9d4"><ellipse cx="50" cy="29" rx="13" ry="22"/><ellipse cx="50" cy="29" rx="13" ry="22" transform="rotate(72 50 50)"/><ellipse cx="50" cy="29" rx="13" ry="22" transform="rotate(144 50 50)"/><ellipse cx="50" cy="29" rx="13" ry="22" transform="rotate(216 50 50)"/><ellipse cx="50" cy="29" rx="13" ry="22" transform="rotate(288 50 50)"/></g><circle cx="50" cy="50" r="13" fill="#ffe795"/>';
export function itemDrawing(id){
 if(id.startsWith('motion-')){const p=({'motion-breathe':0,'motion-peek':2,'motion-hop':3,'motion-float':1,'motion-sleep':5,'motion-dance':3,'motion-cheer':3})[id]??0;return '<svg width="100" height="100" viewBox="'+(p%3*512)+' '+(Math.floor(p/3)*512)+' 512 512" overflow="hidden"><image href="./assets/cinnamoroll-poses.png" width="1536" height="1024"/></svg>';}
 const cropped=croppedItem(id);if(cropped)return cropped;
 const skin=SKINS.find(s=>s.id===id);if(skin)return '<circle cx="50" cy="50" r="37" fill="'+skin.color+'"/><text x="50" y="63" text-anchor="middle" font-size="37" fill="white" stroke="none">✦</text>';
 switch(id){
 case 'star':case 'star-pillow':case 'motion-dance':return star;
 case 'heart-brooch':case 'motion-hop':return heart;
 case 'cloud':case 'motion-breathe':return cloud;
 case 'flower':return flower;
 case 'bow':case 'ribbon':return ribbon;
 case 'rainbow':case 'rainbow-lamp':return '<path d="M13 66a37 37 0 0 1 74 0" fill="none" stroke="#f3afc8" stroke-width="12"/><path d="M23 66a27 27 0 0 1 54 0" fill="none" stroke="#ffe39b" stroke-width="10"/><path d="M33 66a17 17 0 0 1 34 0" fill="none" stroke="#b9dfde" stroke-width="10"/>'+(id==='rainbow-lamp'?'<path d="M50 68v19M32 91h36"/>':'');
 case 'snow':return '<g stroke="#82c5e8" stroke-width="5"><path d="M50 8v84M14 29l72 42M14 71l72-42M38 15l12 12 12-12M38 85l12-12 12 12M16 43l18-4-3-18M84 57l-18 4 3 18M16 57l18 4-3 18M84 43l-18-4 3-18"/></g>';
 case 'moon':case 'moon-window':return '<path d="M69 12a37 37 0 1 0 19 57A31 31 0 0 1 69 12Z" fill="#ffdf8e"/>'+ (id==='moon-window'?'<path d="M50 2v9M83 42l4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1Z" fill="#d4d0f2"/>':'');
 case 'crown':return '<path d="m13 28 19 20 18-29 18 29 19-20-8 53H21Z" fill="#ffe193"/><path d="M23 68h54"/><circle cx="50" cy="57" r="7" fill="#b4dcf0"/>';
 case 'tea':return '<path d="M29 35h41v40H29Q13 68 16 49l13 3M68 42c30-11 30 30 0 26M37 29h25M46 21h8" fill="#d1e9f6"/><path d="M33 76h36M27 85h49"/>';
 case 'master':return '<path d="M28 16h44v22c0 18-10 25-22 25S28 56 28 38ZM27 25H12c-2 22 9 28 22 28M73 25h15c2 22-9 28-22 28M50 63v18M32 87h36" fill="#ffdf8e"/>';
 case 'hat':return '<path d="M19 51 13 31l22-12 15 5 15-5 22 12-6 20Z" fill="#fff"/><path d="M19 51h62l-9 15H28Z" fill="#a3d1ec"/><path d="M50 29v19m-10-8c0 15 20 15 20 0m-16-5h12" stroke="#668bb8"/>';
 case 'cupcake':return '<path d="M24 52h52l-8 36H32Z" fill="#c7dff9"/><path d="M20 52c-10-13 1-26 16-23-1-22 29-22 29 0 16-4 26 12 15 23Z" fill="#ffd5df"/><circle cx="50" cy="14" r="7" fill="#e99eb5"/><path d="m41 61 2 18m16-18-2 18"/>';
 case 'balloon':return '<ellipse cx="48" cy="34" rx="27" ry="31" fill="#e4c5ef"/><path d="m43 65 5-4 6 7Z" fill="#c5ace3"/><path d="M48 68c-16 15 15 15 0 30" fill="none"/><path d="M31 28c0-9 6-14 10-15" stroke="#fff" stroke-width="5"/>';
 case 'shell':return '<path d="M50 83C0 64 1 23 23 28c0-17 22-23 27-6 5-17 27-11 27 6 22-5 23 36-27 55Z" fill="#f8cddf"/><path d="m23 32 27 46m27-46L50 78m0-50v50" stroke="#d5a4c5"/>';
 case 'book':return '<path d="M12 20q24-8 38 7 14-15 38-7v59q-24-8-38 7-14-15-38-7Z" fill="#badff3"/><path d="M50 27v59M23 38l16 3m-16 10 16 3m23-14 15-3m-15 17 15-3"/>';
 case 'beret':return '<path d="M16 61c-26-44 82-65 72-15-3 19-25 23-38 21Z" fill="#ecbdd7"/><path d="M28 65h45l-4 10H34ZM52 17l4-8" fill="#dca4c8"/>';
 case 'straw-hat':return '<ellipse cx="50" cy="67" rx="45" ry="15" fill="#f8dea4"/><path d="M24 62 30 26q20-16 40 0l6 36Z" fill="#ffe9b4"/><path d="m25 53 50 0v9H25Z" fill="#b7d9e7"/>';
 case 'star-glasses':return '<path d="m28 20 8 13 15 2-11 11 2 16-14-7-14 7 2-16L5 35l15-2Zm44 0 8 13 15 2-11 11 2 16-14-7-14 7 2-16-11-11 15-2Z" fill="#b9e4f2"/><path d="M46 39h8"/>';
 case 'scarf':return '<path d="M17 26q33 14 66 0v22q-33 15-66 0Z" fill="#d3c8f0"/><path d="m55 52-6 34 23 4 4-39Z" fill="#c0b4e2"/><path d="m53 78 19 4" stroke="#fff"/>';
 case 'pearl-necklace':return '<g fill="#fff5dc">'+[[17,28],[19,44],[27,59],[41,69],[58,69],[73,59],[81,44],[83,28]].map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="7"/>').join('')+'</g><path d="m50 73 8 8-8 10-8-10Z" fill="#aecfea"/>';
 case 'wand':return '<path d="m24 90 42-60" stroke="#baabd9" stroke-width="8"/><g transform="translate(38 -6) scale(.6)">'+star+'</g><path d="m43 63 17 3m-11-15-2 19" stroke="#edbbdb"/>';
 case 'camera':return '<rect x="12" y="30" width="76" height="51" rx="12" fill="#bbd9eb"/><path d="m30 30 8-13h25l8 13" fill="#bad9eb"/><circle cx="51" cy="55" r="18" fill="#e2f5fc"/><circle cx="51" cy="55" r="11" fill="#9bb4d9"/><circle cx="76" cy="41" r="3" fill="#fff"/>';
 case 'icecream':return '<path d="m30 49 20 43 20-43Z" fill="#f2d49b"/><path d="m35 56 22 17m8-17-23 17" stroke="#ceaf7e"/><circle cx="33" cy="39" r="18" fill="#bce3dc"/><circle cx="67" cy="39" r="18" fill="#e0caef"/><circle cx="50" cy="20" r="19" fill="#f4c3d9"/>';
 case 'headphones':return '<path d="M17 57V38a33 33 0 0 1 66 0v19" fill="none" stroke="#a5bfeb" stroke-width="11"/><rect x="9" y="43" width="21" height="34" rx="9" fill="#c8d8f5"/><rect x="70" y="43" width="21" height="34" rx="9" fill="#c8d8f5"/>';
 case 'backpack':return '<rect x="19" y="22" width="62" height="68" rx="19" fill="#b5dce7"/><path d="M37 23V13h26v10M25 31h-8v46m58-46h8v46" fill="none"/><rect x="28" y="54" width="44" height="26" rx="9" fill="#e1f1fa"/><path d="M36 63h28"/>';
 case 'flower-basket':return '<g transform="translate(0 -2) scale(.65)">'+flower+'</g><g transform="translate(39 6) scale(.6)">'+flower+'</g><path d="M16 53h68l-10 35H26Z" fill="#efd0a8"/><path d="M25 53c0-33 50-33 50 0M27 66h46M31 77h38" fill="none"/>';
 case 'cloud-sofa':return '<path d="M16 50V31c0-24 68-24 68 0v19" fill="#d8d4f4"/><rect x="12" y="45" width="76" height="32" rx="12" fill="#ede9ff"/><rect x="4" y="41" width="17" height="33" rx="8" fill="#c7c4ed"/><rect x="79" y="41" width="17" height="33" rx="8" fill="#c7c4ed"/><path d="M19 77v11m62-11v11M25 62h50"/>';
 case 'tea-table':return '<ellipse cx="50" cy="53" rx="44" ry="13" fill="#f0d4b8"/><path d="m20 62-7 30m67-30 7 30" stroke-width="7"/><path d="M23 27h21v18H23Zm21 2c17-4 17 15 0 12" fill="#e4f4fa"/><path d="M58 43h25v-9H58Zm1-9q11-20 22 0" fill="#f2bed8"/>';
 case 'flower-pot':return '<path d="M50 57V11m0 28-22-16m22 4 22-15" stroke="#8db7a8" stroke-width="5"/><path d="M25 19c-15 7-6 22 7 11M73 9c17 4 12 21-2 16M49 8c16-6 23 9 10 14" fill="#fff"/><path d="M23 57h54l-8 35H31Z" fill="#c4d7ee"/><path d="M19 54h62v10H19Z" fill="#e0e9f7"/>';
 case 'music-box':return '<path d="M14 57h72v28H14Z" fill="#e6bfdc"/><ellipse cx="50" cy="57" rx="36" ry="11" fill="#f5dfec"/><path d="M50 52V19"/><g transform="translate(27 2) scale(.46)">'+star+'</g><path d="M23 74h54" stroke="#fff"/>';
 case 'cloud-swing':return '<path d="M21 1v59M79 1v59" stroke="#b6b9df" stroke-width="5"/><g transform="translate(4 40) scale(.92 .56)">'+cloud+'</g><path d="M17 83h66" stroke="#b5cfe4" stroke-width="6"/>';
 case 'motion-peek':return '<g fill="#fff"><ellipse cx="31" cy="49" rx="20" ry="29"/><ellipse cx="72" cy="49" rx="20" ry="29"/></g><g fill="#6c95bf"><ellipse cx="36" cy="54" rx="10" ry="15"/><ellipse cx="77" cy="54" rx="10" ry="15"/></g>';
 case 'motion-float':return '<path d="M48 74C-4 83-4 12 7 16l22 28C15 8 30 6 42 33l8 23 8-23c12-27 27-25 13 11l22-28c11-4 11 67-41 58" fill="#d5e9fa"/>';
 case 'motion-sleep':return '<path d="M15 24h29L16 55h29M56 43h29L57 74h29" fill="none" stroke="#9297cf" stroke-width="7"/>';
 case 'motion-cheer':return '<path d="m19 84 12-50 35 33Z" fill="#c6c3e8"/><path d="m44 17 7-9m25 22 13-4M70 9l-4 10m-7 31 9-12" stroke="#ecaecf" stroke-width="6"/>';
 case 'coin':return '<circle cx="50" cy="50" r="36" fill="#ffe39a"/><circle cx="50" cy="50" r="27" fill="none" stroke="#e2b15d"/><path d="m50 29 6 14 16 2-12 11 3 16-13-8-13 8 3-16-12-11 16-2Z" fill="#f6c465" stroke="none"/>';
 default:return star;
 }
}
export function itemArt(id,klass=''){return '<svg class="item-art '+klass+'" viewBox="0 0 100 100" preserveAspectRatio="'+(id.startsWith('outfit-')?'none':'xMidYMid meet')+'" aria-hidden="true" fill="none" stroke="#8aa7c0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+itemDrawing(id)+'</svg>';}
