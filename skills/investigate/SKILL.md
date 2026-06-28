---
name: investigate
description: Use when the user asks for investigation, research, a proposal, or "options" before any code lands; or proactively for non-trivial structural decisions (new dependency, framework choice, API contract change, cross-cutting refactor). Triggered by phrases like "investigate X", "research Y", "give me a proposal", "what are our options", "how would we approach", "let's explore", "should we...". Produces a durable research note in `docs/research/<topic>.md`. Skip for tasks where one obvious approach exists (typo fixes, config tweaks, mechanical refactors). Pairs with `feature-doc` (captures *what* we're building once a direction is chosen) and `grill-plan` (stress-tests a chosen plan).
---

# Investigation Workflow

Investigation is a separate phase from implementation. It produces a durable artifact — a research note in `docs/research/<topic>.md` — that captures what's true today, the viable approaches, and the recommendation with its tradeoff. The artifact survives the conversation; future contributors can reach for it.

## When to use

- The user explicitly asks for investigation, research, a proposal, options, or "how would we approach X".
- A non-trivial structural decision is on the table: new dependency, new architectural pattern, framework choice, contract change, cross-cutting refactor.
- The decision passes the same bar as an ADR: hard to reverse, surprising-without-context, or the result of a real trade-off.

## When to skip

- One obvious approach (typo fixes, config tweaks, mechanical refactors).
- Pure execution of an already-decided plan.
- Bug fixes that don't change architecture.

## Phases

Each phase is a stop. Don't start the next until the previous is grounded.

### 1. Survey the current state — read first, claim later

Do not work from impressions. Read the relevant files and ground every claim in the artifact in something cite-able (`path:line`). Specifically check:

- **The relevant code paths.** Read entire functions, not just headers. If a behavior is being challenged, read the test that pins it.
- **Existing ADRs** (`docs/adr/`). A prior decision may already constrain the space — surface it; do not relitigate without flagging.
- **`CONTEXT.md`** if the topic touches domain language. Get the terms right before writing anything down.
- **Feature docs** (`docs/features/`) for acceptance criteria already committed.
- **Open follow-ups** in the codebase (TODO/FIXME) related to the topic.
- **Known Issues Ledger** (`docs/known-issues.md`). Check for historical "surprises" or wire-shape drifts found during past end-to-end verifications in this area. Learning from past failures prevents repeating them.

The Context section of the artifact lists what you found, with citations. Not what you guessed.

### 2. Map the design space — 2 to 3 options

Aim for 2 to 3 genuinely viable options. One option is not a design space; six is performance art. For each option capture:

- **Approach** — one or two sentences. Concrete, not abstract.
- **Pros** — what makes this attractive.
- **Cons** — what hurts. Don't soft-pedal — if you'd reject the option later, name the reason now.
- **Fit with project** — does it align with existing ADRs, conventions, the level of ceremony the team uses? Misfit isn't disqualifying but should be explicit.
- **Main tradeoff** — one line. The thing being accepted if this option is picked.

If you found only one option, say so and explain why other paths were ruled out. Do not pad with strawmen.

### 3. Recommend — with reasoning

Pick one option. Name it. Give explicit reasoning. Name the tradeoff being accepted. If the recommendation genuinely depends on user preference, say which preferences map to which option — do not punt the decision back without structure.

### 4. Checkpoint questions

Identify the user decisions that must land before any code does. Examples:

- "Do you want X or Y?"
- "Is the team OK with adding dependency Z?"
- "Should I draft an ADR first or start the implementation?"

Each question should be answerable; if it's open-ended, sharpen it.

### 5. (Optional) Independent review

For high-stakes artifacts — specs, ADRs, anything load-bearing for cross-team alignment — spawn an independent reviewer agent (e.g., `general-purpose`) with a self-contained brief and the artifact path. Do not delegate the synthesis; ask for a critique against specific axes (correctness, completeness, internal consistency).

## The artifact

Save the research note to `docs/research/<short-topic>.md`. Use [`templates/research-note.md`](./templates/research-note.md) as the skeleton. Create `docs/research/` lazily on first use.

The note must include:
- **Context** with citations.
- **Options** — 2 to 3, each with the five fields above.
- **Recommendation** with reasoning and the accepted tradeoff.
- **Checkpoint questions** the user must answer.
- **Out of scope** — explicit, so adjacent decisions don't silently leak in.

## Rules

- Do **not** start implementing inside the investigation. Stop at the artifact and the recommendation; wait for the user to choose.
- Do **not** narrow to one option silently. If only one option survives, the artifact must explain why the others were ruled out.
- Do **not** conflate research with planning. A plan executes a chosen option; research surfaces options.
- Do **not** skip the artifact for "small" investigations. The discipline of writing it is the value; the durable trail is the bonus.
- Do **not** add a Recommendation that just lists the options again. Pick one.

## Handoff

Once the user picks an option:

- Mark the research note **Decided** and bold the chosen option in the Recommendation section.
- If the decision is hard-to-reverse / surprising-without-context / the result of a real tradeoff → write an ADR (use `grill-plan`, or write directly into `docs/adr/`). Link the ADR back from the research note.
- If a concrete feature is now being built → run `feature-doc` next; link it from the research note.
- If the chosen option requires later validation → leave the research note Open and add a "Follow-ups" section.
