---
name: tdd
description: Test-driven development with the red-green-refactor loop. Use when implementing a feature, fixing a bug, changing core logic, or when the user mentions "TDD", "test-first", "red-green-refactor", or "integration tests". Skip for trivial UI glue, config changes, or pure docs edits.
complexity: medium
expected_duration: 20 minutes
---

# Test-Driven Development

## When to use

- Implementing a feature, fixing a bug, or changing core logic.
- Any `tdd-rounds` Builder invocation (mandatory every round).
- The user mentions "TDD", "test-first", "red-green-refactor", "integration tests".

## When to skip

- Trivial UI glue, framework wiring, config changes, pure docs edits.
- Trivial getters / setters with no behavior.
- Bug whose root cause isn't yet known — run [`debug`](../debug/SKILL.md) first; the reproduction crystallises into the failing test.

## Pre-conditions

- **Current branch is not `main` / `master`.** If it is, stop and run `git checkout -b feat/<short-name>` (or `fix/...`) before writing the first test. Code lands on a feature branch; `main` receives merges, not commits.
- A feature doc (`docs/features/<short-name>.md`) exists with testable ACs — or a `debug` reproduction names the root cause.

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
- Resist adding features the test does not require.

### 3. Refactor — Clean up with the test as a safety net

- Remove duplication, improve names, extract functions.
- Run tests after every change.
- Do not add new behavior during refactor.
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
- Tests assert behavior through public interfaces, not internals.
- The simplify pass has run.
- For single-feature flow: `prod-ready` is queued. For `tdd-rounds`: the structured Builder report is emitted.

## Handoff

When all acceptance criteria are green:
- For a single-feature project: run `prod-ready` before opening the PR. Catches operational, infrastructure, and consistency issues tests don't surface.
- For a multi-round project orchestrated under `tdd-rounds`: emit the structured Builder report (per `tdd-rounds/templates/builder-report.md`) and stop. The parent runs `prod-ready` and `verify-real-deps` at the project level.
