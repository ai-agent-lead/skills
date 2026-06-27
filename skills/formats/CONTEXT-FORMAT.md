# CONTEXT.md Format

`CONTEXT.md` is a produced doc, so it opens with OKF frontmatter per [`OKF.md`](OKF.md) (`type: context`; a `CONTEXT-MAP.md` uses `type: context-map`).

## Structure

```md
---
type: context
title: {Context Name}
description: {one sentence on what this context is and why it exists}
tags: [{area}]
timestamp: YYYY-MM-DD
---

# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A concise description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account

## Relationships

- An **Order** produces one or more **Invoices**
- An **Invoice** belongs to exactly one **Customer**

## Example dialogue

> **Dev:** "When a **Customer** places an **Order**, do we create the **Invoice** immediately?"
> **Domain expert:** "No — an **Invoice** is only generated once a **Fulfillment** is confirmed."

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — resolved: these are distinct concepts.
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others as aliases under `_Avoid_:`.
- **Flag conflicts explicitly.** If a term is used ambiguously, call it out in "Flagged ambiguities" with a clear resolution.
- **Keep definitions tight.** One sentence max. Define what it IS, not what it does.
- **Show relationships.** Use bold term names and express cardinality where obvious.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.
- **Write an example dialogue.** A conversation between a dev and a domain expert that demonstrates how the terms interact naturally and clarifies boundaries between related concepts.
- **Edit inline as terminology shifts.** `CONTEXT.md` is updated whenever a term is renamed, retired, or newly disambiguated. The `grill-plan` skill will offer to update it during planning sessions, but anyone touching the vocabulary can edit it directly — stale terminology here is worse than missing terminology.

## Minimal example (single domain)

The opening example uses an Ordering/Billing domain to show cross-context structure. For a smaller project a `CONTEXT.md` may be just a handful of terms and no relationships:

```md
---
type: context
title: Todo App
description: Vocabulary used across internal/auth and internal/todos.
tags: [auth, todos]
timestamp: 2026-05-22
---

# Todo App

Vocabulary used across `internal/auth` and `internal/todos`.

## Language

**User**:
A person identified by an email address; owns todos and sessions.
_Avoid_: account, profile

**Sign-in token**:
A single-use, time-limited token emailed to a User to prove ownership of an email address.
_Avoid_: magic link (the *URL* containing the token), OTP, code

**Session**:
A long-lived bearer token issued after a sign-in token is consumed; authenticates subsequent requests.
_Avoid_: cookie, JWT (the format is a random bearer string, not either of those)

**Todo**:
An item on a User's personal list — text plus a done flag. Owned by exactly one User.

## Flagged ambiguities

- "token" alone is ambiguous — always qualify as **sign-in token** or **session** (bearer).
```

## Single vs multi-context repos

**Single context (most repos):** One `CONTEXT.md` at the repo root.

**Multiple contexts:** A `CONTEXT-MAP.md` at the repo root lists the contexts, where they live, and how they relate to each other:

```md
---
type: context-map
title: Context Map
description: Lists the bounded contexts in this repo and how they relate.
tags: [architecture]
timestamp: 2026-05-22
---

# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) — generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md) — manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
```

The skill infers which structure applies:

- If `CONTEXT-MAP.md` exists, read it to find contexts
- If only a root `CONTEXT.md` exists, single context
- If neither exists, create a root `CONTEXT.md` lazily when the first term is resolved

When multiple contexts exist, infer which one the current topic relates to. If unclear, ask.
