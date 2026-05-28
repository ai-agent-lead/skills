# Changelog

All notable changes to this skills library are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are grouped by `Added / Changed / Fixed / Removed / Deprecated`.
`[Unreleased]` accumulates between releases; at release time it is renamed
to the new version and a fresh `[Unreleased]` block is opened.

## [Unreleased]

### Added
- `prod-ready` Section 7 now requires a `CHANGELOG.md` entry for any
  user-visible change (skip list matches `feature-doc`).
- `tdd` and `tdd-rounds` require a non-`main` feature branch before
  writing tests; `feature-doc` requires the branch be checked out
  before the contract doc is committed. Code lands on `feat/<name>` or
  `fix/<name>`; `main` receives merges, not commits.
- `STYLE-comments.md` §2 adds a sixth "delete on sight" pattern —
  in-function section headers (`// validate`, `// build response`).

### Changed
- `STYLE-comments.md` rewritten to bias harder against comments by
  default. Docstrings on exported identifiers are no longer required —
  written only when the contract isn't obvious from the signature.
  Trade-off and provenance comments are kept only when the next reader
  would otherwise reattempt the rejected alternative. Net: ~20% shorter
  guide, stronger default-no-comment bias.
- `code-hygiene` Principle 6 sharpened — default is NONE, delete on
  doubt; in-function section headers and obvious-from-signature
  docstrings added to the "delete on sight" list.
- `simplify` Quality lens now defaults to DELETE for comments unless
  the reader would otherwise reattempt the rejected alternative.
- `pr-review` calibrates comment noise as a **nit** by default
  (was suggestion); promoted to suggestion only when cumulative noise
  obscures the diff.

### Fixed
- `docs/CONVENTIONS.md` created to satisfy README cross-references.
- Skill file corruption repaired; repo docs (`docs/CONTEXT.md`,
  `docs/adr/0001-distributed-state.md`, `docs/features/distributed-state.md`)
  bootstrapped.

## [1.2.0] — 2026-05-25

### Added
- `caveman` skill (efficiency lens applied during code reading and review).
- `sync-check` skill integrated into the pre-`pr-review` gate as a
  terminology/ADR drift audit.
- OpenCode support in the npx installer (`--opencode` flag).
- [AgentLead.Dev](https://AgentLead.Dev) homepage; linked from root README.

### Changed
- `tdd-rounds` state refactored to be **feature-scoped and distributed**:
  state lives under `docs/features/<name>/state/` (snapshot + immutable round
  logs) instead of a single global `docs/STATE.md`. See
  [`docs/adr/0001-distributed-state.md`](docs/adr/0001-distributed-state.md).
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
