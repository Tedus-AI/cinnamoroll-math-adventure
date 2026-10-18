const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const validId=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
export async function createWish(db,user,b,ip,limit){
 const text=(key,max)=>{if(typeof b[key]!=='string'||!b[key].trim()||b[key].trim().length>max)throw fail('請填寫完整的主旨與內容，主旨最多 80 字、內容最多 2000 字');return b[key].trim();};
 if(!validId(b.id)||!['feature','suggestion','bug'].includes(b.category))throw fail('心願格式不正確');
 const title=text('title',80),message=text('message',2000),sender=user?.name||'訪客';
 const context=typeof b.context==='string'?b.context.slice(0,120):'';
 const old=await db.prepare('SELECT user_id,title,message,category FROM wishes WHERE id=?').bind(b.id).first();
 if(old){if(old.user_id!==(user?.id||null)||old.title!==title||old.message!==message||old.category!==b.category)throw fail('此封信已送出，請另寫一封心願',409);return {ok:true,id:b.id,duplicate:true};}
 await limit(db,'wishes:'+ip,10,3600000);
 const result=await db.prepare('INSERT OR IGNORE INTO wishes (id,user_id,sender,category,title,message,context,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(b.id,user?.id||null,sender,b.category,title,message,context,Date.now()).run();
 if(!result.meta.changes){const row=await db.prepare('SELECT user_id,title,message,category FROM wishes WHERE id=?').bind(b.id).first();if(row.user_id!==(user?.id||null)||row.title!==title||row.message!==message||row.category!==b.category)throw fail('此封信已送出，請另寫一封心願',409);}
 return {ok:true,id:b.id};
}
export async function listWishes(db,user,before){
 if(user.role!=='admin')throw fail('只有管理員可以查看心願信箱',403);
 const cursor=before?Number(before):Number.MAX_SAFE_INTEGER;if(!Number.isSafeInteger(cursor)||cursor<1)throw fail('分頁不正確');
 const rows=await db.prepare('SELECT seq,id,sender,category,title,message,context,created_at,status FROM wishes WHERE seq<? ORDER BY seq DESC LIMIT 21').bind(cursor).all();
 const items=rows.results.slice(0,20),count=await db.prepare("SELECT COUNT(*) AS count FROM wishes WHERE status='new'").first();
 return {items,unread:count.count,nextCursor:rows.results.length>20?items.at(-1).seq:null};
}
export async function updateWish(db,user,b){
 if(user.role!=='admin')throw fail('只有管理員可以管理心願信箱',403);
 if(!validId(b.id)||!['new','read','done'].includes(b.status))throw fail('心願狀態不正確');
 const changed=await db.prepare('UPDATE wishes SET status=? WHERE id=?').bind(b.status,b.id).run();
 if(!changed.meta.changes)throw fail('找不到這封心願',404);return {ok:true};
}
