# Good and Bad Tests

Companion to [SKILL.md](SKILL.md). Concrete examples of the philosophy "test behavior, not implementation."

Examples use TypeScript-ish syntax for readability — the principles apply to any language and any test framework (pytest, JUnit, Go's `testing`, Jest, RSpec, etc.). Replace `expect(x).toBe(y)` with the equivalent assertion in your stack; the structure (Arrange / Act / Assert through the public interface) is what matters.

## Good tests

Test through the public interface. Read like a specification.

```ts
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Properties:

- Describes *what* the system does, not *how*.
- Uses only public APIs.
- Survives internal refactors.
- One logical assertion per test.

## Bad tests

### 1. Asserting on internal calls

**Bad** — couples the test to the implementation:

```ts
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

If you rename `process` or split it into two calls, the test breaks even though behavior is identical. Test the *outcome*, not the call.

### 2. Bypassing the interface to verify

**Bad** — peeks into the database directly:

```ts
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});
```

**Good** — verifies through the public interface:

```ts
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

If the storage layer changes (different table, new ORM, in-memory cache), the good version still works.

### 3. Testing the shape, not the behavior

**Bad** — asserts structure, not meaning:

```ts
test("getUser returns object with id and name fields", async () => {
  const user = await getUser("123");
  expect(user).toHaveProperty("id");
  expect(user).toHaveProperty("name");
});
```

**Good** — asserts the behavior the caller depends on:

```ts
test("getUser returns the user matching the requested id", async () => {
  const created = await createUser({ name: "Alice" });
  const fetched = await getUser(created.id);
  expect(fetched.name).toBe("Alice");
});
```

## Quick checklist

Before committing a test, ask:

- [ ] Would this test still pass if I rewrote the implementation while keeping behavior the same?
- [ ] Does the test name describe a behavior, not a function?
- [ ] Does it use only public APIs (no private fields, no DB peeking, no internal mocks)?
- [ ] Is there exactly one logical thing being asserted?

If any answer is no, revise before merging.
