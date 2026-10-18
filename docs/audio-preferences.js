// One-time migration to the requested full-volume defaults. Later user choices persist.
export function loadAudioPreferences(storage,key){
 try{const saved=JSON.parse(storage.getItem(key));if(saved?.version===2)return {enabled:saved.enabled!==false,volume:Number.isFinite(saved.volume)?Math.max(0,Math.min(1,saved.volume)):1};}catch{}
 const defaults={enabled:true,volume:1};saveAudioPreferences(storage,key,defaults);return defaults;
}
export function saveAudioPreferences(storage,key,value){try{storage.setItem(key,JSON.stringify({...value,version:2}));}catch{}}
