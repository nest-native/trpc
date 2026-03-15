# Sample 04: Validation (Zod)

This sample is a runnable extraction for Zod-based input/output validation.

It demonstrates:

- `@Query({ input, output })` with Zod
- `@Mutation({ input, output })` with Zod
- generated `AppRouter` types consumed by a typed client

## Run

```bash
npm run test --workspace nest-trpc-native-sample-04-zod
```

## Key Files

- `src/products/products.schema.ts`
- `src/products/products.router.ts`
- `src/client.typecheck.ts`
