import * as cloud from './enquiry-store.mjs';
const cloudMode=cloud.inboxConfigured;
export const inboxConfigured=true;
export const storageMode=cloudMode?'supabase':'node';
async function decode(response){const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=null}if(!response.ok||!data)throw new Error(data?.error||'The Node.js backend is not running. Start npm run dev:full, or deploy to a Node.js host.');return data}
export async function saveEnquiry(data){if(cloudMode)return cloud.saveEnquiry(data);const response=await fetch('/api/consultation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return decode(response)}
export async function signInAdmin(email,password){if(cloudMode)return cloud.signInAdmin(email,password);return decode(await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})}))}
export async function refreshAdmin(refresh_token){if(cloudMode)return cloud.refreshAdmin(refresh_token);return decode(await fetch('/api/admin/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token})}))}
export async function listEnquiries(token){if(cloudMode)return cloud.listEnquiries(token);return decode(await fetch('/api/admin/enquiries',{headers:{Authorization:`Bearer ${token}`}}))}
export async function signOutAdmin(token){if(cloudMode)return;await fetch('/api/admin/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{})}
