---
name: pr-review
description: Discipline for reviewing someone else's pull request — the inverse of `prod-ready` (which is the author's pre-merge gate). Use when the user asks to "review this PR", "look over the diff", "check this change", "give feedback on", or invokes a code-review slash command. Reviews against the linked feature doc / ADRs / domain vocabulary, classifies findings by severity (blocker / suggestion / nit), and returns a structured report. Skip for trivial PRs (typo, dep bump, lint-only) — approve directly. Pairs with `prod-ready` (the author's checklist; the reviewer verifies it landed honestly), `security-review` (escalation when the diff is surface-changing), and `code-hygiene` (the line-level lens applied during the read).
complexity: medium
expected_duration: 20 minutes
---

# PR Review

The author's job is to write a defensible change. The reviewer's job is to verify the **claim** (what the PR says it does) matches the **diff** (what it actually does), against the **contract** (what the feature doc / ADR / tests said the change should be).

Most bad PR reviews are line-by-line nit fests that miss the load-bearing decisions. This skill flips the order: read the *claim* first, verify it, then walk the diff.

## Why this skill exists

- A PR reviewed line-by-line without context produces lots of comments and misses the architectural drift.
- A PR rubber-stamped after skimming the description misses the security / consistency / scope-creep failures.
- A reviewer who treats every concern as equal severity exhausts the author's attention and dilutes signal.

This skill produces a **prioritised** review where blockers are unambiguous, suggestions are framed as suggestions, and nits are clearly nits — so the author knows what must change vs what's optional.

## When to use

- The user asks for a PR review (any phrasing).
- Reviewing a Builder's round in `tdd-rounds` (the parent's verification ritual borrows from this skill).
- Reviewing your own work before opening the PR — last self-check after `prod-ready`.

## When to skip

- Typo / lint-only / formatter-only diffs. Approve.
- Dependency bumps with no API change (still: scan changelog for security advisories before approving).
- Trivial config tweaks with no behavioural change.
- PRs that are explicitly draft / WIP — give early feedback, but skip the formal severity classification until the author flags ready.

## Process

### 1. Read the claim first

Before opening the diff, read what the PR claims to do:

- **PR description / title** — what's the change? Why?
- **Linked feature doc** (`docs/features/<name>.md`) — what's the contract? Which ACs?
- **Linked ADRs** — what decisions does this change rely on or supersede?
- **Linked research note / known-issues entry** — for fix-rounds, the bug ledger entry doubles as the brief.

If there's no description / no linked artifact / no ACs, **that's the first finding**. A PR without a stated claim is not reviewable — ask the author to add one before continuing.

### 2. Verify the claim against the diff

For each AC / each ledger entry / each promised change:

- Find the test that pins it. Read the test. Does it actually exercise the claim, or does it pass while testing something adjacent?
- Find the implementation. Does the diff match the claim? Anything extra?
- Anything **missing** from the diff that the claim said would change?
- Anything **extra** in the diff that the claim didn't mention? (Scope creep; flag as a finding.)

This step is the difference between "the PR ships what it says" and "the PR ships, plus a surprise refactor and a silent feature flag." Catch the silent additions here.

### 3. Read the diff with the right lenses

In this order — biggest-impact first:

#### 3a. Architectural / interface review

- Does the change respect the dependency direction in `docs/architecture.md` and the existing ADRs?
- Are new modules deep, or shallow? (Apply the deletion test from [skills/LANGUAGE.md](../LANGUAGE.md).)
- Are new public types / functions / endpoints named consistently with `CONTEXT.md`?
- Does anything contradict an ADR without superseding it explicitly?

#### 3b. Test review

- Does each new test exercise behaviour through the public interface?
- Does each test name describe a behaviour, not a function? (See `tdd/TESTS.md`.)
- Does the test actually fail without the implementation change? If it would still pass on `main`, it's not testing the claim.
- Are mocks at boundaries only? Internal-collaborator mocks are a smell.

#### 3c. Security review (delegate when surface-changing)

If the diff introduces or alters a trust boundary, identity flow, authorization check, sensitive data path, or external surface — flag that **`security-review` is required** and hold the PR until that review lands. Don't try to inline a half-review of a surface-changing change.

For non-surface-changing diffs: walk `prod-ready` Section 3 (defense-in-depth) bullets; flag specific gaps if you see them, otherwise move on.

#### 3d. Operational review

- Walk `prod-ready`'s checklist sections relevant to the diff. Did the author's `prod-ready` pass actually land? (Verify the timeouts, the migrations idempotency, the structured logging, the doc-map.)
- A common failure mode: `prod-ready` was checked off but the diff doesn't reflect the changes the checklist would have driven. Treat that as a blocker.

#### 3e. Doc-drift audit

This is the second line of defense for `prod-ready` Section 7. Author may have missed it; reviewer catches what's left. Walk these four questions against the diff:

- **New decision with viable alternatives** → does an ADR exist in `docs/adr/` for it? Does it name what it supersedes? If load-bearing, is it referenced from the code?
- **New or changed domain term** → has [`docs/CONTEXT.md`](../../docs/CONTEXT.md) been updated? Are `_Avoid_:` aliases listed if there's risk of confusion?
- **New / removed package, changed public interface, shifted module boundary** → is the feature's design note (`docs/features/<feature>.design.md`) updated? Module map, file layout, public-interface signatures, test boundaries.
- **Changed acceptance criteria** → does the feature doc reflect what was actually built? Silently-dropped or silently-added behavior is the most common drift class — flag and don't accept "we'll fix in a follow-up".

If any answer is "no" without `n/a + reason`, that's a finding. Severity:
- **Blocker** — the missing doc is load-bearing for the next reader (ADR for a hard-to-reverse decision; CONTEXT.md entry for a term other PRs will use; AC drift hiding behavior).
- **Suggestion** — the doc would help but the diff is self-explanatory in isolation.

The doc-map is small enough to walk in 2–3 minutes. Skip it and you're trading 3 minutes now for an hour of orientation in 3 months.

#### 3e. Hygiene (line level)

Apply `code-hygiene` as a lens here, not as a primary phase:

- **Comment churn**: new WHAT-comments, stale "used by X" references, citation grammar that doesn't match the repo's comment style doc ([`skills/formats/STYLE-comments.md`](../formats/STYLE-comments.md)). These are nits individually; in aggregate they're a signal the author didn't run `simplify`. Flag as suggestions, not blockers.
- Names that mislead (boolean returning non-bool, `getX` that mutates, `Manager`/`Helper` suffixes hiding what the thing is).
- Cleverness that earns its cost? Or could be boring?
- YAGNI — "in case we need it" parameters / interfaces / classes? Strip.
- Premature extraction (Rule of 3 violated)?

Save these for last — they shouldn't outweigh architectural concerns.

### 4. Classify findings

Every finding gets a severity. **The severity is part of the finding.**

- **Blocker** — must change before merge. The PR is wrong, breaks a contract, has a security gap, regresses an AC, or contradicts a load-bearing ADR.
- **Suggestion** — the author should consider; you'd prefer a change but won't block. Includes design alternatives, missing-but-non-essential tests, hygiene improvements with real impact.
- **Nit** — taste-level. Naming preferences, whitespace, tiny refactors. The author can resolve or dismiss without further discussion.
- **Question** — you genuinely don't understand and need the author to explain before you can rank it. Asking "why this approach?" is fine; using questions as passive-aggressive blockers is not.

Default to fewer blockers. A review with 12 blockers is usually a review with 1 blocker and 11 suggestions miscategorised.

### 5. Write the review

Structured, scannable. The author should be able to triage in one read.

```md
## PR review: <title>

**Verdict**: Approve | Approve with suggestions | Request changes | Needs security-review first

**Claim verification**:
- Description matches diff: yes / partial — <what's extra or missing>
- ACs covered: AC-XX (test `name`), AC-YY (test `name`), ...
- Linked ADRs respected: yes / <which one is in tension>

**Blockers**:
- [file:line] <issue>. <why it blocks>. <what would unblock>.
- ...

**Suggestions**:
- [file:line] <issue>. <why>. <what to consider>.
- ...

**Nits**:
- [file:line] <one-liner>.
- ...

**Questions**:
- [file:line] <question>.
- ...
```

Empty sections: write `_none_` rather than omit. Explicit beats implicit.

## Severity calibration — one rule

If you label something a blocker, you must be able to finish this sentence: *"This change cannot merge as-is because ___."* If your reason is "I'd prefer X" or "in my style", it's a suggestion. If it's "the AC isn't covered" or "the trust boundary is open" or "the ADR contradicts this", it's a blocker.

## Anti-patterns

- **Drive-by approve.** "LGTM" without reading the linked artifacts. The artifacts exist so reviewers can verify the claim; skipping them defeats the discipline.
- **Re-litigating decided ADRs.** If the change implements an ADR-blessed approach you disagree with, the place to argue is a new ADR (or a `grill-plan` session), not the PR. Note the disagreement, don't block on it.
- **Miscategorised severity.** Calling a naming preference a blocker burns trust. Calling a missing AC a suggestion misses the point of review.
- **Architectural review as nit pile.** If you have ten line-level comments and zero architectural finding on a 500-line PR, you reviewed at the wrong altitude.
- **Reviewing the author, not the diff.** Address the change, not the person. "This function does X, but the AC says Y" — not "you didn't understand the AC."
- **Ignoring the `prod-ready` line item.** If the PR claims `prod-ready` was run, verify a sample of items. Otherwise it becomes a checkbox both sides ignore.

## When this skill is invoked by `tdd-rounds` parents

A `tdd-rounds` parent verifying a Builder's round runs a focused subset:

1. Read the Builder's structured report (`templates/builder-report.md`).
2. Run the test command independently — don't trust pasted output.
3. Read the diff, classify findings.
4. Tick AC checkboxes in the feature doc with the test names.
5. Append the round summary to `docs/STATE.md`.

The classification (blocker / suggestion / nit) lives in the parent's notes; only blockers gate the next round.

## Pairing with other skills

- **`prod-ready`** is the author's pre-merge checklist. Reviewer verifies it landed.
- **`sync-check`** is the diagnostic context auditor. Reviewer runs it (or verifies it was run) to catch terminology drift and ADR contradictions early.
- **`security-review`** is the surface-change escalation. Reviewer flags when required.
- **`code-hygiene`** is the line-level lens applied during the read.
- **`grill-plan`** is where load-bearing disagreements go (a new ADR, not a PR comment thread).
- **`debug`** if a finding turns out to be "this PR introduces a bug" — switch to debug to characterise it before recommending a change.

## Done when

- The claim is verified or contradicted, with citations.
- Every finding has a severity, a file:line, and a concrete next step.
- Blockers are genuinely blocking ("cannot merge because ___").
- The verdict is one of the four states; ambiguous reviews leave the author guessing.
