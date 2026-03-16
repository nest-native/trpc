# Samples Index

This index is the fast path for onboarding and contribution.

## Focused Runnable Samples

| Sample | Topic | Command |
| --- | --- | --- |
| `sample/01-basics-query-mutation` | Query + mutation essentials | `npm run test --workspace nest-trpc-native-sample-01-basics` |
| `sample/02-enhancers-guards-pipes-filters` | Guards/interceptors/pipes/filters | `npm run test --workspace nest-trpc-native-sample-02-enhancers` |
| `sample/03-context-request-scope` | Context + request-scoped providers | `npm run test --workspace nest-trpc-native-sample-03-context` |
| `sample/04-validation-zod` | Zod input/output validation | `npm run test --workspace nest-trpc-native-sample-04-zod` |
| `sample/05-validation-class-validator` | DTO + ValidationPipe | `npm run test --workspace nest-trpc-native-sample-05-class-validator` |
| `sample/06-subscriptions` | Subscription handlers and clients | `npm run test --workspace nest-trpc-native-sample-06-subscriptions` |
| `sample/07-express-fastify` | Adapter parity | `npm run test --workspace nest-trpc-native-sample-07-adapters` |
| `sample/08-autoschema-client-typecheck` | AutoSchema + typed client checks | `npm run test --workspace nest-trpc-native-sample-08-autoschema` |
| `sample/09-forrootasync-config-middleware` | `forRootAsync` + `ConfigService` + middleware | `npm run test --workspace nest-trpc-native-sample-09-config-middleware` |
| `sample/10-nested-alias-routers` | Dotted aliases to nested router objects | `npm run test --workspace nest-trpc-native-sample-10-nested-alias` |
| `sample/11-microservice-transport` | tRPC gateway + Nest microservice transport (TCP) | `npm run test --workspace nest-trpc-native-sample-11-microservice` |

## Suggested Learning Paths

### 15-minute architecture tour

1. `sample/00-showcase/src/app.module.ts`
2. `sample/00-showcase/src/cats/cats.router.ts`
3. `sample/00-showcase/src/users/users.router.ts`
4. `sample/00-showcase/src/health.router.ts`
5. `sample/00-showcase/src/client.typecheck.ts`

### Enhancer pipeline deep dive

1. `sample/00-showcase/src/common/guards/auth.guard.ts`
2. `sample/00-showcase/src/common/interceptors/logging.interceptor.ts`
3. `sample/00-showcase/src/common/pipes/trim.pipe.ts`
4. `sample/00-showcase/src/common/filters/remap-bad-request.filter.ts`
5. `packages/trpc/context/trpc-context-creator.ts`

### Context and request scope

1. `sample/00-showcase/src/common/trpc-context.ts`
2. `sample/00-showcase/src/app.module.ts`
3. `sample/00-showcase/src/users/request-meta.service.ts`
4. `sample/00-showcase/scripts/smoke-express.ts`
5. `sample/00-showcase/scripts/smoke-fastify.ts`

## Feature-to-File Map

| Feature | Primary Files |
| --- | --- |
| `TrpcModule.forRootAsync` | `sample/00-showcase/src/app.module.ts` |
| `forRootAsync` with `ConfigService` | `sample/09-forrootasync-config-middleware/src/app.module.ts` |
| Dotted alias nesting (`admin.users`) | `sample/10-nested-alias-routers/src/admin/users.router.ts`, `sample/10-nested-alias-routers/src/admin/roles.router.ts`, `sample/10-nested-alias-routers/scripts/smoke.ts` |
| Gateway -> microservice transport (`ClientProxy.send`) | `sample/11-microservice-transport/src/orders/orders.router.ts`, `sample/11-microservice-transport/src/orders/orders-gateway.service.ts`, `sample/11-microservice-transport/src/microservice/orders.microservice.controller.ts`, `sample/11-microservice-transport/scripts/smoke.ts` |
| `@Router`, `@Query`, `@Mutation`, `@Subscription` | `sample/00-showcase/src/cats/cats.router.ts`, `sample/00-showcase/src/users/users.router.ts`, `sample/00-showcase/src/health.router.ts` |
| `@Input` and `@TrpcContext` | `sample/00-showcase/src/users/users.router.ts`, `sample/00-showcase/src/health.router.ts` |
| Nest middleware (`configure`) | `sample/09-forrootasync-config-middleware/src/app.module.ts`, `sample/09-forrootasync-config-middleware/src/common/middleware/request-trace.middleware.ts` |
| Guard integration | `sample/00-showcase/src/common/guards/auth.guard.ts` |
| Interceptor integration | `sample/00-showcase/src/common/interceptors/logging.interceptor.ts` |
| Pipe integration | `sample/00-showcase/src/common/pipes/trim.pipe.ts` |
| Filter integration | `sample/00-showcase/src/common/filters/remap-bad-request.filter.ts` |
| Request-scoped providers | `sample/00-showcase/src/users/request-meta.service.ts` |
| Zod validation | `sample/00-showcase/src/cats/cats.schema.ts`, `sample/00-showcase/src/users/users.schema.ts` |
| DTO validation (`class-validator`) | `sample/00-showcase/src/users/create-user.dto.ts`, `sample/00-showcase/src/users/users.router.ts` |
| Auto-generated router types | `sample/00-showcase/src/generate-types.ts`, `sample/00-showcase/src/@generated/server.ts` |
| Typed client checks | `sample/00-showcase/src/client.typecheck.ts` |
| Express/Fastify parity | `sample/00-showcase/src/main.ts`, `sample/00-showcase/src/main-fastify.ts`, `sample/00-showcase/scripts/smoke-*.ts` |

## Contribution Heuristics

1. Add or change behavior in `sample/00-showcase` first to keep one canonical runnable baseline.
2. If a topic grows beyond easy scanning, extract a focused runnable sample in `sample/0X-*`.
3. Keep each focused sample README short: goal, run command, key files, expected output.
4. Update this index whenever a new sample or major feature entry point is added.
