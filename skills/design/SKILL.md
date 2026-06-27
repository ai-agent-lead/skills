---
name: design
description: Module and interface design principles — deep modules and testable interfaces. Use when designing a NEW module, class, or public API; deciding what to expose vs hide; reviewing an interface before implementation; or when the user asks "how should I structure this", mentions "deep modules", "testability", or "API design". Use for NEW code shape; for finding deepening opportunities in EXISTING code, use `improve-codebase-architecture`. Skip for trivial glue, getters/setters, or single-call wrappers. Pairs with the tdd skill — good design is what makes TDD pleasant.
complexity: medium
expected_duration: 20 minutes
---

# Module and Interface Design

Principles that make code easier to understand, change, and test.

1. **Deep modules** — small interface, lots hidden behind it.
2. **Testable interfaces** — accept dependencies, return results, keep the surface small.
3. **Illegal states unrepresentable** — encode runtime invariants in the type system.
4. **Functional core, imperative shell** — pure logic at the center, side effects at the edges.

## When to use

- Before writing a new module, class, or public function.
- When refactoring something that's painful to test.
- When reviewing an API surface (PRs, design docs).
- When a test is hard to write — usually the design is wrong, not the test.

## When to skip

- Trivial glue, getters/setters, single-call wrappers — design is overkill.
- Existing code that needs deepening — use [`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md).
- Whole-system topology (which modules should exist) — use [`system-design`](../system-design/SKILL.md).

## Principle 1: Deep modules

A **deep module** has a small, simple interface that hides a lot of complexity.

```
┌──────────────────┐
│  Small interface │  few methods, simple params
├──────────────────┤
│                  │
│  Deep            │  complex logic, hidden
│  implementation  │
│                  │
└──────────────────┘
```

A **shallow module** has a wide interface and thin implementation — it just passes through. Avoid.

```
┌──────────────────────────────┐
│      Large interface         │  many methods, leaky params
├──────────────────────────────┤
│   Thin implementation        │  mostly pass-through
└──────────────────────────────┘
```

When designing a module, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity behind the interface?

See [DEEP-MODULES.md](DEEP-MODULES.md) for examples.

## Principle 2: Design for testability

Good interfaces make testing natural. Three rules:

1. **Accept dependencies, don't create them.** Pass them in.
2. **Return results, don't produce side effects.** Pure functions are trivially testable.
3. **Small surface area.** Fewer methods, fewer params.

See [TESTABILITY.md](TESTABILITY.md) for examples and counter-examples.

## Principle 3: Make illegal states unrepresentable

Push runtime invariants into the type system. If a state can't exist, the compiler should reject it — not a runtime check, not a comment.

```
WEAK — both fields can be set or neither; runtime has to validate
type User = { email?: string; verifiedAt?: Date }

STRONG — the type enforces the invariant; the bad state can't compile
type User =
  | { kind: "unverified", email: string }
  | { kind: "verified",   email: string, verifiedAt: Date }
```

The difference: *"this can't happen"* in a comment (hope) vs *"this can't compile"* in the type system (guarantee). The second eliminates whole classes of bugs at compile time.

Applies in any language with sum types or discriminated unions (TS, Rust, Swift, OCaml, Kotlin, Python with `Literal`-tagged unions). In languages without them, approximate with enums + private constructors + factory methods, or builders that only expose `build()` once required fields are set.

See [ILLEGAL-STATES.md](ILLEGAL-STATES.md) for more examples and the limits of the pattern.

## Principle 4: Functional core, imperative shell

Push pure logic to the center; keep side effects (HTTP, DB, file I/O, time, randomness) at the edges. The functional core becomes trivially testable; the shell stays small enough to verify by inspection.

```
┌────────────────────────────────┐
│  Imperative shell               │  ← side effects live here
│  (small, hard to test fully)    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Functional core         │   │  ← same input → same output
│  │  (large, pure, trivial   │   │     no side effects
│  │  to test)                │   │
│  └─────────────────────────┘    │
└────────────────────────────────┘
```

Composes with Principle 2 — the core is what tests target, so mocks shrink to a handful at the shell boundary. Composes with Principle 3 — the core often returns Result-style values that the shell pattern-matches on.

See [FUNCTIONAL-CORE.md](FUNCTIONAL-CORE.md) for a concrete refactor example.

## How this connects to TDD

If TDD feels painful — tests need elaborate setup, mocks of internals, or peeking at private state — the design is wrong. Fix the interface, not the test. The two skills work as a pair:

- `design` decides *what the interface should be*.
- `tdd` decides *how to build it test-first*.

## Done when

The interface is small enough that you can describe it in one sentence, and the testability rules hold:

- Dependencies are accepted, not created internally.
- The module returns results; side effects are isolated.
- Surface area (method count + parameter count) is minimized.

If TDD then feels painful, return here — the design needs another pass.

## Optional artifact: design note

Most of the time `design` is guidance only — the shape lives in the code that follows. **Capture a sibling design note when**:

- The module shape is non-trivial enough that a future contributor would benefit from seeing the reasoning (interface options considered, why one was picked, what's hidden behind the seam).
- The interface decisions are load-bearing for downstream rounds of `tdd-rounds`.
- A `prod-ready` reviewer will need to verify "module map / public-interface signatures / test boundaries" against something explicit (per [prod-ready Section 7](../prod-ready/SKILL.md)).

When captured, save as a sibling to the feature doc: `docs/features/<feature>.design.md`, opening with OKF frontmatter (`type: design`) per [`skills/formats/OKF.md`](../formats/OKF.md). Skip when the interface is small enough that the code is the design.
