---
name: bench
description: Performance benchmarking discipline. Measures latency, throughput, and records baseline environments. Triggered by phrases like "benchmark", "performance test", "measure latency".
---

# Benchmark

Turns "it feels faster" into "p99 reduced by 40ms under 200 RPS." Benchmarking provides the empirical evidence required to validate performance ACs.

## Why this skill exists

Performance claims are often "vibes-based" or measured on a developer's machine without a recorded baseline. This skill ensures performance data is reproducible and comparable.

## When to use

- Verifying performance-related Acceptance Criteria in a feature doc.
- Identifying regressions or improvements after a major refactor.
- Profiling hot paths to guide optimization.

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
