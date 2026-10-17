import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localRuntime} from './local-runtime.mjs';
if(!/^\d{4}$/.test(process.env.LOCAL_ADMIN_PIN||''))throw new Error('Set LOCAL_ADMIN_PIN to the intended four-digit administrator PIN before starting preview.');
const {mf}=await localRuntime(process.env.LOCAL_ADMIN_PIN,8787);
const root=fileURLToPath(new URL('../public/game/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:5173');
  if(url.pathname==='/config.js'){res.setHeader('Content-Type',mime['.js']);res.end('export const API_BASE="http://127.0.0.1:8787/api/game";');return;}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  if(!(await stat(file)).isFile())throw new Error('not file');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(5173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:5173/'));
const stop=async()=>{server.close();await mf.dispose();process.exit();};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
