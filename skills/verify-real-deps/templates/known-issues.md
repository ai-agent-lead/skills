---
type: known-issues
title: "Known issues — post-vN.0 smoke test findings"
description: Bugs surfaced by the first end-to-end run against the real upstream.
tags: [smoke-test, known-issues]
timestamp: YYYY-MM-DD
---

<!-- Frontmatter is OKF per skills/formats/OKF.md (`type: known-issues`).
     `timestamp` tracks the last edit; the Discovered line below pins the first run. -->

# Known issues — post-vN.0 smoke test findings

**Discovered:** YYYY-MM-DD (first end-to-end run against real <upstream>).
**Status:** <N> open / <M> closed.

These bugs slipped past unit/integration tests because the test harness accepted whatever wire shape the code sent. Real upstream enforces stricter contracts and surfaced them. Each entry doubles as the canonical brief for its fix-round.

---

## #N — <one-line title>

**Severity:** High | Medium | Low — <one-line reason based on user impact>.
**Status:** Open | Closed in R<N> (commit <hash>). Tests:
`TestNameOne`,
`TestNameTwo`.

**Reproduction:**
1. <numbered step a stranger could follow>
2. <step>
3. <expected vs observed>

**Root cause:** <one paragraph — why the test passed but the real API didn't. Cite the test harness's permissive behavior, the real API's documented or observed contract, and the gap between them.>

**Files:**
- `<package>/<file>.go` (the function that mishandled the shape)
- `<test-harness>/<fake>.go` (the fake that accepted the wrong shape — fix this too to prevent regression)

**Fix sketch:**
<one paragraph specific enough to scope a Builder brief. Mention the precise wire shape change, the function signature change if any, and the new test that pins the real-API contract.>

---

(repeat per issue)

---

## Fix plan

**R<N> round (DONE YYYY-MM-DD):** issues #X-#Y closed in <K> dedicated commits + a simplify pass.
**R<N+1> round (PENDING):** issue #Z.

After all open issues are closed:
- Append an end-to-end verification entry to `docs/STATE.md`.
- Tag vN.0.
- Leave this file in place as a permanent post-mortem record.
