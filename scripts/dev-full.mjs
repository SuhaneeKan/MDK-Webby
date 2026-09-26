import {spawn} from 'node:child_process';
const children=[spawn(process.execPath,['server/index.mjs'],{stdio:'inherit'}),spawn('npm',['run','dev'],{stdio:'inherit',shell:process.platform==='win32'})];
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{for(const child of children)child.kill();process.exit(0)});
for(const child of children)child.on('exit',code=>{if(code&&code!==0){for(const other of children)if(other!==child)other.kill();process.exit(code)}});
