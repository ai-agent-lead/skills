## Code comments

- **Default: no comment.** A comment states what is true now that a reader without git history would otherwise get wrong.
- **Headers (Go doc, JSDoc) = the caller's contract only:** side effects, safe to call twice, cost/blocking, errors, units and nil/zero meaning. No internals, no history, no lines that repeat the signature. Go: exported names, starting with the name.
- **Inside a function, every comment starts with a tag:** `WHY:` (reason the code can't show), `WORKAROUND:` (with link and removal condition), `SAFETY:` (why risky code is safe), `TODO(owner):`. Untagged → delete.
- **Never write:** edit narration ("now uses…", "fixed…", "changed from…"), notes to the reviewer, process tags (`R6 AC-3`), commented-out code. If narration hides a real reason, rewrite it as a `WHY:`.
- **You touch it, you own it:** when you change a function, re-read its header and every comment in it — still true, update, or delete. Edit old lines; never append "Updated:".
- **History lives in git, not in comments.** Commit bodies say why and link with `Refs:`. Read history (`git log -L :Func:file`, `git blame`) only when code looks wrong without a `WHY:`, before deleting unclear code, or for a regression.

Full rules: `formats/STYLE-comments.md` in the installed skills folder. Checker: `scripts/check-comments.mjs`.
