(() => {
  'use strict';

  const STORAGE_KEY = 'data-link-defense-progress';

  const QUESTION_BANK = [
    {
      id: 'sw-purpose', concept: 'stop-and-wait', type: 'choice', mission: 'Gate Alpha: keep a single frame safe.',
      prompt: 'In stop-and-wait ARQ, why does the sender transmit only one frame before waiting?',
      options: ['To avoid needing any acknowledgments', 'To keep one outstanding frame until an ACK confirms safe arrival', 'To double the link bandwidth', 'To let the receiver choose the next protocol'],
      answer: 'To keep one outstanding frame until an ACK confirms safe arrival',
      explanation: 'Stop-and-wait keeps at most one unacknowledged frame in flight, so a timeout or ACK clearly refers to that one frame.', level: 1
    },
    {
      id: 'sw-throughput', concept: 'stop-and-wait', type: 'choice', mission: 'Gate Alpha: identify the bottleneck.',
      prompt: 'What usually hurts stop-and-wait throughput on a long-delay link?',
      options: ['The sender is idle while waiting for each ACK', 'The receiver must buffer every possible frame', 'ACKs are forbidden', 'Frames cannot contain checksums'],
      answer: 'The sender is idle while waiting for each ACK',
      explanation: 'Propagation delay leaves the sender waiting after each frame, so the link may sit unused even when it could carry more frames.', level: 1
    },
    {
      id: 'sw-timeout', concept: 'stop-and-wait', type: 'true-false', mission: 'Gate Alpha: recover the lost drone.',
      prompt: 'True or false: if a stop-and-wait ACK is lost, the sender may retransmit the frame after a timeout.',
      answer: true,
      explanation: 'A lost ACK looks like uncertainty to the sender, so timeout-based retransmission is the safe recovery action.', level: 1
    },
    {
      id: 'seq-one-bit-why', concept: '1-bit-sequence-numbers', type: 'choice', mission: 'Beacon Bravo: tag duplicate frames.',
      prompt: 'Why can stop-and-wait often use a 1-bit sequence number?',
      options: ['Only two states are needed: the current frame and the next expected frame', 'A frame can never be duplicated', 'The sequence field stores the whole packet', 'Receivers ignore sequence numbers'],
      answer: 'Only two states are needed: the current frame and the next expected frame',
      explanation: 'With one outstanding frame, alternating 0 and 1 is enough for the receiver to recognize a duplicate retransmission.', level: 1
    },
    {
      id: 'seq-duplicate', concept: '1-bit-sequence-numbers', type: 'true-false', mission: 'Beacon Bravo: detect the echo.',
      prompt: 'True or false: a repeated 1-bit sequence value can help a receiver spot a duplicate stop-and-wait frame.',
      answer: true,
      explanation: 'If the receiver already accepted sequence 0 and sees sequence 0 again before sequence 1, it can treat it as a duplicate.', level: 1
    },
    {
      id: 'seq-order', concept: '1-bit-sequence-numbers', type: 'order', mission: 'Beacon Bravo: alternate the tags.',
      prompt: 'Put the stop-and-wait sequence numbers in the order a sender uses for four successful frames.',
      options: ['1', '0', '1', '0'], answer: ['0', '1', '0', '1'],
      explanation: 'A 1-bit sequence number alternates 0, 1, 0, 1 so duplicates can be distinguished from the next fresh frame.', level: 1
    },
    {
      id: 'slide-benefit', concept: 'sliding-window-acks', type: 'choice', mission: 'Window City: launch a convoy.',
      prompt: 'What does a sliding window allow compared with stop-and-wait?',
      options: ['Multiple outstanding frames before ACKs arrive', 'No need for any receiver state', 'Frames without addressing', 'Errors without retransmission'],
      answer: 'Multiple outstanding frames before ACKs arrive',
      explanation: 'Sliding windows improve utilization by keeping several frames in flight while ACKs move the send window forward.', level: 2
    },
    {
      id: 'slide-cumulative', concept: 'sliding-window-acks', type: 'choice', mission: 'Window City: interpret the control tower.',
      prompt: 'A cumulative ACK for frame 6 most commonly means what?',
      options: ['Frames up through 6 have been received in order', 'Only frame 6 was corrupted', 'The window size is exactly 6', 'The sender must stop forever'],
      answer: 'Frames up through 6 have been received in order',
      explanation: 'Cumulative ACKs advance the left edge by confirming all in-order frames up to the acknowledged point.', level: 2
    },
    {
      id: 'slide-window-order', concept: 'sliding-window-acks', type: 'order', mission: 'Window City: move the launch rail.',
      prompt: 'Order these events for a sender using a sliding window with cumulative ACKs.',
      options: ['Slide the window forward', 'Send newly allowed frames', 'Send frames within the current window', 'Receive cumulative ACK'],
      answer: ['Send frames within the current window', 'Receive cumulative ACK', 'Slide the window forward', 'Send newly allowed frames'],
      explanation: 'The sender transmits allowed frames, reads ACK progress, advances the window, then uses the newly opened slots.', level: 2
    },
    {
      id: 'window-constraint-choice', concept: 'window-size-constraint', type: 'choice', mission: 'Modulo Moon: avoid old-frame ghosts.',
      prompt: 'Why must a sliding-window protocol limit window size relative to the sequence-number space?',
      options: ['To prevent old duplicate frames from being mistaken for new frames after sequence numbers wrap', 'To make every frame exactly five bits long', 'To remove the need for ACKs', 'To force baseline wander'],
      answer: 'To prevent old duplicate frames from being mistaken for new frames after sequence numbers wrap',
      explanation: 'If the window is too large, wrapped sequence numbers can overlap with delayed duplicates, creating ambiguity.', level: 2
    },
    {
      id: 'window-gbn-numeric', concept: 'window-size-constraint', type: 'numeric', mission: 'Modulo Moon: set the safe Go-Back-N gate.',
      prompt: 'For Go-Back-N with 3-bit sequence numbers, what is the largest safe sender window size?',
      answer: 7, tolerance: 0,
      explanation: 'Three bits give 8 sequence values. Go-Back-N keeps the sender window at most 2^m - 1, so the maximum is 7.', level: 2
    },
    {
      id: 'window-sr-numeric', concept: 'window-size-constraint', type: 'numeric', mission: 'Modulo Moon: set the safe selective-repeat gate.',
      prompt: 'For Selective Repeat with 3-bit sequence numbers, what is the largest safe window size?',
      answer: 4, tolerance: 0,
      explanation: 'Selective Repeat needs sender and receiver windows that do not overlap old wrapped values, so the safe limit is half the sequence space: 4.', level: 2
    },
    {
      id: '4b5b-efficiency', concept: '4b5b-efficiency', type: 'numeric', mission: 'Code Reef: calculate the armor weight.',
      prompt: '4B/5B maps 4 data bits into 5 transmitted bits. What percent efficiency is that?',
      answer: 80, tolerance: 0,
      explanation: 'Efficiency is useful bits divided by transmitted bits: 4/5 = 0.8, so 4B/5B is 80% efficient before other overheads.', level: 2
    },
    {
      id: '4b5b-purpose', concept: '4b5b-efficiency', type: 'choice', mission: 'Code Reef: keep transitions alive.',
      prompt: 'Besides overhead, why is 4B/5B used with line coding systems?',
      options: ['It chooses code groups that help guarantee enough signal transitions', 'It encrypts every frame', 'It removes all redundancy', 'It replaces MAC addresses'],
      answer: 'It chooses code groups that help guarantee enough signal transitions',
      explanation: '4B/5B adds controlled redundancy so transmitted symbols avoid long transition-poor patterns that hurt clock recovery.', level: 2
    },
    {
      id: '4b5b-overhead', concept: '4b5b-efficiency', type: 'choice', mission: 'Code Reef: name the tradeoff.',
      prompt: 'What overhead does 4B/5B add before any other framing or coding overhead?',
      options: ['25% more transmitted bits than raw data bits', '5% fewer transmitted bits', 'No overhead at all', '100% duplicate copies'],
      answer: '25% more transmitted bits than raw data bits',
      explanation: 'Every 4 data bits become 5 code bits. One extra bit per four data bits is 25% overhead relative to the original data.', level: 2
    },
    {
      id: 'nrz-clock', concept: 'nrz-clock-recovery', type: 'choice', mission: 'Signal Station: find the missing rhythm.',
      prompt: 'Why can a long run of identical bits be a problem for NRZ signaling?',
      options: ['Few transitions make it hard for the receiver to recover the clock', 'It always flips all bits', 'It increases the sequence number space', 'It inserts HDLC flags'],
      answer: 'Few transitions make it hard for the receiver to recover the clock',
      explanation: 'NRZ may hold the signal level for many bit times. Without transitions, the receiver has fewer timing cues for clock recovery.', level: 3
    },
    {
      id: 'nrz-baseline', concept: 'nrz-baseline-wander', type: 'choice', mission: 'Signal Station: stabilize the horizon.',
      prompt: 'What is baseline wander in line coding?',
      options: ['A drifting average signal level caused by unbalanced long runs', 'A duplicate ACK strategy', 'A byte-oriented frame delimiter', 'A parity bit that fixes errors'],
      answer: 'A drifting average signal level caused by unbalanced long runs',
      explanation: 'Long unbalanced signal levels can shift the receiver baseline, making it harder to decide whether future symbols are high or low.', level: 3
    },
    {
      id: 'nrz-true', concept: 'nrz-clock-recovery', type: 'true-false', mission: 'Signal Station: trust the transitions.',
      prompt: 'True or false: encoding schemes that force transitions can help receivers maintain clock synchronization.',
      answer: true,
      explanation: 'Transition-rich encodings give the receiver regular timing information, which reduces clock recovery problems.', level: 3
    },
    {
      id: 'hdlc-flag', concept: 'hdlc-bit-stuffing', type: 'choice', mission: 'Flag Fortress: protect the delimiter.',
      prompt: 'In HDLC-style bit stuffing, why is a 0 inserted after five consecutive 1 bits in data?',
      options: ['To prevent data from accidentally containing the flag pattern 01111110', 'To mark a cumulative ACK', 'To make 4B/5B exactly 100% efficient', 'To remove every error'],
      answer: 'To prevent data from accidentally containing the flag pattern 01111110',
      explanation: 'The inserted 0 breaks up runs that could otherwise mimic the HDLC flag delimiter 01111110 inside the payload.', level: 3
    },
    {
      id: 'hdlc-destuff', concept: 'hdlc-bit-stuffing', type: 'order', mission: 'Flag Fortress: reverse the shield.',
      prompt: 'Order the receiver actions for HDLC bit destuffing.',
      options: ['After five 1s remove the stuffed 0', 'Detect opening flag', 'Detect closing flag', 'Scan payload bits'],
      answer: ['Detect opening flag', 'Scan payload bits', 'After five 1s remove the stuffed 0', 'Detect closing flag'],
      explanation: 'The receiver uses flags as boundaries, scans the data field, and removes stuffed 0s that follow five consecutive 1s.', level: 3
    },
    {
      id: 'hdlc-true', concept: 'hdlc-bit-stuffing', type: 'true-false', mission: 'Flag Fortress: separate data from flags.',
      prompt: 'True or false: bit stuffing changes the transmitted payload bits, but the receiver removes the stuffed bits before delivering data.',
      answer: true,
      explanation: 'Bit stuffing is transparent: it protects delimiters on the wire, then destuffing restores the original data bits.', level: 3
    },
    {
      id: 'byte-syn', concept: 'byte-oriented-syn-stx-etx', type: 'choice', mission: 'Byte Harbor: dock the packet.',
      prompt: 'In a byte-oriented framing scheme, what roles do SYN, STX, and ETX commonly play?',
      options: ['SYN helps synchronize, STX starts text, and ETX ends text', 'They are sliding-window sizes', 'They are 4B/5B code rates', 'They are parity correction bits'],
      answer: 'SYN helps synchronize, STX starts text, and ETX ends text',
      explanation: 'Byte-oriented protocols can use special control bytes such as SYN for sync and STX/ETX to mark payload boundaries.', level: 3
    },
    {
      id: 'byte-order', concept: 'byte-oriented-syn-stx-etx', type: 'order', mission: 'Byte Harbor: align the sentinels.',
      prompt: 'Order a simple byte-oriented frame that uses SYN, STX, data, and ETX.',
      options: ['Data bytes', 'SYN', 'ETX', 'STX'], answer: ['SYN', 'STX', 'Data bytes', 'ETX'],
      explanation: 'A simple byte-oriented layout first establishes synchronization, marks the start of text, carries data, then marks the end.', level: 3
    },
    {
      id: 'byte-escape', concept: 'byte-oriented-syn-stx-etx', type: 'choice', mission: 'Byte Harbor: handle a fake marker.',
      prompt: 'If byte-oriented payload data may contain a byte equal to ETX, what does the protocol need?',
      options: ['An escaping or transparency mechanism', 'A larger sliding window only', 'A 1-bit sequence number only', 'No delimiter at all'],
      answer: 'An escaping or transparency mechanism',
      explanation: 'Byte stuffing or escaping prevents payload bytes from being misread as control delimiters such as ETX.', level: 3
    },
    {
      id: 'err-detect-correct', concept: 'error-detection-vs-correction', type: 'choice', mission: 'Redundancy Lab: choose the tool.',
      prompt: 'What is the key difference between error detection and error correction?',
      options: ['Detection notices likely errors; correction adds enough redundancy to repair some errors', 'Detection always repairs every bit', 'Correction never uses redundancy', 'They are names for the same thing'],
      answer: 'Detection notices likely errors; correction adds enough redundancy to repair some errors',
      explanation: 'Checksums and CRCs usually detect corruption; correction schemes require more redundant information to infer the original data.', level: 4
    },
    {
      id: 'err-redundancy', concept: 'error-detection-vs-correction', type: 'true-false', mission: 'Redundancy Lab: pay for protection.',
      prompt: 'True or false: correcting errors generally requires more redundancy than merely detecting that an error occurred.',
      answer: true,
      explanation: 'Correction must identify enough about the error to reconstruct data, so it normally needs more redundant structure than detection.', level: 4
    },
    {
      id: 'err-arq', concept: 'error-detection-vs-correction', type: 'choice', mission: 'Redundancy Lab: pick retransmission or repair.',
      prompt: 'A link detects a corrupted frame with a CRC and asks for retransmission. Which strategy is this?',
      options: ['Error detection combined with ARQ retransmission', 'Forward error correction only', 'Clock recovery', 'Byte synchronization only'],
      answer: 'Error detection combined with ARQ retransmission',
      explanation: 'The CRC detects likely corruption, and ARQ recovers by sending the frame again instead of repairing it from redundant bits alone.', level: 4
    }
  ];

  function normalize(value) {
    if (Array.isArray(value)) return value.map((part) => String(part).trim()).join('|');
    return String(value).trim().toLowerCase();
  }

  function seededShuffle(items, seed) {
    const copy = items.slice();
    let state = seed || 11;
    for (let i = copy.length - 1; i > 0; i -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const j = state % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  class DataLinkDefenseGame {
    constructor({ storage = typeof localStorage !== 'undefined' ? localStorage : null, questions = QUESTION_BANK, seed = 42 } = {}) {
      this.storage = storage;
      this.questions = seededShuffle(questions, seed);
      this.state = this.loadState() || this.freshState();
      this.reviewQueue = [];
      this.activeQuestion = this.questions[this.state.currentIndex % this.questions.length];
    }

    freshState() {
      return { score: 0, streak: 0, energy: 3, answered: 0, correct: 0, currentIndex: 0, missed: {}, mastered: {}, conceptStats: {}, history: [], lastPlayed: null };
    }

    loadState() {
      if (!this.storage || typeof this.storage.getItem !== 'function') return null;
      try {
        const saved = JSON.parse(this.storage.getItem(STORAGE_KEY));
        if (!saved || typeof saved !== 'object') return null;
        return { ...this.freshState(), ...saved, conceptStats: saved.conceptStats || {}, missed: saved.missed || {}, mastered: saved.mastered || {}, history: saved.history || [] };
      } catch (_) {
        return null;
      }
    }

    saveState() {
      this.state.lastPlayed = new Date().toISOString();
      if (this.storage && typeof this.storage.setItem === 'function') {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    }

    reset({ missedOnly = false } = {}) {
      const missedDeck = missedOnly ? this.replayMissedDeck() : [];
      this.state = this.freshState();
      if (missedDeck.length) this.questions = seededShuffle(missedDeck, 5);
      this.activeQuestion = this.questions[0];
      this.reviewQueue = [];
      this.saveState();
      return this.activeQuestion;
    }

    currentQuestion() {
      return this.activeQuestion;
    }

    isCorrect(question, response) {
      if (question.type === 'numeric') return Math.abs(Number(response) - Number(question.answer)) <= (question.tolerance || 0);
      if (question.type === 'order') return normalize(response) === normalize(question.answer);
      if (question.type === 'true-false') return response === question.answer || normalize(response) === normalize(question.answer);
      return normalize(response) === normalize(question.answer);
    }

    answer(response) {
      const question = this.currentQuestion();
      const correct = this.isCorrect(question, response);
      const concept = question.concept;
      const stats = this.state.conceptStats[concept] || { answered: 0, correct: 0, missed: 0 };
      stats.answered += 1;
      this.state.answered += 1;

      if (correct) {
        stats.correct += 1;
        this.state.correct += 1;
        this.state.streak += 1;
        this.state.score += 100 + Math.min(this.state.streak, 5) * 20;
        this.state.mastered[concept] = (this.state.mastered[concept] || 0) + 1;
      } else {
        stats.missed += 1;
        this.state.streak = 0;
        this.state.energy = Math.max(0, this.state.energy - 1);
        this.state.missed[concept] = (this.state.missed[concept] || 0) + 1;
        this.reviewQueue.push(question.id);
      }

      this.state.conceptStats[concept] = stats;
      this.state.history.push({ id: question.id, concept, correct, response, at: new Date().toISOString() });
      if (this.state.history.length > 80) this.state.history.shift();
      this.saveState();
      return { correct, explanation: question.explanation, score: this.state.score, streak: this.state.streak, energy: this.state.energy, answer: question.answer };
    }

    nextQuestion() {
      const reviewId = this.reviewQueue.shift();
      if (reviewId) {
        this.activeQuestion = this.questions.find((q) => q.id === reviewId) || this.activeQuestion;
        return this.activeQuestion;
      }
      this.state.currentIndex = (this.state.currentIndex + 1) % this.questions.length;
      this.activeQuestion = this.questions[this.state.currentIndex];
      this.saveState();
      return this.activeQuestion;
    }

    replayMissedDeck() {
      const missedConcepts = new Set(Object.entries(this.state.missed).filter(([, count]) => count > 0).map(([concept]) => concept));
      return this.questions.filter((q) => missedConcepts.has(q.concept));
    }

    masteryBreakdown() {
      const concepts = {};
      for (const question of this.questions) {
        if (!concepts[question.concept]) concepts[question.concept] = { answered: 0, correct: 0, missed: 0, accuracy: 0 };
      }
      for (const [concept, stats] of Object.entries(this.state.conceptStats)) {
        concepts[concept] = { ...stats, accuracy: stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0 };
      }
      return {
        score: this.state.score,
        totalAnswered: this.state.answered,
        totalCorrect: this.state.correct,
        accuracy: this.state.answered ? Math.round((this.state.correct / this.state.answered) * 100) : 0,
        concepts,
      };
    }
  }

  function buildOptionButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-card';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function initBrowserGame() {
    if (typeof document === 'undefined') return;
    const game = new DataLinkDefenseGame();
    const els = {
      mission: document.querySelector('#mission-text'), prompt: document.querySelector('#prompt'), options: document.querySelector('#answer-options'),
      feedback: document.querySelector('#feedback'), next: document.querySelector('#next-button'), score: document.querySelector('#score'), streak: document.querySelector('#streak'),
      energy: document.querySelector('#energy'), progress: document.querySelector('#progress-fill'), level: document.querySelector('#level-label'), report: document.querySelector('#mastery-report'),
      replay: document.querySelector('#replay-missed'), reset: document.querySelector('#reset-progress'), instructions: document.querySelector('#instructions')
    };
    let locked = false;

    function updateHud() {
      els.score.textContent = game.state.score;
      els.streak.textContent = game.state.streak;
      els.energy.textContent = '⚡'.repeat(game.state.energy) + '○'.repeat(Math.max(0, 3 - game.state.energy));
      els.progress.style.width = `${Math.min(100, Math.round((game.state.answered / 18) * 100))}%`;
    }

    function renderQuestion() {
      locked = false;
      const q = game.currentQuestion();
      els.level.textContent = `Level ${q.level}`;
      els.mission.textContent = q.mission;
      els.prompt.textContent = q.prompt;
      els.feedback.textContent = 'Choose an answer to defend the link.';
      els.feedback.className = 'feedback';
      els.next.hidden = true;
      els.options.innerHTML = '';

      if (q.type === 'numeric') {
        const form = document.createElement('form');
        form.className = 'numeric-form';
        form.innerHTML = '<label for="numeric-answer">Enter the number</label><input id="numeric-answer" inputmode="numeric" autocomplete="off" required><button type="submit">Lock answer</button>';
        form.addEventListener('submit', (event) => { event.preventDefault(); submitAnswer(form.querySelector('input').value); });
        els.options.append(form);
      } else if (q.type === 'true-false') {
        els.options.append(buildOptionButton('True', () => submitAnswer(true)), buildOptionButton('False', () => submitAnswer(false)));
      } else if (q.type === 'order') {
        const hint = document.createElement('p');
        hint.className = 'microcopy';
        hint.textContent = 'Tap the tiles in the correct order.';
        const chosen = [];
        const tray = document.createElement('div');
        tray.className = 'order-tray';
        q.options.forEach((option) => {
          tray.append(buildOptionButton(option, (event) => {
            if (event.currentTarget.disabled) return;
            chosen.push(option);
            event.currentTarget.disabled = true;
            event.currentTarget.textContent = `${chosen.length}. ${option}`;
            if (chosen.length === q.answer.length) submitAnswer(chosen);
          }));
        });
        els.options.append(hint, tray);
      } else {
        q.options.forEach((option) => els.options.append(buildOptionButton(option, () => submitAnswer(option))));
      }
      updateHud();
    }

    function submitAnswer(value) {
      if (locked) return;
      locked = true;
      const result = game.answer(value);
      els.feedback.className = `feedback ${result.correct ? 'is-correct' : 'is-wrong'}`;
      els.feedback.innerHTML = `<strong>${result.correct ? 'Link defended.' : 'Signal breached.'}</strong> ${result.explanation}`;
      els.next.hidden = false;
      updateHud();
      renderMastery();
    }

    function renderMastery() {
      const report = game.masteryBreakdown();
      const rows = Object.entries(report.concepts).map(([concept, stats]) => `<li><span>${concept.replaceAll('-', ' ')}</span><strong>${stats.accuracy || 0}%</strong><small>${stats.correct}/${stats.answered || 0} correct · ${stats.missed || 0} misses</small></li>`).join('');
      els.report.innerHTML = `<p><strong>${report.accuracy}% accuracy</strong> across ${report.totalAnswered} defended frames.</p><ul>${rows}</ul>`;
      els.replay.disabled = game.replayMissedDeck().length === 0;
    }

    els.next.addEventListener('click', () => { game.nextQuestion(); renderQuestion(); });
    els.replay.addEventListener('click', () => { game.reset({ missedOnly: true }); renderQuestion(); renderMastery(); });
    els.reset.addEventListener('click', () => { if (confirm('Reset local Data Link Defense progress?')) { game.reset(); renderQuestion(); renderMastery(); } });
    els.instructions.addEventListener('toggle', () => updateHud());
    renderQuestion();
    renderMastery();
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { QUESTION_BANK, DataLinkDefenseGame, STORAGE_KEY };
  if (typeof window !== 'undefined') window.DataLinkDefense = { QUESTION_BANK, DataLinkDefenseGame, STORAGE_KEY };
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initBrowserGame);
})();
