# ROUND N — <title>

You are a Builder sub-agent in a multi-round TDD project. Read the orchestration plan and `docs/STATE.md` first. **Execute design + tdd + simplify in THIS invocation. Do not stop after design.**

## Scope

<one paragraph in plain English: what behavior ships this round, what it does NOT cover>

## ACs in scope (verbatim from feature doc)

- **AC-XX1** Given ..., when ..., then ....
- **AC-XX2** ...

## ACs explicitly out of scope this round

- AC-YYY (defer to Round M).
- All other ACs.

## ADR refs (load-bearing constraints, restated in 1 line each)

- **ADR-NNN** (`docs/adr/NNN-*.md`): <one-line summary of the constraint this round must respect>.
- **ADR-NNN** (...): ...

## Files you may create

- `<path>/*.go` and `*_test.go`
- ...

## Files you may modify

- `<path>` (specific reason)
- ...

## Files you must NOT touch

- closed packages: `<list>`
- `cli/`, `creds/`, `.claude/`, `docs/STATE.md` (parent owns)
- ...

## Skills (in order — execute ALL in this invocation)

1. **`design`** — REQUIRED if introducing a new package or non-trivial interface. Decisions to make: <list>.
2. **`tdd`** — REQUIRED. Vertical slicing per AC; commit prefix `R<N>:`. Read [`tdd-rounds/COMMITS.md`](../COMMITS.md) before the first commit — it captures the per-AC slicing rule, the simplify-pass-gets-its-own-commit rule, the doc-commits-stay-separate rule, when single-commit is justified, and the message-body shape.
3. **[`simplify`](../../simplify/SKILL.md)** — REQUIRED end-of-round. Walk every changed file with four lenses: reuse, quality, efficiency, test relevance. Land as its own commit (`R<N>: simplify — <summary>`).

## Pre-flight reading (in order)

1. `docs/STATE.md` — what previous rounds delivered.
2. `docs/features/<feature>/feature.md` — the AC contract.
3. The ADRs cited above.
4. <specific files the Builder needs to read before starting>

## Concrete deliverables

<per-AC or per-component, what the Builder must produce — function signatures, schema, etc.>

## Success criteria

- `make test` (or equivalent) exits 0. **All previously-ticked ACs remain green.**
- `make lint` clean.
- New tests cover: <specific behaviors>.
- Per-AC commits prefixed `R<N>:`.
- AC-XX1, AC-XX2, ... ticked in `docs/features/<feature>/feature.md` with the test names.

## Output (REQUIRED — paste verbatim shape from `templates/builder-report.md`)

## Reminders

- **Use the project's dev-environment commands** (e.g., Docker via `make`). Do not pollute the host.
- **No `time.Sleep` in tests.**
- **Don't `git push`.**
- **Don't break existing tests.**
- **Comments follow [`STYLE-comments.md`](../../formats/STYLE-comments.md).** No round/AC ids or edit narration in code; the why goes in the commit body. `check-comments.mjs` must show no problems before the simplify commit.
- **Don't silently descope an AC.** If blocked, surface as a blocking open question and stop.
