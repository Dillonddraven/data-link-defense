'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { NETSEC_BANK, NETSEC_UNITS, NetsecGame, NETSEC_STORAGE_KEY } = require('../netsec-app.js');

const make = () => new NetsecGame({ storage: null, seed: 17 });
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

test('confidence is mandatory; a miss waits through the remaining micro-session then leads the next focus', () => {
  const g=make(); g.startSession(3); const first=g.currentQuestion().id;
  assert.throws(()=>g.answer(g.currentQuestion().answer),/confidence/i);
  answer(g,false,3); g.nextQuestion();
  while(g.currentQuestion()){assert.notEqual(g.currentQuestion().id,first);answer(g);g.nextQuestion();}
  assert.equal(g.session.answered,5);
  assert.equal(g.summary().confidentMisses,1);
  g.startSession(3);assert.equal(g.currentQuestion().id,first);
});

test('reload restores the exact active micro-session and answer lock without duplicate scoring',()=>{
  const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:9});g.startSession(5);const id=g.currentQuestion().id;answer(g,true,3);const xp=g.state.xp;
  const restored=new NetsecGame({storage,seed:9});assert.equal(restored.currentQuestion().id,id);assert.equal(restored.session.feedback.correct,true);
  assert.throws(()=>restored.answer(restored.currentQuestion().answer,3),/already/i);assert.equal(restored.state.xp,xp);assert.equal(restored.state.history.length,1);
});

test('netsec progress uses a distinct versioned key and ignores CISSP/legacy keys', () => {
  const data=new Map([['sentinel-cissp-progress-v2','keep-cissp'],['data-link-defense-progress','keep-legacy']]);
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  const g=new NetsecGame({storage,seed:3}); g.startSession(1); answer(g);
  assert.match(NETSEC_STORAGE_KEY,/netsec/); assert.ok(data.has(NETSEC_STORAGE_KEY));
  assert.equal(data.get('sentinel-cissp-progress-v2'),'keep-cissp'); assert.equal(data.get('data-link-defense-progress'),'keep-legacy');
});

test('netsec page is a direct phone-friendly launch with provisional scope and privacy boundaries', () => {
  const html=fs.readFileSync(path.join(__dirname,'../netsec.html'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
  for (const pattern of [/CYB 7223/,/October 9, 2026/,/provisional/i,/Weeks 1–6/,/id="start-session"/,/id="confidence"/,/id="replay-missed"/,/local/i,/book\.systemsapproach\.org/]) assert.match(html,pattern);
  const privateMarkers=new RegExp(['/','Users','/','|elli','otbot','|course','work/'].join(''),'i');
  assert.doesNotMatch(html,privateMarkers);
  assert.match(html,/netsec-app\.js\?v=[a-z0-9.-]+/i);
  for(const pattern of [/min-height:\s*44px/,/:focus-visible/,/prefers-reduced-motion/,/@media\s*\(max-width:\s*720px\)/]) assert.match(css,pattern);
});
