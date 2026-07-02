---
sidebar_position: 1
---

# TrpcModule.forRoot()

The simplest way to register the tRPC integration. Use this when your configuration is static and doesn't depend on injected providers.

## Basic Usage

```ts
import { Module } from '@nestjs/common';
import { TrpcModule } from '@nest-native/trpc';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: '/trpc',
    }),
  ],
})
export class AppModule {}
```

## Options

| Option | Type | Description |
|---|---|---|
| `path` | `string` | The HTTP path where tRPC procedures are served (e.g. `'/trpc'`) |
| `autoSchemaFile` | `string` | Path for auto-generated `AppRouter` type file |
| `createContext` | `(opts) => TContext` | Factory function to create tRPC context per request |
| `transformer` | `DataTransformer` | tRPC data transformer (e.g. `superjson`), forwarded to `initTRPC.create({ transformer })` |
| `errorFormatter` | `TRPCErrorFormatter` | Custom error shape, forwarded to `initTRPC.create({ errorFormatter })` |
| `responseMeta` | `ResponseMetaFn` | Per-response HTTP status/headers hook (e.g. `Cache-Control`), forwarded to the tRPC request handler |
| `onError` | `HTTPErrorHandler` | Centralized error logging/reporting hook, forwarded to the tRPC request handler |

## With Schema Generation

```ts
TrpcModule.forRoot({
  path: '/trpc',
  autoSchemaFile: 'src/@generated/server.ts',
});
```

This generates a TypeScript file exporting your `AppRouter` type, which clients import for end-to-end type safety.

## With Context

```ts
TrpcModule.forRoot({
  path: '/trpc',
  autoSchemaFile: 'src/@generated/server.ts',
  createContext: ({ req }) => ({
    requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
  }),
});
```

See [Typed Context](./typed-context) for compile-time type safety on the context factory.

## With a Data Transformer

Pass a tRPC [data transformer](https://trpc.io/docs/server/data-transformers) such as `superjson` so values like `Date`, `Map`, and `Set` round-trip between server and client:

```ts
import superjson from 'superjson';

TrpcModule.forRoot({
  path: '/trpc',
  autoSchemaFile: 'src/@generated/server.ts',
  transformer: superjson,
});
```

The client must configure the **same** transformer on its terminating link:

```ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './@generated/server';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc', transformer: superjson })],
});
```

When `transformer` and `autoSchemaFile` are combined, the generated `AppRouter` type is marked transformer-enabled, so typed clients get a **compile-time error** if they forget the link transformer, and transformed outputs such as `Date` are inferred as `Date` rather than `string`.

## With an Error Formatter

Use `errorFormatter` to reshape the error payload sent to clients. It runs **after** the built-in `HttpException` → `TRPCError` mapping, so `error.code` is already the mapped tRPC code. The canonical recipe exposes flattened Zod issues:

```ts
import { z, ZodError } from 'zod';

TrpcModule.forRoot({
  path: '/trpc',
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
          ? z.flattenError(error.cause)
          : null,
    },
  }),
});
```

Clients then read `error.data.zodError.fieldErrors` to render per-field messages.

## With Response Meta and Error Reporting

`responseMeta` sets per-response HTTP status/headers (the standard place for `Cache-Control`), and `onError` is the centralized hook for logging and reporting failures:

```ts
TrpcModule.forRoot({
  path: '/trpc',
  responseMeta: ({ type, errors, eagerGeneration }) => ({
    headers:
      type === 'query' && errors.length === 0 && !eagerGeneration
        ? { 'cache-control': 'public, max-age=60' }
        : {},
  }),
  onError: ({ error, path }) => {
    console.error(`tRPC error on "${path}": ${error.message}`);
  },
});
```

`responseMeta` headers are applied to both JSON responses and streamed SSE subscription responses. For SSE, the hook runs eagerly (`eagerGeneration: true`) before the first chunk is written, so a returned `status` cannot rewrite an already-streaming response.

All four options are forwarded to tRPC untouched and add no runtime dependencies to the package. See [`sample/13-transformer-error-formatting`](https://github.com/nest-native/trpc/tree/main/sample/13-transformer-error-formatting) for a runnable demonstration.
