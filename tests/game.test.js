const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = {
  html: path.join(root, 'index.html'),
  css: path.join(root, 'styles.css'),
  js: path.join(root, 'app.js'),
};

function readRequired(filePath) {
  assert.ok(fs.existsSync(filePath), `Missing required file: ${path.basename(filePath)}`);
  return fs.readFileSync(filePath, 'utf8');
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function loadGameModule() {
  delete require.cache[require.resolve(files.js)];
  return require(files.js);
}

test('single-page app ships semantic, accessible game shell', () => {
  const html = readRequired(files.html);
  assert.match(html, /<main\b/i, 'uses a main landmark');
  assert.match(html, /<section\b[^>]*aria-labelledby=/i, 'sections are labelled');
  assert.match(html, /<button\b/i, 'uses semantic buttons for play controls');
  assert.match(html, /aria-live="polite"/i, 'has polite live region for feedback');
  assert.match(html, /id="answer-options"/i, 'has answer option container');
  assert.match(html, /About the learning design/i, 'includes learning-design about section');
  assert.doesNotMatch(html, /source slot|placeholder/i, 'contains no unfinished citation placeholders');
  assert.match(html, /Roediger.*Karpicke/i, 'credits retrieval-practice research');
  assert.match(html, /Dunlosky/i, 'credits high-utility learning-techniques review');
  assert.match(html, /book\.systemsapproach\.org\/direct\/(reliable|encoding|framing|error)\.html/i, 'links technical networking references');
});

test('question bank covers every requested networking concept with explanations', () => {
  const { QUESTION_BANK } = loadGameModule();
  assert.ok(Array.isArray(QUESTION_BANK), 'QUESTION_BANK is exported');
  assert.ok(QUESTION_BANK.length >= 27, `expected at least 27 prompts, got ${QUESTION_BANK.length}`);
  const requiredConcepts = [
    'stop-and-wait',
    '1-bit-sequence-numbers',
    'sliding-window-acks',
    'window-size-constraint',
    '4b5b-efficiency',
    'nrz-clock-recovery',
    'nrz-baseline-wander',
    'hdlc-bit-stuffing',
    'byte-oriented-syn-stx-etx',
    'error-detection-vs-correction',
  ];
  for (const concept of requiredConcepts) {
    assert.ok(QUESTION_BANK.some((q) => q.concept === concept), `missing concept ${concept}`);
  }
  for (const q of QUESTION_BANK) {
    assert.ok(q.prompt && q.prompt.length > 20, `prompt too short for ${q.id}`);
    assert.ok(q.explanation && q.explanation.length > 35, `missing explanation for ${q.id}`);
    assert.ok(q.mission && q.mission.length > 0, `missing mission text for ${q.id}`);
  }
});

test('game uses mixed question formats instead of a plain quiz', () => {
  const { QUESTION_BANK } = loadGameModule();
  const formats = new Set(QUESTION_BANK.map((q) => q.type));
  for (const format of ['choice', 'true-false', 'numeric', 'order']) {
    assert.ok(formats.has(format), `missing format ${format}`);
  }
});

test('order questions require retrieval instead of displaying the answer sequence', () => {
  const { QUESTION_BANK } = loadGameModule();
  const normalizeOrder = (parts) => parts.map(String).join('|');
  const orderQuestions = QUESTION_BANK.filter((q) => q.type === 'order');
  assert.ok(orderQuestions.length >= 3, 'has several ordering challenges');
  for (const q of orderQuestions) {
    assert.notEqual(normalizeOrder(q.options), normalizeOrder(q.answer), `order prompt ${q.id} displays its answer in order`);
  }
});

test('answering updates score, streak, energy, explanations, and missed resurfacing', () => {
  const { DataLinkDefenseGame, QUESTION_BANK } = loadGameModule();
  const store = new Map();
  const storage = {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  const game = new DataLinkDefenseGame({ storage, questions: QUESTION_BANK.slice(0, 8), seed: 7 });
  const first = game.currentQuestion();
  const wrong = game.answer(first.type === 'true-false' ? !first.answer : '__wrong__');
  assert.equal(wrong.correct, false, 'wrong answer is marked incorrect');
  assert.ok(wrong.explanation.includes(first.explanation.slice(0, 24)), 'feedback returns explanation');
  assert.equal(game.state.energy, 2, 'wrong answer costs energy');
  assert.equal(game.state.streak, 0, 'wrong answer resets streak');
  assert.ok(game.state.missed[first.concept] >= 1, 'missed concept is tracked');
  const resurfaced = game.nextQuestion();
  assert.equal(resurfaced.id, first.id, 'missed prompt resurfaces immediately for retrieval practice');
  const right = game.answer(resurfaced.answer);
  assert.equal(right.correct, true, 'correct answer is marked correct');
  assert.ok(game.state.score > 0, 'correct answer adds score');
  assert.equal(game.state.streak, 1, 'correct answer builds streak');
  assert.ok(storage.getItem('data-link-defense-progress'), 'progress persists locally');
});

test('mastery report exposes concept breakdown and replay-missed mode', () => {
  const { DataLinkDefenseGame, QUESTION_BANK } = loadGameModule();
  const game = new DataLinkDefenseGame({ storage: null, questions: QUESTION_BANK.slice(0, 12), seed: 3 });
  const q = game.currentQuestion();
  game.answer('__wrong__');
  const report = game.masteryBreakdown();
  assert.ok(report.totalAnswered >= 1, 'report counts answered prompts');
  assert.ok(report.concepts[q.concept], 'report includes concept row');
  assert.ok(report.concepts[q.concept].missed >= 1, 'report includes misses');
  const missedDeck = game.replayMissedDeck();
  assert.ok(missedDeck.some((item) => item.concept === q.concept), 'replay-missed deck includes missed concepts');
});

test('styles are polished, responsive, and mobile-friendly', () => {
  const css = readRequired(files.css);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/i, 'has mobile breakpoint');
  assert.match(css, /min-height:\s*44px/i, 'touch targets meet mobile size guidance');
  assert.match(css, /linear-gradient|radial-gradient/i, 'uses visual polish beyond default styles');
  assert.match(css, /:focus-visible/i, 'has visible keyboard focus state');
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
    break;
  }
}
if (!process.exitCode) {
  console.log(`\n${passed}/${tests.length} tests passed`);
}
