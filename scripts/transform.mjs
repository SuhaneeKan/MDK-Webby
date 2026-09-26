import ts from 'typescript';
export const transform={name:'typescript-in-process',enforce:'pre',transform(code,id){
 if(!/\.[jt]sx?$/.test(id))return null;
 code=code.replaceAll('process.env.NODE_ENV',JSON.stringify('production'));
 if(id.includes('node_modules'))return {code,map:null};
 return {code:ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText,map:null};
}};
