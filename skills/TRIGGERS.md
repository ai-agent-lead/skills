# Trigger index

Flat lookup from user phrases / situations → skill. The canonical source of trigger phrases is each skill's `description:` frontmatter; this file aggregates them so collisions and gaps are visible.

If a phrase appears in multiple rows, the disambiguation column names how to choose.

## Planning & investigation

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "investigate", "research", "give me a proposal", "what are our options", "how would we approach", "let's explore", "should we…" | [`investigate`](investigate/SKILL.md) | Direction not yet chosen. If a direction *is* chosen and you want to stress-test it → `grill-plan`. |
| "new project", "initialize", "bootstrap", "start new repo" | [`bootstrap`](bootstrap/SKILL.md) | Only for project start. |
| "before any non-trivial feature", "let's spec this out", "write a feature doc" | [`feature-doc`](feature-doc/SKILL.md) | Skip for typo / dep bump / pure refactor. |
| "grill me on this", "stress-test this plan", "walk me through this", "is this consistent with our model" | [`grill-plan`](grill-plan/SKILL.md) | A plan exists; you want it pressure-tested. |
| "benchmark", "performance test", "measure latency", "profile" | [`bench`](bench/SKILL.md) | Performance verification. |
| "is the naming right?", "does this match our glossary?", "audit terminology", "sync check", "context audit" | [`sync-check`](sync-check/SKILL.md) | Before `pr-review` or after refactor. |

## Design & architecture

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "system architecture", "module boundaries", "service boundaries", "how should I structure this system", "draw the architecture", "topology" | [`system-design`](system-design/SKILL.md) | Greenfield, multi-module. For single-module work → `design`. For reorganising an existing codebase → `improve-codebase-architecture`. |
| "how should I structure this", "deep modules", "testability", "API design", "design this module" | [`design`](design/SKILL.md) | Single module / public API, NEW code. For existing code → `improve-codebase-architecture`. |
| "improve architecture", "find refactoring opportunities", "consolidate", "deepen these modules", "make this more testable" | [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md) | EXISTING code, cross-module. For local single-module refactor → `design` or just refactor inline. |
| "simpler", "boring", "naming", "YAGNI", "premature abstraction", "over-engineered", "clean this up at line level" | [`code-hygiene`](code-hygiene/SKILL.md) | Lens, not phase — applies during simplify, pr-review, or whenever you re-read code. |
| "I'm lost", "give me higher-level context", "zoom out", "I don't know this area" | [`zoom-out`](zoom-out/SKILL.md) | User-invoked utility (`disable-model-invocation`). |

## Implementation

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "it's broken", "this is failing", "intermittent", "flaky", "regression", "not sure why", "production issue", "doesn't work in <env>" | [`debug`](debug/SKILL.md) | Root cause not obvious. If the trace points directly at the fix → skip `debug`, run `tdd`. |
| "TDD", "test-first", "red-green-refactor", "implement this feature", "fix this bug" | [`tdd`](tdd/SKILL.md) | Default for code-writing. |
| "drive the sub-agent team", "multi-round TDD", "orchestrate rounds", "Builder agents", ≥10 ACs, multi-package | [`tdd-rounds`](tdd-rounds/SKILL.md) | Single-AC fix or single-package feature → just `tdd`. |
| "simplify pass", "tighten this", "clean up before commit", "end-of-round sweep" | [`simplify`](simplify/SKILL.md) | Runs after `tdd` reaches green; before PR. |

## Pre-merge gates & review

| Phrase / situation | Routes to | Disambiguator |
| --- | --- | --- |
| "shipping", "ready to merge", "before deploy", "production readiness", "prod-ready" | [`prod-ready`](prod-ready/SKILL.md) | Author's pre-merge checklist. Skip for pure docs / test-only / one-line bug fix without infra impact. |
| "security review", "threat model", "STRIDE", "auth flow", "permissions", "secrets", "PII", "public API", "external surface", "abuse", "hardening" | [`security-review`](security-review/SKILL.md) | Surface-changing work only. Non-surface-changing diffs use `prod-ready` Section 3 alone. |
| "review this PR", "look over the diff", "check this change", "give feedback on" | [`pr-review`](pr-review/SKILL.md) | Reviewing someone else's PR (or self-review). Pairs with `prod-ready` (author side) and `security-review` (escalation). |
| "smoke test", "real API", "live verify", "before tag", "end-to-end against actual <vendor>" | [`verify-real-deps`](verify-real-deps/SKILL.md) | After `prod-ready` clean, before tagging. Skip if no third-party API or staging is fully owned. |

## Routing collisions worth knowing

Some phrases overlap. Pick by the disambiguator:

- **"design"** alone — almost always [`design`](design/SKILL.md). If the user means "system design", that phrase routes to [`system-design`](system-design/SKILL.md).
- **"refactor"** — [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md) for cross-module; [`design`](design/SKILL.md) or just inline edits for one-module shape; [`simplify`](simplify/SKILL.md) for end-of-round line-level cleanup.
- **"clean up"** — [`code-hygiene`](code-hygiene/SKILL.md) as a lens; [`simplify`](simplify/SKILL.md) as the end-of-round action; [`improve-codebase-architecture`](improve-codebase-architecture/SKILL.md) if the cleanup is structural.
- **"test"** — [`tdd`](tdd/SKILL.md) for writing tests against new behavior; [`debug`](debug/SKILL.md) when the test you'd write isn't obvious yet (root cause unclear); [`simplify`](simplify/SKILL.md)'s lens 4 for assessing existing tests.
- **"ship"** — [`prod-ready`](prod-ready/SKILL.md) for the gate; [`verify-real-deps`](verify-real-deps/SKILL.md) for tagged release with third-party APIs.

## When NO skill fires

Some tasks don't need a skill:

- Typo fixes, one-line config tweaks, dependency bumps with no API change.
- Mechanical renames where the desired result is unambiguous.
- Reading code to answer a question (no artifact, no decision).

If the user invokes a skill on these, surface that the overhead exceeds the value and offer to just do the change.
