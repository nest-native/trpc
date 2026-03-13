# NestJS tRPC Showcase

Official `@nestjs/trpc` showcase (evolved from Sample 37) demonstrating rich, production-style NestJS integration.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| Aliased sub-routers | `cats.router.ts`, `users.router.ts` |
| Flat root procedures | `health.router.ts` |
| Query/mutation/subscription procedures | `cats.router.ts`, `users.router.ts`, `health.router.ts` |
| Zod input/output schemas | `cats.schema.ts`, `users.schema.ts`, `health.schema.ts` |
| Auto-generated typed `AppRouter` | `app.module.ts` + `generate-types.ts` |
| Type-safe query/mutation client | `client.ts` |
| Type-safe subscription client | `subscription-client.ts` |
| Compile-time client typecheck | `client.typecheck.ts` + `typecheck:client` |
| Nest guards/interceptors/pipes | `auth.guard.ts`, `logging.interceptor.ts`, `trim.pipe.ts` |
| Class-validator DTO validation | `users.router.ts`, `users/create-user.dto.ts` |
| Exception filter remapping | `remap-bad-request.filter.ts`, `users.router.ts` |
| Decorator param extraction | `@Input()` and `@TrpcContext()` |
| Express and Fastify entrypoints | `main.ts`, `main-fastify.ts` |

## Run

```bash
npm run start
npm run client
npm run client:subscription
npm run start:fastify
```

## CI-Oriented Checks

```bash
npm run typecheck:client
npm run smoke:express
npm run smoke:fastify
```
