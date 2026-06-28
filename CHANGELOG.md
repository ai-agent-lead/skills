# Changelog

All notable changes to this skills library are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are grouped by `Added / Changed / Fixed / Removed / Deprecated`.
`[Unreleased]` accumulates between releases; at release time it is renamed
to the new version and a fresh `[Unreleased]` block is opened.

## [Unreleased]

## [2.0.0] — 2026-06-28

> **Breaking.** `code-hygiene` and `sync-check` are no longer routable skills
> (see Removed) — hence the major version bump. Anything that invoked them by
> name should point at the new `formats/` references instead.

### Added
- `skills/formats/CODE-HYGIENE.md` — the line-level lens (boring code, naming,
  YAGNI, rule of 3, locality, comments, constants placement) as a shared
  reference. Consumed by `simplify`, `pr-review` §3f, and
  `improve-codebase-architecture`.
- `skills/formats/DOC-DRIFT-AUDIT.md` — the terminology / ADR / doc-map audit
  as a single shared source. Run from `prod-ready` §7 (author lens),
  `pr-review` §3e (reviewer lens), or standalone (the former `sync-check`).
- `CODE-HYGIENE.md` Principle 7 — **"Constants live where they're used"**:
  narrowest honest scope, no `constants.ts` dumping ground, env-varying values
  from config not source literals. Closes a gap (the set had zero guidance on
  constant placement).
- [ADR-0003](docs/adr/0003-lenses-as-shared-references.md) records the rule
  behind this release's consolidation: a discipline applied only inside other
  skills is a `formats/` reference, not a routable skill. Referenced from
  `SKILL-TEMPLATE.md` at the point of action.

### Changed
- **`code-hygiene` demoted from a skill to a shared reference.** It was a lens
  "applied during other skills, not invoked alone" — that's a reference's job.
  Its principles now live once in `formats/CODE-HYGIENE.md`; `simplify`
  §2 and `pr-review` §3f link it instead of restating the comment rules.
- **`sync-check` folded into `formats/DOC-DRIFT-AUDIT.md`.** The doc-drift
  checks were triplicated across `sync-check`, `prod-ready` §7, and
  `pr-review` §3e; they are now single-sourced. `prod-ready` §7 and
  `pr-review` §3e reference the audit (author vs reviewer lens); `grill-plan`
  points at it for escalation.
- Dropped the unused `complexity:` / `expected_duration:` frontmatter from all
  skills — no tooling read them and they drifted. `disable-model-invocation:`
  (functional, on `zoom-out`) is kept. `SKILL-TEMPLATE.md` now documents the
  real frontmatter schema: `name` + `description`, optional
  `disable-model-invocation`, nothing else.
- `design/ILLEGAL-STATES.md` gains a "type safety is simplicity, bounded by
  boring-beats-clever" guardrail, cross-linking `CODE-HYGIENE` Principle 1.
  Phantom-type / conditional-type examples relabeled **advanced** — reach for
  them only when the invariant is load-bearing; prefer sum types + validate-at-
  boundary otherwise.

### Removed
- `code-hygiene` and `sync-check` standalone skills (content preserved in the
  two new `formats/` references above). Skill set: 20 → 18.

### Fixed
- `simplify` heading "The four lenses" corrected to "five" (Telemetry was a
  fifth lens); `simplify` pairing note "5 principles" corrected to six.
- Broken `grill-plan/BOOTSTRAP.md` links fixed to `bootstrap/BOOTSTRAP.md`
  (the file's real location) in `WORKFLOWS.md`, `feature-doc`, and
  `system-design`.
- Hardcoded "20 skills" counts in `README.md` and `WORKFLOWS.md` replaced with
  non-numeric phrasing so they stop drifting on every add/remove.

## [1.3.0] — 2026-06-27

### Added
- **OKF adoption for produced docs** ([ADR-0002](docs/adr/0002-adopt-okf-for-produced-docs.md)).
  Every doc a skill writes under `docs/` now carries [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf)
  (OKF v0.1) YAML frontmatter — required `type` plus `title` / `description` /
  `tags` / `timestamp` — making `docs/` a consumable OKF bundle.
  - New substrate `skills/formats/OKF.md` defines the frontmatter contract and
    the `type` vocabulary (`adr`, `feature`, `research`, `context`,
    `context-map`, `convention`, `known-issues`, `benchmark`, `design`,
    `state`).
  - Producer templates/formats now emit the block: `ADR-FORMAT`, `CONTEXT-FORMAT`,
    `feature-template`, `research-note`, `benchmark-report`, and
    `verify-real-deps/known-issues`.
  - Existing `docs/` retrofitted as the dogfooded worked example; added
    `docs/index.md` (OKF bundle listing). `CHANGELOG.md` serves as the
    bundle's `log.md`.
  - `prod-ready` Section 7 and `pr-review` §3e doc-drift audits gain a check:
    a produced doc missing `type` is a finding.
- `prod-ready` Section 7 now requires a `CHANGELOG.md` entry for any
  user-visible change. Skip list (formatter-only / lint-only / test-only /
  internal-refactor-with-no-behavior-change / dep-bump-with-no-runtime-impact)
  is documented inline in `prod-ready` rather than cross-referenced; it
  overlaps with but is not identical to `feature-doc`'s skip list.
- `pr-review` §3e (doc-drift audit) gains a fifth check — missing
  `CHANGELOG.md [Unreleased]` entry on a user-visible change is a finding,
  mirroring the new `prod-ready` Section 7 item.
- `docs/CONVENTIONS.md` documents branch naming (`feat/<short-name>` /
  `fix/<short-name>`) and commit-message conventions, and points at
  `skills/formats/STYLE-comments.md` as the comment bar.
- `docs/known-issues.md` bootstrapped to track accepted-but-unimplemented
  ADRs (currently: ADR-0001 distributed state).
- ADR-0001 (distributed state) accepted: `tdd-rounds` state will move
  from a single global `docs/STATE.md` to feature-scoped
  `docs/features/<name>/state/{snapshot.md, rounds/*.md}`. Skill text
  migration is tracked as a follow-up in `docs/known-issues.md`.

### Changed
- `STYLE-comments.md` rewritten to bias harder against comments by
  default. Docstrings on exported identifiers are no longer required —
  written only when the contract isn't obvious from the signature.
  Trade-off and provenance comments are kept only when the next reader
  would otherwise reattempt the rejected alternative. Net: ~20% shorter
  guide, stronger default-no-comment bias.
- `STYLE-comments.md` §2 tightened — adds a sixth "delete on sight"
  pattern (in-function section headers `// validate`, `// build response`).
- `STYLE-comments.md` §1.3 examples relabeled by kind (Invariant /
  Constraint / Trade-off / Provenance) to match the four-noun section
  title; restores the explicit Provenance label that was lost when the
  old §1.5 was folded in.
- `tdd`, `tdd-rounds`, and `feature-doc` tightened — require a non-`main`
  feature branch before writing tests / committing the contract doc.
  Code lands on `feat/<name>` or `fix/<name>`; `main` receives merges,
  not commits. `tdd-rounds` Builder's branch verification promoted to a
  dedicated pre-flight step (step 0), separate from context-loading.
- `code-hygiene` Principle 6 sharpened — default is NONE, delete on
  doubt; in-function section headers and obvious-from-signature
  docstrings added to the "delete on sight" list. Top-of-file principle
  count updated from five to six to match the body.
- `simplify` Quality lens now defaults to DELETE for comments unless
  the reader would otherwise reattempt the rejected alternative.
- `pr-review` calibrates comment noise as a **nit** by default;
  promoted to suggestion only when cumulative noise obscures the diff.
- `pr-review` §3e renumbered to §3f (was a duplicate-`3e` collision with
  the doc-drift audit above it).
- `feature-doc` Done-when reordered — branch-check now precedes
  reviewer sign-off (you can't review what isn't on a branch).

### Fixed
- `docs/CONVENTIONS.md` created to satisfy README cross-references.
- Skill file corruption repaired (`tdd-rounds`, `code-hygiene`,
  `WORKFLOWS.md`); repo docs (`docs/CONTEXT.md`,
  `docs/adr/0001-distributed-state.md`,
  `docs/features/distributed-state.md`) bootstrapped.
- `skills/README.md` "Adding a skill" step 7 had an orphan duplicate
  fragment; removed.
- `skills/WORKFLOWS.md` cross-workflow item renumbered `12` → `15`
  (was a duplicate of an earlier `12`); artifacts table gained a
  `CHANGELOG.md` row and qualifies the `docs/STATE.md` /
  feature-scoped-state rows as current-vs-target per ADR-0001.

## [1.2.0] — 2026-05-25

### Added
- `caveman` skill (efficiency lens applied during code reading and review).
- `sync-check` skill integrated into the pre-`pr-review` gate as a
  terminology/ADR drift audit.
- OpenCode support in the npx installer (`--opencode` flag).
- [AgentLead.Dev](https://AgentLead.Dev) homepage; linked from root README.

### Changed
- Comment-style guide anchored in the global skills substrate
  (`skills/formats/STYLE-comments.md`).
- Skill counts and cross-references synced across READMEs.

### Removed
- `phase` and `phase-cleanup` skills (introduced in 1.1.0, reverted in
  1.2.0 — milestone/phase tracking didn't fit the lazy-creation model).

## [1.1.0] — 2026-05-22 [DEPRECATED]

> This release introduced `phase` / `phase-cleanup` skills, which were
> reverted before 1.2.0. Treat as a no-op; do not depend on it.

### Added
- `phase` and `phase-cleanup` skills (reverted in 1.2.0).

## [1.0.0] — 2026-05-22

### Added
- Initial skills library: planning, design, implementation, and pre-merge
  skills (`bootstrap`, `feature-doc`, `investigate`, `grill-plan`, `bench`,
  `system-design`, `design`, `improve-codebase-architecture`, `code-hygiene`,
  `zoom-out`, `debug`, `tdd`, `tdd-rounds`, `simplify`, `prod-ready`,
  `security-review`, `pr-review`, `verify-real-deps`).
- Shared substrate: `skills/LANGUAGE.md`, `skills/TRIGGERS.md`,
  `skills/WORKFLOWS.md`, `skills/formats/`.
- Root README explaining the library's purpose and installation.
- `npx @ai-agent-lead/skills` installer with `--global`, `--local`,
  `--claude`, `--codex`, `--antigravity`, `--all`, `--force` flags.
