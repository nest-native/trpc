<p align="center">Decorator-first tRPC integration for NestJS with full Nest enhancer lifecycle support.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nest-trpc-native"><img src="https://img.shields.io/npm/v/nest-trpc-native.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nest-trpc-native"><img src="https://img.shields.io/npm/dm/nest-trpc-native.svg" alt="NPM Downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <a href="https://docs.nestjs.com"><img src="https://img.shields.io/badge/docs-nestjs-e0234e.svg" alt="Documentation" /></a>
</p>

## Description

`nest-trpc-native` makes tRPC feel native in Nest applications:

- Module setup via `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- Decorator-based routers with `@Router()`, `@Query()`, `@Mutation()`, `@Subscription()`
- Explicit parameter extraction via `@Input()` and `@TrpcContext()`
- Full support for guards, interceptors, pipes, filters, and request scope
- Adapter-agnostic behavior across Express and Fastify

## Getting Started

See the `showcase` folder in this repository for the full end-to-end sample.

## Installation

```bash
npm i nest-trpc-native @trpc/server
```

Peer dependencies:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Optional (recommended for schema inference and validation):

```bash
npm i zod
```

## Zero Runtime Dependency Design

`nest-trpc-native` intentionally keeps its runtime dependency block empty (`"dependencies": {}`).

Why this is intentional:

- This package is an integration layer (NestJS <-> tRPC), not a standalone runtime.
- NestJS and tRPC should come from the host application to avoid version duplication and container mismatches.
- Core features here rely on peer/runtime primitives already present in Nest apps:
  - metadata reflection (`reflect-metadata`)
  - Nest DI/discovery (`@nestjs/common`, `@nestjs/core`)
  - tRPC adapters (`@trpc/server`)
  - Node built-ins for file generation (`fs`, `path`)

## Why Zod Is Optional (and When You Need It)

Short answer: **Zod is not mandatory** for the package to work.

- If you prefer classic Nest validation (`class-validator` + `ValidationPipe`), you can use this package without Zod-specific decorators/schemas.
- If you use tRPC-style schema definitions (`@Query({ input: z.object(...) })`, `@Mutation({ output: ... })`) and `autoSchemaFile` generation for those schemas, then Zod is required by your app code.

Should we remove Zod support entirely?

- We should **not** remove it: Zod support is a core part of the tRPC-first DX and one of the main interoperability goals.
- Keeping `zod` as an **optional peer dependency** is the best balance:
  - no forced runtime dependency
  - clear compatibility contract when users choose Zod
  - full support for mixed validation strategies in the same project

## Quick Start

### Non-Zod (class-validator + ValidationPipe)

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

## Showcase

A full production-style showcase lives in `showcase` and demonstrates:

- Modular router composition with constructor DI
- Mixed validation (`zod` + `class-validator`)
- Guards, pipes, interceptors, and filters on procedures
- Typed client generation and compile-time checks
- Express and Fastify runtime entrypoints

## License

This project is [MIT licensed](LICENSE).
