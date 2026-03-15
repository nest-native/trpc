# Sample 08: AutoSchema + Client Typecheck

This sample is a runnable extraction focused on generated router artifacts and typed client safety.

It demonstrates:

- `autoSchemaFile` generation
- importing generated `AppRouter`
- compile-time client type checks

## Run

```bash
npm run test --workspace nest-trpc-native-sample-08-autoschema
```

## Key Files

- `src/generate-types.ts`
- `src/@generated/server.ts` (generated)
- `src/client.typecheck.ts`
