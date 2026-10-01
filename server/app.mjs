import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,randomUUID,createHash,timingSafeEqual,scryptSync} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {validateEnquiry} from '../src/validate-enquiry.mjs';
import nodemailer from 'nodemailer';

const fields=['name','organization','designation','email','phone','industry','service','topic','date','time','mode','message'];

const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.woff2':'font/woff2',
  '.xml':'application/xml; charset=utf-8',
  '.txt':'text/plain; charset=utf-8'
};

const sha=v=>createHash('sha256').update(v).digest('hex');

const csvEscape=v=>{
  const s=String(v??'');
  return /[",\r\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
};

function json(res,status,value,headers={}){
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    ...headers
  });
  res.end(JSON.stringify(value));
}

async function body(req){
  let chunks='',size=0;

  for await(const chunk of req){
    size+=chunk.length;

    if(size>12000){
      throw new Error('Request too large.');
    }

    chunks+=chunk;
  }

  try{
    return JSON.parse(chunks);
  }catch{
    throw new Error('Invalid JSON.');
  }
}

function corsHeaders(origin,allowed){
  if(!origin||!allowed)return {};

  return {
    'Access-Control-Allow-Origin':origin,
    'Vary':'Origin',
    'Access-Control-Allow-Headers':'Content-Type, Authorization',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS'
  };
}

export function createAppServer({
  databasePath=resolve('data/mdk-enquiries.sqlite'),
  config=process.env,
  staticRoot=resolve('dist'),
  fetchImpl=fetch
}={}){

  /*
   * USE SUPABASE WHEN BOTH VARIABLES EXIST.
   * OTHERWISE FALL BACK TO LOCAL SQLITE.
   */
  const useSupabase=Boolean(
    config.SUPABASE_URL &&
    config.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabaseUrl=String(config.SUPABASE_URL||'').replace(/\/$/,'');
  const supabaseKey=String(config.SUPABASE_SERVICE_ROLE_KEY||'');

  let db=null;
  let insert=null;
  let list=null;
  let validSession=null;
  let addSession=null;
  let removeSession=null;

  /*
   * LOCAL SQLITE FALLBACK
   */
  if(!useSupabase){

    db=new DatabaseSync(databasePath);

    db.exec(
      'PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;'
    );

    db.exec(`
      CREATE TABLE IF NOT EXISTS enquiries(
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        name TEXT NOT NULL,
        organization TEXT NOT NULL,
        designation TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        industry TEXT NOT NULL,
        service TEXT NOT NULL,
        topic TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        mode TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL,
        consent_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new'
      );

      CREATE TABLE IF NOT EXISTS sessions(
        token_hash TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );
    `);

    insert=db.prepare(`
      INSERT INTO enquiries(
        id,
        created_at,
        updated_at,
        ${fields.join(',')},
        consent_at,
        status
      )
      VALUES (${Array(fields.length+5).fill('?').join(',')})
    `);

    list=db.prepare(
      'SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 200'
    );

    validSession=db.prepare(
      'SELECT expires_at FROM sessions WHERE token_hash=?'
    );

    addSession=db.prepare(
      'INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)'
    );

    removeSession=db.prepare(
      'DELETE FROM sessions WHERE token_hash=?'
    );
  }

  const failures=new Map();

  const adminEmail=String(
    config.ADMIN_EMAIL||''
  ).toLowerCase().trim();

  const adminPassword=String(
    config.ADMIN_PASSWORD||''
  );

  const salt=randomBytes(32);

  const passwordHash=adminPassword
    ? scryptSync(adminPassword,salt,64)
    : null;

  function throttle(key,limit,windowMs){

    const now=Date.now();
    const item=failures.get(key);

    const next=!item||item.until<now
      ? {
          count:1,
          until:now+windowMs
        }
      : {
          count:item.count+1,
          until:item.until
        };

    failures.set(key,next);

    if(failures.size>10000){
      for(const [k,v] of failures){
        if(v.until<now){
          failures.delete(k);
        }
      }
    }

    return next.count>limit;
  }

  /*
   * SUPABASE REQUEST HELPER
   */
  async function supabaseRequest(path,options={}){

    if(!useSupabase){
      throw new Error('Cloud database is not configured.');
    }

    const response=await fetchImpl(
      `${supabaseUrl}/rest/v1/${path}`,
      {
        ...options,

        headers:{
          apikey:supabaseKey,
          Authorization:`Bearer ${supabaseKey}`,
          'Content-Type':'application/json',
          ...(options.headers||{})
        },

        signal:
          options.signal ||
          AbortSignal.timeout(12000)
      }
    );

    if(!response.ok){

      const detail=await response.text().catch(()=> '');

      throw new Error(
        `Database request failed (${response.status}).${
          detail
            ? ` ${detail.slice(0,300)}`
            : ''
        }`
      );
    }

    return response;
  }

  /*
   * STORE ENQUIRY
   */
  async function storeEnquiry(data){

    const id=randomUUID();

    const createdAt=new Date().toISOString();

    const row={
      id,
      created_at:createdAt,
      updated_at:createdAt,

      ...Object.fromEntries(
        fields.map(
          f=>[
            f,
            String(data[f]||'').trim()
          ]
        )
      ),

      consent_at:createdAt,
      status:'new'
    };

    /*
     * SUPABASE
     */
    if(useSupabase){

      await supabaseRequest(
        'mdk_enquiries',
        {
          method:'POST',

          headers:{
            Prefer:'return=minimal'
          },

          body:JSON.stringify(row)
        }
      );

    }

    /*
     * SQLITE FALLBACK
     */
    else{

      insert.run(
        id,
        createdAt,
        createdAt,
        ...fields.map(
          f=>String(data[f]||'').trim()
        ),
        createdAt,
        'new'
      );

    }

    return row;
  }

  /*
   * FETCH ENQUIRIES
   */
  async function fetchEnquiries({all=false}={}){

    if(!useSupabase){
      return list.all();
    }

    const rows=[];
    const pageSize=all?1000:200;

    for(
      let offset=0;
      ;
      offset+=pageSize
    ){

      const end=offset+pageSize-1;

      const response=await supabaseRequest(
        `mdk_enquiries?select=*&order=created_at.desc&offset=${offset}&limit=${pageSize}`,
        {
          headers:{
            Range:`${offset}-${end}`
          }
        }
      );

      const page=await response.json();

      if(!Array.isArray(page)){
        throw new Error(
          'Unexpected database response.'
        );
      }

      rows.push(...page);

      if(!all || page.length<pageSize){
        break;
      }
    }

    return rows;
  }

  /*
   * OPTIONAL EMAIL/SMS/PUSH NOTIFICATIONS
   */
  async function notifications(data) {
    let emailAccepted = false;
    let smsAccepted = false;
    let pushAccepted = false;

    // EMAIL NOTIFICATION
    // GMAIL SMTP EMAIL NOTIFICATION
    if (
      config.GMAIL_USER &&
      config.GMAIL_APP_PASSWORD &&
      config.ENQUIRY_TO
    ) {
      try {
        const full = fields
          .map(f => `${f}: ${data[f] || 'Not provided'}`)
          .join('\n\n');

        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: config.GMAIL_USER,
            pass: config.GMAIL_APP_PASSWORD
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000
        });

        await transporter.sendMail({
          from: `"MDK Quality Consulting" <${config.GMAIL_USER}>`,
          to: config.ENQUIRY_TO,
          replyTo: data.email,
          subject: 'New MDK consultation enquiry',
          text: full
        });

        emailAccepted = true;
        console.log('Gmail email notification accepted.');
        transporter.close();

      } catch (error) {
        console.error(
          'Gmail email notification failed:',
          error instanceof Error ? error.message : error
        );
      }
    }
    // SMS NOTIFICATION
    if (
      config.TWILIO_ACCOUNT_SID &&
      config.TWILIO_AUTH_TOKEN &&
      config.TWILIO_FROM &&
      config.ENQUIRY_SMS_TO
    ) {
      const numbers =
        config.ENQUIRY_SMS_TO
          .split(',')
          .map(x => x.trim())
          .filter(Boolean)
          .slice(0, 2);

      const message =
        `New MDK enquiry from ${data.name} ` +
        `(${data.organization}). ` +
        `View full details in the MDK admin inbox.`;

      const results = await Promise.allSettled(
        numbers.map(
          async to => {
            const r = await fetchImpl(
              `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.TWILIO_ACCOUNT_SID)}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  Authorization:
                    'Basic ' +
                    Buffer.from(
                      `${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`
                    ).toString('base64'),
                  'Content-Type':
                    'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  To: to,
                  From: config.TWILIO_FROM,
                  Body: message
                }),
                signal:
                  AbortSignal.timeout(10000)
              }
            );

            if (!r.ok) {
              throw new Error('SMS rejected');
            }
          }
        )
      );

      smsAccepted =
        results.length > 0 &&
        results.every(
          x => x.status === 'fulfilled'
        );

      if (!smsAccepted) {
        console.error(
          'One or more SMS notifications were not accepted.'
        );
      }
    }

    // NTFY PUSH NOTIFICATION
    if (config.NTFY_TOPIC) {
      console.log('NTFY notification triggered for enquiry:', data.email);
      try {
        const message =
          `New MDK appointment enquiry\n\n` +
          `Name: ${data.name || 'Not provided'}\n` +
          `Organization: ${data.organization || 'Not provided'}\n` +
          `Service: ${data.service || 'Not provided'}\n` +
          `Date: ${data.date || 'Not provided'}\n` +
          `Time: ${data.time || 'Not provided'}\n` +
          `Mode: ${data.mode || 'Not provided'}\n` +
          `Phone: ${data.phone || 'Not provided'}\n` +
          `Email: ${data.email || 'Not provided'}`;

        const r = await fetchImpl(
          `https://ntfy.sh/${encodeURIComponent(config.NTFY_TOPIC)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'text/plain; charset=utf-8',
              'Title': 'New MDK Appointment',
              'Priority': 'high',
              'Tags': 'calendar,warning'
            },
            body: message,
            signal: AbortSignal.timeout(10000)
          }
        );

        const responseText = await r.text();

        pushAccepted = r.ok;

        if (!pushAccepted) {
          console.error(
            `Push notification rejected (${r.status}): ${responseText}`
          );
        }
      } catch (error) {
        console.error(
          'Push notification failed:',
          error instanceof Error
            ? error.message
            : error
        );
      }
    }

    return {
      emailAccepted,
      smsAccepted,
      pushAccepted
    };
  }

  /*
   * ADMIN SESSION STORAGE ----------------------------------------
   */
  const validSessions=new Map();

  function sessionValid(token){

    if(
      !token ||
      !/^[\da-f]{64}$/.test(token)
    ){
      return false;
    }

    return Boolean(
      validSessions.get(
        sha(token)
      )?.expires_at>Date.now()
    );
  }

  function authorized(req){

    const token=
      /^Bearer ([\da-f]{64})$/
        .exec(
          req.headers.authorization||''
        )?.[1];

    return sessionValid(token);
  }

  /*
   * HTTP SERVER
   */
  const server=createServer(
    async(req,res)=>{

      try{

        const path=
          new URL(
            req.url||'/',
            `http://${req.headers.host||'localhost'}`
          ).pathname;

        const origin=req.headers.origin;

        const sameOrigin=
          origin
            ? new URL(origin).host===req.headers.host
            : true;

        const configuredOrigins=[
          config.SITE_URL,
          config.DEV_ORIGIN
        ]
          .filter(Boolean)
          .map(String);

        const allowedOrigin=
          origin &&
          (
            sameOrigin ||
            configuredOrigins.includes(origin)
          );

        const cors=
          corsHeaders(
            origin,
            allowedOrigin
          );

        /*
         * API ROUTES
         */
        if(path.startsWith('/api/')){

          if(req.method==='OPTIONS'){
            return json(
              res,
              204,
              null,
              cors
            );
          }

          if(
            origin &&
            !allowedOrigin
          ){
            return json(
              res,
              403,
              {
                error:
                  'Origin not allowed.'
              }
            );
          }

          /*
           * HEALTH CHECK
           */
          if(
            path==='/api/health' &&
            req.method==='GET'
          ){

            return json(
              res,
              200,
              {
                ok:true,

                storage:
                  useSupabase
                    ? 'supabase'
                    : 'sqlite',

                emailConfigured: !!(
                  config.GMAIL_USER &&
                  config.GMAIL_APP_PASSWORD &&
                  config.ENQUIRY_TO
                ),

                smsConfigured:
                  !!(
                    config.TWILIO_ACCOUNT_SID &&
                    config.TWILIO_AUTH_TOKEN &&
                    config.TWILIO_FROM &&
                    config.ENQUIRY_SMS_TO
                  )
              },
              cors
            );
          }

          if(
            req.method==='POST' &&
            !req.headers[
              'content-type'
            ]?.includes(
              'application/json'
            )
          ){

            return json(
              res,
              415,
              {
                error:
                  'JSON required.'
              },
              cors
            );
          }

          const ip=
            req.headers[
              'x-forwarded-for'
            ]
              ?.split(',')[0]
              ?.trim() ||
            req.socket.remoteAddress ||
            'unknown';

          /*
           * FORM SUBMISSION
           */
          if(
            path==='/api/consultation' &&
            req.method==='POST'
          ){

            if(
              throttle(
                'form:'+ip,
                7,
                600000
              )
            ){

              return json(
                res,
                429,
                {
                  error:
                    'Too many requests. Please try later.'
                },
                cors
              );
            }

            const data=await body(req);

            const error=
              validateEnquiry(data);

            if(error){

              return json(
                res,
                400,
                {error},
                cors
              );
            }

            const row=
              await storeEnquiry(data);

            const sent=
              await notifications(data);

            return json(
              res,
              201,
              {
                ok:true,
                stored:true,
                id:row.id,
                ...sent
              },
              cors
            );
          }

          /*
           * ADMIN LOGIN
           */
          if(
            path==='/api/admin/login' &&
            req.method==='POST'
          ){

            if(
              throttle(
                'login:'+ip,
                5,
                900000
              )
            ){

              return json(
                res,
                429,
                {
                  error:
                    'Too many sign-in attempts. Try again later.'
                },
                cors
              );
            }

            const data=
              await body(req);

            const proposed=
              typeof data.password==='string'
                ? data.password
                : '';

            const candidate=
              scryptSync(
                proposed.slice(0,512),
                salt,
                64
              );

            const match=
              Boolean(
                passwordHash &&
                timingSafeEqual(
                  candidate,
                  passwordHash
                )
              );

            if(
              !adminEmail ||
              !match ||
              String(
                data.email||''
              )
                .toLowerCase()
                .trim()!==adminEmail
            ){

              return json(
                res,
                401,
                {
                  error:
                    'Invalid sign-in details.'
                },
                cors
              );
            }

            const token=
              randomBytes(32)
                .toString('hex');

            validSessions.set(
              sha(token),
              {
                expires_at:
                  Date.now()+
                  12*3600000
              }
            );

            if(!useSupabase){

              addSession.run(
                sha(token),
                Date.now()+
                12*3600000
              );
            }

            return json(
              res,
              200,
              {
                access_token:token,
                refresh_token:token
              },
              cors
            );
          }

          /*
           * ADMIN REFRESH
           */
          if(
            path==='/api/admin/refresh' &&
            req.method==='POST'
          ){

            const data=
              await body(req);

            const token=
              String(
                data.refresh_token||''
              );

            if(!sessionValid(token)){

              return json(
                res,
                401,
                {
                  error:
                    'Session expired.'
                },
                cors
              );
            }

            return json(
              res,
              200,
              {
                access_token:token,
                refresh_token:token
              },
              cors
            );
          }

          /*
           * ADMIN ENQUIRIES
           */
          if(
            path==='/api/admin/enquiries' &&
            req.method==='GET'
          ){

            if(!authorized(req)){

              return json(
                res,
                401,
                {
                  error:
                    'Sign in to view enquiries.'
                },
                cors
              );
            }

            return json(
              res,
              200,
              await fetchEnquiries(),
              cors
            );
          }

          /*
           * CSV EXPORT
           */
          if(
            path==='/api/admin/export.csv' &&
            req.method==='GET'
          ){

            if(!authorized(req)){

              return json(
                res,
                401,
                {
                  error:
                    'Sign in to export enquiries.'
                },
                cors
              );
            }

            const rows=
              await fetchEnquiries({
                all:true
              });

            const columns=[
              'id',
              'created_at',
              'updated_at',
              ...fields,
              'consent_at',
              'status'
            ];

            const csv=
              '\ufeff'+
              [
                columns
                  .map(csvEscape)
                  .join(','),

                ...rows.map(
                  row=>
                    columns
                      .map(
                        c=>csvEscape(row[c])
                      )
                      .join(',')
                )
              ].join('\r\n')+
              '\r\n';

            res.writeHead(
              200,
              {
                ...cors,

                'Content-Type':
                  'text/csv; charset=utf-8',

                'Content-Disposition':
                  `attachment; filename="mdk-enquiries-${new Date().toISOString().slice(0,10)}.csv"`,

                'Cache-Control':
                  'no-store',

                'X-Content-Type-Options':
                  'nosniff'
              }
            );

            return res.end(csv);
          }

          /*
           * ADMIN LOGOUT
           */
          if(
            path==='/api/admin/logout' &&
            req.method==='POST'
          ){

            const token=
              /^Bearer ([\da-f]{64})$/
                .exec(
                  req.headers.authorization||''
                )?.[1];

            if(token){
              validSessions.delete(
                sha(token)
              );

              if(!useSupabase){
                removeSession.run(
                  sha(token)
                );
              }
            }

            return json(
              res,
              200,
              {ok:true},
              cors
            );
          }

          return json(
            res,
            404,
            {
              error:
                'API route not found.'
            },
            cors
          );
        }

        /*
         * STATIC FRONTEND
         */
        if(
          req.method!=='GET' &&
          req.method!=='HEAD'
        ){

          res.writeHead(405);
          return res.end();
        }

        const relative=
          decodeURIComponent(path)
            .replace(/^\/+/,'/');

        if(
          relative
            .split('/')
            .includes('..')
        ){

          res.writeHead(400);
          return res.end();
        }

        const requested=
          join(
            staticRoot,
            relative
          );

        const target=
          (
            await stat(requested)
              .catch(()=>null)
          )?.isDirectory()
            ? join(
                requested,
                'index.html'
              )
            : requested;

        const file=
          await readFile(target)
            .catch(()=>null);

        if(!file){

          res.writeHead(
            404,
            {
              'Content-Type':
                'text/plain'
            }
          );

          return res.end(
            'Not found'
          );
        }

        res.writeHead(
          200,
          {
            'Content-Type':
              mime[
                extname(target)
              ] ||
              'application/octet-stream',

            'X-Content-Type-Options':
              'nosniff'
          }
        );

        res.end(
          req.method==='HEAD'
            ? undefined
            : file
        );

      }catch(e){

        const known=[
          'Request too large.',
          'Invalid JSON.'
        ].includes(e.message);

        json(
          res,
          known?400:500,
          {
            error:
              known
                ? e.message
                : 'Unable to complete request.'
          }
        );

        if(!known){
          console.error(
            'MDK server request failed:',
            e
          );
        }
      }
    }
  );

  return {
    server,

    close:()=>{
      server.closeAllConnections();
      server.close();
      db?.close();
    }
  };
}