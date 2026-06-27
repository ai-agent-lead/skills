# ADR Format

ADRs live in `docs/adr/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.

Create the `docs/adr/` directory lazily — only when the first ADR is needed.

An ADR is a produced doc, so it opens with OKF frontmatter per [`OKF.md`](OKF.md) (`type: adr`).

## Template

```md
---
type: adr
title: {Short title of the decision}
description: {one sentence — what we decided and why}
tags: [{area}]
timestamp: YYYY-MM-DD
status: accepted
---

# {Short title of the decision}

**Status:** accepted

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. An ADR can be a single paragraph plus the frontmatter and the `Status` line. The value is in recording *that* a decision was made and *why* — not in filling out sections. The date lives in `timestamp`; don't also keep a `**Date:**` line.

## Optional sections

Only include these when they add genuine value. Most ADRs won't need them. **Optional sections amplify a decision; they do not replace it.** Keep them terse — if a section grows past a short bullet list, ask whether the content belongs in a feature doc or design note instead. An ADR is not a feature spec.

- **Status** values: `proposed | accepted | deprecated | superseded by ADR-NNNN`. Default to `accepted` on creation; flip to `deprecated` or `superseded` when revisited.
- **Considered Options** — only when the rejected alternatives are worth remembering. One line per option, plus the reason for rejection.
- **Consequences** — only when non-obvious downstream effects need to be called out. Things the *code* will not make obvious.
- **Related** — cross-link to the feature-doc or research-note that triggered this ADR (recommended when one exists), and to peer ADRs it interacts with.

## Numbering

Scan `docs/adr/` for the highest existing number and increment by one. Numbers are monotonic — never reuse a retired number, even if the ADR is deleted, deprecated, or superseded. Gaps are acceptable; reuse causes confusion.

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.
