---
name: tdd
description: Test-first implementation via red-green-refactor. Use when implementing a feature with known acceptance criteria, fixing a bug whose cause is already known, or changing core logic. Triggered by "TDD", "test-first", "red-green-refactor", "implement this feature". Not for bugs whose root cause is unknown → `debug` first; not for 10+ ACs or multi-package delivery → `tdd-rounds`; not for adding tests to existing code, UI glue, config, or docs.
---

# Test-Driven Development

## When to use

- Implementing a feature, fixing a bug whose root cause is known, or changing core logic.
- Any `tdd-rounds` Builder invocation (mandatory every round).
- The user mentions "TDD", "test-first", "red-green-refactor".

## When to skip

- Trivial UI glue, framework wiring, config changes, pure docs edits.
- Trivial getters / setters with no behavior.
- Adding tests to existing, working code — there is no red phase to drive the design; just write the tests.
- 10+ ACs or multi-package delivery — use [`tdd-rounds`](../tdd-rounds/SKILL.md).
- Bug whose root cause isn't yet known — run [`debug`](../debug/SKILL.md) first; the reproduction crystallises into the failing test.

## Pre-conditions

- **Current branch is not `main` / `master`.** If it is, stop and run `git checkout -b feat/<short-name>` (or `fix/...`) before writing the first test. Code lands on a feature branch; `main` receives merges, not commits.
- A feature doc (`docs/features/<short-name>/feature.md`) exists with testable ACs — or a `debug` reproduction names the root cause. With the first failing test, set its `status: building` ([`DOCS-LAYOUT.md`](../formats/DOCS-LAYOUT.md) §2).
- **Changing an existing exported or shared function?** Run [`impact`](../impact/SKILL.md) first: its entry points and tests say where the test goes and what else to re-run.
- **Changing existing code that looks wrong or unclear, with no `WHY:`?** Read its history first (`git log -L :<Func>:<file>`) — see [`STYLE-comments.md`](../formats/STYLE-comments.md) §5.

## Philosophy

Tests verify **behavior through public interfaces**, not implementation details. Code can change entirely; tests shouldn't.

- **Good tests** read like specifications: "user can checkout with valid cart". They use the public API and survive refactors.
- **Bad tests** are coupled to internals: they mock internal collaborators, assert on call order, or peek at private state. The warning sign — the test breaks during a refactor when behavior didn't change.

See [TESTS.md](TESTS.md) for concrete good/bad examples and a pre-commit checklist.

## Anti-pattern: Horizontal Slicing

**Do not write all tests first, then all implementation.** This is the most common TDD failure mode for AI agents — you write five tests in one shot, then five matching functions. The tests describe *imagined* behavior, become insensitive to real bugs, and lock in the wrong shape.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED → GREEN: test1 → impl1
  RED → GREEN: test2 → impl2
  ...
```

One test → minimum code to pass → next test. Each cycle informs the next.

## Workflow

### 1. Red — Write a failing test

- Pick one acceptance criterion from the feature doc.
- Write a single test that asserts the behavior through the public interface.
- Name the test after the behavior, not the function: `returns_empty_list_when_no_users`, not `test_getUsers`.
- Run it. Confirm it fails for the **right reason** (assertion failed, not import error).

### 2. Green — Minimum code to pass

- Smallest amount of code that makes the test pass.
- Hardcoding a return value is acceptable on the first test — the next test forces generalization.
- Resist adding features the test does not require — YAGNI, and boring code over clever code ([`CODE-HYGIENE.md`](../formats/CODE-HYGIENE.md) 1, 3).

### 3. Refactor — Clean up with the test as a safety net

- Shape the code to [`CODE-HYGIENE.md`](../formats/CODE-HYGIENE.md) — its seven principles, checked against *The bar*. In a refactor step that means: rename until the names say what the code does, extract only on the third copy, keep related code together, and put constants at their narrowest scope.
- Run tests after every change.
- Do not add new behavior during refactor.
- **Comments, while you're here:** follow [`STYLE-comments.md`](../formats/STYLE-comments.md) — headers state the contract, comments inside functions are tagged, and every comment in a function you changed is re-read. The reason for a change goes in the commit body, not a comment — commits follow [`COMMIT-FORMAT.md`](../formats/COMMIT-FORMAT.md).
- **Never refactor while red.** Get to green first.

### 4. Simplify pass — end-of-round, after green

Before declaring the round done, run the [`simplify`](../simplify/SKILL.md) skill. It walks every changed file with four lenses — reuse, quality, efficiency, test relevance — and is a single sweep, not a license to refactor everything. If you find structural issues that need a dedicated round, surface them as `Open questions for parent` instead.

## Rules

- One behavior per test.
- No production code without a failing test first (for core logic).
- Test through public interfaces only — don't peek at private state or internal calls.
- If a test is hard to write, the design is probably wrong — fix the design, not the test.
- Test-after is acceptable for: UI wiring, framework glue, trivial getters/setters.

## Test Pyramid (default targets)

- ~70% unit tests — fast, isolated.
- ~20% integration tests — real dependencies where it matters (DB, HTTP).
- ~10% end-to-end — only the critical user paths.

## Anti-patterns

- Writing tests after the code "to get coverage" — defeats the design feedback loop.
- Mocking everything — tests pass but the system is broken. Mock at boundaries only (external APIs, time, randomness).
- One giant test asserting many things — failures become hard to diagnose.
- Asserting on internal call counts or order — couples the test to implementation.

## When invoked as a Builder for a multi-round project

If the parent agent dispatched you with a `tdd-rounds`-shaped brief listing "Skills (in order): design, tdd, simplify": **execute all three sequentially in this single invocation. Do not return to the parent between skills.** "In order" means run them in that order WITHIN this run — not handed off across separate invocations. Returning early after only `design` is the most common Builder failure mode and forces the parent to re-dispatch.

The `tdd-rounds` skill captures the full orchestration pattern (Builder brief schema, structured report shape, parent verification ritual). Read it if your brief references it.

## Pairing with other skills

- **[`feature-doc`](../feature-doc/SKILL.md)** — runs *before*. ACs become the test list.
- **[`debug`](../debug/SKILL.md)** — runs *before* for non-trivial bugs. Reproduction → failing test.
- **[`design`](../design/SKILL.md)** — runs *alongside*. If TDD feels painful, the design is wrong.
- **[`simplify`](../simplify/SKILL.md)** — runs *after green*. End-of-slice / end-of-round sweep.
- **[`prod-ready`](../prod-ready/SKILL.md)** — runs *after green* (single feature) before opening the PR.
- **[`tdd-rounds`](../tdd-rounds/SKILL.md)** — wraps `tdd` for multi-round projects.

## Done when

- All ACs from the feature doc are green and the tests are committed.
- The feature doc's `status` is `building`, and its `code:` lists the paths this work touched.
- Tests assert behavior through public interfaces, not internals.
- The changed code meets *The bar* in [`CODE-HYGIENE.md`](../formats/CODE-HYGIENE.md), and the simplify pass has run.
- For single-feature flow: `prod-ready` is queued. For `tdd-rounds`: the structured Builder report is emitted.

## Handoff

When all acceptance criteria are green:
- For a single-feature project: run `prod-ready` before opening the PR. Catches operational, infrastructure, and consistency issues tests don't surface.
- For a multi-round project orchestrated under `tdd-rounds`: emit the structured Builder report (per `tdd-rounds/templates/builder-report.md`) and stop. The parent runs `prod-ready` and `verify-real-deps` at the project level.
