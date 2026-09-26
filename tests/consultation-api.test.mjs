import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/consultation.js';

test('a valid enquiry sends full email and two SMS notifications',async()=>{
 const saved={...process.env}, oldFetch=globalThis.fetch;
 Object.assign(process.env,{FORMS_ENABLED:'true',SITE_URL:'https://mdk.example',RESEND_API_KEY:'test',ENQUIRY_FROM:'MDK <notice@mdk.example>',ENQUIRY_TO:'Megha.QMS.Consultant@gmail.com',TWILIO_ACCOUNT_SID:'ACtest',TWILIO_AUTH_TOKEN:'test',TWILIO_FROM:'+12345678900',ENQUIRY_SMS_TO:'+919867372402,+919892608402'});
 const calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({id:'accepted'}),{status:201,headers:{'content-type':'application/json'}})};
 const req={method:'POST',headers:{origin:'https://mdk.example','content-type':'application/json','x-forwarded-for':'test-unique-120'},body:{name:'Test Person',organization:'Test Company',designation:'Quality Director',email:'quality@example.org',phone:'+919000000000',industry:'Pharmaceutical',service:'Quality Management Systems',topic:'Audit',date:'',time:'',mode:'Online',message:'Please review our QMS approach.',consent:'yes',started:Date.now()-5000},socket:{remoteAddress:'127.0.0.1'}};
 let status=200,body;const res={setHeader(){},status(code){status=code;return this},json(value){body=value;return this}};
 try{await handler(req,res);assert.equal(status,200);assert.equal(body.ok,true);assert.equal(body.smsDelivered,true);assert.equal(calls.length,3);const email=JSON.parse(calls[0].options.body);assert.match(email.text,/Please review our QMS approach/);assert.match(email.text,/Quality Director/);assert.deepEqual(calls.slice(1).map(c=>new URLSearchParams(c.options.body).get('To')),['+919867372402','+919892608402']);assert.ok(calls.slice(1).every(c=>!new URLSearchParams(c.options.body).get('Body').includes('review our QMS')))}finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved)}
});
