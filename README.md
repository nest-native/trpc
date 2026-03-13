# nest-trpc-native
Native, decorator-first tRPC integration for NestJS. Build typesafe APIs with full support for Nest dependency injection, guards, and interceptors.

This package was built to feel like an official `@nestjs/*` module (same DX as `@nestjs/graphql` and `@nestjs/websockets`).

## Features

- Full NestJS enhancer pipeline (`@UseGuards`, `@UseInterceptors`, `ValidationPipe`, `@UseFilters`, request-scoped providers)
- Decorator-first API (`@Router`, `@Query`, `@Mutation`, `@Subscription`, `@TrpcContext`)
- Code-first schema generation (`autoSchemaFile`) → instant end-to-end type safety
- Supports **both** validation styles in the same router (Zod + class-validator DTOs)
- Adapter-agnostic (Express & Fastify — zero code changes)
- Full dependency injection + lifecycle hooks
- Perfectly mirrors the philosophy of the original Sample 37

## Installation

```bash
npm install nestjs-trpc @trpc/server zod
# or
pnpm add nestjs-trpc @trpc/server zod