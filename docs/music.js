import {loadAudioPreferences,saveAudioPreferences} from './audio-preferences.js';
import {MUSIC,musicTrack} from './music-score.js';
let ctx,bus,timer,nextNote=0,step=0,current='home',playing=null,unlocked=false;
let enabled=true,volume=1,voicePaused=false;
export function setVoiceInput(active){voicePaused=active;if(active)stopMusic();else void resumeMusic();}
const voices=new Set(),clamp=n=>Math.max(0,Math.min(1,Number(n)));
try{({enabled,volume}=loadAudioPreferences(localStorage,'cloudmath:music'));}catch{}
export function musicSettings(){return {enabled,volume,track:current,title:MUSIC[current].name,playing:playing===current&&ctx?.state==='running'};}
export function setMusic(next){
 enabled=next.enabled??enabled;if(Number.isFinite(next.volume))volume=clamp(next.volume);
 try{saveAudioPreferences(localStorage,'cloudmath:music',{enabled,volume});}catch{}
 if(!enabled){stopMusic();return;}
 if(bus&&ctx)bus.gain.setTargetAtTime(volume,ctx.currentTime,.12);
 void resumeMusic();
}
export function setMusicScene(view,world,boss,scene){
 const key=musicTrack(view,world,boss,scene);if(key===current)return;
 current=key;stopMusic();if(unlocked&&enabled&&!document.hidden)void resumeMusic();
}
async function resumeMusic(){
 if(!unlocked||!enabled||voicePaused||document.hidden)return;
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  ctx??=new C();
  if(ctx.state!=='running')await ctx.resume();
  if(ctx.state==='running'&&enabled&&!voicePaused&&!document.hidden&&!playing)startMusic();
 }catch{}
}
function tone(midi,time,duration,level,type='sine',attack=.02){
 const osc=ctx.createOscillator(),gain=ctx.createGain(),freq=440*Math.pow(2,(midi-69)/12);
 osc.type=type;osc.frequency.setValueAtTime(freq,time);
 gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),time+Math.min(attack,duration/3));
 gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
 osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+duration+.03);
 voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};
}
function instrument(midi,time,duration,level,name){
 const partials={flute:[[0,1,'sine'],[12,.12,'sine']],harp:[[0,1,'triangle'],[12,.16,'sine']],steel:[[0,1,'sine'],[19,.28,'sine'],[28,.08,'sine']],bell:[[0,1,'sine'],[19,.32,'sine'],[31,.12,'sine']],strings:[[0,.8,'triangle'],[12,.22,'triangle']],brass:[[0,.8,'triangle'],[7,.18,'triangle'],[12,.3,'triangle']]};
 for(const [offset,gain,type] of partials[name]||[[0,1,'sine']])tone(midi+offset,time,duration,level*gain,type,name==='strings'?.14:.02);
}
function schedule(){
 if(!ctx||ctx.state!=='running'||!playing||document.hidden)return;
 const track=MUSIC[playing],beat=60/track.bpm,half=beat/2;
 if(nextNote<ctx.currentTime-.5)nextNote=ctx.currentTime+.04;
 while(nextNote<ctx.currentTime+.32){
  const i=step%track.melody.length,note=track.melody[i],bar=Math.floor(step/(track.beats||8))%track.chords.length,chord=track.root+track.chords[bar];
  if(note!==null&&(!track.notes||track.notes[step%track.notes.length])){
   instrument(track.root+note,nextNote,half*(track.length||1.6),.13,track.instrument);
   tone(track.root+note+12,nextNote+.005,half*.65,.025);
  }
  if(step%(track.beats||4)===0)tone(chord-12,nextNote,beat*1.8,.11,'triangle');
  if(step%2===0){
   const minor=track.boss||playing==='world-4';
   const arp=track.arp||[0,minor?3:4,7,12],degree=arp[Math.floor(step/2)%arp.length];
   tone(chord+degree,nextNote+.025,beat*1.25,.045);
  }
  if(track.boss&&step%2===0){
   tone(step%4===0?31:43,nextNote,.1,.16,'triangle');
   tone(91,nextNote+.01,.04,.018,'triangle');
  }
  nextNote+=half*(1+(step%2===0?1:-1)*(track.swing||0));step++;
 }
}
function startMusic(){
 if(playing||!enabled||voicePaused||document.hidden)return;
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
