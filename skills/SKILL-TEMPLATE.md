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
description: <What it does, one clause>. Use when <situation>. Triggered by "<phrase>", "<phrase>". Not for <nearest neighbour's case> → `<other-skill>`.
---
```

The `description` is the **only** routing signal — Claude never reads [`TRIGGERS.md`](TRIGGERS.md) or the README when deciding which skill to fire. Disambiguation that lives anywhere else does not route. Write it in this order:

1. **What** — one clause naming the skill's output or discipline.
2. **Use when** — the *situation*, not keywords. Claude matches on meaning more than on exact phrases.
3. **Triggered by** — 2–6 quoted phrases, each specific to this skill. No phrase may appear in another skill's list. Avoid phrases that occur in ordinary conversation ("should we…", "walk me through this", "check this change", "be concise") — they fire the skill on chat questions.
4. **Not for** — the nearest neighbour's case, with `→` and the skill name pointing at the right skill. This clause is what settles collisions. When several skills split one space, state the splitting rule in every one of them (the Shape skills all carry the same "pick by age and scope" sentence).
5. **Escalates to** (optional) — when this skill hands a detected condition to another (the gates escalate to `security-review`).

Keep "Pairs with…" workflow relationships out of the description — they spend routing budget without helping routing. They belong in the body's *Pairing with other skills* / *Handoff* section.

YAML constraints (the description is a plain scalar): no `": "` (colon-space) and no `" #"` (space-hash) anywhere in it; stay under 1024 characters. `npm test` ([`scripts/lint-triggers.js`](../scripts/lint-triggers.js)) enforces the shape, the constraints, phrase uniqueness, and that [`TRIGGERS.md`](TRIGGERS.md) mirrors the descriptions. [`tests/routing-cases.md`](../tests/routing-cases.md) is the routing check — re-score it when a description changes.

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
| Frontmatter (`name`, `description`) | yes | `description` follows the What / Use when / Triggered by / Not for shape above. |
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
- **Code examples obey [`formats/STYLE-comments.md`](formats/STYLE-comments.md).** Agents copy examples. Put labels like *Bad* / *Good* in the text above a code block, never as a comment above the function inside it. `npm test` checks this.
- **Produced docs follow [`formats/WRITING-STYLE.md`](formats/WRITING-STYLE.md).** A skill that writes a `docs/` artifact links it at the step where the doc is written.
- **Cite paths**: `path:line` or `[link](relative/path.md)`. Don't say "see the auth module"; say `src/auth/session.go:42`.

## Vocabulary

- Architecture terms come from [`LANGUAGE.md`](LANGUAGE.md) — don't redefine. Link instead.
- Domain terms come from `docs/CONTEXT.md` (the consuming repo's glossary, not this skill set's).
- Format references for ADRs / CONTEXT.md live in [`formats/`](formats/) — link, don't inline.

## Adding the skill to the index

Once `SKILL.md` is written:

1. Add a row to README.md's "by trigger phase" index (under the right role group).
2. Add a row to README.md's "by role" table.
3. Add a row to [`TRIGGERS.md`](TRIGGERS.md) whose quoted phrases exactly match the description's *Triggered by* list (`npm test` checks this).
4. Add rows to [`tests/routing-cases.md`](../tests/routing-cases.md) — at least one prompt that should route to the skill and one near-miss that should not.
5. If the skill participates in a canonical workflow, update [`WORKFLOWS.md`](WORKFLOWS.md).
6. If the skill produces a `docs/` artifact, add a row to the "Artifacts accumulate in `docs/`" table at the bottom of WORKFLOWS.md.
