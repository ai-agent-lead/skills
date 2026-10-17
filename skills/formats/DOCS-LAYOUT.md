# Docs Layout and Upkeep

The **one source** for where docs live under `docs/`, who changes a doc's status, and how docs stay true. Skills link here; they do not restate the paths. Frontmatter fields are in [`OKF.md`](OKF.md); the decision is ADR-0005 in this repo.

> **Scope decides the folder. Status lives in frontmatter. A doc never moves.**

---

## 1. The tree

```
docs/
├── index.md          generated: every doc, active first
├── roadmap.md        checklist of releases
├── CONTEXT-MAP.md    domains and how they talk (only with 2+ domains)
├── architecture.md · CONVENTIONS.md · known-issues.md
├── CONTEXT.md        vocabulary (one domain: here; many: per domain)
├── releases/         v1.6.md — goal + feature checklist + notes
├── adr/              cross-domain decisions
├── research/         cross-domain or tech-wide questions
├── features/<name>/  (flat repo: features live here)
└── <domain>/         billing/, identity/ — same names as the code
    ├── CONTEXT.md    this domain's terms
    ├── adr/          0007-idempotent-charges.md
    ├── research/     refund-providers.md
    └── features/
        └── refunds/
            ├── feature.md    contract + ACs        feature-doc
            ├── design.md     module shape          design
            ├── migration.md  deploy steps          migrate
            ├── security.md   threat model          security-review
            ├── bench.md      numbers               bench
            └── state/        round state           tdd-rounds
```

**Start flat.** Keep `docs/features/`, `docs/adr/`, `docs/research/` until a second domain appears — a second vocabulary where one word means two things. Then add `docs/<domain>/` folders for new docs. Old docs stay where they are.

### Where a doc goes

| Doc | Path | Written by |
| --- | --- | --- |
| Feature contract | `docs/<domain>/features/<name>/feature.md` | `feature-doc` |
| Module design | `…/features/<name>/design.md` | `design` |
| Migration plan | `…/features/<name>/migration.md` | `migrate` |
| Threat model | `…/features/<name>/security.md` | `security-review` |
| Benchmark | `…/features/<name>/bench.md` | `bench` |
| Round state | `…/features/<name>/state/` | `tdd-rounds` |
| Decision | `docs/<domain>/adr/NNNN-<slug>.md` | `investigate`, `grill-plan`, `bootstrap` |
| Research, bug study | `docs/<domain>/research/<topic>.md` | `investigate`, `debug` |
| Vocabulary | `docs/<domain>/CONTEXT.md` | `bootstrap`, `grill-plan` |
| Release plan and notes | `docs/releases/<version>.md` | `release` |
| Release list | `docs/roadmap.md` | `release` |
| Domain list | `docs/CONTEXT-MAP.md` | `bootstrap`, `improve-codebase-architecture` |
| System map | `docs/architecture.md` | `system-design` |
| Conventions | `docs/CONVENTIONS.md` | `bootstrap` |
| Accepted gaps | `docs/known-issues.md` | `tdd-rounds`, `verify-real-deps` |
| Round manifest (legacy) | `docs/STATE.md` | `tdd-rounds` until ADR-0001 lands |

`<domain>/` is left out in a flat repo. The checker's `LAYOUT` list in [`scripts/check-docs.mjs`](../scripts/check-docs.mjs) holds the same table; `npm test` fails when a skill names a path outside it.

**Which folder, when it's unclear:**

- The answer changes one domain → that domain's folder.
- It spans domains, or the domain isn't clear yet → the top-level folder. It stays there; a later doc links back to it.
- A security review, benchmark, or migration with no feature → `research/security-<topic>.md`, `research/bench-<topic>.md`, `research/<topic>-migration.md`.
- A feature that touches several domains → the domain it changes most.

**ADR numbers are global.** One sequence across every `adr/` folder, so `ADR-0007` in a `WHY:` comment points at exactly one file. Next number: the highest `NNNN` under any `docs/**/adr/`, plus one.

## 2. Status — one home, one owner

Status lives only in the frontmatter `status:` field — no `**Status:**` line in the body. Lowercase.

| Doc | Values |
| --- | --- |
| feature | `draft` → `approved` → `building` → `done` → `shipped`; or `dropped` |
| release | `planned` → `building` → `shipped` |
| research | `open` → `decided`; or `superseded` |
| adr | `proposed` → `accepted`; later `deprecated` or `superseded` (link the new ADR in the body) |

Each change has one owner. The owner makes it as a step of its own "Done when":

```
 feature-doc   ──► draft ──(user approves)──► approved
 tdd, tdd-rounds ──(first failing test)───► building
 prod-ready    ──(all ACs ticked, ready)──► done
 release       ──(tag cut)────────────────► shipped
                  + ticks the box in releases/<version>.md
```

- **No `docs/releases/`** (continuous deploy): `prod-ready` sets `shipped` at merge instead of `done`.
- **Dropped:** whoever stops the work sets `dropped` and says why in one line.
- **Research:** `investigate` sets `decided` when the user picks an option. **ADR:** the skill that writes a newer ADR marks the old one `superseded`.

## 3. Releases and the roadmap

A release file owns the list of what ships in it. Features don't name their release — to find it, `grep -rl <name> docs/releases`.

```md
---
type: release
title: v1.6 — Refunds
description: Customers can refund without support.
status: building
---
# v1.6 — Refunds

Goal: customers can refund without support.

## Features
- [ ] [Refunds](../billing/features/refunds/feature.md)
- [x] [SSO login](../identity/features/sso/feature.md)

## Moved out
- Partial refunds → v1.7

## Release notes
(written by `release` when shipped)
```

`docs/roadmap.md` is a short checklist, one line per release:

```md
- [x] [v1.5 — Trigger cleanup](releases/v1.5.md)
- [ ] [v1.6 — Refunds](releases/v1.6.md)
- [ ] [v1.7 — SSO](releases/v1.7.md)
```

- A feature box is ticked only when that feature is `shipped`. A roadmap box is ticked only when that release is `shipped`.
- A slipped feature: move its line to the next release file. Nothing else changes.
- A milestone that isn't a version (`mvp`, `beta`) works the same: `releases/mvp.md`.
- A shipped release file is frozen, like an ADR.

## 4. Links

```
 AGENTS.md ──points to──► docs/index.md ──lists──► every doc
 roadmap.md ──lists──► releases/*.md ──checklist──► feature.md
 code  // WHY: see ADR-0007 ──► adr/
 commit  Refs: ───────────────► feature.md, adr/
 feature.md ──relies on──► adr/, research/, CONTEXT.md
 research/ ──decided in──► adr/
 newer ADR ──supersedes──► older ADR
```

- **Links point up and back:** a newer or narrower doc links to an older or broader one. Only lists — `index.md`, `roadmap.md`, release files — link down.
- **Relative links.** Link files and names, never line numbers.
- **Use `CONTEXT.md` terms** as defined; don't re-define them per doc.

## 5. Living and frozen docs

| Kind | Docs | Rule |
| --- | --- | --- |
| **Living** — true now | `CONTEXT.md`, `architecture.md`, `CONVENTIONS.md`, `known-issues.md`, `roadmap.md`, a feature until `shipped` | Update in the same change as the code that makes it wrong |
| **Frozen** — a moment | ADRs, research, shipped releases, shipped features | Never rewritten. Only `status:` changes; a newer doc links back |

## 6. Pointing agents at the docs

An agent should never need "read X first" from you:

- **Root `AGENTS.md` / `CLAUDE.md`:** one line — "Start at `docs/index.md`."
- **A code folder per domain** (`internal/billing/`, `src/billing/`) gets a short `CLAUDE.md` / `AGENTS.md`: where its terms are (`docs/billing/CONTEXT.md`) and its folder rules. Claude Code loads a folder's `CLAUDE.md` when it works there.
- **Feature docs list their code** in frontmatter, so tools can map a file back to its doc:

  ```yaml
  code: [internal/billing/refund/, web/src/refunds/]
  ```

## 7. Check it

```
node <skills-dir>/scripts/check-docs.mjs            # whole docs/ tree
node <skills-dir>/scripts/check-docs.mjs --changed  # only docs changed on this branch
node <skills-dir>/scripts/check-docs.mjs --write    # regenerate docs/index.md
```

**Problems** (exit 1): missing `type:`, a status outside §2, a `**Status:**` line that disagrees with frontmatter, a broken link, a `code:` path that doesn't exist, a ticked box whose feature or release isn't `shipped` (or the reverse), a stale generated `index.md`.

**Re-check** (no failure): code under a feature's `code:` changed but the doc didn't; code changed while the feature is still `draft` / `approved`; a doc outside the §1 table.

`index.md` is generated between `<!-- check-docs:index:start -->` and `<!-- check-docs:index:end -->`. Text above the markers is yours.

**Where it runs:**

| Where | How |
| --- | --- |
| Claude Code | Installer option `--hooks`: session start lists docs in flight; each edit names the docs covering that file; the agent can't stop while `--changed` finds a problem |
| git pre-commit | `node <skills-dir>/scripts/check-docs.mjs --changed` in `.git/hooks/pre-commit` |
| CI | `node <skills-dir>/scripts/check-docs.mjs` |

## Done when

- [ ] Every new doc sits at a §1 path, with `type:` and, where §2 lists one, `status:`.
- [ ] Every status change in this work was made by its §2 owner.
- [ ] Feature docs list their `code:` paths; living docs made wrong by this change are updated.
- [ ] `check-docs.mjs --write` ran, and `check-docs.mjs` shows no problems.
