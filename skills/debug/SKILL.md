---
name: debug
description: Disciplined reproduction, isolation, and hypothesis-testing for non-trivial bugs — runs BEFORE `tdd` when the failing assertion isn't yet known. Use when the user reports a bug whose root cause is not obvious from the symptom — triggered by phrases like "it's broken", "this is failing", "intermittent", "flaky", "regression", "not sure why", "production issue", "doesn't work in <env>". Skip for typos, clear stack traces with one-step fixes, or bugs whose fix is obvious from reading the message. Pairs with `tdd` (downstream — the failing test crystallises once the bug is reproduced) and `zoom-out` (upstream, when the area is unfamiliar).
---

# Debug

The discipline of finding a root cause before writing a fix. TDD says "write a failing test"; for a non-trivial bug, you don't yet know what the failing test should assert. This skill is the step between *symptom* and *test*.

## Why this skill exists

Jumping to a fix without a clean reproduction risks fixing the wrong thing — or fixing the right thing for the wrong reason. Both leave the bug latent. The discipline of reproducing → isolating → hypothesis-testing produces:

- A **minimum reproduction** the future failing test can assert on.
- A **named root cause** distinct from the symptom — the thing that has to change.
- A **bisected blast radius** — what else this might affect, what else might be affected by the fix.

Without this, "fixed in production" often means "symptom no longer visible from the angle we looked at."

## When to use

- Bug whose root cause is not obvious from the message or stack trace.
- Intermittent / flaky failure — passes locally, fails in CI; passes most of the time, fails sometimes.
- Regression — worked yesterday, broken today, unclear what changed.
- "Doesn't work in production" / "doesn't work in <env>" — environment-specific behaviour.
- Concurrency, timing, or ordering-dependent symptoms.
- The user says "I don't know what's wrong" — that's the trigger.

## When to skip

- Typo / off-by-one / null-check fixes obvious from the stack trace. Just fix it.
- A test you wrote that fails with a clear assertion message — fix the code, the test already pinned the behaviour.
- Bugs covered by an existing failing test — go straight to `tdd`'s green step.
- "Bug" that's actually a feature request / unclear requirements — that's a `feature-doc` problem, not a `debug` one.

## Phases

Each phase is a stop. Don't start the next until the previous is grounded.

### 1. Reproduce — find the smallest input that triggers it

Without a reliable reproduction, every "fix" is a guess. The reproduction is the contract you're buying.

- **Capture the symptom precisely.** What's the exact error / output / observable behaviour? What's the expected? Quote it; don't paraphrase.
- **Capture the environment.** OS, language version, dependency versions, database version, env vars in play, time of day if relevant. Bugs hide in unstated context.
- **Find the smallest input that triggers it.** Trim until removing one more piece makes the bug disappear. The minimum repro is the seed of the failing test.
- **Make it reliable.** If it's intermittent, is it really 50/50, or 5%, or "only when run after test X"? Quantify or you can't tell when you've fixed it.

If you cannot reproduce, **stop and say so.** "Can't reproduce" is a valid debug outcome that warrants better instrumentation, not a guess at a fix.

### 2. Isolate — narrow to the failing region

Don't read the whole codebase. Bisect.

- **`git bisect`** for regressions. Find the commit that introduced the change.
- **Logs / tracing** — add structured logs at suspect boundaries; don't read code that hasn't been confirmed to execute.
- **Diff your assumptions against the code.** If you believe path A executes, prove it. Print, log, breakpoint.
- **Walk the data, not the code.** Trace one specific input through the system; see where the actual value diverges from the expected. The divergence point is the bug's region.

The output of this phase is a **named region**: a function, a config key, a boundary between two modules. Not "somewhere in the auth code" — `validateToken` at `auth.go:142`.

### 3. Hypothesis test — one variable at a time

For each suspected root cause, form a falsifiable hypothesis and test it.

- **State the hypothesis.** "I think the bug is that X happens when Y." If you can't state it, you don't have one.
- **Predict.** If the hypothesis is true, what should happen when I change Z? If it's false, what should happen?
- **Test.** Change *one thing*. Observe.
- **Update.** Hypothesis confirmed → proceed to fix. Falsified → form another. Don't try to confirm two hypotheses at once; you'll learn nothing from the result.

Most "I don't know what's wrong" bugs are debugger-friendly with this discipline. Most "I tried five things" sessions skipped it.

### 4. Name the root cause

State the root cause in one sentence, distinct from the symptom.

- **Symptom**: "checkout returns 500 on Tuesdays."
- **Root cause**: "discount-rule cache TTL is 24h but the rule table is rebuilt nightly at 03:00 UTC; Tuesday-morning requests hit the stale cache because Monday's TTL hasn't expired."

The root cause names *what has to change*. If the sentence is fuzzy, the bug isn't isolated yet — go back to phase 2.

### 5. Hand off to TDD

Once the root cause is named:

- The **minimum reproduction** is the seed of the failing test (step 1 of `tdd`'s red phase).
- The **named region** is where the fix lands.
- The **hypothesis** describes what behaviour the fix changes.

Run `tdd`: write a failing test that captures the reproduction, fix, refactor with the test as a safety net.

## Optional artifact: bug research note

For non-trivial bugs whose investigation produced real signal — bisected commits, environment-specific findings, surprising cross-module interactions — capture a research note at `docs/research/<bug-slug>.md` (use the `investigate` template's shape). The note reads as the post-mortem: what was symptom, what was root cause, why was it not caught earlier, what test would have caught it.

Skip for bugs with one-paragraph stories. Capture for bugs with real lessons.

## Anti-patterns

- **Fix-then-verify.** "I think this is the issue, let me change it and see." That's hypothesis-testing without the discipline — every change becomes a confounder. Reproduce reliably first.
- **Shotgun debugging.** Changing several things at once. If any one fixes it, you don't know which.
- **Reading without running.** "I read the code and I think the bug is X." Read confirms hypothesis; running falsifies it. Run.
- **Symptom-as-bug.** "Fixing" the visible error without naming the root cause. The fix might suppress the symptom while leaving the cause to surface elsewhere.
- **Skipping the minimum repro.** A 1000-line repro is not a repro; it's an environment. Trim.
- **Calling it intermittent without quantifying.** "Sometimes it fails" is not actionable. "9/100 runs in CI, 0/100 locally" is.

## Pairing with other skills

- **`tdd`** runs *after*. The reproduction becomes the failing test. The named region is where the fix lands.
- **`zoom-out`** runs *before* if the area is unfamiliar. Map first, then debug — easier to bisect when you know the topology.
- **`investigate`** runs *instead* if the "bug" turns out to be an unclear requirement (no obvious correct behaviour to assert). Don't force a debug session on what's actually a design question.
- **`prod-ready`** Section 7's doc-map: if the bug surfaced a missed invariant, decision, or domain term, capture it on the way out (ADR / CONTEXT.md update).
- **`verify-real-deps`** is the upstream prevention layer for wire-shape bugs against third-party APIs. If `debug` finds one of those, log it in `docs/known-issues.md` and tighten the fake.

## Done when

- A minimum, reliable reproduction exists.
- The root cause is named in one sentence, distinct from the symptom.
- The blast radius is known (what else this affects; what else could be affected by the fix).
- Handoff to `tdd` is unambiguous: the test to write is clear from the reproduction.
