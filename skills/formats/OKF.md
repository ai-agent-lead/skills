# OKF Frontmatter for Produced Docs

Every document a skill writes under `docs/` carries [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) (OKF v0.1) YAML frontmatter. That makes the whole `docs/` tree a consumable OKF **bundle** — a directory of markdown "concept" files any OKF-aware tool, agent, or static server can ingest, with no change to how we author.

This is the substrate every doc-producing skill consumes (`feature-doc`, `investigate`, `bootstrap`, `grill-plan`, `bench`, `tdd-rounds`, `verify-real-deps`, …) — the way `STYLE-comments.md` is the substrate for comments. The per-skill templates carry a filled-in frontmatter block; this doc is the contract behind them.

> **Why OKF and not our own scheme:** the format is vendor-neutral and additive — the only hard requirement is a non-empty `type`, and consumers preserve unknown keys. We get interop for free without giving up any of our existing structure.

---

## 1. The frontmatter block

Every non-reserved `.md` file under `docs/` opens with a YAML frontmatter block:

```yaml
---
type: feature
title: Distributed State for TDD Rounds
description: Feature-scoped state replaces the global STATE.md to cut merge conflicts.
tags: [tdd-rounds, state, architecture]
timestamp: 2026-05-25
---
```

| Field | OKF status | Rule |
| --- | --- | --- |
| `type` | **required** | One value from the vocabulary in §2. Non-empty. This is the only field a bundle is rejected for missing. |
| `title` | recommended | Human-readable display name. Mirror the `# H1`. Omit only if the filename already says it. |
| `description` | recommended | One sentence. Reuse the doc's opening sentence — don't invent a second summary. |
| `tags` | recommended | YAML list of short cross-cutting labels. Skip rather than pad. |
| `timestamp` | recommended | ISO 8601 date (or datetime) of the last meaningful change. This is the canonical home for the date — do **not** also keep a `**Date:**` bold line. |
| `resource` | recommended | A URI for the underlying asset. Our docs are abstract concepts, so in practice this is usually **absent** — include it only when the doc fronts a real external resource (a dashboard, a BigQuery table, an API). |

**Extension keys** are allowed and encouraged where a doc kind carries status OKF doesn't model. Our kinds keep `status:` (and `owner:` on feature docs) as extension keys *in addition to* the human-facing `**Status:**` / `**Owner:**` bold lines the skills already read. OKF consumers preserve them; our skills keep working.

---

## 2. The `type` vocabulary

OKF does not register types centrally — producers pick descriptive, self-explanatory values and consumers tolerate unknowns. These are the values this repo's skills emit:

| Doc kind | `type` | Produced by | Lives in |
| --- | --- | --- | --- |
| Architecture decision record | `adr` | `bootstrap`, `grill-plan`, `investigate` handoff | `docs/adr/NNNN-slug.md` |
| Feature contract | `feature` | `feature-doc` | `docs/features/<name>.md` |
| Module / interface design note | `design` | `design` | `docs/features/<name>.design.md` |
| Research / options note | `research` | `investigate` | `docs/research/<topic>.md` |
| Ubiquitous-language map | `context` | `bootstrap`, `grill-plan` | `docs/CONTEXT.md` |
| Multi-context map | `context-map` | `bootstrap` | `CONTEXT-MAP.md` |
| Repo conventions | `convention` | `bootstrap` | `docs/CONVENTIONS.md` |
| Accepted-but-unimplemented tracker | `known-issues` | `tdd-rounds`, `verify-real-deps` | `docs/known-issues.md` |
| Benchmark report | `benchmark` | `bench` | `docs/bench/<name>.md` |
| Round / feature state | `state` | `tdd-rounds` | `docs/features/<name>/state/*.md` |

Pick the closest existing value before inventing a new one. A new doc kind adds a row here in the same change that first emits it.

---

## 3. Bundle conventions

`docs/` is the bundle root. Two filenames are **reserved** by OKF and never used for a concept:

- **`index.md`** — a directory listing for progressive disclosure. No frontmatter. Entries are `* [Title](relative-url) — short description`, optionally grouped under `## Section` headings. Add `docs/index.md` once the bundle has more than a couple of files; keep it current as docs are added.
- **`log.md`** — a date-grouped changelog. Our repo's root **`CHANGELOG.md`** already plays this role (Keep-a-Changelog, newest first); treat it as the bundle's log rather than adding a second file. An OKF consumer tolerates the absence of `log.md`.

**Cross-references** between docs are plain markdown links. OKF accepts two forms: **bundle-relative** (begin with `/`, resolved from the bundle root: `/adr/0001-distributed-state.md`) and **relative** (`../known-issues.md`). Bundle-relative is the more move-stable form, but this repo's docs use ordinary **relative** links by convention (they also reach files outside the bundle, like `../skills/formats/OKF.md`), and both are equally valid. A link asserts a *relationship* — the kind (supersedes, depends-on, refines) is carried by the surrounding prose, not the link. Broken links are tolerated, not malformed.

**Body:** no required sections. Favor structural markdown (headings, lists, tables, fenced code) over prose — it aids both human reading and agent retrieval. The headings `# Schema`, `# Examples`, `# Citations` carry their conventional OKF meaning when present.

---

## 4. Conformance checklist

A produced doc is OKF-conformant when:

- [ ] It opens with a parseable YAML frontmatter block.
- [ ] `type` is present and non-empty, drawn from §2 (or added there in the same change).
- [ ] `title` mirrors the H1; `description` reuses the opening sentence; the date lives only in `timestamp`.
- [ ] Reserved filenames (`index.md`, `log.md` / `CHANGELOG.md`) follow §3 and are **not** used for concepts.
- [ ] Cross-links use bundle-relative (`/…`) or relative paths.

This checklist is enforced at the doc-drift audits in `pr-review` (§3e) and `prod-ready` (Section 7) — a produced doc missing `type` is a finding.
