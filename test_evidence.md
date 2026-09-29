# Verification evidence — Sentinel Domains 1–4

## Independent-QA correction pass (current working tree)

Correction worker runtime: **`gpt-6-astra` via `openai-codex`**, as identified by the runtime context. No model configuration was changed. No commit, push, publication, or remote change was made. The earlier implementation evidence below is historical; these are the current results. Independent re-review is still required, not claimed complete.

### Correction acceptance and changes
- Boss answers now occupy A/B/C/D in domain order. Each moved boss swaps positions with one earlier item in its domain, preserving exactly four correct answers per slot per domain and 16 per slot overall. Grading still compares answer text, not position.
- Save validation checks resolved deck count against index/feedback, then compares the active session’s history suffix with deck order, answer correctness, session correct count, and feedback fields. Inconsistent saves are safely rejected to fresh state, not reconciled into potentially duplicate rewards. Legitimate repeated IDs in deferred review remain valid because validation is positional.
- `d2-13`, `d3-9`, and `d4-16` now contrast credible but incomplete security controls/priorities. Each alternative has a specific rationale; the correct answer is no longer uniquely longest in these three items. No broad content rewrite.
- README documents rejection semantics, local-scoring limitations, and pre-release response-text compatibility. Existing normal reload and legacy migration remain tested. Corrupt saves lose campaign progress on fallback; the original stored value is untouched until the next save. Old pre-release responses to rewritten options are likewise rejected by existing option-membership validation.

### RED — new tests before production edits

Command: `node --test tests/content.test.js tests/game.test.js`

Actual exit **1**. Exact summary:

```text
ℹ tests 19
ℹ suites 0
ℹ pass 13
ℹ fail 6
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 79.529875
```

Expected behavioral failures:
- Boss answer-slot cardinality: `1 !== 4`.
- `d2-13`, `d3-9`, `d4-16`: each lacked its newly required competing alternative (`realistic alternative missing`).
- Remove only `session.feedback` after one correct answer (history 1, XP 120), reload, answer again: `Missing expected exception.`
- Inconsistent session/history: `inconsistent session must be safely rejected` (an active session was returned instead of null).
- Additional positive compatibility test passed before changes: reload at every unlocked, locked, and completed transition across domain, mixed, and missed sessions, including deferred repeated IDs.

Command: `node tests/browser-smoke.js`

Actual exit **1**, expected browser regression failure:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

false !== true

    at main (.../tests/browser-smoke.js:100:10)
```

The tampered save incorrectly reopened the arena instead of safely rejecting the inconsistent session. This failure occurred after the existing desktop/mobile, keyboard, completion, replay, and reset checks.

### GREEN — targeted and full verification

After minimal production changes:

`node --test tests/content.test.js tests/game.test.js` exited **0**:

```text
ℹ tests 19
ℹ suites 0
ℹ pass 19
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78.866375
```

Final `node --test tests/*.test.js` exited **0**:

```text
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 85.845208
```

`node --check app.js`, `node --check questions.js`, `node --check tests/browser-smoke.js`, and `git diff --check` all exited **0**, with no output.

Programmatic inventory returned total **64**, boss positions **[0,1,2,3]**, overall answer positions **[16,16,16,16]**. Per-domain **[4,4,4,4]** is asserted by the new content test.

Final `node tests/browser-smoke.js` exited **0** (also passed the preceding targeted GREEN invocation). Exact final stdout:

```json
{
  "result": "PASS",
  "browser": "Chrome/154.0.8037.58",
  "desktop": "1280×900",
  "mobile": "375×812",
  "checks": [
    "keyboard launch and answer",
    "question-first confidence gate",
    "four option explanations",
    "reload lock",
    "tampered feedback safe rejection without duplicate XP",
    "two-question deferred retry",
    "mixed completion and four-shield bonus",
    "manual report",
    "mobile no horizontal overflow",
    "44px visible touch targets",
    "reduced motion",
    "visible keyboard focus",
    "domain selection",
    "replay and reset",
    "legacy migration",
    "blocked storage getter"
  ],
  "uncaughtExceptions": 0
}
```

The browser regression checks that a scored save (one attempt, 120 XP) with only feedback cleared opens no arena on reload, renders fresh XP 0, cannot score through the old submit control, and starts a fresh campaign whose first correct answer is still one attempt and 120 XP (not two attempts and 260 XP). The invalid raw save is not silently overwritten by loading it.

### Correction files and handoff

Modified only: `app.js`, `questions.js`, `tests/game.test.js`, `tests/content.test.js`, `tests/browser-smoke.js`, `README.md`, `test_evidence.md`. These files already existed in the parent’s uncommitted implementation; no new correction files were created. Unrelated existing changes were left intact. No dependency installs or external services were needed. The failures above were intentional RED regressions; no execution blocker remains.

Ready for independent re-review of the three warnings. Content regression tests guard the revised decisions and rationales, but do not substitute for human subject-matter review. Local save validation is not protection against someone rewriting all internally consistent state fields.

---

# Earlier implementation evidence (before independent-QA corrections)

## Scope and identity
- Runtime identified the worker as `gpt-6-astra`, provider `openai-codex`.
- Repository: `/Users/elliotbot/elliot/study-games/data-link-defense`.
- Baseline and final HEAD: `4776cd2` (`Build research-backed Data Link Defense study game`). No commits, pushes, deployments, PRs, or remote modifications were made.
- Origin still `https://github.com/Dillonddraven/data-link-defense.git`.
- No `AGENTS.md` was found in the repository or its checked ancestor directories. Work remained repository-local; no broader Kernel/Doctor/global skill writes were performed.

## Strict TDD record
Tests were written and executed before the corresponding implementation. The previous network-only bank, immediate retry, unlimited-session and obsolete question-format expectations were intentionally replaced to express the new acceptance contract.

### RED 1 — campaign contract before implementation
Command: `node --test tests/game.test.js`

Actual result: exit **1**, **11 tests, 0 pass, 11 fail**.

Expected missing behavior included:
- `assert.ok(QUESTION_BANK.length >= 60)` failed against the old 27-question bank.
- `CampaignGame is not a constructor` because the campaign API did not yet exist.
- Accessible campaign shell failed at the missing confidence `<fieldset>`.

### RED 2 — browser controller before implementation
Command: `node --test tests/ui.test.js`

Actual result: exit **1**, **3 tests, 0 pass, 3 fail**. The required campaign/controller export was absent (`actual 'undefined', expected 'function'`). The assertions define answer/confidence gating, explanatory feedback, completion, boss state, report, replay, reset and restored locks.

### GREEN 1 — implementation and targeted/full suites
Commands:

```sh
node --test tests/game.test.js  # 11/11 pass
node --test tests/ui.test.js    # 3/3 pass
node --test tests/*.test.js    # initially 14/14 pass
```

All exited **0** after the bank, engine, controller, HTML and CSS implementation.

### RED → GREEN 3 — distractor content hardening
Wrote a content regression test before replacing overly unrelated alternatives with competing security decisions.

```sh
node --test tests/content.test.js
```

RED: exit **1**, **1 fail**, `d1-6: realistic alternative missing`.
GREEN after content revisions: exit **0**, **1/1 pass**. The test covers alternatives across all four domains; every choice retains an explicit rationale.

## Final automated results

```sh
node --test tests/*.test.js
```

Actual final result: **15 tests, 15 pass, 0 fail, 0 skipped**, exit **0** (Node `v25.9.0`).

```sh
node --check app.js
node --check questions.js
node --check tests/browser-smoke.js
git diff --check
```

All exited **0** without syntax or whitespace errors.

Programmatic content inventory:

```json
{
  "total": 64,
  "domains": {"1": 16, "2": 16, "3": 16, "4": 16},
  "scenarios": 64,
  "answerPositions": [16, 16, 16, 16]
}
```

Every question is an original contextual FIRST/BEST/MOST choice question with metadata, a correct-answer explanation, and a rationale for each option. Automated tests check shape and coverage, not the truth of every teaching claim. Domain 1–4 topic mapping is in README.

## Real-browser execution
Command: `node tests/browser-smoke.js`

Final result: **PASS**, exit **0**, repeated successfully twice after harness stabilization.
- Browser: `Chrome/154.0.8037.58`.
- Desktop viewport: **1280×900**; mobile viewport: **375×812**.
- **0 uncaught browser exceptions**.
- Actual keyboard Enter activates launch and answer choice; visible focus is present.
- Confidence is required; answers/explanations are not shown before submission.
- Four option rationales appear after lock; reload cannot award a duplicate answer.
- A miss returns only after two intervening answers.
- Mixed campaign finishes with four boss shields and its deterministic bonus.
- Report text contains real calibration results and is selected for manual copying.
- Mobile page has no horizontal overflow; all visible button/select/summary/confidence-label targets measure at least 44px high.
- Reduced-motion emulation disables transitions.
- Domain selection, replay-missed, reset, real localStorage migration, and a throwing localStorage getter all passed.
- Browser profile and loopback server are disposable; runtime artifacts were removed.

Harness issues encountered and resolved (not hidden app failures):
1. CDP Enter initially omitted carriage-return text, so Chrome did not activate the button. Supplying real Enter text fixed the keyboard driver.
2. Forceful browser shutdown once raced profile cleanup (`ENOTEMPTY`) after all browser assertions passed. The harness now closes Chrome through `Browser.close` and uses bounded filesystem cleanup retries. Two subsequent complete invocations exited 0.
3. Navigation waits now use actual `Page.loadEventFired` events to avoid checking a stale document after reload.

## Files changed
Modified:
- `app.js` — versioned engine, scoring/calibration, finite decks, deferred retrieval, boss, migration, report and DOM controller.
- `index.html` — Sentinel campaign UI, accessibility, privacy and citations.
- `styles.css` — responsive campaign styling, focus, touch targets, reduced motion.
- `tests/game.test.js` — revised campaign acceptance tests.

Created:
- `questions.js` — 64-question Domain 1–4 bank.
- `tests/ui.test.js` — dependency-free DOM-controller tests.
- `tests/content.test.js` — competing-option content regression.
- `tests/browser-smoke.js` — package-free real Chrome/CDP acceptance runner.
- `README.md`, `acceptance_contract.md`, `test_evidence.md`.
- `.gitignore` — disposable `.qa-runtime/` only.

## Remaining risks / parent QA
No known failing test or incomplete named implementation feature. Remaining assurance limits:
- Original study prompts need an independent subject-matter spot check; they are not official items or exhaustive coverage of every outline sub-bullet.
- All new questions are multiple choice; retired legacy specialized prompts remain only as migration notes, not replayable items.
- Within-session spacing is modest, rank/accuracy can be raised through repeated practice, and no exam-readiness claim is made.
- Human screen-reader/visual review and Safari/Firefox/iOS checks are not replaced by Chrome layout assertions.
- Single-tab, local-only persistence; history is retained until reset and may eventually exhaust quota. The app warns and continues if storage fails.

Exact next steps for parent:
1. Inspect `git diff` plus newly created files; read `acceptance_contract.md` and README coverage/migration decisions.
2. Rerun `node --test tests/*.test.js && node tests/browser-smoke.js && git diff --check` from this repository.
3. Run `python3 -m http.server 8080 --bind 127.0.0.1`, open `http://127.0.0.1:8080/`, and perform visual/keyboard/screen-reader/mobile QA. In each domain, sample a prompt and all option rationales; complete a mixed run, deliberately miss a boss, replay it, reload while locked, and inspect the manual report.
4. Independently review content against the linked official outline, especially legal/privacy caveats, strict-model rules, crypto and IPsec distinctions.
5. Stop for approval before commit/publication. If authorized later, publish all four static assets together (`index.html`, `styles.css`, `questions.js`, `app.js`) at the unchanged Pages path.
