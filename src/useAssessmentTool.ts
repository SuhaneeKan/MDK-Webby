import {useEffect} from 'react';
import {scoreAssessment} from './assessment.mjs';
type ModelContext={registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown};
export function useAssessmentTool(setAnswers:(n:number[])=>void,setDone:(done:boolean)=>void){
 useEffect(()=>{
  const context=(document as Document&{modelContext?:ModelContext}).modelContext;
  if(!context?.registerTool)return;
  const life=new AbortController();
  try{Promise.resolve(context.registerTool({name:'complete_quality_self_assessment',title:'Complete quality self-assessment',description:'Set ten self-reported answers and show the educational quality maturity result on this page. Does not send any enquiry or personal data.',inputSchema:{type:'object',properties:{answers:{type:'array',items:{type:'integer',minimum:0,maximum:3},minItems:10,maxItems:10}},required:['answers'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{const a=(input as {answers?:unknown})?.answers;const result=scoreAssessment(a);setAnswers(a as number[]);setDone(true);await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));return {total:result.total,outOf:30,level:result.level,educationalOnly:true}}},{signal:life.signal})).catch(()=>{})}catch{}
  return()=>life.abort();
 },[setAnswers,setDone]);
}
