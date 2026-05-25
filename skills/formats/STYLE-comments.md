# Comment Style

Codifies the comment discipline for this codebase. New contributors (human or agent) should match what's here, and what's already in the code, rather than re-deriving conventions per package.

> Default: write **no** comment. Add one only when the WHY is non-obvious.

The code's identifiers, types, and structure already explain the *what*. A comment earns its line only when it captures something the reader cannot recover by reading the next ten lines: a constraint, an invariant, a trade-off, a workaround, or a pointer to the decision record.

---

## 1. Five kinds of comment we keep

### 1.1 Package docstring (required, one per package)

Every package starts with a multi-paragraph docstring block in its primary file.

Shape:
- One-line purpose.
- One paragraph on the design choice and its rationale.
- Round / ADR provenance for major decisions.
- The failure mode or invariant the next reader needs to know.

### 1.2 Docstrings on every exported identifier (required)

- Starts with the identifier name (`// Cache stores …`, not `// Stores …`).
- Interface methods state the **contract**, not just the action: is the call cheap, idempotent, safe under concurrency, called once per request or many times?

### 1.3 Invariant / constraint comments (encouraged)

A comment that catches a bug the next maintainer would otherwise write.
- `// Zero means 'unknown'` (and re-stated where the bug would bite).
- `// Selector must be cheap and side-effect-free; ServeHTTP may invoke Pick multiple times on 429 retry.`

### 1.4 Trade-off comments (encouraged)

Name the alternative considered and why it lost. Cite the failure mode if the choice has one.

### 1.5 Provenance comments (use the grammar in §3)

Anchor non-obvious behavior to its decision record (ADR, round, AC, snapshot).

---

## 2. Five kinds of comment we delete on sight

1. **Restates the code.** `// increment i`, `// return the user`, `// loop over items`. The code already says it.
2. **Commented-out code.** Git has it. Delete.
3. **"Added for X" / "Used by Y" caller references.** These rot the day someone renames or removes the caller. Use `grep` instead.
4. **Banner / ASCII-art dividers.** `// =====` and `// --- section ---`. Use a function or a file boundary, not a banner.
5. **Stale TODO / FIXME / HACK with no owner, ticket, ADR, or date.** Either link it to a decision record or fix it now.

---

## 3. Provenance grammar (canonical forms)

When a comment cites the project record, use **exactly one** of these forms. Comments that follow the canonical grammar are greppable and stable.

| Kind                                   | Canonical form          | Examples                                |
| -------------------------------------- | ----------------------- | --------------------------------------- |
| Architectural decision record          | `ADR-NNN §SECTION`      | `ADR-007 §7`, `ADR-002 §"Routing"`      |
| TDD round                              | `RN`                    | `R6`, `R3`                              |
| TDD round + acceptance criterion       | `RN AC-M`               | `R6 AC-3`, `R1 AC-12`                   |
| Tagged round + batch within a release  | `vX.Y RNbM`             | `v0.3 R1b2`, `v0.8 R2b1`                |
| Dated verification                     | `<kind> YYYY-MM-DD`     | `smoke-test 2026-05-09`                 |
| Feature state snapshot                 | `snapshot §SECTION`     | `snapshot §"Invariants"`                |

**Avoid** (normalize to the table above):
- `Round 6`, `round-six`, `R 6` → `R6`
- `ADR 007`, `ADR7`, `ADR-7`, `adr-007` → `ADR-007`
- `AC 3`, `AC3`, `ac-3` → `AC-3`
- Section anchors: prefer `§7` or `§"Quoted Heading"`; avoid `section 7`, `sec. 7`, `(7)`.

---

## 4. When the comment grows

If the explanation needs more than **~6 lines**, the right home is an ADR or a `docs/research/<topic>.md` note. Leave a one-line pointer in the code:

```go
// Selection rationale: see docs/research/tier-spill.md and ADR-002 §"Routing".
```

---

## 5. "Documented for the next reader" framing

When a comment exists because a future reader is **likely to make the opposite assumption**, say so explicitly:

```go
// Cold-cache choice (documented for the next reader): an account whose
// (pk, model) is not yet in the cache is treated as INELIGIBLE …
```

---

## 6. Test files

Non-trivial tests — those with fakes, harnesses, time control, channel-driven ceremonies, or unusual lifecycle — get a **5–20 line block comment at the top** of the file (or above the harness type) stating:
- What is **faked** versus real (and why each choice).
- Why the design (deterministic? avoid `time.Sleep`? exercise a specific retry path?).
- Which knobs are overridden for the test and to **what value**.

---

## 7. Done when

Apply this checklist during the [`simplify`](../simplify/SKILL.md) sweep or in code review:
- [ ] Every package has a docstring matching §1.1.
- [ ] Every exported identifier has a docstring starting with its name.
- [ ] Every comment that survived the sweep is a why, an invariant, a trade-off, or a provenance link — none restates the code.
- [ ] No commented-out code, no `// used by X`, no banner dividers, no orphan TODOs.
- [ ] Every provenance citation matches the canonical grammar in §3.
- [ ] Test files with non-trivial harnesses have a strategy preamble; trivial ones do not.
