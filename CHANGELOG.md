# Changelog

## Unreleased

- CI only: both ends of the NestJS peer range are now matrix legs. The
  `nestjs-latest-major` job (a `^12` overlay) is replaced by `nestjs-compat`:
  an `11 floor` leg pinned exactly to `11.0.0` with `@nestjs/platform-fastify`
  at `11.0.2` (the first fastify release whose peers admit 11) and sample 09's
  `@nestjs/config@^4`, and a `12` leg on `^12.0.0` with `@nestjs/config@^12`.
  The previous 12 leg silently carried a peer override — `@nestjs/config@4`
  peers `^10 || ^11`, npm overrode it with a warning and exit 0, which
  neither `npm ls` nor `--strict-peer-deps` reports — so the new
  `scripts/check-nestjs-resolution.mjs` (replacing `check-nestjs-major.mjs`)
  requires the exact version from inside every workspace and checks every
  peer range in the NestJS ecosystem against the final tree (the same
  warning also appears for transitional states that end coherent, so the
  final tree is the gate, not the install log). It also runs against the
  lockfile in `release:check`. No published range changed.

## 0.7.0

- NestJS 12 support: the published `@nestjs/common` and `@nestjs/core` peer
  ranges widen from `^11.0.0` to `^11.0.0 || ^12.0.0`. The only code change is
  internal: NestJS 12 is ESM-only and its exports map resolves files, not
  directory indexes, so the deep import of `Controller` from
  `@nestjs/common/interfaces` (a directory) failed to compile against 12; it is
  now a local `type Controller = object` alias, which is how Nest 12 defines the
  type. A new package test (`nestjs-deep-imports.spec.ts`) scans every
  `@nestjs/*` deep import and fails if it targets anything but a real file, so
  the trap cannot come back. Repo tooling: the devDependencies and lockfile stay
  on 11 (the default suite keeps testing it) and a dedicated CI leg
  (`nestjs-latest-major`) installs the 12 set on top of the lockfile, proves
  every workspace resolves 12 (`scripts/check-nestjs-major.mjs`), and runs the
  suite and every sample against it. Dependabot now groups the `@nestjs/*`
  peer set across majors too, so the next major arrives as one installable PR
  instead of one ERESOLVE per package. Docs: support policy, installation,
  README compatibility table, claims matrix, and the Nest-internals upgrade
  checklist state the widened range; the support policy notes that NestJS 12
  orders lifecycle hooks by component hierarchy level (this package assumes no
  cross-provider hook order). The package README (`packages/trpc/README.md`,
  the one npm shows) still said Node `>=20` / NestJS `11.x` — the Node 20
  sunset had missed it too — and now matches; a new release check
  (`scripts/check-compat-tables.mjs`, in `npm run release:check`) pins both
  README compatibility tables, the support policy, installation, and the
  guidelines' support line to the manifest's `engines` floor and `@nestjs/*`
  peer range. The Node floor stays `>=22`; every place that states it now says
  NestJS 12 needs `>=22.12` of it (a CommonJS app loads the ESM-only 12
  through Node's `require(esm)`).
- Tests + internal: closed the mutation-testing survivors surfaced in the
  generators and param metadata — added a `param-metadata` guard test (an
  `undefined` propertyKey must not attach metadata to a property literally named
  `"undefined"`), plus generator/serializer/module/constants specs. Simplified
  three equivalent-mutant branches (dropped a redundant `'utf-8'` write
  encoding and an unused indent variable in the schema generator; folded the
  `any`/`lazy`/`nativeEnum` cases into the shared `z.any()` fallback in the zod
  serializer). Behavior-neutral, 100% coverage. Docs: reframed mutation-testing
  guidance as an occasional, scoped audit (not a per-PR gate).
- Stryker mutation testing (repo tooling; nothing ships in the package):
  `npm run test:mutation` (incremental) / `npm run test:mutation:full`, with
  `STRYKER_MUTATE` scoping (comma-separated globs). Opt-in and local-only —
  CI is unchanged. See the new "Mutation testing" section in
  GUIDELINES_NEST_TRPC.md.

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
