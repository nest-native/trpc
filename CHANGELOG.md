# Changelog

## 0.6.0

Server-config passthrough — expose tRPC v11's own server options through `TrpcModuleOptions` (no new runtime dependencies; all four are forwarded untouched):

- add `transformer` (e.g. `superjson`), threaded into `initTRPC.create({ transformer })`, so values such as `Date`/`Map` round-trip between server and client; clients configure the same transformer on their link (`httpBatchLink({ url, transformer })`)
- when `autoSchemaFile` and `transformer` are combined, the generated `AppRouter` is marked transformer-enabled, so typed clients are required (at compile time) to configure a matching link transformer, and transformed types such as `Date` are inferred as `Date` instead of `string`
- add `errorFormatter`, threaded into `initTRPC.create({ errorFormatter })`; it composes after the existing `HttpException` → `TRPCError` mapping, enabling the canonical flattened-`ZodError` recipe (`error.data.zodError`)
- add `responseMeta`, forwarded to the tRPC request handler, for per-response status codes and headers (e.g. `Cache-Control`); headers are applied on both JSON and SSE (subscription) responses, with SSE metadata generated eagerly before streaming starts
- add `onError`, forwarded to the tRPC request handler, as the standard centralized error-logging/reporting hook
- add `sample/13-transformer-error-formatting` demonstrating superjson, ZodError flattening, response caching headers, and error reporting
- docs honesty fix: `@Subscription()` documentation now states that async generators over SSE are the supported streaming shape; tRPC `observable()` return values are not streamed and WebSocket transport is not provided

## 0.5.0

Project rename to the `@nest-native/*` org standard (no API or behavior changes):

- rename the npm package from `nest-trpc-native` to the scoped `@nest-native/trpc`
- rename the GitHub repository in place from `nest-native/nest-trpc-native` to `nest-native/trpc` (preserves stars, forks, issues, and history; old URLs redirect)
- update all imports, sample dependencies, docs, badges, registry links, and repository/homepage URLs to the new package and repo
- update the documentation site base path to `/trpc/`
- add a README rename banner pointing existing users to `@nest-native/trpc`
- the old `nest-trpc-native` package is deprecated on npm and frozen at `0.4.3`

## 0.4.3

- fix: preserve `HttpException` → tRPC error mapping when an interceptor is in the chain (e.g. `ClsModule`'s default passthrough `APP_INTERCEPTOR`). Previously, any `HttpException` thrown inside a procedure was silently coerced to `INTERNAL_SERVER_ERROR`/500 because the result of `transformToResult` was returned without `await`, letting deferred-Observable rejections escape the surrounding try/catch.

## 0.4.0

Production-readiness release focused on documentation, verification, and release confidence:

- add contributor, security, issue, and pull request workflows
- publish a Docusaurus documentation site with support policy, public API tiers, claims matrix, samples, testing, production, and benchmark methodology guidance
- refresh README and package discovery content around supported Node, NestJS, tRPC, Zod, samples, and zero-runtime-dependency expectations
- add real `@trpc/client` E2E coverage for Express and Fastify adapters
- split CI into focused package, coverage, docs, Docusaurus, release, showcase, and sample jobs across Node 20 and Node 22 where relevant
- add release checks for README links, sample version synchronization, workspace resolution, and package tarball contents
- enforce SonarJS cognitive complexity for package source functions and publish cognitive complexity PR reports
- update the test runner to support Chai 6's ESM-only package
- add Dependabot automation for npm workspaces, website dependencies, and GitHub Actions updates

## 0.3.1

- standardize Zod support on `4.x` as the supported optional peer dependency
- simplify Zod serializer/test coverage around a single Zod v4-focused path
- update docs and support policy to explicitly document the Zod v4 contract

## 0.3.0

Stabilization release ahead of 1.0:

- align the documented support contract around Node 20+, NestJS 11.x, and tRPC 11.x
- narrow the root package surface to the supported public API while keeping `TrpcRouter` public for testing
- add release checks for sample version sync, repo README links, and package tarball contents
- stop publishing build metadata such as `tsconfig.build.tsbuildinfo`

## 0.1.0

Initial release — full enhancer support + rich showcase.
