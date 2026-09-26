---
type: research
title: "Research: <topic>"
description: <one sentence — the question this note investigates>
tags: [<area>]
timestamp: YYYY-MM-DD
status: open
owner: <user>
---

<!-- Frontmatter is OKF per skills/formats/OKF.md; status lives only there.
status: open → decided (investigate, when the user picks); or superseded (link the replacement).
See skills/formats/DOCS-LAYOUT.md §2. -->

# Research: <topic>

**Decision:** _<pin the chosen option here once decided, e.g., "Option B — decided 2026-05-07">_

## Context

What's true today, answer first. Each claim should be cite-able (file:line, ADR number, doc heading). When the question is about flow or structure, open with a diagram of how it works today (Mermaid — see `skills/formats/WRITING-STYLE.md`). Include:
- The problem or question that triggered the investigation.
- Relevant code paths and what they do today.
- Prior ADRs / feature docs / `CONTEXT.md` entries that constrain the space.
- Existing follow-ups (TODO/FIXME) related to the topic.

## Options

### At a glance

| Option | Approach (one line) | Main cost | Fit with project |
| --- | --- | --- | --- |
| A — <name> | | | |
| B — <name> | | | |

### Option A — <short name>

- **Approach:** one or two sentences, concrete.
- **Picture:** optional — a small diagram when the options differ in shape (where the new piece sits, how data moves).
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
- Set `status: decided` in the frontmatter and fill in the **Decision** line at the top.
- Bold the chosen option in the Recommendation section.
- If the decision is hard-to-reverse, surprising-without-context, and the result of a real tradeoff → write an ADR and link it here.
- If a feature follows → invoke `feature-doc` and link the resulting feature doc here.
