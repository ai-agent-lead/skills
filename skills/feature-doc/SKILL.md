---
name: feature-doc
description: One-page contract for a non-trivial feature or bug fix — Problem, User Story, Acceptance Criteria, Non-Goals. The ACs become the test list for `tdd`. Use before any non-trivial feature or bug fix; when the user mentions "spec this out", "write a feature doc", "before any non-trivial feature", or describes a feature without listing ACs. Skip for typo fixes, dependency bumps, or pure refactors. Pairs with `tdd` / `tdd-rounds` (downstream — ACs feed the test list), `investigate` (upstream — when direction itself is unclear), and `grill-plan` (when the chosen plan needs stress-testing against existing model).
complexity: low
expected_duration: 10 minutes
---

# Feature Doc

Every non-trivial change starts with a one-page doc in `docs/features/<short-name>.md`. The doc is the **contract**: ACs become tests, Non-Goals prevent scope creep, and reviewers check the PR against this — not against memory.

## Why this skill exists

Without a contract, three failure modes are common:

- **Scope creep.** "While I'm in here…" turns a 1-AC change into a 4-AC change with no review of the new scope.
- **Untestable claims.** "Improve X" can't fail; ACs forced into Given/When/Then can.
- **Silent regressions.** Behavior added or dropped during implementation never surfaces in review because the diff is the only thing being read.

The doc is short by design — one page. If it grows, the feature is too big.

## When to use

- Any non-trivial feature or bug fix where the ACs aren't already pinned somewhere.
- After `investigate` chooses a direction (the research note triggers a feature doc).
- After `debug` names a root cause and the fix is more than a one-liner.

## When to skip

- Typo fixes, dependency bumps, lint-only / formatter-only diffs.
- Pure refactors with no AC change — use `improve-codebase-architecture` instead.
- One-line config tweaks with no behavior change.
- The change already has a feature doc; you're iterating, not starting fresh.

## Steps

1. Copy [`templates/feature-template.md`](templates/feature-template.md) to `docs/features/<short-name>.md`.
2. Fill in **Problem**, **User Story**, **Acceptance Criteria**, **Non-Goals**.
3. Get one round of review on the doc **before** writing code.
4. Update the doc if behavior changes during implementation — stale docs are worse than none.

## Rules

- **One page max.** If it grows longer, split the feature.
- **Each AC must be testable** — Given / When / Then. "Improves performance" is not an AC; "p99 of `/api/orders` is < 200ms under 100 RPS" is.
- **Non-Goals is not optional.** Empty Non-Goals usually means unclear scope. Even "none — see scope in Problem" is better than missing.
- **Doc lives in the repo, versioned with the code.** Not in a wiki, not in a Notion page, not in a Linear ticket alone.
- **Tick AC boxes only when the test is green AND merged** — not when implementation starts.

## Example: weak vs strong ACs

```md
WEAK
- [ ] Users can reset their password.
- [ ] Reset link should expire.
- [ ] Improve email deliverability.

STRONG
- [ ] Given a registered user, when they POST `/auth/reset` with their email,
      then the system emails a single-use token valid for 15 minutes.
- [ ] Given an expired or already-consumed token, when the user POSTs
      `/auth/reset/confirm` with it, then the response is `410 Gone` and
      no password change occurs.
- [ ] Given a valid token, when the user POSTs a new password,
      then the user can authenticate with the new password and the token
      is marked consumed.
```

The strong list translates 1:1 into tests. The weak list translates into vibes.

## Definition of Done for the doc

- [ ] Problem stated in 2–3 sentences.
- [ ] At least one acceptance criterion in Given / When / Then form.
- [ ] Non-goals listed (or explicitly "none — see scope in Problem").
- [ ] Reviewed by at least one other person.

## Anti-patterns

- **AC list as task list.** "Implement the login form" is a task; "Given a user with valid credentials, when they POST `/login`, then they receive a session cookie" is an AC. Tasks belong in your TODO; ACs belong in the contract.
- **Aspirational ACs.** "System is highly performant" — not testable, not falsifiable. Pin it: latency / throughput / error-rate threshold.
- **Empty Non-Goals as a habit.** "We'll figure out scope later" hides the disagreement; surface it now.
- **Spec written after the code.** The doc retrofits whatever shipped. The discipline is lost — at that point the diff is the contract, not the doc.
- **Doc lives in a wiki.** Drift starts immediately. The doc must live with the code.
- **Hidden behavior in the diff.** A feature doc with 3 ACs but a PR that ships 5 changes — the silent two are the most likely place a regression hides.

## Pairing with other skills

- **`investigate`** — runs *before* when direction is unclear. The research note's "Decided" recommendation triggers the feature doc.
- **`grill-plan`** — runs *after* when the chosen plan needs stress-testing against existing CONTEXT.md / ADRs. Or in **bootstrap mode** when the vocabulary itself is fuzzy.
- **`tdd`** — runs *next* for single-package, manageable AC count. Each AC becomes one TDD slice.
- **`tdd-rounds`** — runs *next* when the AC count is large (≥10) or multi-package. The AC list maps to round splits.
- **`security-review`** — runs *alongside* `tdd` when the feature is surface-changing (new entry point, identity flow, sensitive data path).
- **`prod-ready`** — runs after green, against this doc. Section 7 catches doc-drift if behavior shifted during implementation.

## Handoff

Once the doc is reviewed and ACs are stable:

- **Single-feature delivery** (one package, manageable AC count) → run [`tdd`](../tdd/SKILL.md). Each AC becomes one TDD slice.
- **Larger delivery** (≥10 ACs or multi-package) → run [`tdd-rounds`](../tdd-rounds/SKILL.md). The AC list maps to round splits.
- **Direction still feels uncertain after writing the doc**:
  - Project has `CONTEXT.md` and/or ADRs → run [`grill-plan`](../grill-plan/SKILL.md) to stress-test against the existing model.
  - No `CONTEXT.md` or ADRs yet → run [`investigate`](../investigate/SKILL.md) to map options first; or, if the plan is chosen but vocabulary is fuzzy, run `grill-plan` in [bootstrap mode](../grill-plan/BOOTSTRAP.md).
- **Hard-to-reverse / surface-changing** (new auth flow, public API, sensitive data flow) → run [`security-review`](../security-review/SKILL.md) alongside `tdd` / `tdd-rounds`.

## Done when

- A feature branch (e.g. `feat/<short-name>` or `fix/<short-name>`) is checked out and the contract doc is committed on it, **not on `main`**.
- `docs/features/<short-name>.md` exists with all four required sections.
- The doc opens with OKF frontmatter (`type: feature`) per [`skills/formats/OKF.md`](../formats/OKF.md).
- ACs are testable Given / When / Then statements.
- Non-Goals is non-empty (or explicitly "none — see scope in Problem").
- One reviewer has signed off.
- Status is `Approved` and the next skill (`tdd` / `tdd-rounds` / `grill-plan` / `security-review`) is named.
