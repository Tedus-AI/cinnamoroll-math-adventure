import {loadAudioPreferences,saveAudioPreferences} from './audio-preferences.js';
// Local synthesized effects; no third-party audio requests or automatic playback.
const scores={click:[[740,.035]],digit:[[880,.045]],step:[[784,.07],[988,.09]],correct:[[660,.08],[880,.08],[1175,.18]],wrong:[[294,.1],[247,.18]],attack:[[440,.05],[880,.07],[1568,.16]],hurt:[[185,.08],[130,.16]],clear:[[523,.12],[659,.12],[784,.12],[1047,.3]],bossWin:[[523,.1],[659,.1],[784,.1],[1047,.17],[1319,.3]],defeat:[[392,.14],[330,.14],[262,.3]],reward:[[1047,.08],[1319,.08],[1568,.24]],equip:[[698,.08],[1047,.15]],start:[[523,.08],[784,.18]]};
let ctx,lastClick=0;
let enabled=true,volume=1;
try{({enabled,volume}=loadAudioPreferences(localStorage,'cloudmath:audio'));}catch{}
export function audioSettings(){return {enabled,volume};}
export function setAudio(next){enabled=next.enabled??enabled;volume=Number.isFinite(next.volume)?Math.max(0,Math.min(1,next.volume)):volume;try{saveAudioPreferences(localStorage,'cloudmath:audio',{enabled,volume});}catch{}if(!enabled&&ctx?.state==='running')void ctx.suspend().catch(()=>{});}
export function unlockAudio(){if(!enabled)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ctx??=new C();if(ctx.state==='suspended')void ctx.resume().catch(()=>{});}catch{}}
export function sound(name){
 if(!enabled||document.hidden)return;unlockAudio();if(!ctx||ctx.state!=='running')return;
 if(name==='click'||name==='digit'){if(performance.now()-lastClick<45)return;lastClick=performance.now();}
 let time=ctx.currentTime+.012;for(const [freq,duration] of scores[name]||scores.click){const o=ctx.createOscillator(),g=ctx.createGain();o.type=['hurt','wrong','defeat'].includes(name)?'triangle':'sine';o.frequency.setValueAtTime(freq,time);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume*.17,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+duration);o.connect(g);g.connect(ctx.destination);o.start(time);o.stop(time+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};time+=duration+.025;}
}
document.addEventListener('pointerdown',unlockAudio,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ctx?.state==='running')void ctx.suspend().catch(()=>{});});
