# Doc-Drift Audit

The single source for one question: *does this change leave the durable docs consistent with the code?* Implementation lands → docs drift. The natural moment to catch the drift is at the merge boundary, not "next sprint".

This is a **shared reference**, run from three places with the same checks but a different lens:

- [`prod-ready`](../prod-ready/SKILL.md) Section 7 — **author lens.** Walk the checks before opening the PR; fix drift inline now.
- [`pr-review`](../pr-review/SKILL.md) §3e — **reviewer lens.** Second line of defense; what the author missed, classified by severity.
- **Standalone** — the old `sync-check` role. Run mid-stream after a significant refactor, or when a name feels "off", to surface terminology and ADR drift before it calcifies. Produces a numbered findings list (see "Standalone report" below).

Files don't need to pre-exist — `docs/adr/`, `CONTEXT.md`, design notes are created lazily when the first relevant change appears. If a doc type isn't relevant to this work, write `n/a` — explicit beats implicit.

## The six checks

One question per doc type: *did this work change X? Then update Y.*

1. **New decision with viable alternatives** → an ADR exists in `docs/adr/`, names what it supersedes (if anything), and is referenced from code where the decision is load-bearing. See [`ADR-FORMAT.md`](ADR-FORMAT.md).
2. **New or changed domain term** → [`docs/CONTEXT.md`](../../docs/CONTEXT.md) entry created or updated, including `_Avoid_:` aliases if the term risks being confused with an existing one. A new term that collides with an existing `_Avoid_:` alias (e.g. "Account" where the glossary says "Customer") is the highest-signal finding here.
3. **New/removed package, changed public interface, or shifted module boundary** → the feature's design note (`docs/features/<feature>.design.md`) is updated: module map, file layout, public-interface signatures, test boundaries.
4. **Changed acceptance criteria** → the feature doc reflects what was actually built. Silently-dropped or silently-added behavior is the most common drift class — fix here, don't kick to a follow-up.
5. **User-visible change** → `CHANGELOG.md` has an entry under `[Unreleased]`, grouped by `Added / Changed / Fixed / Removed`. Skip only for formatter-only / lint-only / test-only / internal-refactor-with-no-behavior-change / dep-bump-with-no-runtime-impact diffs. (Overlaps but is **not identical** to `feature-doc`'s skip list, which also waives the *doc* for typo fixes and one-line config tweaks. A typo fix can still merit a one-liner here.)
6. **New or changed produced doc under `docs/`** → it opens with OKF frontmatter carrying a non-empty `type` from [`OKF.md`](OKF.md) §2. A produced doc with no `type` breaks bundle conformance.

## ADR consistency (read alongside check 1)

Beyond "does an ADR exist", check the change against the ones already recorded:

- **Direct contradiction** — does the change do something an active ADR explicitly forbids (e.g. uses an ORM where an ADR mandates hand-written SQL)? That's a blocker until the ADR is superseded.
- **Surprise deviation** — does the change introduce a pattern that *warrants* a new ADR (hard to reverse, surprising, a real trade-off) but doesn't have one?

## Severity

- **Blocker** — the missing/contradicted doc is load-bearing for the next reader: an ADR for a hard-to-reverse decision, a `CONTEXT.md` entry for a term other changes will use, an AC drift hiding behavior, or a direct ADR contradiction.
- **Suggestion** — the doc would help but the diff is self-explanatory in isolation.

In the author lens (`prod-ready`) every check resolves to `✓`, `✗ + remediation`, or `n/a + reason` and is fixed before the PR. In the reviewer lens (`pr-review`) an unresolved check without `n/a + reason` is a finding at the severity above.

## Standalone report

When run on its own (the former `sync-check`), output a numbered list. For each finding:

- **Location** — `file:line` or `ADR-NNNN`.
- **Severity** — `Blocker` or `Suggestion` per above.
- **Finding** — e.g. "Code uses 'Account', but `CONTEXT.md` specifies 'Customer'."
- **Recommended action** — e.g. "Rename to 'Customer', or update `CONTEXT.md` if the concept is genuinely new."

If a contradiction is found in *existing* code (not just this diff), escalate to [`grill-plan`](../grill-plan/SKILL.md) to resolve the terminology or architectural mismatch.

## Done when

- Every relevant check is `✓`, `✗ + remediation`, or `n/a + reason`.
- Every `_Avoid_:` alias appearing in the diff has been flagged.
- Every deviation from an active ADR has been surfaced.

The doc-map is small enough to walk in 2–3 minutes. Skip it and you're trading 3 minutes now for an hour of orientation in 3 months.
