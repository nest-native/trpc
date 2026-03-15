---
sidebar_position: 2
---

# Monorepo Setup

Pattern for using `nest-trpc-native` in a monorepo with shared types.

## Recommended Structure

```
.
├─ apps/
│  ├─ api-gateway/               # Nest app hosting TrpcModule
│  └─ web-client/                # Frontend using @trpc/client
├─ packages/
│  ├─ nest-trpc-native/          # This library (or npm dependency)
│  ├─ api-contract/              # Shared types / generated AppRouter exports
│  └─ domain-services/           # Shared business logic modules
└─ package.json                  # npm workspaces / pnpm / nx / turborepo
```

## Gateway Module

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrpcModule } from 'nest-trpc-native';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TrpcModule.forRootAsync<AppTrpcContext>({
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
  providers: [UsersRouter, OrdersRouter],
})
export class AppModule {}
```

## Sharing the AppRouter Type

Export the generated `AppRouter` type from a shared package so all clients import the same type:

```ts title="packages/api-contract/index.ts"
export type { AppRouter } from '../api-gateway/src/@generated/server';
```

```ts title="apps/web-client/src/trpc.ts"
import type { AppRouter } from '@my-org/api-contract';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: '/trpc' })],
});
```
