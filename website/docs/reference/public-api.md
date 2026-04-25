---
sidebar_position: 1
---

# Public API Reference

This page documents the current top-level package entrypoint. It is intentionally narrower than the implementation surface in `packages/trpc`.

Import from the package root:

```ts
import { Router, Query, TrpcModule } from 'nest-trpc-native';
```

Do not deep-import from `nest-trpc-native/dist/...` or package internals.

## Primary Onboarding API

These are the APIs intended for installation docs, quick starts, samples, and normal application code.

| Export | Purpose | Notes |
| --- | --- | --- |
| `TrpcModule` | Registers the tRPC endpoint and router discovery in a Nest module. | Use `forRoot()` or `forRootAsync()`. |
| `Router` | Marks a class as a tRPC router. | Accepts an optional alias such as `users` or `admin.users`. |
| `Query` | Marks a method as a tRPC query procedure. | Can receive `input` and `output` schemas. |
| `Mutation` | Marks a method as a tRPC mutation procedure. | Can receive `input` and `output` schemas. |
| `Subscription` | Marks a method as a tRPC subscription procedure. | Async generators are the recommended model. |
| `Input` | Injects the full input or an input field into a procedure parameter. | Works with Zod and DTO validation. |
| `TrpcContext` | Injects the full context or a context field into a procedure parameter. | Context comes from `createContext`. |
| `TrpcModuleOptions` | Type for static module configuration. | Type-only export. |
| `TrpcModuleAsyncOptions` | Type for async module configuration. | Type-only export. |

## Advanced Testing API

| Export | Purpose | Support tier |
| --- | --- | --- |
| `TrpcRouter` | Lets tests access `getRouter().createCaller(...)` after a Nest testing module initializes. | Supported for testing and advanced in-process callers. |

`TrpcRouter` is intentionally absent from installation and quick-start examples. Prefer real application setup through `TrpcModule` and decorator-discovered routers.

## Low-Level Compatibility Exports

| Export | Purpose | Guidance |
| --- | --- | --- |
| `ProcedureType` | Procedure kind enum used internally by metadata and schema generation. | Public for current compatibility, but not needed for normal application code. |
| `TrpcParamtype` | Parameter metadata enum used internally by `@Input()` and `@TrpcContext()`. | Public for current compatibility, but not needed for normal application code. |

These exports remain in the root entrypoint today because the package currently tests them as part of the public entrypoint. Treat them as low-level compatibility exports, not as recommended extension points.

## Unsupported Internals

These are not supported application APIs:

- deep imports into package internals
- metadata constants and DI tokens
- context/runtime helper classes
- schema generator helper functions
- transport internals such as `TrpcHttpAdapter`
- request storage internals

If an application needs one of these internals, open a feature request describing the use case so the project can consider a supported abstraction.
