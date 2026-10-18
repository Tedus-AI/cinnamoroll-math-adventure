export function createDictation({target,button,status,onActive=()=>{},onInput=()=>{},Speech=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition}){
 let recognition=null,timer=null,prefix='',suffix='';
 function finish(){clearTimeout(timer);timer=null;recognition=null;target.readOnly=false;button.textContent='🎤 語音輸入';button.setAttribute('aria-pressed','false');onActive(false);}
 function close(){const current=recognition;if(current){current.onresult=null;current.onend=null;current.onerror=null;try{current.abort();}catch{}}finish();}
 function toggle(){
  if(recognition){recognition.stop();status.textContent='正在完成辨識…';return;}
  if(!Speech){status.textContent='此瀏覽器沒有直接語音輸入。請點內容框，再使用鍵盤上的麥克風／聽寫按鈕。';target.focus();return;}
  const from=target.selectionStart??target.value.length,to=target.selectionEnd??from;
  prefix=target.value.slice(0,from);suffix=target.value.slice(to);
  try{
   const rec=new Speech();recognition=rec;rec.lang='zh-TW';rec.continuous=true;rec.interimResults=true;
   rec.onresult=e=>{if(recognition!==rec)return;let transcript='';for(let i=0;i<e.results.length;i++)transcript+=e.results[i][0].transcript;target.value=(prefix+transcript+suffix).slice(0,2000);onInput();};
   rec.onerror=e=>{status.textContent=e.error==='not-allowed'?'麥克風未獲允許。可到瀏覽器設定開啟，或使用鍵盤聽寫。':e.error==='no-speech'?'沒有聽到聲音，請再試一次。':'語音暫時無法使用，請改用鍵盤聽寫或打字。';close();};
   rec.onend=()=>{if(recognition!==rec)return;finish();status.textContent='辨識已結束，請檢查文字後再送出。';};
   target.readOnly=true;button.textContent='■ 停止語音';button.setAttribute('aria-pressed','true');status.textContent='正在聆聽，請說出你的心願…';onActive(true);rec.start();
   timer=setTimeout(()=>{if(recognition===rec)rec.stop();},60000);
  }catch{close();status.textContent='無法開啟麥克風，請使用鍵盤聽寫或打字。';}
 }
 return {toggle,close,get active(){return Boolean(recognition);}};
}
