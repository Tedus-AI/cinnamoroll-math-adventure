import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {readFile} from 'node:fs/promises';
import {bundlePath} from './bundle.mjs';
export async function localRuntime(pin,port=0){
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:bundlePath,compatibilityDate:'2026-10-12',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ADMIN_PIN:pin},host:'127.0.0.1',port}));
 await mf.ready;
 const db=await mf.getD1Database('DB');
 const sql=await readFile(new URL('./migrations/0001_initial.sql',import.meta.url),'utf8');
 await db.batch(sql.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 return {mf,db};
}
