# Context Map Format

`docs/CONTEXT-MAP.md` lists the domains (bounded contexts) in a repo and how they relate. Add it when a second domain appears — a second vocabulary where one word means two things — or when one `CONTEXT.md` passes ~100 terms. Paths per [`DOCS-LAYOUT.md`](DOCS-LAYOUT.md) §1.

```md
---
type: context-map
title: Context Map
description: Lists the domains in this repo and how they relate.
tags: [architecture]
timestamp: 2026-05-22
---

# Context Map

## Domains

- [Ordering](./ordering/CONTEXT.md) — receives and tracks customer orders · code: `internal/ordering/`
- [Billing](./billing/CONTEXT.md) — generates invoices and processes payments · code: `internal/billing/`

## Relationships

- **Ordering → Billing**: Ordering emits `OrderPlaced`; Billing consumes it to invoice
- **Ordering ↔ Billing**: shared types `CustomerId` and `Money`
```

- Each domain folder under `docs/` has the same name as its code folder.
- Each domain's code folder gets a short `CLAUDE.md` / `AGENTS.md` pointing at `docs/<domain>/CONTEXT.md` ([`DOCS-LAYOUT.md`](DOCS-LAYOUT.md) §6).
- Draw the relationships as a Mermaid flowchart when there are more than three.
