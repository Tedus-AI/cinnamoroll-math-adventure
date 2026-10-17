import {MUSIC,musicTrack} from './music-score.js';
let ctx,bus,timer,nextNote=0,step=0,current='home',playing=null,unlocked=false;
let enabled=true,volume=.22;
const voices=new Set(),clamp=n=>Math.max(0,Math.min(.7,Number(n)));
try{const saved=JSON.parse(localStorage.getItem('cloudmath:music'));if(saved){enabled=saved.enabled!==false;if(Number.isFinite(saved.volume))volume=clamp(saved.volume);}}catch{}
export function musicSettings(){return {enabled,volume,track:current,title:MUSIC[current].name,playing:playing===current&&ctx?.state==='running'};}
export function setMusic(next){
 enabled=next.enabled??enabled;if(Number.isFinite(next.volume))volume=clamp(next.volume);
 try{localStorage.setItem('cloudmath:music',JSON.stringify({enabled,volume}));}catch{}
 if(!enabled){stopMusic();return;}
 if(bus&&ctx)bus.gain.setTargetAtTime(volume,ctx.currentTime,.12);
 void resumeMusic();
}
export function setMusicScene(view,world,boss){
 const key=musicTrack(view,world,boss);if(key===current)return;
 current=key;stopMusic();if(unlocked&&enabled&&!document.hidden)void resumeMusic();
}
async function resumeMusic(){
 if(!unlocked||!enabled||document.hidden)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  ctx??=new C();
  if(ctx.state!=='running')await ctx.resume();
  if(ctx.state==='running'&&enabled&&!document.hidden&&!playing)startMusic();
 }catch{}
}
function tone(midi,time,duration,level,type='sine'){
 const osc=ctx.createOscillator(),gain=ctx.createGain(),freq=440*Math.pow(2,(midi-69)/12);
 osc.type=type;osc.frequency.setValueAtTime(freq,time);
 gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),time+.02);
 gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
 osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+duration+.03);
 voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
}
function schedule(){
 if(!ctx||ctx.state!=='running'||!playing||document.hidden)return;
 const track=MUSIC[playing],beat=60/track.bpm,half=beat/2;
 if(nextNote<ctx.currentTime-.5)nextNote=ctx.currentTime+.04;
 while(nextNote<ctx.currentTime+.32){
  const i=step%track.melody.length,note=track.melody[i],bar=Math.floor(step/8)%track.chords.length,chord=track.root+track.chords[bar];
  if(note!==null){
   tone(track.root+note,nextNote,half*1.6,.16,track.timbre);
   tone(track.root+note+12,nextNote+.005,half*.65,.025);
  }
  if(step%4===0)tone(chord-12,nextNote,beat*1.8,.11,'triangle');
  if(step%2===0){
   const minor=track.boss||playing==='world-4';
   const degree=[0,minor?3:4,7,12][Math.floor(step/2)%4];
   tone(chord+degree,nextNote+.025,beat*1.25,.045);
  }
  if(track.boss&&step%2===0){
   tone(step%4===0?31:43,nextNote,.1,.16,'triangle');
   tone(91,nextNote+.01,.04,.018,'triangle');
  }
  step++;nextNote+=half;
 }
}
function startMusic(){
 if(playing||!enabled||document.hidden)return;
 bus=ctx.createGain();bus.gain.setValueAtTime(.0001,ctx.currentTime);bus.gain.linearRampToValueAtTime(volume,ctx.currentTime+.4);bus.connect(ctx.destination);
 playing=current;step=0;nextNote=ctx.currentTime+.05;schedule();timer=setInterval(schedule,80);
}
function stopMusic(){
 clearInterval(timer);timer=null;playing=null;
 if(!ctx)return;
 const old=bus;bus=null;
 if(old){old.gain.cancelScheduledValues(ctx.currentTime);old.gain.setTargetAtTime(.0001,ctx.currentTime,.055);setTimeout(()=>old.disconnect(),240);}
 for(const osc of [...voices]){try{osc.stop(ctx.currentTime+.2);}catch{}}
}
function gesture(){unlocked=true;void resumeMusic();}
document.addEventListener('pointerdown',gesture,{passive:true});
document.addEventListener('keydown',gesture,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();if(ctx?.state==='running')void ctx.suspend().catch(()=>{});}else void resumeMusic();});
window.addEventListener('pagehide',stopMusic);
