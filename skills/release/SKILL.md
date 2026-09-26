---
name: release
description: Cuts a versioned release — picks the semver bump from what changed, turns the CHANGELOG's `[Unreleased]` section and the commit bodies into release notes, tags, and publishes. Use when merged changes are ready to ship as a version of a library, CLI, npm package, Go module, or tagged service. Triggered by "cut a release", "prepare the release", "bump the version", "write release notes". Not for merging a branch → `prod-ready`; not for live checks against vendor APIs before the tag → `verify-real-deps`, which runs first; not for upgrading a dependency → `upgrade`.
---

# Release

A published version can't be taken back. This skill makes sure the number is right, the notes are true, and the artifact installs — before anyone depends on it.

## Why this skill exists

Agents guess the version, dump commit subjects as notes, and tag before checking anything:

```
 "feat: add X" + a hidden breaking change ──► tagged v1.4.0     ✗ should be 2.0.0
 notes = 30 commit subjects               ──► users can't tell what to change
 tag pushed, npm publish, then CI fails   ──► broken version, forever cached
```

## When to use

- Merged changes are ready to ship as a version: a library, CLI, npm package, Go module, or a service deployed by tag.
- The end of `tdd-rounds` or a large feature ("tag and publish").

## When to skip

- Continuous deployment from `main` with no version numbers — `prod-ready` is the gate.
- Checking vendor APIs live before the tag → [`verify-real-deps`](../verify-real-deps/SKILL.md) first, then come back.

## Process

```
 1 pre-flight ─► 2 collect ─► 3 pick version ─► 4 write ─► 5 commit + tag ─► 6 publish ─► 7 verify
                                                                            (ask first)
```

### 1. Pre-flight

- On `main` (or the project's release branch), clean, and up to date with the remote.
- CI is green on the exact commit you'll tag.
- Changes in this release passed `prod-ready`; if they touch third-party APIs, `verify-real-deps` is clean.

### 2. Collect what changed

```
git describe --tags --abbrev=0                                  # last tag
git log <last-tag>..HEAD --format='%h %s%n%b%n---'              # every commit, with bodies
```

The CHANGELOG's `[Unreleased]` section (kept by `prod-ready`) is the primary source. Cross-check it against the log:

- Every `feat` and `fix` commit appears under `[Unreleased]`. Add what's missing.
- Every `BREAKING CHANGE:` footer or `!` subject appears — with what callers must change.
- Round commits (`R12: …`) are read by their body, per [`COMMIT-FORMAT.md`](../formats/COMMIT-FORMAT.md).

### 3. Pick the version

| The release contains | Bump |
| --- | --- |
| Any `BREAKING CHANGE:`, `!`, or a removal / change that breaks callers | **major** |
| New behavior (`feat`, *Added*) and nothing breaking | **minor** |
| Only fixes, performance, docs | **patch** |

- **Before 1.0.0**, a breaking change bumps the minor (`0.4.2 → 0.5.0`); say so in the notes.
- **Go modules, v2 and up:** the major version is part of the module path. A `v2.0.0` tag needs `module example.com/lib/v2` in `go.mod` and updated imports — a code change, not just a tag.
- **When in doubt between minor and major, it's major.** A surprise break costs users more than a big number does.

### 4. Write

- **CHANGELOG:** rename `[Unreleased]` to `[X.Y.Z] — YYYY-MM-DD`; open a new empty `[Unreleased]` above it.
- **Version files:** `package.json` (`npm version X.Y.Z --no-git-tag-version`), a `version.go` constant, or wherever the project keeps it.
- **Release notes** — for users, not maintainers, per [`WRITING-STYLE.md`](../formats/WRITING-STYLE.md):

  ```md
  ## v2.0.0

  **Breaking:** `Charge` now takes a `context.Context` first.
  Update calls: `Charge(o, c)` → `Charge(ctx, o, c)`.

  **Added:** idempotent charges — a retried charge is billed once.
  **Fixed:** double charge when the bank timed out.
  ```

  Breaking changes first, each with the exact change callers make.

### 5. Commit and tag

```
git commit -am "chore(release): X.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
```

- Go tags are `vX.Y.Z`; a module in a subdirectory is tagged `<dir>/vX.Y.Z`.
- If the project releases through a release branch and PR (`release/X.Y.Z`), do steps 4–5 there and tag the merge commit.

### 6. Publish — ask first

Pushing a tag and publishing are outward-facing and can't be undone. Confirm with the user, then:

```
git push origin main vX.Y.Z
gh release create vX.Y.Z --title vX.Y.Z --notes-file notes.md
npm publish                                  # npm packages
GOPROXY=proxy.golang.org go list -m example.com/lib@vX.Y.Z   # Go: make the proxy fetch it
```

### 7. Verify the published artifact

Install it the way a user would, in a scratch directory:

```
go get example.com/lib@vX.Y.Z && go build ./...
npx your-cli@X.Y.Z --version
```

**If something is wrong, fix forward** with a patch release. Never move or delete a published tag — the Go proxy and npm caches keep the old one. For a Go version that must not be used, add a `retract` line to `go.mod` in the next release.

## Anti-patterns

- **Version by feel.** The table in step 3 decides, not the size of the diff.
- **Tagging before CI is green** on the tagged commit.
- **Notes as a commit dump.** Users need what changed for them and what to do, not 30 subjects.
- **A breaking change in a minor.** Every caller's build breaks on a routine update.
- **Moving a tag.** Anyone who already fetched it now has a different "same" version.
- **Forgetting the new `[Unreleased]`.** The next change has nowhere to go.

## Pairing with other skills

- **[`prod-ready`](../prod-ready/SKILL.md)** — runs before, per change; it keeps `[Unreleased]` current.
- **[`verify-real-deps`](../verify-real-deps/SKILL.md)** — runs before the tag when the release talks to third-party APIs.
- **[`tdd-rounds`](../tdd-rounds/SKILL.md)** — its handoff ends here.
- **[`upgrade`](../upgrade/SKILL.md)** — a dependency upgrade that leaks into your public API makes this release a major.
- **[`COMMIT-FORMAT.md`](../formats/COMMIT-FORMAT.md)** — commit bodies and `BREAKING CHANGE:` footers are this skill's input.

## Done when

- The version follows the table in step 3, and Go v2+ paths match the tag.
- CHANGELOG has the dated section and a fresh `[Unreleased]`.
- The tag points at the release commit, and CI was green on it.
- Release notes list breaking changes first, each with the change callers make.
- The published version installs and builds in a scratch directory.
