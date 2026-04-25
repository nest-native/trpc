---
sidebar_position: 9
---

# Benchmark Methodology

This page defines how benchmark results should be collected once a benchmark harness exists. It intentionally does not publish numbers yet.

Benchmark numbers should not appear in the README or docs until they are reproducible across repeated runs and reviewed with the same care as tests.

## Goals

Benchmarks should answer narrow, practical questions:

- What is the overhead of `nest-trpc-native` compared with a plain Nest REST controller?
- How does it compare with vanilla tRPC for similar request shapes?
- What changes when validation, request-scoped providers, or subscriptions are involved?

The goal is not to claim that one transport is universally faster. The goal is to understand tradeoffs for representative NestJS applications.

## Candidate Scenarios

Use small, comparable handlers:

| Scenario | Purpose |
| --- | --- |
| Simple read/query | Baseline routing and serialization overhead |
| Write-shaped mutation | Typical JSON request/response flow |
| Validation-heavy request | Zod and DTO validation cost |
| Request-scoped provider path | Nest DI/request-scope cost |
| Subscription stream | Streaming overhead and backpressure behavior |

Compare at least:

- `nest-trpc-native`
- vanilla tRPC
- Nest REST controller

GraphQL can be added later if the schema and resolver shape are comparable enough to avoid misleading results.

## Measurement Rules

Document the environment for every published run:

- CPU model and core count
- memory
- OS
- Node.js version
- NestJS version
- tRPC version
- package version or commit SHA
- adapter: Express or Fastify
- benchmark tool and version
- warmup duration
- run duration
- concurrency
- number of repeated runs

Each published result should include at least:

- requests per second
- p50 latency
- p95 latency
- p99 latency
- error count
- payload size

## Suggested Tools

Candidate tools:

- `autocannon`
- `wrk`
- `k6`
- `Artillery`

Pick one default tool for repository scripts. Additional tools are fine for local investigation, but published docs should use one repeatable path.

## Reporting Rules

- Publish methodology before publishing numbers.
- Run each scenario multiple times and report the median.
- Include raw command lines and environment details.
- Do not compare cached results against uncached results.
- Do not compare different payload shapes.
- Do not publish claims such as "faster than REST" without reproducible data in the repo.

## Future Harness Shape

A future `benchmarks/` workspace can provide:

```bash
npm run benchmark
```

The harness should keep benchmark dependencies out of `packages/trpc` so the published library preserves its zero-runtime-dependencies contract.
