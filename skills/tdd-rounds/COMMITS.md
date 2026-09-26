# Commit cadence and message style

The Builder's commits are the parent's review surface. A round that ships as one big commit forces the parent to read everything at once; a round that ships as a clean per-slice sequence is reviewable one diff at a time. The shape below was load-bearing across 14 rounds in the project this skill was distilled from.

## The rules

### 1. Every code commit gets an `R<N>:` prefix

`git log --oneline` then reads as round history. A reviewer or future contributor scanning the log can see "this is round 5; this is the simplify pass at end of round 6.7; this is the final round before tag" without opening any commit.

### 2. Bug-fix commits also reference the issue ledger

Format: `R<N>: #<X> <title>`. Each bug-fix commit ties one-to-one to an entry in `docs/known-issues.md`. The ledger entry doubles as the brief; the commit closes it.

```
R12: #3 strip models/ prefix from parsed model id
R14: #8 forwarder rewrites body's project field to chosen pool account
```

### 3. One commit per AC slice when slices are independent

Round delivers 5 ACs with no dependency between them → 5 commits + 1 simplify-pass commit + 1 doc tick commit. Each commit is a clean unit a parent reviews in isolation.

```
R12: #1 add g1-pro-tier to routing tier order
R12: #2 seed quota cache on accounts add
R12: #3 strip models/ prefix from parsed model id
R12: #4 add POST /v1/accounts/{handle}/refresh-quota endpoint
R12: #5 dual-mode audit parser dispatches on Content-Type
R12: simplify — factor applyFrame, extractModel; close known-issues
```

A single mono-commit "R12: smoke-test fixes" of the same content forces the parent to mentally separate five unrelated changes from one diff. Avoid.

### 4. Simplify pass is its own commit

End-of-round refactoring (extracting helpers, removing dead branches, tightening names) is mechanically separate from the AC work that motivated it. Bundling them hides the "what changed because the AC required it" from "what changed because we cleaned up after." Reviewers care about the distinction; a separate commit preserves it.

### 5. Doc-only commits stay separate from code

`docs/STATE.md`, `docs/known-issues.md`, ADR patches — never bundle into a code commit. Mixing makes both diffs harder to read. Doc-only commits get a `docs:` prefix (no `R<N>:`):

```
docs: append actual R14 entry to STATE.md
docs: add public README
```

### 6. Single-commit rounds are OK when justified

A refactor round (no AC slices) or a single-issue fix can land in one commit if splitting would create non-buildable intermediate states. The Builder's report MUST justify the lump in `Deviations`:

> Single commit instead of multiple `R13:` slices. The change is small (one interface method + one Service-level helper + four targeted tests) and the slices are tightly coupled (interface change forces Stub method to land in the same commit); splitting would create a non-buildable intermediate state.

If you can't justify it, don't lump it.

### 7. Commit messages are honest

The commit message states what the commit actually does, not what you wished it did. The lesson from this skill's source project: an R14 commit message claimed "STATE.md updated" but the Builder had forgotten that file — a follow-up commit was needed to restore truth. **Cost of an honest message: one extra line of typing. Cost of a lying message: a follow-up commit, a smudged history, and a lost minute the next time someone wonders why the round entry is missing.**

If a step you described in the brief didn't actually land, say so in `Deviations`. If a commit's diff doesn't match its message, fix the message before committing — or split into two commits if the message's intent really was two things.

## Message body shape

The first line is the subject (~50–72 chars). The body explains:

- **What** the commit does (one or two sentences).
- **Why** the change was needed (the AC, the bug, the constraint).
- **Tradeoff being accepted** if the change picked one path over another.
- **`Refs:`** trailer linking the feature doc, ADR, or known-issues entry the change serves.

This body is where the change's story lives. Round and AC ids (`R6`, `AC-3`) go in the commit, **never in code comments** — see [`STYLE-comments.md`](../formats/STYLE-comments.md) §5.

Keep it short. Three short paragraphs > one long one. Bullets are fine.

Real example from R8:

```
R8: AC-CLI1/3/4/5 + AC-OP1/3 — cobra CLI + start subcommand

Wraps the admin API with a cobra-driven command tree:
- accounts {list, add, remove, cooldown, rename}
- stats / usage with --since, --until, --group_by, --json
- start subcommand wires app.NewDaemon + admin.NewServer under
  shared ctx with SIGINT/SIGTERM cancel.

Read commands precheck /v1/healthz; daemon-down surfaces the
documented "Run gemini-proxy start first" remediation instead of a
raw connection-refused stack.

--group_by uses snake_case to match the AC text. table-by-default,
--json for machine-readable; same data both formats.
```

Counter-example that fails the rules:

```
R8: stuff
```

(no scope, no why, no shape).

## Footer

Co-authored-by line for agent contributions:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Use whatever model line matches the actual driver. Match exactly the convention the project's CLAUDE.md (or root agent doc) prescribes — don't invent variations.

## Anti-patterns

- **Mono-commit at end of round.** "R<N>: round done." Defeats the per-slice review story.
- **Bundling docs with code.** STATE.md updates ride along with the code change. Diffs become harder to read.
- **Imperative-mood squashing.** Four sequential "wip" commits eventually amended into one. The journey isn't the commit; the destination is. Don't force-amend; commit cleanly the first time.
- **Empty bodies on non-trivial commits.** "fix bug" with no body. The body is where the *why* lives.
- **Lying about scope.** A commit message saying "also updates X" when the diff has no X. Worse than no message.
- **Skipping the prefix.** A round commit without `R<N>:` is a hidden commit — the log loses its round structure.

## When to skip these rules

- **Pre-round scaffolding** (initial repo setup, before round 1) — no `R<N>:` prefix yet, no AC contract. Plain conventional commits work.
- **Hot-fix to a tagged release** (post-v1, urgent) — the `R<N>:` cadence is for active development; emergency fixes can use `fix:` or `hotfix:` prefixes per the project's release-engineering norms. Document in the project's CLAUDE.md.
- **Squash merges to main** — if the project's branching model squashes feature branches, the per-slice commits live on the feature branch only. The squashed commit message should still preserve the per-slice summary in its body.
