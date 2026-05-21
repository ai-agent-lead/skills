---
name: phase-cleanup
description: Close out a phase — flip Status to Shipped/Archived, archive the phase doc, prune abandoned drafts, and verify the two-way phase↔feature links are intact. Use when the user says "close the phase", "wrap up Phase N", "archive this milestone", "phase is done", or after a launch / GA / freeze. Skip mid-phase (use `phase` to update Status without archiving), and skip if no `docs/phases/<name>.md` exists yet. Pairs with `phase` (upstream — the phase being closed) and `sync-check` (lateral — terminology audit if the phase changed vocabulary).
complexity: low
expected_duration: 10 minutes
---

# Phase Cleanup

Closes a phase cleanly. The phase doc moves from `Active` → `Shipped` → `Archived`; abandoned feature drafts get a final disposition; the index and links are verified before the next phase begins.

## Why this skill exists

Phases that never officially close cause three failure modes:

- **Zombie drafts.** A `feature-doc` left in `Status: Draft` from two phases ago — nobody knows if it was deferred, abandoned, or merged-but-forgotten. Future readers can't tell.
- **Broken rollup.** `docs/phases/<name>.md` says `Status: Active` six months after launch because nobody flipped it. The doc becomes untrustworthy.
- **Stale links.** Features get renamed, moved, or removed during a phase. Without a cleanup pass, the phase doc's feature table points at files that no longer exist.

This skill is the single exit ramp for a phase. After it runs, the phase doc is read-only history and the workspace is ready for the next phase.

## When to use

- The phase's Success Criteria are all checked, OR the team decides to stop the phase early.
- After a launch / GA / release cut where the phase represented "what shipped in that release".
- User says "close out Phase N", "wrap up this milestone", "archive the MVP", "phase is done".
- Before starting a new phase, if the previous one was never formally closed.

## When to skip

- Mid-phase status updates (`Approved` → `Active`, ticking off a Success Criterion). Edit the phase doc directly via [`phase`](../phase/SKILL.md); no cleanup needed.
- No phase doc exists — there's nothing to clean up. Run [`phase`](../phase/SKILL.md) first if a phase is implicit but undocumented.
- Bug-fix / one-feature workflows that never used a phase.

## Process

1. **Verify Success Criteria.** Open `docs/phases/<phase-name>.md`. Confirm every box under **Success Criteria** is checked, or document why the phase is closing without meeting them (a "Stopped" note — phase is still archived, but with a one-paragraph explanation).
2. **Reconcile the feature table.** For every row in the phase doc's **Features** table:
   - Verify the linked file exists at the claimed path.
   - Verify the feature doc has `Status: Shipped` (or document a different disposition — see step 3).
   - Verify the feature doc has a `Phase:` line pointing back at this phase doc.
   - Fix any broken links inline.
3. **Triage non-Shipped features.** Each feature still in `Draft`, `Approved`, or `In Progress` gets one of:
   - **Carried forward** — move the link to the next phase doc (or create one) and remove from this phase's feature table.
   - **Abandoned** — set the feature doc's `Status:` to `Abandoned` and add a one-line reason. Leave the file; don't delete.
   - **Completed** — if it actually shipped but the doc was never updated, set `Status: Shipped` and tick its AC boxes.
4. **Flip phase status.** Set `Status: Shipped` (if criteria met) or document "Stopped early" in the Goal section, then proceed to archive.
5. **Archive the phase doc.** Move `docs/phases/<phase-name>.md` to `docs/phases/archive/<phase-name>.md`. Update the **Phase:** line in each Shipped feature doc to point at the new archived path. Set the phase doc's `Status: Archived`.
6. **Update the index.** If there's a `docs/phases/README.md` or similar index, move the row from "Active phases" to "Archived". If there isn't one and there are ≥2 archived phases, create a minimal one.
7. **Run [`sync-check`](../sync-check/SKILL.md)** *(optional, recommended)* — if the phase introduced new vocabulary, audit `docs/CONTEXT.md` for terms that should be promoted now that the phase is closed.

## Rules

- **Never delete a feature doc.** Even abandoned features become history — `Abandoned` is a status, not a `rm`. Future readers need to know why something didn't ship.
- **Two-way links must be intact before archiving.** Phase doc lists feature; feature doc names phase. If either side is broken, fix it in step 2 — don't archive over a broken link.
- **Archive moves, doesn't copy.** Only one canonical location for a closed phase: `docs/phases/archive/<name>.md`. Two copies will drift.
- **Stopped phases are archived too.** A phase that was killed mid-flight still gets archived — with a one-paragraph reason in the Goal section. "Stopped" is a valid outcome.
- **Don't open the next phase inside this skill.** Closing and opening are separate disciplines. Run [`phase`](../phase/SKILL.md) afterward.

## Anti-patterns

- **Silent close.** Flipping `Status: Shipped` without verifying the feature table or two-way links. Phase looks closed; reality is still messy.
- **Delete-and-forget for abandoned features.** `rm docs/features/<x>.md` loses the institutional memory of why it was killed. Use `Status: Abandoned` instead.
- **Archive while features are still Active.** A phase can't close if its features are still In Progress. Either ship them, abandon them, or carry them forward — pick before archiving.
- **Cleanup as a "tidy" pass.** This skill closes the loop on a commitment; it's not a vibes-driven file shuffle. The triage decisions are load-bearing.
- **Skipping the index update.** An archive directory full of files with no rollup is just a graveyard. The index is what makes archived phases readable later.

## Pairing with other skills

- **`phase`** — runs *before*. The phase being closed must have been declared as a phase, not retrofitted at cleanup time. (If retrofitting is needed, run `phase` to backfill the doc first, then `phase-cleanup`.)
- **`sync-check`** — runs *after* (optional). If the phase introduced new domain terms, audit `docs/CONTEXT.md`.
- **`improve-codebase-architecture`** — runs *after* (optional). End-of-phase is a natural moment to look at the seams the phase exposed.

## Done when

- `docs/phases/<phase-name>.md` has moved to `docs/phases/archive/<phase-name>.md` with `Status: Archived`.
- Every Success Criterion is checked OR an explicit "Stopped" note documents why the phase closed without them.
- Every feature in the phase's Features table is `Shipped`, `Abandoned`, or has been moved to the next phase's doc.
- Two-way phase↔feature links are intact and pointing at the new archived path.
- Phases index (if it exists) is updated.
