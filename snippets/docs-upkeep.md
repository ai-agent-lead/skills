## Docs

- **Start at `docs/index.md`.** A code folder's `CLAUDE.md` / `AGENTS.md` names that domain's docs. Find the doc yourself; don't wait to be told which one to read.
- **Scope decides the folder:** one domain → `docs/<domain>/…`, cross-domain → top level; a feature's docs live in `features/<name>/`. Never move a doc — link to it.
- **Status lives only in frontmatter, and each change has one owner:** `feature-doc` → draft / approved, `tdd` → building, `prod-ready` → done, `release` → shipped (and ticks `docs/releases/<version>.md`).
- **Same change, same commit:** when code makes a living doc wrong (feature, `CONTEXT.md`, `architecture.md`), update it in that change.
- **Before finishing:** `node <skills-dir>/scripts/check-docs.mjs --write` shows no problems.

Full rules: `formats/DOCS-LAYOUT.md` in the installed skills folder. Checker: `scripts/check-docs.mjs`.
