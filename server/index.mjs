import {existsSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createAppServer} from './app.mjs';

if(existsSync('.env.local'))process.loadEnvFile('.env.local');

const databasePath=resolve(process.env.MDK_DB_PATH||'data/mdk-enquiries.sqlite');
mkdirSync(dirname(databasePath),{recursive:true});

const port=Number(process.env.PORT||8787);
const host=process.env.HOST||'0.0.0.0';

const app=createAppServer({databasePath});

app.server.listen(port,host,()=>console.log(`MDK Node.js backend ready at http://${host}:${port} (SQLite: ${databasePath})`));

for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{app.close();process.exit(0)});