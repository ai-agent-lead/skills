---
name: tdd-rounds
description: Multi-round TDD orchestration. Use when delivering a feature larger than one TDD slice — typically 5-15 acceptance criteria across multiple packages — by dispatching Builder sub-agents per round, with the parent maintaining state and verifying. Triggered when the user mentions "drive the sub-agent team", "multi-round TDD", "orchestrate rounds", "Builder agents", or when a plan from `feature-doc` lists more ACs than one agent should reasonably tackle in a single invocation. Pairs with `tdd` (Builders invoke that skill per round) and `prod-ready` (final round before tag).
complexity: high
expected_duration: 1 hour
---

# Multi-Round TDD Orchestration

Distills the pattern of a parent agent driving Builder sub-agents through a feature's acceptance criteria, one round per AC slice. The parent does not write code; the parent writes briefs, reviews diffs, runs verification, and keeps the running summary.

## When to use

- A feature doc has more ACs (say, ≥10) than one agent invocation can hold cleanly.
- Multiple packages are involved; serial rounds let each one land cleanly before the next builds on top.
- Cross-round invariants matter (test green every round, not just at the end).

## When to skip

- Single-AC bug fix or single-package feature — invoke `tdd` directly, no round overhead.
- Pure refactor with no AC changes — use the `improve-codebase-architecture` flow instead.

## The parent's contract

- **Plan once.** The plan file lists rounds, each round's ACs, the dependency order, and the skills cadence per round (which rounds need `design`; when to invoke `improve-codebase-architecture` mid-project; when to invoke `prod-ready`).
- **Brief per round.** A self-contained brief — the Builder shouldn't need conversation history. 
  - **Briefing Sub-agent**: For complex rounds, invoke a sub-agent to autonomously generate the brief by analyzing `docs/STATE.md`, the `feature-doc`, and the results of the previous round. See `templates/builder-brief.md` for the schema.
- **Verify after each round.** Run the test command independently (don't trust the Builder's pasted output), read the diff, tick AC checkboxes in the feature doc with the test name, append a round summary to `docs/STATE.md`.
- **Never write code yourself.** If you find yourself doing it directly under time pressure, that's a signal the round was misscoped — split it.

## The Builder's contract

When dispatched for a round, the Builder:

1. Reads the brief, the plan file, `docs/STATE.md`, and any ADRs / feature docs the brief cites.
2. **Executes the listed skills sequentially in this single invocation.** When a brief says "Skills (in order): design, tdd, simplify" — that means run all three in this run, not return to the parent between them. This rule is non-obvious; the brief template makes it explicit.
3. Commits per AC slice (or per behavior slice for refactor rounds), prefix `R<N>:`. **Read [`COMMITS.md`](COMMITS.md) before the first commit** — it captures the seven rules (`R<N>:` prefix, `#<X>` for bug fixes, per-AC slicing, separate simplify-pass commit, separate doc commits, single-commit-with-justification, honest messages) and the message-body shape. The parent reads commits as the review surface; a clean sequence is reviewable one diff at a time, a mono-commit isn't.
4. Returns the structured report from `templates/builder-report.md`.
5. Does NOT push, does NOT touch files outside the brief's allowlist.

## Skills cadence

| Skill | Invoked by | When |
|---|---|---|
| [`design`](../design/SKILL.md) | Builder | Rounds introducing a new package or non-trivial interface. Skip on rounds that only extend existing modules. |
| [`tdd`](../tdd/SKILL.md) | Builder | **Every** code-writing round. Mandatory. |
| [`simplify`](../simplify/SKILL.md) | Builder | End of every round, after green. Single sweep — reuse / quality / efficiency / test relevance. Lands as its own commit ([COMMITS.md rule 4](COMMITS.md)). |
| [`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md) | **Parent** | Once mid-project, after the load-bearing seams exist. Surfaced opportunities become dedicated refactor rounds (no behavior change; ACs are "all existing tests still green"). |
| [`prod-ready`](../prod-ready/SKILL.md) | Builder, final round only | Pre-tag operational checklist. Output the filled checklist verbatim in the Builder's report. |
| [`verify-real-deps`](../verify-real-deps/SKILL.md) | **Parent** | After `prod-ready` clean, before tagging. Catches what unit/integration tests can't see — wire-shape mismatches against real third-party APIs. |

## State tracking

`docs/STATE.md` is the parent-maintained running summary, append-only, ~one entry per round. The Builder reads it as pre-flight context for the round; the parent appends after each round closes. Single source of truth for "what we have so far" between Builder invocations.

Format per round:

```
## Round N — <title> (DONE YYYY-MM-DD)
Delivered: AC-NN, AC-NN
New packages: <list>
Public types: <one line>
Invariants now enforced: <one line>
Known follow-ups: <one line>
```

## Failure modes and recovery

- **Builder stuck (test won't go green / design feels wrong).** Builder reports a *blocking* open question instead of thrashing. Hard rule: **Builder must not silently descope an AC.**
  - **Concrete escalation signals** (any one fires → stop and surface):
    - 3 consecutive failed attempts at making the same test green with the same approach.
    - 2 design-level questions that the brief + feature state + cited ADRs don't answer.
    - The Builder finds itself wanting to modify a file in the "must NOT touch" allowlist to make progress.
    - A new test would require mocking >3 internal collaborators (smell: design is wrong, not the test).
  - **Parent's response**: shrink scope (split the round), or invoke `design` explicitly with the friction described, or run `grill-plan` if a load-bearing decision is wobbling. Don't push the Builder to keep trying.
- **Round breaks earlier rounds' tests.** Parent-review failure. Fix is a follow-up round, scope = "restore green for tests X, Y; explain what regressed; adjust ADR if needed." Never amend prior commits.
- **ADR turns out wrong mid-round.** Builder stops with a blocking open question. Parent runs `grill-plan` or writes a superseding ADR. The current round restarts with the new ADR as input.
- **User redirects mid-round.** Cancel the in-flight Task. No partial-round commit. Re-brief and re-run. Sub-agent state is ephemeral by design.
- **Brief was wrong.** Parent rewrites the brief, re-dispatches. Don't try to "fix it up" through follow-up messages — sub-agents work better from a clean self-contained brief.

## Templates

- [`templates/builder-brief.md`](templates/builder-brief.md) — the self-contained brief shape the parent fills in per round.
- [`templates/builder-report.md`](templates/builder-report.md) — the structured report shape the Builder returns.

## Supporting docs

- [`COMMITS.md`](COMMITS.md) — commit cadence and message style (per-AC slicing, `R<N>:` prefix, when single-commit is OK, honesty rule). Builders read this before the first commit.

## Handoff

When the final round completes:

1. Run `verify-real-deps`. Capture surfaced bugs into `docs/known-issues.md`.
2. Iterate fix-rounds until clean, or document deferrals to vN.1 with rationale.
3. Tag and publish via whatever release / distribution channel applies.
hape the Builder returns.

## Supporting docs

- [`COMMITS.md`](COMMITS.md) — commit cadence and message style (per-AC slicing, `R<N>:` prefix, when single-commit is OK, honesty rule). Builders read this before the first commit.

## Handoff

When the final round completes:

1. Run `verify-real-deps`. Capture surfaced bugs into `docs/known-issues.md`.
2. Iterate fix-rounds until clean, or document deferrals to vN.1 with rationale.
3. Tag and publish via whatever release / distribution channel applies.
