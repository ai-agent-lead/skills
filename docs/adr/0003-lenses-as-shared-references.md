---
type: adr
title: Lenses and diagnostics are shared references, not skills
description: A discipline applied only inside other skills lives as a skills/formats/ reference, not a routable skill, to single-source its content and cut drift.
tags: [skills, formats, architecture, refactor]
timestamp: 2026-06-28
status: accepted
---

# Lenses and diagnostics are shared references, not skills

**Status:** accepted

A skill that is *only ever applied inside other skills* — never invoked as a standalone phase — belongs in [`skills/formats/`](../../skills/formats/) as a shared reference, with the consuming skills linking it. A `SKILL.md` is earned only by a routable phase that a user or another skill invokes on its own.

## Context

The set had accumulated "lens" and "diagnostic" skills whose content was applied from *inside* other skills rather than invoked on their own: `code-hygiene` was the line-level lens applied during `simplify` and `pr-review`; `sync-check` was the doc-drift audit run before `pr-review` and inside `prod-ready`. Because a `SKILL.md` is a routing contract for the agent harness — not a content store — holding shared content there meant copying it to each call site. It drifted: the doc-drift checks were triplicated across `sync-check`, `prod-ready` §7, and `pr-review` §3e; the comment rules lived in both `code-hygiene` and `simplify`. Editing one left the others stale.

## Decision

1. The test is **"is this ever the thing you invoke, or only ever applied inside something else?"** Only-ever-inside → a `skills/formats/` reference; the consuming skills link it. Genuinely routable → its own `SKILL.md`.
2. Applying the rule: `code-hygiene` → [`skills/formats/CODE-HYGIENE.md`](../../skills/formats/CODE-HYGIENE.md); `sync-check` → [`skills/formats/DOC-DRIFT-AUDIT.md`](../../skills/formats/DOC-DRIFT-AUDIT.md), single-sourced and run from `prod-ready` §7 (author lens) and `pr-review` §3e (reviewer lens).
3. `caveman` stays a skill — it *is* user-invokable (the "caveman mode" trigger), so it passes the test. The "Lens" role in the README now spans both: a routable lens-skill (`caveman`) and a reference lens (`code-hygiene`).

## Considered options

- **Keep them as skills, de-dupe by cross-referencing skill→skill.** Rejected: one skill linking another skill's *body* for shared content is the coupling we're removing, and a lens skill never invoked alone is dead routing surface.
- **Thin-wrapper skills** (a short `SKILL.md` pointing at the reference). Rejected for these two — it keeps a routing entry with no standalone value. The door stays open for a wrapper when standalone invocation earns its keep.
- **Status quo.** Rejected: the content was already drifting across its copies.

## Consequences

- Removing the two skills affects installs that referenced them by name — point those at the new references (see `CHANGELOG.md` `Removed`). Shipped as a minor bump, consistent with the project's precedent for skill removals (1.2.0).
- New contributor rule: before adding a `SKILL.md`, apply the test above. Captured at the point of action in [`skills/SKILL-TEMPLATE.md`](../../skills/SKILL-TEMPLATE.md).
- Shared content gets a single home and one edit point; the doc-drift audit no longer has three copies to keep in sync.

## Related

- References: [`skills/formats/CODE-HYGIENE.md`](../../skills/formats/CODE-HYGIENE.md), [`skills/formats/DOC-DRIFT-AUDIT.md`](../../skills/formats/DOC-DRIFT-AUDIT.md)
- Template: [`skills/SKILL-TEMPLATE.md`](../../skills/SKILL-TEMPLATE.md)
