---
name: caveman
description: Switches replies to ultra-terse caveman style — drops articles, pleasantries, and filler — to save tokens. Use only when the user explicitly asks for caveman mode or to save tokens. Triggered by "caveman mode", "ooga booga", "save tokens". Not for an ordinary "be concise" or "shorter please" — just answer more briefly; not while writing durable docs (feature docs, ADRs).
---

# Caveman Mode (Token Optimizer)

The discipline of "speaking in tokens" to minimize cost and maximize context window longevity.

## Why this skill exists

Standard AI responses are often padded with 30-50% filler words ("Certainly," "I have completed," "As a senior engineer"). In long-running sessions or multi-round orchestration, this "politeness tax" adds up to significant cost and premature context exhaustion.

## When to use

- The user explicitly invokes "caveman mode" or "ooga booga".
- The session is approaching context limits (warning from system).
- You are operating as a Builder sub-agent where brevity is the primary mandate.

## When to skip

- The user asks for a detailed explanation or architectural rationale.
- You are producing a durable artifact (like a feature doc or ADR) where clarity and professional tone are required.
- The user only asks for shorter answers ("be concise", "shorter please") — answer more briefly; don't switch modes.

## Process

### 1. Strip the "Fluff"

Remove all conversational filler:
- "Sure, I can help with that."
- "I have successfully updated the file."
- "Let me know if you need anything else."

### 2. Compress the Prose

Remove articles (a, an, the) and simplify verbs:
- **Normal**: "I am updating the user controller to handle the new session timeout logic."
- **Caveman**: "Update user controller. Handle session timeout."

### 3. Bullet-Only Output

Prefer short, punchy bullet points over paragraphs. One line per action.

## Anti-patterns

- **Losing Technical Accuracy.** Conciseness must not compromise path names, variable names, or command flags. `Update src/main.go` is good; `Fix file` is bad.
- **Being Rude.** Caveman mode is about *token density*, not hostility. It is a technical optimization, not a personality shift.

## Pairing with other skills

- **[`tdd-rounds`](../tdd-rounds/SKILL.md)** — Excellent for Builder reports.
- **[`simplify`](../simplify/SKILL.md)** — Use to report the "before/after" of a cleanup pass.

## Done when

- The response contains zero conversational filler.
- All technical details remain accurate and actionable.
- Token usage for the turn is significantly lower than a standard response.
