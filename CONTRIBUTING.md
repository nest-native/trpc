# Contributing

Thanks for helping improve `nest-trpc-native`. This project is a community package, but its design bar is intentionally strict: it should feel native in NestJS projects, not like tRPC internals exposed through a thin wrapper.

If you use an AI coding agent, point it at [AI_CODING_GUIDELINES.md](AI_CODING_GUIDELINES.md). That file is written primarily for agentic coding workflows and captures the project-specific architecture, public API tiers, security review, and release/version rules that an agent should preserve while editing the repo.

## Local Setup

```bash
npm install
npm run build
npm run test
```

The workspace uses Node.js `>=20` and npm workspaces.

## Design Rules

- Keep the user-facing API decorator-first and class-based.
- Prefer NestJS DI, modules, providers, and enhancer patterns over tRPC-specific concepts in public examples.
- Public onboarding docs should center on:
  - `TrpcModule.forRoot()`
  - `TrpcModule.forRootAsync()`
  - `@Router()`
  - `@Query()`
  - `@Mutation()`
  - `@Subscription()`
  - `@Input()`
  - `@TrpcContext()`
  - generated `AppRouter` types from `autoSchemaFile`
- `TrpcRouter` is supported only for advanced in-process testing docs.
- Do not document package internals as application APIs.
- Do not add runtime dependencies to `packages/trpc` unless maintainers explicitly accept the tradeoff.

## Validation

For small docs-only changes, run the most relevant focused checks:

```bash
npm run release:check:readme-links
npm run docs:test:typecheck
npm --prefix website run build
```

For package, sample, or release-facing changes, run:

```bash
npm run test:cov
npm run release:check
npm run ci
```

If you cannot run a required check locally, say so in the PR and explain why.

## Tests and Samples

Add or update tests when behavior changes. The highest-risk areas are:

- enhancer execution: guards, pipes, interceptors, and filters
- request-scoped providers
- Express and Fastify adapter parity
- Zod validation
- class-validator DTO validation through `ValidationPipe`
- generated `AppRouter` client type usage
- subscription behavior

Samples should stay focused:

- `sample/00-showcase` demonstrates the full integration story.
- `sample/01-*` and later samples should isolate one topic with minimal noise.

## Documentation

The canonical public docs live in `website/docs`.

Keep docs aligned with the support tiers:

- Installation and quick start pages should show only primary onboarding APIs.
- Testing docs may show `TrpcRouter`.
- Unsupported internals should be described only as unsupported internals, not as power-user APIs.

## Dependency Review

Every dependency addition or update needs an explicit reason in the PR.

Before approving dependency changes, review:

- whether the dependency is needed at all
- whether it belongs in root/dev/sample/website dependencies instead of `packages/trpc`
- package legitimacy and maintenance health
- lifecycle scripts such as `preinstall`, `install`, `postinstall`, and `prepare`
- lockfile churn
- unpinned Git or URL dependencies

The published `nest-trpc-native` package should keep `"dependencies": {}` unless there is a deliberate maintainer decision to change that contract.

## Security Review

Every PR needs an explicit security pass, even docs-only PRs.

Check for:

- auth/authz bypass risk
- context data exposure
- input-validation gaps
- prototype pollution
- path traversal
- unsafe dynamic execution
- unsafe deserialization
- secret leakage in code, tests, samples, logs, and docs
- risky CORS/CSRF assumptions
- suspicious dependency or lockfile changes

High-risk findings block merge until mitigated or explicitly accepted by maintainers.

## Release Changes

Version sync is mandatory.

When bumping `packages/trpc/package.json`, update every `sample/*/package.json` dependency on `nest-trpc-native` in the same PR, regenerate `package-lock.json`, and run:

```bash
npm run release:check
npm ls nest-trpc-native --workspaces --depth=0
npm run ci
```

See [RELEASING.md](RELEASING.md) for the publish flow.
