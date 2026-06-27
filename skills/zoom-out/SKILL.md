---
name: zoom-out
description: User-invoked utility — pulls the agent up an abstraction layer when the user is lost in unfamiliar code. Produces a map of relevant modules, callers, and seams in `docs/CONTEXT.md` vocabulary. Use when the user says "I'm lost", "zoom out", "give me higher-level context", "I don't know this area", "what depends on what here", or invokes the slash command. Does not change which workflow the user is in — interrupts to orient, then hands back. Skip when the user already has the map and just needs to read code.
disable-model-invocation: true
---

# Zoom Out

A user-invoked interrupt: the user is mid-task in an unfamiliar area and needs the topology before they keep going. The skill produces a map — what modules exist, which depend on which, what the seams look like, what each is responsible for — so the user can resume their original workflow with context.

This skill **does not change the workflow** the user is in. It runs once, produces the map, and hands back. The user is still in their bug-fix / feature / refactor.

## When to use

- User says "I'm lost", "zoom out", "give me higher-level context", "what depends on what here", "I don't know this area".
- User invokes the slash command (`/zoom-out`).
- A related skill (`debug`, `improve-codebase-architecture`, Workflow 4 / 5b) suggests zooming out before continuing.

## When to skip

- User already has the map and just needs to read code.
- Single-file scope — there's nothing to zoom out from.
- User is asking for a code review or a specific implementation question; zoom-out is *prelude*, not the answer.

## Process

### 1. Identify the area

Ask the user (or infer from context) what they're trying to do. The map is scoped to *the area relevant to that task*, not the whole codebase.

### 2. Read the project's vocabulary first

- [`docs/CONTEXT.md`](../../docs/CONTEXT.md) — the domain glossary. Module names should come from here.
- [`docs/architecture.md`](../../docs/architecture.md) — the system map, if it exists.
- Any ADRs in [`docs/adr/`](../../docs/adr/) that constrain the area.

If `CONTEXT.md` doesn't exist yet (greenfield repo), name modules by their file paths and flag the missing glossary as a gap.

### 3. Walk the dependency graph for the area

Use the Agent tool with `subagent_type=Explore` if the area is broad. Capture:

- **Modules involved** — which directories / packages / files implement the responsibility.
- **Callers** — what calls into this area, from where.
- **Callees** — what this area calls into.
- **Seams** — function calls, queue events, HTTP boundaries, DB tables shared across the area.

### 4. Produce the map

A short artifact, in chat (not on disk unless the user asks). Use the format below — it's what callers expect.

```md
## Map: <area>

**Responsibility**: <one sentence — what this area does>

**Modules**:
- `<path>` — <one-line responsibility, in CONTEXT.md vocabulary>
- ...

**Callers** (who depends on this):
- `<path>` — <how it uses the area>
- ...

**Callees** (what this depends on):
- `<path>` — <what it provides>
- ...

**Seams**:
- <Module A> ↔ <Module B>: <in-process | queue | HTTP | DB-shared>; <where the adapter lives>
- ...

**Decisions worth knowing**:
- ADR-NNN: <one line — why this constraint matters here>
- ...

**Gaps spotted while mapping** (optional):
- <e.g. "shallow module at <path> — possibly worth deepening; not blocking your task">
```

Keep it on one screen. If it doesn't fit, you over-zoomed — narrow the area.

## Anti-patterns

- **Drawing the whole codebase.** The map is scoped to the user's task. A full codebase tour wastes the user's attention.
- **Listing files without responsibilities.** A list of paths isn't a map. Each entry needs a one-line "what it does", in domain vocabulary.
- **Inventing names.** If `CONTEXT.md` calls it "Order intake", don't call it "OrderHandler" or "the order service". Use the canonical name.
- **Persisting the map without being asked.** This skill outputs to chat. If the user wants a durable artifact, that's `system-design` (greenfield) or `improve-codebase-architecture` (brownfield) — different skills with different outputs.
- **Making decisions during zoom-out.** This is a mapping skill, not a decision skill. Surface gaps; don't propose solutions.

## Pairing with other skills

- **`debug`** — runs before debug when the area is unfamiliar. Easier to bisect when you know the topology. ([`debug/SKILL.md`](../debug/SKILL.md) calls this out.)
- **`improve-codebase-architecture`** — runs before. Map first, then propose deepening candidates.
- **`feature-doc`** — runs before, when a feature touches an unfamiliar area and the writer needs vocabulary before drafting ACs.
- **Any workflow** can pause for `zoom-out` and resume — the skill does not change which workflow the user is in.

## Done when

- The user has a one-screen map of the area, in `CONTEXT.md` vocabulary.
- Modules, callers, callees, seams, and load-bearing ADRs are named with cite-able paths.
- The user explicitly resumes the original task or asks a specific follow-up — don't keep mapping past their patience.
