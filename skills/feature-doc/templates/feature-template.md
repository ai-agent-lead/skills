---
type: feature
title: <Feature Name>
description: <one sentence — the user pain this feature solves>
tags: [<area>]
timestamp: YYYY-MM-DD
status: draft
owner: <name>
code: [<path/to/package/>]
---

<!-- Frontmatter is OKF per skills/formats/OKF.md; status lives only there.
status: draft → approved (feature-doc) → building (tdd) → done (prod-ready) → shipped (release); or dropped.
code: the paths this feature covers — hooks map an edited file back to this doc.
See skills/formats/DOCS-LAYOUT.md §2. -->

# <Feature Name>

## Problem

The pain in one sentence first, then at most two sentences of context. Plain words — see `skills/formats/WRITING-STYLE.md`.

## User Story

As a <role>, I want <capability> so that <outcome>.

## How it works

One diagram of the flow the user goes through, or the parts involved. One idea per diagram; then at most 3 sentences on what to notice. Delete this section if the change has no flow.

```mermaid
flowchart LR
    User -->|does something| Entry[Entry point]
    Entry -->|calls| Module[Module that does the work]
    Module -->|returns result| User
```

## Acceptance Criteria

Each bullet must be testable and map to at least one test. Tick a box only once the test covering it is green and merged — not when implementation starts.

- [ ] Given <context>, when <action>, then <result>.
- [ ] Given <context>, when <action>, then <result>.

## Non-Goals

What this feature explicitly does NOT do. Prevents scope creep.

This is about *capabilities deliberately not built*. (A research note's "Out of Scope" is about *decisions deliberately deferred* — different concept.)

- ...

## Related

Cross-links to other artifacts. Omit any subsection that doesn't apply.

- **ADRs:** [`ADR-NNNN <title>`](../../adr/NNNN-slug.md) — why this one matters here
- **Research notes:** [`<topic>`](../../research/<topic>.md)
- **Design note:** [`design.md`](./design.md) — when module shape was decided before code
- **Migration plan:** [`migration.md`](./migration.md) — when the feature changes a schema

## Notes

Open questions, links, or design tradeoffs. Optional.

## Sign-off

- [ ] Reviewed by <name>
