import ts from 'typescript';
import {build} from 'vite';
import {minify} from 'terser';
import {transform} from './transform.mjs';
// An in-process TypeScript transform also supports restricted desktop environments.
// Development uses Vite's standard React plugin and fast refresh.
const config=ts.readConfigFile('tsconfig.json',ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,'.');
const program=ts.createProgram(parsed.fileNames,parsed.options);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>process.cwd(),getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));process.exit(1)}
const compact={name:'compact-production-js',renderChunk:async code=>{const result=await minify(code,{module:true,compress:true,mangle:true,format:{comments:false}});return {code:result.code,map:null}}};
await build({configFile:false,resolve:{preserveSymlinks:true},plugins:[transform,compact],esbuild:false,build:{target:'esnext',minify:false,cssMinify:false}});
if(!process.argv.includes('--preview-slice'))await import('./prerender.mjs');

