import { env } from "cloudflare:workers";
import {newState,publicState,applyAction} from "../../../../public/game/engine.js";
export const dynamic="force-dynamic";
const ORIGINS=new Set(["https://tedus-ai.github.io","https://cinnamoroll-math-adventure.bronzelion1.chatgpt.site","http://127.0.0.1:5173","http://localhost:5173"]);
const encoder=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
const random=(n=32)=>hex(crypto.getRandomValues(new Uint8Array(n)));
const sha=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s))));
async function pinHash(pin:string,salt:string){
 const key=await crypto.subtle.importKey("raw",encoder.encode(pin),"PBKDF2",false,["deriveBits"]);
 return hex(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:encoder.encode(salt),iterations:100000,hash:"SHA-256"},key,256)));
}
function equal(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function response(req:Request,data:any,status=200){
 const h:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Origin"};
 const origin=req.headers.get("Origin");if(origin&&ORIGINS.has(origin))h["Access-Control-Allow-Origin"]=origin;
 h["Access-Control-Allow-Methods"]="GET, POST, OPTIONS";h["Access-Control-Allow-Headers"]="Authorization, Content-Type";
 return new Response(status===204?null:JSON.stringify(data),{status,headers:h});
}
async function limit(db:any,key:string,max:number,windowMs:number){
 const bucket=Math.floor(Date.now()/windowMs);const k=await sha(key+":"+bucket);
 const row=await db.prepare("INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(k,Date.now()+windowMs).first();
 if(row.count>max)throw Object.assign(new Error("嘗試次數較多，請稍後再試。"),{status:429});
}
async function tokenFor(db:any,userId:string){
 const token=random();await db.prepare("INSERT INTO sessions (hash,user_id,expires_at) VALUES (?,?,?)").bind(await sha(token),userId,Date.now()+30*86400000).run();return token;
}
async function authorized(req:Request,db:any){
 const token=req.headers.get("Authorization")?.replace(/^Bearer /,"");
 if(!token||!/^[a-f0-9]{64}$/.test(token))throw Object.assign(new Error("請先登入你的冒險帳號"),{status:401});
 const row=await db.prepare("SELECT players.id,players.username,players.name FROM sessions JOIN players ON players.id=sessions.user_id WHERE sessions.hash=? AND sessions.expires_at>?").bind(await sha(token),Date.now()).first();
 if(!row)throw Object.assign(new Error("登入已過期，請重新登入"),{status:401});return row;
}
export async function OPTIONS(req:Request){return response(req,{},204);}
export async function GET(req:Request){
 try{const db=(env as any).DB;if(!db)throw new Error("資料庫尚未設定");const user=await authorized(req,db);const save=await db.prepare("SELECT state,version FROM saves WHERE user_id=?").bind(user.id).first();return response(req,{user,state:publicState(JSON.parse(save.state)),version:save.version});}catch(e:any){return response(req,{error:e.status?e.message:"雲端目前無法連線，請稍後再試"},e.status||503);}
}
export async function POST(req:Request,{params}:any){
 try{
 const origin=req.headers.get("Origin");if(origin&&!ORIGINS.has(origin))return response(req,{error:"不允許的來源"},403);
 if(!req.headers.get("Content-Type")?.includes("application/json"))return response(req,{error:"請使用 JSON"},415);
 if(Number(req.headers.get("Content-Length")||0)>16000)return response(req,{error:"資料過大"},413);
 const raw=await req.text();if(raw.length>16000)return response(req,{error:"資料過大"},413);const b=JSON.parse(raw);
 const resolved=await params;const action=resolved.action;
 const db=(env as any).DB;if(!db)throw new Error("資料庫尚未設定");
 const ip=req.headers.get("CF-Connecting-IP")||"local";
 if(["register","login","recover"].includes(action)){
 const username=String(b.username||"").trim().toLowerCase();
 if(!/^[a-z0-9_]{3,24}$/.test(username))return response(req,{error:"帳號請用 3–24 個英文字母、數字或底線"},400);
 await limit(db,"ip-auth:"+ip,40,3600000);
 await limit(db,"user-auth:"+username,8,600000);
 if(action==="register"){
 await limit(db,"register:"+ip,10,86400000);
 if(!/^\d{8,12}$/.test(b.pin))return response(req,{error:"請設定 8–12 位數字密碼"},400);
 const name=String(b.name||username).trim().slice(0,20);if(!name)return response(req,{error:"請填入冒險家暱稱"},400);
 const exists=await db.prepare("SELECT id FROM players WHERE username=?").bind(username).first();
 if(exists)return response(req,{error:"這個帳號已經有人使用"},409);
 const id=crypto.randomUUID(),salt=random(16),recovery=random(16),created=Date.now();
 const ph=await pinHash(b.pin,salt),rh=await pinHash(recovery,salt);
 await db.batch([db.prepare("INSERT INTO players (id,username,name,salt,pin_hash,recovery_hash,created_at) VALUES (?,?,?,?,?,?,?)").bind(id,username,name,salt,ph,rh,created),db.prepare("INSERT INTO saves (user_id,state,version,updated_at) VALUES (?,?,0,?)").bind(id,JSON.stringify(newState(name)),created)]);
 const token=await tokenFor(db,id);
 await db.batch([db.prepare("DELETE FROM sessions WHERE expires_at<?").bind(Date.now()),db.prepare("DELETE FROM rate_limits WHERE expires_at<?").bind(Date.now())]);
 return response(req,{user:{id,username,name},token,recovery,state:publicState(newState(name)),version:0});
 }
 const user=await db.prepare("SELECT * FROM players WHERE username=?").bind(username).first();
 const value=String(action==="recover"?b.recovery:b.pin);
 const salt=user?.salt||"00000000000000000000000000000000";
 const hash=await pinHash(value,salt);
 if(!user||!equal(hash,action==="recover"?user.recovery_hash:user.pin_hash))return response(req,{error:"帳號或密碼不正確"},401);
 const token=await tokenFor(db,user.id);const save=await db.prepare("SELECT state,version FROM saves WHERE user_id=?").bind(user.id).first();
 return response(req,{user:{id:user.id,username:user.username,name:user.name},token,state:publicState(JSON.parse(save.state)),version:save.version});
 }
 const user=await authorized(req,db);
 if(action==="logout"){const token=req.headers.get("Authorization")!.slice(7);await db.prepare("DELETE FROM sessions WHERE hash=?").bind(await sha(token)).run();return response(req,{ok:true});}
 if(action==="pin"){
 if(!/^\d{8,12}$/.test(b.pin))return response(req,{error:"請使用 8–12 位數字密碼"},400);
 const salt=random(16),recovery=random(16);
 const ph=await pinHash(b.pin,salt),rh=await pinHash(recovery,salt);
 await db.batch([db.prepare("UPDATE players SET salt=?,pin_hash=?,recovery_hash=? WHERE id=?").bind(salt,ph,rh,user.id),db.prepare("DELETE FROM sessions WHERE user_id=?").bind(user.id)]);
 return response(req,{token:await tokenFor(db,user.id),recovery});
 }
 if(action!=="event")return response(req,{error:"找不到這個功能"},404);
 await limit(db,"events:"+user.id,200,60000);
 const save=await db.prepare("SELECT state,version FROM saves WHERE user_id=?").bind(user.id).first();const state=JSON.parse(save.state);
 if(state.actions.includes(b.id))return response(req,{state:publicState(state),version:save.version,result:{duplicate:true}});
 if(b.version!==save.version)return response(req,{error:"另一個裝置已有新進度，已替你同步",state:publicState(state),version:save.version},409);
 const result:any=applyAction(state,b);
 const changed=await db.prepare("UPDATE saves SET state=?,version=version+1,updated_at=? WHERE user_id=? AND version=?").bind(JSON.stringify(state),Date.now(),user.id,save.version).run();
 if(!changed.meta.changes){const latest=await db.prepare("SELECT state,version FROM saves WHERE user_id=?").bind(user.id).first();return response(req,{error:"另一個裝置已有新進度，已替你同步",state:publicState(JSON.parse(latest.state)),version:latest.version},409);}
 return response(req,{state:publicState(state),version:save.version+1,result:result.run?{started:true}:result});
 }catch(e:any){return response(req,{error:e.status?e.message:e instanceof SyntaxError?"資料格式不正確":e.message?.startsWith("D1")?"雲端暫時無法連線":e.message||"操作失敗"},e.status||400);}
}
