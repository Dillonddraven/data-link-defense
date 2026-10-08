(function(root){
'use strict';
const {NETSEC_BANK,NETSEC_UNITS}=typeof module!=='undefined'&&module.exports?require('./netsec-questions.js'):root.NetsecQuestions;
const NETSEC_STORAGE_KEY='sentinel-netsec-midterm-v2';
const NETSEC_LEGACY_KEY='sentinel-netsec-midterm-v1';
const byId=new Map(NETSEC_BANK.map(q=>[q.id,q]));
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const nonnegativeInteger=v=>Number.isSafeInteger(v)&&v>=0;
const timestamp=v=>typeof v==='string'&&!Number.isNaN(Date.parse(v));
function storage(){try{return root.localStorage||null;}catch(_){return null;}}
function shuffle(values,seed){const a=values.slice();let s=seed>>>0;for(let i=a.length-1;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function fresh(){return{version:2,xp:0,sessionsStarted:0,history:[],missed:{},session:null};}
function normalize(q,value){if(q.type==='order')return Array.isArray(value)?value.map(String):[];if(q.type==='numeric')return Number(value);return String(value);}
function validResponse(q,value){const v=normalize(q,value);if(q.type==='choice')return q.options.includes(v);if(q.type==='numeric')return Number.isFinite(v);return v.length===q.options.length&&new Set(v).size===v.length&&v.every(x=>q.options.includes(x));}
function validLegacyResponse(q,value){const v=normalize(q,value);return q.type!=='order'?validResponse(q,value):v.length>0&&v.length<=q.options.length&&new Set(v).size===v.length&&v.every(x=>q.options.includes(x));}
function correct(q,value){const v=normalize(q,value);if(q.type==='order')return v.length===q.answer.length&&v.every((x,i)=>x===q.answer[i]);if(q.type==='numeric')return Number.isFinite(v)&&Math.abs(v-Number(q.answer))<=q.tolerance+Number.EPSILON*10;return v===q.answer;}
function validHistory(history,version){return Array.isArray(history)&&history.every(h=>{
 if(!isObject(h)||!byId.has(h.id)||typeof h.correct!=='boolean'||![1,2,3].includes(h.confidence))return false;
 const metadata=['attemptId','sessionId','answeredAt'].filter(k=>h[k]!==undefined);
 if(metadata.length!==0&&metadata.length!==3)return false;
 const q=byId.get(h.id),legacy=version===1||metadata.length===0;
 if(!(legacy?validLegacyResponse(q,h.response):validResponse(q,h.response))||h.correct!==correct(q,h.response))return false;
 return metadata.length===0||(typeof h.attemptId==='string'&&h.attemptId.length>0&&typeof h.sessionId==='string'&&h.sessionId.length>0&&timestamp(h.answeredAt));
});}
function validSession(t,history,version){
 if(t===null)return true;
 if(!isObject(t)||![1,2,3,4,5,6,'mixed','missed'].includes(t.mode)||!Array.isArray(t.deck)||!t.deck.length||!t.deck.every(id=>byId.has(id)))return false;
 if(![t.index,t.answered,t.correct,t.baseLength].every(nonnegativeInteger)||t.index>t.deck.length||t.answered>t.deck.length||t.correct>t.answered||typeof t.complete!=='boolean')return false;
 if(t.complete!==(t.index===t.deck.length)||!isObject(t.reviewed)||t.answered!==t.index+(t.feedback?1:0))return false;
 if(t.id!==undefined&&(typeof t.id!=='string'||!t.id))return false;
 if(t.startedAt!==undefined&&!timestamp(t.startedAt))return false;
 if(t.answered>history.length)return false;
 const attempts=history.slice(history.length-t.answered);
 if(!attempts.every((h,i)=>h.id===t.deck[i]))return false;
 if(t.correct!==attempts.filter(h=>h.correct).length)return false;
 if(t.feedback!==null){const last=attempts.at(-1),q=byId.get(t.deck[t.index]),legacy=version===1||!last?.attemptId;if(!isObject(t.feedback)||typeof t.feedback.correct!=='boolean'||![1,2,3].includes(t.feedback.confidence)||!(legacy?validLegacyResponse(q,t.feedback.response):validResponse(q,t.feedback.response))||!last||last.correct!==t.feedback.correct||last.confidence!==t.feedback.confidence||JSON.stringify(last.response)!==JSON.stringify(t.feedback.response))return false;}
 return true;
}
function validState(s,version){
 if(!isObject(s)||s.version!==version||!nonnegativeInteger(s.xp)||!nonnegativeInteger(s.sessionsStarted)||!validHistory(s.history,version)||!isObject(s.missed))return false;
 if(!Object.keys(s.missed).every(id=>byId.has(id)&&s.missed[id]===true))return false;
 return validSession(s.session,s.history,version);
}
function migrateV1(old){return{version:2,xp:old.xp,sessionsStarted:old.sessionsStarted,history:old.history.map(h=>({...h})),missed:{...old.missed},session:old.session===null?null:{...old.session,deck:old.session.deck.slice(),reviewed:{...old.session.reviewed},feedback:old.session.feedback===null?null:{...old.session.feedback}}};}
function printable(value){return Array.isArray(value)?value.join(' → '):String(value);}
function idTime(value){return value.replace(/[^0-9A-Za-z]/g,'').slice(0,17);}
class NetsecGame{
 constructor({storage:store=storage(),seed=42,now=()=>new Date().toISOString()}={}){this.storage=store;this.storageAvailable=!!store;this.seed=seed;this.now=now;this.state=this.load();}
 get session(){return this.state.session;}
 load(){
  const f=fresh();if(!this.storage)return f;
  try{
   const raw=this.storage.getItem(NETSEC_STORAGE_KEY);
   if(raw!==null){const parsed=JSON.parse(raw);return validState(parsed,2)?parsed:f;}
   const legacyRaw=this.storage.getItem(NETSEC_LEGACY_KEY);
   if(legacyRaw===null)return f;
   const legacy=JSON.parse(legacyRaw);if(!validState(legacy,1))return f;
   const migrated=migrateV1(legacy);this.state=migrated;this.save();return migrated;
  }catch(_){this.storageAvailable=false;return f;}
 }
 save(){if(!this.storage){this.storageAvailable=false;return;}try{this.storage.setItem(NETSEC_STORAGE_KEY,JSON.stringify(this.state));this.storageAvailable=true;}catch(_){this.storageAvailable=false;}}
 reset(){this.state=fresh();this.save();}
 prioritized(pool,seed){const missed=shuffle(pool.filter(q=>this.state.missed[q.id]),seed);const rest=shuffle(pool.filter(q=>!this.state.missed[q.id]),seed+101);return missed.concat(rest);}
 mixedDeck(seed){
  const deck=[],used=new Set(),units=new Set();
  for(const q of shuffle(this.unresolved(),seed)){if(deck.length===5)break;if(!units.has(q.unit)){deck.push(q);used.add(q.id);units.add(q.unit);}}
  const offset=this.state.sessionsStarted%6;
  for(let i=0;i<12&&deck.length<5;i++){const unit=((offset+i)%6)+1;const pick=this.prioritized(NETSEC_BANK.filter(q=>q.unit===unit&&!used.has(q.id)),seed+unit+i)[0];if(pick){deck.push(pick);used.add(pick.id);units.add(pick.unit);}}
  return deck;
 }
 startSession(mode='mixed',explicitIds=null){
  if(![1,2,3,4,5,6,'mixed','missed'].includes(mode))throw Error('Unknown syllabus unit');
  const seed=this.seed+this.state.sessionsStarted;let deck=[];
  if(explicitIds)deck=explicitIds.map(id=>byId.get(id)).filter(Boolean);
  else if(mode==='missed'){
   deck=shuffle(this.unresolved(),seed).slice(0,5);if(!deck.length)return false;
   const used=new Set(deck.map(q=>q.id));
   deck.push(...shuffle(NETSEC_BANK.filter(q=>!used.has(q.id)),seed+101).slice(0,5-deck.length));
  }
  else if(mode==='mixed')deck=this.mixedDeck(seed);
  else deck=this.prioritized(NETSEC_BANK.filter(q=>q.unit===mode),seed).slice(0,5);
  if(!deck.length)return false;
  this.state.sessionsStarted++;const startedAt=this.now();
  this.state.session={id:`session-${this.state.sessionsStarted}-${idTime(startedAt)}`,startedAt,mode,deck:deck.map(q=>q.id),baseLength:deck.length,index:0,answered:0,correct:0,xpStart:this.state.xp,complete:false,feedback:null,reviewed:{}};this.save();return true;
 }
 currentQuestion(){return this.session&&!this.session.complete?byId.get(this.session.deck[this.session.index]):null;}
 answer(response,confidence){
  if(![1,2,3].includes(confidence))throw Error('Choose confidence 1, 2, or 3');const q=this.currentQuestion();if(!q)throw Error('No active question');if(this.session.feedback)throw Error('Question already answered');if(!validResponse(q,response))throw Error('Choose a valid answer');
  const isCorrect=correct(q,response),recorded=normalize(q,response),answeredAt=this.now();
  if(!this.session.id)this.session.id=`continued-session-${this.state.sessionsStarted}`;
  this.state.history.push({id:q.id,correct:isCorrect,confidence,response:recorded,attemptId:`attempt-${this.state.history.length+1}-${idTime(answeredAt)}`,sessionId:this.session.id,answeredAt});this.session.answered++;
  if(isCorrect){this.state.xp+=100;this.session.correct++;delete this.state.missed[q.id];}else this.state.missed[q.id]=true;
  this.session.feedback={correct:isCorrect,confidence,response:recorded};this.save();return{...this.session.feedback,answer:q.answer,explanation:q.explanation};
 }
 nextQuestion(){const s=this.session;if(!s||s.complete||!s.feedback)return this.currentQuestion();s.index++;s.feedback=null;if(s.index===s.deck.length)s.complete=true;this.save();return this.currentQuestion();}
 unresolved(){return NETSEC_BANK.filter(q=>this.state.missed[q.id]);}
 summary(){let right=0,confidentMisses=0,lucky=0;const byUnit={};for(let u=1;u<=6;u++)byUnit[u]={answered:0,correct:0};for(const h of this.state.history){right+=h.correct?1:0;byUnit[byId.get(h.id).unit].answered++;byUnit[byId.get(h.id).unit].correct+=h.correct?1:0;if(!h.correct&&h.confidence===3)confidentMisses++;if(h.correct&&h.confidence===1)lucky++;}return{answered:this.state.history.length,correct:right,confidentMisses,lucky,byUnit};}
 report(){
  const r=this.summary(),s=this.session;const lines=['CYB 7223 • Network Security Midterm Detailed Practice Report','Scope: provisional Weeks 1–6; not an exam-readiness guarantee.',`Lifetime practice: ${r.correct}/${r.answered} | XP: ${this.state.xp}`];
  if(s)lines.push(`Latest micro-session: ${s.mode} | ${s.correct}/${s.answered} correct | ${s.complete?'complete':'in progress'} | Session ID: ${s.id||'unavailable (saved before detailed reporting)'} | Started at: ${s.startedAt||'unavailable (saved before detailed reporting)'}`);
  for(let u=1;u<=6;u++)lines.push(`Week ${u} — ${NETSEC_UNITS[u]}: ${r.byUnit[u].correct}/${r.byUnit[u].answered}`);
  lines.push(`Confident misses: ${r.confidentMisses} | Low-confidence correct: ${r.lucky}`);
  lines.push('Unresolved topics: '+(this.unresolved().map(q=>q.concept).join('; ')||'none'));
  lines.push('',`Detailed responses (${this.state.history.length}):`);
  this.state.history.forEach((h,index)=>{const q=byId.get(h.id);lines.push('',`Attempt ${index+1}`,`Attempt ID: ${h.attemptId||'unavailable (saved before detailed reporting)'}`,`Session ID: ${h.sessionId||'unavailable (saved before detailed reporting)'}`,`Answered at: ${h.answeredAt||'unavailable (saved before detailed reporting)'}`,`Week ${q.unit} • ${q.concept} • ${q.type}`,`Question: ${q.prompt}`,`Your response: ${printable(h.response)}`,`Correct answer: ${printable(q.answer)}`,`Result: ${h.correct?'correct':'incorrect'} | Confidence: ${h.confidence}/3`);});
  lines.push('','Progress and this report stay local unless you copy/share them. Nothing is sent automatically.');return lines.join('\n');
 }
}
function initNetsecGame(doc=root.document,game=new NetsecGame(),confirmReset=m=>root.confirm(m)){
 const el=id=>doc.getElementById(id),radios=Array.from(doc.querySelectorAll('input[name="confidence"]'));let response=null,confidence=null;
 const node=(tag,text)=>{const n=doc.createElement(tag);n.textContent=text;return n;};
 function updateLock(){el('lock-answer').disabled=response===null||confidence===null||!!game.session?.feedback;}
 function stats(){const r=game.summary();el('xp').textContent=game.state.xp;el('practice-total').textContent=`${r.correct}/${r.answered}`;el('calibration').textContent=`Confident misses: ${r.confidentMisses} • Low-confidence correct: ${r.lucky}. Review both.`;el('replay-missed').disabled=!game.unresolved().length;el('storage-status').textContent=game.storageAvailable?'Progress saves only in this browser.':'Storage unavailable: play works, but progress will not survive closing.';}
 function feedback(){const q=game.currentQuestion(),f=game.session?.feedback;el('feedback').replaceChildren();el('next-button').hidden=!f;if(!q||!f){el('feedback').textContent='Answer first, then read the concise correction.';return;}el('feedback').append(node('h3',f.correct?'Locked in.':'Correction saved.'),node('p',`Confidence ${f.confidence}/3 • Answer: ${printable(q.answer)}`),node('p',q.explanation));if(q.type==='choice'){const ul=doc.createElement('ul');for(const option of q.options)ul.append(node('li',`${option===q.answer?'Why it wins':'Why not'} — ${option}: ${q.rationales[option]}`));el('feedback').append(ul);}el('feedback').append(node('p',`Source: ${q.sourceLabel}`));el('feedback').className=`feedback ${f.correct?'correct':'incorrect'}`;}
 function render(focus=false){
  response=null;confidence=null;const q=game.currentQuestion(),s=game.session;el('arena').hidden=!q;el('completion').hidden=!s?.complete;el('answer-options').replaceChildren();radios.forEach(r=>{r.checked=false;r.disabled=!!s?.feedback;});
  if(q){el('unit-label').textContent=`Week ${q.unit} • ${q.unitName}`;el('prompt').textContent=q.prompt;el('source-link').textContent=q.sourceLabel;el('source-link').href=q.sourceUrl;
   if(q.type==='choice'){for(const option of q.options){const b=node('button',option);b.type='button';b.className='answer-card';b.disabled=!!s.feedback;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{response=option;for(const x of el('answer-options').children)x.setAttribute('aria-pressed',String(x===b));updateLock();});el('answer-options').append(b);}}
   if(q.type==='numeric'){const label=node('label','Your number');label.htmlFor='numeric-answer';const input=doc.createElement('input');input.id='numeric-answer';input.inputMode='decimal';input.disabled=!!s.feedback;input.addEventListener('input',()=>{response=input.value.trim()===''?null:input.value;updateLock();});el('answer-options').append(label,input);}
   if(q.type==='order'){const p=node('p','Tap the tiles in the correct order.');const chosen=[];el('answer-options').append(p);for(const option of q.options){const b=node('button',option);b.type='button';b.className='answer-card';b.disabled=!!s.feedback;b.addEventListener('click',()=>{chosen.push(option);b.disabled=true;b.textContent=`${chosen.length}. ${option}`;response=chosen.length===q.options.length?chosen.slice():null;updateLock();});el('answer-options').append(b);}}
   if(s.feedback){response=s.feedback.response;confidence=s.feedback.confidence;radios.forEach(r=>r.checked=Number(r.value)===confidence);}
   const done=s.index+(s.feedback?1:0);el('micro-progress').max=s.deck.length;el('micro-progress').value=done;el('progress-label').textContent=`${done}/${s.deck.length} retrievals • about 3–5 minutes`;
  }
  if(s?.complete)el('completion-summary').textContent=`Micro-session complete: ${s.correct}/${s.answered} correct, +${game.state.xp-s.xpStart} XP. Next session prioritizes unresolved misses while still spacing retries.`;
  feedback();stats();updateLock();if(focus)(q?el('prompt'):el('completion-title')).focus();
 }
 el('start-session').addEventListener('click',()=>{if(game.session&&!game.session.complete&&!confirmReset('Replace the active micro-session? Recorded progress stays saved.'))return;const v=el('unit-select').value;game.startSession(v==='mixed'?'mixed':Number(v));render(true);});
 radios.forEach(r=>r.addEventListener('change',()=>{confidence=Number(r.value);updateLock();}));
 el('answer-form').addEventListener('submit',e=>{e.preventDefault();if(response===null||confidence===null||game.session?.feedback)return;game.answer(response,confidence);render();el('next-button').focus();});
 el('next-button').addEventListener('click',()=>{game.nextQuestion();render(true);});
 el('replay-missed').addEventListener('click',()=>{if(game.session&&!game.session.complete&&!confirmReset('Replace this session with a five-question burst that starts with unresolved misses?'))return;if(game.startSession('missed'))render(true);});
 el('share-report').addEventListener('click',()=>{el('report-text').value=game.report();el('report-panel').hidden=false;el('report-text').focus();el('report-text').select();});
 el('reset-progress').addEventListener('click',()=>{if(confirmReset('Erase only CYB 7223 local progress? CISSP progress stays untouched.')){game.reset();render();}});
 render();return game;
}
const api={NETSEC_BANK,NETSEC_UNITS,NetsecGame,NETSEC_STORAGE_KEY,NETSEC_LEGACY_KEY,initNetsecGame};if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.NetsecMidterm=api;root.document.addEventListener('DOMContentLoaded',()=>initNetsecGame());}
})(typeof window==='undefined'?globalThis:window);
