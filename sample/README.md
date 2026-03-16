# Samples

This folder uses a hybrid model:

- `00-showcase`: full end-to-end baseline with all major capabilities together.
- `01-*` onward: focused runnable extractions, each isolating one topic.

## Quick Start

```bash
npm run start --workspace nest-trpc-native-showcase
npm run client --workspace nest-trpc-native-showcase
npm run client:subscription --workspace nest-trpc-native-showcase
npm run ci:sample
```

## Focused Samples

| Folder | Focus | State | Command |
| --- | --- | --- | --- |
| `00-showcase` | Full integration baseline | Runnable | `npm run test --workspace nest-trpc-native-showcase` |
| `01-basics-query-mutation` | Router basics | Runnable | `npm run test --workspace nest-trpc-native-sample-01-basics` |
| `02-enhancers-guards-pipes-filters` | Guards/interceptors/pipes/filters | Runnable | `npm run test --workspace nest-trpc-native-sample-02-enhancers` |
| `03-context-request-scope` | `@TrpcContext` + request scope | Runnable | `npm run test --workspace nest-trpc-native-sample-03-context` |
| `04-validation-zod` | Zod validation and inference | Runnable | `npm run test --workspace nest-trpc-native-sample-04-zod` |
| `05-validation-class-validator` | DTO + `ValidationPipe` | Runnable | `npm run test --workspace nest-trpc-native-sample-05-class-validator` |
| `06-subscriptions` | Server/client subscriptions | Runnable | `npm run test --workspace nest-trpc-native-sample-06-subscriptions` |
| `07-express-fastify` | Adapter parity | Runnable | `npm run test --workspace nest-trpc-native-sample-07-adapters` |
| `08-autoschema-client-typecheck` | `autoSchemaFile` + typed client checks | Runnable | `npm run test --workspace nest-trpc-native-sample-08-autoschema` |
| `09-forrootasync-config-middleware` | `forRootAsync` + `ConfigService` + middleware | Runnable | `npm run test --workspace nest-trpc-native-sample-09-config-middleware` |
| `10-nested-alias-routers` | Dotted aliases as nested router objects | Runnable | `npm run test --workspace nest-trpc-native-sample-10-nested-alias` |
| `11-microservice-transport` | tRPC gateway + Nest microservice transport (TCP) | Runnable | `npm run test --workspace nest-trpc-native-sample-11-microservice` |

Use `docs/samples/INDEX.md` for file-level pointers and `docs/samples/ARCHITECTURE.md` for structural rationale.
