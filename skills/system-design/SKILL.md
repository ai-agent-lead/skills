---
name: system-design
description: System-level architecture for greenfield work — name the modules, define responsibilities, set dependency direction, identify seams. Use when starting a new multi-module system or service from scratch, when defining topology before code lands, or when the user mentions "system architecture", "module boundaries", "service boundaries", "how should I structure this system", "draw the architecture", "topology". Skip for single-module work — use `design` instead. Skip for reorganizing an existing codebase — use `improve-codebase-architecture`. Pairs with `investigate` (comes before, surveying options) and `design` (comes after, shaping each module's interface).
---

# System Design

Greenfield system architecture: deciding which modules should exist, what each is responsible for, how they depend on each other, and where the seams between them live.

Distinct from `design` (which shapes ONE module's interface) and from `improve-codebase-architecture` (which deepens an EXISTING codebase). This skill is for the moment **before** code lands — you have a feature set and constraints, but no folder structure yet.

## When to use

- Starting a new project, service, or major subsystem from scratch.
- After `investigate` chose a direction, before any per-module `design` happens.
- When the codebase needs a coherent topology and one doesn't exist yet.

## When to skip

- Single-module work — use `design`.
- Existing codebase reorganization — use `improve-codebase-architecture`.
- Pure feature delivery within an established topology — go straight to `feature-doc`.

## Vocabulary

Canonical definitions in [skills/LANGUAGE.md](../LANGUAGE.md). The terms this skill leans on most: **Module**, **Responsibility**, **Seam**, **Dependency direction**, **Acyclic**, **Port**. Use them exactly — every artifact this skill produces (module table, ASCII map, ADRs) should read in the same vocabulary as the rest of the framework.

## Process

### 1. Survey

Before drawing anything, read what already exists:

- `docs/CONTEXT.md` — the domain language. Module names should come from here.
- `docs/research/<topic>.md` — any prior `investigate` runs that constrain the design.
- `docs/adr/` — decisions already taken.
- The feature set — what the system has to do.

If `CONTEXT.md` doesn't exist yet, **resolve the core domain terms first** — defer to [`grill-plan` bootstrap mode](../bootstrap/BOOTSTRAP.md) (single source of truth for the lazy-creation rules). Module names without domain terms are placeholders.

### 2. List the modules

Enumerate the modules that need to exist. For each, capture:

- **Name** — from `CONTEXT.md` vocabulary. Not from a framework or layering convention.
- **Responsibility** — one sentence. *"Manages X."* *"Receives Y events."* *"Provides Z queries."*
- **Owns** — what state, types, or invariants live behind its interface.

Aim for **few, deep modules** (per `design`'s Principle 1). Five deep modules beat fifteen shallow ones.

If you can't say a module's responsibility in one sentence, split it or merge it.

### 3. Define dependency direction

For each pair of modules, decide:

- Does A depend on B? Yes / No.
- Can the dependency direction be reversed? (Sometimes a domain module shouldn't depend on infrastructure — invert via interface in domain, implementation in infra.)

The result is a **directed graph**. Verify it's acyclic. If two modules genuinely depend on each other, they're one module.

Conventions to reach for:

- Domain modules don't depend on infrastructure — use ports-and-adapters (domain defines the interface, infra implements it).
- Application / orchestration depends on domain, not the reverse. Domain logic should be runnable in tests with no infra.
- Cross-cutting modules (logging, metrics) sit at the bottom — everything depends on them, they depend on nothing else.

### 4. Identify seams

For each cross-module dependency, name the seam:

- In-process call (function/import)?
- Queue / event bus (asynchronous)?
- Network call (HTTP / gRPC)?
- Database / shared state?

Each seam is a potential test boundary AND a potential failure point. Naming them now means adapters live where you intend, not where they accidentally end up.

### 5. Draw the system map

Output an ASCII diagram + a module table + a seam list. Save to `docs/architecture.md` (create lazily on first use).

```
                 ┌──────────────┐
                 │   HTTP API   │
                 └──────┬───────┘
                        │ commands / queries
                        ▼
   ┌──────────┐   ┌──────────────┐   ┌──────────────┐
   │   Auth   │◄──┤   Ordering   │──►│   Billing    │
   └──────────┘   └──────┬───────┘   └──────────────┘
                         │ port
                         ▼
                  ┌──────────────┐
                  │  Persistence │  ← adapter implements port
                  │  (storage)   │
                  └──────────────┘
```

Module table:

| Module | Responsibility | Owns |
|---|---|---|
| HTTP API | Translates HTTP into domain commands and queries | DTOs, routes |
| Ordering | Coordinates the order lifecycle | `Order`, `OrderLine`, `OrderStatus` |
| Billing | Generates invoices and processes payments | `Invoice`, `Charge` |
| Auth | Authenticates and authorizes requests | `Session`, `Permission` |
| Persistence | Concrete storage adapter | (no domain types — implements interfaces from Ordering / Billing) |

Seams:

- HTTP API ↔ Ordering: in-process function calls (commands + queries).
- Ordering ↔ Persistence: port (interface) defined in Ordering; adapter implements it.
- Ordering ↔ Billing: in-process; events emitted by Ordering, consumed by Billing.

### 6. Validate

Before declaring the design done, check each item:

- [ ] Every module's responsibility fits in one sentence.
- [ ] The dependency graph is acyclic.
- [ ] No two modules duplicate the same responsibility.
- [ ] Domain modules don't depend on infrastructure modules (ports inverted).
- [ ] The whole map fits on one screen — if it doesn't, you've over-decomposed.

Failures here are not "warnings" — they're "stop and rework". The system map is load-bearing for everything downstream.

## Done when

- `docs/architecture.md` exists with: module table, dependency direction, seam list, ASCII map.
- Each module name comes from `CONTEXT.md` vocabulary (not framework conventions).
- The dependency graph is acyclic and explicitly reviewed.
- Every cross-module boundary has a named seam + adapter location.
- For any decision you're least sure about, you've raised it as an open question to the user before locking in.

## Anti-patterns

- **Layering instead of slicing.** Naming modules `controllers`, `services`, `repositories` is layering — a category split, not a responsibility split. Prefer feature slicing (`ordering/`, `billing/`).
- **Anaemic domain modules.** A module that's only data with no logic should usually be folded into the module that owns the logic. Anaemic modules cost a seam without paying for it.
- **Premature service extraction.** Splitting modules into separate processes / deployments without a real reason (scale, team, fault isolation) adds operational cost without clarity benefit. Prefer in-process modules first; extract later if needed.
- **Cycles "for now".** A cyclic dependency is a sign the modules aren't really separate. Don't accept it; merge them or insert a third module to break the cycle.

## Handoff

Once the system map is stable:

- For each module that needs a public interface → run `design` per module.
- If a topology decision is hard-to-reverse / surprising / load-bearing → run `grill-plan` and write an ADR.
- Then proceed to `feature-doc` for the first feature using the topology.

If the system map needs to evolve later (new module, changed boundaries, removed seam), come back to this skill — don't drift the map silently.

## Pairing with other skills

- **`investigate`** runs *before*. Investigates the problem and chooses the direction. `system-design` then operationalizes the chosen direction into a topology.
- **`design`** runs *after*, per module. `system-design` says what modules should exist; `design` says what shape each module has.
- **`grill-plan`** runs alongside or after, to stress-test high-stakes topology decisions.
- **`improve-codebase-architecture`** is the *opposite* skill: given an existing codebase, find what to deepen. `system-design` is greenfield; that one is brownfield.
