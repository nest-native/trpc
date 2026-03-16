---
sidebar_position: 3
---

# Samples Architecture

The sample tree uses a hybrid model to stay scalable while preserving full functionality.

## 1. Monorepo Layer

- `packages/trpc`: publishable integration package.
- `sample/00-showcase`: full runnable integration baseline.
- `sample/01-*` onward: focused runnable topic slices.

Why:

- Shared dependency graph and tooling.
- Single CI flow across package + samples.
- Easy traceability from package internals to runnable usage.

## 2. Domain Layer (Showcase)

Inside `sample/00-showcase/src`, code is grouped by feature domains (`cats`, `users`, `health`) and shared concerns (`common/*`).

Why:

- Router, schema, and service are discoverable together.
- Cross-cutting concerns (guards/interceptors/pipes/filters) stay centralized.

## 3. Modular Layer

Sample modules keep DI boundaries explicit and aligned with Nest mental models.

Why:

- Easier to reason about growth.
- Easier to extract focused samples.

## Extraction Rule

1. Implement or refine behavior in `sample/00-showcase` first.
2. If a topic becomes hard to scan, extract a focused runnable sample in `sample/0X-*`.
3. Keep focused samples minimal and single-purpose.
