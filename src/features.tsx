import {useState,useEffect,useRef,type ReactNode, type FormEvent} from 'react';
import {ArrowUpRight,ArrowRight,ArrowLeft,Check,Plus,X,ChevronDown,Linkedin,CheckCircle2,RotateCcw,ShieldCheck,Network,GraduationCap,ClipboardCheck} from 'lucide-react';
import {business,services,training,industries,timeline,testimonials,roadmap,questions,faqs} from './data';
import type {Service} from './data';
import {scoreAssessment} from './assessment.mjs';
import {readEnquiryResponse} from './enquiry-response.mjs';
import {saveEnquiry,inboxConfigured,storageMode} from './inbox-client.mjs';
import {useAssessmentTool} from './useAssessmentTool';

export function Modal({title,children,onClose}:{title:string,children:ReactNode,onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const d=ref.current;d?.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;d?.close()}},[]);return <dialog ref={ref} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} className="dialog" aria-labelledby="dialog-title"><div className="dialog-inner"><div className="dialog-header"><p className="eyebrow">MDK / EXPLORE</p><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div><h2 id="dialog-title">{title}</h2>{children}</div></dialog>}

export function PageHero({label,title,copy,children}:{label:string,title:string,copy:string,children?:ReactNode}){return <section className="page-hero"><a className="breadcrumb" href="/">Home <ArrowUpRight size={13}/></a><p className="eyebrow">{label}</p><h1>{title}</h1><p>{copy}</p>{children}</section>}

export function CTA({title='Let’s strengthen your quality system.'}:{title?:string}){return <section className="cta-band"><div><p className="eyebrow">A CLEARER NEXT STEP</p><h2>{title}</h2><p>Bring your priorities. Let’s explore the support your team needs.</p></div><a href="/contact" className="button">Book a consultation <ArrowUpRight size={18}/></a></section>}

export function Challenges(){const problems=[['Documentation gaps','Unclear records make decisions harder to substantiate.','documentation'],['Recurring issues','Closing an action may not resolve the underlying cause.','investigation-capa'],['Supplier uncertainty','Inconsistent oversight can leave material risks unseen.','supplier-quality'],['Training gaps','Teams need to understand the reasoning behind the procedure.','capability-building']];const [active,setActive]=useState(0);return <section className="section challenges"><div><p className="eyebrow">THE QUALITY CHALLENGE</p><h2>Quality problems rarely<br/>start at the audit.</h2><p className="section-intro">They begin in everyday decisions, disconnected information and gaps that go unaddressed. A stronger system connects the details.</p><a className="text-link" href="/assessment">Understand your starting point <ArrowUpRight size={18}/></a></div><div className="problem-list">{problems.map(([title,risk,slug],i)=><div key={title} className={i===active?'problem active':'problem'}><button onClick={()=>setActive(i)} aria-expanded={active===i}><span>0{i+1}</span><strong>{title}</strong><Plus size={18}/></button>{active===i&&<div className="problem-detail"><p>{risk}</p><a href={'/services/'+slug}>Explore {services.find(s=>s.slug===slug)?.title}<ArrowUpRight size={15}/></a></div>}</div>)}</div></section>}

export function About({full=false}:{full?:boolean}){return <><section className="section about-section"><div className="expert-panel"><div className="expert-portrait"><img src="/megha-kandalkar-studio-shield.png" alt="Megha Kandalkar holding a silver shield engraved with her name against a blue studio background" loading="lazy" decoding="async"/><a className="original-photo-link" href="/megha-kandalkar-original.jpg" target="_blank" rel="noopener noreferrer">View original source photograph <ArrowUpRight size={15}/></a></div><div className="expert-information"><div className="expert-top"><span>MEGHA KANDALKAR</span><ShieldCheck size={21}/></div><div className="expert-caption"><span>QUALITY MANAGEMENT<br/>SYSTEM CONSULTANT</span><span>33+<small>YEARS IN PHARMA & FMCG</small></span></div></div></div><div className="about-copy"><p className="eyebrow">MEET THE EXPERT BEHIND MDK</p><h2>Experienced leadership.<br/><em>A practical perspective.</em></h2><p>Megha Kandalkar brings more than three decades of professional experience in Pharma and FMCG, spanning supplier quality, manufacturing, commercial quality and supply chain.</p><p>Her work connects quality systems with the people and processes that make them effective. MDK brings that perspective to consulting, auditing, documentation and team development.</p><div className="expertise-tags">{['Supplier quality','Risk assessment','Quality systems','Auditing','Digitization','Team capability'].map(t=><span key={t}>{t}</span>)}</div><div className="credential-strip" aria-label="Professional audit qualifications"><div><span>CQI & IRCA</span><strong>Unique No. 731923</strong></div><div><span>QUALIFIED LEAD AUDITOR FOR:</span><strong>FSSC · Active Pharmaceutical Ingredient (API) · Packaging Material · FNW</strong></div></div><div className="business-identifiers"><span>GSTIN <strong>{business.gstin}</strong></span><a href={'mailto:'+business.email}>{business.email}</a><a href={'tel:+91'+business.phone}>{business.phone}</a><a href={'tel:+91'+business.phoneSecondary}>{business.phoneSecondary}</a></div><a className="text-link" href={full?'#journey':'/about'}>View professional journey <ArrowUpRight size={18}/></a></div></section>{full&&<><section className="section soft-section" id="journey"><p className="eyebrow">PROFESSIONAL EXPERIENCE</p><h2>A career shaped by quality.</h2><p className="section-intro">Career history from the supplied professional profile. These organizations are employers in Megha’s career history, not a list of MDK clients or endorsements.</p><div className="timeline">{timeline.map((t,i)=><details key={t.company} open={i===0}><summary><span className="timeline-dot"/><span className="timeline-date">{t.dates}</span><span><strong>{t.company}</strong><small>{t.role}</small></span><Plus size={18}/></summary><p>{t.detail}</p></details>)}</div></section><section className="section education"><div><p className="eyebrow">EDUCATION</p><h2>A technical foundation.</h2><p className="section-intro">Professional experience grounded in pharmaceutical sciences and packaging.</p></div><div><article><span>1989–1993</span><h3>Bachelor of Pharmacy</h3><p>Principal K. M. Kundnani College of Pharmacy<br/>University of Mumbai · Pharmaceutical Sciences</p></article><article><span>1995</span><h3>Diploma in Packaging Development</h3><p>Indian Institute of Packaging</p></article></div></section></>}</>}

export function Why(){return <section className="section why"><div><p className="eyebrow">WHY MDK</p><h2>Rigour in the detail.<br/>Clarity in the conversation.</h2></div><div className="why-grid">{[['01','Industry perspective','Experience across supplier, manufacturing, commercial and supply-chain quality.'],['02','Evidence-based thinking','Attention to the records and processes behind a finding.'],['03','Practical problem solving','A focus on causes, appropriate actions and meaningful follow-up.'],['04','Capability that stays','Clear explanations that help your team understand quality in practice.']].map(([n,t,p])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{p}</p></article>)}</div></section>}

export function Roadmap({full=false}:{full?:boolean}){const [step,setStep]=useState(0);const r=roadmap[step];return <section className="section roadmap-section" id="roadmap"><div className="section-head"><div><p className="eyebrow">THE QMS ROADMAP</p><h2>Make improvement<br/>a continuous practice.</h2><p className="section-intro">An illustrative quality improvement journey. Select a stage to explore how the pieces connect.</p></div><span className="roadmap-note">How one can Derisk the business</span></div><div className="roadmap-steps" role="group" aria-label="Quality improvement stages">{roadmap.map((r,i)=><button key={r.title} onClick={()=>setStep(i)} aria-pressed={step===i} className={step===i?'active':''}><span>{String(i+1).padStart(2,'0')}</span><strong>{r.title}</strong></button>)}</div><div className="roadmap-detail" aria-live="polite"><div className="roadmap-number">{String(step+1).padStart(2,'0')}<span>/ 11</span></div><div><p className="eyebrow">OBJECTIVE</p><h3>{r.objective}</h3><p>{r.activities}</p></div><div><p className="eyebrow">POTENTIAL OUTPUT</p><h3>{r.output}</h3><button className="text-link" onClick={()=>setStep((step+1)%roadmap.length)}>Next: {roadmap[(step+1)%roadmap.length].title}<ArrowRight size={16}/></button></div></div>{!full&&<a className="text-link" href="/roadmap">Explore the full quality journey <ArrowUpRight size={18}/></a>}</section>}

export function Industries(){const [active,setActive]=useState(0);const item=industries[active];const service=services.find(s=>s.slug===item.service)!;return <section className="section industries-section"><div className="section-head"><div><p className="eyebrow">INDUSTRY PERSPECTIVE</p><h2>Different industries.<br/>A shared commitment to quality.</h2><p className="section-intro">Professional experience and training topics reflected in the supplied material. Engagement scope is shaped around your organization.</p></div></div><div className="industries-layout"><div className="industry-tabs" role="group" aria-label="Choose an industry">{industries.map((it,i)=><button key={it.title} className={active===i?'active':''} onClick={()=>setActive(i)} aria-pressed={active===i}><span>0{i+1}</span>{it.title}<ArrowUpRight size={18}/></button>)}</div><div className="industry-detail" aria-live="polite"><div className="industry-symbol"><Network size={70} strokeWidth={.8}/><span>0{active+1}</span></div><p className="eyebrow">SELECTED INDUSTRY</p><h3>{item.title}</h3><p>{item.challenge}</p><div className="industry-related"><span>RELEVANT SUPPORT</span><a href={'/services/'+service.slug}>{service.title}<ArrowUpRight size={16}/></a><span>RELATED TRAINING</span><p>{service.training}</p></div><a className="text-link" href={'/contact?industry='+encodeURIComponent(item.title)}>Discuss your industry<ArrowUpRight size={17}/></a></div></div></section>}

export function Training({compact=false}:{compact?:boolean}){const [filter,setFilter]=useState('ALL');const categories=['ALL','GMP','AUDITING','DOCUMENTATION','RISK','FOOD SAFETY','QUALITY SYSTEMS'];const visible=training.filter(t=>filter==='ALL'||t.category===filter);return <section className="section training-section"><div className="section-head"><div><p className="eyebrow">TRAINING & CAPABILITY</p><h2>Build quality capability<br/>from within.</h2><p className="section-intro">Focused learning that helps teams understand the “why” behind everyday quality practices. Topics and scope are agreed for your team.</p></div>{compact&&<a className="text-link" href="/training">All training topics <ArrowUpRight size={18}/></a>}</div>{!compact&&<div className="filters" role="group" aria-label="Filter training topics">{categories.map(c=><button key={c} onClick={()=>setFilter(c)} aria-pressed={filter===c} className={filter===c?'active':''}>{c}</button>)}</div>}<div className="training-grid" aria-live="polite">{(compact?visible.slice(0,3):visible).map(t=><article className="training-card" key={t.title}><div className="card-top"><GraduationCap size={27} strokeWidth={1.3}/><span>{t.category}</span></div><h3>{t.title}</h3><p>{t.focus}</p><div className="training-audience"><span>SUITABLE FOR</span><p>{t.audience}</p></div><a className="text-link" href={'/contact?topic='+encodeURIComponent(t.title)}>Enquire about training <ArrowUpRight size={17}/></a></article>)}</div><p className="muted small training-note">Programs develop understanding and capability. No third-party certification or accreditation is implied.</p></section>}

let lastHighlightedReview=0;

export function Testimonials({full=false}:{full?:boolean}){
 const [index,setIndex]=useState(0);
 const [visible,setVisible]=useState(false);
 const [paused,setPaused]=useState(false);
 const section=useRef<HTMLElement>(null);
 const touch=useRef(0);
 const hold=useRef<ReturnType<typeof setTimeout>|null>(null);
 const reduced=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 useEffect(()=>{
  if(!section.current)return;
  const observer=new IntersectionObserver(entries=>{
   if(entries[0].isIntersecting){
    setVisible(true);
    setIndex(i=>{const next=(lastHighlightedReview+1)%testimonials.length;lastHighlightedReview=next;return next===i?(i+1)%testimonials.length:next});
   }else setVisible(false);
  },{threshold:.35});
  observer.observe(section.current);
  return()=>{observer.disconnect();if(hold.current)clearTimeout(hold.current)};
 },[]);
 useEffect(()=>{
  if(!visible||paused||reduced)return;
  const timer=setInterval(()=>setIndex(i=>(i+1)%testimonials.length),7000);
  return()=>clearInterval(timer);
 },[visible,paused,reduced]);
 function choose(next:number){setIndex((next+testimonials.length)%testimonials.length);setPaused(true);if(hold.current)clearTimeout(hold.current);hold.current=setTimeout(()=>setPaused(false),14000)}
 const t=testimonials[index];
 return <section className="section testimonial-section" id="testimonials" ref={section}>
  <div className="testimonial-intro"><p className="eyebrow">PROFESSIONAL VOICES</p><h2>Trusted for practical,<br/>evidence-based thinking.</h2><p>Feedback about Megha’s professional work, shared with recorded permission to showcase her achievements. Affiliations are supplied by respondents.</p><p className="small muted">These are professional references, not a list of MDK consulting clients or organizational endorsements.</p>{!full&&<a href="/testimonials" className="text-link">More professional feedback <ArrowUpRight size={18}/></a>}</div>
  <figure className="feedback-chart"><div className="feedback-chart-scroll"><img src="/professional-feedback-chart.png" alt="Survey chart showing Excellent as the most selected rating in industry knowledge, audit and compliance expertise, professionalism, communication, problem solving, responsiveness and overall experience, with smaller Very Good counts" loading="lazy" decoding="async"/></div><figcaption>Rating chart supplied with the professional review responses. Responses describe Megha’s professional work; this is not an MDK client performance metric.</figcaption></figure>
  <div className="testimonial-stage" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setPaused(false)}}>
   <div className="quote-card" onTouchStart={e=>{touch.current=e.changedTouches[0].clientX}} onTouchEnd={e=>{const d=e.changedTouches[0].clientX-touch.current;if(Math.abs(d)>45)choose(index+(d<0?1:-1))}}>
    <div className="review-content" key={index} aria-live="polite">
     <div className="review-header"><span className="review-initials" aria-hidden="true">{t.initials}</span><div><strong>{t.name}</strong><p>{t.org}</p></div><span className="quote-theme">{t.theme}</span></div>
     <blockquote>“{t.quote}”</blockquote><span className="excerpt">PROFESSIONAL FEEDBACK · SOURCE EXCERPT</span>
    </div>
    <div className="quote-controls"><span>{String(index+1).padStart(2,'0')} / {String(testimonials.length).padStart(2,'0')}</span><div><button className="icon-button" aria-label="Previous testimonial" onClick={()=>choose(index-1)}><ArrowLeft size={18}/></button><button className="icon-button" aria-label="Next testimonial" onClick={()=>choose(index+1)}><ArrowRight size={18}/></button></div></div>
   </div>
   <div className="review-index" aria-label="Choose a professional review">{[-2,-1,0,1,2].map((offset)=>{const n=(index+offset+testimonials.length)%testimonials.length;const review=testimonials[n];return <button key={offset} type="button" className={offset===0?'is-active':''} aria-label={`Show review from ${review.name}`} aria-current={offset===0?'true':undefined} onClick={()=>choose(n)}>{review.name}</button>})}</div>
  </div>
  {full&&<div className="feedback-themes"><h3>What professionals value</h3><p>Qualitative themes from the selected feedback, without numerical ranking.</p><div className="expertise-tags">{['Technical understanding','Practical auditing','Problem solving','CAPA follow-up','Data integrity','Training'].map(t=><span key={t}>{t}</span>)}</div></div>}
 </section>
}

export function AssessmentTeaser(){return <section className="section assessment-teaser"><div className="assessment-graphic" aria-hidden="true"><div className="assessment-ring"><ClipboardCheck size={50} strokeWidth={1}/><span>YOUR QUALITY<br/>MATURITY SNAPSHOT</span></div><span className="assessment-chip">10 questions</span><span className="assessment-chip second">A clearer starting point</span></div><div><p className="eyebrow">KNOW YOUR STARTING POINT</p><h2>How audit-ready is<br/>your quality system?</h2><p className="section-intro">Explore your current practices with a short quality maturity self-assessment. See strengths, identify areas worth reviewing and start a more focused conversation.</p><a className="button" href="/assessment">Take the self-assessment <ArrowUpRight size={18}/></a><p className="small muted">Educational screening only. No email required.</p></div></section>}

const answersText=['Not established','Partially established','Mostly established','Well established'];

export function Assessment(){const [answers,setAnswers]=useState<number[]>(Array(10).fill(-1));const [step,setStep]=useState(0);const [done,setDone]=useState(false);const [reset,setReset]=useState(false);const title=useRef<HTMLHeadingElement>(null);useAssessmentTool(setAnswers,setDone);const q=questions[step];function next(){if(step===9){setDone(true)}else setStep(step+1);setTimeout(()=>title.current?.focus(),0)}const result=done?scoreAssessment(answers):null;function restart(){setAnswers(Array(10).fill(-1));setStep(0);setDone(false);setReset(false)}return <section className="section assessment-section"><div className="assessment-box">{!result?<><div className="assessment-top"><span>QUALITY MATURITY SELF-ASSESSMENT</span><span>{step+1} / 10</span></div><progress value={step+1} max="10" aria-label="Assessment progress"/><p className="eyebrow">{q.area}</p><h2 tabIndex={-1} ref={title}>{q.question}</h2><fieldset className="answer-options"><legend className="sr-only">Choose the answer that best describes your current practice</legend>{answersText.map((a,i)=><label key={a} className={answers[step]===i?'chosen':''}><input type="radio" name={'question-'+step} value={i} checked={answers[step]===i} onChange={()=>setAnswers(answers.map((n,j)=>j===step?i:n))}/><span>{a}</span><small>{i} {i===1?'point':'points'}</small></label>)}</fieldset><div className="assessment-actions"><button className="text-link" disabled={step===0} onClick={()=>setStep(step-1)}><ArrowLeft size={17}/>Previous</button><button className="button" disabled={answers[step]<0} onClick={next}>{step===9?'View my results':'Next question'}<ArrowRight size={17}/></button></div><button className="subtle-button" onClick={()=>setReset(true)}><RotateCcw size={14}/>Reset assessment</button></>:<div className="assessment-result"><p className="eyebrow">QUALITY MATURITY SNAPSHOT</p><h2 ref={title} tabIndex={-1}>{result.level}</h2><div className="result-summary"><div className="result-score"><strong>{result.total}<span>/30</span></strong><small>{result.percent}% of available points</small></div><p>{result.level==='Foundation'?'Start with the essential controls and clarify ownership.':result.level==='Developing'?'Some practices are taking shape. Focus on consistent application and follow-up.':result.level==='Controlled'?'Many practices are established. Review weaker areas and the evidence of effectiveness.':'Your answers describe well-established practices. Keep checking evidence, effectiveness and opportunities to improve.'}</p></div><div className="result-bars">{questions.map((q,i)=><div key={q.area}><span>{q.area}</span><progress max="3" value={answers[i]} aria-label={q.area}/><strong>{answers[i]}/3</strong></div>)}</div><div className="result-columns"><div><h3>Strongest areas</h3>{result.strongest.length?<ul>{result.strongest.slice(0,3).map((i:number)=><li key={i}>{questions[i].area}</li>)}</ul>:<p>No area was rated mostly or well established. This is a starting point for improvement.</p>}</div><div><h3>Areas worth reviewing</h3>{result.review.length?<ul>{result.review.map((i:number)=><li key={i}>{questions[i].area}</li>)}</ul>:<p>No area scored below mostly established. Verify your self-reported practices against evidence.</p>}</div></div><h3>Relevant support to explore</h3><div className="expertise-tags">{Array.from(new Set((result.review.length?result.review:[9]).slice(0,3).map((i:number)=>questions[i].service))).map(slug=><a key={String(slug)} href={'/services/'+slug}>{services.find(s=>s.slug===slug)?.title}<ArrowUpRight size={14}/></a>)}</div><div className="assessment-actions"><button className="text-link" onClick={()=>setReset(true)}><RotateCcw size={17}/>Start again</button><a className="button" href={'/contact?topic='+encodeURIComponent('Quality maturity assessment: '+result.level+' ('+result.total+'/30)')}>Discuss my results<ArrowUpRight size={17}/></a></div></div>}<details className="scoring"><summary>How scoring works<ChevronDown size={16}/></summary><p>Each of the 10 equally weighted questions scores 0–3. Total available: 30 points. Foundation: 0–7; Developing: 8–15; Controlled: 16–23; Mature: 24–30. These illustrative bands are not a validated benchmark. Areas scoring 2–3 appear as strengths; areas scoring 0–1 are highlighted for review. Answers stay in this page’s memory and are cleared when you leave.</p></details><p className="assessment-disclaimer">This self-assessment is an educational screening tool and does not replace a formal audit, regulatory assessment or professional compliance review.</p></div>{reset&&<Modal title="Reset your assessment?" onClose={()=>setReset(false)}><p>Your current answers and results will be cleared.</p><div className="modal-actions"><button className="button secondary" onClick={()=>setReset(false)}>Keep my answers</button><button className="button" onClick={restart}>Reset assessment</button></div></Modal>}</section>}

export function Insights(){return <section className="section"><div className="section-head"><div><p className="eyebrow">QUALITY INSIGHTS</p><h2>Ideas for better quality practice.</h2><p className="section-intro">A knowledge centre in development. The topics below are planned articles, not published guidance.</p></div></div><div className="insights-grid">{[['CAPA','Closing the actions without addressing all possible causes is not story of CAPA','Investigation, causes and effectiveness.'],['DOCUMENTATION','Compliance as per ALCOA+ across the lifecycle','Clear records and control through each stage.'],['SUPPLIER QUALITY','Practice Business partnership with helping hands to ensure WIN-WIN situation with Right QMS','Qualification and ongoing supplier oversight.']].map(([tag,title,copy],i)=><article className="insight-card" key={tag}><div className={'insight-art art-'+i} aria-hidden="true"><span>MDK / FIELD NOTES</span>{i===0?<Network size={78} strokeWidth={.8}/>:i===1?<ClipboardCheck size={78} strokeWidth={.8}/>:<ShieldCheck size={78} strokeWidth={.8}/>}<strong>0{i+1}</strong></div><div className="insight-copy"><p className="eyebrow">{tag}</p><h3>{title}</h3><p>{copy}</p><span className="coming-soon">Coming soon</span></div></article>)}</div></section>}

export function AuditTypes(){const [selected,setSelected]=useState<number|null>(null);const types=[['Chemical Audits','Chemical materials and quality controls','Review quality-system practices, documentation and the controls relevant to chemical materials.'],['Packaging Material Audits','Material consistency and traceability','Explore material controls, artwork practices, mix-up prevention and supporting quality records.'],['FNW Audits','Fiber & Nonwoven','Review supplier-quality practices, material controls and quality-system evidence for fiber and nonwoven materials.'],['API Audits','Active Pharmaceutical Ingredients','Discuss quality-system controls, documentation, traceability and audit readiness for API operations.']];return <section className="section audits-section"><div className="section-head"><div><p className="eyebrow">AUDIT EXPERIENCE</p><h2>A trained eye.<br/>Across complex materials.</h2><p className="section-intro">150+ audits completed across Megha’s professional experience. Explore the audit types and discuss a scope suited to your operation.</p></div><span className="audit-proof"><strong>150+</strong><span>AUDITS COMPLETED</span></span></div><div className="audit-grid">{types.map(([title,sub],i)=><button key={title} className="audit-card" onClick={()=>setSelected(i)}><span className="audit-index">0{i+1}<ArrowUpRight size={21}/></span><ClipboardCheck size={31} strokeWidth={1.2}/><h3>{title}</h3><p>{sub}</p><span className="audit-action">Explore audit type<ArrowRight size={16}/></span></button>)}</div>{selected!==null&&<Modal title={types[selected][0]} onClose={()=>setSelected(null)}><p className="service-lede">{types[selected][1]}</p><p>{types[selected][2]}</p><p className="small muted">Applicable standards, coverage, deliverables and timing are agreed for the engagement. No audit outcome or regulatory approval is guaranteed.</p><a className="button" href={'/contact?topic='+encodeURIComponent(types[selected][0])}>Discuss this audit<ArrowUpRight size={18}/></a></Modal>}</section>}

export function FAQ(){return <section className="section faq-section" id="faq"><div><p className="eyebrow">QUESTIONS, ANSWERED</p><h2>A useful<br/>starting point.</h2><p className="section-intro">Clear answers to common questions about quality systems and consulting.</p><a className="text-link" href="/contact">Discuss your question<ArrowUpRight size={17}/></a></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>}

// Demo mode is the safe default. Enable only after configuring and testing the API.
export const FORMS_ENABLED = true;

export function Contact({compact=false}:{compact?:boolean}){
 const [topic,setTopic]=useState('');
 const [industry,setIndustry]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [started]=useState(Date.now);

 useEffect(()=>{
  const p=new URLSearchParams(location.search);
  setTopic(p.get('topic')||'');
  setIndustry(p.get('industry')||'');
 },[]);

 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setStatus('');

  const f=e.currentTarget;
  const data=Object.fromEntries(new FormData(f));

  setBusy(true);

  try{
   if(inboxConfigured){
    const saved=await saveEnquiry({...data,started});

    let notification='';

    if(storageMode==='node'){
     notification=
      saved.emailAccepted&&saved.smsAccepted
       ?' Email and SMS notifications were accepted.'
       :saved.emailAccepted
        ?' Email notification was accepted; SMS notification was not confirmed.'
        :saved.smsAccepted
         ?' SMS notification was accepted; email notification was not confirmed.'
         :' Email and SMS notifications were not confirmed.';
    }else{
     notification=
      saved.emailAccepted
       ?' Email notification was accepted.'
       :' Email notification was not confirmed.';
    }

    setStatus(
     'Thank you. Your enquiry is saved in the MDK admin inbox.'+
     notification+
     ' MDK will confirm availability separately.'
    );

    f.reset();
    setTopic('');
    setIndustry('');
    return;
   }

   const res=await fetch('/api/consultation',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...data,started})
   });

   const result=await readEnquiryResponse(res);

   setStatus(
    result.smsDelivered
     ?'Thank you. Email and SMS providers accepted your enquiry. MDK will confirm availability separately.'
     :'Thank you. Email was accepted, but SMS notification was not confirmed.'
   );

   f.reset();
   setTopic('');
   setIndustry('');
  }catch(e){
   setStatus(e instanceof Error?e.message:'Unable to send. Please try again.');
  }finally{
   setBusy(false);
  }
 }

 return <section className="section contact-section" id="contact">
  <div className="contact-copy">
   <p className="eyebrow">LET’S TALK QUALITY</p>
   <h2>Start with<br/>a conversation.</h2>
   <p className="section-intro">Tell us what your organization is working through, the support you need and what a useful next step would look like.</p>

   <div className="contact-details">
    <span>PROFESSIONAL PROFILE</span>
    <a href={business.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20}/>Connect with Megha<ArrowUpRight size={17}/></a>
    <span>BASED IN</span>
    <p>{business.location}</p>
    <span>GSTIN</span>
    <p>{business.gstin}</p>
    {business.email&&<a href={'mailto:'+business.email}>{business.email}</a>}
    {business.phone&&<a href={'tel:+91'+business.phone}>{business.phone}</a>}
    {business.phoneSecondary&&<a href={'tel:+91'+business.phoneSecondary}>{business.phoneSecondary}</a>}
   </div>

   <div className="contact-expect">
    <h3>What happens next?</h3>
    <p>MDK reviews your requirement and confirms the next conversation. Scope, availability and fees are agreed separately.</p>
   </div>

   <p className="small muted">Please do not include confidential manufacturing records, patient information or sensitive documents.</p>
  </div>

  <form className="contact-form" onSubmit={submit}>
   <div className="form-heading">
    <h3>{compact?'Discuss your QMS':'Request a consultation'}</h3>
    <span>ENQUIRY</span>
   </div>

   <div className="form-grid">
    <label>Full name <span>*</span><input name="name" required maxLength={100} autoComplete="name" placeholder="Your full name"/></label>
    <label>Organization <span>*</span><input name="organization" required maxLength={160} autoComplete="organization" placeholder="Company name"/></label>
    <label>Designation<input name="designation" maxLength={100} autoComplete="organization-title" placeholder="Your role"/></label>
    <label>Business email <span>*</span><input type="email" name="email" required maxLength={254} autoComplete="email" placeholder="you@company.com"/></label>
    <label>Phone<input type="tel" name="phone" maxLength={30} autoComplete="tel" placeholder="Include country code"/></label>

    <label>Industry <span>*</span>
     <select name="industry" required value={industry} onChange={e=>setIndustry(e.target.value)}>
      <option value="">Select industry</option>
      {industries.map(i=><option key={i.title}>{i.title}</option>)}
      <option>Other / Discuss fit</option>
     </select>
    </label>

    <label className="wide">Service required <span>*</span>
     <select name="service" required defaultValue="">
      <option value="">Select a service</option>
      {services.map(s=><option key={s.slug} value={s.title}>{s.title}</option>)}
      <option>Training enquiry</option>
      <option>Discuss my assessment</option>
     </select>
    </label>

    <label className="wide">Consultation topic
     <input name="topic" maxLength={250} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What would you like to discuss?"/>
    </label>

    <label>Preferred date<input type="date" name="date" min={new Date().toLocaleDateString('en-CA')} /></label>
    <label>Preferred time (India Standard Time)<input type="time" name="time"/></label>

    <label className="wide">Consultation mode
     <select name="mode" defaultValue="Online">
      <option>Online</option>
      <option>In-person</option>
     </select>
    </label>

    <label className="wide">Your requirement <span>*</span>
     <textarea name="message" required minLength={10} maxLength={3000} rows={4} placeholder="Briefly describe your priorities and the support you need."/>
    </label>

    <label className="honeypot" aria-hidden="true">
     Leave this empty
     <input name="website" tabIndex={-1} autoComplete="off"/>
    </label>
   </div>

   <label className="consent">
    <input type="checkbox" name="consent" value="yes" required/>
    <span>I consent to MDK using these details to respond to my enquiry. I have read the <a href="/privacy">privacy notice</a>.</span>
   </label>

   <button className="button form-submit" disabled={busy} type="submit">
    {busy?'Sending…':'Request consultation'}
    <ArrowUpRight size={17}/>
   </button>

   <p className="small muted">Submission does not constitute appointment confirmation. MDK will confirm availability separately.</p>

   {status&&<div className="form-status" role="status">{status}</div>}
  </form>
 </section>
}

export function ServiceContent({service:s}:{service:Service}){return <><p className="service-lede">{s.short}</p><div className="service-detail-content"><div><p className="eyebrow">THE CHALLENGE</p><p>{s.challenge}</p></div><div><p className="eyebrow">WHAT MDK CAN HELP WITH</p><ul className="check-list">{s.help.map(h=><li key={h}><Check size={17}/>{h}</li>)}</ul></div><div><p className="eyebrow">APPROACH</p><p>{s.approach}</p></div><div><p className="eyebrow">POTENTIAL BUSINESS VALUE</p><p>{s.value}</p></div><div><p className="eyebrow">RELATED TRAINING</p><a className="text-link" href="/training">{s.training}<ArrowUpRight size={17}/></a></div></div><a className="button" href={'/contact?topic='+encodeURIComponent(s.title)}>Discuss this service<ArrowUpRight size={18}/></a></>}

export function Legal({kind}:{kind:string}){const title=kind==='privacy'?'Privacy notice':kind==='terms'?'Terms of website use':'Website disclaimer';return <><PageHero label="WEBSITE INFORMATION" title={title} copy="A clear explanation of how to use this website and its information."/><section className="section legal">{kind==='privacy'?<><h2>Your information</h2><p>When you submit an enquiry, your details are sent to MDK by its email delivery provider and an abbreviated notification is sent by SMS. Assessment answers remain in page memory and clear when you leave or reload. Theme preference is stored in your browser.</p><h2>Enquiries</h2><p>MDK uses your name, business contact details, organization, preferences and message to review and respond to your request. Form submissions may be stored in a secured business enquiry inbox and routed through the hosting provider, an email delivery service and an SMS provider. Do not send confidential or sensitive documents. Contact MDK by email for questions about your information.</p><h2>External services</h2><p>LinkedIn opens an external service with its own privacy practices. Web-hosting providers may process basic request logs. Fonts are served locally by this project. This website includes no analytics or advertising tracking by default.</p><h2>Contact and updates</h2><p>Contact MDK at Megha.QMS.Consultant@gmail.com for privacy questions. Material changes to data practices should be reflected here.</p></>:kind==='terms'?<><h2>Using this website</h2><p>Use this website for lawful purposes. Do not attempt to disrupt its operation, access restricted systems or submit misleading, harmful or confidential information.</p><h2>Information and consulting engagements</h2><p>Website content is general information. It is not a tailored assessment, formal audit, certification decision or binding professional advice. Consulting scope, deliverables, fees, responsibilities and timelines require a separate written agreement.</p><h2>Intellectual property</h2><p>Rights in website content remain with their respective owners. No right to reuse third-party names, marks or feedback is implied. Confirm ownership and permitted reuse of all assets before public launch.</p><h2>External links</h2><p>Links may lead to websites operated independently. Their availability, content and practices are outside the scope of this website.</p><h2>Limitations and governing terms</h2><p>No audit result, regulatory approval or certification is guaranteed. Any limitation of liability, governing law and dispute-resolution provisions require professional review and inclusion in the final business terms; no blanket waiver is asserted by this draft.</p></>:<><h2>General information</h2><p>Information provided on this website is intended for general educational and consulting purposes. It should not be interpreted as a guarantee of certification, regulatory approval or audit outcome.</p><h2>Illustrative tools</h2><p>The quality maturity self-assessment and roadmap are educational illustrations. Scores are self-reported and use illustrative thresholds. They are not validated measures of compliance or substitutes for a formal audit, regulatory assessment or professional review.</p><h2>Experience and feedback</h2><p>Career history is based on the supplied professional profile. Employers are not represented as MDK clients or endorsers. Professional feedback refers to Megha’s work and does not establish a consulting-client relationship with MDK.</p><h2>Training and guidelines</h2><p>Training topic names describe proposed learning areas. They do not imply accreditation or the award of a third-party certificate. Applicable requirements and course versions must be confirmed for each engagement.</p></>}</section></>}