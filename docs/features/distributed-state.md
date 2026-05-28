# Feature: Distributed State for TDD Rounds

**Problem:** Single global `STATE.md` causes merge conflicts and context waste during parallel feature development.

**User Story:** As a parent agent, I want to store and retrieve feature-specific state from a dedicated location so that I can manage complex features without noise from other features.

## Acceptance Criteria

- [x] State is stored under `docs/features/<name>/state/`.
- [x] Each feature has a `snapshot.md` for the current summary.
- [x] Individual round reports are stored as immutable files in `rounds/` subdirectory.
- [x] Root `docs/STATE.md` serves as an index of all features.
- [x] `WORKFLOWS.md` and `tdd-rounds/SKILL.md` updated to reflect this new structure.

## Non-Goals

- Migrating historical `STATE.md` entries for completed features.
- Automated cleanup of old state files.
