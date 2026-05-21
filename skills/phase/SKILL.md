---
name: phase
description: One-page contract for a phase — a milestone-sized container of features. Phase doc captures Goal, Success Criteria, Timeline, and the list of `feature-doc`s inside it. Use when the user says "let's plan a phase", "Phase N", "milestone", "MVP / Beta / GA", "this quarter's initiative", or when scoping more than ~3 features that ship together. Skip for one-off features (use `feature-doc` directly) and for ad-hoc bug fixes. Pairs with `feature-doc` (downstream — each phase contains 1..N feature docs), `investigate` (upstream — when the phase's direction itself is unclear), and `phase-cleanup` (after — archive shipped phases).
complexity: low
expected_duration: 15 minutes
---

# Phase

A **phase** is a milestone-sized container — a release, a quarter, an MVP, a beta cut — that groups multiple `feature-doc`s under one goal. The phase doc lives at `docs/phases/<phase-name>.md` and is the rollup contract: it names the goal, the features inside, and the success criteria that close the phase.

> **Term note.** "Phase" here is the *project artifact* — a noun naming a milestone. Distinct from the `## Phases` heading used inside some SKILL.md files (e.g. [`debug`](../debug/SKILL.md), [`investigate`](../investigate/SKILL.md), [`security-review`](../security-review/SKILL.md)), which refers to internal *steps* of that skill's workflow. Same word, different scope — milestone vs. skill-internal process.

## Why this skill exists

Without a phase, three failure modes are common:

- **Feature soup.** Ten loose `docs/features/*.md` with no shared goal — reviewers can't tell which ones are blocking the release and which are stretch.
- **Drift between commitment and reality.** Someone promised "MVP by Q3" but the feature docs don't reference the MVP at all. The promise rots in Slack.
- **No clean exit.** Phases never officially end, so abandoned features accumulate forever and the next phase starts in fog. `phase-cleanup` only works if there's a phase to close.

The phase doc is short — one page, like `feature-doc`. The discipline is choosing what's in and what's out.

## When to use

- User says "let's plan Phase N", "MVP", "beta", "milestone", "this quarter", or names an initiative containing more than ~3 features.
- A `feature-doc` is being written for the first feature of a multi-feature push — write the phase doc first so the feature can link back.
- `investigate` produced a direction that needs multiple features to deliver — phase doc is the bridge before individual feature docs.
- An external commitment (launch date, customer contract, compliance deadline) caps the scope.

## When to skip

- One feature, one slice — use [`feature-doc`](../feature-doc/SKILL.md) directly. A phase wrapper for a single feature is overhead.
- Ad-hoc bug fixes, dependency bumps, typo PRs.
- Pure refactor with no user-facing surface change — use [`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md) instead.
- Direction not yet picked — run [`investigate`](../investigate/SKILL.md) first.

## Process

1. Copy [`templates/phase-template.md`](templates/phase-template.md) to `docs/phases/<phase-name>.md`. Use a stable, short, kebab-case name (`mvp-auth`, `q3-onboarding`, `beta-launch`) — it will appear in every feature doc that belongs to the phase.
2. Fill in **Goal** (one paragraph), **Success Criteria** (rollup — how you'll know the phase closed), **Timeline** (start/target end), **Features** (list of feature docs, even if some are stubs).
3. For each feature, either:
   - link to an existing `docs/features/<feature>.md`, or
   - create a stub feature doc (`Status: Draft`) via [`feature-doc`](../feature-doc/SKILL.md) and link it.
4. Add a `Phase:` line to each feature doc pointing back at `docs/phases/<phase-name>.md`. The link is two-way; one direction rots.
5. Get one round of review on the phase doc **before** any feature inside it goes to `tdd`. The phase scope is what reviewers push back on; individual ACs come later.
6. Update **Status** as the phase progresses: `Draft` → `Active` → `Shipped` → `Archived`.

## Rules

- **One page max.** If the phase doc grows long, the phase is too big — split it.
- **Phase = goal + features, not goal + tasks.** Tasks live inside each feature's AC list. The phase doc never lists tasks directly.
- **Every feature in the phase has its own `feature-doc`.** No "implicit" features. If it's worth shipping under this phase, it's worth a one-page contract.
- **Success Criteria are rollup-level, not feature-level.** Feature ACs answer "is this feature done?"; phase Success Criteria answer "is the phase done?" — usually a customer outcome, an SLO, a launch event, or "all listed features Shipped".
- **Two-way link.** Phase doc lists features; each feature doc names its phase. Both directions are checked by [`phase-cleanup`](../phase-cleanup/SKILL.md).
- **Status transitions are atomic.** Don't leave a phase in `Active` after shipping — `phase-cleanup` exists exactly to close the loop.

## Example: weak vs strong phase

```md
WEAK
Phase: Q3 work
Goal: Improve onboarding.
Features:
- Various improvements

STRONG
Phase: q3-onboarding
Goal: Cut median time-to-first-value from 18 min to under 5 min for new signups,
      so the September launch can advertise "ready in 5 minutes".
Success Criteria:
- [ ] Median TTFV on prod < 5 min over a rolling 7-day window.
- [ ] All four listed features are Shipped.
- [ ] No regression in week-1 retention (control vs treatment).
Features:
- docs/features/sso-google.md     (Approved)
- docs/features/sample-project.md (Draft)
- docs/features/in-app-checklist.md (Draft)
- docs/features/welcome-email.md  (Approved)
Timeline: 2026-06-01 → 2026-09-15
Non-Goals:
- Mobile app onboarding (separate phase Q4).
- Legacy signup flow cleanup (technical debt, not in this phase).
```

The strong version is testable as a phase — you can answer "did this phase succeed?" without re-reading every feature doc.

## Anti-patterns

- **Phase as a task list.** "Build SSO, build sample project, build email" — those are features. Each gets its own doc with ACs.
- **Phase with no exit criterion.** "Improve onboarding" doesn't close. Either a metric, a customer-facing event, or "all listed features Shipped" must be the exit.
- **Floating features.** A `docs/features/<x>.md` with no `Phase:` line during a phase-heavy project. Either it belongs to the current phase (link it) or it doesn't (defer it).
- **Phase grows mid-flight without re-review.** Adding feature #7 to a 4-feature phase without revisiting Success Criteria. The promise silently changes.
- **Multiple active phases at once.** More than one `Status: Active` phase in `docs/phases/` is usually a sign that one of them is really stalled. Make it explicit: archive the dead one.
- **Phase doc lives in a wiki / Linear epic.** Drift starts immediately. Phase docs live in the repo with the features they contain.

## Pairing with other skills

- **`investigate`** — runs *before* when the phase's direction is unclear ("should we do SSO or magic links for MVP?"). Phase doc captures the chosen direction.
- **`feature-doc`** — runs *next*, once per feature in the phase. Each feature's `Phase:` line links back.
- **`grill-plan`** — runs *between* if the phase has hard-to-reverse decisions inside (new dependency, schema migration). Stress-test before locking the phase.
- **`tdd` / `tdd-rounds`** — runs *inside each feature*, not at the phase level. The phase doc itself produces no code.
- **`phase-cleanup`** — runs *after* the phase Ships. Archives the phase doc, marks dead drafts, and updates indexes.

## Handoff

Once the phase doc is reviewed and the feature list is stable:

- **Each feature** → [`feature-doc`](../feature-doc/SKILL.md) (or extend the existing one with the `Phase:` link).
- **Hard-to-reverse decisions inside the phase** → [`grill-plan`](../grill-plan/SKILL.md) before locking.
- **Phase Shipped** → [`phase-cleanup`](../phase-cleanup/SKILL.md) to close the loop.

## Done when

- `docs/phases/<phase-name>.md` exists with Goal, Success Criteria, Timeline, Features, Non-Goals.
- Every listed feature has a `docs/features/<feature>.md` (Draft is fine) with a `Phase:` line pointing back.
- Success Criteria are testable — metric, event, or "all features Shipped".
- One reviewer has signed off on phase scope.
- Status is `Approved` (ready to start) or `Active` (already mid-flight).
