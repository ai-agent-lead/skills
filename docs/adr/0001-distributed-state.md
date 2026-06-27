---
type: adr
title: Distributed and Feature-Scoped State
description: tdd-rounds state moves from a global STATE.md to feature-scoped docs/features/<name>/state/.
tags: [tdd-rounds, state, architecture]
timestamp: 2026-05-25
status: accepted
---

# Distributed and Feature-Scoped State

**Status:** accepted

We decided to move away from a single global `docs/STATE.md` for `tdd-rounds` and instead use feature-scoped state stored under `docs/features/<name>/state/`.

## Context

As the number of concurrent features grows, a single `docs/STATE.md` becomes a bottleneck and a source of merge conflicts. It also forces agents to read unrelated state when working on a specific feature, wasting context.

## Decision

1. Every feature implemented via `tdd-rounds` will have its own state directory: `docs/features/<name>/state/`.
2. A `snapshot.md` file in that directory will serve as the living summary of the current feature state.
3. Immutable round logs will be stored in `docs/features/<name>/state/rounds/*.md`.
4. The root `docs/STATE.md` will be demoted to a global manifest/index that only points to active features.

## Alternatives considered

- **Keep the global `docs/STATE.md` and add file-level locks / per-feature sections.** Rejected: the merge-conflict surface stays the same and agents still read unrelated state on every round.
- **Scope state by date (`docs/STATE-YYYY-WW.md`).** Rejected: it cuts noise but breaks the "what is the current state of feature X" question — readers would have to scan back through weeks of files.
- **Move state into the feature doc itself (`docs/features/<name>.md`).** Rejected: the feature doc is the *contract* (Problem / ACs / Non-Goals) and should stay short and stable. Round-by-round implementation notes belong in a sibling artifact, not in the contract.

## Consequences

- Reduced context usage for agents as they only read the state relevant to their feature.
- Easier parallel development of multiple features.
- More granular and immutable history of round execution.

## Implementation status

**Pending.** The skill text in `skills/tdd-rounds/SKILL.md`, `skills/tdd-rounds/COMMITS.md`, and `skills/tdd-rounds/templates/builder-brief.md` still references `docs/STATE.md` as the single source of truth. The migration of skill text + first feature directory is tracked as a follow-up in [`docs/known-issues.md`](../known-issues.md). Until that follow-up lands, the old global model is the operational truth and the distributed model described above is the accepted direction.
