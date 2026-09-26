---
name: impact
description: Finds what a change to a function, method, or type reaches — callers up to entry points (routes, main, jobs), the tests on those paths, string links such as SQL tables and event topics, and the feature docs to re-check — using a tree-sitter code graph for Go, JavaScript, TypeScript, and Python with no toolchain installed. Use when about to change a function's behavior or signature, when reviewing a change to shared code, or when asked what depends on something. Triggered by "blast radius", "who calls", "impact of changing", "what breaks if", "what depends on". Not for mapping an unfamiliar area → `zoom-out`; not for finding why something fails → `debug`.
---

# Impact

Before you change a function, know what reaches it. This skill runs one command and reads the result, instead of grepping and opening thirty files.

## Why this skill exists

Agents find callers with `grep`, and grep lies both ways:

```
 grep "Charge(" ──► 14 text matches
   ✗ misses p.Charge() through an interface
   ✗ misses the route that reaches it by a handler reference
   ✗ matches comments, mocks, and ChargeBack()
 agent reads 30 files to sort it out ──► slow, and still incomplete
```

The code graph parses every Go, JS, TS, and Python file with tree-sitter (a parser, run as WebAssembly inside Node), resolves imports, and walks callers up to entry points. It knows names and imports, not types — so every edge says how sure it is.

## When to use

- **Before changing a function's behavior or signature** — especially an exported one, or one in a shared package.
- **Reviewing a PR** that changes shared code: which routes and tests does it reach?
- **Before deleting code** that looks unused.
- The user asks who calls something, or what a change would break.

## When to skip

- A private helper with one caller in the same file — reading the file is faster.
- Mapping an unfamiliar area, not one change → [`zoom-out`](../zoom-out/SKILL.md) (it can use `deps` from the same tool).
- Other languages — the tool supports Go, JS, TS/TSX, and Python. Elsewhere, fall back to grep and say so.

## Process

### 1. Run it

```
node <skills-dir>/scripts/code-graph/code-graph.mjs impact <target> [--depth 3]
```

| Target | Example |
| --- | --- |
| Function or type | `Charge`, `Cart` |
| Method | `Cart.total`, `Server.handleCharge` |
| Package-qualified (Go) | `pay.Charge` |
| Definition at a line | `internal/pay/pay.go:16` |
| Every top-level definition in a file | `web/src/pay.ts` |

When several definitions match, it lists them — narrow with `Type.Method` or `file:line`. `callers <target>` is the same with depth 1. The first run parses every file (seconds); later runs reuse a cache in `.git/` keyed by file content, so only edited files are parsed again.

### 2. Read the report

```
impact: Charge (function)  internal/pay/pay.go:16
  └─ Checkout  internal/order/order.go:5
     ├─ handleCheckout  cmd/api/main.go:9  ◄ entry: route POST /checkout
     └─ TestCheckout  internal/order/order_test.go:5  ◄ test

text matches (edges the parser cannot see — confirm by reading):
  table "payments": internal/report/report.go:3
docs to re-check (feature code: covers these files):
  - docs/billing/features/checkout/feature.md (building)
```

| Label | Meaning | What to do |
| --- | --- | --- |
| *(none)* — likely | Name resolved through an import or the same package | Trust it |
| **possible** | Same method name; the receiver's type is unknown (interfaces, variables) | Open the call site; drop the ones on other types |
| **text** | A string that links code the parser can't see: SQL table, route, event topic, env key | Read each hit; an import graph can't see these links |
| **entry** | A route, `main`, HTTP handler, job, CLI command, or `__main__` script | What users hit; name them in the PR |
| **test** | A test function or test file on the path | The tests to run and extend |

Also printed: other methods with the same name (for an interface method, these are the implementations) and `✗ no test found on any caller path` when nothing tests the change.

### 3. Act on it

- **Signature change:** every likely caller changes in the same commit; check every possible one.
- **Behavior change:** each entry point reached is a behavior users see — the feature doc's ACs should cover it, and `tdd` adds a test at the highest reached entry that has none.
- **Text matches:** read them before trusting the graph — a renamed table or topic breaks code no import points to.
- **Docs listed:** re-check them in the same change ([`DOCS-LAYOUT.md`](../formats/DOCS-LAYOUT.md) §5).
- **Put the summary in the PR** — entry points, tests, and any `possible` callers you ruled out and why.

## Other commands

```
node <skills-dir>/scripts/code-graph/code-graph.mjs deps [dir] [--mermaid]   # package → package imports, cycles marked ✗
node <skills-dir>/scripts/code-graph/code-graph.mjs index                    # parse and cache; prints counts and time
```

## Limits

- **No types.** A method call on a variable is `possible` unless the receiver is `this` / `self`, the receiver of the same Go type, or a class name.
- **Dynamic calls are invisible:** reflection, `getattr`, string-built routes, dependency-injection containers, calls from other languages. Text matches cover some of these; say which you checked.
- **Resolved imports:** relative JS/TS imports, `tsconfig` `paths` aliases, re-exports, `require`; Go module paths from every `go.mod`; Python absolute and relative imports. Package-manager dependencies are not graphed.
- Skipped: `vendor/`, `node_modules/`, `dist/`, `build/`, minified files, `.d.ts`, files over 1 MB.

## Anti-patterns

- **Grepping after running impact "to be sure", then trusting grep.** Grep is the fallback for unsupported languages, not a second opinion.
- **Ignoring `possible` callers.** They are where interface and callback bugs hide. Check each, or say why it's on another type.
- **Skipping text matches.** A table, route, or topic rename breaks callers that share no import.
- **Depth 10 on a hub function.** The tree explodes. Start at 3; raise it only along the branch you care about.

## Pairing with other skills

- **[`tdd`](../tdd/SKILL.md)** — runs this before changing an existing exported function; the entry points reached pick where the test goes.
- **[`pr-review`](../pr-review/SKILL.md)** / **[`prod-ready`](../prod-ready/SKILL.md)** — run it on changed shared functions; entry points and untested paths go in the findings.
- **[`zoom-out`](../zoom-out/SKILL.md)** — uses `deps` for its map of an area.
- **[`debug`](../debug/SKILL.md)** — `callers` narrows where a bad value can come from.
- **[`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md)** — `deps` shows cycles and coupling to deepen.

## Done when

- The report ran on the real target (not a guess at its name), and every `possible` caller was checked or ruled out.
- Every text match was read.
- Entry points, tests on the path, and untested paths are named in the plan or PR.
- Listed feature docs were re-checked in the same change.
