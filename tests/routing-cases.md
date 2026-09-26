# Routing cases

Hand-checked fixtures for skill routing. Each row is a realistic user prompt and the skill that *should* fire (`none` = answer directly, no skill).

**How to score:** read the prompt, then read only the `description:` frontmatter of each skill (that is all Claude sees when routing). A row passes when exactly the expected skill is the best match and no other description claims the prompt as strongly. Built-in Claude Code skills (`code-review`, `update-config`) are listed where they compete.

**Columns:** *Baseline* is the 1.4.0 descriptions; *After* is the current descriptions. ✗ notes name the competing skill.

| # | Prompt | Expected | Baseline (1.4.0) | After |
| --- | --- | --- | --- | --- |
| 1 | "Explain your plan and proposal for the trigger overlap" | none | ✗ `investigate` ("give me a proposal") | ✓ |
| 2 | "Should we rename this variable?" | none | ✗ `investigate` ("should we…") | ✓ |
| 3 | "Investigate whether we should move from REST to gRPC" | `investigate` | ✓ | ✓ |
| 4 | "What are our options for caching session data?" | `investigate` | ✓ | ✓ |
| 5 | "Walk me through this function" | none | ✗ `grill-plan` ("walk me through this") | ✓ |
| 6 | "We've picked Postgres as the queue — grill me on it" | `grill-plan` | ✓ | ✓ |
| 7 | "How should I structure this parser module?" | `design` | ✗ `design` vs `system-design` ("how should I structure this [system]") | ✓ |
| 8 | "How should I structure this system — API, workers, scheduler?" | `system-design` | ✗ `design` vs `system-design` | ✓ |
| 9 | "Make the existing billing and ledger code more testable" | `improve-codebase-architecture` | ✗ `design` ("testability") vs `improve-codebase-architecture` | ✓ |
| 10 | "Design the public API for our new rate-limiter library" | `design` | ✗ `design` + `security-review` ("public API") | ✓ |
| 11 | "Spec out an OAuth sign-in endpoint" | `feature-doc` (escalates to `security-review`) | ✗ `feature-doc` + `security-review` ("auth flow") both auto-fire | ✓ |
| 12 | "Allow npm commands without a permission prompt" | `update-config` (built-in) | ✗ `security-review` ("permissions") | ✓ |
| 13 | "Do a security review of the webhook handler" | `security-review` | ✓ | ✓ |
| 14 | "Fix this: TypeError at user.ts:42, `name` is undefined" | `tdd` | ✓ | ✓ |
| 15 | "Checkout fails intermittently in CI and I don't know why" | `debug` | ✓ | ✓ |
| 16 | "Fix this bug where exports sometimes produce empty files" | `debug` | ✗ `tdd` ("fixing a bug") vs `debug` | ✓ |
| 17 | "Add integration tests for the existing importer" | none | ✗ `tdd` ("integration tests") | ✓ |
| 18 | "Implement the CSV export feature — ACs are in the feature doc" | `tdd` | ✓ | ✓ |
| 19 | "Drive the Builder agents through the 12 ACs" | `tdd-rounds` | ✓ | ✓ |
| 20 | "The feature doc has 7 ACs in one package — implement it" | `tdd` | ✗ `tdd-rounds` ("5-15 acceptance criteria") | ✓ |
| 21 | "Tests are green — do a simplify pass" | `simplify` | ✓ | ✓ |
| 22 | "This diff feels over-engineered, tighten it up" | `simplify` | ✗ no repo skill claims it (routed to stale installed `code-hygiene`) | ✓ |
| 23 | "Audit the terminology in this PR against our CONTEXT.md" | `pr-review` | ✗ no repo skill claims it (routed to stale installed `sync-check`) | ✓ |
| 24 | "I'm ready to merge my branch — anything missing?" | `prod-ready` | ✓ | ✓ |
| 25 | "Review PR 42 from Sam" | `pr-review` | ✓ | ✓ |
| 26 | "/code-review high" | `code-review` (built-in) | ✗ `pr-review` ("invokes a code-review slash command") | ✓ |
| 27 | "Check this change" (a one-line edit just made) | none | ✗ `pr-review` ("check this change") | ✓ |
| 28 | "We're about to deploy this branch to prod" | `prod-ready` | ✓ | ✓ |
| 29 | "Before we tag v1.0, run it against the real Stripe API" | `verify-real-deps` | ✓ | ✓ |
| 30 | "We're shipping v2.0 tomorrow and it talks to Twilio" | `prod-ready` → `verify-real-deps` → `release` | ✗ `prod-ready` ("shipping") and `verify-real-deps` both claim it, no order given | ✓ |
| 31 | "Benchmark the search endpoint's p99 latency" | `bench` | ✓ | ✓ |
| 32 | "Profile this hot loop" | `bench` | ✗ weak — "profile" only in TRIGGERS.md, not the description | ✓ |
| 33 | "Start a new project for the invoicing service" | `bootstrap` | ✓ | ✓ |
| 34 | "Initialize the database connection pool" | none | ✗ `bootstrap` ("initialize") | ✓ |
| 35 | "Be concise" | none (just answer briefly) | ✗ `caveman` ("be concise") | ✓ |
| 36 | "Spec this out: users can export invoices" | `feature-doc` | ✓ | ✓ |
| 37 | "The payments and ledger modules are too coupled — untangle them" | `improve-codebase-architecture` | ✓ | ✓ |
| 38 | "Rename users.name to full_name — the table has 40M rows" | `migrate` | ✗ no skill (one checklist line in `prod-ready`) | ✓ |
| 39 | "Make the existing users.email column unique" | `migrate` | ✗ no skill | ✓ |
| 40 | "Write a SQL query that finds duplicate users" | none | ✓ | ✓ |
| 41 | "Upgrade pgx from v4 to v5" | `upgrade` | ✗ no skill | ✓ |
| 42 | "Update Node from 18 to 22 in CI and the Dockerfile" | `upgrade` | ✗ no skill | ✓ |
| 43 | "Bump lodash from 4.17.20 to 4.17.21" | none | ✓ | ✓ |
| 44 | "Move our API from Express to Fastify" | `investigate` | ✓ | ✓ |
| 45 | "Cut a release for the CLI" | `release` | ✗ no skill | ✓ |
| 46 | "Bump the version to 2.1.0 and publish to npm" | `release` | ✗ no skill | ✓ |

## Score

| | Pass | Fail |
| --- | --- | --- |
| Baseline (1.4.0) | 20 / 46 | 26 |
| After | 46 / 46 | 0 |

The *After* column is a static trace against the rewritten descriptions, not a live model run. Re-score by hand whenever a `description:` changes, and add a row for every misroute seen in real use.
