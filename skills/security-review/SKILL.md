---
name: security-review
description: Threat-model + control-review pass for surface-changing work — runs alongside `tdd` and as a heavier gate than `prod-ready` Section 3 when the change introduces or alters trust boundaries, authentication, authorization, sensitive data flows, or external surfaces. Use when the user mentions "security review", "threat model", "STRIDE", "auth flow", "permissions", "secrets", "PII", "public API", "external surface", "abuse", "hardening", or whenever a feature doc / PR adds a new entry point, identity flow, or sensitive-data path. Skip for pure-internal refactors with no surface change, dependency bumps that don't change runtime behavior, or doc-only changes. Pairs with `feature-doc` (informs the threat model) and `prod-ready` (which has the lighter operational-security checklist for every change).
---

# Security Review

A focused pass that maps the change's **trust boundaries**, enumerates **plausible threats**, and verifies the **controls** that prevent them. Heavier than `prod-ready` Section 3 (which is the always-on operational-security checklist); reserved for changes that actually move the security surface.

## Why this skill exists

Most security bugs don't come from missing crypto — they come from **missed trust boundaries**: a "trusted" input that a stranger can shape, an internal RPC reachable from outside, an admin endpoint without an authz check, a token logged at INFO. `prod-ready`'s 4-bullet defense-in-depth section catches generic mistakes; it does not catch "this new feature's data flow has a hole."

This skill exists to make the threat-modeling step explicit when the surface changes — instead of hoping someone notices in PR review.

## When to use

A change is **surface-changing** (and this skill should fire) when *any* of these hold:

- New external entry point (HTTP route, gRPC method, queue consumer, file/upload handler, public CLI flag).
- New or changed **identity / session / token** flow (sign-in, OAuth, API key issuance, password reset, MFA).
- New or changed **authorization** logic (role, permission, ownership check, multi-tenancy scope).
- New or changed flow handling **sensitive data** (PII, payment, auth credentials, health, location, anything covered by a regulation or policy).
- New **external dependency** that receives user-influenced data or that the system trusts (third-party callback, webhook, OAuth provider, queue origin).
- A change to **how secrets are loaded, stored, or rotated**.
- The user explicitly asks for a security review.

## When to skip

- Pure-internal refactor with no surface change (`improve-codebase-architecture` style).
- Doc / comment / test-only changes.
- Dependency bumps that don't change runtime behavior (still: check the changelog for security advisories).
- Bug fix on an existing path that doesn't change the trust boundaries (`prod-ready` Section 3 is enough).

## Phases

### 0. Dependency Audit

Before reviewing application logic, audit the supply chain. New or changed external dependencies are high-risk entry points.

- **Scan Transitive Deps**: Run the ecosystem's audit tool (e.g., `npm audit`, `cargo audit`, `govulncheck`).
- **License Compliance**: Ensure the license of any new dependency aligns with project policy.
- **Vulnerability Check**: Check for known CVEs in the specific version being added.

### 1. Map the surface

Before reviewing controls, draw what's actually exposed. Most security holes hide in surfaces nobody listed.

- **Entry points**: every external caller of the changed code path. HTTP routes, queue consumers, scheduled jobs, public CLI flags, library exports if this is a published package.
- **Trust zones**: who is on the other side of each entry point? Anonymous internet, authenticated user (which role?), internal service, ops operator, the system itself.
- **Data flows**: for each entry point, trace the data — what's stored, what's logged, what's forwarded to a third party, what's reflected back to the caller.
- **Trust boundaries**: where data crosses from a less-trusted zone to a more-trusted one. Every boundary is a place input must be validated, sanitised, or authorised.

Output is a short artifact (3–10 lines is fine for most changes) — usually appended to the feature doc as a `## Security surface` section, or, for high-stakes changes, a dedicated `docs/security/<feature>.md`.

### 2. Enumerate threats

Walk the surface and ask **what could go wrong on purpose**. The lightweight prompt is **STRIDE** (one or two threats per category is plenty for most reviews):

| Category | Question |
|---|---|
| **S**poofing | Can someone pretend to be another user / service / origin? |
| **T**ampering | Can data be modified in transit, at rest, or via a confused-deputy path? |
| **R**epudiation | Can an actor deny having done something we need to attribute? (audit log holes) |
| **I**nformation disclosure | Can data leak to a caller who shouldn't see it? Through responses, logs, error messages, timing? |
| **D**enial of service | Can a single caller exhaust shared resources (CPU, memory, DB connections, third-party quota)? |
| **E**levation of privilege | Can a caller cause the system to act with higher privilege than they have? |

For small reviews, use a shorter prompt: **"Who could abuse this, and how?"** and **"What does the answer cost us?"**

Output: a short list. Each threat is one line, plus its **likelihood** (plausible / requires-insider / theoretical) and **impact** (account-level / tenant-level / system-level).

### 3. Verify controls

For each plausible threat, name the **control** that prevents it (or detects it, or limits its blast radius). Controls fall in five buckets:

1. **Authentication** — who is calling. The session / token / mTLS.
2. **Authorization** — what they're allowed to do. The check, performed at the trust boundary, on every request — not just at login.
3. **Input handling** — validation (shape) AND normalization (canonical form) at the boundary. Reject what you don't understand; don't silently coerce.
4. **Output handling** — encoding for the destination context (HTML, SQL, shell, log line, error response). Never reflect untrusted input into a privileged context.
5. **Secrets & data at rest** — secrets from env / vault, never from flags or repo. Tokens hashed at rest. PII minimised in logs and error bodies.

For each control, **verify**: read the code that enforces it, or the test that pins it, or the config that activates it. "I assume framework X handles this" is not verification — confirm.

### 4. Defense in depth — at least two layers for high-impact threats

For threats with system-level or tenant-level impact, name **two independent controls** when feasible. A single control's failure mode shouldn't be a system-wide compromise.

- Authn at the gateway *and* re-checked at the service.
- Per-tenant scoping in the query *and* a row-level check after the query returns.
- Rate limit at the edge *and* a quota in the data layer.

Don't manufacture layers for low-impact threats — defense in depth is for things that hurt when they fail.

### 5. Document deferred risks

Anything not closed is captured. Two acceptable outcomes:

- **Closed**: control exists and is verified. Note the file:line of the check or the test.
- **Deferred**: risk is acknowledged, accepted, and tracked. Goes into the feature doc's `Non-Goals` (with the security framing) or into a follow-up tracking issue. Silent deferral is the failure mode.

## Output

Most reviews produce a **`## Security review` section appended to the feature doc**:

```md
## Security review

**Surface**: <one-line description — entry points + trust zones touched>

**Threats considered**:
- <one-liner> — likelihood / impact — control: <where it lives, file:line>
- ...

**Deferred**:
- <risk> — accepted because <reason>; tracked at <link or follow-up>
```

For high-stakes changes (new auth flow, new external surface, regulated data), promote to `docs/security/<feature>.md` with a fuller threat-model section. Same shape, just longer.

## Anti-patterns

- **Crypto cargo-cult.** "We added AES-256" doesn't address authz, validation, or trust boundaries. Crypto is one bucket of five; most bugs are elsewhere.
- **Reviewing the diff, not the surface.** A diff might not touch the authz check that's now load-bearing for the new entry point. Walk the surface, then map back to the diff.
- **STRIDE-by-rote.** Filling in all six categories with strawmen wastes everyone's time. Better one real threat per relevant category than six theoretical ones.
- **"Framework handles it."** Maybe. Verify the framework is actually invoked on this code path with the configuration you assume. Defaults change between versions.
- **Conflating security with prod-ready.** `prod-ready` Section 3 is operational security defaults (timeouts, hashing, secrets-from-env). `security-review` is the threat-model pass for surface-changing work. Run both when the surface changes.

## Pairing with other skills

- **`feature-doc`** captures the change being reviewed. The Security review section attaches there.
- **`prod-ready`** Section 3 (auth/security defense-in-depth) is the always-on operational checklist. Run both — they don't substitute.
- **`grill-plan`** can interleave for high-stakes auth / authz topology. If a load-bearing decision needs an ADR, route through `grill-plan`.
- **`debug`** for security incidents post-deploy. The reproduction discipline applies; the root cause framing applies double.
- **`pr-review`** flags a security-review as required when a PR's diff touches a surface-changing path.

## Done when

- The security surface (entry points + trust zones + data flows) is named, not assumed.
- Each plausible threat has a verified control or an explicit deferral with rationale.
- High-impact threats have two independent layers of control where feasible.
- The artifact (feature-doc section or `docs/security/<feature>.md`) is in the repo.
- The PR description references the review so the reviewer can audit it.
