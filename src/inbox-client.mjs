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
export async function exportEnquiries(token){
  if(cloudMode)throw new Error('CSV export is available through the Node.js backend.');

  const response=await fetch('/api/admin/export.csv',{
    method:'GET',
    headers:{
      Authorization:`Bearer ${token}`
    }
  });

  if(!response.ok){
    let message='Unable to export enquiries.';
    try{
      const data=await response.json();
      message=data?.error||message;
    }catch{}
    throw new Error(message);
  }

  const blob=await response.blob();
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');

  link.href=url;
  link.download=`mdk-enquiries-${new Date().toISOString().slice(0,10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}