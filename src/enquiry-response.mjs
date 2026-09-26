export async function readEnquiryResponse(response) {
 const body=await response.text();
 let result;
 try { result=body?JSON.parse(body):null; } catch { result=null; }
 if (!response.ok) {
  if (result?.error && typeof result.error==='string') throw new Error(result.error);
  if (response.status===404 || response.status===405) throw new Error('Online enquiries are unavailable on this hosting setup. Please email or call MDK directly.');
  throw new Error('The enquiry service could not process your request. Please email or call MDK directly.');
 }
 if (!result?.ok) throw new Error('The enquiry service returned an incomplete response. Please check with MDK before trying again.');
 return result;
}
