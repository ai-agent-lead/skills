# Comment Style

The **one source** for code comments in this skill set. Other skills and docs link here — they do not restate these rules. The always-on short version is [`snippets/comment-style.md`](../../snippets/comment-style.md); `npm test` keeps the two in sync.

> **Default: no comment.** A comment states what is true **now** that an agent reading the code — without git history — would otherwise get wrong.

The main reader is an agent. It sees what is pushed in front of it and rarely goes looking for more:

```
 PUSHED — read every time                PULLED — read only on a trigger (§5)
 ────────────────────────────            ─────────────────────────────────────
 code: names, types       (what)         git log / blame      (how we got here)
 header: the contract     (for callers)  PRs, old reviews
 tagged comment at spot   (why, now)     ADRs not linked from code
 folder AGENTS.md         (gotchas)
```

Pushed text costs every reader on every read, so it holds only current truth. History is pulled, from git.

---

## 1. Headers — the contract, nothing else

A header (Go doc comment, JSDoc block) tells a **caller** what the name and types don't:

- side effects (writes, sends, charges)
- safe to call twice? safe from many goroutines / concurrent calls?
- cost: blocks, network, how long
- errors it returns or throws, and when
- units, and what `nil` / `0` / `""` mean

Never in a header: how the function works inside, history ("Updated…", "Now…"), or lines that repeat the signature.

**Go** — exported names get a doc comment starting with the name (linters expect it). One line is often enough:

```go
// Charge charges the order exactly once, even if called again.
// It blocks up to ~6s on a slow bank and returns ErrChargeFailed after 5 tries.
func Charge(ctx context.Context, o Order, c BankClient) (Receipt, error) {
```

Unexported helpers get no header unless the contract is surprising.

**JS** — only exported functions whose contract isn't obvious:

```js
/**
 * Charges the order exactly once, even if called again.
 * Blocks up to ~6s on a slow bank; throws ChargeFailed after 5 tries.
 * @param {Order} order
 * @param {BankClient} client
 * @returns {Promise<Receipt>}
 */
export async function charge(order, client) {
```

In plain JS the `@param {Type}` lines are your type system — keep them, without prose that repeats the name. In TypeScript, drop them; the signature already says it.

**Package / module** — Go: one package comment (`// Package payments charges orders…`, usually in `doc.go`) saying what the package is for, as a current fact. JS: a short `README.md` in the module folder, only when the folder needs one.

## 2. Inside a function — tagged comments only

Every comment inside a function body starts with one of these tags. An untagged comment is a delete candidate.

| Tag | Use it for | Example |
| --- | --- | --- |
| `WHY:` | A reason the code can't show; what an agent must not "fix" | `// WHY: bank rejects >5 req/s; backoff keeps us under.` |
| `WORKAROUND:` | A temporary fix — always with a link and a removal condition | `// WORKAROUND: bank sends 502 when overloaded (bank-api#412). Drop once fixed.` |
| `SAFETY:` | Why dangerous-looking code is safe | `// SAFETY: len checked above; index is in range.` |
| `TODO(owner):` | Planned work, with an owner or ticket | `// TODO(tuan): #88 batch these calls.` |

A `WHY:` may point to a decision record: `// WHY: manual SQL — see ADR-0007.` Tool directives (`//go:embed`, `//nolint:…`, `// eslint-disable-next-line … -- reason`) are not comments for this rule.

## 3. Delete on sight

| Pattern | Example | Instead |
| --- | --- | --- |
| Narrates the code | `// loop over users` | Nothing — the code says it |
| **Narrates the edit** | `// now uses backoff instead of retry` | Current fact as `WHY:`, history in the commit |
| **Talks to the reviewer** | `// Note: handles the case you mentioned` | The PR description or chat |
| **Process tags** | `// R6 AC-3` | The commit message (`R6:` prefix per `tdd-rounds`) |
| Repeats the signature | `@param order the order` | Drop it (keep plain-JS `{Type}`) |
| Section headers | `// Step 1: validate` | Extract a function; its name is the header |
| Commented-out code | `// x := old(n)` | Delete — git has it |
| Caller references | `// used by checkout` | `grep` |
| Banners | `// ===== helpers =====` | A file or function boundary |
| TODO without owner | `// TODO: fix later` | `TODO(owner):` or fix it now |

**Convert, don't just delete.** Edit narration often hides a real reason. Keep the reason, drop the story:

```
 ✗  // now uses backoff instead of fixed retry
 ✓  // WHY: bank rejects >5 req/s; backoff keeps us under.
```

## 4. When you edit: you touch it, you own it

Comments pile up because edits only add. The header sits far from the change, so nobody re-reads it:

```
 line 10   // Charge ... It retries 3 times.   ◄── now false, out of view
 line 11   func Charge(...) {
 ...
 line 40       delay *= 2                      ◄── the edit happens here
```

On every change to a function:

1. **Re-read its header and every comment inside it.** Each one is still true, updated, or deleted.
2. **Edit, don't append.** Never add "Updated: …" below an old line — rewrite the old line.
3. **Don't grow the count by default.** A diff may add comments only when each passes §1–§2. Report `comments: +N −M` in the `simplify` sweep.

## 5. History lives in git

No per-file or per-function changelogs in code. They grow forever, conflict on merge, go out of sync, and cost the agent on every read. Git already has a per-file, per-function history that can't be forgotten:

| Question | Command |
| --- | --- |
| Recent changes to this file | `git log --oneline -5 -- <file>` |
| How this function evolved | `git log -L :<FuncName>:<file>` |
| Why this line is like this | `git blame -L <from>,<to> <file>` → `git show <sha>` |
| When a string appeared or went | `git log -S "<string>" --oneline` |

That only works if commits carry the why:

```
fix(payments): stop double charge on timeout      ← what changed

A timed-out charge had often succeeded; the retry ← why
charged again. Send an idempotency key so the
bank returns the first result.

Refs: docs/adr/0007-idempotent-charges.md          ← link into docs/
```

**Read history only on a trigger** — not on every read:

- The code looks wrong and there is no `WHY:` → check before "fixing" it.
- You are about to delete or rewrite something whose purpose isn't clear.
- A regression: "it worked last week".
- A `WHY:` or `Refs:` points somewhere → follow that one link.

## 6. Folder knowledge — `AGENTS.md` / `CLAUDE.md`

A rule that holds for many files ("all money is in cents", "this package must not import `db`") goes in a short `AGENTS.md` or `CLAUDE.md` in that folder — not repeated in every file. Current facts only, a few lines, no history. Agents load it when they work in that folder.

## 7. Tests

The test name carries the intent (`TestChargeIsIdempotentOnTimeout`, `it("charges once when retried")`). Add a 1–3 line comment only when a fake or harness would surprise the reader — what is faked, and why.

## 8. When a comment grows

More than ~3 lines → it belongs in an ADR or `docs/research/<topic>.md`. Leave one line in the code: `// WHY: see docs/research/tier-spill.md.`

## 9. Check it

```
node <skills-dir>/scripts/check-comments.mjs [base]
```

It reads the diff against `base` (default: the merge-base with `main`), plus untracked files, and reports:

- **Problems** in added comments — untagged, narrating the edit, talking to the reviewer, process tags, TODO without owner, commented-out code. Exit code 1.
- **Re-check** — existing comments, including headers, inside functions you changed. Each must still be true.
- `comment lines: +N −M`.

A finding is a prompt to look, not an automatic delete. Supported: Go, JS/TS, and other `//` and `#` languages.

## Done when

- [ ] Headers state the caller's contract only — no internals, no history, no repeated signature.
- [ ] Every comment inside a function starts with `WHY:`, `WORKAROUND:`, `SAFETY:`, or `TODO(owner):`.
- [ ] Every comment in the functions you changed was re-read — still true, updated, or deleted.
- [ ] No edit narration, reviewer talk, or process tags; the reasons they hid are now `WHY:` lines or commit bodies.
- [ ] Commits say why and link with `Refs:`.
- [ ] `check-comments.mjs` shows no problems, and every re-check item was looked at.
