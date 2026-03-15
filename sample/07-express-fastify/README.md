# Sample 07: Express + Fastify Parity

This sample is a runnable extraction focused on adapter-agnostic behavior.

It demonstrates:

- same router behavior under Express and Fastify
- same context propagation contract under both adapters

## Run

```bash
npm run test --workspace nest-trpc-native-sample-07-adapters
```

## Key Files

- `src/main.ts`
- `src/main-fastify.ts`
- `scripts/smoke-express.ts`
- `scripts/smoke-fastify.ts`
