# Sample 01: Basics (Query + Mutation)

This sample is a minimal runnable extraction of the core router flow:

- one module
- one router alias (`todos`)
- one query + one mutation

## Run

```bash
npm run test --workspace nest-trpc-native-sample-01-basics
```

## Key Files

- `src/app.module.ts`
- `src/todos/todos.router.ts`
- `src/todos/todos.service.ts`
- `__tests__/todos.router.spec.ts`

## Test Patterns Included

- direct class-level router unit tests (service delegation)
- in-process tRPC caller tests using the supported advanced testing API `TrpcRouter.getRouter().createCaller(...)`
