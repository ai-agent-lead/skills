# Workflows

How the 16 skills compose into the common paths users actually walk.

The skills aren't a flat menu — they form a workflow with branching. This file maps the canonical paths so you can see where to enter, what to expect, and what produces what.

For routing by trigger phrase, see [TRIGGERS.md](./TRIGGERS.md). For the cross-skill graph, see the relationship map in [README.md](./README.md#skill-relationship-map).

## Decision tree — where to start

```
Got a task? Pick by what you have in front of you:

┌─────────────────────────────────────┬──────────────────────────────────┐
│ Typo / dep bump / one-liner config  │ just fix it — no skill needed    │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Bug fix — root cause obvious        │ /tdd  (Workflow 5a)              │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Bug — root cause unclear/intermittent│ /debug → /tdd  (Workflow 5b)    │
├─────────────────────────────────────┼──────────────────────────────────┤
│ New SYSTEM (multi-module) greenfield│ /system-design  (Workflow 6)     │
├─────────────────────────────────────┼──────────────────────────────────┤
│ New feature in existing system      │ /feature-doc  (Workflow 1 or 2)  │
├─────────────────────────────────────┼──────────────────────────────────┤
│ New feature, direction unclear      │ /investigate  (Workflow 3)       │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Refactor existing code              │ /improve-codebase-architecture   │
│                                     │                  (Workflow 4)    │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Reviewing someone else's PR         │ /pr-review  (utility)            │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Surface-changing work (auth, public │ /security-review (gate, runs     │
│   API, sensitive data, new entry pt)│  alongside Workflow 1/2/6)       │
├─────────────────────────────────────┼──────────────────────────────────┤
│ Lost in unfamiliar area, mid-task   │ /zoom-out  (utility, anytime)    │
└─────────────────────────────────────┴──────────────────────────────────┘
```

---

## Workflow 1 — Standard greenfield feature

For a single-package feature with a manageable acceptance-criteria count.

```
   [user has a clear idea]
            │
            ▼
       feature-doc  ──── produces: docs/features/<name>.md
            │             (Problem, User Story, ACs, Non-Goals)
            │
            ▼
   [doc reviewed; ACs stable]
            │
            ├─── Surface-changing? (new entry point, identity flow,
            │     authz, sensitive data, external dep)
            │       └─► security-review  ──── runs alongside design/tdd;
            │             produces: feature-doc Security section
            │             or docs/security/<feature>.md
            │
            ▼
       (optional) design ──── new module shape; optional sibling
            │                 docs/features/<name>.design.md if non-trivial
            │
            ▼
          tdd  ──── red → green → refactor, per AC
            │
            ▼
       simplify  ──── end-of-slice sweep (reuse / quality /
            │         efficiency / test relevance)
            │
            ▼
       prod-ready  ──── 7-section checklist
            │
            ▼
       (optional) pr-review  ── self-check against the diff before opening
            │
            ▼
       [PR / merge]
```

---

## Workflow 2 — Large feature *(≥ 10 ACs or multi-package)*

```
   feature-doc  (lists many ACs)
        │
        ▼
   tdd-rounds  ──── parent plans rounds, dispatches Builders
        │
        ▼
   ┌──────── Round N ────────┐
   │   Parent writes brief    │  ◄─── self-contained, references docs/STATE.md
   │              │           │
   │              ▼           │
   │   Builder is dispatched  │
   │   Builder runs IN ORDER: │
   │     • design  (if new pkg)
   │     • tdd     (mandatory every round)
   │     • simplify (end of round)
   │     • prod-ready (final round only)
   │              │           │
   │              ▼           │
   │   Builder commits per AC slice (R<N>: prefix)
   │              │           │
   │              ▼           │
   │   Builder returns report │
   │              │           │
   │              ▼           │
   │   Parent reviews diff,   │
   │   runs tests independently,
   │   appends to STATE.md    │
   └──────────┬───────────────┘
              │
              ▼
   [parent runs improve-codebase-architecture ONCE mid-project]
              │
              ▼
   [continue rounds until all ACs green]
              │
              ▼
   verify-real-deps  ──── parent, against real upstream
              │             produces: docs/known-issues.md
              │
              ▼
   [bug ledger entries → fix-rounds via tdd-rounds → loop]
              │
              ▼
       [tag vN.0]
```

---

## Workflow 3 — Investigation before commitment

For non-trivial structural decisions: new dependency, framework choice, cross-cutting refactor.

```
   [user has structural decision pending]
            │
            ▼
       investigate  ──── 5 phases:
            │             1. Survey current state (cite path:line)
            │             2. Map 2-3 options
            │             3. Recommend with reasoning
            │             4. Checkpoint questions
            │             5. (Optional) independent review
            │
            │             produces: docs/research/<topic>.md
            ▼
   [user picks an option]
            │
            ├─── Hard to reverse / load-bearing? ─────► grill-plan ───► ADR
            │                                              │
            │                                              ▼
            │                                       docs/adr/<n>-<topic>.md
            │
            ▼
       feature-doc  (capture chosen direction as a contract)
            │
            ▼
       [→ Workflow 1 or 2]
```

---

## Workflow 4 — Refactoring existing code

```
   [user wants to improve architecture]
            │
            ▼
       (optional) zoom-out  ──── if unfamiliar with the area
            │                    map of relevant modules + callers
            │
            ▼
       improve-codebase-architecture
            │
            ├─ explore (with Explore subagent)
            ├─ apply DELETION TEST to suspect modules
            ├─ present numbered candidate list
            ▼
       [user picks one candidate]
            │
            ▼
       [grilling loop — design deepened module's interface]
            │
            ├─ updates CONTEXT.md inline if new term
            └─ offers ADR if user rejects with load-bearing reason
            ▼
       tdd  (or tdd-rounds if cross-package)
            │     refactor rounds: ACs are "all existing tests still green"
            ▼
       prod-ready
            │
            ▼
       [PR]

   If user wants more candidates, run improve-codebase-architecture again.
   Don't batch multiple candidates in one pass.
```

---

## Workflow 5a — Bug fix, root cause obvious

When the symptom and stack trace point at the bug directly.

```
   [bug report — root cause clear from message/trace]
            │
            ├─── Trivial (typo, config) ────► just fix it (no skills)
            │
            ▼ (real bug, but cause is known)
          tdd  ──── 1. Failing test reproducing the bug
            │       2. Fix
            │       3. Refactor with the test as safety net
            │
            ▼
   [touches infra / auth / DB / API surface?]
            │
            ├─── YES, surface-changing ──► security-review  ──► prod-ready
            │
            ├─── YES, infra/DB/ops ──────► prod-ready
            │
            └─── NO ─────────────────────► [skip prod-ready]
            │
            ▼
       [PR]
```

## Workflow 5b — Bug fix, root cause unclear

When the bug is intermittent, environment-specific, a regression, or you don't yet know what to assert.

```
   [bug report — symptom present, root cause not obvious]
            │
            ▼
       (optional) zoom-out  ──── if unfamiliar with the area
            │
            ▼
        debug  ──── 1. Reproduce (minimum reliable repro)
            │       2. Isolate (bisect / log / trace)
            │       3. Hypothesis test (one variable at a time)
            │       4. Name root cause (distinct from symptom)
            │
            │       optional: docs/research/<bug-slug>.md
            │
            ▼
   [root cause named, blast radius known]
            │
            ▼
          tdd  ──── failing test from the reproduction →
            │       fix at the named region → refactor
            │
            ▼
   [touches surface / infra / auth?]
            │
            ├─── YES, surface-changing ──► security-review  ──► prod-ready
            │
            ├─── YES, infra/DB/ops ──────► prod-ready
            │
            └─── NO ─────────────────────► [skip prod-ready]
            │
            ▼
       [PR]
```

---

## Workflow 6 — Greenfield system *(new multi-module project from scratch)*

```
   [user starts a new system]
            │
            ▼
       (optional) investigate  ──── if direction itself is unclear
            │                       (architecture style, framework choice)
            │
            ▼
       system-design  ──── name modules, set dependencies, identify seams
            │                produces: docs/architecture.md (system map)
            │
            ▼
   [topology stable]
            │
            ├── For each module with a public interface  ──► design
            │
            └── For any hard-to-reverse topology decision ──► grill-plan ──► ADR
            │
            ▼
       feature-doc  (first feature using the topology)
            │
            ▼
       [→ Workflow 1 or 2 per feature]
```

This workflow runs **once per system**, not per feature. After it, each feature follows its own Workflow 1 or 2 within the established topology.

---

## Utility — `/zoom-out`

```
   [user feels lost in unfamiliar code, mid-task]
            │
            ▼
       /zoom-out  ──── user-invoked only (disable-model-invocation: true)
            │
            ▼
   [Claude maps the relevant modules + callers
    using docs/CONTEXT.md vocabulary]
            │
            ▼
   [user returns to original workflow with better context]
```

---

## Cross-workflow patterns

A few things that happen across all workflows:

1. **`zoom-out` can interrupt any workflow.** Slash command, user-only — pulls Claude up an abstraction layer when the user is lost. Doesn't change which workflow they're in.

2. **`grill-plan` is reusable as a sub-step.** Workflow 3 calls it explicitly; Workflow 4's grilling loop borrows the same discipline. It's also valid as a standalone skill if the user has a plan they want to stress-test. Has a **bootstrap mode** for greenfield repos with no `CONTEXT.md` / ADRs yet — the session creates them lazily.

3. **`design` doesn't have a workflow of its own** — it's a sub-step inside Workflow 1, 2, and 4. Always paired with `tdd` (or implicitly with `tdd-rounds`). Optional sibling artifact `docs/features/<name>.design.md` when the module shape is non-trivial.

4. **`code-hygiene` is a lens, not a phase.** Apply it during the simplify sweep that follows TDD green, during `pr-review`, or whenever you re-read code and pause to understand it. Especially relevant in Workflows 1, 2, 4, and 5.

5. **`debug` runs *before* `tdd` for non-trivial bugs.** Workflow 5b makes this explicit. The reproduction from `debug` becomes the failing test for `tdd`. Skip for bugs whose root cause is obvious from the trace (Workflow 5a).

6. **`security-review` is a gate, not a workflow.** Fires when a change is **surface-changing** — new entry point, identity / session / token flow, authorization logic, sensitive-data path, new external dependency, secrets handling. Runs alongside `design` and `tdd` in Workflows 1, 2, 4, 5a, 5b, 6 whenever those criteria hit. Not a substitute for `prod-ready` Section 3 — both run when the surface changes.

7. **`pr-review` is a utility workflow.** Runs when reviewing someone else's PR. Also runs (lighter form) as a self-check before opening the PR. The `tdd-rounds` parent's per-round verification borrows from it.

8. **`prod-ready` is the universal pre-merge gate** for Workflows 1, 2, 4, and sometimes 5. Single exit ramp before opening a PR.

9. **`verify-real-deps` fires whenever a workflow ends in a tagged release that touches a third-party API.** Most commonly that's Workflow 2 (large feature → tag), but it also applies when Workflow 1, 4, or 6 culminates in a release whose code path talks to an upstream you don't control. It does **not** fire for pure-internal services with database-only state, or for continuous-deploy environments that don't tag.

10. **`system-design` runs once per system, not per feature.** It's the greenfield precursor to Workflows 1 and 2. Once the topology is set, individual features run their own Workflow 1 or 2 inside it.

11. **Vocabulary is shared.** All architecture-talking skills (`design`, `system-design`, `improve-codebase-architecture`, `pr-review`, `grill-plan`) read from [`skills/LANGUAGE.md`](./LANGUAGE.md). Format references (ADRs, CONTEXT.md) live in [`skills/formats/`](./formats/). Domain vocabulary (Customer, Order, etc.) lives in `docs/CONTEXT.md`. Keep them distinct.

13. **Bootstrap mode for greenfield repos** is documented in one place — [`grill-plan/BOOTSTRAP.md`](./grill-plan/BOOTSTRAP.md). `feature-doc` and `system-design` defer there rather than re-explaining the rules.

14. **`simplify` is the end-of-slice / end-of-round sweep.** Runs after every `tdd` slice goes green; in `tdd-rounds`, lands as its own commit per [`tdd-rounds/COMMITS.md` rule 4](./tdd-rounds/COMMITS.md). Applies the `code-hygiene` lens to the changed files, plus a test-relevance check. Distinct from `code-hygiene` (the lens) and from `improve-codebase-architecture` (the structural escalation when simplify finds bigger issues).

12. **Artifacts accumulate in `docs/`:**

    | Location | Produced by | Type |
    |---|---|---|
    | `docs/features/<name>.md` | `feature-doc` | One per feature |
    | `docs/features/<name>.design.md` | `design` (optional) | One per feature with non-trivial module shape |
    | `docs/research/<topic>.md` | `investigate`, `debug` (optional) | One per investigation or non-trivial bug |
    | `docs/adr/<n>-<topic>.md` | `grill-plan`, `improve-codebase-architecture` | One per architectural decision |
    | `docs/CONTEXT.md` | `grill-plan`, `improve-codebase-architecture` (inline updates) | One per repo / context |
    | `docs/architecture.md` | `system-design` | One per system (the system map) |
    | `docs/STATE.md` | `tdd-rounds` parent (append-only) | One per multi-round project |
    | `docs/security/<feature>.md` | `security-review` (high-stakes only) | One per surface-changing feature where a feature-doc section isn't enough |
    | `docs/benchmarks/<feature>.md` | `bench` | One per performance-critical feature |
    | `docs/known-issues.md` | `verify-real-deps` | One per repo (post-mortem record) |
    All `docs/` files are created **lazily** — they don't have to pre-exist for a workflow to run. The skill creates them on first use.
s/known-issues.md` | `verify-real-deps` | One per repo (post-mortem record) |

    All `docs/` files are created **lazily** — they don't have to pre-exist for a workflow to run. The skill creates them on first use.
