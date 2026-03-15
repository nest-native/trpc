# Sample 03: Context + Request Scope

This sample is a runnable extraction for request context and request-scoped DI.

It demonstrates:

- `createContext` with typed context
- `@TrpcContext('requestId')`
- `REQUEST` injection in a request-scoped provider

## Run

```bash
npm run test --workspace nest-trpc-native-sample-03-context
```

## Key Files

- `src/app.module.ts`
- `src/common/trpc-context.ts`
- `src/meta/request-meta.service.ts`
- `src/meta/meta.router.ts`
