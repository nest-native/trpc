# Samples

This folder follows a two-layer model to keep navigation easy as features grow:

- `00-showcase`: full end-to-end sample with all major capabilities in one app.
- `01-*` and onward: focused sample slices organized by topic.

## Quick Start

```bash
npm run start --workspace nest-trpc-native-showcase
npm run client --workspace nest-trpc-native-showcase
npm run client:subscription --workspace nest-trpc-native-showcase
npm run ci:sample
```

## Sample Map

| Folder | Focus | Current State |
| --- | --- | --- |
| `00-showcase` | Full integration baseline | Active and runnable |
| `01-basics-query-mutation` | Router basics and simple procedures | Navigation scaffold |
| `02-enhancers-guards-pipes-filters` | Guards/interceptors/pipes/filters | Navigation scaffold |
| `03-context-request-scope` | `@TrpcContext` and request-scoped DI | Navigation scaffold |
| `04-validation-zod` | Zod-first validation patterns | Navigation scaffold |
| `05-validation-class-validator` | DTO + `ValidationPipe` patterns | Navigation scaffold |
| `06-subscriptions` | Subscription and streaming flow | Navigation scaffold |
| `07-express-fastify` | Adapter parity examples | Navigation scaffold |
| `08-autoschema-client-typecheck` | `autoSchemaFile` + typed client checks | Navigation scaffold |

Use `docs/samples/INDEX.md` for file-level pointers and `docs/samples/ARCHITECTURE.md` for structural rationale.
