# Trigger index

Flat lookup from user phrases / situations → skill, for humans.

**Claude does not read this file when routing.** The only routing signal is each skill's `description:` frontmatter. This file mirrors the *Triggered by* list from every description so collisions and gaps are visible in one place — and `npm test` fails if the two drift apart. To change a trigger, edit the skill's description first, then this row.

The Disambiguator column restates the description's *Not for* clause.

## Planning & investigation

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "investigate", "research", "what are our options for", "compare approaches for" | [`investigate`](investigate/SKILL.md) | A decision worth a durable note, direction not yet chosen. Chat-sized questions → no skill. Direction already chosen → `grill-plan`. |
| "new project", "start a new repo", "bootstrap the docs" | [`bootstrap`](bootstrap/SKILL.md) | Only when `docs/CONTEXT.md` doesn't exist. Initializing *code* → no skill. |
| "spec this out", "write a feature doc", "what are the acceptance criteria" | [`feature-doc`](feature-doc/SKILL.md) | Skip for typo / dep bump / pure refactor. Choosing between approaches → `investigate`. |
| "grill me on this", "stress-test this plan", "poke holes in this plan", "is this consistent with our model" | [`grill-plan`](grill-plan/SKILL.md) | A plan exists and is being pressure-tested. Explaining existing code → no skill. |
| "benchmark", "measure latency", "profile", "performance test", "p99" | [`bench`](bench/SKILL.md) | Performance only. Functional bugs → `debug`. |

## Design & architecture

All three Shape skills carry the same splitting rule — **pick by age and scope**:

| | One module | Many modules |
| --- | --- | --- |
| **New code** | `design` | `system-design` |
| **Existing code** | refactor inline, then `simplify` | `improve-codebase-architecture` |

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "system architecture", "how should I structure this system", "service boundaries", "draw the architecture" | [`system-design`](system-design/SKILL.md) | New, many modules. |
| "design this module", "how should I structure this module", "API design", "deep modules" | [`design`](design/SKILL.md) | New, one module or public API. |
| "improve the architecture", "find refactoring opportunities", "these modules are too coupled", "make this codebase more testable" | [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md) | Existing, across modules. |
| "I'm lost", "zoom out" | [`zoom-out`](zoom-out/SKILL.md) | User-invoked only (`disable-model-invocation`). Maps an area. What one change affects → `impact`. |
| "blast radius", "who calls", "impact of changing", "what breaks if", "what depends on" | [`impact`](impact/SKILL.md) | One change's reach: callers, entry points, tests, text links, docs. Mapping a whole area → `zoom-out`; why something fails → `debug`. |

## Implementation

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "flaky", "intermittent", "regression", "I don't know why it's failing", "works locally but not in <env>", "production issue" | [`debug`](debug/SKILL.md) | Root cause unknown. Cause clear from the trace → `tdd`. |
| "TDD", "test-first", "red-green-refactor", "implement this feature" | [`tdd`](tdd/SKILL.md) | Known ACs or a bug with a known cause. Unknown cause → `debug`. 10+ ACs / multi-package → `tdd-rounds`. Adding tests to existing code → no skill. |
| "multi-round TDD", "drive the Builder agents", "orchestrate rounds" | [`tdd-rounds`](tdd-rounds/SKILL.md) | 10 or more ACs, or multi-package. Fewer in one package → `tdd`. |
| "database migration", "schema change", "rename a column", "backfill" | [`migrate`](migrate/SKILL.md) | Schema or stored-data change on a database with real data. A new major of a library or framework → `upgrade`; a different one, or the data model → `investigate`. |
| "simplify pass", "tighten this", "clean up before commit", "over-engineered", "YAGNI" | [`simplify`](simplify/SKILL.md) | Line-level, on the current green diff — applies the [`CODE-HYGIENE.md`](formats/CODE-HYGIENE.md) lens. Structural, cross-module → `improve-codebase-architecture`. |

## Pre-merge gates & review

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "ready to merge", "prod-ready", "production readiness", "before deploy" | [`prod-ready`](prod-ready/SKILL.md) | The author's own change. Someone else's PR → `pr-review`. Tagged release with vendor APIs → this, then `verify-real-deps`. |
| "review this PR", "review their diff", "audit terminology in this PR" | [`pr-review`](pr-review/SKILL.md) | Someone else's change (or a last self-check). Runs the [`DOC-DRIFT-AUDIT.md`](formats/DOC-DRIFT-AUDIT.md) terminology/ADR audit in §3e. The built-in `/code-review` command is separate. |
| "security review", "threat model", "STRIDE" | [`security-review`](security-review/SKILL.md) | Explicit request, or escalated by `feature-doc` / `prod-ready` / `pr-review` when a trust boundary changes. Keyword mentions of auth / APIs / permissions don't fire it. |
| "smoke test against the real API", "live verify", "before we tag", "end-to-end against the real vendor" | [`verify-real-deps`](verify-real-deps/SKILL.md) | Tagging a release that calls third-party APIs, after `prod-ready` is clean. Merging a branch → `prod-ready`. |

## Maintenance & release

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "upgrade to", "major version upgrade", "outdated dependencies", "dependency upgrade" | [`upgrade`](upgrade/SKILL.md) | Major versions of dependencies, toolchains, runtimes. Patch / minor bumps with green tests → no skill. New dependency → `security-review`. |
| "cut a release", "prepare the release", "bump the version", "write release notes" | [`release`](release/SKILL.md) | Shipping a version of *your own* package / module / service. After `prod-ready`, and after `verify-real-deps` when vendor APIs are involved. |

## Utilities & efficiency

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "caveman mode", "ooga booga", "save tokens" | [`caveman`](caveman/SKILL.md) | Explicit request only. A plain "be concise" → just answer briefly. |

## Routing collisions worth knowing

Words that sit near more than one skill. Each description's *Not for* clause resolves them the same way:

- **"design" / "structure"** — the age × scope table above.
- **"refactor"** — existing across modules → `improve-codebase-architecture`; one module → refactor inline, then `simplify`.
- **"clean up"** — `simplify` on the current diff; `improve-codebase-architecture` if the cleanup is structural.
- **"bug" / "fix"** — cause unknown → `debug`; cause known → `tdd`.
- **"test"** — new behaviour → `tdd`; cause unknown → `debug`; tests for existing code → no skill.
- **"review"** — someone else's PR → `pr-review`; your own pre-merge → `prod-ready`; security only when asked or escalated → `security-review`; `/code-review` → the built-in command.
- **"ship" / "release"** — merge → `prod-ready`; live vendor check before a tag → `verify-real-deps`; version, notes, tag, publish → `release`.
- **"bump"** — a patch / minor dependency bump → no skill; a major dependency or runtime → `upgrade`; your own package's version → `release`.
- **"depends on" / "callers"** — what one function or type reaches → `impact`; a map of an unfamiliar area → `zoom-out`.
- **"migrate" / "migration"** — database schema or stored data → `migrate`; moving to a new library or framework version → `upgrade`; choosing a new library → `investigate`.

## Retired phrases

These phrases were removed from descriptions because they occur in ordinary conversation or collide with another skill (including Claude Code built-ins). `npm test` fails if any of them reappears in a *Triggered by* list.

"should we", "give me a proposal", "how would we approach", "let's explore", "walk me through this", "check this change", "look over the diff", "give feedback on", "be concise", "initialize", "shipping", "fixing a bug", "integration tests", "permissions", "public API", "auth flow", "testability", "how should I structure this"

## When NO skill fires

Some tasks don't need a skill:

- Typo fixes, one-line config tweaks, dependency bumps with no API change.
- Mechanical renames where the desired result is unambiguous.
- Reading code to answer a question, or explaining a plan (no artifact, no decision to record).

If the user invokes a skill on these, surface that the overhead exceeds the value and offer to just do the change.
