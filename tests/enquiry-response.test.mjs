import test from 'node:test';
import assert from 'node:assert/strict';
import {readEnquiryResponse} from '../src/enquiry-response.mjs';
test('empty and non-JSON API responses give a usable error',async()=>{
 await assert.rejects(readEnquiryResponse(new Response('',{status:404})),/hosting setup/);
 await assert.rejects(readEnquiryResponse(new Response('<html>unavailable</html>',{status:502})),/could not process/);
 await assert.rejects(readEnquiryResponse(new Response('',{status:200})),/incomplete response/);
});
test('only a confirmed API acceptance yields success',async()=>{
 assert.equal((await readEnquiryResponse(new Response(JSON.stringify({ok:true,smsDelivered:false}),{status:200}))).smsDelivered,false);
 await assert.rejects(readEnquiryResponse(new Response(JSON.stringify({error:'Delivery not configured'}),{status:503})),/Delivery not configured/);
});
