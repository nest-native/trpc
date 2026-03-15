---
sidebar_position: 1
---

# TrpcModule.forRoot()

The simplest way to register the tRPC integration. Use this when your configuration is static and doesn't depend on injected providers.

## Basic Usage

```ts
import { Module } from '@nestjs/common';
import { TrpcModule } from 'nest-trpc-native';

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
