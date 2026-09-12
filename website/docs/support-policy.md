---
sidebar_position: 3
---

# Support Policy

This page defines the supported contract for the current `0.3.x` stabilization line.

## Runtime Compatibility

- Node.js `>=22` (`>=22.12` to load NestJS 12 from CommonJS)
- NestJS `^11.0.0 || ^12.0.0`
- tRPC `11.x`

Both ends of the NestJS range are tested claims. The default suite and samples run on the lockfile's 11.x; the `nestjs-compat` CI matrix installs each end on top of it and runs the suite and every sample against it. The published range is `^11.0.0 || ^12.0.0`; the oldest installable 11 graph we run is `11.0.0`, pinned exactly, because nothing this package uses was added by a later 11.x — with `@nestjs/platform-fastify` at `11.0.2`, the first fastify release whose peers admit NestJS 11 (11.0.0 and 11.0.1 were published peering `^10`). The other leg floats on `^12.0.0`. Each leg proves it is testing the tree it claims to: `scripts/check-nestjs-resolution.mjs` requires the exact version from inside every workspace and checks every peer range in the NestJS ecosystem against the final tree, which catches the peer conflicts npm merely warns about.

NestJS 12 notes:

- NestJS 12 is ESM-only. A CommonJS app (this package publishes CommonJS) loads it through Node's `require(esm)`, which is unflagged on Node `>=22.12`. That is within this package's `>=22` line, but Node 22.0–22.11 cannot load NestJS 12 — run NestJS 12 on Node `>=22.12` or 24. The `engines` floor stays `>=22` because the NestJS 11 end runs on any Node 22.
- NestJS 12 orders lifecycle hooks (`onModuleInit`, `onApplicationBootstrap`, and the shutdown hooks) by component hierarchy level rather than by registration order. This package does not assume any cross-provider hook order, and application code should not either.

## Supported Adapters

- Express
- Fastify

Your router classes and decorators should work the same across both adapters.

## Validation Support

- Zod `4.x` is supported and remains optional.
- `class-validator` + `ValidationPipe` DTO workflows are supported.
- Mixed validation strategies in the same application are supported.

## Supported Public API

The package has three support tiers. Keeping those tiers distinct prevents quick-start docs from accidentally turning testing helpers or internals into application APIs.

### Primary onboarding API

These are the APIs intended for installation docs, quick starts, and copy-paste usage:

- `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- `@Router()`
- `@Query()`
- `@Mutation()`
- `@Subscription()`
- `@Input()`
- `@TrpcContext()`
- generated `AppRouter` types via `autoSchemaFile`

### Advanced testing API

- `TrpcRouter` is supported for in-process testing via `getRouter().createCaller(...)`.

`TrpcRouter` should stay in testing-oriented guidance. It should not replace the normal application setup path based on `TrpcModule`, decorators, and generated `AppRouter` types.

### Low-level compatibility exports

These exports are public because they are part of the current top-level package entrypoint, but they are not onboarding APIs:

- `ProcedureType`
- `TrpcParamtype`

They are intended for compatibility with existing low-level metadata or test integrations. New application code should usually not need them. If future `0.x` work removes or replaces them, the project should document that migration separately instead of silently changing the package entrypoint.

## Unsupported Internal Surface

The following are implementation details and should not be treated as stable application APIs:

- deep imports into package internals such as `@nest-native/trpc/dist/...`
- internal context/runtime helpers
- raw schema generator helpers
- transport internals such as `TrpcHttpAdapter`
- metadata constants and DI tokens intended for package internals

These internals may change during `0.x` stabilization without being treated as a breaking change.

For a table view of the current exports and evidence behind public claims, see [Public API Reference](./reference/public-api) and [Claims Matrix](./reference/claims-matrix).
