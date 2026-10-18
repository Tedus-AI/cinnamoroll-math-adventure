export const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let mode=(isIOS||navigator.maxTouchPoints>1&&matchMedia('(pointer: coarse)').matches)?'tablet':'desktop';
try{const saved=localStorage.getItem('cloudmath:platform');if(['tablet','desktop'].includes(saved))mode=saved;}catch{}
export const tabletMode=()=>mode==='tablet';
export const platformLabel=()=>tabletMode()?'平板版':'電腦版';
export const pageFullscreen=()=>document.documentElement.classList.contains('page-fullscreen');
export function applyPlatform(){document.documentElement.dataset.platform=mode;}
export async function switchPlatform(){
 mode=tabletMode()?'desktop':'tablet';
 document.documentElement.classList.remove('page-fullscreen');
 if(tabletMode()&&(document.fullscreenElement||document.webkitFullscreenElement))await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
 try{localStorage.setItem('cloudmath:platform',mode);}catch{}
 applyPlatform();
}
export async function togglePageFullscreen(){
 if(document.fullscreenElement||document.webkitFullscreenElement)await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
 document.documentElement.classList.toggle('page-fullscreen');
}
if(typeof document!=='undefined'){
applyPlatform();
// Suppress content callouts only inside the game; input fields keep text editing.
const editable=target=>target.closest('input,textarea,[contenteditable="true"]');
document.addEventListener('contextmenu',e=>{if(tabletMode()&&e.target.closest('#app')&&!editable(e.target))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(e.target.closest('#app img,#app svg,#app canvas'))e.preventDefault();});

}
