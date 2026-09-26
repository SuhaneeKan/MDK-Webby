export function scoreAssessment(answers) {
 if (!Array.isArray(answers)||answers.length!==10||answers.some(n=>!Number.isInteger(n)||n<0||n>3)) throw new Error('Answer all ten questions using a score from 0 to 3.');
 const total=answers.reduce((sum,n)=>sum+n,0);
 const level=total<=7?'Foundation':total<=15?'Developing':total<=23?'Controlled':'Mature';
 return {total,percent:Math.round(total/30*100),level,strongest:answers.map((n,i)=>({n,i})).filter(x=>x.n>=2).sort((a,b)=>b.n-a.n).map(x=>x.i),review:answers.map((n,i)=>({n,i})).filter(x=>x.n<2).sort((a,b)=>a.n-b.n).map(x=>x.i)};
}
