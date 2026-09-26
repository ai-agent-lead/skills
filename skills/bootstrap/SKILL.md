---
name: bootstrap
description: Sets up the docs scaffolding for a project that has none — creates `docs/`, the initial `docs/CONTEXT.md`, and the first ADR. Use when starting a new repository or service, or adopting this skill set in a repo without `docs/CONTEXT.md`. Triggered by "new project", "start a new repo", "bootstrap the docs". Not for repos that already have `docs/CONTEXT.md`; not for initializing code (DB pools, clients, config) — no skill needed; not for deciding module topology → `system-design`.
---

# Bootstrap

This skill makes starting a new project a first-class workflow, establishing the durable artifacts that other skills rely on. It initializes the `docs/` structure and core terminology.

## Why this skill exists

Starting from a blank slate often leads to inconsistent documentation structure. This skill enforces a canonical starting point for vocabulary and architectural decisions.

## When to use

- Starting a new repository or service.
- Initializing the skills framework in an existing repository that lacks `docs/CONTEXT.md`.

## When to skip

- The repository already has `docs/CONTEXT.md` and an established `docs/` structure.
- Initializing code (a DB pool, a client, config) — that is ordinary implementation; no skill needed.

## Process

### 1. Initialize docs/

Create the standard directory structure:
- `docs/`
- `docs/adr/`
- `docs/features/`
- `docs/research/`

### 2. Seed CONTEXT.md

Ask the user for 3-7 core domain terms. Create `docs/CONTEXT.md` using the canonical format. Every doc created from here on follows [`WRITING-STYLE.md`](../formats/WRITING-STYLE.md).

### 3. Record ADR-0000

If any major architectural decisions are made during initialization, record them in `docs/adr/0000-architectural-overview.md`.

## Done when

- `docs/` directory exists with the required subdirectories.
- `docs/CONTEXT.md` is seeded with core domain terms.
- (Optional) `docs/adr/0000-architectural-overview.md` exists.

## Pairing with other skills

- **`system-design`** — runs next for a new multi-module system; it builds the topology on the vocabulary seeded here.
- **`investigate`** / **`feature-doc`** — run next for a single-service project; both assume `docs/CONTEXT.md` exists.
- **`grill-plan`** — needs the `CONTEXT.md` and ADR directory this skill creates.
