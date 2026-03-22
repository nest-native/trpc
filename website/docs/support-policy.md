---
sidebar_position: 3
---

# Support Policy

This page defines the supported contract for the current `0.3.x` stabilization line.

## Runtime Compatibility

- Node.js `>=20`
- NestJS `11.x`
- tRPC `11.x`

## Supported Adapters

- Express
- Fastify

Your router classes and decorators should work the same across both adapters.

## Validation Support

- Zod is supported and remains optional.
- `class-validator` + `ValidationPipe` DTO workflows are supported.
- Mixed validation strategies in the same application are supported.

## Supported Public API

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

## Unsupported Internal Surface

The following are implementation details and should not be treated as stable application APIs:

- deep imports into package internals such as `nest-trpc-native/dist/...`
- internal context/runtime helpers
- raw schema generator helpers
- transport internals such as `TrpcHttpAdapter`
- metadata constants and DI tokens intended for package internals

These internals may change during `0.x` stabilization without being treated as a breaking change.
