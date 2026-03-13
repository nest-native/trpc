<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Decorator-first tRPC integration for NestJS with full Nest lifecycle support.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs/trpc"><img src="https://img.shields.io/npm/v/@nestjs/trpc.svg" alt="NPM Version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <a href="https://docs.nestjs.com"><img src="https://img.shields.io/badge/docs-nestjs-e0234e.svg" alt="Documentation" /></a>
</p>

## Description

This repository contains:

- `packages/trpc`: the `@nestjs/trpc` integration package
- `showcase`: a full sample app

`@nestjs/trpc` makes tRPC feel native in Nest applications:

- Module setup via `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- Decorator-based routers with `@Router()`, `@Query()`, `@Mutation()`, `@Subscription()`
- Explicit parameter extraction via `@Input()` and `@TrpcContext()`
- Full support for guards, interceptors, pipes, filters, and request scope
- Adapter-agnostic behavior across Express and Fastify

## Installation

```bash
npm i @nestjs/trpc @trpc/server
```

Required peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Optional (recommended for schema inference and tRPC-style validation):

```bash
npm i zod
```

## Zero Runtime Dependencies

`@nestjs/trpc` is intentionally a bridge package with an empty runtime dependency block (`"dependencies": {}`).

Why:

- It should not pull a second NestJS runtime into the app.
- The host app controls Nest/tRPC versions through peer dependencies.
- The integration relies on capabilities already present in Nest apps and Node:
  - reflection (`reflect-metadata`)
  - DI/discovery (`@nestjs/common`, `@nestjs/core`)
  - tRPC runtime/adapters (`@trpc/server`)
  - file/path generation via Node built-ins (`fs`, `path`)

## Is Zod Required?

No. Zod is optional.

- If you use Nest-style validation (`class-validator` + `ValidationPipe`), you can use `@nestjs/trpc` without Zod schemas.
- If you use tRPC-style schema definitions (`@Query({ input: z.object(...) })`, `@Mutation({ output: ... })`) and schema generation based on those schemas, then your app should install Zod.

We keep Zod support because it is core to tRPC-native DX, but we keep it optional so non-Zod users are not forced to install it.

## Quick Start

### Non-Zod (class-validator + ValidationPipe)

```ts
import { Module, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { Input, Mutation, Query, Router, TrpcModule } from '@nestjs/trpc';

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

### Zod

```ts
import { Module } from '@nestjs/common';
import {
  Input,
  Mutation,
  Query,
  Router,
  TrpcContext,
  TrpcModule,
} from '@nestjs/trpc';
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

## Workspace Commands

```bash
npm install
npm run build
npm run test
npm run ci:showcase
```

## Showcase Commands

```bash
npm run start --workspace @nestjs/trpc-showcase
npm run start:fastify --workspace @nestjs/trpc-showcase
npm run client --workspace @nestjs/trpc-showcase
```

For showcase-specific details, open `showcase/README.md`.
