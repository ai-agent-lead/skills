---
type: research
title: "Research: <topic>"
description: <one sentence — the question this note investigates>
tags: [<area>]
timestamp: YYYY-MM-DD
status: Open
owner: <user>
---

<!-- Frontmatter is OKF per skills/formats/OKF.md. `timestamp` is the canonical date;
     `status`/`owner` mirror the human-facing lines below (OKF models neither). -->

# Research: <topic>

**Status:** Open | Decided | Superseded
**Owner:** <user>

<!--
Status values:
- Open       — investigation in progress, or written and awaiting decision
- Decided    — user has chosen an option; record it on the Decision line below
- Superseded — replaced by a later research note or ADR; link the replacement
-->

**Decision:** _<pin the chosen option here once decided, e.g., "Option B — decided 2026-05-07">_

## Context

What's true today. Each claim should be cite-able (file:line, ADR number, doc heading). Include:
- The problem or question that triggered the investigation.
- Relevant code paths and what they do today.
- Prior ADRs / feature docs / `CONTEXT.md` entries that constrain the space.
- Existing follow-ups (TODO/FIXME) related to the topic.

## Options

### Option A — <short name>

- **Approach:** one or two sentences, concrete.
- **Pros:** what makes this attractive.
- **Cons:** what hurts. Don't soft-pedal.
- **Fit with project:** alignment with existing ADRs / conventions / team ceremony level.
- **Main tradeoff:** one line.

### Option B — <short name>

- **Approach:**
- **Pros:**
- **Cons:**
- **Fit with project:**
- **Main tradeoff:**

### Option C — <short name>

(Optional. Two to three options total. One is not a design space; six is performance art.)

## Recommendation

Option **X**.

**Reasoning:** ...

**Tradeoff being accepted:** ...

## Open Questions

Research-level unknowns the team carries forward — uncertainties to validate later, not blockers for the decision.

(Distinct from Checkpoint Questions below: those are decisions the *user* must answer before code lands; these are unknowns nobody yet has the answer to.)

- ...

## Checkpoint Questions

Decisions the user must make before any code lands. Each question should be answerable.

1. ...
2. ...

## Out of Scope

Decisions deliberately deferred from this investigation.

(Distinct from a feature doc's "Non-Goals", which lists *capabilities deliberately not built*.)

- Things the investigation deliberately does not cover.
- Adjacent decisions that should get their own research note.

## Handoff

Once a direction is picked:
- Update **Status** to `Decided` and fill in the **Decision** line at the top.
- Bold the chosen option in the Recommendation section.
- If the decision is hard-to-reverse, surprising-without-context, and the result of a real tradeoff → write an ADR and link it here.
- If a feature follows → invoke `feature-doc` and link the resulting feature doc here.
