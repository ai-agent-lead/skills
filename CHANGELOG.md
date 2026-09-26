# Changelog

All notable changes to this skills library are recorded here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are grouped by `Added / Changed / Fixed / Removed / Deprecated`.
`[Unreleased]` accumulates between releases; at release time it is renamed
to the new version and a fresh `[Unreleased]` block is opened.

## [Unreleased]

> **Heads-up:** `security-review` no longer fires on keyword mentions of auth,
> public APIs, or permissions — it runs on an explicit request or when
> `feature-doc`, `prod-ready`, or `pr-review` escalates a surface-changing change.
>
> **Heads-up:** new docs use the ADR-0005 layout. A feature's docs live in
> `docs/features/<name>/` (`feature.md`, `design.md`, `security.md`, `bench.md`,
> `migration.md`), not `docs/features/<name>.md`, `docs/security/`, or
> `docs/benchmarks/`. Status values are lowercase and live only in frontmatter.
> Existing docs keep working; `check-docs.mjs` lists what to update.

### Added

- `npm test` (`scripts/lint-triggers.js`) — lints every skill `description:`:
  required What / Use when / Triggered by / Not for shape, YAML-safe characters,
  length, trigger phrases unique across skills, no retired phrases, and
  `skills/TRIGGERS.md` mirroring each description's trigger list.
- `tests/routing-cases.md` — 37 prompt → expected-skill cases, including
  near-misses and Claude Code built-ins. 1.4.0 descriptions scored 17/37;
  the rewritten ones trace to 37/37.
- `TRIGGERS.md` "Retired phrases" list and an age × scope table for the Shape skills.
- `bench`: *When to skip* and *Pairing* sections; `bootstrap`: *Pairing* section.
- `formats/WRITING-STYLE.md` — how docs and chat explanations read: answer
  first, plain words, diagram first (Mermaid in `docs/`, ASCII in chat and
  code), and a four-part pattern for explaining a problem (what's wrong →
  why → fix → trade-off). Linked from every doc-producing skill.
- `snippets/writing-style.md` and installer `--style` flag (plus a y/N step in
  the interactive wizard) — writes the always-on version of the style into
  `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` between markers, so re-running
  replaces it instead of duplicating it.
- Diagram slots in templates: feature doc *How it works* (Mermaid flow),
  research note *At a glance* table and per-option *Picture*, ADR optional
  *Diagram*, `security-review` data-flow diagram with trust zones, `zoom-out`
  map *Picture*, `debug` expected-vs-actual.
- `skills/scripts/check-comments.mjs` — checks the comments in a diff (Go, JS/TS,
  other `//` and `#` languages): flags untagged comments, edit narration,
  reviewer talk, process tags, owner-less TODOs, and commented-out code; lists
  existing comments — headers included — in changed functions for re-check;
  reports `comment lines: +N -M`. Run by `simplify` and `pr-review`.
- `snippets/comment-style.md` — always-on comment rules; `--style` now writes
  both snippets as one block.
- `scripts/lint-style.js` in `npm test` — skill examples obey the comment
  rules, the tag list matches across source / snippet / checker, and no other
  file restates the rules. Checker tests in `tests/check-comments.test.mjs`.
- ADR-0004 — comment style has one source.
- `migrate` skill — schema and stored-data changes in safe deploy steps
  (expand → backfill → switch → contract), a risky-operations table with the
  safe way for each, a per-step migration plan, and Go / JS examples.
- `upgrade` skill — major-version upgrades of dependencies, toolchains, and
  runtimes: read breaking changes first, one step per commit, build / test /
  lint / vulnerability check at every step. Covers Go `/vN` import paths.
- `release` skill — semver bump from `[Unreleased]` and commit bodies,
  release notes for users, annotated tag, publish only after asking, and an
  install check of the published artifact. Fix forward; never move a tag.
- `formats/COMMIT-FORMAT.md` — the one format for commit messages and PR
  descriptions (why in the body, `Refs:`, `BREAKING CHANGE:`), shared by all
  skills; `tdd-rounds/COMMITS.md` keeps only the round-specific rules.
- Workflow 7 (upgrade) and Workflow 8 (release); 9 more routing cases
  (baseline 20/46, now 46/46 by static trace).
- `formats/DOCS-LAYOUT.md` and ADR-0005 — one docs layout: scope decides the
  folder (`docs/<domain>/` once a second domain appears), one folder per
  feature, `docs/releases/<version>.md` checklists plus a `docs/roadmap.md`,
  global ADR numbers. Status lives in frontmatter, and each status change has
  one owner skill: `feature-doc` draft/approved, `tdd` building, `prod-ready`
  done, `release` shipped.
- `skills/scripts/check-docs.mjs` — checks status values, broken links,
  `code:` paths, release and roadmap boxes against statuses, and a stale
  `docs/index.md`; lists code changed under a feature whose doc didn't change.
  `--write` generates the `docs/index.md` list from frontmatter. `npm test`
  runs it on this repo and fails when a skill names a `docs/` path outside the layout.
- Installer `--hooks` (and a y/N wizard step): Claude Code hooks that list the docs
  in flight at session start, name the docs covering each edited file, and
  block stopping while changed docs have problems.
- `snippets/docs-upkeep.md` — the always-on docs rules, added by `--style`.
- Feature docs list their code in a `code:` frontmatter field.
- `impact` skill and `scripts/code-graph/` — a code graph for Go, JavaScript,
  TypeScript/TSX, and Python built on demand with tree-sitter compiled to
  WebAssembly (vendored, about 4 MB), so only Node is needed. `impact <target>`
  walks callers up to entry points (routes, `main`, HTTP handlers, jobs,
  `__main__`), marks tests on the path, finds string links (SQL tables, routes,
  event topics, env keys), and lists feature docs whose `code:` covers the
  files reached. Every edge is labelled likely, possible, or text. `deps`
  prints package imports and cycles. Results are cached in `.git/`, keyed by
  file content. `tdd`, `pr-review`, and `prod-ready` run it on changed shared
  functions; `zoom-out` uses `deps` and `callers` for its map.

### Changed

- `feature-doc`, `tdd`, `tdd-rounds`, `prod-ready`, `release`, `investigate`
  each make their status change as a "Done when" step; `release` ticks the
  release file and roadmap. `DOC-DRIFT-AUDIT` gains a seventh check (status
  and links, via `check-docs.mjs`).
- `grill-plan`, `CONTEXT-FORMAT`, `CONTEXT-MAP-FORMAT`,
  `improve-codebase-architecture`: domain docs live in `docs/<domain>/`, not
  next to the code; `docs/CONTEXT-MAP.md` lists the domains; code folders get
  a `CLAUDE.md` / `AGENTS.md` pointing at their docs.
- `bootstrap` creates a generated `docs/index.md` and a root pointer to it.
- `OKF.md` §2 lists every doc type with its status values and points to
  `DOCS-LAYOUT.md` for paths; the WORKFLOWS artifacts table does the same.
- Templates (feature, research note, ADR) drop the `**Status:**` body line.
- `docs/features/distributed-state.md` moved to `docs/features/distributed-state/feature.md`.
- `zoom-out` no longer lists "what depends on what here"; what one change
  affects routes to `impact`. Four more routing cases (50/50 by static trace).
- `check-comments.mjs` skips vendored files (`vendor/`, `node_modules/`, minified JS).

- Rewrote all 18 skill descriptions in one shape (template in
  `SKILL-TEMPLATE.md`). "Pairs with…" moved out of descriptions into bodies;
  every description now names its nearest neighbour in a *Not for* clause.
- Shape skills (`design`, `system-design`, `improve-codebase-architecture`)
  share one splitting rule — pick by age (new / existing) and scope (one / many modules).
- `tdd` claims only bugs whose cause is known; unknown cause → `debug`.
  Adding tests to existing code no longer routes to `tdd`.
- `tdd-rounds` threshold unified at 10+ ACs or multi-package (was "5-15" in its description).
- `pr-review` owns the terminology audit trigger and yields to the built-in
  `/code-review` command; `simplify` owns the over-engineered / YAGNI triggers
  formerly routed to `code-hygiene`.
- `verify-real-deps` vs `prod-ready`: merge → `prod-ready`; tag with vendor APIs → both, in order.
- `prod-ready`'s migration check points to `migrate`; its description, and
  `verify-real-deps` and `tdd-rounds`, hand off to `release`.
- `system-design` writes the `docs/architecture.md` map in Mermaid (was ASCII);
  ASCII stays for chat.
- `STYLE-comments.md` rewritten as the single source, with Go and JS examples.
  Headers state the caller's contract only; comments inside functions carry a
  tag (`WHY:`, `WORKAROUND:`, `SAFETY:`, `TODO(owner):`); editing a function
  means re-reading every comment in it; history lives in git (commit body +
  `Refs:`), read only on named triggers; folder-wide rules go in a folder
  `AGENTS.md` / `CLAUDE.md`.
- `CODE-HYGIENE.md`, `simplify`, `pr-review`, `tdd`, `debug`,
  `improve-codebase-architecture`, `tdd-rounds` (COMMITS, builder brief), and
  `CONVENTIONS.md` link the source instead of restating it; `tdd` applies it
  while writing.
- 19 label comments in `design/` and `tdd/TESTS.md` examples moved out of the
  code blocks into the text, so agents stop copying "a comment above every function".

### Removed

- Over-broad trigger phrases that fired on ordinary conversation or collided
  with other skills: "should we", "give me a proposal", "how would we approach",
  "let's explore", "walk me through this", "check this change", "look over the
  diff", "give feedback on", "be concise", "initialize", "shipping", "fixing a
  bug", "integration tests", "permissions", "public API", "auth flow", "testability".
- `TRIGGERS.md` rows routing to `formats/` references, which no skill could reach.
- `STYLE-comments.md` provenance grammar (`R6 AC-3`, `v0.3 R1b2` in code) —
  round and AC ids now belong in commit messages only. Test-file preambles
  shrink from 5–20 lines to 1–3, and only when a fake would surprise.

## [1.4.0] — 2026-06-28

> **Heads-up:** `code-hygiene` and `sync-check` are no longer routable skills
> (see Removed) — point anything that invoked them by name at the new
> `formats/` references.

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
