# CYB 7223 midterm mode — acceptance contract

## Goal
Add a direct, mobile-friendly CYB 7223 Network Security midterm practice page without replacing Sentinel CISSP mode or either mode’s saved browser progress.

## Verified source scope
The saved Fall 2026 course outline places the October 9, 2026 midterm after Weeks 1–6: networking/metrics; software and architectures; direct-link and packet-switching networks; auxiliary/end-to-end IP protocols; internetworking/IP; IP scalability/subnetting. The saved syllabus says exam content comes from course material. Saved Lab 1 covers ARP, same-subnet vs routed ICMP, MAC rewriting, and TTL; Lab 2 covers IPv4 fragmentation; Lab 3 covers UDP traceroute, TTL, ICMP Time Exceeded, and rerouting. The learner tracker adds three due concepts: stop-and-wait one-frame limitation, alternating 1-bit sequence numbers, and 4B/5B efficiency.

## Scope caveat
No instructor midterm review sheet, full lecture deck set, or explicit exam blueprint was found locally. Coverage is therefore **provisional Weeks 1–6 practice**, not a claim to contain every tested fact or authentic exam items. Public textbook pages support technical validation; no private course documents, answer keys, personal details, or graded-exam content are published.

## Acceptance criteria
- Keep `index.html` and `sentinel-cissp-progress-v2` behavior intact.
- Add direct `netsec.html` entry and distinct versioned `sentinel-netsec-midterm-v1` localStorage key.
- Minimum 36 original questions, at least six per Week 1–6 unit, with a mix of choice, numeric, and order retrieval.
- Include tracker-due concepts and saved-lab topics; explanations include answer reasoning and, for choices, why each alternative loses.
- Require confidence 1–3 before grading; label confidence-3 misses and confidence-1 correct answers.
- Keep each session at exactly five scored retrievals. A miss waits behind the remaining prompts and is prioritized in the next focus/mixed session or Replay missed; never repeat it immediately.
- Finite mixed and per-week sessions, completion summary, local report, reset, malformed/blocked storage fallback, no telemetry.
- Keyboard-native controls, 44px touch targets, visible focus, reduced motion, and no narrow-screen horizontal overflow.
- Public page labels source scope as provisional and links public textbook/learning-science references only.

## Publication gate
Implementation and systematic review may be completed locally. Commit, push, and deployment remain held until the parent commissions independent QA and receives strict PASS.

## Rollback
Before release, discard only scoped netsec files/changes. After a later release, revert the reviewed release commit. Existing CISSP and legacy localStorage keys remain untouched.
