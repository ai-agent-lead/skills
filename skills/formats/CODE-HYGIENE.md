# Code Hygiene

The line-level and function-level lens this skill set carries into any turn that writes or reads code. Smaller in scope than [`design`](../design/SKILL.md) (which shapes module interfaces) — these are the day-to-day habits that keep a codebase readable, navigable, and easy to change.

This is a **shared reference**, not a standalone skill. It is the lens applied *while writing*, during the [`simplify`](../simplify/SKILL.md) sweep after `tdd` reaches green, and during [`pr-review`](../pr-review/SKILL.md) (§3f). Read it once; apply it many times.

Seven principles.

1. **Boring code beats clever code** — prefer the obvious solution over the elegant trick.
2. **Naming is the primary refactor** — a bad name misleads longer than a bad implementation.
3. **YAGNI** — don't build for hypothetical futures.
4. **Rule of 3 before extracting** — duplicate twice; extract on the third occurrence, not the second.
5. **Locality of behavior** — related code lives together; don't split by category.
6. **Comments earn their keep** — default NONE; keep only why-comments tied to an invariant, trade-off, or provenance the next reader would otherwise miss.
7. **Constants live where they're used** — narrowest honest scope; no `constants.ts` dumping ground.

## Principle 1: Boring code beats clever code

When there's an obvious solution and a clever one, pick the obvious. Cleverness is a tax on every reader who comes after.

**Smell**: a one-liner using bit manipulation, regex acrobatics, or chained ternaries to do what a four-line `if` would do clearly.

**Rule of thumb**: if reading the code feels like solving a puzzle, that's a smell — even when the puzzle has a satisfying answer. Save cleverness for places where it earns its cost (a hot loop you've actually profiled, a parser, a constraint solver).

## Principle 2: Naming is the primary refactor

Bad code with great names is debuggable; great code with bad names misleads forever. Names live longer than implementations.

**Smells**:
- A variable named `data`, `result`, `tmp`, `value`, or `item` that survives more than ~5 lines.
- A function named `process`, `handle`, `run`, or `do` that does anything specific.
- A boolean named `flag`, or a name with `Manager` / `Helper` / `Util` suffix that hides what the thing actually is.
- A type named after the *shape* of the data (`UserData`, `OrderInfo`) instead of its *meaning* (`UnverifiedUser`, `PendingOrder`).
- A function name that doesn't match what it does (especially: `getX` that mutates, or `isX` that returns non-boolean).

**Fix the name first.** Even before fixing the implementation. The name is the documentation everyone reads.

## Principle 3: YAGNI — You Aren't Gonna Need It

Don't build for hypothetical futures. Don't add a parameter "in case we need it later". Don't extract an interface "in case there's a second implementation". Don't write the configurable version of a thing that has one configuration.

**Why**: hypothetical futures rarely arrive in the shape you predicted. Code written for them ages worse than code added when the need is real.

**Exception**: when the cost of *not* designing for it later is provably much higher than the cost of designing for it now (e.g. schema migrations under load, public APIs with downstream consumers, security-sensitive surfaces). The bar is *provably* — not "I have a feeling".

## Principle 4: Rule of 3 before extracting

Duplicate twice; extract on the third occurrence — not the second.

The first occurrence is unique. The second might be coincidence. The third is a pattern. Extracting at two reveals only one axis of variation; extracting at three reveals the *real* axis.

**Why**: premature abstractions calcify. Once a wrong abstraction exists, callers shape themselves to it, and rewriting becomes expensive. Three concrete copies are cheap; one wrong abstraction is not.

## Principle 5: Locality of behavior

Related code lives close together. Don't split a system by *type of code* (`controllers/`, `services/`, `repositories/`) — split by *responsibility* (`orders/`, `billing/`, `auth/`).

**Why**: a new contributor should be able to read one folder and understand one feature, not bounce across five folders to follow one request.

**Smell**: changing one feature requires editing 5 files in 5 directories. That's a sign the structure separates *type* of code, not *responsibility*. (This is an [`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md) issue at scale, but at smaller scale you can fix it inline by colocating files.)

## Principle 6: Comments earn their keep

**The bar:** [`STYLE-comments.md`](STYLE-comments.md). Apply it *while writing*, not only during the `simplify` sweep.

**Default: NONE.** If you're unsure whether a comment earns its line, delete it. Keep only WHY-comments: a constraint, an invariant, a trade-off, or a provenance link to an ADR / round / snapshot — and only if the next reader would otherwise reattempt the rejected alternative.

**Delete on sight**: WHAT-comments, "used by X" / "added for Y" caller references, banner dividers, commented-out code, in-function section headers (`// validate`, `// build response`), and docstrings on exports whose contract is obvious from the signature.

## Principle 7: Constants live where they're used

A constant belongs at the **narrowest honest scope** — next to the code that uses it, not in a far-off catch-all file.

- **Default to local.** Define it in the function or module that uses it. Widen the scope only when a *second* caller genuinely shares the same value (rule of 3) or it's a single-source-of-truth domain value (a timeout, a retry limit, a page size, an external URL) that must not diverge between call sites.
- **Reject the dumping ground.** A `constants.ts` / `config.ts` / `utils.ts` god-file of unrelated constants breaks locality — you bounce across files to understand one feature. Group constants by the *responsibility* they serve, not by the fact that they're all constants.
- **Name a literal only when its meaning is non-obvious.** `MAX_RETRIES = 3` earns its name; `index + 1` and `slice(0, 1)` don't. A magic number whose *meaning* a reader can't infer is a naming problem (Principle 2); a self-evident one isn't.
- **Environment-varying values are config from env, not constants in source.** A timeout you tune per environment, an API base URL, a feature flag — those come from the env / secret store ([`prod-ready`](../prod-ready/SKILL.md) §3), not a hardcoded literal. Centralizing constants and hardcoding env values are opposite mistakes; don't make both.

**Smell**: a top-level `constants.ts` that grows every feature, imported by half the codebase. Each import is a caller reaching across the codebase for one value that probably belonged next to its single use.

## The bar — clean when

- Names communicate intent — a stranger reads them and forms the right mental model.
- The clever shortcut is replaced with the obvious version (or its cleverness is justified by a comment naming the constraint).
- No "in case we need it" parameters, classes, or interfaces remain.
- Duplications either survived the 2-occurrence test (left as-is) or proved themselves at the 3rd occurrence (extracted).
- Related code lives near related code.
- Every surviving comment names a why, an invariant, a trade-off, or a provenance link. None restates the code.
- Constants sit at their narrowest honest scope — no unrelated-constants dumping ground; env-varying values come from config, not source literals.

## Scope boundaries

- Module-level shape (interface, depth, dependencies) is [`design`](../design/SKILL.md)'s job, not this lens's.
- Whole-codebase sweeps for shallow modules are [`improve-codebase-architecture`](../improve-codebase-architecture/SKILL.md). If the diagnosis is "shallow" but the fix is line-level (rename, inline, delete dead helper), this lens applies; if the fix is structural (deepen the module), that skill does.
- Architecture vocabulary (module, interface, depth, seam) comes from [`LANGUAGE.md`](../LANGUAGE.md) — don't redefine.
