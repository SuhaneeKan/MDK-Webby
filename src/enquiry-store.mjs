// Only the public Supabase publishable key belongs in this browser module.
const url=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'';
export const inboxConfigured=Boolean(url&&key);
const headers=(token)=>({'apikey':key,...(token?{'Authorization':`Bearer ${token}`}:{ }),'Content-Type':'application/json'});
async function decode(response){const body=await response.text();let data;try{data=body?JSON.parse(body):null}catch{data=null}if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||'The enquiry database could not complete the request.');return data}
export async function saveEnquiry(data){
 if(!inboxConfigured)throw new Error('The enquiry inbox has not been connected. Please email or call MDK directly.');
 const allowed=['name','organization','designation','email','phone','industry','service','topic','date','time','mode','message'];
 const values=Object.fromEntries(allowed.map(k=>[k,String(data[k]||'').trim()]));
 const response=await fetch(`${url}/rest/v1/mdk_enquiries`,{method:'POST',headers:{...headers(),'Prefer':'return=minimal'},body:JSON.stringify(values)});
 await decode(response);return true;
}
export async function signInAdmin(email,password){
 if(!inboxConfigured)throw new Error('Admin inbox setup is pending.');
 const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})});
 const data=await decode(response);if(!data?.access_token)throw new Error('Unable to sign in.');return data;
}
export async function refreshAdmin(refreshToken){
 const response=await fetch(`${url}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:headers(),body:JSON.stringify({refresh_token:refreshToken})});
 const data=await decode(response);if(!data?.access_token)throw new Error('Session expired. Please sign in again.');return data;
}
export async function listEnquiries(token){
 const response=await fetch(`${url}/rest/v1/mdk_enquiries?select=id,created_at,name,organization,designation,email,phone,industry,service,topic,date,time,mode,message&order=created_at.desc&limit=200`,{headers:headers(token)});
 const data=await decode(response);return Array.isArray(data)?data:[];
}
