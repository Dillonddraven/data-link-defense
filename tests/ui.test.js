'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { CampaignGame, initBrowserGame } = require('../app.js');
// Small DOM port: tests real game/controller events, not a second implementation.
class Element {
  constructor(tag='div') { this.tagName=tag.toUpperCase(); this.children=[]; this.listeners={}; this.attributes={}; this.value=''; this.hidden=false; this.disabled=false; this.checked=false; this._text=''; }
  set textContent(s) { this._text=String(s); this.children=[]; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(' '); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text=''; this.children=nodes; }
  setAttribute(k,v) { this.attributes[k]=String(v); }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }
  dispatch(type) { if(this.disabled) return; for(const fn of this.listeners[type] || []) fn({target:this,currentTarget:this,preventDefault(){}}); }
  focus() { this.focused=true; }
  select() { this.selected=true; }
}
function setup(game) {
  const ids={}; const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  for(const m of html.matchAll(/<([\w-]+)[^>]*\bid="([^"]+)"[^>]*>/g)) ids[m[2]]=new Element(m[1]);
  const radios=[1,2,3].map(n=> {const e=new Element('input');e.value=String(n);return e;});
  const document={getElementById:id=>ids[id],createElement:tag=>new Element(tag),querySelectorAll:()=>radios};
  assert.equal(typeof initBrowserGame,'function','browser controller must be exported');
  initBrowserGame(document,game,()=>true);
  return {ids,radios,click:id=>ids[id].dispatch('click'),confidence(n){radios.forEach(r=>r.checked=Number(r.value)===n);radios[n-1].dispatch('change');}};
}
function choose(ui,g,correct=true) {const q=g.currentQuestion();const b=ui.ids['answer-options'].children.find(b=>(b.textContent===q.answer)===correct); b.dispatch('click');ui.confidence(2);ui.ids['answer-form'].dispatch('submit');}

test('UI: start, question-first, choice plus mandatory confidence, explanation, next, focus',()=>{
  assert.equal(typeof CampaignGame,'function');
  const g=new CampaignGame({storage:null});const ui=setup(g);ui.ids['domain-select'].value='2';ui.click('start-session');
  assert.equal(g.currentQuestion().domain,2);assert.equal(ui.ids.arena.hidden,false);assert.equal(ui.ids.completion.hidden,true);
  assert.equal(ui.ids['lock-answer'].disabled,true);assert.ok(!ui.ids.feedback.textContent.includes(g.currentQuestion().explanation));
  const q=g.currentQuestion();ui.ids['answer-options'].children[0].dispatch('click');assert.equal(ui.ids['lock-answer'].disabled,true);
  ui.ids['answer-form'].dispatch('submit');assert.equal(g.state.history.length,0);
  ui.confidence(3);assert.equal(ui.ids['lock-answer'].disabled,false);ui.ids['answer-form'].dispatch('submit');
  assert.equal(g.state.history.length,1);assert.ok(ui.ids.feedback.textContent.includes(q.explanation));
  for(const o of q.options) assert.ok(ui.ids.feedback.textContent.includes(q.rationales[o]));
  assert.equal(ui.ids['next-button'].hidden,false);assert.ok(ui.ids['answer-options'].children.every(b=>b.disabled));
  ui.ids['answer-form'].dispatch('submit');assert.equal(g.state.history.length,1);
  ui.click('next-button');assert.equal(ui.ids.prompt.focused,true);assert.ok(ui.radios.every(r=>!r.checked));assert.equal(ui.ids['lock-answer'].disabled,true);
});

test('UI: complete a real mixed campaign, show boss shields, report and replay misses',()=>{
  assert.equal(typeof CampaignGame,'function');
  const g=new CampaignGame({storage:null});const ui=setup(g);ui.ids['domain-select'].value='mixed';ui.click('start-session');
  let n=0;while(g.currentQuestion()){choose(ui,g,n!==0);ui.click('next-button');assert.ok(++n<100);}
  assert.equal(ui.ids.completion.hidden,false);assert.equal(ui.ids.arena.hidden,true);assert.match(ui.ids['completion-summary'].textContent,/Mission complete/);
  assert.match(ui.ids['boss-status'].textContent,/4\/4/);assert.equal(ui.ids['replay-missed'].disabled,true);
  // The review repaired the miss. Make an additional miss to exercise replay UI.
  g.startSession(4); const q=g.currentQuestion();g.answer(q.options.find(o=>o!==q.answer),3);g.nextQuestion();
  const replayUI=setup(g);replayUI.click('share-report');assert.equal(replayUI.ids['report-text'].value,g.studyReport());assert.equal(replayUI.ids['report-panel'].hidden,false);
  const xp=g.state.xp;replayUI.click('replay-missed');assert.equal(g.session.mode,'missed');assert.equal(g.state.xp,xp);
  replayUI.click('reset-progress');assert.equal(g.state.xp,0);assert.equal(replayUI.ids.arena.hidden,true);
});

test('UI: resumed feedback stays locked, storage warning and empty replay are safe',()=>{
  assert.equal(typeof CampaignGame,'function');
  const g=new CampaignGame({storage:null});g.startSession(1);g.answer(g.currentQuestion().answer,1);
  const ui=setup(g);assert.equal(ui.ids['lock-answer'].disabled,true);assert.equal(ui.ids['next-button'].hidden,false);assert.match(ui.ids['storage-status'].textContent,/not being saved/i);
  assert.equal(ui.ids['replay-missed'].disabled,true);assert.ok(ui.ids.feedback.textContent.includes(g.currentQuestion().explanation));
});
