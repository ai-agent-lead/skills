# SKILL.md template

Canonical scaffold for every skill in this set. Copy the body below into a new `<skill-name>/SKILL.md`, fill it in, then prune sections that genuinely don't apply (rather than leaving placeholders).

**Before you create one:** apply the test in [ADR-0003](../docs/adr/0003-lenses-as-shared-references.md). A discipline applied only *inside* other skills — a lens or diagnostic never invoked on its own — belongs in [`formats/`](formats/) as a shared reference, not a `SKILL.md`. A `SKILL.md` is earned by a routable phase a user or another skill invokes directly.

The order is load-bearing. Claude scans top-to-bottom — `When to use` / `When to skip` should hit early so routing is decided before the reader gets to the body.

## Naming and placement

- File path: `skills/<skill-name>/SKILL.md` (lowercase, hyphenated directory).
- Supporting reference docs in the same directory go UPPERCASE (`MOTIVATION.md`, `DEEPENING.md`, etc.).
- Templates that callers fill in go in `<skill-name>/templates/` and stay lowercase (`feature-template.md`).
- Format docs that more than one skill consumes belong in [`skills/formats/`](formats/), not in any one skill's directory.

## Frontmatter rules

```yaml
---
name: <kebab-case>
description: <one paragraph: trigger phrases AND skip conditions AND adjacent skills>
---
```

The `description` is the routing signal. It should:
- Name what the skill does in one clause.
- List trigger phrases ("Use when…", "Triggered by phrases like…").
- List skip conditions ("Skip for…", "Use … instead when…").
- Name 1–3 adjacent skills (upstream / downstream / lateral) so Claude can de-conflict.

A `description` that names only the happy path will route falsely. Always name what to skip.

**Optional frontmatter.** Add `disable-model-invocation: true` for a user-only utility that should never auto-fire (e.g. `zoom-out`); the skill then runs only on explicit invocation. No other keys are read by the harness — `name` and `description` are the whole routing contract. Don't add decorative metadata (`complexity`, `expected_duration`, etc.); it isn't consumed and only drifts.

## Canonical body shape

```md
# <Title>

<Optional 1–2 sentences naming what the skill does and the *one* discipline at its core. Keep it tight — the description already covered the hook.>

## Why this skill exists  (optional — include for skills that teach a discipline; skip for orchestration / utility skills)

<2–4 sentences. Name the failure mode this skill prevents. Concrete > abstract.>

## When to use

- <trigger condition>
- <trigger phrase>
- <upstream signal — "<adjacent-skill> handed off"; "the user has <artifact>">

## When to skip

- <case where a different skill is the right answer; name that skill>
- <case where no skill is needed at all — "just fix it">

## Phases  (or **Process**, or **Workflow** — pick one and stick to it)

### 1. <Phase name — verb-leading>

<What happens in this phase. The output of the phase is named: a file, a finding, a decision.>

### 2. <Phase name>

<...>

## Anti-patterns

- **<Name of the failure mode>.** <One sentence on what it looks like in practice and why it's wrong.>
- ...

## Pairing with other skills

- **`<upstream-skill>`** — runs before. <One line on what hand-off looks like.>
- **`<downstream-skill>`** — runs after. <One line.>
- **`<lateral-skill>`** — applies alongside. <One line.>

## Done when

- <Verifiable condition — not "the skill was applied" but "the artifact exists / the named region is identified / the green test pins the bug">.
- ...

## Handoff  (optional — include when the skill clearly feeds into another)

<One sentence per branch. "If <condition> → run `<next-skill>`."> 
```

## Section requirements

| Section | Required | Notes |
| --- | --- | --- |
| Frontmatter (`name`, `description`) | yes | `description` must name skip conditions, not only trigger phrases. |
| Title (`# <Title>`) | yes | |
| Why this skill exists | optional | Include for *teaching* skills (discipline being taught). Skip for *orchestration* and *utility* skills. |
| When to use | yes | Body section, not just frontmatter. Frontmatter alone is too easy to skim past. |
| When to skip | yes | Body section. Mirror the description — explicit, not implied. |
| Phases / Process / Workflow | yes | Pick one heading. Don't mix. |
| Anti-patterns | recommended | Skip only if the skill is so simple there are none. |
| Pairing with other skills | yes | At minimum name 1 upstream and 1 downstream. |
| Done when | yes | Verifiable conditions, not vibes. |
| Handoff | optional | Use when the skill cleanly feeds into another; otherwise the Pairing section covers it. |

## Voice and length

- **Body length matches role**, not importance. Teaching skills run long (debug, security-review, tdd). Orchestration / utility skills run short (tdd-rounds, simplify, caveman). Don't pad an orchestration skill to match a teaching skill — it adds noise.
- **No hedging.** "Sometimes consider maybe doing X" is dead text. Pick a recommendation.
- **No corporate voice.** Direct sentences. The reader is a fast-reading senior engineer or an LLM, not an executive.
- **Cite paths**: `path:line` or `[link](relative/path.md)`. Don't say "see the auth module"; say `src/auth/session.go:42`.

## Vocabulary

- Architecture terms come from [`LANGUAGE.md`](LANGUAGE.md) — don't redefine. Link instead.
- Domain terms come from `docs/CONTEXT.md` (the consuming repo's glossary, not this skill set's).
- Format references for ADRs / CONTEXT.md live in [`formats/`](formats/) — link, don't inline.

## Adding the skill to the index

Once `SKILL.md` is written:

1. Add a row to README.md's "by trigger phase" index (under the right role group).
2. Add a row to README.md's "by role" table.
3. Add an entry to [`TRIGGERS.md`](TRIGGERS.md) — list the trigger phrases that should route to it.
4. If the skill participates in a canonical workflow, update [`WORKFLOWS.md`](WORKFLOWS.md).
5. If the skill produces a `docs/` artifact, add a row to the "Artifacts accumulate in `docs/`" table at the bottom of WORKFLOWS.md.
