import {build,loadEnv} from 'vite';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {transform} from './transform.mjs';
const temporary=resolve('node_modules/.cache/mdk-ssr');
await build({configFile:false,resolve:{preserveSymlinks:true},plugins:[transform],esbuild:false,build:{ssr:'src/entry-server.tsx',outDir:temporary,emptyOutDir:true,minify:false,target:'esnext'}});
const {render,routes,services,business}=await import(pathToFileURL(resolve(temporary,'entry-server.js')).href+'?v='+Date.now());
const template=await readFile('dist/index.html','utf8');
const env={...loadEnv('production',process.cwd(),''),...process.env};
let origin=env.SITE_URL||'';
if(origin){const u=new URL(origin);if(u.protocol!=='https:')throw new Error('SITE_URL must be an https URL');origin=u.origin;}
const info={
 '/':['MDK | Quality Management System Consulting','Practical QMS consulting, audit readiness, supplier quality and team development with Megha Kandalkar. Compliance Simplified. Quality Amplified.'],
 '/about':['About Megha Kandalkar | MDK','Explore Megha Kandalkar’s professional journey and 33+ years of Pharma and FMCG quality experience.'],
 '/services':['QMS Consulting Services | MDK','Explore regulatory compliance, data integrity, documentation, audit readiness, CAPA, supplier quality and QMS support.'],
 '/industries':['Industry Experience | MDK','Quality experience and training topics across Pharma, FMCG, API, chemicals, packaging, food and fiber/nonwoven.'],
 '/roadmap':['Interactive QMS Roadmap | MDK','Explore an illustrative quality improvement journey, quality-system comparison and educational risk matrix.'],
 '/training':['Quality Management Training | MDK','Explore staff learning topics including GMP, GDP, data integrity, investigation and CAPA, change control and internal auditing.'],
 '/testimonials':['Professional Feedback | Megha Kandalkar','Read selected, permission-supported professional feedback about Megha Kandalkar’s auditing and quality work.'],
 '/assessment':['Quality Maturity Self-Assessment | MDK','Explore your quality practices with ten questions and a transparent educational maturity snapshot. No email required.'],
 '/insights':['Quality Insights | MDK','Planned insights on CAPA, documentation, auditing and supplier quality. Knowledge centre in development.'],
 '/contact':['Book a Consultation | MDK','Discuss your quality priorities, training needs or audit readiness with MDK.'],
 '/admin':['Private Enquiry Inbox | MDK','Authorized administrator sign-in for MDK enquiries.'],
 '/privacy':['Privacy Notice | MDK','How this preview handles assessment answers, theme preference and enquiry form information. Draft for owner review.'],
 '/terms':['Website Terms | MDK','Draft website terms, consulting-information boundaries and external-link information.'],
 '/disclaimer':['Website Disclaimer | MDK','Limitations of website information, illustrative tools, professional feedback and training descriptions.'],
 '/404':['Page Not Found | MDK','The requested page could not be found. Return to MDK Quality Management System Consulting.'],
};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const path of routes){
 const svc=services.find(s=>path==='/services/'+s.slug);
 const [title,description]=svc?[svc.title+' | MDK Quality Consulting',svc.short+' Explore challenges, support, approach and related training.']:info[path];
 let page=template.replace('<!--app-html-->',render(path)).replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description" content="[^"]*"\s*\/>/,`<meta name="description" content="${escape(description)}"/>`);
 const canonical=origin+path;
 const meta=`<meta property="og:type" content="website"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:site_name" content="${escape(business.name)}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${escape(title)}"/><meta name="twitter:description" content="${escape(description)}"/>`+(origin?`<link rel="canonical" href="${canonical}"/><meta property="og:url" content="${canonical}"/><meta property="og:image" content="${origin}/social-card.png"/><meta name="twitter:image" content="${origin}/social-card.png"/>`:'<meta name="robots" content="noindex,nofollow"/>')+(path==='/404'||path==='/admin'?'<meta name="robots" content="noindex,nofollow"/>':'');
 const schema={ '@context':'https://schema.org','@type':'Organization',name:business.name,founder:{'@type':'Person',name:business.founder,sameAs:business.linkedin},...(origin?{url:origin}:{}),description:'Quality management system consulting and staff capability building.'};
 page=page.replace('</head>',meta+(path==='/'?`<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`:'')+'</head>');
 const dir=path==='/'?'dist':`dist${path}`;await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',page);
 if(path==='/404')await writeFile('dist/404.html',page);
}
await writeFile('dist/robots.txt',origin?`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin?routes.filter(p=>!['/404','/admin'].includes(p)).map(p=>`<url><loc>${origin}${p}</loc></url>`).join(''):''}</urlset>`);
await rm(temporary,{recursive:true,force:true});
console.log(`Pre-rendered ${routes.length} pages. ${origin?'Canonical origin: '+origin:'Preview is noindex until SITE_URL is configured.'}`);
