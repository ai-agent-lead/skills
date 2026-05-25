---
name: code-hygiene
description: Day-to-day coding discipline at the line and function level — boring code, naming as primary refactor, YAGNI, rule of 3, locality of behavior. Use when reviewing or writing code, when names feel wrong, when tempted to abstract too early, when a solution looks clever, when the simplify pass after `tdd` runs, or when the user mentions "simpler", "boring", "naming", "YAGNI", "premature abstraction", "over-engineered". Skip for module-level interface design — use `design` instead. Skip for whole-codebase architectural sweeps — use `improve-codebase-architecture`.
complexity: low
expected_duration: 5 minutes
---

# Code Hygiene

Day-to-day discipline that keeps a codebase readable, navigable, and easy to change. Smaller in scope than `design` (which shapes module interfaces) — these are line-level and function-level habits.

Five principles.

1. **Boring code beats clever code** — prefer the obvious solution over the elegant trick.
2. **Naming is the primary refactor** — a bad name misleads longer than a bad implementation.
3. **YAGNI** — don't build for hypothetical futures.
4. **Rule of 3 before extracting** — duplicate twice; extract on the third occurrence, not the second.
5. **Locality of behavior** — related code lives together; don't split by category.

## When to use

- Writing new code, line by line — keep these in mind as you type.
- Reviewing a PR — these are five common smell categories.
- After `tdd` reaches green, during the [`simplify`](../simplify/SKILL.md) sweep — `code-hygiene` is the lens you apply.
- When you read code and pause to figure out what it's doing — that pause is a smell.

## When to skip

- Module-level shape (interface, depth, dependencies) — use `design`.
- Whole-codebase sweeps for shallow modules — use `improve-codebase-architecture`.
- The horizontal-vs-vertical TDD failure mode — that's `tdd`'s territory.

## Principle 1: Boring code beats clever code

When there's an obvious solution and a clever one, pick the obvious. Cleverness is a tax on every reader who comes after.

**Smell**: a one-liner using bit manipulation, regex acrobatics, or chained ternaries to do what a four-line `if` would do clearly.

**Rule of thumb**: if reading the code feels like solving a puzzle, that's a smell — even when the puzzle has a satisfying answer. Save cleverness for places where it earns its cost (a hot loop you've actually profiled, a parser, a constraint solver).

## Principle 2: Naming is the primary refactor

Bad code with great names is debuggable; great code with bad names misleads forever. Names live longer than implementations.

**Smells**:
- A variable named `data`, `result`, `tmp`, `value`, or `item` that survives more than ~5 lines.
- A function named `process`, `handle`, `run`, or `do` that does anything specific.
- A boolean named `flag`, or a name with `Manager` / `Helper` / `Util` suffix that hides what the thing actually is.
- A type named after the *shape* of the data (`UserData`, `OrderInfo`) instead of its *meaning* (`UnverifiedUser`, `PendingOrder`).
- A function name that doesn't match what it does (especially: `getX` that mutates, or `isX` that returns non-boolean).

**Fix the name first.** Even before fixing the implementation. The name is the documentation everyone reads.

## Principle 3: YAGNI — You Aren't Gonna Need It

Don't build for hypothetical futures. Don't add a parameter "in case we need it later". Don't extract an interface "in case there's a second implementation". Don't write the configurable version of a thing that has one configuration.

**Why**: hypothetical futures rarely arrive in the shape you predicted. Code written for them ages worse than code added when the need is real.

**Exception**: when the cost of *not* designing for it later is provably much higher than the cost of designing for it now (e.g. schema migrations under load, public APIs with downstream consumers, security-sensitive surfaces). The bar is *provably* — not "I have a feeling".

## Principle 4: Rule of 3 before extracting

Duplicate twice; extract on the third occurrence — not the second.

The first occurrence is unique. The second might be coincidence. The third is a pattern. Extracting at two reveals only one axis of variation; extracting at three reveals the *real* axis.

**Why**: premature abstractions calcify. Once a wrong abstraction exists, callers shape themselves to it, and rewriting becomes expensive. Three concrete copies are cheap; one wrong abstraction is not.
5. **Locality of behavior** — related code lives together; don't split by category.
6. **Comments earn their keep** — default to none. Keep only WHY-comments: a constraint, an invariant, a trade-off, or a provenance link to an ADR / round / snapshot.

## When to use
...
## Principle 5: Locality of behavior

Related code lives close together. Don't split a system by *type of code* (`controllers/`, `services/`, `repositories/`) — split by *responsibility* (`orders/`, `billing/`, `auth/`).

**Why**: a new contributor should be able to read one folder and understand one feature, not bounce across five folders to follow one request.

**Smell**: changing one feature requires editing 5 files in 5 directories. That's a sign the structure separates *type* of code, not *responsibility*. (This is a `improve-codebase-architecture` issue at scale, but at smaller scale you can fix it inline by colocating files.)

## Principle 6: Comments earn their keep

Default to none. Keep only WHY-comments: a constraint, an invariant, a trade-off, or a provenance link to an ADR / round / snapshot. Delete WHAT-comments, "used by X" / "added for Y" caller references, banner dividers, and commented-out code on sight.

**Smells**:
- A comment that restates the next line of code.
- A comment naming a caller — that reference rots the moment someone renames or removes the caller. Use `grep`.
- A TODO / FIXME / HACK with no owner, ticket, ADR, or date.
- Commented-out code "in case we need it again". Git has it.

**Project-specific conventions** (package docstrings, provenance grammar) live in the repo's comment style doc — usually [`skills/formats/STYLE-comments.md`](../formats/STYLE-comments.md).

## Done when

- Names communicate intent — a stranger reads them and forms the right mental model.
- The clever shortcut is replaced with the obvious version (or its cleverness is justified by a comment naming the constraint).
- No "in case we need it" parameters, classes, or interfaces remain.
- Duplications either survived the 2-occurrence test (left as-is) or proved themselves at the 3rd occurrence (extracted).
- Related code lives near related code.
- Every surviving comment names a why, an invariant, a trade-off, or a provenance link. None restates the code.

## Pairing with other skills

- **`design`** sets module shape; `code-hygiene` polishes within the module. Different scopes; both apply.
- **`tdd`** reaches green; `code-hygiene` is part of the simplify sweep that follows.
- **`improve-codebase-architecture`** finds shallow modules; if the diagnosis is "shallow" but the fix is line-level (rename, inline, delete dead helper), this skill applies. If the fix is structural (deepen the module), that one does.
