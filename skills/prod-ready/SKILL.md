---
name: prod-ready
description: Pre-merge production-readiness checklist — operational, infrastructure, and consistency checks that tests alone don't surface. Use after `tdd` reaches green; before opening a PR or merging to main; after significant infra changes (new DB, new deployment target, new auth flow); or when the user mentions "shipping", "ready to merge", "before deploy", "production readiness", or "prod-ready". Pairs with the `tdd` skill — tdd proves the feature works; this catches what tests can't see (server timeouts, DB pragmas, error-response consistency, secrets at rest).
complexity: low
expected_duration: 10 minutes
---

# Prod-Readiness Checklist

A short pre-merge gate. Tests prove the **feature** works. This skill catches what tests don't see: ops defaults, infra config, security defense-in-depth, and cross-handler consistency.

> The checklist is **stack-agnostic in concept**, even when an item names a Go/Node-style knob. Translate to your stack: "explicit read/write/idle timeouts" applies to any HTTP framework (Spring's `server.tomcat.connection-timeout`, FastAPI's Uvicorn `--timeout-keep-alive`, Rails' Puma `worker_timeout`, etc.). "Default isolation" applies to every database engine (Postgres `default_transaction_isolation`, MySQL `transaction-isolation`, SQLite `PRAGMA`, etc.). When an item doesn't apply to your stack at all (e.g. no HTTP surface), write `n/a` with one line of why. Don't tick boxes you didn't actually verify.

## When to use

- After all acceptance criteria are green.
- Before opening a PR or merging to main.
- After significant infrastructure changes (new DB, new deployment target, new auth flow).

## Checklist

Walk each section. An item is OK to fail **only if** the feature doc's Notes / Non-Goals explicitly accepts the gap.

### 1. Server hygiene (HTTP / RPC services)
- [ ] Server has explicit read / write / idle timeouts — not framework defaults. Default-zero (or framework "demo" defaults) are a common production-killer; equivalent traps exist in every stack.
- [ ] Termination signal (SIGTERM, container stop, etc.) triggers graceful shutdown; in-flight requests finish before the process exits.
- [ ] Unhandled errors in a handler don't crash the process — top-level recovery + structured log of the failure.
- [ ] Request payload size is bounded at the boundary — a client streaming an unbounded body shouldn't OOM the process.

### 2. Database / storage
- [ ] Referential integrity enforced — FK constraints on, or an equivalent invariant maintained explicitly with a comment naming where it lives.
- [ ] Concurrency / isolation mode set deliberately, not left on the engine's default. Default isolation often allows write-write races your tests didn't see.
- [ ] Indexes match the actual filter + sort shape of hot queries — read the slow-query log or `EXPLAIN` the top endpoints; don't guess.
- [ ] Migrations are forward-only and idempotent — safe to re-run after a partial deploy.

### 3. Auth / security defense-in-depth
- [ ] Tokens (sign-in, session, API keys) are hashed at rest — a DB leak shouldn't grant live sessions.
- [ ] Inputs are validated *and normalized* at the boundary (email: lowercase + trim, etc.).
- [ ] Secrets come from env / secret store, not flags, not files in repo.
- [ ] No PII or tokens in logs or error response bodies.

### 4. API consistency
- [ ] One code path for error responses — don't mix raw transport errors with a JSON helper, or two response envelopes within the same surface.
- [ ] Return shapes are consistent within a module / package — pick one error-propagation pattern and stick to it.
- [ ] Errors are wrapped with context as they propagate, so production logs name the failing operation, not just the leaf error.

### 5. Observability
- [ ] One structured log line per request (method, path, status, latency).
- [ ] Health endpoint that fails when a critical dependency (DB) is unreachable.

### 6. Deferred-by-design
- [ ] Items in the feature doc's "Non-Goals" / "Known production gaps" still appear there — no silent regressions.
- [ ] New deferrals introduced this feature are linked to a tracking issue or follow-up doc.

### 7. Documentation (the doc-map)

Implementation lands → docs drift. The natural moment to catch drift is now, not "next sprint". One question per doc type: *did this work change X? Then update Y.* Files don't need to pre-exist — create `docs/adr/`, `CONTEXT.md`, design notes lazily when the first relevant change appears.

- [ ] **New decision with viable alternatives** → ADR exists in `docs/adr/`, names what it supersedes (if anything), and is referenced from code where the decision is load-bearing.
- [ ] **New or changed domain term** → `CONTEXT.md` entry created or updated. Includes `_Avoid_:` aliases if the term is at risk of being confused with an existing one.
- [ ] **New/removed package, changed public interface, or shifted module boundary** → the feature's design note (e.g., `docs/features/<feature>.design.md`) updated. Specifically: Module map, File layout, public-interface signatures, Test boundaries.
- [ ] **Changed acceptance criteria** → the feature doc reflects what was actually built. Silently-dropped or silently-added behavior is the most common drift class — fix here, don't kick to a follow-up.
- [ ] **User-visible change** → `CHANGELOG.md` has an entry under `[Unreleased]`, grouped by `Added / Changed / Fixed / Removed`. Skip only if the diff is formatter-only, lint-only, test-only, internal refactor with no behavior change, or a dependency bump with no runtime impact — same skip list as `feature-doc`.

If a doc type isn't relevant to this work, write "n/a" — explicit beats implicit.

## When to skip

- Pure docs / comment / test-only changes.
- Dependency bumps that don't change runtime behavior.
- One-line business-logic bug fixes that don't touch infra, auth, or error paths.

## Pairing with other skills

- **[`tdd`](../tdd/SKILL.md)** — runs *before*. `prod-ready` runs after all ACs are green.
- **[`simplify`](../simplify/SKILL.md)** — runs *between*. Sweep before the prod-ready gate.
- **[`security-review`](../security-review/SKILL.md)** — runs *alongside* when the change is surface-changing. Section 3 here is the always-on minimum; `security-review` is the heavier threat-model pass.
- **[`pr-review`](../pr-review/SKILL.md)** — the *reviewer's* mirror of this skill. The reviewer verifies your `prod-ready` pass actually landed (timeouts, migrations, structured logs, doc-map). A `prod-ready` checked off but not reflected in the diff is a blocker for them.
- **[`verify-real-deps`](../verify-real-deps/SKILL.md)** — runs *after* this for releases that touch third-party APIs. Tag only after that's clean.

## Done when

- Every section walked; each item is `✓`, `✗ + remediation`, or `n/a + reason`.
- Section 7 (doc-map) checks have been honestly answered — silent doc-drift is the most common regression class.
- The `Non-Goals` / `Known production gaps` items in the feature doc are unchanged (no silent regressions).

## Handoff

This is the follow-on to `tdd`. When tdd is green, run this; when this passes, open the PR.
