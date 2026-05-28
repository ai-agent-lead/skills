# Conventions

Rules for how documentation and skills are structured in this repository.

## Documentation Artifacts

- **Lazy Creation**: Directories like `docs/adr/` or `docs/features/` are created only when the first file is needed.
- **Naming**: Use `kebab-case.md` for feature docs, research notes, and ADRs.
- **Reference Docs**: Use `UPPERCASE.md` for internal reference documents within the `skills/` directory.

## Skill Structure

- **SKILL.md**: Every skill must have a `SKILL.md` at its root following the canonical template in `skills/SKILL-TEMPLATE.md`.
- **Templates**: Skeletons for AI agents to fill in live in the skill's `templates/` directory and use `lowercase-hyphenated.md` naming.
- **Frontmatter**: The `description` in the YAML frontmatter is the primary routing signal for AI agents and must include trigger phrases and skip conditions.

## Terminology

- All documentation must adhere to the vocabulary defined in `docs/CONTEXT.md` and `skills/LANGUAGE.md`.
- Stale terminology in documentation is considered a bug and should be corrected immediately.
