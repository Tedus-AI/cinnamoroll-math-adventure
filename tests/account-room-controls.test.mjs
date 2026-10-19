import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {newState,unlockAdministrator,applyAction,publicState} from '../public/game/engine.js';
import {loadAudioPreferences,saveAudioPreferences} from '../public/game/audio-preferences.js';
import {detectPlatform} from '../public/game/platform.js';
import {MUSIC,musicTrack} from '../public/game/music-score.js';
import {SCENES} from '../public/game/wardrobe.js';
import {animatedCharacter} from '../public/game/character.js';
import {fitAttachments} from '../public/game/character-fit.js';

test('successful registration, login and recovery release the home page input lock',async()=>{
 const source=readFileSync(new URL('../public/game/app.js',import.meta.url),'utf8');
 const auth=source.slice(source.indexOf('async function authSubmit(){'),source.indexOf('function recoveryModal(code)'));
 for(const mode of ['register','login','recover'])for(const failure of [false,true]){
  const classes=new Set(),button={disabled:false},error={textContent:''},fields={'#auth-error':error,'#username':{value:'test_player'},'#nickname':{value:'test'},'#recovery-input':{value:'recovery'}};
  const context={busy:false,form:{mode,pin:'12345678'},account:null,state:null,version:0,status:'',view:'home',
   root:{classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}},modalRoot:{querySelector:()=>button},$:s=>fields[s],
   api:async()=>{if(failure)throw Error('network unavailable');return {user:{id:'test'},state:{name:'Test'},version:0,token:'test',recovery:mode==='register'?'test-code':null};},
   stash(){},closeModal(){},render(){if(context.busy)classes.add('busy');},recoveryModal(){},toast(){},put(){}};
  vm.createContext(context);vm.runInContext(auth,context);await context.authSubmit();
  assert.equal(context.busy,false);assert.equal(classes.has('busy'),false);assert.equal(button.disabled,false);
  if(failure)assert.equal(error.textContent,'network unavailable');else assert.ok(context.account);
 }
});
test('audio defaults migrate once to enabled maximum, then preserve deliberate settings including zero',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 for(const key of ['music','audio']){
  data.set(key,JSON.stringify({enabled:false,volume:.2}));
  assert.deepEqual(loadAudioPreferences(storage,key),{enabled:true,volume:1});
  saveAudioPreferences(storage,key,{enabled:false,volume:0});
  assert.deepEqual(loadAudioPreferences(storage,key),{enabled:false,volume:0});
 }
 assert.deepEqual(loadAudioPreferences({getItem(){throw Error();},setItem(){throw Error();}},'audio'),{enabled:true,volume:1});
});
test('automatic device choice handles desktop-mode iPad, Android tablet and touch laptops',()=>{
 assert.equal(detectPlatform({userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:5},false),'tablet');
 assert.equal(detectPlatform({userAgent:'Android',maxTouchPoints:5},true),'tablet');
 assert.equal(detectPlatform({userAgent:'Windows',maxTouchPoints:10},false),'desktop');
 assert.equal(detectPlatform({userAgent:'Windows',maxTouchPoints:0},false),'desktop');
});
test('each room routes to its own distinct named composition',()=>{
 const keys=SCENES.map(s=>musicTrack('dressing',0,false,s.id));
 assert.equal(new Set(keys).size,SCENES.length);assert.equal(new Set(keys.map(k=>JSON.stringify(MUSIC[k].melody))).size,SCENES.length);
 SCENES.forEach((s,i)=>assert.ok(MUSIC[keys[i]].name.startsWith(s.name)));
 assert.equal(musicTrack('dressing',0,false,'unknown'),keys[0]);
});
test('wearable offsets survive saves and size-only changes, reject invalid data atomically, and follow animation',()=>{
 const s=unlockAdministrator(newState());let id=0;
 const run=(type,p)=>applyAction(s,{id:'offset-'+(++id),type,...p});
 run('equip',{item:'hat-starlight'});run('resize-wear',{item:'hat-starlight',scale:1.02,x:1.5,y:-2});
 run('resize-wear',{item:'hat-starlight',scale:1.04});
 assert.deepEqual(publicState(s).wardrobe.wearOffsets['hat-starlight'],{x:1.5,y:-2});
 assert.throws(()=>run('resize-wear',{item:'hat-starlight',scale:1.5,x:Infinity,y:1}));
 assert.equal(s.wardrobe.wearScales['hat-starlight'],1.04);
 assert.throws(()=>run('resize-wear',{item:'outfit-cape',scale:1,x:1,y:1}));
 const el={dataset:{wearSlot:'head',wearItem:'hat-starlight',offsetX:'1.5',offsetY:'-2'},style:{}};
 const zero={dataset:{wearSlot:'head',wearItem:'hat-starlight',offsetX:'0',offsetY:'0'},style:{}};
 for(const pose of [0,1,3,5]){
  fitAttachments({querySelectorAll:()=>[el]},pose);fitAttachments({querySelectorAll:()=>[zero]},pose);
  assert.ok(Math.abs(parseFloat(el.style.left)-parseFloat(zero.style.left)-1.5)<1e-8);
  assert.ok(Math.abs(parseFloat(el.style.top)-parseFloat(zero.style.top)+2)<1e-8);
 }
 const markup=animatedCharacter(s.wardrobe.slots,1,'original',s.wardrobe.wearScales,s.wardrobe.wearOffsets);
 assert.ok(markup.includes('data-motion="float"'));assert.ok(markup.includes('data-offset-x="1.5"'));
});
