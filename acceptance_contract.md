# Sentinel: CISSP campaign acceptance contract

## Goal and scope
Upgrade Data Link Defense in this repository into a dependency-free, question-first CISSP Domains 1–4 study campaign. Keep the existing repository and GitHub Pages URL. This is a formative study aid, not coursework, official ISC2 questions, exam simulation, or certification readiness measurement.

## Non-goals / boundaries
No packages, build pipeline, accounts, telemetry, backend, direct `study` CLI writes, publishing, commits, pushes, PRs, remote changes, or changes outside this repository. Parent owns independent QA and any later release. Broader Kernel/Doctor/project-manager writes are intentionally out of scope for this focused worker.

## Acceptance criteria
- At least 15 substantive questions in each named Domain 1–4; unique IDs, domain metadata, concept, prompt, answer, explanation, mission, level, supported type. At least 25% contextual FIRST/BEST/MOST scenarios; varied correct positions and option-specific rationale.
- Core coverage: ethics/CIA/governance/risk/legal/BCP; classification/lifecycle/roles/retention/destruction/privacy; principles/models/crypto/PKI/physical/cloud/vulnerabilities; network models/segmentation/wireless/controls/protocols/IPsec/remote access.
- Domain selection and balanced mixed campaign; finite sessions and explicit completion; XP/rank, streak/combo, mandatory confidence 1–3, calibration, per-domain practice accuracy, replay missed, deferred missed retrieval after two intervening questions (late misses deferred to another session).
- Deterministic boss finale: one case decision per selected domain, visible shield counter, first-attempt results, and all-correct bonus. No random pass/fail.
- Versioned browser-local persistence, old-state migration without fabricating confidence, reload-safe question locking/session resumption, safe corrupt/blocked storage fallback.
- Semantic/mobile/keyboard controls, live feedback, visible focus, 44px targets, reduced-motion preference; no answers/explanations revealed until submission.
- Shareable plain-text score/missed-topic report for Elliott, no automatic transmission. Clear local-only storage notice.
- Learning-science sources for retrieval/spacing/confidence, current official ISC2 outline link; README run/test/privacy/deploy notes.

## Test plan (strict RED → GREEN)
1. Replace obsolete immediate-repeat/network-only assertions with tests for the new campaign contract before production edits. Run `node --test tests/game.test.js`; preserve expected failing results.
2. Implement bank and pure game engine; rerun focused core tests.
3. Test the browser adapter through a dependency-free DOM harness (confidence gating, answer feedback, reload, completion/replay/report) before implementation. Run targeted UI tests.
4. Run `node --test tests/*.test.js`, syntax checks, `git diff --check`, and local browser QA if available. Record exact execution in `test_evidence.md`. Parent additionally performs visual/keyboard/mobile QA before any release.

## Rollback
Before publication, discard only reviewed task changes to return to baseline `4776cd2`; do not use a blanket reset with unrelated work. After a later parent-authorized release, revert the eventual reviewed change commit and redeploy the prior static assets. Keep the legacy storage key untouched; the new versioned key is independently removable. No destructive migration of old browser progress.
