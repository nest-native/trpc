<p align="center">Decorator-first tRPC integration for NestJS with full Nest lifecycle support.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nest-trpc-native"><img src="https://img.shields.io/npm/v/nest-trpc-native.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nest-trpc-native"><img src="https://img.shields.io/npm/dm/nest-trpc-native.svg" alt="NPM Downloads" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/coverage-100%25-brightgreen.svg" alt="Test Coverage" />
  <a href="https://rodrigobnogueira.github.io/nest-trpc-native/"><img src="https://img.shields.io/badge/docs-nest--trpc--native-e0234e.svg" alt="Documentation" /></a>
</p>

## What This Is

`nest-trpc-native` is a community NestJS integration for building tRPC APIs with Nest-style modules, decorators, DI, enhancers, and request scope.

The documentation site is the canonical source of truth for usage guides and support policy:

- [Introduction](https://rodrigobnogueira.github.io/nest-trpc-native/docs/introduction)
- [Quick Start](https://rodrigobnogueira.github.io/nest-trpc-native/docs/quick-start)
- [Samples](https://rodrigobnogueira.github.io/nest-trpc-native/docs/samples)
- [Support Policy](https://rodrigobnogueira.github.io/nest-trpc-native/docs/support-policy)

## Why Use It

`nest-trpc-native` makes tRPC feel native in Nest applications:

- Module setup via `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- Decorator-based routers with `@Router()`, `@Query()`, `@Mutation()`, `@Subscription()`
- Explicit parameter extraction via `@Input()` and `@TrpcContext()`
- Nest enhancer support for guards, interceptors, pipes, filters, and request scope
- Adapter-agnostic behavior across Express and Fastify
- Zod or `class-validator` validation, without forcing either style on every project
- Generated `AppRouter` types for fully typed tRPC clients

## Compatibility

| Runtime | Supported line |
| --- | --- |
| Node.js | `>=20` |
| NestJS | `11.x` |
| tRPC | `11.x` |
| Zod | `4.x`, optional peer |
| Adapters | Express, Fastify |

For the supported API surface and compatibility policy, see [website/docs/support-policy.md](website/docs/support-policy.md).

## Repository Layout

This repository contains:

- `packages/trpc`: the `nest-trpc-native` integration package
- `sample/00-showcase`: the full end-to-end sample app
- `sample/01-*` onward: focused runnable samples for single-topic onboarding
- `sample/12-angular-fullstack-showcase`: browser-client showcase using Angular with `@trpc/client`

## Sample Layout

| Folder | Focus | Command |
| --- | --- | --- |
| `sample/00-showcase` | Full production-style integration baseline | `npm run test --workspace nest-trpc-native-showcase` |
| `sample/01-basics-query-mutation` | Query and mutation essentials | `npm run test --workspace nest-trpc-native-sample-01-basics` |
| `sample/02-enhancers-guards-pipes-filters` | Guards, interceptors, pipes, filters | `npm run test --workspace nest-trpc-native-sample-02-enhancers` |
| `sample/03-context-request-scope` | `@TrpcContext` and request scope | `npm run test --workspace nest-trpc-native-sample-03-context` |
| `sample/04-validation-zod` | Zod validation and inference | `npm run test --workspace nest-trpc-native-sample-04-zod` |
| `sample/05-validation-class-validator` | DTOs with `ValidationPipe` | `npm run test --workspace nest-trpc-native-sample-05-class-validator` |
| `sample/06-subscriptions` | Subscription handlers and clients | `npm run test --workspace nest-trpc-native-sample-06-subscriptions` |
| `sample/07-express-fastify` | Express/Fastify adapter parity | `npm run test --workspace nest-trpc-native-sample-07-adapters` |
| `sample/08-autoschema-client-typecheck` | `autoSchemaFile` and typed clients | `npm run test --workspace nest-trpc-native-sample-08-autoschema` |
| `sample/09-forrootasync-config-middleware` | `forRootAsync`, config, middleware | `npm run test --workspace nest-trpc-native-sample-09-config-middleware` |
| `sample/10-nested-alias-routers` | Nested router aliases | `npm run test --workspace nest-trpc-native-sample-10-nested-alias` |
| `sample/11-microservice-transport` | tRPC gateway with Nest microservice transport | `npm run test --workspace nest-trpc-native-sample-11-microservice` |
| `sample/12-angular-fullstack-showcase` | Angular browser client + NestJS backend | `npm run test --workspace nest-trpc-native-sample-12-angular-showcase` |

Start with `sample/00-showcase` for end-to-end behavior, then use [sample/README.md](sample/README.md) and [website/docs/samples/index.md](website/docs/samples/index.md) to jump to specific features.

## Setup Patterns

For explicit monorepo and microservice transport topologies, see [website/docs/advanced/monorepo.md](website/docs/advanced/monorepo.md) and [website/docs/advanced/microservices.md](website/docs/advanced/microservices.md).

For explicit `forRootAsync + ConfigService + middleware`, run:

- `npm run test --workspace nest-trpc-native-sample-09-config-middleware`

## Installation

```bash
npm i nest-trpc-native @trpc/server
```

Required peers:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

Optional (recommended for schema inference and tRPC-style validation, Zod v4):

```bash
npm i zod@^4
```

## Zero Runtime Dependencies

`nest-trpc-native` is intentionally a bridge package with an empty runtime dependency block (`"dependencies": {}`).

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

- If you use Nest-style validation (`class-validator` + `ValidationPipe`), you can use `nest-trpc-native` without Zod schemas.
- If you use tRPC-style schema definitions (`@Query({ input: z.object(...) })`, `@Mutation({ output: ... })`) and schema generation based on those schemas, then your app should install Zod v4.

We support Zod v4 as an optional peer dependency so non-Zod users are not forced to install it.

## Nest Compatibility Boundary

Enhancer lifecycle behavior is preserved through a narrow internal boundary so Nest-version-sensitive wiring stays isolated. See [website/docs/advanced/nest-internals.md](website/docs/advanced/nest-internals.md).

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

## Typed Context

Both `TrpcModule.forRoot()` and `TrpcModule.forRootAsync()` accept an optional generic that types the `createContext` return value. This gives you compile-time safety and autocompletion on your context factory without changing any runtime behavior.

```ts
interface MyContext {
  requestId: string;
  userId?: number;
}

// Static configuration
TrpcModule.forRoot<MyContext>({
  createContext: ({ req }) => ({
    requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
    userId: extractUserId(req),
  }),
});

// Async configuration
TrpcModule.forRootAsync<MyContext>({
  useFactory: (config: ConfigService) => ({
    createContext: ({ req }) => ({
      requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
      // TypeScript error if you forget `userId` or add unknown fields
    }),
  }),
  inject: [ConfigService],
});
```

The generic defaults to `any`, so existing code without the type parameter continues to work unchanged.

## Workspace Commands

```bash
npm install
npm run build
npm run test
npm run ci:sample
```

`ci:showcase` remains as a compatibility alias.

## Sample Commands

```bash
npm run start --workspace nest-trpc-native-showcase
npm run start:fastify --workspace nest-trpc-native-showcase
npm run client --workspace nest-trpc-native-showcase
npm run sample:focused
```

For sample details, open [sample/README.md](sample/README.md) and [sample/00-showcase/README.md](sample/00-showcase/README.md).
