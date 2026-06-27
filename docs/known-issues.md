# Known issues

Tracks follow-up work that is accepted but not yet implemented. Each entry names the artifact that *claims* the work is done, the actual state, and a pointer to the next step.

---

## tdd-rounds skill text not migrated to distributed state (ADR-0001)

- **Accepted:** [`docs/adr/0001-distributed-state.md`](adr/0001-distributed-state.md) — Status `accepted`, 2026-05-25.
- **Current operational truth:** `skills/tdd-rounds/SKILL.md`, `skills/tdd-rounds/COMMITS.md`, and `skills/tdd-rounds/templates/builder-brief.md` still reference `docs/STATE.md` as the single source of truth (~10 sites total).
- **Follow-up:** dedicated PR titled `feat(tdd-rounds): migrate to feature-scoped state per ADR-0001`. Touches the three files above plus a first-use of `docs/features/<name>/state/{snapshot.md,rounds/}` to validate the structure end-to-end.
- **Why not in PR #8:** the parent PR's theme was comment-discipline + branch-policy. Bundling a substantive `tdd-rounds` refactor would violate the per-theme commit discipline that PR is trying to teach.
