export function detectPlatform(device,coarse=false){
 const ios=/iPad|iPhone|iPod/.test(device.userAgent||'')||(device.platform==='MacIntel'&&device.maxTouchPoints>1);
 return ios||device.maxTouchPoints>1&&coarse?'tablet':'desktop';
}
export const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const pointer=typeof matchMedia==='function'?matchMedia('(pointer: coarse)'):null;
let mode=detectPlatform(navigator,pointer?.matches);
export const tabletMode=()=>mode==='tablet';
export function applyPlatform(){document.documentElement.dataset.platform=mode;document.documentElement.classList.toggle('page-fullscreen',tabletMode());}
export async function togglePageFullscreen(){
 if(document.fullscreenElement||document.webkitFullscreenElement)await (document.exitFullscreen||document.webkitExitFullscreen).call(document);
 applyPlatform();
}
if(typeof document!=='undefined'){
 applyPlatform();
 pointer?.addEventListener('change',()=>{const next=detectPlatform(navigator,pointer.matches);if(next===mode)return;mode=next;applyPlatform();window.dispatchEvent(new Event('gameplatformchange'));});
 // Suppress content callouts only inside the game; input fields keep text editing.
 const editable=target=>target.closest('input,textarea,[contenteditable="true"]');
 document.addEventListener('contextmenu',e=>{if(tabletMode()&&e.target.closest('#app')&&!editable(e.target))e.preventDefault();});
 document.addEventListener('dragstart',e=>{if(e.target.closest('#app img,#app svg,#app canvas'))e.preventDefault();});
}
