# Comment Style

Codifies the comment discipline for this codebase. New contributors (human or agent) match what's here, rather than re-deriving conventions per package.

> **Default: write NO comment.** Add one only when the WHY is non-obvious AND a future reader is likely to make the opposite assumption.

The code's identifiers, types, and structure explain the *what*. A comment earns its line only when it captures something the reader cannot recover by reading the next ten lines: a constraint, an invariant, a trade-off, or a pointer to the decision record. If you're unsure whether a comment earns its keep, **delete it** — git history and the next maintainer will be fine.

---

## 1. Three kinds of comment we keep

### 1.1 Package docstring (one per package, only when the design needs it)

A package whose design choice or invariant would not be obvious from reading the primary file gets a short docstring block:
- One-line purpose.
- One paragraph on the design choice and its rationale.
- The failure mode or invariant the next reader needs to know.

A package that is what it says it is (a thin utility, a generated stub, a glue adapter) does not need a docstring. Don't pad.

### 1.2 Docstrings on exported identifiers (only when the contract is non-obvious from the signature)

Skip the docstring on getters, simple constructors, and any function whose name + types already convey the contract. Write one only when:
- The call is **not** cheap, idempotent, or safe under concurrency, and the next reader would assume it was.
- The function may be invoked multiple times per request (e.g. retried) and that matters.
- A parameter or return has non-obvious zero-value or nil semantics (`0 = "unknown"`, `(nil, nil) = "not found"`).

When you write one, start with the identifier name (`// Cache stores …`, not `// Stores …`).

### 1.3 Invariant / constraint / trade-off / provenance (only when the alternative would otherwise be reattempted)

A comment whose absence would let the next maintainer write the bug, reattempt the rejected alternative, or "fix" the deliberate choice. If the next reader would just say "OK, sure" and move on, the comment is not earning its line.

- **Invariant** — `// Zero means 'unknown'` (and re-stated where the bug would bite).
- **Constraint** — `// Selector must be cheap and side-effect-free; ServeHTTP may invoke Pick multiple times on 429 retry.`
- **Trade-off** — `// Cold-cache choice: an account whose (pk, model) is not yet in the cache is treated as INELIGIBLE.`
- **Provenance** — `// Manual SQL instead of ORM — see ADR-007 §"Query shape".`

---

## 2. Six kinds of comment we delete on sight

1. **Restates the code.** `// increment i`, `// return the user`, `// loop over items`.
2. **Commented-out code.** Git has it. Delete.
3. **"Added for X" / "Used by Y" caller references.** These rot the day someone renames or removes the caller. Use `grep`.
4. **Banner / ASCII-art dividers.** `// =====` and `// --- section ---`. Use a function or a file boundary, not a banner.
5. **Stale TODO / FIXME / HACK with no owner, ticket, ADR, or date.** Either link it to a decision record or fix it now.
6. **Section-header comments inside a function.** `// validate`, `// build response`, `// compute total`. If a function needs internal section headers, extract those sections into named functions — the function name is the comment.

---

## 3. Provenance grammar (canonical forms)

When a kept comment cites the project record, use **exactly one** of these forms. Comments that follow the canonical grammar are greppable and stable.

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

## 5. Test files

Non-trivial tests — those with fakes, harnesses, time control, or unusual lifecycle — get a **5–20 line block comment** at the top of the file (or above the harness type) stating:
- What is **faked** versus real (and why each choice).
- Why the design (deterministic? avoid `time.Sleep`? exercise a specific retry path?).
- Which knobs are overridden and to **what value**.

Trivial tests get nothing. The test name carries the intent.

---

## 6. Done when

Apply this checklist during the [`simplify`](../simplify/SKILL.md) sweep or in code review:
- [ ] Every surviving comment names a why, invariant, trade-off, or provenance link — none restates the code.
- [ ] No commented-out code, no `// used by X`, no banner dividers, no orphan TODOs, no in-function section headers.
- [ ] Every provenance citation matches the canonical grammar in §3.
- [ ] Docstrings on exported identifiers exist only where the contract isn't obvious from the signature.
- [ ] Test files with non-trivial harnesses have a strategy preamble; trivial ones do not.
