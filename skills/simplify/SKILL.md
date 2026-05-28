---
name: simplify
description: Single end-of-round sweep that tightens what `tdd` just left green — review every changed file for reuse, quality, efficiency, and test relevance. Use after `tdd` reaches green and before opening a PR (or before a Builder closes a round in `tdd-rounds`). Triggered by phrases like "simplify pass", "tighten this", "clean up before commit", "end-of-round sweep", or appearing as a step in a Builder brief. Skip for trivial diffs (typo, dep bump, doc-only). Pairs with `tdd` (runs immediately after green), `code-hygiene` (the lens applied during the sweep), and `pr-review` (a self-check after this).
complexity: low
expected_duration: 10 minutes
---

# Simplify

A single sweep over every file changed in the current slice (or round) to remove what doesn't earn its keep, before the diff is reviewed by anyone else.

This is **one pass, not a license to refactor**. If you find structural issues that need their own round, surface them rather than expanding the sweep.

## Why this skill exists

`tdd` reaches green on the *minimum code that satisfies the test*. That's the right discipline — but the residue often includes:

- Helpers extracted at one caller (premature abstraction).
- Names that read OK in isolation but mislead next to the AC.
- Tests that pass without actually exercising the AC (false-green).
- Dead branches left behind from a path you tried and abandoned.

The simplify pass catches these once, deliberately, before the diff lands. Without it, the residue compounds round-over-round.

## When to use

- After `tdd` reaches green, before opening a PR.
- At the end of every round in `tdd-rounds` (Builder responsibility — a separate commit per [`tdd-rounds/COMMITS.md`](../tdd-rounds/COMMITS.md) rule 4).
- After a focused refactor when you want a final sweep before merging.

## When to skip

- Typo / dep bump / lint-only / doc-only diffs.
- Slices where the diff is one or two lines and there's nothing to sweep.
- During red phase — never refactor while red. See [`tdd/SKILL.md`](../tdd/SKILL.md).

## The four lenses

Walk every changed file. Apply each lens in order. Fix what you find inline.

### 1. Reuse — extract duplication that crossed file boundaries

- Did a helper get inlined in two places this slice? Extract it (Rule of 3 may already apply if the third occurrence existed before this round).
- Was a constant repeated? Hoist it.
- **Don't extract speculatively.** A helper with one caller is an abstraction in search of a use.

### 2. Quality — names, errors, abstractions

- Names that read clearly out of context — would a stranger guess what `result`, `data`, `value` referred to? If not, rename.
- Error messages that name the failing input — `"could not parse: <value>"` beats `"parse error"`.
- Abstractions that haven't earned their keep — a base class with one subclass, an interface with one implementation. Inline.
- Comments — **default during the sweep is DELETE**:
  - Delete WHAT-comments (the code already says it).
  - Delete docstrings on exports whose contract is obvious from the signature.
  - Delete "used by X" / "added for Y" caller references — these rot; use grep.
  - Delete commented-out code (git has it).
  - Delete banner / ASCII-art dividers and in-function section headers (`// validate`, `// build response`).
  - KEEP only why-comments — constraint, invariant, trade-off, provenance — and only when the next reader would otherwise reattempt the rejected alternative.
  - If a kept comment cites a round / ADR / AC / snapshot, normalize to [`skills/formats/STYLE-comments.md`](../formats/STYLE-comments.md) §3 (`ADR-007 §7`, `R6 AC-3`, `v0.3 R1b2`, `snapshot §"Invariants"`).

### 3. Efficiency — dead code, redundant work, premature defensive checks

- Functions, parameters, branches that were used during exploration but the green test never exercises. Delete.
- Defensive checks for conditions that can't happen given the type / caller contract. Delete.
- Repeated computation across loop iterations or call sites. Hoist where the cost is real (don't preemptively optimize).
- "In case we need it" parameters / interfaces. YAGNI — strip.

### 4. Test relevance — tests that don't pull their weight

For each test added in the slice:

- Does it fail without the implementation change? If you revert the prod code and the test still passes, it's not testing the claim. **Strengthen or delete.**
- Does it assert a behavior that matters to a caller, or shape that doesn't? See [`tdd/TESTS.md`](../tdd/TESTS.md).
- Does the name describe behavior, not function?
- Are mocks at boundaries only? Internal-collaborator mocks are a smell — fix the design, not the test.

### 5. Telemetry — the observability pass

Apply the lens from [`skills/design/OBSERVABILITY.md`](../design/OBSERVABILITY.md):

- [ ] Does every error message name the failing input?
- [ ] Are there any "catch-all" blocks that swallow errors?
- [ ] Is there a Correlation ID being propagated if the flow is non-trivial?
- [ ] Could a stranger debug a failure in this code using *only* the logs it emits?

## What this sweep is not

- **Not a structural refactor.** If you find a shallow module or a misplaced seam, surface it as an `Open question for parent` (in `tdd-rounds`) or a follow-up note (in single-feature flow). Don't expand simplify into `improve-codebase-architecture`.
- **Not new behavior.** Simplify does not add features, fix bugs unrelated to this slice, or sneak in a "while I'm here" change.
- **Not a license to rename across the codebase.** Rename what you wrote this slice; leave the rest.

If a finding requires more than ten minutes of edits or touches files outside this slice's allowlist, stop simplifying and surface it.

## Commit discipline

In `tdd-rounds`, the simplify sweep is **its own commit** ([`tdd-rounds/COMMITS.md` rule 4](../tdd-rounds/COMMITS.md#L36)) — `R<N>: simplify — <one-line summary>`. Bundling the sweep into the AC commits hides "what changed because the AC required it" from "what changed because we cleaned up after."

In single-feature flow (no rounds), the sweep can land as a separate commit before the PR or as part of the final commit if the sweep is small.

## Pairing with other skills

- **`tdd`** runs first. Simplify runs after green. Never simplify while red.
- **`code-hygiene`** is the lens — its 5 principles (boring code, naming, YAGNI, rule of 3, locality) are what you apply during the sweep. Read it once; apply it many times.
- **`pr-review`** comes after — a self-check against the diff. Some of the same lenses, applied as a reviewer rather than an author.
- **`improve-codebase-architecture`** is the escalation — when simplify surfaces structural issues bigger than a sweep can fix.

## Done when

- Every changed file walked once with the four lenses.
- Each finding either fixed inline (small) or surfaced as a follow-up (large).
- Tests still green after the sweep — re-run them.
- A separate `simplify` commit exists (in `tdd-rounds`) or the sweep is captured in the final commit message (in single-feature flow).
