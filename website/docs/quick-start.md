---
sidebar_position: 3
---

# Quick Start

Build a fully typed tRPC API in a single NestJS module.

## With Zod

```ts
import { Module } from '@nestjs/common';
import {
  Input,
  Mutation,
  Query,
  Router,
  TrpcContext,
  TrpcModule,
} from 'nest-trpc-native';
import { z } from 'zod';

const CreateUserSchema = z.object({ name: z.string().min(1) });

@Router('users')
class UsersRouter {
  @Query({ output: z.array(z.object({ id: z.string(), name: z.string() })) })
  list(@TrpcContext('requestId') requestId: string) {
    return [{ id: requestId, name: 'Ada' }];
  }

  @Mutation({ input: CreateUserSchema })
  create(@Input() input: { name: string }) {
    return { id: '1', ...input };
  }
}

@Module({
  imports: [
    TrpcModule.forRoot({
      path: '/trpc',
      autoSchemaFile: 'src/@generated/server.ts',
    }),
  ],
  providers: [UsersRouter],
})
export class AppModule {}
```

## Without Zod (class-validator)

```ts
import { Module, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { Input, Mutation, Query, Router, TrpcModule } from 'nest-trpc-native';

class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

@Router('users')
class UsersRouter {
  @Query()
  list() {
    return [{ id: '1', name: 'Ada' }];
  }

  @Mutation()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Input() input: CreateUserDto) {
    return { id: '2', ...input };
  }
}

@Module({
  imports: [
    TrpcModule.forRoot({
      path: '/trpc',
      autoSchemaFile: 'src/@generated/server.ts',
    }),
  ],
  providers: [UsersRouter],
})
export class AppModule {}
```

## Client Usage

After starting the server, create a type-safe client:

```ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './@generated/server';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

// Fully typed — IDE autocompletion works here
const users = await trpc.users.list.query();
const created = await trpc.users.create.mutate({ name: 'Bob' });
```

## What's Next?

- [Module Setup](./module-setup/for-root) — configure `TrpcModule` options
- [Decorators](./decorators/router) — `@Router`, `@Query`, `@Mutation`, `@Subscription`
- [Enhancers](./enhancers/guards) — guards, interceptors, pipes, filters
- [Router Testing](./testing/router-testing) — in-process, HTTP smoke, and client typecheck layers
- [Idiomatic Error Handling](./errors/idiomatic-errors) — Nest exceptions, filters, and tRPC codes
- [Migration from REST/GraphQL](./advanced/migration-from-rest-or-graphql) — map existing controllers/resolvers to routers
