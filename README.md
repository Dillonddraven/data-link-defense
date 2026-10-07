# Sentinel • CISSP Domains 1–4

A dependency-free browser study campaign, evolved from **Data Link Defense**. The repository name and existing GitHub Pages URL remain unchanged:

https://dillonddraven.github.io/data-link-defense/

## CYB 7223 midterm micro-study

Direct launch: https://dillonddraven.github.io/data-link-defense/netsec.html

A separate direct page, `netsec.html`, adds five-question, 3–5 minute practice mapped to the saved Fall 2026 syllabus/outline headings for Weeks 1–6:

1. Introduction to Networking & Metrics
2. Networking Software & Architectures
3. Direct Link & Packet Switching Networks
4. Auxiliary and End-to-End Protocols for IP
5. Internetworking & IP
6. IP Scalability & Subnetting

The bank contains original choice, numeric, and ordering prompts grounded in the public course textbook plus saved lab concepts. It restores stop-and-wait, sliding windows, Go-Back-N/Selective Repeat constraints, 4B/5B, NRZ, framing, error recovery, ARP/ICMP, IPv4 fragmentation, router forwarding, TTL/classic Linux UDP traceroute, and subnetting practice. Misses wait behind the rest of the five-item session and lead the next same-week session; Replay missed is also available. Confidence is required before feedback.

This scope is **provisional**: no complete Week 1–6 lecture set, instructor midterm review sheet, or quiz exports were found locally. It does not claim all exam content, authentic exam items, or readiness. Week 9+ routing/security/cloud topics are excluded from this mode. Technical source links are public; no private course files, answers, or personal details are published.

CYB 7223 progress uses `sentinel-netsec-midterm-v1`; the existing CISSP key `sentinel-cissp-progress-v2` and legacy `data-link-defense-progress` are untouched. The CISSP page remains `index.html`, with a link to the distinct midterm page.

The verified release is published at the URL above. It is a formative study aid, not graded coursework, an ISC2 product, a full exam simulator, or an exam-readiness score.

## Run locally

Open `index.html` directly, or serve this directory (recommended for predictable browser storage):

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8080/`. No installation, npm packages, backend, or build step. The browser loads only `index.html`, `styles.css`, `questions.js`, and `app.js`.

## Test

Node 18+ for the dependency-free tests (verified here with Node v25.9.0):

```sh
node --test tests/game.test.js       # bank, campaign engine, persistence, shell
node --test tests/ui.test.js         # real controller against a small DOM port
node --test tests/content.test.js    # relevant competing distractor decisions
node --test tests/*.test.js          # complete deterministic unit/controller suite
node --check app.js
node --check questions.js
node --check netsec-app.js
node --check netsec-questions.js
git diff --check
```

Optional **real Chrome** acceptance test, also dependency-free:

```sh
node tests/browser-smoke.js
node tests/netsec-browser-smoke.js
# Optional paced NetSec run (about 3:10):
PACE_MS=38000 node tests/netsec-browser-smoke.js
# Linux or alternate Chrome installation:
CHROME_BIN=/path/to/chrome node tests/browser-smoke.js
```

The Chrome test starts its own loopback-only server on an ephemeral port and a fresh headless profile under `.qa-runtime/`. It drives CDP through an inherited pipe (no open debug port), checks desktop/mobile layout and actual keyboard events, then terminates its browser/server and removes the profile. No personal browser session or credentials are used. It fails if Chrome is unavailable. Do not confuse the DOM port tests with a rendering/accessibility audit; the Chrome smoke and human QA complement them.

## Coverage

64 original multiple-choice scenarios, **16 per domain**, including one linked BLACKOUT boss decision per domain. Every item has domain number/name, unique ID, concept, mission, difficulty level, answer, explanation, and a rationale for each option. All 64 use contextual FIRST/BEST/MOST decisions. Correct answer positions are varied across all four slots. Difficulty levels are author labels, not calibrated measurements.

| Domain | Main topics |
|---|---|
| 1 — Security and Risk Management | Ethics, CIA, governance, risk ownership/assessment/treatment, legal and transborder duties, BIA/BCP/RTO/RPO, policies/standards, due care/diligence, supply chain, personnel, awareness, threat modeling |
| 2 — Asset Security | Classification, owners/custodians/controllers/processors, minimization, inventory, lifecycle, handling/data states/DLP, retention/holds, destruction/crypto erase, pseudonymization, residency, end of support |
| 3 — Security Architecture and Engineering | Least privilege, fail securely, Bell-LaPadula/Biba, authenticated encryption, signatures, PKI, life safety, IaaS shared responsibility, memory safety, defense in depth, side channels, ICS, zero trust, environmental resilience |
| 4 — Communication and Network Security | OSI/Ethernet, TCP/IP, VLAN segmentation, enterprise wireless, TLS/SSH, IPsec, scoped remote access, IDS/IPS/firewalls, DNSSEC, IPv6, jitter, management planes, rogue access points |

The current [official ISC2 outline](https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline) was checked during implementation; its linked outline lists April 15, 2024 as its effective date. This bank samples the core Domain 1–4 topics rather than every sub-bullet; Domains 5–8 are not covered. Original low-level framing/coding drills and their numeric/order/true-false formats were deliberately retired in favor of applied CISSP decisions. Existing networking references remain available in the learning-design section.

## Mission mechanics

- **Domain route:** all 15 non-boss questions in the selected domain, then its boss decision.
- **Mixed route:** three non-boss questions per domain, then four fixed-order BLACKOUT decisions. The saved session counter varies deterministic selection on subsequent launches.
- **Question first:** select an answer and confidence 1–3, then lock. All four option rationales appear only after submission. Keyboard-native buttons, selects, radios and forms work without a pointer.
- **Deferred retrieval:** a non-boss miss is inserted once after two intervening decisions if there is room before the finale. Otherwise it waits for Replay missed. No immediate repetition and no unlimited retry loop. Each miss can add at most one retry to a session.
- **Progress:** correct answers earn 100 XP plus 20–100 streak XP. Cadet (<1,000), Analyst (1,000), Defender (3,000), Sentinel (6,000). New missions reset the current streak, not lifetime XP.
- **Boss:** one shield for each correct boss decision, 200 bonus XP when every boss decision in the current session is correct. Results are deterministic; errors never end a session early.
- **Replay missed:** unresolved question IDs only. Correcting a question removes it from the unresolved list, but historical misses remain in accuracy/calibration. An empty replay does not replace the current deck.
- **Calibration:** confident misses are incorrect confidence-3 attempts; “lucky guesses” are correct confidence-1 attempts. These are reflection labels, not validated diagnostic categories.
- **Domain journal:** lifetime practice accuracy (including retries) plus unique question coverage. Repeat practice can raise XP and accuracy; they are explicitly not exam-readiness estimates.
- **Completion:** finite deck, session score, XP gained, boss result, and next-study suggestions. A reload preserves active question, recorded answer lock, retries, and completed mission.

## Privacy, saves, and migration

There is **no telemetry, account, network progress sync, or automatic report transmission**. The new key is `sentinel-cissp-progress-v2` in the current origin’s localStorage. It holds XP/streak, recorded question IDs/answers/confidence, unresolved misses, and the current session. Do not enter personal or secret information; none is needed.

On the first run without a new save, the old `data-link-defense-progress` key is read non-destructively. Its score becomes XP; legacy totals and missed-concept names remain visible as an archive. Old attempts have no trustworthy domain/confidence metadata, so they are **not invented or folded into new domain/calibration statistics**. Retired legacy question IDs cannot be replayed, but their topic notes are retained. Reset clears the new campaign save only and leaves the old key untouched; the new reset save prevents automatic re-import on the next load.

Malformed or inconsistent session saves fall back to fresh campaign state: the resolved deck count, matching history suffix, correctness, and feedback lock must agree. Clearing only feedback cannot unlock an already scored question. The invalid stored value is not overwritten until play saves again; the legacy key is left untouched. This is corruption detection, not tamper-proof scoring. Pre-release saves containing option text replaced during content revisions also fall back to fresh state. Blocked localStorage access and quota failures do not stop play; the UI warns that progress is not being saved. Direct `file:` storage behavior is browser-dependent. Private browsing, clearing site data, changing browsers/devices/origins, or exhausting storage can lose saved progress. Concurrent tabs are not synchronized; use one active tab. History is retained locally until reset rather than silently truncated; very long-term play may reach browser quota.

**Prepare report for Elliott** generates a selected, read-only plain-text report. Copy it manually into your conversation for study tracking. It includes score, domain practice, calibration, and missed topics. It never calls the `study` CLI or a remote service. The report is not an import/backup format.

## Learning design and limitations

The page cites Roediger & Karpicke (retrieval practice), Dunlosky et al. (testing/distributed practice), and Butler, Karpicke & Roediger (feedback and low-confidence correct responses). Within-session lag is modest; return on another day for longer spacing. There is no claim that this exact game, schedule, confidence scale, or rank system has been experimentally validated.

Semantic landmarks, live feedback, visible focus, 44px targets, a responsive layout, and reduced-motion support are implemented. The browser smoke measures actual 375px layout, target sizes, focus, and motion suppression. Human screen-reader review and Safari/Firefox checks remain limitations; independent subject-matter and adversarial QA passed before release.

## Deployment / rollback

The verified static assets are published from the repository root through the existing GitHub Pages setup. `questions.js` must load before `app.js`; relative asset paths preserve `/data-link-defense/` hosting.

See `acceptance_contract.md` for scope and rollback and `test_evidence.md` for RED/GREEN results. To roll back, revert the release commit and let GitHub Pages redeploy the previous assets. The untouched legacy storage key remains available to the old app.
