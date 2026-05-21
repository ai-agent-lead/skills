# Phase: <phase-name>

**Status:** Draft | Approved | Active | Shipped | Archived
**Owner:** <name — primary author and point of contact>
**Timeline:** YYYY-MM-DD → YYYY-MM-DD (target)
**Date:** YYYY-MM-DD (last updated)

<!--
Status values:
- Draft     — being written; not yet reviewed
- Approved  — reviewed; scope locked; features can start
- Active    — at least one feature in the phase is In Progress
- Shipped   — all Success Criteria checked AND every listed feature is Shipped
- Archived  — phase-cleanup has run; doc is read-only history
-->

## Goal

What outcome does this phase deliver? Frame it in user / business terms, not feature terms.
(2-3 sentences. If you can't write the goal without naming a feature, the phase is just one feature in disguise.)

## Success Criteria

How will you know the phase is done? Each item must be testable at the *phase* level, not the feature level.

- [ ] <Metric, event, or rollup. e.g. "Median TTFV < 5 min on prod over 7-day window">
- [ ] <e.g. "All listed features below have Status: Shipped">
- [ ] <e.g. "Public launch announcement published">

## Features

Every feature in this phase has its own one-page `feature-doc`. Add the `Phase:` link inside each feature doc pointing back here.

| Feature | Status | Link |
| --- | --- | --- |
| <short-name> | Draft / Approved / In Progress / Shipped | [docs/features/&lt;short-name&gt;.md](../features/<short-name>.md) |
| <short-name> | ... | ... |

## Non-Goals

What this phase explicitly does NOT include. Prevents scope creep mid-phase.

- ...

## Timeline & milestones

Optional. Use only if the phase has internal checkpoints (design review, beta, launch).

- YYYY-MM-DD — <milestone>
- YYYY-MM-DD — <milestone>

## Related

- **Research notes:** [`<topic>`](../research/<topic>.md) — if `investigate` produced the direction
- **ADRs:** [`ADR-NNNN <title>`](../adr/NNNN-slug.md) — load-bearing decisions inside the phase
- **Predecessor phase:** [`<phase-name>`](./<predecessor>.md) — if this phase continues prior work

## Notes

Open questions, links, dependencies on other teams. Optional.

## Sign-off

- [ ] Reviewed by <name>
- [ ] Scope locked (no new features added without re-review)
