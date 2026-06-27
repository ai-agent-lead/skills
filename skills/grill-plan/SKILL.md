---
name: grill-plan
description: Grilling session that stress-tests a chosen plan against the existing domain model, sharpens terminology, and updates documentation (CONTEXT.md, ADRs) inline as decisions crystallise. Use AFTER a direction has been picked (post-`investigate` or post-`feature-doc`), when the user wants to pressure-test the plan — triggered by phrases like "grill me on this", "stress-test this plan", "walk me through this", "is this consistent with our model". Skip if the direction is still being explored — use `investigate` instead.
---

## When to use

- A direction has been picked (post-`investigate` or post-`feature-doc`) and you want to pressure-test it against the existing model.
- Mid-`improve-codebase-architecture` — the grilling loop borrows this skill's discipline.

## When to skip

- The direction is still being explored — use [`investigate`](../investigate/SKILL.md) instead.
- The plan is fully exploratory and no decisions are being committed — also `investigate`.
- The decision is trivially reversible — there's nothing to stress-test.
- Greenfield repo with no `CONTEXT.md` / ADRs yet → run [`bootstrap`](../bootstrap/SKILL.md) first.

## What to do

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase, explore the codebase instead.

## Domain awareness

During codebase exploration, also look for existing documentation:

### File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [`../formats/CONTEXT-FORMAT.md`](../formats/CONTEXT-FORMAT.md).

Don't couple `CONTEXT.md` to implementation details. Only include terms that are meaningful to domain experts.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [`../formats/ADR-FORMAT.md`](../formats/ADR-FORMAT.md).

## Pairing with other skills

- **[`investigate`](../investigate/SKILL.md)** — runs *before* when direction is unclear. Once a direction is chosen, hand off here.
- **[`DOC-DRIFT-AUDIT.md`](../formats/DOC-DRIFT-AUDIT.md)** — the terminology/ADR audit (formerly the `sync-check` skill) escalates here when it finds a terminology collision or ADR contradiction in existing code.
- **[`feature-doc`](../feature-doc/SKILL.md)** — runs *before* when a feature doc is the input to grilling, or *after* when grilling refines the plan into a feature doc.
- **[`system-design`](../system-design/SKILL.md)** — defers here for hard-to-reverse topology decisions.
- **[`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md)** — borrows this skill's grilling discipline in its own grilling loop.
- **[`tdd-rounds`](../tdd-rounds/SKILL.md)** — escalates here mid-round when an ADR is wobbling.

## Done when

- No open questions remain on the chosen plan.
- Every term used during the session has been resolved into `CONTEXT.md` (or explicitly flagged as ambiguous).
- Any decision that meets all three ADR criteria has been offered (and either accepted or declined).
- The user explicitly says "this is enough" or "let's move on" — don't keep grilling past their patience.
