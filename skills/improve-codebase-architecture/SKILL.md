---
name: improve-codebase-architecture
description: Find deepening opportunities in EXISTING code, informed by the domain language in CONTEXT.md and the decisions in docs/adr/. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable and AI-navigable. Use for EXISTING code; for designing the shape of a new module from scratch, use `design`. Skip for single-module local refactors with no cross-module impact — use `design` or just refactor inline.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## When to use

- The user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable.
- Mid-project in `tdd-rounds`, after the load-bearing seams exist — surface candidates that become dedicated refactor rounds.
- After [`zoom-out`](../zoom-out/SKILL.md) reveals shallow modules in an unfamiliar area.

## When to skip

- Designing the shape of a new module from scratch — use [`design`](../design/SKILL.md).
- Greenfield system topology — use [`system-design`](../system-design/SKILL.md).
- Single-module local refactor with no cross-module impact — use `design` or refactor inline.
- Line-level cleanup (renames, dead-code removal) — use the [`code-hygiene`](../formats/CODE-HYGIENE.md) lens + [`simplify`](../simplify/SKILL.md).

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [skills/LANGUAGE.md](../LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [skills/LANGUAGE.md](../LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

This skill is _informed_ by the project's domain model. The domain language gives names to good seams; ADRs record decisions the skill should not re-litigate.

## Process

### 1. Explore

Read the project's domain glossary ([`docs/CONTEXT.md`](../../docs/CONTEXT.md)) and any ADRs in [`docs/adr/`](../../docs/adr/) for the area you're touching first.

Then use the Agent tool with `subagent_type=Explore` to walk the codebase. Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

Present a numbered list of deepening opportunities. For each candidate:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage, and also in how tests would improve

**Use CONTEXT.md vocabulary for the domain, and [skills/LANGUAGE.md](../LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly (e.g. _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. Ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md` — same discipline as `/grill-plan` (see [`../formats/CONTEXT-FORMAT.md`](../formats/CONTEXT-FORMAT.md)). Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones. See [`../formats/ADR-FORMAT.md`](../formats/ADR-FORMAT.md).
- **Want to explore alternative interfaces for the deepened module?** See [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).

### 4. Context Splitting

When a single `CONTEXT.md` becomes a bottleneck (>100 terms), the codebase is likely ready for context splitting.

- **Identify Seams**: Find logical boundaries where domain terms are largely independent.
- **Extract Sub-Contexts**: Move terms into `<module>/CONTEXT.md` files.
- **Update CONTEXT-MAP.md**: Create or update the root [`docs/CONTEXT-MAP.md`](../formats/CONTEXT-MAP-FORMAT.md) to point to the new sub-contexts.
- **AI-Navigability**: This reduces context pollution, allowing agents to focus only on the relevant vocabulary for a given module.

## Pairing with other skills

- **[`zoom-out`](../zoom-out/SKILL.md)** — runs *before* if the area is unfamiliar. Map first, then propose.
- **[`design`](../design/SKILL.md)** — shares vocabulary ([`LANGUAGE.md`](../LANGUAGE.md)). `design` is the greenfield twin of this skill.
- **[`system-design`](../system-design/SKILL.md)** — the system-level twin. Greenfield topology vs brownfield deepening.
- **[`grill-plan`](../grill-plan/SKILL.md)** — invoked when a candidate hits an ADR that needs revisiting (or when a rejection deserves an ADR).
- **[`tdd`](../tdd/SKILL.md) / [`tdd-rounds`](../tdd-rounds/SKILL.md)** — runs *after* the candidate is chosen. Refactor rounds: ACs are "all existing tests still green".
- **[`prod-ready`](../prod-ready/SKILL.md)** — gate before merge.

## Done when

For each candidate the user chose to explore:

- The deepened module's interface has been sketched (small surface, clear seam).
- Implications for tests are named (which existing tests survive; which need updating).
- Any new domain terms used are added to `CONTEXT.md`.
- Any architectural decision worth preserving is offered as an ADR.

If the user wants to deepen multiple candidates, run the skill again per candidate — don't batch them in one pass.
