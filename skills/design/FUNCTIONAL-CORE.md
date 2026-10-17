# Functional Core, Imperative Shell

Coined by Gary Bernhardt ("Boundaries", 2012). Push pure logic to the center; keep side effects at the edges.

> Language-agnostic. Examples use TypeScript; the same split works in Python (pure functions + dataclasses, side effects in the calling layer), Go (pure funcs + struct returns, side effects in the handler), Rust (`fn` returning `Result<Decision, _>`, effects in the binary's `main`-side), Kotlin (sealed classes for decisions, effects in coroutines / handlers). What matters: pure functions return values; the shell is the only place that touches the world.

## The shape

```
┌─────────────────────────────────────┐
│  Imperative shell                    │
│  - HTTP / RPC handlers               │
│  - DB queries                        │
│  - File I/O                          │
│  - Time, randomness, env             │
│  - Network calls, queues             │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Functional core              │   │
│  │  - Pure transformations       │   │
│  │  - Decisions                  │   │
│  │  - Validations                │   │
│  │  - Calculations               │   │
│  │  - State derivations          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

The shell:
- Reads inputs from the world
- Calls the core
- Writes outputs back to the world

The core never touches the world directly.

## Refactoring example

**Weak** — mixed:
```ts
async function processOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  const stock = await api.checkStock(order.items);

  if (stock.allAvailable) {
    order.status = "confirmed";
    order.confirmedAt = new Date();
    await db.orders.save(order);
    await emailer.send(order.userId, "confirmed");
    return order;
  } else {
    order.status = "backordered";
    await db.orders.save(order);
    return order;
  }
}
```

To test this you must mock `db`, `api`, `emailer`, AND the date. The test mostly verifies the mocks.

**Strong** — split:

**Functional core** — pure:

```ts
type OrderDecision =
  | { kind: "confirm";     newStatus: "confirmed";   confirmedAt: Date }
  | { kind: "backorder";   newStatus: "backordered" };

function decideOrderStatus(
  order: Order,
  stock: StockReport,
  now: Date,
): OrderDecision {
  if (stock.allAvailable) {
    return { kind: "confirm", newStatus: "confirmed", confirmedAt: now };
  }
  return { kind: "backorder", newStatus: "backordered" };
}
```

**Imperative shell** — thin:

```ts
async function processOrder(orderId: string) {
  const order = await db.orders.get(orderId);
  const stock = await api.checkStock(order.items);
  const decision = decideOrderStatus(order, stock, new Date());

  order.status = decision.newStatus;
  if (decision.kind === "confirm") {
    order.confirmedAt = decision.confirmedAt;
  }
  await db.orders.save(order);

  if (decision.kind === "confirm") {
    await emailer.send(order.userId, "confirmed");
  }
  return order;
}
```

Now `decideOrderStatus` is pure: trivially tested with literal inputs and outputs, no mocks. The shell is short enough to verify by reading.

## How to find your core

Ask: *"If I removed all the awaits and the side-effecting calls, what's left?"* That residue is the candidate for the core. Lift it out as a pure function. Then ask: *"What is each side-effect call doing — fetching input, or writing output?"* Group them at the top and bottom of the shell respectively.

A useful test: a pure core function should be safe to call ten thousand times in a tight loop with no consequences. If that's not safe, it's not pure yet.

## Pairings with other principles

- **With Principle 2 (testability):** the core is what your tests target. Mocks shrink from "everywhere" to "at the shell's edge only".
- **With Principle 3 (illegal states):** the core often returns sum types (Decision, Result, Outcome) that the shell pattern-matches on. Bad transitions become uncompileable.
- **With Principle 1 (deep modules):** the core is "deep" — many decisions hidden behind a single function call. The shell is "shallow" *by design* — its thinness is the point.

## Limits — where this gets harder

- **Streaming / long-running processes.** Purity is easier when inputs are bounded. For streams, lift transformations into pure operators (map, filter, fold) and keep the orchestration impure but small.
- **Performance-critical paths.** If creating intermediate values is expensive, you may push more state into the shell. Profile first; don't preemptively sacrifice clarity.
- **Logic that depends on intermediate API calls.** When the decision needs results from external calls partway through, the core/shell split moves *inside* each call boundary. The pattern still helps; the core just gets smaller chunks.

## The smell that points to this principle

If your function under test needs more mocks than there are lines of business logic, the logic is buried inside the shell. Lift it out.

If two test cases have nearly-identical setup but assert on different decisions, the decision is a pure function in disguise. Lift it out.
