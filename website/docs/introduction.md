---
sidebar_position: 1
slug: /introduction
---

# Introduction

**nest-trpc-native** is a decorator-first tRPC integration for NestJS that makes tRPC feel native in Nest applications.

## Why nest-trpc-native?

NestJS has a proven architecture with guards, interceptors, pipes, filters, and dependency injection. tRPC offers end-to-end type safety with zero code generation overhead. This package brings them together so you can build type-safe APIs using familiar Nest patterns.

## Key Features

- **Module setup** via `TrpcModule.forRoot()` / `TrpcModule.forRootAsync()`
- **Decorator-based routers** with `@Router()`, `@Query()`, `@Mutation()`, `@Subscription()`
- **Parameter extraction** via `@Input()` and `@TrpcContext()`
- **Full enhancer support** — guards, interceptors, pipes, filters, request scope
- **Adapter-agnostic** — works with Express and Fastify
- **Auto schema generation** — exports typed `AppRouter` for the client
- **Zero runtime dependencies** — pure bridge using only peer deps
- **Zod optional** — use Zod schemas or class-validator DTOs

## How It Works

1. Register `TrpcModule` in your root module
2. Create router classes decorated with `@Router()`
3. Define procedures using `@Query()`, `@Mutation()`, or `@Subscription()`
4. Apply Nest enhancers (`@UseGuards()`, `@UseInterceptors()`, etc.) as usual
5. Import the auto-generated `AppRouter` type on the client

```
┌──────────────────────────────────────────────┐
│                  NestJS App                  │
│                                              │
│   @Router('cats')                            │
│   ├── @Query()    list()                     │
│   ├── @Mutation() create(@Input() input)     │
│   └── @UseGuards(AuthGuard)                  │
│                                              │
│   TrpcModule.forRoot({ path: '/trpc' })      │
│       ↓                                      │
│   Guards → Pipes → Handler → Interceptors    │
│       ↓                                      │
│   tRPC HTTP Adapter (Express / Fastify)      │
└──────────────────────────────────────────────┘
         ↕ type-safe RPC calls
┌──────────────────────────────────────────────┐
│              Client (any runtime)            │
│   import { AppRouter } from '@generated'     │
│   const trpc = createTRPCProxyClient<…>()    │
│   trpc.cats.list.query()                     │
└──────────────────────────────────────────────┘
```

## Next Steps

- [Installation](./installation) — set up the package
- [Quick Start](./quick-start) — build your first router in minutes
