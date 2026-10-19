import {createWish,listWishes,updateWish} from './wishes.js';
import {newState,publicState,applyAction,unlockAdministrator} from '../public/game/engine.js';

const ORIGINS=new Set(['https://tedus-ai.github.io','https://cinnamoroll-math-adventure.bronzelion1.chatgpt.site','http://127.0.0.1:5173','http://localhost:5173']);
const encoder=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const random=(n=32)=>hex(crypto.getRandomValues(new Uint8Array(n)));
const sha=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
async function pinHash(pin,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(pin),'PBKDF2',false,['deriveBits']);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256)));
}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function response(req,data,status=200){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type'};
 const origin=req.headers.get('Origin');if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
 return new Response(status===204?null:JSON.stringify(data),{status,headers});
}
async function readJson(req){
 if(!req.headers.get('Content-Type')?.includes('application/json'))throw fail('請使用 JSON',415);
 if(Number(req.headers.get('Content-Length')||0)>16000)throw fail('資料過大',413);
 const reader=req.body?.getReader();if(!reader)throw fail('缺少資料');let total=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>16000){await reader.cancel();throw fail('資料過大',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const all=new Uint8Array(total);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.byteLength;}
 let data;try{data=JSON.parse(new TextDecoder().decode(all));}catch{throw fail('資料格式不正確');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw fail('資料格式不正確');return data;
}
async function limit(db,key,max,windowMs){
 const bucket=Math.floor(Date.now()/windowMs),k=await sha(key+':'+bucket);
 const row=await db.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(k,Date.now()+windowMs).first();
 if(row.count>max)throw fail('嘗試次數較多，請稍後再試。',429);
}
async function tokenFor(db,id){
 const token=random();await db.prepare('INSERT INTO sessions (hash,user_id,expires_at) VALUES (?,?,?)').bind(await sha(token),id,Date.now()+30*86400000).run();return token;
}
async function authorized(req,db){
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!token||!/^[a-f0-9]{64}$/.test(token))throw fail('請先登入你的冒險帳號',401);
 const user=await db.prepare('SELECT players.id,players.username,players.name,players.role FROM sessions JOIN players ON players.id=sessions.user_id WHERE sessions.hash=? AND sessions.expires_at>?').bind(await sha(token),Date.now()).first();
 if(!user)throw fail('登入已過期，請重新登入',401);return user;
}
function trustedState(save,user){const s=JSON.parse(save.state);if(user.role==='admin')unlockAdministrator(s);else delete s.adminUnlocked;return s;}
async function accountData(db,user){
 const save=await db.prepare('SELECT state,version FROM saves WHERE user_id=?').bind(user.id).first();if(!save)throw fail('找不到冒險進度，請聯絡管理員',503);
 return {user:{id:user.id,username:user.username,name:user.name,role:user.role},serverNow:Date.now(),state:publicState(trustedState(save,user)),version:save.version};
}
async function adminLogin(req,env,b,ip){
 if(!env.ADMIN_PIN)throw fail('管理員入口尚未設定',503);
 await limit(env.DB,'admin:'+ip,5,15*60000);
 const supplied=await sha(String(b.pin||'')),expected=await sha(env.ADMIN_PIN);
 if(!equal(supplied,expected))throw fail('管理員密碼不正確',401);
 const id='system-administrator',state=unlockAdministrator(newState('系統管理員'));
 // The dedicated administrator cannot log in through the ordinary player PIN endpoint.
 await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO players (id,username,name,salt,pin_hash,recovery_hash,created_at,role) VALUES (?,?,?,?,?,?,?,'admin')").bind(id,'system_admin','系統管理員',random(16),random(),random(),Date.now()),
  env.DB.prepare('INSERT OR IGNORE INTO saves (user_id,state,version,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(state),Date.now())
 ]);
 const user=await env.DB.prepare('SELECT id,username,name,role FROM players WHERE id=?').bind(id).first();
 return response(req,{...await accountData(env.DB,user),token:await tokenFor(env.DB,id)});
}
export default {
 async fetch(req,env){
  try{
   const url=new URL(req.url),action=url.pathname.replace(/^\/api\/game\//,'');
   if(!url.pathname.startsWith('/api/game/'))return response(req,{error:'找不到這個功能'},404);
   const origin=req.headers.get('Origin');if(origin&&!ORIGINS.has(origin))return response(req,{error:'不允許的來源'},403);
   if(req.method==='OPTIONS')return response(req,{},204);
   const db=env.DB;if(!db)throw fail('資料庫尚未設定',503);
   if(req.method==='GET'){
    if(action==='health'){await db.prepare('SELECT 1 AS ok').first();return response(req,{ok:true,version:'adventure-v4',storage:'owner-cloudflare-d1'});}
    if(action==='wishes')return response(req,await listWishes(db,await authorized(req,db),url.searchParams.get('before')));
    if(action!=='me')return response(req,{error:'找不到這個功能'},404);
    return response(req,await accountData(db,await authorized(req,db)));
   }
   if(req.method!=='POST')return response(req,{error:'不支援此操作'},405);
   const b=await readJson(req),ip=req.headers.get('CF-Connecting-IP')||'local';
   if(action==='admin-login')return await adminLogin(req,env,b,ip);
   if(action==='wishes'){const sender=req.headers.has('Authorization')?await authorized(req,db):null;return response(req,await createWish(db,sender,b,ip,limit));}
   if(['register','login','recover'].includes(action)){
    const username=String(b.username||'').trim().toLowerCase();if(!/^[a-z0-9_]{3,24}$/.test(username))throw fail('帳號請用 3–24 個英文字母、數字或底線');
    await limit(db,'ip-auth:'+ip,40,3600000);await limit(db,'user-auth:'+username,8,600000);
    if(action==='register'){
     await limit(db,'register:'+ip,10,86400000);
     if(!/^\d{8,12}$/.test(b.pin))throw fail('請設定 8–12 位數字密碼');
     const name=String(b.name||username).trim().slice(0,20);if(!name)throw fail('請填入冒險家暱稱');
     if(username==='system_admin'||await db.prepare('SELECT id FROM players WHERE username=?').bind(username).first())throw fail('這個帳號已經有人使用',409);
     const id=crypto.randomUUID(),salt=random(16),recovery=random(16),now=Date.now(),state=newState(name);
     const ph=await pinHash(b.pin,salt),rh=await pinHash(recovery,salt);
     await db.batch([
      db.prepare("INSERT INTO players (id,username,name,salt,pin_hash,recovery_hash,created_at,role) VALUES (?,?,?,?,?,?,?,'player')").bind(id,username,name,salt,ph,rh,now),
      db.prepare('INSERT INTO saves (user_id,state,version,updated_at) VALUES (?,?,0,?)').bind(id,JSON.stringify(state),now)
     ]);
     await db.batch([db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now),db.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now)]);
     return response(req,{user:{id,username,name,role:'player'},token:await tokenFor(db,id),recovery,serverNow:Date.now(),state:publicState(state),version:0});
    }
    const user=await db.prepare('SELECT * FROM players WHERE username=?').bind(username).first();
    const value=String(action==='recover'?b.recovery:b.pin),hash=await pinHash(value,user?.salt||'00000000000000000000000000000000');
    if(!user||user.role==='admin'||!equal(hash,action==='recover'?user.recovery_hash:user.pin_hash))throw fail('帳號或密碼不正確',401);
    return response(req,{...await accountData(db,user),token:await tokenFor(db,user.id)});
   }
   const user=await authorized(req,db);
   if(action==='wish-status')return response(req,await updateWish(db,user,b));
   if(action==='logout'){await db.prepare('DELETE FROM sessions WHERE hash=?').bind(await sha(req.headers.get('Authorization').slice(7))).run();return response(req,{ok:true});}
   if(action==='pin'){
    if(user.role==='admin')throw fail('管理員密碼由雲端設定管理',403);
    if(!/^\d{8,12}$/.test(b.pin))throw fail('請使用 8–12 位數字密碼');
    const salt=random(16),recovery=random(16),ph=await pinHash(b.pin,salt),rh=await pinHash(recovery,salt);
    await db.batch([db.prepare('UPDATE players SET salt=?,pin_hash=?,recovery_hash=? WHERE id=?').bind(salt,ph,rh,user.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
    return response(req,{token:await tokenFor(db,user.id),recovery});
   }
   if(action!=='event')throw fail('找不到這個功能',404);
   await limit(db,'events:'+user.id,200,60000);
   const save=await db.prepare('SELECT state,version FROM saves WHERE user_id=?').bind(user.id).first(),state=trustedState(save,user);
   if(state.actions.includes(b.id))return response(req,{serverNow:Date.now(),state:publicState(state),version:save.version,result:{duplicate:true}});
   if(b.version!==save.version)return response(req,{error:'另一個裝置已有新進度，已替你同步',serverNow:Date.now(),state:publicState(state),version:save.version},409);
   let result;try{result=applyAction(state,b);}catch(e){throw fail(e.message);}
   const changed=await db.prepare('UPDATE saves SET state=?,version=version+1,updated_at=? WHERE user_id=? AND version=?').bind(JSON.stringify(state),Date.now(),user.id,save.version).run();
   if(!changed.meta.changes){const latest=await accountData(db,user);return response(req,{error:'另一個裝置已有新進度，已替你同步',state:latest.state,version:latest.version},409);}
   return response(req,{serverNow:Date.now(),state:publicState(state),version:save.version+1,result:result.run?{started:true}:result});
  }catch(e){if(!e.status)console.error(JSON.stringify({event:'game-api-error',kind:e.name}));return response(req,{error:e.status?e.message:'雲端目前無法連線，請稍後再試'},e.status||503);}
 }
};
