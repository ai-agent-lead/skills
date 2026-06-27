---
type: adr
title: Adopt OKF frontmatter for skill-produced docs
description: Every doc a skill writes under docs/ carries OKF frontmatter, making docs/ a consumable Open Knowledge Format bundle.
tags: [okf, docs, formats, interop]
timestamp: 2026-06-27
status: accepted
---

# Adopt OKF frontmatter for skill-produced docs

**Status:** accepted
**Date:** 2026-06-27

The skills in this repo are *producers* of documentation — `feature-doc` emits `docs/features/*.md`, `investigate` emits `docs/research/*.md`, `bootstrap`/`grill-plan` emit `docs/CONTEXT.md` and ADRs, and so on. We decided those produced docs should carry [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) (OKF v0.1) YAML frontmatter, so the `docs/` tree is a consumable OKF bundle that any OKF-aware agent or tool can ingest without bespoke parsing.

## Context

OKF is a vendor-neutral spec (Apache-2.0, Google Cloud, June 2026) for representing knowledge as a directory of markdown concept files with YAML frontmatter. Its only hard requirement is a non-empty `type`; everything else is recommended, and consumers preserve unknown keys. Our produced docs are already markdown-with-metadata — but they carry metadata as `**Status:**` / `**Date:**` bold lines, which no standard consumer reads. Adopting OKF is almost entirely additive.

## Decision

1. A new substrate doc, [`/skills/formats/OKF.md`](../../skills/formats/OKF.md), defines the frontmatter contract and the `type` vocabulary for our doc kinds (`adr`, `feature`, `research`, `context`, `convention`, `known-issues`, `benchmark`, `state`).
2. Every produced-doc template and format (`feature-template`, `research-note`, `ADR-FORMAT`, `CONTEXT-FORMAT`, `benchmark-report`, `verify-real-deps/known-issues`, the `tdd-rounds` state templates) opens with a filled-in OKF frontmatter block.
3. Frontmatter is canonical for `type` / `title` / `description` / `tags` / `timestamp`. The redundant `**Date:**` bold line folds into `timestamp`; `**Status:**` and `**Owner:**` stay as human-facing lines (and `status` / `owner` as extension keys) because OKF does not model them.
4. `docs/` is the bundle root; `CHANGELOG.md` serves as the bundle's `log.md`; a `docs/index.md` provides the OKF directory listing.

## Alternatives considered

- **Full bundle conformance across the whole repo (skills too).** Rejected: the `SKILL.md` files are Claude-skill definitions, not knowledge concepts — their `name`/`description` frontmatter is consumed by the agent harness, not by knowledge tools. Forcing OKF onto them confuses two registries.
- **A separate generated `okf/` export bundle.** Rejected: a build artifact drifts from source and adds a pipeline to maintain. Authoring the docs in OKF directly keeps one source of truth.
- **Our own minimal frontmatter scheme.** Rejected: OKF already exists, is additive, and buys interop with external tooling for no extra design cost.

## Consequences

- `docs/` is portable: it can be served, indexed, or handed to an OKF agent as-is.
- The doc-drift audits in `pr-review` (§3e) and `prod-ready` (Section 7) gain a check: a produced doc missing `type` is a finding.
- Existing `docs/` files were retrofitted in this change as the dogfooded worked example.

## Related

- Substrate: [`/skills/formats/OKF.md`](../../skills/formats/OKF.md)
- Convention: [`docs/CONVENTIONS.md`](../CONVENTIONS.md) §OKF
