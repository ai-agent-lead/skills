# Claude skills

Skills shape how Claude works on this repo. Each skill lives in its own subdirectory with a `SKILL.md` (the contract Claude reads) plus templates or supporting docs.

This README is for humans. Claude discovers skills automatically — nothing is registered here.

## Index — by trigger phase

Grouped by role. Trigger phrases are in each skill's `description` frontmatter.

### Planning & investigation

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `bootstrap` | Starting a new project or service | `docs/` structure + `docs/CONTEXT.md` | [bootstrap/](./bootstrap/) |
| `feature-doc` | Before any non-trivial feature or bug fix | `docs/features/<short-name>.md` | [feature-doc/](./feature-doc/) |
| `investigate` | Open-ended research, proposals, or "options before code" | `docs/research/<topic>.md` | [investigate/](./investigate/) |
| `grill-plan` | Stress-test a **chosen** plan against existing terminology and decisions | Updates to `docs/CONTEXT.md` and `docs/adr/` | [grill-plan/](./grill-plan/) |
| `bench` | Verifying performance ACs or profiling hot paths | `docs/benchmarks/<feature>.md` | [bench/](./bench/) |

### Design & architecture

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `system-design` | Greenfield system architecture — modules, dependency direction, seams | `docs/architecture.md` (system map) | [system-design/](./system-design/) |
| `design` | Designing a module or public API before implementation | Guidance only — optional `docs/features/<feature>.design.md` for non-trivial shapes | [design/](./design/) |
| `improve-codebase-architecture` | Finding deepening opportunities — turning shallow modules into deep ones | Numbered candidate list, optional ADR / CONTEXT.md updates | [improve-codebase-architecture/](./improve-codebase-architecture/) |
| `zoom-out` | User-invoked: ask for higher-level context when unfamiliar with an area | Map of relevant modules and callers in `CONTEXT.md` vocabulary | [zoom-out/](./zoom-out/) |

The `code-hygiene` line-level lens is no longer a routable skill — it lives at [`formats/CODE-HYGIENE.md`](./formats/CODE-HYGIENE.md) and is applied during `simplify` and `pr-review` §3f.

### Implementation

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `debug` | Non-trivial bug whose root cause isn't obvious — runs **before** `tdd` | Reproduction + named root cause; optional `docs/research/<bug>.md` | [debug/](./debug/) |
| `tdd` | Implementing a feature or fixing a bug, test-first | Test-first code | [tdd/](./tdd/) |
| `tdd-rounds` | Multi-round TDD orchestration via Builder sub-agents (≥10 ACs / multi-package) | Builder briefs + reports + `docs/STATE.md` | [tdd-rounds/](./tdd-rounds/) |
| `simplify` | End-of-slice / end-of-round sweep — reuse, quality, efficiency, test relevance | Tightened diff + a separate `simplify` commit | [simplify/](./simplify/) |
| `migrate` | Schema or stored-data change on a database with real data | Migration plan (feature-doc section) + one migration and deploy per step: expand → backfill → switch → contract | [migrate/](./migrate/) |

### Pre-merge gates & review

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `prod-ready` | After tdd green, before merge | Verified pre-merge checklist (incl. doc drift) | [prod-ready/](./prod-ready/) |
| `security-review` | Explicit request, or escalated by `feature-doc` / `prod-ready` / `pr-review` when a change is surface-changing (entry points, identity flows, authz, sensitive data, external deps) | Threat model + verified controls; appended to feature doc, or `docs/security/<feature>.md` for high-stakes | [security-review/](./security-review/) |
| `pr-review` | Reviewing someone else's PR (or self-reviewing before opening) | Structured review with severity-classified findings (blocker / suggestion / nit / question) | [pr-review/](./pr-review/) |
| `verify-real-deps` | Pre-tag smoke test against real third-party APIs | `docs/known-issues.md` bug ledger; fix-rounds until clean | [verify-real-deps/](./verify-real-deps/) |

### Maintenance & release

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `upgrade` | Major version of a dependency, toolchain, or runtime | Breaking-change checklist + one verified commit per step | [upgrade/](./upgrade/) |
| `release` | Merged changes ready to ship as a version | Semver bump, dated CHANGELOG section, release notes, tag, published artifact | [release/](./release/) |

## Index — by role

Orthogonal axis. The trigger-phrase index above tells you *when* a skill fires; this one tells you *what kind of thing it is*.

| Role | Skills | What they have in common |
| --- | --- | --- |
| **Doc-producing** (writes a durable artifact under `docs/`) | `feature-doc`, `investigate`, `system-design`, `grill-plan`, `debug` (optional), `security-review` (optional), `verify-real-deps`, `bench`, `bootstrap` | Output survives the conversation. The discipline of writing it is the value. |
| **Build** (writes code) | `tdd`, `tdd-rounds`, `simplify`, `migrate`, `upgrade` | Diff-producing. Always behind a contract — feature doc + ACs, a migration plan, or a breaking-change checklist. |
| **Gate** (verifies before merge / tag) | `prod-ready`, `security-review`, `pr-review`, `verify-real-deps` | Pre-merge or pre-tag — refuse to advance until the checklist passes. |
| **Ship** (turns merged work into a version) | `release` | Outward-facing and irreversible — asks before publishing. |
| **Diagnose** (no code, no doc — just analysis) | `debug`, `zoom-out` | Run *before* a build skill when the input isn't yet clear. |
| **Shape** (decides module / topology) | `design`, `system-design`, `improve-codebase-architecture` | Greenfield-module / greenfield-system / brownfield. Same vocabulary ([`LANGUAGE.md`](./LANGUAGE.md)). |
| **Lens** (applied during other skills, not invoked alone) | `caveman` skill; `code-hygiene` reference ([`formats/CODE-HYGIENE.md`](./formats/CODE-HYGIENE.md)) | Principles you carry into any turn to maintain quality or efficiency. The line-level lens is a shared reference, not a routable skill. |

## Skill relationship map

The skill set + its dependencies. Lateral edges are vocabulary / lens; vertical edges are workflow flow.

```
                     ┌─────────────────────────────────────────────┐
                     │              SHARED SUBSTRATE                │
                     │                                              │
                     │   LANGUAGE.md   formats/   TRIGGERS.md       │
                     │       ▲             ▲          ▲             │
                     └───────┼─────────────┼──────────┼─────────────┘
                             │ vocab       │ format   │ routing
   ┌─────────────────────────┴─────────────┴──────────┴────────────┐
   │                                                                │
   │   investigate ──► feature-doc ──► (design) ──► tdd ──► simplify │
   │       │              │                ▲          ▲          │   │
   │       │              ▼                │          │          │   │
   │       │          grill-plan ──► ADR   │          │          ▼   │
   │       │              ▲                │          │     prod-ready│
   │       │              │                │          │          │   │
   │       └──────────────┘                │          │          ▼   │
   │                                       │          │          │   │
   │   system-design ──► design (per mod) ─┘          │          │   │
   │       │                                          │          ▼   │
   │       ▼                                          │      pr-review │
   │  docs/architecture.md                            │          │   │
   │                                                  │          ▼   │
   │   improve-codebase-architecture ─────────────────┘  verify-real-deps│
   │       ▲                                                     │   │
   │       │                                                     ▼   │
   │   tdd-rounds (orchestrator) ── dispatches Builders ────── [merge]│
   │       │      ▲   ▲     ▲                                         │
   │       │      │   │     │                                         │
   │       │   debug security-review                                  │
   │       │   (when bug)  (when surface)                             │
   │                                                                  │
   │   ┌─────────────── MAINTENANCE & RELEASE ──────────┐             │
   │   │  migrate -> schema steps inside tdd work:      │             │
   │   │    expand → backfill → switch → contract       │             │
   │   │  upgrade -> one major per commit → prod-ready  │             │
   │   │  [merge] → verify-real-deps → release → tag    │             │
   │   └────────────────────────────────────────────────┘             │
   │                                                                  │
   │   ┌────────────── LENSES & UTILITIES ──────────────┐             │
   │   │  code-hygiene (formats/) -> line-level lens    │             │
   │   │  caveman -> token lens, any code reading       │             │
   │   │                                                │             │
   │   │  zoom-out -> interrupts any workflow,          │             │
   │   │              maps unfamiliar areas             │             │
   │   └────────────────────────────────────────────────┘             │
   └──────────────────────────────────────────────────────────────────┘
```

**Seven things the map shows:**

1. `caveman` and `zoom-out` are not nodes in any flow — they're a lens / utility applied across. The `code-hygiene` line-level lens is the same idea, now a shared reference ([`formats/CODE-HYGIENE.md`](./formats/CODE-HYGIENE.md)) rather than a routable skill.
2. `grill-plan` is the only skill invoked from three upstreams (`investigate`, `feature-doc`, `improve-codebase-architecture`) — it's the shared pressure-test step.
3. `tdd-rounds` is the only multi-callee orchestrator — dispatches `design`, `tdd`, `simplify`, `prod-ready`, `verify-real-deps` to Builders.
4. `pr-review` is the reviewer-side mirror of `prod-ready` — the Section 7 / §3e doc-drift audit is single-sourced in [`formats/DOC-DRIFT-AUDIT.md`](./formats/DOC-DRIFT-AUDIT.md) (the former `sync-check` skill) and run from both sides.
5. `system-design` and `improve-codebase-architecture` are duals — same [LANGUAGE.md](./LANGUAGE.md), greenfield vs brownfield.
6. The shared substrate ([LANGUAGE.md](./LANGUAGE.md), [formats/](./formats/), [TRIGGERS.md](./TRIGGERS.md)) is referenced everywhere — never copy-paste the content into a skill.
7. `release` is the only skill that publishes. It runs after `prod-ready` (and `verify-real-deps` when vendor APIs are involved), and asks before anything leaves the machine.


## Workflows

The skills compose into canonical workflows (greenfield feature, large feature, investigation, refactor, bug fix, greenfield system, upgrade, release) plus utilities (`zoom-out`, `pr-review`). See [WORKFLOWS.md](./WORKFLOWS.md) for the decision tree, ASCII flow diagrams, and cross-workflow patterns.

## Trigger lookup

[TRIGGERS.md](./TRIGGERS.md) is the flat phrase → skill index. Useful for routing-collision debugging and onboarding — but Claude never reads it. The routing signal is each skill's `description:`; `npm test` fails if TRIGGERS.md drifts from them, if two skills claim the same phrase, or if a retired phrase comes back. [`tests/routing-cases.md`](../tests/routing-cases.md) holds prompt → expected-skill cases to re-score whenever a description changes.

## Shared vocabulary

[`LANGUAGE.md`](./LANGUAGE.md) at this directory's root is the canonical vocabulary used across every skill — **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**, **responsibility**, **dependency direction**, **port**. Skills link here rather than duplicating definitions.

## Shared formats

[`formats/`](./formats/) holds reference docs that more than one skill consumes:

- [`formats/ADR-FORMAT.md`](./formats/ADR-FORMAT.md) — ADR template, numbering, when-to-write criteria.
- [`formats/CONTEXT-FORMAT.md`](./formats/CONTEXT-FORMAT.md) — `CONTEXT.md` structure, single-vs-multi-context layout, minimal example.
- [`formats/CODE-HYGIENE.md`](./formats/CODE-HYGIENE.md) — the line-level lens (boring code, naming, YAGNI, rule of 3, locality, comments, constants placement). Applied during `simplify` and `pr-review` §3f.
- [`formats/DOC-DRIFT-AUDIT.md`](./formats/DOC-DRIFT-AUDIT.md) — the terminology / ADR / doc-map audit. Run from `prod-ready` §7 (author), `pr-review` §3e (reviewer), or standalone (the former `sync-check`).
- [`formats/OKF.md`](./formats/OKF.md) — frontmatter contract for produced `docs/` files. [`formats/STYLE-comments.md`](./formats/STYLE-comments.md) — the single source for code comments (headers as contracts, tagged comments, history in git), checked by [`scripts/check-comments.mjs`](./scripts/check-comments.mjs).
- [`formats/COMMIT-FORMAT.md`](./formats/COMMIT-FORMAT.md) — the one format for commit messages and PR descriptions: why in the body, `Refs:` into `docs/`, `BREAKING CHANGE:` for `release`.
- [`formats/WRITING-STYLE.md`](./formats/WRITING-STYLE.md) — how docs and chat explanations read: answer first, plain words, diagram first (Mermaid in `docs/`, ASCII in chat). Used by every doc-producing skill; [`snippets/writing-style.md`](../snippets/writing-style.md) is the always-on version for `CLAUDE.md` / `AGENTS.md`.

Used by `grill-plan`, `improve-codebase-architecture`, `system-design`, `investigate`, `simplify`, `prod-ready`, `pr-review`, and (lazily) `feature-doc`.

## Conventions

- **File naming.** UPPERCASE for skill-level reference docs (`SKILL.md`, `LANGUAGE.md`, `MOTIVATION.md`, `*-FORMAT.md`, etc.) — Claude loads these as supporting context. lowercase for templates inside `<skill>/templates/` — skeletons to copy and fill in.
- Output artifacts live under `docs/` in the repo root, never inside `.claude/`.
- Status enums, frontmatter shape, and cross-doc linking rules are in [`docs/CONVENTIONS.md`](../docs/CONVENTIONS.md).
- Domain vocabulary is in [`docs/CONTEXT.md`](../docs/CONTEXT.md). Terms there beat synonyms invented at the keyboard.
- **Body size matches role, not importance.** Skills that *teach* an agent how to do something (e.g. `tdd`, `debug`, `security-review`) tend to be longer — pedagogy, anti-pattern callouts, examples. Skills that *orchestrate* (e.g. `tdd-rounds`) tend to be shorter — contracts, tables, failure modes. Don't pad an orchestration skill to match a teaching skill's length; it just adds noise.
- **SKILL.md heading order is canonical.** See [`SKILL-TEMPLATE.md`](./SKILL-TEMPLATE.md). Keep `When to use` / `When to skip` early so routing decisions land before the body.

## Adding a skill

1. Copy [`SKILL-TEMPLATE.md`](./SKILL-TEMPLATE.md) to `<name>/SKILL.md` and fill in.
2. Write the `description` in the What / Use when / Triggered by / Not for shape from [`SKILL-TEMPLATE.md`](./SKILL-TEMPLATE.md#frontmatter-rules) — it is the only thing Claude reads when routing.
3. Reference [`LANGUAGE.md`](./LANGUAGE.md) and [`formats/`](./formats/) rather than redefining shared terms or formats.
4. Link any templates from `SKILL.md` so Claude can find them.
5. Add the skill to **both** index tables above (by trigger phase AND by role).
6. Add a row to [TRIGGERS.md](./TRIGGERS.md) mirroring the description's *Triggered by* list, add cases to [`tests/routing-cases.md`](../tests/routing-cases.md), and run `npm test`.
7. Update [WORKFLOWS.md](./WORKFLOWS.md) if the skill participates in a canonical workflow or as a cross-workflow pattern.
