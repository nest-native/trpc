# Sample 13: Transformer + Error Formatting + Response Meta

This sample is a runnable extraction for the tRPC server-config passthrough options on `TrpcModule.forRoot()`.

It demonstrates:

- `transformer: superjson` — `Date` round-trips between server and client; the generated `AppRouter` marks the router as transformer-enabled, so typed clients are **required** to pass `transformer` to their link
- `errorFormatter` — the canonical flattened-`ZodError` recipe (`error.data.zodError.fieldErrors`)
- `responseMeta` — a `Cache-Control` header on successful queries
- `onError` — a centralized server-side error reporting hook

## Run

```bash
npm run test --workspace nest-trpc-native-sample-13-transformer
```

## Key Files

- `src/app.module.ts`
- `src/tasks/tasks.router.ts`
- `src/client.typecheck.ts`
- `scripts/smoke.ts`
