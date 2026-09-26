---
name: bench
description: Measures performance — latency, throughput, memory — against a recorded baseline environment and writes `docs/benchmarks/<feature>.md`. Use when a feature doc has performance ACs, when checking whether a refactor made things slower, or when profiling a hot path before optimizing. Triggered by "benchmark", "measure latency", "profile", "performance test", "p99". Not for functional bugs → `debug`; not for pre-tag checks against live vendor APIs → `verify-real-deps`.
---

# Benchmark

Turns "it feels faster" into "p99 reduced by 40ms under 200 RPS." Benchmarking provides the empirical evidence required to validate performance ACs.

## Why this skill exists

Performance claims are often "vibes-based" or measured on a developer's machine without a recorded baseline. This skill ensures performance data is reproducible and comparable.

## When to use

- Verifying performance-related Acceptance Criteria in a feature doc.
- Identifying regressions or improvements after a major refactor.
- Profiling hot paths to guide optimization.

## When to skip

- Functional bugs (wrong output, crashes) — use [`debug`](../debug/SKILL.md).
- No performance AC and no suspected slowdown — measuring without a question produces numbers nobody reads.
- Pre-tag checks against live vendor APIs — use [`verify-real-deps`](../verify-real-deps/SKILL.md).

## Process

### 1. Establish Baseline

Measure the performance of the code *before* the change. Record the environment (hardware, load, concurrency).

### 2. Execute Benchmark

Run the same test against the changed code. Ensure identical environment conditions.

### 3. Record Findings

Create a report in `docs/benchmarks/<feature>.md` using the template.

## Done when

- A benchmark report exists in `docs/benchmarks/`.
- Baseline and current measurements are clearly compared.
- The environment and load profile are documented.

## Pairing with other skills

- **`feature-doc`** — runs before. Performance ACs in the feature doc are what this skill verifies.
- **`tdd`** — runs before. Behaviour is pinned green first; benchmark the correct code, not the draft.
- **`prod-ready`** — runs after. A benchmark report showing a regression blocks the merge.
