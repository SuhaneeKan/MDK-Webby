import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,timingSafeEqual,scryptSync} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {validateEnquiry} from '../src/validate-enquiry.mjs';
const fields=['name','organization','designation','email','phone','industry','service','topic','date','time','mode','message'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const sha=v=>createHash('sha256').update(v).digest('hex');
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))}
async function body(req){let chunks='',size=0;for await(const chunk of req){size+=chunk.length;if(size>12000)throw new Error('Request too large.');chunks+=chunk}try{return JSON.parse(chunks)}catch{throw new Error('Invalid JSON.')}}
export function createAppServer({databasePath=resolve('data/mdk-enquiries.sqlite'),config=process.env,staticRoot=resolve('dist'),fetchImpl=fetch}={}){
 const db=new DatabaseSync(databasePath);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec(`CREATE TABLE IF NOT EXISTS enquiries(id TEXT PRIMARY KEY,created_at TEXT NOT NULL,name TEXT NOT NULL,organization TEXT NOT NULL,designation TEXT,email TEXT NOT NULL,phone TEXT,industry TEXT NOT NULL,service TEXT NOT NULL,topic TEXT,date TEXT,time TEXT,mode TEXT,message TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);`);
 const insert=db.prepare(`INSERT INTO enquiries(id,created_at,${fields.join(',')}) VALUES (${Array(fields.length+2).fill('?').join(',')})`);
 const list=db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 200');
 const validSession=db.prepare('SELECT expires_at FROM sessions WHERE token_hash=?');
 const addSession=db.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)');
 const removeSession=db.prepare('DELETE FROM sessions WHERE token_hash=?');
 const failures=new Map();
 const adminEmail=String(config.ADMIN_EMAIL||'').toLowerCase().trim();
 const adminPassword=String(config.ADMIN_PASSWORD||'');
 const salt=randomBytes(32);const passwordHash=adminPassword?scryptSync(adminPassword,salt,64):null;
 function throttle(key,limit,windowMs){const now=Date.now();const item=failures.get(key);const next=!item||item.until<now?{count:1,until:now+windowMs}:{count:item.count+1,until:item.until};failures.set(key,next);if(failures.size>10000)for(const [k,v] of failures)if(v.until<now)failures.delete(k);return next.count>limit}
 function authorized(req){const token=/^Bearer ([\da-f]{64})$/.exec(req.headers.authorization||'')?.[1];if(!token)return false;return (validSession.get(sha(token))?.expires_at||0)>Date.now()}
 async function notifications(data){let emailAccepted=false,smsAccepted=false;
  if(config.RESEND_API_KEY&&config.ENQUIRY_FROM&&config.ENQUIRY_TO){try{const full=fields.map(f=>`${f}: ${data[f]||'Not provided'}`).join('\n\n');const r=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:config.ENQUIRY_FROM,to:[config.ENQUIRY_TO],reply_to:data.email,subject:'New MDK consultation enquiry',text:full}),signal:AbortSignal.timeout(12000)});emailAccepted=r.ok}catch{console.error('Email notification was not accepted.')}}
  if(config.TWILIO_ACCOUNT_SID&&config.TWILIO_AUTH_TOKEN&&config.TWILIO_FROM&&config.ENQUIRY_SMS_TO){const numbers=config.ENQUIRY_SMS_TO.split(',').map(x=>x.trim()).filter(Boolean).slice(0,2);const message=`New MDK enquiry from ${data.name} (${data.organization}). View full details in the MDK admin inbox.`;const results=await Promise.allSettled(numbers.map(async to=>{const r=await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.TWILIO_ACCOUNT_SID)}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:to,From:config.TWILIO_FROM,Body:message}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('SMS rejected')}));smsAccepted=results.length>0&&results.every(x=>x.status==='fulfilled');if(!smsAccepted)console.error('One or more SMS notifications were not accepted.')}return {emailAccepted,smsAccepted};
 }
 const server=createServer(async(req,res)=>{try{
  const path=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`).pathname;
  if(path.startsWith('/api/')){
   const origin=req.headers.origin;
   if(origin){const same=new URL(origin).host===req.headers.host;const allowed=origin===config.SITE_URL||origin===config.DEV_ORIGIN;if(!same&&!allowed)return json(res,403,{error:'Origin not allowed.'})}
   if(path==='/api/health'&&req.method==='GET')return json(res,200,{ok:true,storage:'sqlite',emailConfigured:!!(config.RESEND_API_KEY&&config.ENQUIRY_FROM&&config.ENQUIRY_TO),smsConfigured:!!(config.TWILIO_ACCOUNT_SID&&config.TWILIO_AUTH_TOKEN&&config.TWILIO_FROM&&config.ENQUIRY_SMS_TO)});
   if(req.method==='POST'&&!req.headers['content-type']?.includes('application/json'))return json(res,415,{error:'JSON required.'});
   const ip=req.socket.remoteAddress||'unknown';
   if(path==='/api/consultation'&&req.method==='POST'){
    if(throttle('form:'+ip,7,600000))return json(res,429,{error:'Too many requests. Please try later.'});
    const data=await body(req);const error=validateEnquiry(data);if(error)return json(res,400,{error});
    const id=randomBytes(16).toString('hex');insert.run(id,new Date().toISOString(),...fields.map(f=>String(data[f]||'').trim()));
    const sent=await notifications(data);return json(res,201,{ok:true,stored:true,...sent});
   }
   if(path==='/api/admin/login'&&req.method==='POST'){
    if(throttle('login:'+ip,5,900000))return json(res,429,{error:'Too many sign-in attempts. Try again later.'});
    const data=await body(req);const proposed=typeof data.password==='string'?data.password:'';
    const candidate=scryptSync(proposed.slice(0,512),salt,64);const match=Boolean(passwordHash&&timingSafeEqual(candidate,passwordHash));
    if(!adminEmail||!match||String(data.email||'').toLowerCase().trim()!==adminEmail)return json(res,401,{error:'Invalid sign-in details.'});
    const token=randomBytes(32).toString('hex');addSession.run(sha(token),Date.now()+12*3600000);return json(res,200,{access_token:token,refresh_token:token});
   }
   if(path==='/api/admin/refresh'&&req.method==='POST'){const data=await body(req);const token=String(data.refresh_token||'');if(!/^[\da-f]{64}$/.test(token)||(validSession.get(sha(token))?.expires_at||0)<Date.now())return json(res,401,{error:'Session expired.'});return json(res,200,{access_token:token,refresh_token:token})}
   if(path==='/api/admin/enquiries'&&req.method==='GET'){if(!authorized(req))return json(res,401,{error:'Sign in to view enquiries.'});return json(res,200,list.all())}
   if(path==='/api/admin/logout'&&req.method==='POST'){const token=/^Bearer ([\da-f]{64})$/.exec(req.headers.authorization||'')?.[1];if(token)removeSession.run(sha(token));return json(res,200,{ok:true})}
   return json(res,404,{error:'API route not found.'});
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
  const relative=decodeURIComponent(path).replace(/^\/+/, '');if(relative.split('/').includes('..')){res.writeHead(400);return res.end()}
  const requested=join(staticRoot,relative);const target=(await stat(requested).catch(()=>null))?.isDirectory()?join(requested,'index.html'):requested;
  const file=await readFile(target).catch(()=>null);if(!file){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found')}
  res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:file);
 }catch(e){const known=['Request too large.','Invalid JSON.'].includes(e.message);json(res,known?400:500,{error:known?e.message:'Unable to complete request.'});if(!known)console.error('MDK server request failed:',e)}});
 return {server,close:()=>{server.closeAllConnections();server.close();db.close()},db};
}
