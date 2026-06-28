---
type: context
title: AI Agent Skills
description: Vocabulary and system map for the skills set used to shape AI agent behavior.
tags: [vocabulary, architecture]
timestamp: 2026-06-27
---

# AI Agent Skills

Vocabulary and system map for the skills set used to shape AI agent behavior.

## Language

**Skill**:
A discrete capability or discipline an agent can perform, defined by a `SKILL.md` contract.
_Avoid_: ability, tool (a tool is a technical primitive; a skill is a behavioral discipline)

**Trigger**:
A natural language phrase or condition that causes an agent to invoke a specific skill.
_Avoid_: hook, command

**Workflow**:
A canonical sequence of skills composed to solve a specific type of task (e.g., greenfield feature, bug fix).
_Avoid_: process, path

**Substrate**:
The shared foundation of vocabulary (`LANGUAGE.md`) and formats (`formats/`) that all skills consume.
_Avoid_: base, common

**Lens**:
A discipline applied during other skills to maintain quality, rather than being invoked as a standalone phase. May be a skill (e.g., `caveman`) or a shared reference (e.g., the `code-hygiene` lens in `formats/`).
_Avoid_: principle, guideline

**Gate**:
A skill that verifies conditions before allowing a workflow to proceed (e.g., `prod-ready`, `security-review`).
_Avoid_: check, blocker

## Relationships

- A **Workflow** is composed of multiple **Skills**.
- **Skills** consume the **Substrate**.
- **Lenses** are applied during **Skills**.
- **Gates** protect the transition between **Workflows** and the final release.

## Flagged ambiguities

- "state" was used for both agent session state and project-specific feature state — resolved: "feature state" is scoped to `docs/features/<name>/state/`.
