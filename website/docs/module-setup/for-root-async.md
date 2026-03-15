---
sidebar_position: 2
---

# TrpcModule.forRootAsync()

Use `forRootAsync()` when your tRPC configuration depends on injected providers like `ConfigService`.

## Basic Usage

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrpcModule } from 'nest-trpc-native';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TrpcModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        path: config.get('TRPC_PATH') ?? '/trpc',
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => ({
          requestId: String(
            req.headers['x-request-id'] ?? crypto.randomUUID(),
          ),
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

## Options

`forRootAsync()` accepts the same async options pattern used throughout NestJS:

| Option | Type | Description |
|---|---|---|
| `useFactory` | `(...args) => TrpcModuleOptions` | Factory function receiving injected providers |
| `inject` | `any[]` | Tokens to inject into the factory |
| `imports` | `any[]` | Modules to import for provider resolution |

## With Middleware

You can combine `forRootAsync()` with NestJS middleware:

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTraceMiddleware).forRoutes(
      { path: 'trpc', method: RequestMethod.ALL },
      { path: 'trpc/(.*)', method: RequestMethod.ALL },
    );
  }
}
```

See the [`sample/09-forrootasync-config-middleware`](https://github.com/rodrigobnogueira/nest-trpc-native/tree/main/sample/09-forrootasync-config-middleware) sample for a full working example.
