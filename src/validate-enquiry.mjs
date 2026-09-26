export function validateEnquiry(data,now=Date.now()) {
 if(!data||typeof data!=='object'||Array.isArray(data))return 'Invalid request.';
 if(data.website)return 'Unable to accept this request.';
 if(data.consent!=='yes')return 'Consent is required.';
 const fields={name:100,organization:160,designation:100,email:254,phone:30,industry:100,service:150,topic:250,date:10,time:5,mode:20,message:3000};
 for(const [name,max] of Object.entries(fields)){if(data[name]!==undefined&&(typeof data[name]!=='string'||data[name].length>max))return 'Invalid '+name+'.';}
 for(const field of ['name','organization','email','industry','service','message'])if(!data[field]?.trim())return 'Please complete '+field+'.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return 'Please enter a valid email address.';
 if(data.message.trim().length<10)return 'Please provide at least 10 characters about your requirement.';
 if(data.mode&&!['Online','In-person'].includes(data.mode))return 'Invalid consultation mode.';
 if(data.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||Number.isNaN(Date.parse(data.date))||data.date<new Date(now).toISOString().slice(0,10)))return 'Please choose a current or future date.';
 if(data.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))return 'Invalid preferred time.';
 if(!Number.isFinite(data.started)||now-data.started<2500||now-data.started>86400000)return 'Please reopen the form and try again.';
 return null;
}
