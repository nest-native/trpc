<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Official tRPC integration for NestJS with decorator-first router classes and full Nest enhancer lifecycle support.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs/trpc"><img src="https://img.shields.io/npm/v/@nestjs/trpc.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestjs/trpc"><img src="https://img.shields.io/npm/l/@nestjs/trpc.svg" alt="Package License" /></a>
  <a href="https://docs.nestjs.com"><img src="https://img.shields.io/badge/docs-nestjs-e0234e.svg" alt="Documentation" /></a>
</p>

## Description

`@nestjs/trpc` makes tRPC feel native in Nest applications:

- Module setup via `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- Decorator-based routers with `@Router()`, `@Query()`, `@Mutation()`, `@Subscription()`
- Explicit parameter extraction via `@Input()` and `@TrpcContext()`
- Full support for guards, interceptors, pipes, filters, and request scope
- Adapter-agnostic behavior across Express and Fastify

## Getting Started

[Overview & Tutorial](https://docs.nestjs.com/recipes/trpc)

## Installation

```bash
npm i @nestjs/trpc @trpc/server
```

Peer dependencies:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Optional (recommended for schema inference and validation):

```bash
npm i zod
```

## Quick Start

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

## Showcase

A full production-style showcase lives in `example/showcase` and demonstrates:

- Modular router composition with constructor DI
- Mixed validation (`zod` + `class-validator`)
- Guards, pipes, interceptors, and filters on procedures
- Typed client generation and compile-time checks
- Express and Fastify runtime entrypoints

## License

Nest is [MIT licensed](LICENSE).
