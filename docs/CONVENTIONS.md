---
type: convention
title: Conventions
description: Rules for how documentation and skills are structured in this repository.
tags: [conventions, docs, okf]
timestamp: 2026-06-27
---

# Conventions

Rules for how documentation and skills are structured in this repository.

## Documentation Artifacts

- **Lazy Creation**: Directories like `docs/adr/` or `docs/features/` are created only when the first file is needed.
- **Naming**: Use `kebab-case.md` for feature docs, research notes, and ADRs.
- **Reference Docs**: Use `UPPERCASE.md` for internal reference documents within the `skills/` directory.
- **OKF frontmatter**: Every produced doc under `docs/` opens with an OKF frontmatter block (required `type`, plus `title` / `description` / `tags` / `timestamp`) so that `docs/` is a consumable [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) bundle. The contract and the `type` vocabulary live in [`skills/formats/OKF.md`](../skills/formats/OKF.md); the decision is [ADR-0002](adr/0002-adopt-okf-for-produced-docs.md). `index.md` and `log.md` are reserved OKF filenames — `docs/index.md` is the bundle listing and the root `CHANGELOG.md` is its log.

## Skill Structure

- **SKILL.md**: Every skill must have a `SKILL.md` at its root following the canonical template in `skills/SKILL-TEMPLATE.md`.
- **Templates**: Skeletons for AI agents to fill in live in the skill's `templates/` directory and use `lowercase-hyphenated.md` naming.
- **Frontmatter**: The `description` in the YAML frontmatter is the primary routing signal for AI agents and must include trigger phrases and skip conditions.

## Branches

- Code lands on a feature branch (`feat/<short-name>`) or fix branch (`fix/<short-name>`); `main` receives merges, not commits.
- `feature-doc`, `tdd`, and `tdd-rounds` refuse to start if `HEAD` is `main` / `master` — create the branch first.
- The branch name should match the feature-doc filename (`docs/features/<short-name>.md` ↔ `feat/<short-name>`) so the contract and the diff are co-locatable.

## Commits

- Conventional Commits style: `feat(scope): …`, `docs(scope): …`, `fix(scope): …`.
- In `tdd-rounds`, additionally prefix with `R<N>:` per [`skills/tdd-rounds/COMMITS.md`](../skills/tdd-rounds/COMMITS.md).
- Co-author trailers are encouraged when the agent and a human collaborated on the change.

## Code Style

- Comment discipline is anchored in [`skills/formats/STYLE-comments.md`](../skills/formats/STYLE-comments.md). Default: write **no** comment. Keep only why / invariant / trade-off / provenance comments — and only when the next reader would otherwise reattempt the rejected alternative.

## Terminology

- All documentation must adhere to the vocabulary defined in `docs/CONTEXT.md` and `skills/LANGUAGE.md`.
- Stale terminology in documentation is considered a bug and should be corrected immediately.
