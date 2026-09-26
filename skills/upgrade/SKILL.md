---
name: upgrade
description: Moves a dependency, language toolchain, or runtime across a major version in small verified steps — read the breaking changes first, change one thing per commit, keep tests green between steps. Use when bumping a major version (Go toolchain, Node, a framework, an SDK), replacing a deprecated library, or when many dependencies have fallen far behind. Triggered by "upgrade to", "major version upgrade", "outdated dependencies", "dependency upgrade". Not for patch or minor bumps with no breaking changes — bump and run the tests; not for choosing a replacement library → `investigate`; not for adding a brand-new dependency → `security-review`.
---

# Upgrade

An upgrade is a change you didn't write, landing in code you did. This skill makes it small enough that when something breaks, you know which change broke it.

## Why this skill exists

The default agent move is `go get -u ./...` or `npm update`, then fix whatever fails:

```
 bump 14 packages at once ──► 23 test failures
                               which package broke which test?  ✗ unknown
                               "fix" by editing tests           ✗ hides real breakage
```

Reading the breaking changes first, and moving one thing at a time, turns that into a list of small, explainable diffs.

## When to use

- A major version bump: Go toolchain, Node, React, a web framework, a database driver, a vendor SDK.
- A library is deprecated or unmaintained and must be replaced by its successor.
- Many dependencies have fallen far behind, or a security advisory forces a major bump.

## When to skip

- Patch and minor bumps with green tests (Dependabot / Renovate PRs) — skim the changelog for security notes and merge. No skill needed.
- Choosing *which* library to move to → [`investigate`](../investigate/SKILL.md).
- Adding a brand-new dependency → [`security-review`](../security-review/SKILL.md) §0 (dependency audit).

## Process

### 1. Take inventory

| | Go | JS |
| --- | --- | --- |
| What's behind | `go list -m -u all` | `npm outdated` |
| Runtime in use | `go.mod` `go` / `toolchain` lines | `.nvmrc`, `engines` in `package.json`, CI config |
| Known vulnerabilities | `govulncheck ./...` | `npm audit` |

Write a short table: package, current, target, how many majors, why upgrade now. If it's more than a handful of majors, put the table in the PR description — or in `docs/research/upgrade-<name>.md` for a big one.

### 2. Read before you change anything

For every major version between current and target, read the release notes or migration guide. Then search this codebase for each breaking change:

```
 guide says: "pgxpool.Connect is now pgxpool.New"  ──►  grep -rn "pgxpool.Connect" .
 guide says: "defaultProps removed from function components" ──► grep -rn "defaultProps" src/
```

The output is a checklist of the breaking changes that **actually hit this code**. Changes that don't hit it are noted as "not used here".

### 3. Order the steps

```
 runtime first  ──►  libraries that need it  ──►  the rest, one at a time
 (Go 1.22 → 1.24)    (pgx v4 → v5)                (each its own commit)
```

- **One package, or one package group, per commit.** A group moves together only when it must — `react` + `react-dom` + `@types/react`.
- **One major at a time** when the guide says skipping is unsafe (v3 → v4 → v5).
- **Runtime before libraries** when the new library versions require the new runtime.

### 4. Apply

- **Use the official codemod** when one exists (`npx @next/codemod`, `npx react-codemod`, `go fix ./...`). Review its diff like any other diff.
- **Go major versions change the import path.** `github.com/jackc/pgx/v4` → `github.com/jackc/pgx/v5`. Update every import, then `go mod tidy`:

  ```
  go get github.com/jackc/pgx/v5@latest
  grep -rl 'jackc/pgx/v4' --include='*.go' . | xargs sed -i 's#jackc/pgx/v4#jackc/pgx/v5#g'
  go mod tidy
  ```

- **Fix new deprecation warnings** now, while the reason is fresh.
- **A temporary pin or `replace`** directive gets a `// WORKAROUND:` with the upstream issue and a removal condition — per [`STYLE-comments.md`](../formats/STYLE-comments.md).

### 5. Verify each step

Every step, before its commit:

| Check | Go | JS |
| --- | --- | --- |
| Builds / types | `go build ./...` | `tsc --noEmit` (TS) or the build |
| Tests | `go test ./...` | `npm test` |
| Lint | `go vet ./...`, `staticcheck ./...` | the project's lint |
| Vulnerabilities | `govulncheck ./...` | `npm audit` |

**Don't edit a test to make it pass** unless the changelog documents the behavior change and the new behavior is what you want. Say so in the commit body.

### 6. Commit each step

One commit per step, per [`COMMIT-FORMAT.md`](../formats/COMMIT-FORMAT.md). The body lists the breaking changes handled and links the guide:

```
build(deps): upgrade pgx v4 to v5

- pgxpool.Connect renamed to pgxpool.New (2 call sites)
- pgtype moved into github.com/jackc/pgx/v5/pgtype (5 imports)
- Not used here: CopyFrom API changes

Refs: https://github.com/jackc/pgx/blob/master/CHANGELOG.md
```

## Anti-patterns

- **Upgrade everything in one commit.** A failure can't be traced to its cause.
- **Skipping the release notes.** Breaking changes that compile fine — changed defaults, changed timeouts — only show up in production.
- **Editing tests until green.** The test was telling you the behavior changed.
- **Forgetting the runtime.** New library, old Node / Go in CI or production.
- **Permanent temporary pins.** A `replace` or version pin with no `WORKAROUND:` and no removal condition stays forever.

## Pairing with other skills

- **[`investigate`](../investigate/SKILL.md)** — runs before when the question is *whether* to upgrade, or which successor library to pick.
- **[`security-review`](../security-review/SKILL.md)** — escalate when the upgrade adds new transitive dependencies that handle untrusted input.
- **[`verify-real-deps`](../verify-real-deps/SKILL.md)** — runs after when the upgraded package is a vendor SDK; fakes won't catch wire changes.
- **[`migrate`](../migrate/SKILL.md)** — when a database engine or ORM upgrade also changes the schema.
- **[`release`](../release/SKILL.md)** — if the upgrade changes your own public API (types from the dependency leak through), your next release is a major.

## Done when

- The breaking-change checklist is complete: each item handled or marked "not used here".
- Each step is its own commit, and build, tests, lint, and vulnerability check passed at every step.
- The runtime version matches everywhere it's declared (`go.mod`, `.nvmrc`, `engines`, CI, Dockerfile).
- The lockfile (`go.sum`, `package-lock.json`) is committed.
- Every temporary pin carries a `WORKAROUND:` with a removal condition.
