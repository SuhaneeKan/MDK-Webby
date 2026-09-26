import {validateEnquiry} from '../src/validate-enquiry.mjs';
const requests=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
 if(process.env.FORMS_ENABLED!=='true'||!process.env.RESEND_API_KEY||!process.env.ENQUIRY_FROM||!process.env.ENQUIRY_TO||!process.env.SITE_URL||!process.env.TWILIO_ACCOUNT_SID||!process.env.TWILIO_AUTH_TOKEN||!process.env.TWILIO_FROM||!process.env.ENQUIRY_SMS_TO)return res.status(503).json({error:'Online enquiries are temporarily unavailable. Please email or call MDK directly.'});
 let origin;try{origin=new URL(process.env.SITE_URL).origin}catch{return res.status(503).json({error:'Enquiries are temporarily unavailable.'})}
 if(req.headers.origin!==origin)return res.status(403).json({error:'Request origin not allowed.'});
 if(!req.headers['content-type']?.includes('application/json'))return res.status(415).json({error:'JSON required.'});
 if(Number(req.headers['content-length']||0)>12000)return res.status(413).json({error:'Request too large.'});
 let data;try{data=typeof req.body==='string'?JSON.parse(req.body):req.body;if(JSON.stringify(data).length>12000)return res.status(413).json({error:'Request too large.'})}catch{return res.status(400).json({error:'Invalid request.'})}
 const error=validateEnquiry(data);if(error)return res.status(400).json({error});
 // Best-effort per-instance throttle. Add a platform-wide firewall limit before launch.
 const now=Date.now();for(const [k,v] of requests)if(v.until<now)requests.delete(k);
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
 const record=requests.get(ip)||{count:0,until:now+600000};if(record.count>=5)return res.status(429).json({error:'Too many requests. Please try again later.'});record.count++;requests.set(ip,record);
 const labels={name:'Name',organization:'Organization',designation:'Designation',email:'Email',phone:'Phone',industry:'Industry',service:'Service',topic:'Topic',date:'Preferred date',time:'Preferred time (IST)',mode:'Mode',message:'Requirement'};
 const text=Object.entries(labels).map(([k,label])=>`${label}: ${data[k]||'Not provided'}`).join('\n\n');
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.ENQUIRY_FROM,to:[process.env.ENQUIRY_TO],reply_to:data.email,subject:'New MDK consultation enquiry',text}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('email delivery');
  // SMS contains only a brief notification. Never send the prospect's message by SMS.
  let smsDelivered=false;
  const {TWILIO_ACCOUNT_SID:sid,TWILIO_AUTH_TOKEN:token,TWILIO_FROM:from,ENQUIRY_SMS_TO:recipients}=process.env;
  if(sid&&token&&from&&recipients){
   const numbers=recipients.split(',').map(n=>n.trim()).filter(Boolean).slice(0,2);
   const message=`New MDK enquiry from ${data.name} (${data.organization}). Check your business email for details.`;
   const results=await Promise.allSettled(numbers.map(async to=>{
    const sms=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(sid+':'+token).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:to,From:from,Body:message}),signal:AbortSignal.timeout(10000)});
    if(!sms.ok)throw new Error('SMS provider rejected notification');
   }));
   smsDelivered=results.length>0&&results.every(r=>r.status==='fulfilled');
   if(!smsDelivered)console.error('MDK SMS notification failed; email was accepted.');
  }
  return res.status(200).json({ok:true,smsDelivered});
 }catch{ return res.status(502).json({error:'Your request could not be sent. Please email or call MDK directly.'}); }
}
