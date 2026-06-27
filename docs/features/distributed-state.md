# Feature: Distributed State for TDD Rounds

**Status:** ADR-0001 accepted (2026-05-25); implementation pending. See [`docs/known-issues.md`](../known-issues.md).

**Problem:** Single global `STATE.md` causes merge conflicts and context waste during parallel feature development.

**User Story:** As a parent agent, I want to store and retrieve feature-specific state from a dedicated location so that I can manage complex features without noise from other features.

## Acceptance Criteria

- [ ] State is stored under `docs/features/<name>/state/`.
- [ ] Each feature has a `snapshot.md` for the current summary.
- [ ] Individual round reports are stored as immutable files in `rounds/` subdirectory.
- [ ] Root `docs/STATE.md` serves as an index of all features.
- [ ] `skills/tdd-rounds/SKILL.md`, `skills/tdd-rounds/COMMITS.md`, and `skills/tdd-rounds/templates/builder-brief.md` updated to reflect this structure.
- [ ] `skills/WORKFLOWS.md` artifacts table reflects the new locations as the operational truth (currently marked as target end-state).

## Non-Goals

- Migrating historical `STATE.md` entries for completed features.
- Automated cleanup of old state files.
