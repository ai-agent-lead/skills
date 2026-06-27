# Make Illegal States Unrepresentable

The single highest-leverage application of the type system: prevent bad states at compile time so you don't have to defend against them at runtime.

The pattern: take a runtime invariant ("a verified user must have a verification timestamp") and encode it in the types. The bad state can no longer be constructed.

## This is simplicity, not ceremony — bounded by "boring beats clever"

If you prefer simple code, this principle is *on your side*. Constructive typing **deletes** code: the `if (!x) throw` guards repeated across call sites, the `// invariant:` comments that rot. Making a bad state uncompilable is fewer moving parts than defending against it at runtime, not more.

The tension people feel is with *defensive* typing — casts, assertions, validate-everywhere, generics for their own sake. That's not this. The rule that keeps the two apart is [`CODE-HYGIENE`](../formats/CODE-HYGIENE.md) Principle 1, applied at the type level:

- **Reach for the boring tools first:** sum types / discriminated unions, a narrow domain type where the distinction earns its keep (`Email` vs raw `string`), parse-at-the-boundary then trust, exhaustive matching.
- **Treat the clever tools as advanced:** phantom types, conditional / mapped-type gymnastics, deep generics, type-level programming. Reach for them only when the invariant is load-bearing *and* the boring encoding can't carry it — the same "is this worth the puzzle?" bar as any clever code. When in doubt, validate at construction (see "Limits" below) instead.

## Example 1 — Optional fields that should move together

WEAK
```ts
type User = {
  email: string;
  verifiedAt?: Date;
  verificationToken?: string;
};
```

This permits four combinations but only three are valid:

| State | Valid? |
|---|---|
| email + neither | ✓ unverified |
| email + token only | ✓ pending |
| email + verifiedAt only | ✓ verified |
| email + token + verifiedAt | ✗ incoherent |

STRONG
```ts
type User =
  | { kind: "unverified"; email: string }
  | { kind: "pending";    email: string; token: string }
  | { kind: "verified";   email: string; verifiedAt: Date };
```

Each state names itself. Pattern matching is exhaustive. The fourth (incoherent) state cannot compile.

## Example 2 — Phantom types for pipeline stages *(advanced — reach for only when load-bearing)*

Phantom types are the "clever" end of the spectrum: powerful, but a tax on every reader. Use this only when the *ordering* invariant is genuinely load-bearing (a security-sensitive sanitize-before-persist flow) and the cost of getting the order wrong is high. For an ordinary pipeline, a sum type plus validation at the boundary is the boring, sufficient choice.

When the same data flows through stages (e.g. `RawInput` → `Validated` → `Sanitized`), encode the stage in the type:

```ts
type Validated<T> = T & { _validated: true };
type Sanitized<T> = T & { _sanitized: true };

function validate(input: RawInput): Validated<RawInput> { ... }
function sanitize(input: Validated<RawInput>): Sanitized<RawInput> { ... }
function persist(input: Sanitized<RawInput>): void { ... }
```

`persist` cannot be called with raw input. The compiler enforces the order — no runtime guard needed.

## Example 3 — Non-empty collections

```ts
// WEAK — runtime check forever, easy to forget
function firstUser(users: User[]): User {
  if (users.length === 0) throw new Error("empty");
  return users[0];
}

// STRONG — the type enforces non-emptiness
type NonEmpty<T> = [T, ...T[]];
function firstUser(users: NonEmpty<User>): User {
  return users[0]; // type-safe, no check needed
}
```

Callers can't pass an empty array — it doesn't satisfy the type.

## When the language can't fully encode

In languages without sum types (older Java, plain JS):

- **Use enum + private constructor + factory methods.** Each factory returns a value that's already in a valid state.
- **Use builders that only expose `build()` once required fields are set.** The build method's signature changes as fields are populated (in TypeScript, this is doable via fluent builders + conditional types).
- **Document the invariant in one place, validate at construction, never internally.** The closer construction lives to the type, the fewer scattered checks survive.

The principle still holds: the closer the invariant lives to the type system, the fewer bugs survive.

## Limits — when not to encode

- **Invariants that change frequently.** If the rule is in flux, encoding it ossifies it. Use runtime validation until the rule stabilises, then encode.
- **Invariants that span systems.** If the rule lives across multiple services, types in one service can't enforce it. Validate at the boundary.
- **Invariants the type system can't express.** *"An order's total equals the sum of its line items"* — most type systems can't encode this. Validate at construction; treat the constructor as a quarantine.

## The smell that points to this principle

If you find yourself writing comments like:

```
// invariant: if status === "verified", verifiedAt must be set
```

That's the type system asking to be used. The comment will rot. The type won't.

If you write defensive checks like:

```
if (!user.verifiedAt) throw new Error("user must be verified");
```

…and that check appears in more than one place, the type can carry that obligation instead. Lift the invariant.
