# Commit Format

The one format for commit messages and PR descriptions. Code comments hold what is true now; **commits hold how the code got here** ([`STYLE-comments.md`](STYLE-comments.md) §5). An agent reads them with `git log -L` and `git blame` when something looks wrong, and `release` turns them into release notes. A commit that says only "fix bug" breaks both.

```
<type>(<scope>): <what changed, imperative, ≤ 72 chars>   ← subject

<Why: the bug, constraint, or AC that forced it.         ← body
 What it does, if the subject can't say it.
 The trade-off accepted, if one path was picked.>

Refs: docs/features/<name>.md, docs/adr/NNNN-<slug>.md    ← footers
BREAKING CHANGE: <what callers must change>               (only when true)
Co-Authored-By: <agent line, when an agent helped>
```

## Subject

- **Type** — `feat` (new behavior), `fix` (bug), `refactor` (no behavior change), `perf`, `test`, `docs`, `build`, `ci`, `chore`. Add `!` after the type for a breaking change: `feat(api)!: …`.
- **Scope** — the module or package: `fix(payments): …`.
- **Summary** — what changed, imperative mood: "stop double charge on timeout", not "fixed" or "fixes".
- **In `tdd-rounds`**, the round prefix replaces the type: `R12: #3 strip models/ prefix`. See [`tdd-rounds/COMMITS.md`](../tdd-rounds/COMMITS.md) for round cadence.

## Body

- **Why first.** The reader can see *what* in the diff; they can't see why.
- **Short.** Two or three small paragraphs, or bullets. Plain words ([`WRITING-STYLE.md`](WRITING-STYLE.md)).
- **Skip the body** only when the subject already says everything (`docs: fix typo in README`).

## Footers

| Footer | When | Read by |
| --- | --- | --- |
| `Refs:` | The change serves a feature doc, ADR, research note, or known-issues entry | Agents following history into `docs/` |
| `BREAKING CHANGE:` | Callers must change code or config | `release` — forces a major bump |
| `Co-Authored-By:` | An agent helped | People reading the log. Use the exact line your project's `CLAUDE.md` / `AGENTS.md` gives |

## Squash merges and PR descriptions

If PRs are squash-merged, the PR description becomes the only commit left on `main`. Write it in the same shape: summary, why, `Refs:`, and `BREAKING CHANGE:` when true.

## Example

```
fix(payments): stop double charge on timeout

A timed-out charge had often succeeded, so the retry charged again.
Send an idempotency key; the bank returns the first result for a
repeated key.

Trade-off: Payments stores keys for 24h.

Refs: docs/adr/0007-idempotent-charges.md
```

**Fails the format:** `fix: stuff` — no scope, no why, nothing to follow.

## Done when

- [ ] Subject has a type, a scope, and an imperative summary under 72 characters.
- [ ] Body says why, unless the subject says everything.
- [ ] `Refs:` links the doc the change serves, when there is one.
- [ ] `BREAKING CHANGE:` is present exactly when callers must change.
