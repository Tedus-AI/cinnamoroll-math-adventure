import {createDictation} from './dictation.js';
const labels={feature:'功能心願',suggestion:'使用建議',bug:'Bug 回報'},statuses={new:'未讀',read:'已讀',done:'已處理'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createWishes({api,modal,getAccount,getContext,onVoice,notify}){
 let cleanup=null,generation=0,activeSpeech=null;
 function close(){generation++;const previous=cleanup;cleanup=null;previous?.();}
 function open(){
  const account=getAccount(),key='cloudmath:wish-draft:'+(account?.user.id||'guest');let draft;
  try{draft=JSON.parse(localStorage.getItem(key));}catch{}
  draft={id:crypto.randomUUID(),category:'feature',title:'',message:'',...draft};
  if(!Object.hasOwn(labels,draft.category))draft.category='feature';
  modal('<h2>💌 寫一封功能心願</h2><p>希望新增的功能、使用建議，或遇到的問題，都可以寫給管理員。'+(account?'':'訪客也可以寄送。')+'</p>'+(account?.user.role==='admin'?'<button class="secondary" id="wish-inbox">📬 管理員心願信箱</button>':'')+'<form id="wish-form"><label for="wish-kind">信件類型</label><select class="text-input" id="wish-kind">'+Object.entries(labels).map(([key,value])=>'<option value="'+key+'" '+(draft.category===key?'selected':'')+'>'+value+'</option>').join('')+'</select><label for="wish-title">主旨</label><input class="text-input" id="wish-title" maxlength="80" required placeholder="例如：希望有更多帽子" value="'+escape(draft.title)+'"><label for="wish-message">內容</label><textarea class="text-input wish-message" id="wish-message" maxlength="2000" required placeholder="請描述你的想法；如果是 Bug，可說明操作步驟與發生的情況。">'+escape(draft.message)+'</textarea><div class="wish-voice-row"><button type="button" class="secondary" id="wish-voice" aria-pressed="false">🎤 語音輸入</button><span id="wish-count"></span></div><p class="wish-note">語音由瀏覽器轉成文字，送出前可以修改；信箱只保存文字。會附上裝置類型與目前畫面，幫助管理員了解問題。</p><p class="wish-note" id="wish-voice-status" role="status"></p><div id="wish-error" class="error" role="alert"></div><button type="submit" class="primary submit">寄給管理員 💌</button></form>');
  const form=document.querySelector('#wish-form'),kind=form.querySelector('#wish-kind'),title=form.querySelector('#wish-title'),message=form.querySelector('#wish-message'),count=form.querySelector('#wish-count'),error=form.querySelector('#wish-error'),submit=form.querySelector('[type=submit]');
  let attempted=false,sending=false;
  const persist=()=>{draft.category=kind.value;draft.title=title.value;draft.message=message.value;try{localStorage.setItem(key,JSON.stringify(draft));}catch{}count.textContent=message.value.length+' / 2000';};
  const changed=()=>{if(attempted){draft.id=crypto.randomUUID();attempted=false;}persist();};
  form.addEventListener('input',changed);persist();
  const speech=activeSpeech=createDictation({target:message,button:form.querySelector('#wish-voice'),status:form.querySelector('#wish-voice-status'),onActive:onVoice,onInput:changed});
  form.querySelector('#wish-voice').onclick=()=>speech.toggle();
  document.querySelector('#wish-inbox')?.addEventListener('click',()=>void inbox());
  cleanup=()=>{speech.close();activeSpeech=null;persist();};const token=generation;
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(sending)return;speech.close();persist();
   if(!title.value.trim()||!message.value.trim()){error.textContent='請填寫主旨與內容。';return;}
   attempted=true;sending=true;error.textContent='寄送中…';form.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=true);
   try{await api('wishes',{...draft,context:getContext()});try{localStorage.removeItem(key);}catch{}if(generation===token){cleanup=null;modal('<h2>心願已寄出 💌</h2><p>已送到管理員的心願信箱，謝謝你讓冒險變得更好！</p><button class="primary submit" data-action="close">回到冒險</button>');}else notify('心願已寄出 💌');}
   catch(e){if(generation===token){error.textContent=e.message+'；內容已保留，可再試一次。';form.querySelectorAll('button,input,select,textarea').forEach(el=>el.disabled=false);}}
   finally{sending=false;}
  });
 }
 async function inbox(before=''){
  if(getAccount()?.user.role!=='admin')return;
  modal('<h2>📬 管理員心願信箱</h2><p role="status">讀取信件中…</p>');const token=generation;
  try{
   const data=await api('wishes'+(before?'?before='+encodeURIComponent(before):''));if(generation!==token)return;
   modal('<h2>📬 管理員心願信箱</h2><p>'+data.unread+' 封未讀 · 每頁最多 20 封</p><div class="wish-inbox">'+(data.items.length?data.items.map(item=>'<article class="wish-letter"><div class="wish-letter-heading"><strong>'+escape(labels[item.category])+' · '+escape(item.title)+'</strong><span class="pill">'+escape(statuses[item.status])+'</span></div><small>'+escape(item.sender)+' · '+new Date(item.created_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+'</small><p class="wish-letter-body">'+escape(item.message)+'</p><small>'+escape(item.context)+'</small><div class="wish-letter-actions">'+Object.entries(statuses).map(([status,label])=>'<button class="small-button" data-wish-id="'+escape(item.id)+'" data-wish-status="'+status+'" '+(item.status===status?'disabled':'')+'>標為'+label+'</button>').join('')+'</div></article>').join(''):'<p>目前還沒有心願信件。</p>')+'</div><div class="modal-actions"><button class="secondary" id="wish-latest">最新信件</button>'+(data.nextCursor?'<button class="secondary" id="wish-older">較早信件 →</button>':'')+'<button class="primary" id="wish-compose">寫一封心願</button></div><p class="error" id="wish-inbox-error" role="alert"></p>');
   document.querySelector('#wish-latest').onclick=()=>void inbox();document.querySelector('#wish-older')?.addEventListener('click',()=>void inbox(data.nextCursor));document.querySelector('#wish-compose').onclick=open;
   const current=generation;
   document.querySelector('.wish-inbox').onclick=async e=>{const button=e.target.closest('[data-wish-status]');if(!button||button.disabled)return;button.disabled=true;try{await api('wish-status',{id:button.dataset.wishId,status:button.dataset.wishStatus});if(generation===current)await inbox(before);}catch(err){if(generation===current){document.querySelector('#wish-inbox-error').textContent=err.message;button.disabled=false;}}};
  }catch(e){if(generation===token)modal('<h2>心願信箱暫時無法開啟</h2><p>'+escape(e.message)+'</p><button class="primary" data-action="wishes">重試</button>');}
 }
 return {open,inbox,close,stopVoice:()=>activeSpeech?.close()};
}
