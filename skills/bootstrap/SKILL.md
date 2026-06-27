---
name: bootstrap
description: Initializes a greenfield repository. Creates the docs/ directory, the initial CONTEXT.md, and the first ADR. Triggered by phrases like "new project", "initialize", "bootstrap".
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

## Process

### 1. Initialize docs/

Create the standard directory structure:
- `docs/`
- `docs/adr/`
- `docs/features/`
- `docs/research/`

### 2. Seed CONTEXT.md

Ask the user for 3-7 core domain terms. Create `docs/CONTEXT.md` using the canonical format.

### 3. Record ADR-0000

If any major architectural decisions are made during initialization, record them in `docs/adr/0000-architectural-overview.md`.

## Done when

- `docs/` directory exists with the required subdirectories.
- `docs/CONTEXT.md` is seeded with core domain terms.
- (Optional) `docs/adr/0000-architectural-overview.md` exists.
