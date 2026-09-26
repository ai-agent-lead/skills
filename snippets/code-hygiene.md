## Code hygiene

- **Boring over clever.** Write the obvious solution; a trick needs a `WHY:` naming the constraint that forces it.
- **Naming is the main refactor.** Rename until a stranger gets the right idea from the name alone.
- **YAGNI.** No parameters, options, or interfaces "in case we need it".
- **Rule of 3.** Duplicate twice; extract on the third copy.
- **Locality.** Keep related code together; don't split files by category.
- **Constants where they're used.** Narrowest honest scope; no `constants.*` dumping ground; values that vary by environment come from config.

Full rules: `formats/CODE-HYGIENE.md` in the installed skills folder.
