(function (root) {
  'use strict';
  const { QUESTION_BANK, DOMAINS } = typeof module !== 'undefined' && module.exports ? require('./questions.js') : root.CampaignQuestions;
  const STORAGE_KEY = 'sentinel-cissp-progress-v2';
  const LEGACY_KEY = 'data-link-defense-progress';
  const byId = new Map(QUESTION_BANK.map(q => [q.id,q]));
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function browserStorage() { try { return root.localStorage || null; } catch (_) { return null; } }
  function shuffle(items,seed) {
    const result=items.slice(); let s=seed >>> 0;
    for(let i=result.length-1;i>0;i--) {s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1);[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function freshState() { return {version:2,xp:0,streak:0,sessionsStarted:0,history:[],missed:{},legacy:null,session:null}; }
  function validState(s) {
    if(!object(s) || s.version!==2 || ![s.xp,s.streak,s.sessionsStarted].every(integer) || !Array.isArray(s.history) || !object(s.missed)) return false;
    if(!s.history.every(h=>object(h)&&byId.has(h.id)&&typeof h.correct==='boolean'&&[1,2,3].includes(h.confidence)&&byId.get(h.id).options.includes(h.response))) return false;
    if(!Object.keys(s.missed).every(id=>byId.has(id)&&s.missed[id]===true)) return false;
    if(s.legacy!==null && (!object(s.legacy)||![s.legacy.answered,s.legacy.correct,s.legacy.score].every(integer)||!object(s.legacy.missed))) return false;
    const t=s.session;
    if(t===null) return true;
    if(!object(t)||![1,2,3,4,'mixed','missed'].includes(t.mode)||!Array.isArray(t.deck)||!t.deck.length||!t.deck.every(id=>byId.has(id))) return false;
    if(![t.index,t.answered,t.correct,t.xpStart].every(integer)||t.index>t.deck.length||t.correct>t.answered||typeof t.complete!=='boolean'||t.complete!==(t.index===t.deck.length)) return false;
    if(!object(t.reviewed)||!Object.keys(t.reviewed).every(id=>byId.has(id))||!object(t.boss)||![t.boss.total,t.boss.shields,t.boss.bonus].every(integer)||t.boss.shields>t.boss.total) return false;
    if(t.feedback!==null && (!object(t.feedback)||typeof t.feedback.correct!=='boolean'||![1,2,3].includes(t.feedback.confidence)||!byId.get(t.deck[t.index])?.options.includes(t.feedback.response))) return false;
    // A resolved deck slot must have exactly one history entry and a lock until Next.
    // Match the session suffix by position: legitimate deferred retries repeat IDs.
    if(t.answered!==t.index+(t.feedback===null?0:1)||t.answered>s.history.length) return false;
    const attempts=s.history.slice(s.history.length-t.answered);
    if(!attempts.every((h,i)=>h.id===t.deck[i]&&h.correct===(h.response===byId.get(h.id).answer))) return false;
    if(t.correct!==attempts.filter(h=>h.correct).length) return false;
    if(t.feedback!==null) {
      const last=attempts.at(-1);
      if(!last||!['correct','response','confidence'].every(key=>t.feedback[key]===last[key])) return false;
    }
    return true;
  }
  class CampaignGame {
    constructor({storage=browserStorage(),seed=42}={}) {
      this.storage=storage;this.storageAvailable=!!storage;this.seed=seed;this.state=this.loadState();
    }
    get session() { return this.state.session; }
    loadState() {
      const fresh=freshState(); if(!this.storage) return fresh;
      try {
        const current=this.storage.getItem(STORAGE_KEY);
        if(current!==null) { const parsed=JSON.parse(current); return validState(parsed)?parsed:fresh; }
        const old=JSON.parse(this.storage.getItem(LEGACY_KEY));
        if(object(old)) {
          const safe=n=>integer(n)?n:0;
          fresh.xp=safe(old.score);
          fresh.legacy={score:safe(old.score),answered:safe(old.answered),correct:safe(old.correct),missed:{}};
          if(object(old.missed)) for(const [concept,count] of Object.entries(old.missed)) if(integer(count)&&count>0) Object.defineProperty(fresh.legacy.missed,concept,{value:count,enumerable:true});
        }
      } catch (_) { this.storageAvailable=false; }
      return fresh;
    }
    saveState() {
      if(!this.storage) {this.storageAvailable=false;return;}
      try {this.storage.setItem(STORAGE_KEY,JSON.stringify(this.state));this.storageAvailable=true;} catch (_) {this.storageAvailable=false;}
    }
    reset() { this.state=freshState();this.saveState(); }
    startSession(mode='mixed') {
      if(![1,2,3,4,'mixed','missed'].includes(mode)) throw Error('Unknown campaign domain');
      const seed=this.seed+this.state.sessionsStarted;
      let deck=[];
      if(mode==='missed') deck=shuffle(this.replayMissedDeck(),seed);
      else {
        const domains=mode==='mixed'?[1,2,3,4]:[mode];
        for(const d of domains) {
          const pool=shuffle(QUESTION_BANK.filter(q=>q.domain===d&&!q.boss),seed+d);
          deck.push(...(mode==='mixed'?pool.slice(0,3):pool));
        }
        deck=shuffle(deck,seed);
        deck.push(...domains.map(d=>QUESTION_BANK.find(q=>q.domain===d&&q.boss)));
      }
      if(!deck.length) return false;
      this.state.streak=0;this.state.sessionsStarted++;
      this.state.session={mode,deck:deck.map(q=>q.id),index:0,answered:0,correct:0,xpStart:this.state.xp,complete:false,feedback:null,reviewed:{},boss:{total:deck.filter(q=>q.boss).length,shields:0,bonus:0}};
      this.saveState();return true;
    }
    currentQuestion() { return this.session&&!this.session.complete ? byId.get(this.session.deck[this.session.index]) : null; }
    answer(response,confidence) {
      if(![1,2,3].includes(confidence)) throw Error('Choose confidence 1, 2, or 3');
      const q=this.currentQuestion();if(!q) throw Error('No active question');
      const s=this.session;if(s.feedback) throw Error('Question already answered');
      if(!q.options.includes(response)) throw Error('Choose a valid answer');
      const correct=response===q.answer;
      this.state.history.push({id:q.id,correct,response,confidence});s.answered++;
      if(correct) {
        this.state.streak++;this.state.xp+=100+Math.min(this.state.streak,5)*20;s.correct++;
        delete this.state.missed[q.id];if(q.boss) s.boss.shields++;
      } else {
        this.state.streak=0;this.state.missed[q.id]=true;
        // Insert at most one retry, AFTER two intervening decisions, before the finale.
        // Late misses and boss misses remain available for a later replay session.
        const firstBoss=s.deck.findIndex((id,i)=>i>s.index&&byId.get(id).boss);
        const boundary=firstBoss===-1?s.deck.length:firstBoss;
        if(!q.boss&&!s.reviewed[q.id]&&s.index+3<=boundary) {
          s.deck.splice(s.index+3,0,q.id);s.reviewed[q.id]=true;
        }
      }
      s.feedback={correct,response,confidence};this.saveState();
      return {...s.feedback,answer:q.answer,explanation:q.explanation,rationales:q.rationales};
    }
    nextQuestion() {
      const s=this.session;if(!s||s.complete||!s.feedback) return this.currentQuestion();
      s.index++;s.feedback=null;
      if(s.index===s.deck.length) {
        s.complete=true;
        if(s.boss.total>0&&s.boss.shields===s.boss.total) {s.boss.bonus=200;this.state.xp+=200;}
      }
      this.saveState();return this.currentQuestion();
    }
    replayMissedDeck() { return QUESTION_BANK.filter(q=>this.state.missed[q.id]); }
    rank() {return this.state.xp<1000?'Cadet':this.state.xp<3000?'Analyst':this.state.xp<6000?'Defender':'Sentinel';}
    masteryBreakdown() {
      const domains={};for(const d of [1,2,3,4]) domains[d]={name:DOMAINS[d],answered:0,correct:0,accuracy:null,seen:0,total:QUESTION_BANK.filter(q=>q.domain===d).length};
      const seen=new Set();const calibration={confidentMisses:0,luckyGuesses:0};let totalCorrect=0;
      for(const h of this.state.history) {
        const q=byId.get(h.id);const d=domains[q.domain];d.answered++;if(h.correct){d.correct++;totalCorrect++;}
        if(!seen.has(q.id)){d.seen++;seen.add(q.id);}
        if(!h.correct&&h.confidence===3) calibration.confidentMisses++;
        if(h.correct&&h.confidence===1) calibration.luckyGuesses++;
      }
      for(const d of Object.values(domains)) d.accuracy=d.answered?Math.round(100*d.correct/d.answered):null;
      return {domains,calibration,totalAnswered:this.state.history.length,totalCorrect,accuracy:this.state.history.length?Math.round(100*totalCorrect/this.state.history.length):null};
    }
    studyReport() {
      const r=this.masteryBreakdown();const s=this.session;
      const lines=['Sentinel • CISSP Domains 1–4 • Report for Elliott',`XP: ${this.state.xp} | Rank: ${this.rank()}`,`Practice: ${r.totalCorrect}/${r.totalAnswered} correct (includes retries; not exam readiness)`];
      if(s) lines.push(`Session: ${s.mode} | ${s.complete?'complete':'in progress'} | ${s.correct}/${s.answered} correct | Boss shields: ${s.boss.shields}/${s.boss.total}`);
      for(const [n,d] of Object.entries(r.domains)) lines.push(`Domain ${n} — ${d.name}: ${d.correct}/${d.answered} correct; ${d.seen}/${d.total} questions seen`);
      lines.push(`Confident misses: ${r.calibration.confidentMisses} | Lucky guesses (low-confidence correct): ${r.calibration.luckyGuesses}`);
      lines.push('Missed topics: '+(this.replayMissedDeck().map(q=>`D${q.domain} ${q.concept}`).join('; ')||'None currently unresolved'));
      if(this.state.legacy) lines.push(`Legacy Data Link Defense: ${this.state.legacy.correct}/${this.state.legacy.answered} correct; ${this.state.legacy.score} score carried as XP. Legacy missed topics: ${Object.keys(this.state.legacy.missed).join(', ')||'none'}. Legacy attempts excluded from domain/calibration statistics.`);
      lines.push('Local study aid. Share this text manually; nothing is automatically sent.');return lines.join('\n');
    }
  }

  function initBrowserGame(doc=root.document,game=new CampaignGame(),confirmReset=message=>root.confirm(message)) {
    const el=id=>doc.getElementById(id);
    const radios=Array.from(doc.querySelectorAll('input[name="confidence"]'));
    let selected=null;let confidence=null;
    const node=(tag,text)=>{const n=doc.createElement(tag);n.textContent=text;return n;};
    function updateSubmit() {el('lock-answer').disabled=!selected||!confidence||!!game.session?.feedback;}
    function renderStats() {
      const r=game.masteryBreakdown();const s=game.session;
      el('xp').textContent=game.state.xp;el('rank').textContent=game.rank();el('streak').textContent=game.state.streak;
      el('combo').textContent=game.state.streak>1?`Combo ×${Math.min(game.state.streak,5)} • next correct earns up to 200 XP`:'Build a streak • errors are learning signals, not penalties';
      el('storage-status').textContent=game.storageAvailable?'Progress is saved locally in this browser.':'Progress is not being saved: browser storage is unavailable. Keep a manual report before closing.';
      el('mastery-report').replaceChildren();
      for(const [n,d] of Object.entries(r.domains)) {
        const card=node('div','');card.className='domain-card';
        card.append(node('h3',`Domain ${n}`),node('p',d.name),node('strong',d.accuracy===null?'Not practiced':`${d.accuracy}% practice accuracy`),node('p',`${d.correct}/${d.answered} correct • ${d.seen}/${d.total} questions seen`));el('mastery-report').append(card);
      }
      el('calibration').textContent=`Confident misses: ${r.calibration.confidentMisses} • Lucky guesses (correct at confidence 1): ${r.calibration.luckyGuesses}. Review both; confidence is not a grade.`;
      el('legacy-note').textContent=game.state.legacy?`Legacy progress preserved: ${game.state.legacy.correct}/${game.state.legacy.answered} correct; ${game.state.legacy.score} score carried as XP. Old misses: ${Object.keys(game.state.legacy.missed).join(', ')||'none'}. Legacy questions are retired; these attempts are not domain/calibration evidence.`:'';
      el('replay-missed').disabled=!game.replayMissedDeck().length;
      el('boss-status').textContent=s?`BLACKOUT boss shields: ${s.boss.shields}/${s.boss.total}${s.boss.bonus?' • +200 XP flawless finale':''}`:'BLACKOUT • four decisions protect one emergency network';
      if(s) {
        const done=s.index+(s.feedback?1:0);
        el('mission-progress').max=s.deck.length;el('mission-progress').value=done;
        el('progress-label').textContent=`${done}/${s.deck.length} decisions resolved${Object.keys(s.reviewed).length?' • includes deferred review':''}`;
      }
    }
    function renderFeedback() {
      const q=game.currentQuestion();const f=game.session?.feedback;
      el('feedback').replaceChildren();el('next-button').hidden=!f;
      if(!q||!f) {el('feedback').textContent='Choose an answer and confidence, then lock your decision.';return;}
      el('feedback').append(node('h3',f.correct?'Defense holds.':'A gap found — learn, then recover.'),node('p',`Your confidence: ${f.confidence}/3. Correct answer: ${q.answer}`),node('p',q.explanation));
      const list=doc.createElement('ul');for(const option of q.options) list.append(node('li',`${option===q.answer?'Why it wins':'Why not'} — ${option}: ${q.rationales[option]}`));
      el('feedback').append(list);
      if(!f.correct) el('feedback').append(node('p',game.session.reviewed[q.id]?'This topic has one deferred review in this mission; any unresolved miss remains available in Replay missed.':'This miss is saved for Replay missed after the mission.'));
      el('feedback').className=`feedback ${f.correct?'correct':'incorrect'}`;
    }
    function render(focus=false) {
      selected=null;confidence=null;const q=game.currentQuestion();const s=game.session;
      el('arena').hidden=!q;el('completion').hidden=!s?.complete;el('welcome').hidden=!!s;
      el('report-panel').hidden=true;
      radios.forEach(r=>{r.checked=false;r.disabled=!!s?.feedback;});
      el('answer-options').replaceChildren();el('feedback').className='feedback';
      if(q) {
        el('mission-text').textContent=q.mission;
        el('level-label').textContent=`Domain ${q.domain} • ${q.domainName} • ${q.boss?'Boss decision':'Level '+q.level}`;
        el('prompt').textContent=q.prompt;
        for(const option of q.options) {
          const b=node('button',option);b.type='button';b.className='answer-card';b.disabled=!!s.feedback;b.setAttribute('aria-pressed','false');
          b.addEventListener('click',()=>{selected=option;for(const child of el('answer-options').children) child.setAttribute('aria-pressed',String(child===b));updateSubmit();});
          el('answer-options').append(b);
        }
        if(s.feedback) {selected=s.feedback.response;confidence=s.feedback.confidence;radios.forEach(r=>r.checked=Number(r.value)===confidence);for(const b of el('answer-options').children) b.setAttribute('aria-pressed',String(b.textContent===selected));}
      }
      if(s?.complete) {
        el('completion-summary').textContent=`Mission complete • ${s.correct}/${s.answered} correct • +${game.state.xp-s.xpStart} XP. ${s.boss.total ? (s.boss.shields===s.boss.total?'BLACKOUT contained. All boss shields secured!':'BLACKOUT debrief: review the missed decisions and try again.'):'Review mission resolved.'}`;
      }
      renderFeedback();renderStats();updateSubmit();
      if(focus) {if(q)el('prompt').focus();else if(s?.complete)el('completion-title').focus();}
    }
    el('start-session').addEventListener('click',()=>{
      if(game.session&&!game.session.complete&&!confirmReset('Start a new mission? Completed answers stay saved, but the current mission deck will be replaced.')) return;
      const value=el('domain-select').value;game.startSession(value==='mixed'?'mixed':Number(value));render(true);
    });
    radios.forEach(r=>r.addEventListener('change',()=>{confidence=Number(r.value);updateSubmit();}));
    el('answer-form').addEventListener('submit',event=>{
      event.preventDefault();if(!selected||!confidence||game.session?.feedback) return;
      game.answer(selected,confidence);render();el('next-button').focus();
    });
    el('next-button').addEventListener('click',()=>{game.nextQuestion();render(true);});
    el('replay-missed').addEventListener('click',()=>{
      if(game.session&&!game.session.complete&&!confirmReset('Replace the current mission with unresolved missed topics? All recorded progress stays saved.')) return;
      if(game.startSession('missed')) render(true);
    });
    el('share-report').addEventListener('click',()=>{el('report-text').value=game.studyReport();el('report-panel').hidden=false;el('report-text').focus();el('report-text').select();});
    el('reset-progress').addEventListener('click',()=>{if(confirmReset('Erase this campaign’s local progress? The archived legacy Data Link Defense save is left untouched.')){game.reset();render();el('start-session').focus();}});
    render();return game;
  }
  const api={QUESTION_BANK,DOMAINS,CampaignGame,STORAGE_KEY,LEGACY_KEY,initBrowserGame};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else {root.Sentinel=api;root.document.addEventListener('DOMContentLoaded',()=>initBrowserGame());}
})(typeof window==='undefined'?globalThis:window);
