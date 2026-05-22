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
| `code-hygiene` | Line/function-level coding discipline (boring, naming, YAGNI, rule of 3, locality) | Guidance only — applied as a lens during `simplify` and `pr-review` | [code-hygiene/](./code-hygiene/) |
| `zoom-out` | User-invoked: ask for higher-level context when unfamiliar with an area | Map of relevant modules and callers in `CONTEXT.md` vocabulary | [zoom-out/](./zoom-out/) |

### Implementation

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `debug` | Non-trivial bug whose root cause isn't obvious — runs **before** `tdd` | Reproduction + named root cause; optional `docs/research/<bug>.md` | [debug/](./debug/) |
| `tdd` | Implementing a feature or fixing a bug, test-first | Test-first code | [tdd/](./tdd/) |
| `tdd-rounds` | Multi-round TDD orchestration via Builder sub-agents (≥10 ACs / multi-package) | Builder briefs + reports + `docs/STATE.md` | [tdd-rounds/](./tdd-rounds/) |
| `simplify` | End-of-slice / end-of-round sweep — reuse, quality, efficiency, test relevance | Tightened diff + a separate `simplify` commit | [simplify/](./simplify/) |

### Pre-merge gates & review

| Skill | Trigger | Produces | Location |
| --- | --- | --- | --- |
| `prod-ready` | After tdd green, before merge | Verified pre-merge checklist (incl. doc drift) | [prod-ready/](./prod-ready/) |
| `security-review` | Surface-changing work — new entry points, identity flows, authz, sensitive data, external deps | Threat model + verified controls; appended to feature doc, or `docs/security/<feature>.md` for high-stakes | [security-review/](./security-review/) |
| `pr-review` | Reviewing someone else's PR (or self-reviewing before opening) | Structured review with severity-classified findings (blocker / suggestion / nit / question) | [pr-review/](./pr-review/) |
| `verify-real-deps` | Pre-tag smoke test against real third-party APIs | `docs/known-issues.md` bug ledger; fix-rounds until clean | [verify-real-deps/](./verify-real-deps/) |

## Index — by role

Orthogonal axis. The trigger-phrase index above tells you *when* a skill fires; this one tells you *what kind of thing it is*.

| Role | Skills | What they have in common |
| --- | --- | --- |
| **Doc-producing** (writes a durable artifact under `docs/`) | `feature-doc`, `investigate`, `system-design`, `grill-plan`, `debug` (optional), `security-review` (optional), `verify-real-deps` | Output survives the conversation. The discipline of writing it is the value. |
| **Build** (writes code) | `tdd`, `tdd-rounds`, `simplify` | Diff-producing. Always behind a contract (feature doc + ACs). |
| **Gate** (verifies before merge / tag) | `prod-ready`, `security-review`, `pr-review`, `verify-real-deps` | Pre-merge or pre-tag — refuse to advance until the checklist passes. |
| **Diagnose** (no code, no doc — just analysis) | `debug`, `zoom-out`, `sync-check` | Run *before* a build skill when the input isn't yet clear. |
| **Shape** (decides module / topology) | `design`, `system-design`, `improve-codebase-architecture` | Greenfield-module / greenfield-system / brownfield. Same vocabulary ([`LANGUAGE.md`](./LANGUAGE.md)). |
| **Lens** (applied during other skills, not invoked alone) | `code-hygiene` | Five principles you carry into `simplify`, `pr-review`, and any code-reading session. |

## Skill relationship map

The 16 skills + their dependencies. Lateral edges are vocabulary / lens; vertical edges are workflow flow.

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
   │                                       │          │     pr-review │
   │   system-design ──► design (per mod) ─┘          │          │   │
   │       │                                          │          ▼   │
   │       ▼                                          │  verify-real-deps │
   │  docs/architecture.md                            │          │   │
   │                                                  │          ▼   │
   │   improve-codebase-architecture ─────────────────┘     [merge]  │
   │       ▲                                                          │
   │       │                                                          │
   │   tdd-rounds (orchestrator) ── dispatches Builders ──────────────│
   │       │      ▲   ▲     ▲                                         │
   │       │      │   │     │                                         │
   │       │   debug security-review                                  │
   │       │   (when bug)  (when surface)                             │
   │                                                                  │
   │   ┌────────────── LENSES & UTILITIES ──────────────┐             │
   │   │  code-hygiene ──► applied during simplify,    │             │
   │   │                   pr-review, any code reading  │             │
   │   │                                                │             │
   │   │  zoom-out ──► interrupts any workflow,        │             │
   │   │              maps unfamiliar areas             │             │
   │   └────────────────────────────────────────────────┘             │
   └──────────────────────────────────────────────────────────────────┘
```

**Six things the map shows:**

1. `code-hygiene` and `zoom-out` are not nodes in any flow — they're lenses / utilities applied across.
2. `grill-plan` is the only skill invoked from three upstreams (`investigate`, `feature-doc`, `improve-codebase-architecture`) — it's the shared pressure-test step.
3. `tdd-rounds` is the only multi-callee orchestrator — dispatches `design`, `tdd`, `simplify`, `prod-ready`, `verify-real-deps` to Builders.
4. `pr-review` is the reviewer-side mirror of `prod-ready` — Section 7 doc-drift covered in both.
5. `system-design` and `improve-codebase-architecture` are duals — same [LANGUAGE.md](./LANGUAGE.md), greenfield vs brownfield.
6. The shared substrate ([LANGUAGE.md](./LANGUAGE.md), [formats/](./formats/), [TRIGGERS.md](./TRIGGERS.md)) is referenced everywhere — never copy-paste the content into a skill.

## Workflows

The skills compose into canonical workflows (greenfield feature, large feature, investigation, refactor, bug fix, greenfield system) plus utilities (`zoom-out`, `pr-review`). See [WORKFLOWS.md](./WORKFLOWS.md) for the decision tree, ASCII flow diagrams, and cross-workflow patterns.

## Trigger lookup

[TRIGGERS.md](./TRIGGERS.md) is the flat phrase → skill index. Useful for routing-collision debugging and onboarding.

## Shared vocabulary

[`LANGUAGE.md`](./LANGUAGE.md) at this directory's root is the canonical vocabulary used across every skill — **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**, **responsibility**, **dependency direction**, **port**. Skills link here rather than duplicating definitions.

## Shared formats

[`formats/`](./formats/) holds reference docs that more than one skill consumes:

- [`formats/ADR-FORMAT.md`](./formats/ADR-FORMAT.md) — ADR template, numbering, when-to-write criteria.
- [`formats/CONTEXT-FORMAT.md`](./formats/CONTEXT-FORMAT.md) — `CONTEXT.md` structure, single-vs-multi-context layout, minimal example.

Used by `grill-plan`, `improve-codebase-architecture`, `system-design`, `investigate`, and (lazily) `feature-doc`.

## Conventions

- **File naming.** UPPERCASE for skill-level reference docs (`SKILL.md`, `LANGUAGE.md`, `MOTIVATION.md`, `*-FORMAT.md`, etc.) — Claude loads these as supporting context. lowercase for templates inside `<skill>/templates/` — skeletons to copy and fill in.
- Output artifacts live under `docs/` in the repo root, never inside `.claude/`.
- Status enums, frontmatter shape, and cross-doc linking rules are in [`docs/CONVENTIONS.md`](../docs/CONVENTIONS.md).
- Domain vocabulary is in [`docs/CONTEXT.md`](../docs/CONTEXT.md). Terms there beat synonyms invented at the keyboard.
- **Body size matches role, not importance.** Skills that *teach* an agent how to do something (e.g. `tdd`, `debug`, `security-review`) tend to be longer — pedagogy, anti-pattern callouts, examples. Skills that *orchestrate* (e.g. `tdd-rounds`) tend to be shorter — contracts, tables, failure modes. Don't pad an orchestration skill to match a teaching skill's length; it just adds noise.
- **SKILL.md heading order is canonical.** See [`SKILL-TEMPLATE.md`](./SKILL-TEMPLATE.md). Keep `When to use` / `When to skip` early so routing decisions land before the body.

## Adding a skill

1. Copy [`SKILL-TEMPLATE.md`](./SKILL-TEMPLATE.md) to `<name>/SKILL.md` and fill in.
2. Make the `description` sharp enough that Claude will pick the skill on the right triggers and skip it on the wrong ones — name trigger phrases AND skip conditions AND adjacent skills.
3. Reference [`LANGUAGE.md`](./LANGUAGE.md) and [`formats/`](./formats/) rather than redefining shared terms or formats.
4. Link any templates from `SKILL.md` so Claude can find them.
5. Add the skill to **both** index tables above (by trigger phase AND by role).
6. Add an entry to [TRIGGERS.md](./TRIGGERS.md) for routing.
7. Update [WORKFLOWS.md](./WORKFLOWS.md) if the skill participates in a canonical workflow or as a cross-workflow pattern.
. Update [WORKFLOWS.md](./WORKFLOWS.md) if the skill participates in a canonical workflow or as a cross-workflow pattern.
