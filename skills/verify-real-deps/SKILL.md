---
name: verify-real-deps
description: Pre-tag smoke test against real third-party APIs. Use after `prod-ready` is clean, before tagging vN.0 — the gate that catches wire-shape mismatches that fakes accept but real upstreams reject. Triggered when the user mentions "smoke test", "real API", "live verify", "before tag", or "end-to-end against actual <vendor>". Pairs with `prod-ready` (which catches ops/infra issues tests miss) and `tdd-rounds` (the orchestration that feeds into this gate).
---

# Verify Against Real Dependencies

Tests verify the contract you wrote into the fake server. The fake accepts what you told it to accept. **Real third-party APIs enforce the contract Google / Stripe / OpenAI / etc. actually ship — and that contract drifts from any reverse-engineered model.**

This skill is the explicit step between "all tests green" and "tag the release". It catches the class of bug where the fake said yes but production says no.

## Why this skill exists

A fake server is a *hypothesis* about the contract; the real upstream **is** the contract. Until you run code against the real upstream at least once, every test that uses the fake is testing your hypothesis. **`verify-real-deps` is the discipline that finds wire-shape bugs before users do.**

See [MOTIVATION.md](./MOTIVATION.md) for a worked example showing eight such bugs surfaced after a v1.0 shipped 100% green.

## When to use

- After `tdd-rounds` is complete (every AC ticked).
- After `prod-ready` checklist is filled and clean.
- Before `git tag vN.0` and before any public announcement.
- Any time you wonder "have we actually run this against the real upstream?" — the answer should never be "no" for a v1.0.

## When to skip

- The system has no third-party API integration. Pure-internal services with database-only state — `prod-ready` is enough.
- The "real API" is your own service in a staging environment that you fully control. No reverse-engineered contract to verify.
- A fix-round that doesn't touch the upstream-talking code path.

## Workflow

### 1. Set up a real-credential test environment

Use real credentials in a sandbox-equivalent context (a dev project, a low-quota account, a test API key). Document what you used so a future contributor can repeat the verification.

```
Real credentials used: <handle / sandbox project / dev API key>
Source-of-truth API host: <e.g., cloudcode-pa.googleapis.com>
Expected limits: <so unexpected throttling stands out>
```

### 2. Run a representative end-to-end flow

Pick the smallest set of operations that exercise every wire-level interaction. For an API proxy, that means at least:

- Authenticate / load tier metadata.
- Read state (quota, account info).
- Write state if any (credential rotation, OAuth refresh).
- The hot-path operation (the one users will hit most).
- An error path that exercises your error-handling (a forced 429, a malformed input, a permission failure).

Capture the **raw upstream response** for each — headers and body. Don't paraphrase. The body shapes are the contract.

### 3. Capture every surfaced surprise

Anything that worked-in-tests but doesn't-work-now is a bug. For each, write an entry in `docs/known-issues.md` (create the file lazily on first use — copy the format from [`templates/known-issues.md`](templates/known-issues.md)). The fields:

- **Severity** (high / medium / low — based on user impact, not difficulty).
- **Status** (Open / Closed in R<N> with commit hash).
- **Reproduction** (numbered steps a stranger could follow).
- **Root cause** (one paragraph explaining why the test passed but real didn't).
- **Files** (which packages own the fix).
- **Fix sketch** (one paragraph; specific enough to scope a Builder brief).

The bug ledger doubles as the **canonical brief** for the fix-rounds — each entry is the Round N+M brief once the parent dispatches a fix-Builder.

### 4. Iterate fix-rounds

For each issue, dispatch a fix-Builder per `tdd-rounds`. Brief them with the issue's entry in the ledger. They:

1. Read the issue.
2. Reproduce.
3. Write a failing test (often unit-test the parser / handler that mishandled the real shape).
4. Fix.
5. Update the upstreamtest fake / mock to match the real shape — this prevents regression in the test layer.
6. Mark the issue **Closed** in `known-issues.md` with the commit hash and test names.

After each fix-round, **re-run the same end-to-end flow** to confirm the fix works AND no other regression appeared. Issues compound — a wire-shape fix sometimes reveals a cooldown / retry / cache bug behind it.

### 5. Defer or close

Either the bug is fixed, or it's explicitly deferred to vN.1 with a recorded reason. No silent deferrals. If a bug is "intermittent / can't reproduce / probably the vendor", document it that way — the next contributor benefits from knowing the failure mode existed.

### 6. Update the bug-prevention layer

Every bug found here is also a test that should have existed. After fixing, ask: **"What test would have caught this if it had existed?"** Then add it. The fake harness should accept the **same shapes the real API does** — if the fake was too permissive, tighten it.

### 7. Tag

Only tag when the bug ledger has zero `Open` entries (or all `Open` entries are explicitly deferred-by-design with a tracking line in the feature doc's Non-Goals). Then:

```bash
git tag vN.0
git push --tags
```

## Rules

- **Use real credentials, not mocked ones.** The whole point is to find what the mock didn't.
- **Don't fix issues silently.** Every bug gets a ledger entry, even one-liners. The discipline IS the value.
- **Fix the fake too.** When you patch a wire-shape, the fake must also reject the wrong shape — otherwise the tests will accept regression.
- **Don't extend scope.** This is a verification phase, not a feature phase. If you find a "while I'm here, let me also..." impulse, write it as a `vN.1` note and resist.
- **Don't skip the ledger entry for "small" bugs.** A one-line fix still gets a ledger entry. The ledger is the post-mortem record.

## Templates

- [`templates/known-issues.md`](templates/known-issues.md) — the bug-ledger format.

## Handoff

When the bug ledger is clean and the same end-to-end flow runs without surprise:

- Append a verification entry to `docs/STATE.md`: `## End-to-end smoke test (DONE YYYY-MM-DD)` with what was run and what was found.
- Tag the release.
- The bug ledger stays in `docs/known-issues.md` as a permanent post-mortem record. Future contributors read it to understand "what surprises lurk in this codebase that the test suite doesn't show."
