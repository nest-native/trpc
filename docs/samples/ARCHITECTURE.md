# Samples Architecture

This repository uses a hybrid model to keep samples understandable while preserving full functionality.

## 1. Monorepo Layer

- `packages/trpc`: publishable integration package.
- `sample/00-showcase`: full runnable baseline.
- `sample/01-*` onward: focused sample slices for fast onboarding.

Why:

- One dependency graph and one CI pipeline.
- Shared tooling and predictable commands.
- Easy cross-reference between package internals and sample usage.

## 2. Domain-Driven Layer

Within `sample/00-showcase/src`, code is grouped by feature domains:

- `cats/*`
- `users/*`
- `health*` (root procedures)

Cross-cutting concerns live in `common/*`:

- guards
- interceptors
- pipes
- filters
- context constants

Why:

- Feature behavior is discoverable by folder.
- Router + schema + service stay close together.
- Shared concerns are centralized and reusable.

## 3. Modular Layer

Each domain is wired as a module with explicit providers and imports.

Why:

- Matches Nest mental model.
- Scales as sample scope grows.
- Keeps DI boundaries visible for contributors.

## Navigation Rule

Start with `sample/00-showcase`, then use `docs/samples/INDEX.md` to jump to specific topics.
