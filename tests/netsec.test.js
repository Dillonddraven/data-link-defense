'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { NETSEC_BANK, NETSEC_UNITS, NetsecGame, NETSEC_STORAGE_KEY } = require('../netsec-app.js');

const FIXED_NOW = '2026-10-08T15:30:00.000Z';
const make = () => new NetsecGame({ storage: null, seed: 17, now: () => FIXED_NOW });
const wrongFor = q => q.type === 'choice' ? q.options.find(x => x !== q.answer) : q.type === 'numeric' ? String(Number(q.answer) + 1) : q.options.slice().reverse();
const answer = (game, correct=true, confidence=2) => game.answer(correct ? game.currentQuestion().answer : wrongFor(game.currentQuestion()), confidence);

test('netsec bank maps substantive practice across each provisional week 1–6 scope unit', () => {
  assert.equal(Object.keys(NETSEC_UNITS).length, 6);
  assert.ok(NETSEC_BANK.length >= 36);
  assert.equal(new Set(NETSEC_BANK.map(q => q.id)).size, NETSEC_BANK.length);
  assert.equal(new Set(NETSEC_BANK.map(q => q.prompt.trim().toLowerCase())).size, NETSEC_BANK.length);
  for (const unit of Object.keys(NETSEC_UNITS).map(Number)) {
    const items = NETSEC_BANK.filter(q => q.unit === unit);
    assert.ok(items.length >= 6, `unit ${unit} has ${items.length}`);
    assert.ok(items.some(q => q.type !== 'choice'), `unit ${unit} needs retrieval beyond MCQ`);
  }
  for (const q of NETSEC_BANK) {
    assert.equal(q.unitName, NETSEC_UNITS[q.unit]);
    for (const field of ['concept','prompt','explanation','sourceLabel','sourceUrl']) assert.ok(typeof q[field] === 'string' && q[field].length > 4, `${q.id}: ${field}`);
    assert.match(q.sourceUrl, /^https:\/\//);
    assert.ok(['choice','numeric','order'].includes(q.type), `${q.id}: type`);
    if (q.type === 'choice') {
      assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.ok(q.options.includes(q.answer));
      for (const option of q.options) assert.ok(q.rationales[option]?.length > 18, `${q.id}: rationale`);
    }
    if (q.type === 'numeric') { assert.ok(Number.isFinite(Number(q.answer))); assert.ok(Number.isFinite(q.tolerance)); }
    if (q.type === 'order') { assert.deepEqual(new Set(q.options), new Set(q.answer)); assert.notDeepEqual(q.options, q.answer, `${q.id}: order tiles must not start solved`); }
  }
  for (const concept of ['stop-and-wait','4B/5B','sequence number','ARP','fragmentation','TTL','traceroute','subnet']) {
    assert.match(NETSEC_BANK.map(q => `${q.concept} ${q.prompt}`).join(' '), new RegExp(concept,'i'), concept);
  }
});

test('netsec defaults to finite five-question micro sessions selectable by syllabus week', () => {
  for (const mode of [1,2,3,4,5,6,'mixed']) {
    const g = make(); assert.equal(g.startSession(mode), true);
    const units = g.session.deck.map(id => NETSEC_BANK.find(q => q.id === id).unit);
    assert.equal(g.session.baseLength, 5);
    assert.equal(g.session.deck.length, 5);
    if (mode !== 'mixed') assert.ok(units.every(u => u === mode));
    else assert.ok(new Set(units).size >= 4, 'mixed micro review must interleave syllabus weeks');
    let guard=0; while(g.currentQuestion()) { if (!g.session.feedback) answer(g); g.nextQuestion(); assert.ok(++guard < 20); }
    assert.equal(g.session.complete, true);
  }
});

test('Replay missed keeps the five-retrieval contract while putting unresolved items first', () => {
  assert.equal(make().startSession('missed'),false);
  const g=make();g.startSession(2);const missed=g.currentQuestion().id;answer(g,false,2);g.nextQuestion();
  while(g.currentQuestion()){answer(g);g.nextQuestion();}
  assert.equal(g.startSession('missed'),true);
  assert.equal(g.session.baseLength,5);
  assert.equal(g.session.deck.length,5);
  assert.equal(g.session.deck[0],missed);
});

test('netsec syllabus coverage names every saved Weeks 1–6 outline topic', () => {
  const names=Object.values(NETSEC_UNITS).join(' ');
  for (const topic of ['Introduction to Networking & Metrics','Networking Software & Architectures','Direct Link & Packet Switching Networks','Auxiliary and End-to-End Protocols for IP','Internetworking & IP','IP Scalability & Subnetting']) assert.match(names,new RegExp(topic.replace('&','&?'),'i'));
  const text=NETSEC_BANK.map(q=>JSON.stringify(q)).join(' ');
  for(const required of ['Selective Repeat','Go-Back-N','half-sequence-space','8-byte units','IPv4 Identification','Echo identifier','80%','25% expansion','classic Linux UDP traceroute','Port Unreachable','default gateway','new link-layer header','/31','/32']) assert.match(text,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),required);
  const scopedLabels=NETSEC_BANK.map(q=>`${q.concept} ${q.unitName}`).join(' ');
  assert.doesNotMatch(scopedLabels,/cloud security|security perimeter|BGP|intradomain|interdomain/i,'Weeks 9+ material must not leak into the default bank');
});

test('netsec grading supports choice, numeric tolerance, and exact ordering', () => {
  for (const type of ['choice','numeric','order']) {
    const q=NETSEC_BANK.find(q=>q.type===type); const g=make(); g.startSession(q.unit,[q.id]);
    assert.equal(answer(g,true,3).correct,true);
    assert.throws(()=>answer(g,true,3),/already/i);
  }
  const numeric=NETSEC_BANK.find(q=>q.type==='numeric'&&q.tolerance>0); const g=make(); g.startSession(numeric.unit,[numeric.id]);
  assert.equal(g.answer(Number(numeric.answer)+numeric.tolerance,2).correct,true);
});

test('an incomplete ordering cannot be scored or added to response history', () => {
  const q=NETSEC_BANK.find(q=>q.type==='order'),g=make();g.startSession(q.unit,[q.id]);
  assert.throws(()=>g.answer(q.options.slice(0,-1),2),/valid answer/i);
  assert.equal(g.state.history.length,0);
  assert.equal(g.session.answered,0);
  assert.equal(g.session.feedback,null);
});

test('confidence is mandatory; a miss waits through the remaining micro-session then leads the next focus', () => {
  const g=make(); g.startSession(3); const first=g.currentQuestion().id;
  assert.throws(()=>g.answer(g.currentQuestion().answer),/confidence/i);
  answer(g,false,3); g.nextQuestion();
  while(g.currentQuestion()){assert.notEqual(g.currentQuestion().id,first);answer(g);g.nextQuestion();}
  assert.equal(g.session.answered,5);
  assert.equal(g.summary().confidentMisses,1);
  g.startSession(3);assert.equal(g.currentQuestion().id,first);
});

test('a saved miss is included in the next mixed micro-session without growing past five', () => {
  const g=make();g.startSession(1);const missed=g.currentQuestion().id;answer(g,false,2);g.nextQuestion();
  while(g.currentQuestion()){answer(g);g.nextQuestion();}
  g.startSession('mixed');
  assert.equal(g.session.deck.length,5);
  assert.ok(g.session.deck.includes(missed));
  assert.ok(new Set(g.session.deck.map(id=>NETSEC_BANK.find(q=>q.id===id).unit)).size>=4);
});

test('new responses receive stable attempt/session identifiers and real capture times in the detailed manual report',()=>{
  const g=make();g.startSession(4);const q=g.currentQuestion();answer(g,false,1);
  const h=g.state.history[0];
  assert.match(g.session.id,/^session-/);assert.equal(g.session.startedAt,FIXED_NOW);
  assert.match(h.attemptId,/^attempt-/);assert.equal(h.sessionId,g.session.id);assert.equal(h.answeredAt,FIXED_NOW);
  const report=g.report();
  for(const value of [h.attemptId,FIXED_NOW,q.prompt,q.concept,'Confidence: 1/3','Result: incorrect','Correct answer:'])assert.ok(report.includes(value),value);
  assert.match(report,/Nothing is sent automatically/);
});

test('v1 progress migrates all ten saved responses without changing the old key or inventing historic timestamps',()=>{
  const history=NETSEC_BANK.slice(0,10).map((q,index)=>({id:q.id,correct:index<8,confidence:index===0?1:2,response:index<8?q.answer:wrongFor(q)}));
  const old={version:1,xp:800,sessionsStarted:2,history,missed:{[history[8].id]:true,[history[9].id]:true},session:null};
  const oldRaw=JSON.stringify(old),data=new Map([['sentinel-netsec-midterm-v1',oldRaw]]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:1,now:()=>FIXED_NOW});
  assert.equal(g.state.version,2);assert.deepEqual(g.state.history,old.history);
  assert.equal(g.state.history.length,10);assert.equal(g.summary().correct,8);
  assert.equal(data.get('sentinel-netsec-midterm-v1'),oldRaw);
  assert.ok(data.has(NETSEC_STORAGE_KEY));
  assert.match(g.report(),/Detailed responses \(10\):/);
  assert.match(g.report(),/Attempt ID: unavailable \(saved before detailed reporting\)/);
  assert.match(g.report(),/Answered at: unavailable \(saved before detailed reporting\)/);
});

test('migration preserves a legacy partial order response that the v1 UI could score',()=>{
  const q=NETSEC_BANK.find(q=>q.type==='order'),response=q.options.slice(0,1),data=new Map();
  const old={version:1,xp:0,sessionsStarted:1,history:[{id:q.id,correct:false,confidence:2,response}],missed:{[q.id]:true},session:null};
  data.set('sentinel-netsec-midterm-v1',JSON.stringify(old));
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const migrated=new NetsecGame({storage,seed:1,now:()=>FIXED_NOW});
  assert.deepEqual(migrated.state.history,old.history);
  const restored=new NetsecGame({storage,seed:1,now:()=>FIXED_NOW});
  assert.deepEqual(restored.state.history,old.history);
  assert.match(restored.report(),new RegExp(`Your response: ${response[0]}`));
});

test('a migrated active v1 session can record a new timed answer and reload without inventing its start time',()=>{
  const q=NETSEC_BANK[0],data=new Map();
  const old={version:1,xp:0,sessionsStarted:1,history:[],missed:{},session:{mode:1,deck:[q.id],baseLength:1,index:0,answered:0,correct:0,xpStart:0,complete:false,feedback:null,reviewed:{}}};
  data.set('sentinel-netsec-midterm-v1',JSON.stringify(old));
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:1,now:()=>FIXED_NOW});answer(g,true,2);
  assert.equal(g.session.startedAt,undefined);assert.match(g.session.id,/^continued-session-/);
  const restored=new NetsecGame({storage,seed:1,now:()=>FIXED_NOW});
  assert.equal(restored.state.history.length,1);assert.equal(restored.session.feedback.correct,true);assert.equal(restored.session.startedAt,undefined);
});

test('reload restores the exact active micro-session and answer lock without duplicate scoring',()=>{
  const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:9,now:()=>FIXED_NOW});g.startSession(5);const id=g.currentQuestion().id;answer(g,true,3);const xp=g.state.xp;
  const restored=new NetsecGame({storage,seed:9,now:()=>FIXED_NOW});assert.equal(restored.currentQuestion().id,id);assert.equal(restored.session.feedback.correct,true);
  assert.throws(()=>restored.answer(restored.currentQuestion().answer,3),/already/i);assert.equal(restored.state.xp,xp);assert.equal(restored.state.history.length,1);
});

test('netsec progress uses a distinct versioned key and ignores CISSP/legacy keys', () => {
  const data=new Map([['sentinel-cissp-progress-v2','keep-cissp'],['data-link-defense-progress','keep-legacy']]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:3}); g.startSession(1); answer(g);
  assert.match(NETSEC_STORAGE_KEY,/netsec.*v2/); assert.ok(data.has(NETSEC_STORAGE_KEY));
  assert.equal(data.get('sentinel-cissp-progress-v2'),'keep-cissp'); assert.equal(data.get('data-link-defense-progress'),'keep-legacy');
});

test('netsec page is a direct phone-friendly launch with provisional scope and privacy boundaries', () => {
  const html=fs.readFileSync(path.join(__dirname,'../netsec.html'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
  for (const pattern of [/CYB 7223/,/October 9, 2026/,/provisional/i,/Weeks 1–6/,/id="start-session"/,/id="confidence"/,/id="replay-missed"/,/detailed report/i,/local/i,/book\.systemsapproach\.org/]) assert.match(html,pattern);
  const privateMarkers=new RegExp(['/','Users','/','|elli','otbot','|course','work/'].join(''),'i');
  assert.doesNotMatch(html,privateMarkers);
  assert.match(html,/netsec-app\.js\?v=[a-z0-9.-]+/i);
  for(const pattern of [/min-height:\s*44px/,/:focus-visible/,/prefers-reduced-motion/,/@media\s*\(max-width:\s*720px\)/]) assert.match(css,pattern);
});
