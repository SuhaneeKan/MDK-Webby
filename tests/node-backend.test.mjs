import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppServer} from '../server/app.mjs';

test('Node backend stores a full enquiry and restricts the admin inbox',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mdk-node-'));const sent=[];
 const config={ADMIN_EMAIL:'admin@mdk.example',ADMIN_PASSWORD:'strong-test-password',RESEND_API_KEY:'test',ENQUIRY_FROM:'notice@mdk.example',ENQUIRY_TO:'Megha.QMS.Consultant@gmail.com',TWILIO_ACCOUNT_SID:'ACtest',TWILIO_AUTH_TOKEN:'test',TWILIO_FROM:'+12345678900',ENQUIRY_SMS_TO:'+919867372402,+919892608402'};
 const app=createAppServer({databasePath:join(dir,'inbox.sqlite'),config,fetchImpl:async(url,opts)=>{sent.push({url,opts});return new Response('{}',{status:201})}});
 try{
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${app.server.address().port}`;
 const data={name:'Test Applicant',organization:'Sample Manufacturer',designation:'Quality Head',email:'test@example.org',phone:'+919000000000',industry:'Pharmaceutical',service:'Audit Readiness',topic:'Supplier audit',date:'',time:'',mode:'Online',message:'We would like support with supplier audits.',consent:'yes',started:Date.now()-5000};
 const response=await fetch(`${origin}/api/consultation`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});assert.equal(response.status,201);assert.deepEqual(await response.json(),{ok:true,stored:true,emailAccepted:true,smsAccepted:true});assert.equal(sent.length,3);assert.match(JSON.parse(sent[0].opts.body).text,/supplier audits/);
 const before=await fetch(`${origin}/api/admin/enquiries`);assert.equal(before.status,401);
 const bad=await fetch(`${origin}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:config.ADMIN_EMAIL,password:'wrong'})});assert.equal(bad.status,401);
 const login=await fetch(`${origin}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:config.ADMIN_EMAIL,password:config.ADMIN_PASSWORD})});assert.equal(login.status,200);const {access_token:token}=await login.json();
 const inbox=await fetch(`${origin}/api/admin/enquiries`,{headers:{Authorization:`Bearer ${token}`}});const rows=await inbox.json();assert.equal(rows.length,1);assert.equal(rows[0].message,data.message);assert.equal(rows[0].phone,data.phone);
 const health=await(await fetch(`${origin}/api/health`)).json();assert.equal(health.storage,'sqlite');
 }finally{app.close();await rm(dir,{recursive:true,force:true})}
});
