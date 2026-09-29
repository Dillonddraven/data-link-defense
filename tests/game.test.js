'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { QUESTION_BANK, CampaignGame, DOMAINS, STORAGE_KEY, LEGACY_KEY } = require('../app.js');
const memory = () => { const data = new Map(); return { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) }; };
const make = (opts = {}) => new CampaignGame({ storage: null, seed: 7, ...opts });
const answer = (g, correct = true, confidence = 2) => g.answer(correct ? g.currentQuestion().answer : g.currentQuestion().options.find(o => o !== g.currentQuestion().answer), confidence);
function finish(g, correct = true) { let n = 0; while(g.currentQuestion()) { if (!g.session.feedback) answer(g, correct); g.nextQuestion(); assert.ok(++n < 150, 'session must terminate'); } }

test('bank: 64 substantive questions cover four named domains with sound metadata', () => {
  assert.ok(QUESTION_BANK.length >= 60);
  assert.equal(new Set(QUESTION_BANK.map(q => q.id)).size, QUESTION_BANK.length);
  for (const d of [1,2,3,4]) {
    const qs = QUESTION_BANK.filter(q => q.domain === d);
    assert.ok(qs.length >= 15, `Domain ${d}`);
    assert.ok(qs.some(q => q.boss));
    assert.ok(new Set(qs.map(q => q.options.indexOf(q.answer))).size >= 3);
  }
  for (const q of QUESTION_BANK) {
    assert.equal(q.domainName, DOMAINS[q.domain]);
    for (const key of ['concept','mission','prompt','explanation']) assert.ok(typeof q[key] === 'string' && q[key].length > 4, `${q.id} ${key}`);
    assert.ok(q.prompt.length > 45);
    assert.equal(q.type, 'choice');
    assert.ok([1,2,3].includes(q.level));
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer));
    for (const option of q.options) assert.ok(q.rationales[option]?.length > 20, `${q.id}: rationale ${option}`);
  }
  assert.ok(QUESTION_BANK.filter(q => q.scenario && /\b(FIRST|BEST|MOST)\b/.test(q.prompt)).length / QUESTION_BANK.length >= .25);
  const concepts = QUESTION_BANK.map(q => q.concept).join(' ');
  for (const key of ['ethics','CIA','governance','risk','legal','BCP','classification','lifecycle','ownership','retention','destruction','privacy','models','crypto','PKI','physical','cloud','vulnerabilities','OSI','TCP','segmentation','wireless','IPsec','remote access']) assert.ok(concepts.includes(key), key);
});

test('selection: domain-only and balanced mixed finite decks with deterministic boss finale', () => {
  for (const domain of [1,2,3,4,'mixed']) {
    const g = make(); g.startSession(domain);
    const qs = g.session.deck.map(id => QUESTION_BANK.find(q => q.id === id));
    assert.equal(new Set(g.session.deck).size, g.session.deck.length);
    if (domain !== 'mixed') assert.ok(qs.every(q => q.domain === domain));
    else for (const d of [1,2,3,4]) assert.equal(qs.filter(q => q.domain === d).length, 4);
    assert.ok(qs.at(-1).boss);
    assert.deepEqual(g.session.deck, (() => { const h = make(); h.startSession(domain); return h.session.deck; })());
    finish(g); assert.equal(g.session.complete, true); assert.equal(g.currentQuestion(), null);
    assert.throws(() => answer(g), /./);
  }
});

test('confidence: all answers require valid confidence and response; duplicates cannot farm XP', () => {
  const g = make(); g.startSession(1); const q = g.currentQuestion();
  for (const c of [undefined,0,4,'3',NaN]) assert.throws(() => g.answer(q.answer,c), /confidence/i);
  assert.throws(() => g.answer('__invalid__',2), /answer/i);
  assert.equal(g.state.history.length,0);
  const r = g.answer(q.answer,3);
  assert.equal(r.correct,true); assert.equal(r.explanation,q.explanation);
  assert.deepEqual(r.rationales,q.rationales);
  assert.equal(g.state.history.at(-1).confidence,3);
  assert.equal(g.state.streak,1);
  const xp = g.state.xp;
  assert.throws(() => g.answer(q.answer,3), /already/i);
  assert.equal(g.state.xp,xp);
});

test('retrieval: missed prompt waits for two intervening answers and retries only once', () => {
  const g = make(); g.startSession(1); const first = g.currentQuestion().id;
  answer(g,false,3); g.nextQuestion(); assert.notEqual(g.currentQuestion().id,first);
  answer(g); g.nextQuestion(); assert.notEqual(g.currentQuestion().id,first);
  answer(g); g.nextQuestion(); assert.equal(g.currentQuestion().id,first);
  answer(g,false,2); g.nextQuestion();
  finish(g,false); assert.equal(g.state.history.filter(h => h.id === first).length,2);
  assert.ok(g.replayMissedDeck().some(q => q.id === first));
});

test('late misses defer to replay rather than immediate repetition or endless boss', () => {
  const g = make(); g.startSession(2);
  while (!g.currentQuestion().boss) { answer(g); g.nextQuestion(); }
  const q = g.currentQuestion(); answer(g,false); g.nextQuestion();
  assert.equal(g.session.complete,true); assert.ok(g.replayMissedDeck().some(x => x.id === q.id));
  const xp = g.state.xp; g.startSession('missed'); assert.equal(g.currentQuestion().id,q.id);
  assert.equal(g.state.xp,xp); assert.equal(g.session.deck.length,1);
  answer(g); g.nextQuestion(); assert.equal(g.session.complete,true);
  assert.equal(g.replayMissedDeck().length,0);
  assert.equal(g.startSession('missed'),false);
});

test('progression: combo, rank, calibration, domain accuracy and manual report reflect real attempts', () => {
  const g = make(); g.startSession(3); answer(g,false,3); g.nextQuestion(); answer(g,true,1); g.nextQuestion(); answer(g,true,2);
  const r = g.masteryBreakdown();
  assert.equal(r.totalAnswered,3); assert.equal(r.totalCorrect,2);
  assert.equal(r.domains[3].answered,3); assert.equal(r.domains[1].answered,0);
  assert.equal(r.calibration.confidentMisses,1); assert.equal(r.calibration.luckyGuesses,1);
  assert.equal(g.state.streak,2); assert.ok(g.state.xp > 200);
  assert.equal(g.rank(),'Cadet');
  const report = g.studyReport(); assert.match(report,/Elliott/); assert.match(report,/Domain 3/); assert.match(report,/Confident misses: 1/); assert.match(report,/Missed topics:/);
  g.nextQuestion(); finish(g); assert.notEqual(g.rank(),'Cadet');
});

test('boss: four deterministic decisions earn shields and bonus only if all are correct', () => {
  for (const win of [true,false]) {
    const g = make(); g.startSession('mixed');
    while(!g.currentQuestion().boss) { answer(g); g.nextQuestion(); }
    const bosses = [];
    while(g.currentQuestion()) { bosses.push(g.currentQuestion().domain); answer(g,win); g.nextQuestion(); }
    assert.deepEqual(bosses,[1,2,3,4]);
    assert.equal(g.session.boss.shields, win ? 4 : 0);
    assert.equal(g.session.boss.bonus, win ? 200 : 0);
    const xp = g.state.xp; g.nextQuestion(); assert.equal(g.state.xp,xp);
  }
});

test('persistence: reload resumes locked answer and spaced queue without duplicate rewards', () => {
  const storage = memory(); const g = make({ storage }); g.startSession(4); const id = g.currentQuestion().id;
  answer(g,false,3); const h = make({ storage });
  assert.equal(h.currentQuestion().id,id); assert.equal(h.session.feedback.correct,false);
  assert.throws(() => h.answer(h.currentQuestion().answer,2), /already/);
  h.nextQuestion(); answer(h); h.nextQuestion(); answer(h); h.nextQuestion(); assert.equal(h.currentQuestion().id,id);
  finish(h); const reloaded = make({storage}); assert.equal(reloaded.session.complete,true);
  assert.equal(reloaded.state.xp,h.state.xp); assert.ok(storage.getItem(STORAGE_KEY));
});

test('persistence: missing feedback cannot unlock a recorded answer or award duplicate XP', () => {
  const storage = memory(); const g = make({storage}); g.startSession(1); answer(g);
  const tampered = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(tampered.history.length,1); assert.equal(tampered.xp,120);
  tampered.session.feedback = null;
  storage.setItem(STORAGE_KEY,JSON.stringify(tampered));
  const restored = make({storage}); const xp = restored.state.xp; const attempts = restored.state.history.length;
  assert.throws(() => restored.answer(g.currentQuestion().answer,2), /already|No active question/);
  assert.equal(restored.state.history.length,attempts);
  assert.equal(restored.state.xp,xp);
});

test('persistence: session progress must agree with its history suffix and feedback', () => {
  const corruptions = [
    s => { s.session.answered = 0; },
    s => { s.history = []; },
    s => { s.history.at(-1).id = 'd2-1'; },
    s => { s.session.feedback.confidence = 1; },
    s => { s.session.correct = 0; },
    s => { s.history.at(-1).correct = false; s.session.feedback.correct = false; s.session.correct = 0; }
  ];
  for (const corrupt of corruptions) {
    const storage = memory(); const g = make({storage}); g.startSession(1); answer(g);
    const saved = JSON.parse(storage.getItem(STORAGE_KEY)); corrupt(saved);
    storage.setItem(STORAGE_KEY,JSON.stringify(saved));
    assert.equal(make({storage}).session,null,'inconsistent session must be safely rejected');
  }
});

test('persistence: reload preserves every valid transition including repeated IDs and new sessions', () => {
  const storage = memory(); let g = make({storage});
  for (const mode of [1,'mixed','missed']) {
    g.startSession(mode);
    while (g.currentQuestion()) {
      const before = structuredClone(g.state); g = make({storage}); assert.deepEqual(g.state,before);
      answer(g,false,3);
      const locked = structuredClone(g.state); g = make({storage}); assert.deepEqual(g.state,locked);
      assert.throws(() => answer(g), /already/); g.nextQuestion();
    }
    const completed = structuredClone(g.state); g = make({storage}); assert.deepEqual(g.state,completed);
  }
});

test('migration: retains legacy totals and missed topic notes without inventing domain/confidence stats', () => {
  const storage = memory(); const old = JSON.stringify({ score:480,answered:5,correct:3,missed:{'stop-and-wait':2},history:[{id:'sw-purpose',correct:false}] });
  storage.setItem(LEGACY_KEY,old); const g = make({storage});
  assert.equal(g.state.xp,480); assert.equal(g.state.legacy.answered,5);
  assert.equal(g.state.legacy.missed['stop-and-wait'],2);
  assert.equal(g.masteryBreakdown().totalAnswered,0);
  assert.equal(g.masteryBreakdown().calibration.confidentMisses,0);
  assert.equal(storage.getItem(LEGACY_KEY),old); assert.match(g.studyReport(),/Legacy/);
  g.startSession(1); answer(g); const h = make({storage}); assert.equal(h.state.xp,g.state.xp);
});

test('storage: malformed and blocked storage degrade safely; resetting clears only campaign state', () => {
  for (const raw of ['{','null','[]','{"version":2,"xp":"oops","session":{"deck":["missing"]}}']) {
    const s = memory(); s.setItem(STORAGE_KEY,raw); const g = make({storage:s}); g.startSession(1); answer(g); assert.ok(Number.isFinite(g.state.xp));
  }
  const g = make({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('quota');}}});
  g.startSession(1); answer(g); assert.equal(g.storageAvailable,false); g.reset(); assert.equal(g.state.xp,0);
  const s = memory(); s.setItem('unrelated','keep'); const h = make({storage:s}); h.startSession(1); answer(h); h.reset(); assert.equal(s.getItem('unrelated'),'keep'); assert.equal(h.state.history.length,0);
});

test('shell: accessible, mobile, local-only campaign with credible source links', () => {
  const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'); const css = fs.readFileSync(path.join(__dirname,'../styles.css'),'utf8');
  for(const pattern of [/<main\b/, /<section\b[^>]*aria-labelledby=/, /aria-live="polite"/, /<fieldset/, /<legend/, /id="confidence"/, /id="completion"/, /id="domain-select"/, /id="share-report"/, /Elliott/, /locally in this browser/, /Roediger.*Karpicke/, /Dunlosky/, /Butler/, /isc2.org\/certifications\/cissp\/cissp-certification-exam-outline/]) assert.match(html,pattern);
  for(const pattern of [/min-height:\s*44px/, /:focus-visible/, /prefers-reduced-motion/, /@media\s*\(max-width:\s*720px\)/]) assert.match(css,pattern);
  assert.match(html, /styles\.css\?v=[a-z0-9.-]+/i, 'versioned stylesheet prevents stale deploy assets');
  assert.match(html, /questions\.js\?v=[a-z0-9.-]+/i, 'versioned question bank prevents stale deploy assets');
  assert.match(html, /app\.js\?v=[a-z0-9.-]+/i, 'versioned app prevents stale deploy assets');
  assert.doesNotMatch(html, /https?:[^"']+\.js/);
});
