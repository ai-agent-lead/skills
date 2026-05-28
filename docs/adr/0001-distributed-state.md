# Distributed and Feature-Scoped State

**Status:** accepted
**Date:** 2026-05-25

We decided to move away from a single global `docs/STATE.md` for `tdd-rounds` and instead use feature-scoped state stored under `docs/features/<name>/state/`.

## Context

As the number of concurrent features grows, a single `docs/STATE.md` becomes a bottleneck and a source of merge conflicts. It also forces agents to read unrelated state when working on a specific feature, wasting context.

## Decision

1. Every feature implemented via `tdd-rounds` will have its own state directory: `docs/features/<name>/state/`.
2. A `snapshot.md` file in that directory will serve as the living summary of the current feature state.
3. Immutable round logs will be stored in `docs/features/<name>/state/rounds/*.md`.
4. The root `docs/STATE.md` will be demoted to a global manifest/index that only points to active features.

## Consequences

- Reduced context usage for agents as they only read the state relevant to their feature.
- Easier parallel development of multiple features.
- More granular and immutable history of round execution.
