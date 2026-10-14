import {WORLDS,COLLECTION,QUESTS,MODULES,newState,applyAction,dailyReset,playerLevel,stageUnlocked,worldUnlocked,divisionSteps} from "./engine.js";
import {cinna,bossArt} from "./art.js";
import {API_BASE} from "./config.js";
const $=s=>document.querySelector(s);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
let guest=read("cloudmath:guest",newState()),account=read("cloudmath:account",null),state=account?read("cloudmath:save:"+account.user.id,newState(account.user.name)):guest;
let version=account?.version||0,view="home",selectedWorld=2,busy=false,status=account?"同步中":"訪客進度已儲存";
let form=null,ui={mode:"guide",field:"quotient",quotient:"",remainder:"",guide:null,assisted:false,feedback:null,lastQ:null,focus:3,difficulty:0},toastTimer;
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
 stash();return result||{};
 }catch(e){if(e.status&&e.status!==503){put(pendingKey,null);status=e.status===401?"請重新登入":"已同步最新進度";}else status="尚未儲存，請重試";toast(e.message);if(e.status===409){resetQuestion();render();}return null;}
 finally{busy=false;root.classList.remove("busy");}
}
function resetQuestion(){
 const q=state.run?.questions[state.run.index];if(!q)return;
 ui.lastQ=q;ui.quotient="";ui.remainder="";ui.field="quotient";ui.assisted=false;ui.feedback=null;
 ui.mode=state.run.difficulty===0?"guide":"quick";
 const cached=read("cloudmath:work:"+identity()+":"+q.id,null);
 ui.guide=cached||{step:0,phase:0,entered:"",values:{},assisted:false};
}
function stashWork(){const q=state.run?.questions[state.run.index];if(q)put("cloudmath:work:"+identity()+":"+q.id,ui.guide);}
function currentQ(){return state.run?.questions[state.run.index];}
function nav(){return [["home","☁️","冒險地圖"],["practice","✏️","自由練習"],["collection","🎀","我的收藏"],["report","📘","學習紀錄"]].map(([id,icon,label])=>'<button class="nav-item '+(view===id||view==="world"&&id==="home"?"active":"")+'" data-action="nav" data-view="'+id+'"><span>'+icon+'</span>'+label+'</button>').join("");}
function render(){
 dailyReset(state);
 root.innerHTML='<div class="shell"><aside class="rail"><div class="rail-logo">☁️</div>'+nav()+'<div class="rail-foot">小小練習<br>大大進步 ♡</div></aside><div class="page"><header class="topbar"><div class="brand">大耳狗的雲朵除法冒險<small>CLOUD MATH ADVENTURE</small></div><div class="top-actions"><div class="currency">🪙 <b>'+state.coins+'</b></div><button class="profile" data-action="account"><span class="avatar">☁️</span><span class="profile-name">'+(account?safe(state.name):"登入雲端")+'</span></button></div></header><main class="content">'+(view==="home"?home():view==="world"?worldPage():view==="play"?play():view==="practice"?practice():view==="collection"?collection():view==="report"?report():modules())+'<footer class="footer">非官方粉絲學習作品 · Cinnamoroll / 大耳狗角色權利歸 Sanrio 所有<br>一起慢慢算，每一步都算進步。</footer></main></div></div>';
 if(busy)root.classList.add("busy");
}
function saved(){return '<span class="status '+(status.includes("未")||status.includes("重試")?"warning":"")+'">'+safe(status)+'</span>';}
function title(h,p,label="YOUR LITTLE ADVENTURE"){return '<div class="title-row"><div><div class="eyebrow">'+label+'</div><h1>'+h+'</h1><p>'+p+'</p></div>'+saved()+'</div>';}
function continueCard(){return state.run?'<div class="continue-card"><p>☁️ 你的冒險還在等你 · 已完成 '+state.run.index+' / '+state.run.questions.length+' 題</p><button class="small-button" data-action="continue">繼續冒險 →</button></div>':"";}
function quests(){return '<section class="panel"><h2>☀️ 每日小任務</h2><p class="sub">'+safe(state.daily.day)+' · 每天一點點就很好</p>'+QUESTS.map(q=>{const n=Math.min(q.goal,state.daily[q.key]),claimed=state.daily.claimed.includes(q.key);return '<div class="quest"><div class="quest-title"><span>'+q.name+'</span><span>🪙 '+q.reward+'</span></div><p>'+q.desc+'</p><div class="progress"><span style="width:'+n/q.goal*100+'%"></span></div><div class="quest-bottom"><span>'+n+' / '+q.goal+'</span>'+(claimed?'<span>已領取 ✓</span>':n===q.goal?'<button class="small-button" data-action="claim" data-key="'+q.key+'">領取獎勵</button>':'<button class="small-button" data-action="'+(q.key==="review"?"review":q.key==="levels"?"world":"quick")+'" '+(q.key==="levels"?'data-world="2"':"")+'>去練習 →</button>')+'</div></div>';}).join("")+'</section>';}
function worldCards(){return WORLDS.map(w=>{const open=worldUnlocked(state,w.id),done=Array.from({length:6},(_,i)=>state.levels[w.id+":"+i]||0).filter(Boolean).length;return '<button class="world-card '+(open?"":"locked")+'" style="--world-color:'+w.color+'" data-action="world" data-world="'+w.id+'"><span class="world-label">'+(w.id===2?"主線冒險":open?"WORLD 0"+(w.id+1):"🔒 待解鎖")+'</span><div class="world-head"><div class="world-icon">'+w.icon+'</div><div><h3>'+w.name+'</h3><p>'+w.subtitle+'</p></div></div><div class="world-track">'+Array.from({length:6},(_,i)=>'<span class="world-dot '+(state.levels[w.id+":"+i]?"done":"")+'">'+(i===5?"♛":state.levels[w.id+":"+i]?"★":i+1)+'</span>').join("")+'</div><div class="world-footer"><span>'+(open?done+" / 6 關":"完成上一世界魔王關")+'</span><span>'+(open?"出發 →":"♡ 等你來探索")+'</span></div></button>';}).join("");}
function home(){
 return title("今天，去雲朵世界走走吧","每一道除法，都是冒險的下一步。")+continueCard()+'<div class="dashboard"><div><section class="hero"><div class="hero-text"><span class="hero-tag">🌈 本次主題 · 四位數除法</span><h2>和大耳狗一起<br>找回天空的彩虹</h2><p>完成小小的除法挑戰，收集雲朵寶物，<br>一步一步，把烏雲變成晴天。</p><button class="primary" data-action="quick">開始 5 題冒險 <span>→</span></button></div><span class="spark">✦</span><span class="spark two">✧</span>'+cinna(state.equipped)+'</section><div class="section-heading"><h2>探索冒險世界</h2><small>暖身可自由選擇 · 四位數從彩虹港灣開始</small></div><div class="world-grid">'+worldCards()+'</div><div class="banner"><span>💡</span><span>商的中間也可能有 0！不急著算快，先把每一步算好。</span></div></div><aside class="side-stack">'+quests()+'<section class="panel companion"><h2>今天也陪著你 ♡</h2>'+cinna(state.equipped)+'<p>你已經收集了 '+state.inventory.length+' 個寶物！<br>再練習一關，一起去看看新收藏。</p><button class="ghost" data-action="nav" data-view="collection">查看我的收藏 →</button></section><section class="panel"><h2>你的冒險足跡</h2><div class="mini-stats"><div><strong>'+playerLevel(state)+'</strong><small>冒險等級</small></div><div><strong>'+state.fourCorrect+'</strong><small>四位數答對</small></div><div><strong>'+state.streak+'</strong><small>練習連續天數</small></div></div><div class="daily-stamp">'+Array.from({length:7},(_,i)=>'<span class="stamp '+(i<Math.min(7,state.streak)?"on":"")+'">'+(i<Math.min(7,state.streak)?"★":"·")+'</span>').join("")+'</div><p class="sub">累積的寶物，隨時都在。</p></section></aside></div>';
}
function worldPage(){
 const w=WORLDS[selectedWorld],names=["出發的小雲朵","一起試試商","乘一乘，減一減","餘數的祕密","勇者的試煉",w.boss];
 return '<button class="back" data-action="nav" data-view="home">← 回到冒險地圖</button><div class="world-detail" style="--world-color:'+w.color+'"><div><div class="eyebrow">WORLD 0'+(w.id+1)+'</div><h1>'+w.icon+' '+w.name+'</h1><p>'+w.subtitle+' · '+(w.digits===4?"主要練習四位數 ÷ 二位數":w.digits+"位數 ÷ 二位數")+'</p><span class="pill">5 個關卡 + 1 位魔王</span></div>'+cinna(state.equipped)+'</div><div class="section-heading"><h2>選一關，開始冒險</h2>'+saved()+'</div><div class="stages">'+names.map((name,i)=>{const open=stageUnlocked(state,w.id,i),stars=state.levels[w.id+":"+i]||0;return '<button class="stage '+(i===5?"boss ":"")+(open?"active":"")+'" data-action="stage" data-world="'+w.id+'" data-stage="'+i+'" '+(open?"":"disabled")+'><div class="stage-number">'+(open?(i===5?"♛":i+1):"🔒")+'</div><h3>'+name+'</h3><p>'+(i===5?"8 道除法 · 讓烏雲散開":"5 道除法 · 一步一步前進")+'</p><div class="stars">'+(stars?"★".repeat(stars)+"☆".repeat(3-stars):open?"☆☆☆":"完成上一關後解鎖")+'</div></button>';}).join("")+'</div><div class="banner">🎁 第一次通關有額外雲朵幣；通過魔王還能獲得世界紀念收藏。</div>';
}
function practice(){
 return title("想練哪一種，自己決定","每次 5 題，從適合自己的難度開始。","PRACTICE AT YOUR OWN PACE")+continueCard()+'<div class="practice-intro">✏️ 以四位數除法為主，也能選擇二位數或三位數暖身。<br>直式引導會陪你完成「商 → 乘 → 減 → 拉下」。整除時，餘數記得填 0。</div><div class="dashboard"><section class="panel"><h2>選擇練習範圍</h2><div class="focus-chips">'+[[3,"四位數 ÷ 二位數"],[2,"三位數 ÷ 二位數"],[1,"二位數 ÷ 二位數"]].map(([t,n])=>'<button class="'+(ui.focus===t?"chosen":"")+'" data-action="focus" data-tier="'+t+'">'+n+'</button>').join("")+'</div><h2 style="margin:23px 0 14px">選擇練習方式</h2>'+difficultyButtons()+'<button class="primary submit" data-action="practice-start">開始練習 →</button></section><aside class="side-stack"><section class="panel"><h2>📘 錯題變成小進步</h2><p class="sub">還有 '+state.mistakes.length+' 道題目等你再試一次</p><p class="readout">答對後，這題就會從錯題本畢業。沒有錯題時，會安排 2 道四位數複習。</p><button class="secondary" data-action="review">開始複習 →</button></section><section class="panel"><h2>更多數學冒險</h2><p class="readout">除法是第一站，未來還有新的樂園。</p><button class="ghost" data-action="nav" data-view="modules">看看未來主題 →</button></section></aside></div>';
}
function difficultyButtons(){return '<div class="difficulty">'+[["☁️ 溫柔引導","預設直式模式，陪你看懂每一步。"],["🌈 標準練習","直接填商與餘數，可隨時切換直式。"],["⭐ 勇者挑戰","四位數會加入較難的試商；記錄時間，沒有倒數失敗。"]].map(([n,d],i)=>'<button class="'+(ui.difficulty===i?"chosen":"")+'" data-action="difficulty" data-value="'+i+'"><b>'+n+'</b><small>'+d+'</small></button>').join("")+'</div>';}
function keypad(auth=false){return '<div class="keypad '+(auth?"auth-keypad":"")+'">'+[1,2,3,4,5,6,7,8,9,"clear",0,"back"].map(n=>'<button '+(typeof n==="number"?'data-digit="'+n+'"':'data-action="'+(auth?"auth-":"")+n+'" class="utility"')+' aria-label="'+(n==="clear"?"清除":n==="back"?"退一格":n)+'">'+(n==="clear"?"清除":n==="back"?"⌫":n)+'</button>').join("")+'</div>';}
function numberField(key,label,value){return '<button class="number-field '+(ui.field===key?"selected":"")+'" data-action="field" data-field="'+key+'" aria-label="'+label+'，目前'+(value||"尚未填寫")+'"><small>'+label+'</small><strong>'+safe(value||"？")+'</strong></button>';}
function play(){
 const r=state.run;if(!r){view="home";return home();}const solved=ui.feedback?.correct,q=solved?ui.solvedQ:currentQ(),g=ui.guide;
 return '<div class="play-top"><div><div class="eyebrow">'+(r.kind==="level"?"WORLD 0"+(r.world+1):r.kind==="review"?"MISTAKE BOOK":"LITTLE PRACTICE")+'</div><h1>'+(r.kind==="level"?WORLDS[r.world].name+" · "+(r.boss?"魔王挑戰":"第 "+(r.stage+1)+" 關"):r.kind==="review"?"錯題複習":"除法小練習")+'</h1></div><div class="mode-switch"><button data-action="mode" data-mode="guide" class="'+(ui.mode==="guide"?"chosen":"")+'">直式引導</button><button data-action="mode" data-mode="quick" class="'+(ui.mode==="quick"?"chosen":"")+'">商與餘數</button></div></div>'+(r.boss?'<div class="boss-strip">'+bossArt(r.world)+'<div class="boss-info">'+WORLDS[r.world].boss+'<div class="progress"><span style="width:'+((r.questions.length-r.index)/r.questions.length)*100+'%"></span></div><small>答對一題，烏雲就少一點 · 還有 '+(r.questions.length-r.index)+' 題</small></div></div>':"")+'<div class="play-layout"><section><div class="play-card '+(solved?"solved":"")+'"><div class="problem-meta"><span>'+(solved?r.index:r.index+1)+' / '+r.questions.length+' 題 · '+(q.digits===4?"四位數":q.digits===3?"三位數":"二位數")+'除法</span><span>'+(r.difficulty===2?'<span id="elapsed"></span>':"☁️ 不急，慢慢算")+'</span></div>'+(ui.mode==="guide"&&!solved?guide(q):'<div class="problem-text">'+q.a+' ÷ '+q.b+'</div><div class="answers">'+numberField("quotient","商",ui.quotient)+numberField("remainder","餘數",ui.remainder)+'</div><p class="answer-help">點選要填的格子，再按右邊或下方的數字盤</p>')+(ui.feedback?'<div class="feedback '+(ui.feedback.correct?"good":"")+'">'+(ui.feedback.correct?"✓ ":"💡 ")+safe(ui.feedback.text)+(ui.feedback.correct?'<button class="small-button" data-action="next">下一題 →</button>':"")+'</div>':"")+'</div><div class="hint-row"><button data-action="hint">💡 看一點提示</button><button data-action="lesson">📘 一起看直式</button><button data-action="leave">暫停冒險</button></div><div class="readout">'+saved()+' · 商 × 除數 ＋ 餘數 ＝ 被除數</div></section><aside class="keypad-panel"><p class="keypad-title">NUMBER CLOUDS</p>'+keypad()+'<button class="primary submit" data-action="submit" '+(solved?"disabled":"")+'>'+(ui.mode==="guide"?"確認這一步 ✓":"確認答案 ✓")+'</button><p class="keypad-note">算錯沒關係，我們再試一次。<br>整除時，餘數請填 0。</p></aside></div>';
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
 return '<div class="division-board">'+cells+'</div><p class="guide-instruction">第 '+Math.min(g.step+1,steps.length)+' 輪 · '+["商","乘","減"][g.phase]+' '+(s.q===0?"· 這一位可能要寫 0，不能跳過喔":"")+'</p><div class="guide-current"><p>'+prompts[g.phase]+'</p><button class="number-field selected" aria-label="'+labels[g.phase]+'"><small>'+labels[g.phase]+'</small><strong>'+safe(g.entered||"？")+'</strong></button></div>';
}
async function digit(d){
 if(form){if(form.mode==="recover")return;const max=12;if(form.pin.length<max)form.pin+=String(d);const el=$("#auth-pin");if(el)el.textContent="●".repeat(form.pin.length)||"請用下方數字盤";return;}
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
 if(Number(g.entered)!==expected){g.assisted=true;ui.feedback={correct:false,text:g.phase===0?"用除數乘這個數字看看，乘積要不超過目前被除數。":g.phase===1?"再乘一次看看，可以把除數拆成十位和個位。":"再檢查一次減法，餘數應該比除數小。"};stashWork();render();return;}
 g.values[g.step+":"+g.phase]=g.entered;g.entered="";g.phase++;
 if(g.phase===3){g.phase=0;g.step++;}
 if(g.step<steps.length){ui.feedback=null;stashWork();render();return;}
 ui.quotient=steps.map((_,i)=>g.values[i+":0"]).join("");ui.remainder=g.values[(steps.length-1)+":2"];assisted=assisted||g.assisted;stashWork();
 }
 if(ui.quotient===""||ui.remainder===""){ui.field=ui.quotient===""?"quotient":"remainder";toast("商和餘數都要填，整除時餘數填 0");render();return;}
 const oldQ=q;const result=await event("answer",{questionId:q.id,quotient:ui.quotient,remainder:ui.remainder,assisted});
 if(!result){if(ui.mode==="guide"&&ui.guide.step>=targets(q).length){ui.guide.step=targets(q).length-1;ui.guide.phase=2;ui.guide.entered=ui.remainder;stashWork();}render();return;}
 if(result.duplicate){if(!state.run)resultModal();else{resetQuestion();render();}return;}
 if(!result.correct){ui.feedback={correct:false,text:result.reason};if(ui.mode==="guide"){resetQuestion();}render();return;}
 if(result.finished){view="home";render();resultModal();return;}
 ui.solvedQ=oldQ;ui.feedback={correct:true,text:"算對了！ "+oldQ.a+" = "+oldQ.b+" × "+Math.floor(oldQ.a/oldQ.b)+" + "+oldQ.a%oldQ.b};render();
 if(state.correct%15===0)toast("完成 15 道小挑戰了！可以讓眼睛休息一下，再回來冒險 ♡");
}
function collection(){
 return title("把冒險的小回憶，收藏起來","通關紀念、成就寶物，還有大耳狗的新裝扮。","YOUR CLOUD TREASURES")+'<div class="inventory-banner">'+cinna(state.equipped)+'<div><h2>今天的大耳狗，也很可愛 ♡</h2><p>已收藏 '+state.inventory.length+' / '+COLLECTION.length+' · 雲朵幣 '+state.coins+'</p><button class="small-button" data-action="equip" data-item="">回到原本的樣子</button></div></div><div class="collections">'+COLLECTION.map(i=>{const owned=state.inventory.includes(i.id);return '<section class="collect-card '+(owned?"":"unowned")+'"><div class="item-icon">'+i.emoji+'</div><h3>'+i.name+'</h3><p>'+i.desc+'</p>'+(owned?i.wear?'<button class="small-button" data-action="equip" data-item="'+i.id+'" '+(state.equipped===i.id?"disabled":"")+'>'+(state.equipped===i.id?"穿戴中 ✓":"讓大耳狗戴上")+'</button>':'<span class="pill">已收藏 ✓</span>':i.cost?'<button class="small-button" data-action="buy" data-item="'+i.id+'" '+(state.coins<i.cost?"disabled":"")+'>🪙 '+i.cost+' · 收藏</button>':'<span class="pill">冒險成就獎勵</span>')+'</section>';}).join("")+'</div>';
}
function report(){
 const accuracy=state.attempts?Math.round(state.correct/state.attempts*100):0;
 return title("每一次練習，都留下小腳印","看看自己的進步，下一次再多懂一點點。","YOUR LEARNING JOURNEY")+'<div class="report-grid"><section class="panel"><h2>答對的四位數</h2><strong>'+state.fourCorrect+'</strong><small>主要練習目標</small></section><section class="panel"><h2>答案提交正確率</h2><strong>'+accuracy+'<span style="font-size:16px">%</span></strong><small>包含重新提交的答案</small></section><section class="panel"><h2>已完成關卡</h2><strong>'+Object.keys(state.levels).length+'</strong><small>一共 36 個世界關卡</small></section></div><div class="section-heading"><h2>📘 我的錯題本</h2><button class="ghost" data-action="review">開始複習 →</button></div>'+(state.mistakes.length?'<section class="panel">'+state.mistakes.slice(0,10).map(m=>'<div class="history-row"><span>'+m.question.a+' ÷ '+m.question.b+'<small>這題試過 '+m.errors+' 次，下一次再挑戰</small></span><span class="pill">等你來複習</span></div>').join("")+'</section>':'<div class="empty">☁️ 目前沒有待複習的錯題，繼續你的冒險吧！</div>')+'<div class="section-heading"><h2>最近的冒險</h2><small>保留最近 60 場</small></div>'+(state.history.length?'<section class="panel">'+state.history.slice(-10).reverse().map(r=>'<div class="history-row"><span>'+(r.kind==="level"?WORLDS[r.world].name+" · "+(r.stage===5?"魔王關":"第 "+(r.stage+1)+" 關"):r.kind==="review"?"錯題複習":"自由練習")+'<small>'+new Date(r.at).toLocaleDateString("zh-TW",{timeZone:"Asia/Taipei"})+' · '+r.perfect+" / "+r.count+' 題首次答對且未用提示</small></span><span class="stars">'+"★".repeat(r.stars)+"☆".repeat(3-r.stars)+'</span></div>').join("")+'</section>':'<div class="empty">你的第一場冒險，會從這裡開始。</div>')+'<div class="banner">⭐ 三星：全部首次答對且未使用提示；二星：至少六成；一星：完成全部題目。直式中答錯或查看提示會算輔助作答。</div>';
}
function modules(){return title("下一站，還有更多數學世界","目前開放除法冒險；其他主題正在規劃。","MORE WORLDS TO COME")+'<div class="module-grid">'+MODULES.map((m,i)=>'<section class="module-card"><span>'+["☁️","➕","🍰"][i]+'</span><h2>'+m.name+'</h2><p>'+["四位數除法為主，二、三位數可以暖身。","未來練習運算順序、括號與四則混合。","未來練習分數大小、通分與分數運算。"][i]+'</p>'+(i===0?'<button class="primary" data-action="nav" data-view="practice">現在去練習 →</button>':'<span class="pill">尚未開放</span>')+'</section>').join("")+'</div>';}
function modal(content,cls=""){modalRoot.innerHTML='<div class="modal-backdrop"><section class="modal-card '+cls+'" role="dialog" aria-modal="true"><button class="close" data-action="close" aria-label="關閉">×</button>'+content+'</section></div>';const close=modalRoot.querySelector(".close");close?.focus();}
function closeModal(){form=null;modalRoot.innerHTML="";}
function resultModal(){
 const r=state.lastResult;if(!r)return;
 modal(cinna(state.equipped)+'<div class="eyebrow">A LITTLE WIN, A BIG SMILE</div><h2>'+(r.boss?"烏雲散開，世界放晴了！":"又完成一段小冒險！")+'</h2><div class="result-stars">'+"★".repeat(r.stars)+"☆".repeat(3-r.stars)+'</div><div class="result-summary"><span>🪙 通關獎勵 +'+r.bonus+'</span><span>☁️ '+r.perfect+' / '+r.count+' 題完美作答</span></div><p>'+(r.first&&r.boss?"世界紀念收藏已加入你的收藏冊！":r.stars===3?"你把每一步都算得好清楚，大耳狗好開心 ♡":"每一顆星星，都是你願意練習的證明 ♡")+'</p><div class="modal-actions"><button class="secondary" data-action="result-map">回到地圖</button><button class="primary" data-action="result-next">再冒險一關 →</button></div>',"result");
}
function hint(full=false){
 const q=currentQ();if(!q)return;ui.assisted=true;if(ui.guide){ui.guide.assisted=true;stashWork();}
 const steps=targets(q);
 modal('<div class="eyebrow">LET’S THINK TOGETHER</div><h2>'+(full?"一起看這題的直式":"先找一點小線索")+'</h2><p>'+q.a+' ÷ '+q.b+' · 可以先看除數的倍數。</p>'+(full?steps.map((s,i)=>'<div class="lesson-step"><b>第 '+(i+1)+' 輪'+(s.q===0?" · 這一位的商要寫 0":"")+'</b><br>'+s.value+' ÷ '+q.b+' → 商 '+s.q+'<br>'+q.b+' × '+s.q+' = '+s.product+'<br>'+s.value+' − '+s.product+' = '+s.remainder+(s.next!==null?'<br>拉下 '+s.next+'，下一輪看 '+(s.remainder*10+s.next):"")+'</div>').join("")+'<div class="lesson-final">商 '+Math.floor(q.a/q.b)+'，餘數 '+q.a%q.b+'</div>':'<div class="lesson-step">① 每一位的商只能是 0～9。<br>② 「除數 × 這位的商」不能比目前要除的數大。<br>③ 相減後，剩下的數要比除數小。<br>④ 記得拉下下一位，商是 0 時也要寫出來。</div><div class="lesson-step">'+[1,2,3,4,5,6,7,8,9].map(n=>q.b+" × "+n+" = "+q.b*n).join("　 ·　 ")+'</div>')+'<p style="margin-top:16px">看過提示仍可通關；這題會記為輔助作答。</p><button class="primary submit" data-action="close">我再試一次 ♡</button>');
}
async function begin(options){
 if(state.run){modal('<h2>還有一場小冒險</h2><p>你已經完成 '+state.run.index+' / '+state.run.questions.length+' 題。要先繼續嗎？</p><div class="modal-actions"><button class="primary" data-action="continue">繼續冒險</button><button class="secondary" data-action="replace-run">換一場冒險</button></div>');window.nextRunOptions=options;return;}
 const r=await event("start",{options});if(r){view="play";resetQuestion();closeModal();render();}
}
function stageOptions(w,l){ui.difficulty=0;window.nextRunOptions={kind:"level",world:w,stage:l,difficulty:0};modal('<div class="eyebrow">READY FOR A LITTLE ADVENTURE?</div><h2>'+WORLDS[w].name+' · '+(l===5?"魔王關":"第 "+(l+1)+" 關")+'</h2><p>'+(l===5?"8 道題目，每答對一題就削弱一點烏雲。":"5 道除法，完成後開啟下一關。")+'</p>'+difficultyButtons()+'<button class="primary submit" data-action="stage-start">準備好了，出發 →</button>');}
function openAuth(mode="login"){
 form={mode,pin:"",username:"",name:""};
 authRender();
}
function authRender(){
 const m=form.mode;
 modal('<div class="eyebrow">YOUR OWN CLOUD ADVENTURE</div><h2>'+(m==="register"?"建立你的冒險帳號":m==="recover"?"用家長復原碼登入":m==="pin"?"設定新的數字密碼":"歡迎回到雲朵世界")+'</h2><p>'+(m==="register"?"同一帳號可以在不同裝置接續進度。訪客進度會另外留在這台裝置。":m==="pin"?"設定 8–12 位數字。其他装置將需要重新登入。":"登入後，關卡、收藏與每日任務都會跟著你。")+'</p>'+(m==="pin"?"":'<div class="auth-tabs"><button data-action="auth-mode" data-mode="login" class="'+(m==="login"?"chosen":"")+'">登入</button><button data-action="auth-mode" data-mode="register" class="'+(m==="register"?"chosen":"")+'">建立帳號</button></div><label for="username">帳號 · 英文字母、數字、底線</label><input class="text-input" id="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="24" value="'+safe(form.username)+'">')+(m==="register"?'<label for="nickname">冒險家暱稱</label><input class="text-input" id="nickname" maxlength="20" value="'+safe(form.name)+'">':"")+(m==="recover"?'<label for="recovery-input">家長復原碼</label><input class="text-input" id="recovery-input" autocomplete="off" autocapitalize="none" spellcheck="false">':'<label>數字密碼 · 8–12 位</label><button id="auth-pin" class="auth-pin" aria-label="數字密碼">'+"●".repeat(form.pin.length)+'</button>'+keypad(true))+'<div class="error" id="auth-error"></div><button class="primary submit" data-action="auth-submit">'+(m==="register"?"建立帳號，開始冒險":m==="pin"?"更新數字密碼":"登入我的冒險")+'</button>'+(m==="pin"?"":'<button class="inline-link" data-action="auth-mode" data-mode="recover">忘記數字密碼？用家長復原碼登入</button>'));
}
async function authSubmit(){
 if(busy||!form)return;
 const mode=form.mode;
 const body=mode==="pin"?{pin:form.pin}:{username:$("#username").value.trim(),pin:form.pin,...(mode==="register"?{name:$("#nickname").value.trim()}:{}),...(mode==="recover"?{recovery:$("#recovery-input").value.trim().toLowerCase()}: {})};
 if(mode!=="recover"&&!/^\d{8,12}$/.test(form.pin)){$("#auth-error").textContent="請用下方數字盤輸入 8–12 位數字密碼";return;}
 busy=true;$("#auth-error").textContent="正在連線…";const button=modalRoot.querySelector('[data-action="auth-submit"]');button.disabled=true;
 try{
 const data=await api(mode,body);
 if(mode==="pin"){account.token=data.token;put("cloudmath:account",account);closeModal();recoveryModal(data.recovery);}
 else{account={user:data.user,token:data.token,version:data.version};state=data.state;version=data.version;status="雲端已儲存";stash();closeModal();view="home";render();if(data.recovery)recoveryModal(data.recovery);else toast("歡迎回來，"+state.name+" ♡");}
 }catch(e){$("#auth-error").textContent=e.message;button.disabled=false;}
 finally{busy=false;}
}
function recoveryModal(code){
 modal('<h2>請讓家長收好復原碼</h2><p>忘記數字密碼時，可以用這組代碼登入。它只會在這裡顯示，請先保存。</p><div class="recovery" id="recovery-code">'+safe(code)+'</div><div class="modal-actions"><button class="secondary" data-action="download-recovery">下載復原碼</button><button class="primary" data-action="close">已收好，開始冒險</button></div>');
}
function accountModal(){
 if(!account){openAuth();return;}
 modal('<div class="eyebrow">YOUR ADVENTURER PROFILE</div><h2>'+safe(state.name)+' 的冒險帳號</h2><p>帳號：'+safe(account.user.username)+'<br>冒險等級 '+playerLevel(state)+' · '+state.xp+' XP<br>'+safe(status)+'</p><div class="settings-list"><button class="secondary" data-action="refresh">↻ 同步最新進度</button><button class="secondary" data-action="change-pin">更新數字密碼</button><button class="secondary" data-action="logout">在這台裝置登出</button></div>');
}
async function refresh(){
 if(!account)return;
 try{const data=await api("me");state=data.state;version=data.version;status="雲端已儲存";stash();if(view==="play")resetQuestion();render();const pending=read("cloudmath:pending:"+identity(),null);if(pending){const r=await event(pending.type);if(r){toast("先前未完成的儲存已同步");if(view==="play"){resetQuestion();render();}}}}
 catch(e){status=e.status===401?"請重新登入":"雲端暫時離線";render();toast(e.message);}
}
document.addEventListener("click",async e=>{
 const el=e.target.closest("button");if(!el)return;
 if(el.dataset.digit!==undefined){digit(el.dataset.digit);return;}
 const a=el.dataset.action;if(!a)return;
 switch(a){
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
 case"claim":{const r=await event("claim",{key:el.dataset.key});if(r){toast("任務完成！獲得 "+r.reward+" 個雲朵幣");render();}break;}
 case"buy":{const r=await event("buy",{item:el.dataset.item});if(r){toast("新的寶物加入收藏了 ♡");render();}break;}
 case"equip":{const r=await event("equip",{item:el.dataset.item||null});if(r){render();}break;}
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
 else if(e.key==="Escape")closeModal();
});
setInterval(()=>{const el=$("#elapsed");if(el&&state.run){const seconds=Math.max(0,Math.floor((Date.now()-state.run.startedAt)/1000));el.textContent="⏱ "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");}},1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&account&&!busy&&view!=="play")refresh();});
window.addEventListener("online",()=>{if(account&&!busy)refresh();});
render();if(account)refresh();
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
