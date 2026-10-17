import {DIFFICULTIES,SKINS,difficultyStars,difficultyUnlocked,totalStars,ensureProgression} from './progression.js';
import {bindRoomPlacement} from './room-placement.js';
import {mountCharacters} from "./character.js";
import {sound,unlockAudio,audioSettings,setAudio} from "./audio.js";
import {musicSettings,setMusic,setMusicScene} from "./music.js";
import {itemArt} from "./item-art.js";
import {ensureWardrobe} from "./wardrobe.js";
import {roomMarkup,itemCard,animateRoom,stopRoom} from "./dressing-room.js";
let closetTab="accessory",closetPage=0,focusMode=false;
import {WORLDS,COLLECTION,QUESTS,MODULES,newState,applyAction,dailyReset,playerLevel,stageUnlocked,worldUnlocked,divisionSteps} from "./engine.js";
import {cinna,bossArt,scenery} from "./art.js";
import {API_BASE} from "./config.js";
const $=s=>document.querySelector(s);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
let guest=read("cloudmath:guest",newState()),account=read("cloudmath:account",null),state=account?read("cloudmath:save:"+account.user.id,newState(account.user.name)):guest;
let version=account?.version||0,view="home",selectedWorld=2,busy=false,status=account?"同步中":"訪客進度已儲存";
let form=null,ui={mode:"guide",field:"quotient",quotient:"",remainder:"",guide:null,assisted:false,feedback:null,lastQ:null,focus:3,difficulty:0},toastTimer;
let collectionPage=0,reportPage=0,reportTab="history",lessonPage=0,battleFx=null;
const root=$("#app"),modalRoot=$("#modal");
function identity(){return account?.user.id||"guest";}
function stash(){if(account){account.version=version;put("cloudmath:account",account);put("cloudmath:save:"+identity(),state);}else{guest=state;status=put("cloudmath:guest",state)?"訪客進度已儲存":"此瀏覽器無法儲存訪客進度";}}
function toast(text){$("#toast").textContent=text;$("#toast").classList.add("visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("visible"),3600);}
async function api(action,body=null){
 const res=await fetch(API_BASE+"/"+action,{method:body?"POST":"GET",headers:{"Content-Type":"application/json",...(account?{Authorization:"Bearer "+account.token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout?AbortSignal.timeout(20000):undefined});
 let data;try{data=await res.json();}catch{throw new Error("雲端服務暫時無法連線");}
 if(!res.ok){if(data.state){state=data.state;version=data.version;stash();}const e=new Error(data.error||"操作失敗");e.status=res.status;throw e;}return data;
}
async function event(type,props={}){
 if(busy)return null;busy=true;root.classList.add("busy");
 let command={id:crypto.randomUUID(),type,...props,version};
 const pendingKey="cloudmath:pending:"+identity();
 if(account){const p=read(pendingKey,null);if(p)command=p;else put(pendingKey,command);status="儲存中";}
 try{
 let result;if(account){const data=await api("event",command);state=data.state;version=data.version;result=data.result;status="雲端已儲存";put(pendingKey,null);}
 else result=applyAction(state,command);
 ensureWardrobe(state);stash();return result||{};
 }catch(e){if(e.status&&e.status!==503){put(pendingKey,null);status=e.status===401?"請重新登入":"已同步最新進度";}else status="尚未儲存，請重試";toast(e.message);if(e.status===409){resetQuestion();render();}return null;}
 finally{busy=false;root.classList.remove("busy");}
}
function resetQuestion(){
 const q=state.run?.questions[state.run.index];if(!q)return;
 ui.lastQ=q;ui.quotient="";ui.remainder="";ui.field="quotient";ui.assisted=false;ui.feedback=null;
 ui.mode="guide";
 const cached=read("cloudmath:work:"+identity()+":"+q.id,null);
 ui.guide=cached||{step:0,phase:0,entered:"",values:{},assisted:false};
 const total=divisionSteps(q.a,q.b).length;if(ui.guide.step>=total){ui.guide.step=total-1;ui.guide.phase=2;ui.guide.entered=ui.guide.values[(total-1)+":2"]||"";}
}
function stashWork(){const q=state.run?.questions[state.run.index];if(q)put("cloudmath:work:"+identity()+":"+q.id,ui.guide);}
function currentQ(){return state.run?.questions[state.run.index];}
function nav(){return [["home","☁️","冒險地圖"],["daily","🌟","每日任務"],["practice","✏️","自由練習"],["dressing","🧸","換裝小屋"],["collection","🎀","我的收藏"],["report","📘","學習紀錄"]].map(([id,icon,label])=>'<button class="nav-item '+(view===id||view==="world"&&id==="home"?"active":"")+'" data-action="nav" data-view="'+id+'"><span>'+icon+'</span>'+label+'</button>').join("");}
function render(){
 root.onpointerdown=null;
 stopRoom();ensureWardrobe(state);ensureProgression(state);dailyReset(state);const w=view==="play"?state.run?.world??2:view==="world"?selectedWorld:2;document.body.dataset.view=view;
 root.innerHTML='<div class="shell">'+scenery(w,"app-scenery")+'<aside class="rail"><div class="rail-logo">'+cinna()+'</div>'+nav()+'<div class="rail-foot">小小練習<br>大大進步 ♡</div></aside><div class="page"><header class="topbar"><div class="brand">大耳狗的雲朵除法冒險<small>CLOUD MATH ADVENTURE</small></div><div class="top-actions"><button class="sound-button" data-action="sound-settings" aria-label="音樂與音效設定">'+(audioSettings().enabled?"🔊":"🔇")+'</button><button class="fullscreen-button" data-action="focus-mode">'+(focusMode?"離開專注模式":"專注模式")+'</button><button class="fullscreen-button" data-action="fullscreen">'+(document.fullscreenElement||document.webkitFullscreenElement?"⤡ 離開全螢幕":"⛶ 全螢幕")+'</button><div class="currency">雲朵幣 <b>'+state.coins+'</b></div><button class="profile" data-action="account"><span class="avatar">☁️</span><span class="profile-name">'+(account?safe(state.name):"登入雲端")+'</span></button></div></header><main class="content">'+(view==="home"?home():view==="daily"?dailyPage():view==="world"?worldPage():view==="play"?play():view==="practice"?practice():view==="dressing"?roomMarkup(state,closetTab,closetPage):view==="collection"?collection():view==="report"?report():modules())+'</main><footer class="footer">非官方粉絲學習作品 · Cinnamoroll / Sanrio · 每一步都算進步。</footer></div></div>';if(busy)root.classList.add("busy");if(view==="dressing"){animateRoom(state);bindRoomPlacement(root,state,async (props,type="place-prop")=>{const r=await event(type,props);if(r)render();return Boolean(r);});}mountCharacters(root);
 const musicView=view==="play"&&state.run?.kind!=="level"?"practice":view;
 setMusicScene(musicView,w,view==="play"&&Boolean(state.run?.boss));
 root.querySelector(".currency").innerHTML=itemArt("coin","inline-art")+" <b>"+state.coins+"</b>";
 if(account?.user.role==="admin")root.querySelector(".top-actions").insertAdjacentHTML("afterbegin",'<span class="admin-badge">管理員 · 全部解鎖</span>');
}
function saved(){return '<span class="status '+(status.includes("未")||status.includes("重試")?"warning":"")+'">'+safe(status)+'</span>';}
function title(h,p,label="YOUR LITTLE ADVENTURE"){return '<div class="title-row"><div><div class="eyebrow">'+label+'</div><h1>'+h+'</h1><p>'+p+'</p></div>'+saved()+'</div>';}
function continueCard(){return state.run?'<div class="continue-card"><p>☁️ 你的冒險還在等你 · 已完成 '+state.run.index+' / '+state.run.questions.length+' 題</p><button class="small-button" data-action="continue">繼續冒險 →</button></div>':"";}
function quests(){return '<section class="panel"><h2>☀️ 每日小任務</h2><p class="sub">'+safe(state.daily.day)+' · 每天一點點就很好</p>'+QUESTS.map(q=>{const n=Math.min(q.goal,state.daily[q.key]),claimed=state.daily.claimed.includes(q.key);return '<div class="quest"><div class="quest-title"><span>'+q.name+'</span><span>雲朵幣 '+q.reward+'</span></div><p>'+q.desc+'</p><div class="progress"><span style="width:'+n/q.goal*100+'%"></span></div><div class="quest-bottom"><span>'+n+' / '+q.goal+'</span>'+(claimed?'<span>已領取 ✓</span>':n===q.goal?'<button class="small-button" data-action="claim" data-key="'+q.key+'">領取獎勵</button>':'<button class="small-button" data-action="'+(q.key==="review"?"review":q.key==="levels"?"world":"quick")+'" '+(q.key==="levels"?'data-world="2"':"")+'>去練習 →</button>')+'</div></div>';}).join("")+'</section>';}
function worldCards(){return WORLDS.map(w=>{const open=worldUnlocked(state,w.id),done=Array.from({length:6},(_,i)=>state.levels[w.id+":"+i]||0).filter(Boolean).length;return '<button class="world-card '+(open?"":"locked")+'" data-action="world" data-world="'+w.id+'">'+scenery(w.id)+'<span class="world-label">'+(w.id===2?"四位數主線":open?"WORLD 0"+(w.id+1):"🔒 待解鎖")+'</span><div class="world-card-caption"><h3>'+w.icon+' '+w.name+'</h3><p>'+w.subtitle+'</p><div class="world-footer"><span>'+done+' / 6 關 · ★ '+totalStars(state,w.id)+' / 54</span><span>'+(open?"出發 →":"完成上一世界魔王關")+'</span></div></div></button>';}).join("");}
function home(){return title("出發吧，小小雲朵冒險家！","今天也和大耳狗一起，讓數學變成一場旅行。")+continueCard()+'<section class="hero">'+scenery(2)+'<div class="hero-text"><span class="hero-tag">🌈 四位數除法 · 彩虹港灣</span><h2>收集星光，<br>一起守護雲朵世界</h2><button class="primary" data-action="quick">開始 5 題冒險 →</button></div>'+cinna(state.wardrobe,"hero-friend",1)+'<div class="hero-caption">每一步，都有我陪著你 ♡</div></section><div class="section-heading"><h2>六個世界，六段奇遇</h2><button class="small-button" data-action="nav" data-view="daily">🌟 每日任務 '+state.daily.claimed.length+' / 3 →</button></div><div class="world-grid">'+worldCards()+'</div>';}
function dailyPage(){return title("每天一點點，收集小小成就","任務每天更新，已收集的寶物永遠陪著你。")+quests()+'<div class="daily-companion">'+cinna(state.wardrobe,"",3)+'<div><h2>今天也陪著你 ♡</h2><p>冒險等級 '+playerLevel(state)+' · 已答對 '+state.fourCorrect+' 道四位數除法</p><p>已收藏 '+state.inventory.length+' 個寶物 · 連續練習 '+state.streak+' 天</p><button class="primary" data-action="nav" data-view="collection">打開收藏冊 →</button></div></div>';}
function worldPage(){
 const w=WORLDS[selectedWorld],names=["出發的小雲朵","一起試試商","乘一乘，減一減","餘數的祕密","勇者的試煉",w.boss];
 return '<button class="back" data-action="nav" data-view="home">← 回到冒險地圖</button><div class="world-detail" style="--world-color:'+w.color+'">'+scenery(w.id)+'<div class="world-detail-copy"><div class="eyebrow">WORLD 0'+(w.id+1)+'</div><h1>'+w.icon+' '+w.name+'</h1><p>'+w.subtitle+' · '+(w.digits===4?"主要練習四位數 ÷ 二位數":w.digits+"位數 ÷ 二位數")+'</p><span class="pill">5 個關卡 + 1 位魔王</span></div>'+cinna(state.wardrobe)+'</div><div class="section-heading"><h2>選一關，開始冒險</h2>'+saved()+'</div><div class="stages">'+names.map((name,i)=>{const open=stageUnlocked(state,w.id,i);return '<button class="stage '+(i===5?"boss ":"")+(open?"active":"")+'" data-action="stage" data-world="'+w.id+'" data-stage="'+i+'" '+(open?"":"disabled")+'><div class="stage-number">'+(open?(i===5?"♛":i+1):"🔒")+'</div><h3>'+name+'</h3><p>'+(i===5?"8 道除法 · 讓烏雲散開":"5 道除法 · 一步一步前進")+'</p><div class="stars">'+(open?DIFFICULTIES.map((n,d)=>n+" "+"★".repeat(difficultyStars(state,w.id,i,d))+"☆".repeat(3-difficultyStars(state,w.id,i,d))).join("<br>"):"完成上一關後解鎖")+'</div></button>';}).join("")+'</div><div class="banner">🎁 每個難度各收集 3 星，依序完成簡單 → 普通 → 困難。每個難度首次通關都有額外雲朵幣。</div>';
}
function practice(){
 return title("想練哪一種，自己決定","每次 5 題，從適合自己的難度開始。","PRACTICE AT YOUR OWN PACE")+continueCard()+'<div class="practice-intro">✏️ 以四位數除法為主，也能選擇二位數或三位數暖身。<br>直式引導會陪你完成「商 → 乘 → 減 → 拉下」。整除時，餘數記得填 0。</div><div class="dashboard"><section class="panel"><h2>選擇練習範圍</h2><div class="focus-chips">'+[[3,"四位數 ÷ 二位數"],[2,"三位數 ÷ 二位數"],[1,"二位數 ÷ 二位數"]].map(([t,n])=>'<button class="'+(ui.focus===t?"chosen":"")+'" data-action="focus" data-tier="'+t+'">'+n+'</button>').join("")+'</div><h2 style="margin:23px 0 14px">選擇練習方式</h2>'+difficultyButtons()+'<button class="primary submit" data-action="practice-start">開始練習 →</button></section><aside class="side-stack"><section class="panel"><h2>📘 錯題變成小進步</h2><p class="sub">還有 '+state.mistakes.length+' 道題目等你再試一次</p><p class="readout">答對後，這題就會從錯題本畢業。沒有錯題時，會安排 2 道四位數複習。</p><button class="secondary" data-action="review">開始複習 →</button></section><section class="panel"><h2>更多數學冒險</h2><p class="readout">除法是第一站，未來還有新的樂園。</p><button class="ghost" data-action="nav" data-view="modules">看看未來主題 →</button></section></aside></div>';
}
function difficultyButtons(w=null,l=null){return '<div class="difficulty">'+[['☁ 簡單','逐步引導 · 魔王戰 5 點生命'],['虹 普通','標準練習 · 魔王戰 4 點生命'],['★ 困難','進階試商 · 魔王戰 3 點生命']].map(([n,desc],d)=>{const open=w===null||difficultyUnlocked(state,w,l,d),stars=w===null?0:difficultyStars(state,w,l,d);return '<button class="'+(ui.difficulty===d?'chosen':'')+'" data-action="difficulty" data-value="'+d+'" '+(open?'':'disabled')+'><b>'+n+'</b><small>'+desc+'</small>'+(w===null?'':'<span class="difficulty-stars">'+(open?'★'.repeat(stars)+'☆'.repeat(3-stars):'完成'+DIFFICULTIES[d-1]+'後解鎖')+'</span>')+'</button>';}).join('')+'</div>';}
function keypad(auth=false){return '<div class="keypad '+(auth?"auth-keypad":"")+'">'+[1,2,3,4,5,6,7,8,9,"clear",0,"back"].map(n=>'<button '+(typeof n==="number"?'data-digit="'+n+'"':'data-action="'+(auth?"auth-":"")+n+'" class="utility"')+' aria-label="'+(n==="clear"?"清除":n==="back"?"退一格":n)+'">'+(n==="clear"?"清除":n==="back"?"⌫":n)+'</button>').join("")+'</div>';}
function numberField(key,label,value){return '<button class="number-field '+(ui.field===key?"selected":"")+'" data-action="field" data-field="'+key+'" aria-label="'+label+'，目前'+(value||"尚未填寫")+'"><small>'+label+'</small><strong>'+safe(value||"？")+'</strong></button>';}
function arena(r,result=null){
const fx=result?(result.outcome==="lost"?"defeat":"victory"):(battleFx&&Date.now()<battleFx.until?battleFx.type:"idle");
const hp=r.playerHp??[5,4,3][r.difficulty??0],max=r.maxPlayerHp??[5,4,3][r.difficulty??0],bh=r.bossHp??(r.questions?.length??8)-(r.index??0),bm=r.maxBossHp??r.questions?.length??8;
return '<section class="arena '+(r.boss?"battle-arena ":"travel-arena ")+fx+'" aria-label="'+(r.boss?"魔王戰場":"大耳狗陪你冒險")+'">'+scenery(r.world??2)+'<div class="arena-sparkles" aria-hidden="true">✦　　✧　　✦　　♡</div><div class="fighter hero-fighter">'+cinna(state.wardrobe,"",fx==="hero-attack"?2:fx==="hurt"||fx==="defeat"?4:fx==="victory"?3:1)+'</div>'+(r.boss?'<div class="fighter enemy-fighter">'+bossArt(r.world)+'</div><div class="battle-hud"><div class="hp-card"><b>大耳狗</b><span class="hearts" aria-label="生命 '+hp+' / '+max+'">'+"♥".repeat(hp)+'<i>'+"♡".repeat(max-hp)+'</i></span></div><div class="hp-card enemy-hp"><b>'+WORLDS[r.world].boss+'</b><span>'+bh+' / '+bm+'</span><div class="health-track"><span style="width:'+bh/bm*100+'%"></span></div></div></div><span class="magic-shot" aria-hidden="true">'+(fx==="hurt"||fx==="defeat"?"☄":"⭐")+'</span><span class="damage-number" aria-hidden="true">−1</span><div class="arena-caption">'+(fx==="hero-attack"?"星光魔法！魔王 −1":fx==="hurt"?"再想一想，大耳狗生命 −1":fx==="defeat"?"休息一下，再來守護彩虹！":fx==="victory"?"烏雲散開，世界放晴了！":"完成一題就攻擊 · 每一步算錯扣 1 點生命")+'</div>':'<div class="journey-message">'+(fx==="hero-attack"?"算對了！星光又多一顆 ✨":"慢慢算，我會陪你一起前進 ♡")+'</div><div class="travel-treasures" aria-hidden="true">🌸　⭐　🎀</div>')+'</section>';
}
function play(){
const r=state.run;if(!r){view="home";return home();}const solved=ui.feedback?.correct,q=solved?ui.solvedQ:currentQ();
return '<div class="play-top"><div><div class="eyebrow">CINNAMOROLL’S LITTLE ADVENTURE</div><h1>'+(r.kind==="level"?WORLDS[r.world].name+" · "+(r.boss?"魔王挑戰":"第 "+(r.stage+1)+" 關"):r.kind==="review"?"錯題複習":"除法小練習")+'</h1></div><div class="play-progress">'+(solved?r.index:r.index+1)+' / '+r.questions.length+' 題 <button class="small-button" data-action="leave">暫停</button></div></div>'+arena(r)+'<div class="play-layout"><section class="math-side"><div class="play-card '+(solved?"solved":"")+'"><div class="problem-meta"><span>'+q.a+' ÷ '+q.b+' · 直式引導</span><span>商 → 乘 → 減 → 拉下</span></div>'+guide(q)+(ui.feedback?'<div class="feedback '+(ui.feedback.correct?"good":"")+'" role="status">'+safe(ui.feedback.text)+(ui.feedback.correct?'<button class="primary" data-action="next">下一題 →</button>':"")+'</div>':"")+'</div><div class="hint-row"><button data-action="hint">💡 看提示</button><button data-action="lesson">📘 一起看直式</button><span>'+saved()+'</span></div></section><aside class="keypad-panel"><p class="keypad-title">☁ 數字雲朵 ☁</p>'+keypad()+'<button class="primary submit" data-action="'+(solved?"next":"submit")+'">'+(solved?"下一題 →":"確認這一步 ✓")+'</button><p class="keypad-note">點數字填答案，不會叫出平板鍵盤<br>'+(r.boss?"留意生命值，想清楚再送出 ♡":"每一步都算進步 ♡")+'</p></aside></div>';
}
function targets(q){return divisionSteps(q.a,q.b);}
function guide(q){
 const steps=targets(q),g=ui.guide||{step:0,phase:0,entered:"",values:{}},s=steps[Math.min(g.step,steps.length-1)];
 const ds=String(q.a).split(""),offset=4-ds.length;let cells="";
 for(let i=0;i<4;i++){const st=steps.findIndex(v=>v.column+offset===i);const val=st>=0?g.values[st+":0"]:"";const active=st===g.step&&g.phase===0;cells+='<span class="digit qcell '+(active?"active":"")+'" style="grid-column:'+(3+i)+';grid-row:1">'+(active?safe(g.entered||"·"):safe(val||""))+'</span>';}
 cells+='<span class="divisor">'+q.b+'</span><span class="bracket"></span>';
 for(let i=0;i<4;i++)cells+='<span class="digit dividend" style="grid-column:'+(3+i)+';grid-row:2">'+(ds[i-offset]||"")+'</span>';
 const rowText=(value,col,row,cls="")=>{const chars=String(value).split("");for(let j=0;j<chars.length;j++)cells+='<span class="digit '+cls+'" style="grid-column:'+(3+offset+col-chars.length+1+j)+';grid-row:'+row+'">'+safe(chars[j])+'</span>';};
 for(let i=0;i<steps.length;i++){const st=steps[i];if(g.values[i+":1"]!==undefined){rowText(g.values[i+":1"],st.column,3+i*2,"dim line");cells+='<span class="digit dim" style="grid-column:2;grid-row:'+(3+i*2)+'">−</span>';}if(g.values[i+":2"]!==undefined){rowText(g.values[i+":2"],st.column,4+i*2,"dim");if(st.next!==null&&g.step>i)rowText(st.next,st.column+1,4+i*2,"brought");}}
 const prompts=[s.value+" ÷ "+q.b+"，這一位的商是幾？",q.b+" × "+s.q+"，乘積是多少？",s.value+" − "+s.product+"，剩下多少？"];
 const labels=["這位的商","乘積","相減結果"];
 if(ui.feedback?.correct)return '<div class="division-board">'+cells+'</div><div class="guide-instruction">每一步都完成了，真棒！</div>';
 return '<div class="division-board">'+cells+'</div><p class="guide-instruction">第 '+Math.min(g.step+1,steps.length)+' 輪 · '+["商","乘","減"][g.phase]+' '+(s.q===0?"· 這一位可能要寫 0，不能跳過喔":"")+'</p><div class="guide-current"><p>'+prompts[g.phase]+'</p><button class="number-field selected" aria-label="'+labels[g.phase]+'"><small>'+labels[g.phase]+'</small><strong>'+safe(g.entered||"？")+'</strong></button></div>';
}
async function digit(d){
 if(form){if(form.mode==="recover")return;const max=form.mode==="admin"?4:12;if(form.pin.length<max)form.pin+=String(d);const el=$("#auth-pin");if(el)el.textContent="●".repeat(form.pin.length)||"請用下方數字盤";return;}
 if(view!=="play"||!state.run||ui.feedback?.correct||busy)return;
 if(ui.mode==="guide"){const g=ui.guide;if(g.entered.length<(g.phase===0?1:4))g.entered+=d;stashWork();}
 else if(ui[ui.field].length<(ui.field==="quotient"?4:2))ui[ui.field]+=d;
 ui.feedback=null;render();
}
async function submit(){
 if(!state.run||busy||ui.feedback?.correct)return;
 const q=currentQ();let assisted=ui.assisted;
 if(ui.mode==="guide"){
 const g=ui.guide,steps=targets(q),s=steps[g.step],expected=[s.q,s.product,s.remainder][g.phase];
 if(g.entered===""){toast("先填入這一步的數字喔");return;}
 if(Number(g.entered)!==expected){
 const hit=await event("step-answer",{questionId:q.id,step:g.step,phase:g.phase,value:g.entered});
 if(!hit){render();return;}
 sound(state.run?.boss||hit.failed?"hurt":"wrong");g.assisted=true;stashWork();battleFx={type:"hurt",until:Date.now()+1200};
 if(hit.failed||!state.run){view="world";selectedWorld=state.lastResult?.world??2;render();resultModal();return;}
 ui.feedback={correct:false,text:hit.reason||"再想一想這一步。"};render();return;
 }
 g.values[g.step+":"+g.phase]=g.entered;g.entered="";g.phase++;
 if(g.phase===3){g.phase=0;g.step++;}
 if(g.step<steps.length){sound("step");ui.feedback=null;stashWork();render();return;}
 ui.quotient=steps.map((_,i)=>g.values[i+":0"]).join("");ui.remainder=g.values[(steps.length-1)+":2"];assisted=assisted||g.assisted;stashWork();
 }
 if(ui.quotient===""||ui.remainder===""){ui.field=ui.quotient===""?"quotient":"remainder";toast("商和餘數都要填，整除時餘數填 0");render();return;}
 const oldQ=q,wasBoss=state.run.boss;const result=await event("answer",{questionId:q.id,quotient:ui.quotient,remainder:ui.remainder,assisted});
 if(!result){if(ui.mode==="guide"&&ui.guide.step>=targets(q).length){ui.guide.step=targets(q).length-1;ui.guide.phase=2;ui.guide.entered=ui.remainder;stashWork();}render();return;}
 if(result.duplicate){if(!state.run)resultModal();else{resetQuestion();render();}return;}
 if(result.failed){view="world";selectedWorld=state.lastResult.world;render();resultModal();return;}
 if(!result.correct){ui.feedback={correct:false,text:result.reason};if(ui.mode==="guide"){resetQuestion();}render();return;}
 sound(wasBoss?"attack":"correct");battleFx={type:result.correct?"hero-attack":"hurt",until:Date.now()+1400};

 if(result.finished){view="home";render();resultModal();return;}
 ui.solvedQ=oldQ;ui.feedback={correct:true,text:"算對了！ "+oldQ.a+" = "+oldQ.b+" × "+Math.floor(oldQ.a/oldQ.b)+" + "+oldQ.a%oldQ.b};render();
 if(state.correct%15===0)toast("完成 15 道小挑戰了！可以讓眼睛休息一下，再回來冒險 ♡");
}
function collection(){
 const size=6;collectionPage=Math.min(collectionPage,Math.ceil(COLLECTION.length/size)-1);
 return title("每一件寶物，都能陪大耳狗玩", "配件、場景與動作，都能直接套用到換裝小屋。", "YOUR CLOUD TREASURES")+'<div class="collection-summary"><span>已收藏 '+state.inventory.length+' / '+COLLECTION.length+' · 雲朵幣 '+state.coins+'</span><button class="primary" data-action="nav" data-view="dressing">前往換裝小屋 →</button></div><div class="collection-grid">'+COLLECTION.slice(collectionPage*size,collectionPage*size+size).map(i=>itemCard(state,i)).join("")+'</div>'+pager(collectionPage,Math.ceil(COLLECTION.length/size),"collection-page");
}
function report(){
const accuracy=state.attempts?Math.round(state.correct/state.attempts*100):0,rows=reportTab==="history"?state.history.slice().reverse():state.mistakes,pages=Math.max(1,Math.ceil(rows.length/5));reportPage=Math.min(reportPage,pages-1);
return title("每一次練習，都留下小腳印","看看自己的進步，下一次再多懂一點點。")+'<div class="report-grid"><section class="panel"><h2>答對的四位數</h2><strong>'+state.fourCorrect+'</strong></section><section class="panel"><h2>答案提交正確率</h2><strong>'+accuracy+'%</strong></section><section class="panel"><h2>已完成關卡</h2><strong>'+Object.keys(state.levels).length+' / 36 · ★ '+totalStars(state)+' / 324</strong></section></div><div class="section-heading"><div class="report-tabs"><button class="secondary '+(reportTab==="history"?"chosen":"")+'" data-action="report-tab" data-tab="history">最近冒險</button><button class="secondary '+(reportTab==="mistakes"?"chosen":"")+'" data-action="report-tab" data-tab="mistakes">錯題本 · '+state.mistakes.length+'</button></div><button class="primary" data-action="review">開始複習 →</button></div><section class="panel history-panel">'+(rows.length?rows.slice(reportPage*5,reportPage*5+5).map(r=>reportTab==="mistakes"?'<div class="history-row"><span>'+r.question.a+' ÷ '+r.question.b+'<small>答對就能從錯題本畢業</small></span><span class="pill">答錯 '+r.errors+' 次</span></div>':'<div class="history-row"><span>'+(r.kind==="level"?WORLDS[r.world].name+" · "+(r.boss?"魔王關":"第 "+(r.stage+1)+" 關"):r.kind==="review"?"錯題複習":"自由練習")+'<small>'+new Date(r.at).toLocaleDateString("zh-TW",{timeZone:"Asia/Taipei"})+' · '+r.perfect+' / '+r.count+' 題完美作答</small></span><span class="stars">'+"★".repeat(r.stars)+"☆".repeat(3-r.stars)+'</span></div>').join(""):'<div class="empty">☁️ '+(reportTab==="history"?"你的第一場冒險，會從這裡開始。":"沒有待複習的錯題，繼續冒險吧！")+'</div>')+'</section>'+pager(reportPage,pages,"report-page");
}
function modules(){return title("下一站，還有更多數學世界","目前開放除法冒險；其他主題正在規劃。","MORE WORLDS TO COME")+'<div class="module-grid">'+MODULES.map((m,i)=>'<section class="module-card"><span>'+["☁️","➕","🍰"][i]+'</span><h2>'+m.name+'</h2><p>'+["四位數除法為主，二、三位數可以暖身。","未來練習運算順序、括號與四則混合。","未來練習分數大小、通分與分數運算。"][i]+'</p>'+(i===0?'<button class="primary" data-action="nav" data-view="practice">現在去練習 →</button>':'<span class="pill">尚未開放</span>')+'</section>').join("")+'</div>';}
function modal(content,cls=""){modalRoot.innerHTML='<div class="modal-backdrop"><section class="modal-card '+cls+'" role="dialog" aria-modal="true"><button class="close" data-action="close" aria-label="關閉">×</button>'+content+'</section></div>';const close=modalRoot.querySelector(".close");close?.focus();mountCharacters(modalRoot);}
function closeModal(){form=null;modalRoot.innerHTML="";}
function resultModal(){const r=state.lastResult;if(!r)return;const lost=r.outcome==="lost";sound(lost?"defeat":r.boss?"bossWin":"clear");modal((r.boss?arena(r,r):cinna(state.wardrobe,"",3))+'<div class="eyebrow">'+(lost?"LET’S TRY AGAIN":"A LITTLE WIN, A BIG SMILE")+'</div><h2>'+(lost?"這次先休息，再挑戰一次！":r.boss?"烏雲散開，世界放晴了！":"又完成一段小冒險！")+'</h2>'+(lost?'<p>魔王還有 '+r.bossHp+' 點生命。這次沒有通關，先前練習得到的獎勵會保留。</p>':'<p>'+DIFFICULTIES[r.difficulty??0]+'難度 · 本次星星</p><div class="result-stars">'+"★".repeat(r.stars)+"☆".repeat(3-r.stars)+'</div><p>雲朵幣 通關獎勵 +'+r.bonus+' · '+r.perfect+' / '+r.count+' 題完美作答</p>')+'<div class="modal-actions"><button class="secondary" data-action="result-map">回到地圖</button><button class="primary" data-action="'+(lost?"boss-retry":"result-next")+'">'+(lost?"重新挑戰魔王 ↻":"再冒險一關 →")+'</button></div>',"result");}
function hint(full=false,page=0){const q=currentQ();if(!q)return;ui.assisted=true;if(ui.guide){ui.guide.assisted=true;stashWork();}const steps=targets(q);lessonPage=Math.max(0,Math.min(page,steps.length-1));const s=steps[lessonPage];modal('<div class="eyebrow">LET’S THINK TOGETHER</div><h2>'+(full?"一起看這題的直式":"先找一點小線索")+'</h2><p>'+q.a+' ÷ '+q.b+' · 先想一想除數的倍數。</p>'+(full?'<div class="lesson-step"><b>第 '+(lessonPage+1)+' / '+steps.length+' 輪</b><br>'+s.value+' ÷ '+q.b+' → 商 '+s.q+'<br>'+q.b+' × '+s.q+' = '+s.product+'<br>'+s.value+' − '+s.product+' = '+s.remainder+(s.next!==null?'<br>拉下 '+s.next+'，下一輪看 '+(s.remainder*10+s.next):"")+'</div>'+pager(lessonPage,steps.length,"lesson-page"):'<div class="lesson-step">① 每一位的商只能是 0～9。<br>② 除數 × 這位的商，不能比目前要除的數大。<br>③ 相減後，剩下的數要比除數小。<br>④ 拉下下一位，商是 0 時也要寫出來。</div><div class="multiples">'+[1,2,3,4,5,6,7,8,9].map(n=>'<span>'+q.b+' × '+n+' = '+q.b*n+'</span>').join("")+'</div>')+'<p>看過提示仍可通關；這題會記為輔助作答。</p><button class="primary submit" data-action="close">我再試一次 ♡</button>');}
async function begin(options){
 if(state.run){modal('<h2>還有一場小冒險</h2><p>你已經完成 '+state.run.index+' / '+state.run.questions.length+' 題。要先繼續嗎？</p><div class="modal-actions"><button class="primary" data-action="continue">繼續冒險</button><button class="secondary" data-action="replace-run">換一場冒險</button></div>');window.nextRunOptions=options;return;}
 const r=await event("start",{options});if(r){sound("start");view="play";resetQuestion();closeModal();render();}
}
function stageOptions(w,l){ui.difficulty=0;window.nextRunOptions={kind:"level",world:w,stage:l,difficulty:0};modal('<div class="eyebrow">READY FOR A LITTLE ADVENTURE?</div><h2>'+WORLDS[w].name+' · '+(l===5?"魔王關":"第 "+(l+1)+" 關")+'</h2><p>'+(l===5?"三種難度各收集 3 星。完成一題攻擊魔王；每一步算錯扣 1 點生命。":"每個難度 5 道除法，各可獲得 3 顆星。完成簡單後開啟普通，再挑戰困難。")+'</p>'+difficultyButtons(w,l)+'<button class="primary submit" data-action="stage-start">準備好了，出發 →</button>');}
function openAuth(mode="login"){
 form={mode,pin:"",username:"",name:""};
 authRender();
 if(mode!=="admin"&&mode!=="pin")modalRoot.querySelector('.modal-card').insertAdjacentHTML('beforeend','<button class="secondary submit" data-action="auth-mode" data-mode="admin">系統管理員專用</button>');
}
function authRender(){
 const m=form.mode;
 if(m==="admin"){modal('<div class="eyebrow">ADMINISTRATOR</div><h2>系統管理員登入</h2><p>解鎖全部 36 關、配件、場景與動作。管理員有獨立的冒險存檔。</p><label>管理員密碼 · 4 位數字</label><button id="auth-pin" class="auth-pin" aria-label="管理員密碼"></button>'+keypad(true)+'<div class="error" id="auth-error"></div><button class="primary submit" data-action="auth-submit">解鎖管理員模式</button><button class="inline-link" data-action="auth-mode" data-mode="login">返回一般登入</button>');return;}
 modal('<div class="eyebrow">YOUR OWN CLOUD ADVENTURE</div><h2>'+(m==="register"?"建立你的冒險帳號":m==="recover"?"用家長復原碼登入":m==="pin"?"設定新的數字密碼":"歡迎回到雲朵世界")+'</h2><p>'+(m==="register"?"帳號進度會儲存在雲端，可跨裝置接續。訪客進度另外存在本機。":m==="pin"?"設定 8–12 位數字。其他装置將需要重新登入。":"登入後，關卡、收藏與每日任務都會跟著你。")+'</p>'+(m==="pin"?"":'<div class="auth-tabs"><button data-action="auth-mode" data-mode="login" class="'+(m==="login"?"chosen":"")+'">登入</button><button data-action="auth-mode" data-mode="register" class="'+(m==="register"?"chosen":"")+'">建立帳號</button></div><label for="username">帳號 · 英文字母、數字、底線</label><input class="text-input" id="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" value="'+safe(form.username)+'">')+(m==="register"?'<label for="nickname">冒險家暱稱</label><input class="text-input" id="nickname" maxlength="20" value="'+safe(form.name)+'">':"")+(m==="recover"?'<label for="recovery-input">家長復原碼</label><input class="text-input" id="recovery-input" autocomplete="off" autocapitalize="none" spellcheck="false">':'<label>數字密碼 · 8–12 位</label><button id="auth-pin" class="auth-pin" aria-label="數字密碼">'+"●".repeat(form.pin.length)+'</button>'+keypad(true))+'<div class="error" id="auth-error"></div><button class="primary submit" data-action="auth-submit">'+(m==="register"?"建立帳號，開始冒險":m==="pin"?"更新數字密碼":"登入我的冒險")+'</button>'+(m==="pin"?"":'<button class="inline-link" data-action="auth-mode" data-mode="recover">忘記數字密碼？用家長復原碼登入</button>'));
}
async function authSubmit(){
 if(busy||!form)return;
 if(form.mode==="admin"){await adminSubmit();return;}
 const mode=form.mode;
 const body=mode==="pin"?{pin:form.pin}:{username:$("#username").value.trim(),pin:form.pin,...(mode==="register"?{name:$("#nickname").value.trim()}:{}),...(mode==="recover"?{recovery:$("#recovery-input").value.trim().toLowerCase()}: {})};
 if(mode!=="recover"&&!/^\d{8,12}$/.test(form.pin)){$("#auth-error").textContent="請用下方數字盤輸入 8–12 位數字密碼";return;}
 busy=true;$("#auth-error").textContent="正在連線…";const button=modalRoot.querySelector('[data-action="auth-submit"]');button.disabled=true;
 try{
 const data=await api(mode,body);
 if(mode==="pin"){account.token=data.token;put("cloudmath:account",account);closeModal();recoveryModal(data.recovery);}
 else{account={user:data.user,token:data.token,version:data.version};state=data.state;version=data.version;status="雲端已儲存";stash();closeModal();view="home";render();if(data.recovery)recoveryModal(data.recovery);else toast("歡迎回來，"+state.name+" ♡");}
 }catch(e){$("#auth-error")?$("#auth-error").textContent=e.message:toast(e.message);button.disabled=false;}
 finally{busy=false;}
}
function recoveryModal(code){
 modal('<h2>請讓家長收好復原碼</h2><p>忘記數字密碼時，可以用這組代碼登入。它只會在這裡顯示，請先保存。</p><div class="recovery" id="recovery-code">'+safe(code)+'</div><div class="modal-actions"><button class="secondary" data-action="download-recovery">下載復原碼</button><button class="primary" data-action="close">已收好，開始冒險</button></div>');
}
function accountModal(){
 if(!account){openAuth();return;}
 const admin=account.user.role==="admin";
 modal('<div class="eyebrow">YOUR ADVENTURER PROFILE</div><h2>'+safe(state.name)+' 的冒險帳號</h2><p>'+(admin?'管理員模式：全部 36 關及 59 個收藏已解鎖。':'你的冒險已儲存在雲端。')+'<br>帳號：'+safe(account.user.username)+'<br>冒險等級 '+playerLevel(state)+' · '+state.xp+' XP · ★ '+totalStars(state)+' / 324<br>'+safe(status)+'</p><div class="settings-list"><button class="secondary" data-action="refresh">↻ 同步最新進度</button>'+(admin?'':'<button class="secondary" data-action="change-pin">更新數字密碼</button><button class="secondary" data-action="auth-mode" data-mode="admin">系統管理員專用</button>')+'<button class="secondary" data-action="logout">在這台裝置登出</button></div>');
}
async function adminSubmit(){
 if(!/^\d{4}$/.test(form.pin)){$("#auth-error").textContent="請輸入 4 位管理員密碼";return;}
 busy=true;const error=$("#auth-error"),button=modalRoot.querySelector('[data-action="auth-submit"]');error.textContent="正在解鎖…";button.disabled=true;
 try{const data=await api("admin-login",{pin:form.pin});account={user:data.user,token:data.token,version:data.version};state=data.state;version=data.version;status="雲端已儲存";stash();closeModal();view="home";render();toast("管理員模式已開啟：全部關卡與收藏已解鎖");}
 catch(e){if(error.isConnected)error.textContent=e.message;button.disabled=false;}
 finally{busy=false;root.classList.remove("busy");}
}
async function refresh(){
 if(!account)return;
 try{const data=await api("me");state=data.state;version=data.version;status="雲端已儲存";stash();if(view==="play")resetQuestion();render();const pending=read("cloudmath:pending:"+identity(),null);if(pending){const r=await event(pending.type);if(r){toast("先前未完成的儲存已同步");if(view==="play"){resetQuestion();render();}}}}
 catch(e){status=e.status===401?"請重新登入":"雲端暫時離線";render();toast(e.message);}
}
document.addEventListener("click",async e=>{
 const el=e.target.closest("button");if(!el||el.disabled)return;unlockAudio();sound(el.dataset.digit!==undefined?"digit":"click");
 if(el.dataset.digit!==undefined){digit(el.dataset.digit);return;}
 const a=el.dataset.action;if(!a)return;
 switch(a){
 case"fullscreen":await toggleFullscreen();break;
 case"focus-mode":focusMode=!focusMode;document.body.classList.toggle("focus-mode",focusMode);render();if(focusMode)toast("專注模式已開啟；系統狀態列仍由 iPadOS 控制");break;
 case"sound-settings":audioModal();break;
 case"motion-preview":if(view!=="dressing"){view="dressing";closetTab="motion";closetPage=0;render();}animateRoom(state,el.dataset.item);break;
 case"music-toggle":setMusic({enabled:!musicSettings().enabled});audioModal();break;
 case"music-volume":setMusic({volume:Number(el.dataset.value)});audioModal();break;
 case"sound-toggle":setAudio({enabled:!audioSettings().enabled});if(audioSettings().enabled){unlockAudio();sound("correct");}render();audioModal();break;
 case"volume":setAudio({volume:Number(el.dataset.value)});sound("correct");audioModal();break;
 case"closet-tab":closetTab=el.dataset.tab;closetPage=0;render();break;
 case"closet-page":closetPage=Number(el.dataset.page);render();break;
 case"motion-next":animateRoom(state);break;
 case"unequip-slot":{const r=await event("unequip-slot",{slot:el.dataset.slot});if(r){sound("equip");render();}break;}

 case"collection-page":collectionPage=Number(el.dataset.page);render();break;
 case"report-page":reportPage=Number(el.dataset.page);render();break;
 case"report-tab":reportTab=el.dataset.tab;reportPage=0;render();break;
 case"lesson-page":hint(true,Number(el.dataset.page));break;
 case"boss-retry":{const r=state.lastResult;closeModal();await begin({kind:"level",world:r.world,stage:5,difficulty:r.difficulty});break;}
 case"nav":view=el.dataset.view;render();break;
 case"quick":ui.focus=3;ui.difficulty=0;await begin({kind:"practice",tier:3,difficulty:0});break;
 case"world":{const w=Number(el.dataset.world);if(!worldUnlocked(state,w)){toast("先完成上一個世界的魔王關，再來探索 ♡");break;}selectedWorld=w;view="world";render();break;}
 case"stage":stageOptions(Number(el.dataset.world),Number(el.dataset.stage));break;
 case"stage-start":{const opts={...window.nextRunOptions,difficulty:ui.difficulty};closeModal();await begin(opts);break;}
 case"focus":ui.focus=Number(el.dataset.tier);render();break;
 case"difficulty":ui.difficulty=Number(el.dataset.value);if(modalRoot.children.length){modalRoot.querySelectorAll('[data-action="difficulty"]').forEach(b=>b.classList.toggle("chosen",Number(b.dataset.value)===ui.difficulty));}else render();break;
 case"practice-start":await begin({kind:"practice",tier:ui.focus,difficulty:ui.difficulty});break;
 case"review":await begin({kind:"review",difficulty:0});break;
 case"continue":view="play";resetQuestion();closeModal();render();break;
 case"replace-run":{const opts={...window.nextRunOptions,replace:true};closeModal();const r=await event("start",{options:opts});if(r){view="play";resetQuestion();render();}break;}
 case"field":ui.field=el.dataset.field;render();break;
 case"mode":if(ui.feedback?.correct)resetQuestion();ui.mode=el.dataset.mode;ui.feedback=null;render();break;
 case"submit":await submit();break;
 case"next":resetQuestion();render();break;
 case"clear":case"back":if(view==="play"){if(ui.mode==="guide"){ui.guide.entered=a==="clear"?"":ui.guide.entered.slice(0,-1);stashWork();}else ui[ui.field]=a==="clear"?"":ui[ui.field].slice(0,-1);ui.feedback=null;render();}break;
 case"hint":hint();break;
 case"lesson":hint(true);break;
 case"leave":view="home";render();toast("已保留這場冒險，隨時可以回來");break;
 case"close":closeModal();break;
 case"claim":{const r=await event("claim",{key:el.dataset.key});if(r){sound("reward");toast("任務完成！獲得 "+r.reward+" 個雲朵幣");render();}break;}
 case"buy":{const r=await event("buy",{item:el.dataset.item});if(r){sound("reward");toast("新的寶物加入收藏了 ♡");render();}break;}
 case"equip":{const r=await event("equip",{item:el.dataset.item||null});if(r){sound("equip");render();}break;}
 case"account":accountModal();break;
 case"auth-mode":openAuth(el.dataset.mode);break;
 case"auth-submit":await authSubmit();break;
 case"auth-clear":case"auth-back":if(form){form.pin=a==="auth-clear"?"":form.pin.slice(0,-1);$("#auth-pin").textContent="●".repeat(form.pin.length);}break;
 case"download-recovery":{const code=$("#recovery-code").textContent;const blob=new Blob(["大耳狗雲朵除法冒險\n帳號："+account.user.username+"\n家長復原碼："+code+"\n請妥善保存，勿分享給他人。"],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="cloud-math-recovery.txt";link.click();URL.revokeObjectURL(url);toast("復原碼已準備下載");break;}
 case"change-pin":form={mode:"pin",pin:"",username:"",name:""};authRender();break;
 case"refresh":closeModal();await refresh();break;
 case"logout":try{await api("logout",{});}catch{}account=null;put("cloudmath:account",null);state=read("cloudmath:guest",newState());status="訪客進度已儲存";view="home";closeModal();render();toast("已在這台裝置登出");break;
 case"result-map":{const r=state.lastResult;closeModal();selectedWorld=r?.world??2;view=r?.kind==="level"?"world":"home";render();break;}
 case"result-next":{const r=state.lastResult;closeModal();if(r?.kind==="level"){const w=r.stage===5?r.world+1:r.world,l=r.stage===5?0:r.stage+1;if(w<WORLDS.length){selectedWorld=w;view="world";render();stageOptions(w,l);}else{view="collection";render();}}else await begin({kind:"practice",tier:3,difficulty:ui.difficulty});break;}
 }
});
document.addEventListener("keydown",e=>{
 if(["INPUT","TEXTAREA","SELECT"].includes(e.target.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;
 if(/^[0-9]$/.test(e.key)){if(form||view==="play"){e.preventDefault();digit(e.key);}}
 else if(e.key==="Enter"&&!form&&view==="play"){e.preventDefault();submit();}
 else if(e.key==="Backspace"&&!form&&view==="play"){e.preventDefault();if(ui.mode==="guide"){ui.guide.entered=ui.guide.entered.slice(0,-1);stashWork();}else ui[ui.field]=ui[ui.field].slice(0,-1);render();}
 else if(e.key==="Escape"){closeModal();}
});
setInterval(()=>{const el=$("#elapsed");if(el&&state.run){const seconds=Math.max(0,Math.floor((Date.now()-state.run.startedAt)/1000));el.textContent="⏱ "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");}},1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&account&&!busy&&view!=="play")refresh();});
window.addEventListener("online",()=>{if(account&&!busy)refresh();});
render();if(account)refresh();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});

function pager(page,total,action){return '<div class="pager"><button class="secondary" data-action="'+action+'" data-page="'+(page-1)+'" '+(page<=0?"disabled":"")+'>← 上一頁</button><span>'+(page+1)+' / '+Math.max(1,total)+'</span><button class="secondary" data-action="'+action+'" data-page="'+(page+1)+'" '+(page>=total-1?"disabled":"")+'>下一頁 →</button></div>';}

async function toggleFullscreen(){
 if(!(document.fullscreenElement||document.webkitFullscreenElement)&&!read("cloudmath:fullscreen-info",false)&&(/iPad|iPhone/.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)){
  put("cloudmath:fullscreen-info",true);modal('<h2>iPad 的大畫面模式</h2><p>Safari 的原生全螢幕可能顯示時間、退出 X 與系統退出手勢，網頁無法移除。按下方按鈕繼續進入。</p><p>想減少誤觸，可使用上方「專注模式」；也可透過 Safari 分享 → 加入主畫面，從遊戲圖示啟動。主畫面模式仍受 iPadOS 控制，不能保證隱藏時間。</p><button class="primary" data-action="fullscreen">進入原生全螢幕</button>');return;
 }
 closeModal();
 try{if(document.fullscreenElement||document.webkitFullscreenElement){const exit=document.exitFullscreen||document.webkitExitFullscreen;await exit.call(document);}
 else{const enter=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(!enter)throw new Error("unsupported");await enter.call(document.documentElement);}}
 catch{modal('<h2>在 iPad 開啟大畫面</h2><p>目前的瀏覽器無法直接切換全螢幕。請用 Safari 開啟此遊戲，點「分享」→「加入主畫面」，再從主畫面的遊戲圖示啟動。</p><p>加入主畫面後，遊戲會以獨立視窗開啟。橫向、直向都能繼續同一題。</p><button class="primary" data-action="close">知道了</button>');}
}
document.addEventListener("fullscreenchange",()=>render());
document.addEventListener("webkitfullscreenchange",()=>render());

function audioModal(){
 const a=audioSettings(),m=musicSettings();
 const levels=(action,value,choices)=>'<div class="audio-levels">'+choices.map(([v,n])=>'<button class="secondary '+(value===v?'chosen':'')+'" data-action="'+action+'" data-value="'+v+'">'+n+'</button>').join('')+'</div>';
 modal('<h2>音樂與音效</h2><p>每個世界都有自己的旋律，魔王登場也會切換戰鬥曲。</p><div class="music-now">目前曲目：'+safe(m.title)+' · '+(m.enabled?(m.playing?'播放中':'點一下畫面開始播放'):'音樂已關閉')+'</div><div class="audio-settings-grid"><section><h3>背景音樂</h3><button class="primary" data-action="music-toggle">'+(m.enabled?'關閉背景音樂':'開啟背景音樂')+'</button>'+levels("music-volume",m.volume,[[.1,"輕柔"],[.22,"適中"],[.4,"響亮"]])+'</section><section><h3>按鍵與冒險音效</h3><button class="secondary" data-action="sound-toggle">'+(a.enabled?'關閉音效':'開啟音效')+'</button>'+levels("volume",a.volume,[[.15,"輕柔"],[.3,"適中"],[.6,"響亮"]])+'</section></div><p>設定會保留在這台裝置。切到其他分頁時音樂會暫停。</p>');
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRoom();else if(view==='dressing')animateRoom(state);});
