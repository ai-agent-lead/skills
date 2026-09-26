# docs

OKF bundle listing for this repo's produced documentation. The layout and upkeep rules are [`skills/formats/DOCS-LAYOUT.md`](../skills/formats/DOCS-LAYOUT.md); the frontmatter contract is [`skills/formats/OKF.md`](../skills/formats/OKF.md); the bundle's changelog is the root [`CHANGELOG.md`](../CHANGELOG.md).

<!-- check-docs:index:start -->
<!-- Generated from frontmatter by check-docs.mjs --write. Edit the docs, not this list. -->

## Context

* [AI Agent Skills](./CONTEXT.md) — Vocabulary and system map for the skills set used to shape AI agent behavior.
* [Conventions](./CONVENTIONS.md) — Rules for how documentation and skills are structured in this repository.

## Features

* [Distributed State for TDD Rounds](./features/distributed-state/feature.md) — Feature-scoped state replaces the global STATE.md to cut merge conflicts and context waste. · approved

## Decisions

* [Distributed and Feature-Scoped State](./adr/0001-distributed-state.md) — tdd-rounds state moves from a global STATE.md to feature-scoped docs/features/<name>/state/.
* [Adopt OKF frontmatter for skill-produced docs](./adr/0002-adopt-okf-for-produced-docs.md) — Every doc a skill writes under docs/ carries OKF frontmatter, making docs/ a consumable Open Knowledge Format bundle.
* [Lenses and diagnostics are shared references, not skills](./adr/0003-lenses-as-shared-references.md) — A discipline applied only inside other skills lives as a skills/formats/ reference, not a routable skill, to single-source its content and cut drift.
* [Comment style has one source, and a check keeps it that way](./adr/0004-comment-style-single-source.md) — All code-comment rules live in skills/formats/STYLE-comments.md; skills link it, a short snippet makes it always-on, and npm test fails on drift.
* [Docs are grouped by domain, tracked by release, and checked on every change](./adr/0005-docs-layout-and-upkeep.md) — One layout under docs/ (scope decides the folder), status in frontmatter with one owner per change, release files for milestones, and a checker wired into hooks.

## Tracking

* [Known issues](./known-issues.md) — Tracks follow-up work that is accepted but not yet implemented.

<!-- check-docs:index:end -->
