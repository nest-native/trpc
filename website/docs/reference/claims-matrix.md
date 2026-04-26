---
sidebar_position: 2
---

# Claims Matrix

This page maps the main public claims to current verification evidence. It is a release-readiness checklist, not marketing copy.

## Runtime and API Claims

| Claim | Current evidence | Status |
| --- | --- | --- |
| Primary setup uses `TrpcModule.forRoot()` and `forRootAsync()`. | `packages/trpc/test/module/trpc-module.spec.ts`, `website/docs/module-setup/for-root.md`, `website/docs/module-setup/for-root-async.md` | Covered by package tests and docs. |
| Routers are decorator-first classes. | `packages/trpc/test/decorators/decorators.spec.ts`, `packages/trpc/test/router/trpc-router.spec.ts`, `sample/00-showcase/src/users/users.router.ts` | Covered by package tests and samples. |
| `@Query()`, `@Mutation()`, and `@Subscription()` map procedures. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `packages/trpc/test/router/trpc-router.spec.ts`, `sample/06-subscriptions` | Covered by package tests and samples. |
| `@Input()` supports full input and field extraction. | `packages/trpc/test/context/trpc-context-creator.spec.ts`, `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `website/docs/decorators/input.md` | Covered by package tests and docs. |
| `@TrpcContext()` supports full context and field extraction. | `packages/trpc/test/context/trpc-context-creator.spec.ts`, `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `sample/03-context-request-scope` | Covered by package tests and samples. |
| `autoSchemaFile` generates importable `AppRouter` types. | `packages/trpc/test/generators/schema-generator.spec.ts`, `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `sample/08-autoschema-client-typecheck/src/client.typecheck.ts` | Covered by package tests and client typecheck sample. |
| `TrpcRouter` is supported for in-process testing. | `website/docs/testing/router-testing.md`, `packages/trpc/test/router/trpc-router.spec.ts`, `packages/trpc/test/router/trpc-router-lifecycle.spec.ts` | Covered as advanced testing API. |

## NestJS Integration Claims

| Claim | Current evidence | Status |
| --- | --- | --- |
| Guards execute for tRPC procedures. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `packages/trpc/test/context/trpc-enhancer-runtime.factory.spec.ts`, `sample/02-enhancers-guards-pipes-filters` | Covered by package tests and samples. |
| Pipes execute for tRPC procedures. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `website/docs/enhancers/pipes.md`, `sample/02-enhancers-guards-pipes-filters` | Covered by package tests and samples. |
| Interceptors execute for tRPC procedures. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `website/docs/enhancers/interceptors.md`, `sample/02-enhancers-guards-pipes-filters` | Covered by package tests and samples. |
| Filters can remap procedure errors. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `website/docs/enhancers/filters.md`, `sample/02-enhancers-guards-pipes-filters` | Covered by package tests and samples. |
| Request-scoped providers work with tRPC calls. | `packages/trpc/test/router/trpc-router.spec.ts`, `website/docs/advanced/request-scope.md`, `sample/03-context-request-scope`, `sample/00-showcase/scripts/smoke-express.ts` | Covered by package tests and smoke samples. |
| NestJS internals are isolated behind a compatibility boundary. | `website/docs/advanced/nest-internals.md`, `packages/trpc/context/trpc-enhancer-runtime.factory.ts` | Documented and isolated in code. |

## Adapter, Validation, and Client Claims

| Claim | Current evidence | Status |
| --- | --- | --- |
| Express is supported. | `packages/trpc/test/adapter/trpc-http-adapter.spec.ts`, `sample/00-showcase/scripts/smoke-express.ts`, `sample/07-express-fastify/scripts/smoke-express.ts` | Covered by package tests and smoke samples. |
| Fastify is supported. | `packages/trpc/test/adapter/trpc-http-adapter.spec.ts`, `sample/00-showcase/scripts/smoke-fastify.ts`, `sample/07-express-fastify/scripts/smoke-fastify.ts` | Covered by package tests and smoke samples. |
| Zod input and output schemas are supported. | `packages/trpc/test/generators/zod-serializer.spec.ts`, `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `sample/04-validation-zod` | Covered by package tests and samples. |
| Zod is optional. | `packages/trpc/package.json`, `website/docs/installation.md`, `website/docs/validation/class-validator.md`, `sample/05-validation-class-validator` | Covered by package metadata, docs, and samples. |
| `class-validator` plus `ValidationPipe` DTO workflows are supported. | `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`, `sample/05-validation-class-validator`, `website/docs/validation/class-validator.md` | Covered by package tests and samples. |
| Generated `AppRouter` works with `createTRPCProxyClient`. | `sample/00-showcase/scripts/smoke-express.ts`, `sample/07-express-fastify/scripts/smoke-express.ts`, `sample/08-autoschema-client-typecheck/src/client.typecheck.ts` | Covered by smoke and typecheck samples. |

## Release and Packaging Claims

| Claim | Current evidence | Status |
| --- | --- | --- |
| Published package keeps zero runtime dependencies. | `packages/trpc/package.json`, `scripts/check-package-pack.mjs` | Covered by package metadata and release pack check. |
| Package and sample versions stay synchronized for releases. | `scripts/check-version-sync.mjs`, `RELEASING.md` | Covered by release check and release docs. |
| README links stay valid. | `scripts/check-readme-links.mjs`, `npm run release:check:readme-links` | Covered by release check. |
| Package tarball excludes unintended artifacts. | `scripts/check-package-pack.mjs`, `npm run release:check:pack` | Covered by release check. |

## Known Verification Gaps

These gaps should guide future PRs:

- Add package-level real `@trpc/client` E2E tests that boot Nest apps on both Express and Fastify. Current real-client coverage mostly lives in runnable samples.
- Add a dedicated duplicate-router/procedure-name validation test once runtime diagnostics are improved.
- Add golden tests for generated schema formatting if output formatting becomes part of the release claim.
- Keep benchmark claims out of README and docs until a reproducible benchmark harness exists. See [Benchmark Methodology](../advanced/benchmark-methodology).

## Unsupported Claim Examples

Do not make these claims unless new code, docs, and tests are added:

- "Official NestJS integration."
- "Production security is handled by the library." Authentication, authorization, rate limiting, CORS, and secret handling are application responsibilities. See [Security Responsibilities](../advanced/security-responsibilities).
- "Benchmarked faster than REST, GraphQL, or vanilla tRPC."
- "All package internals are stable extension points."
