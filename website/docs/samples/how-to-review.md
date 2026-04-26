---
sidebar_position: 4
---

# How To Review

Use this checklist when reviewing sample or package changes. It starts with fast local checks and then moves toward the full sample matrix.

## Baseline Setup

Install dependencies and build the package once:

```bash
npm install
npm run build --workspace nest-trpc-native
```

## Fast Package Checks

Run package tests and the cognitive-complexity report:

```bash
npm run test
npm run complexity:report
```

Use `npm run test:cov` when the change affects package behavior or coverage expectations.

## Showcase Review

The showcase is the full integration baseline. It should stay rich enough to prove the Nest-native behavior:

```bash
npm run typecheck:client --workspace nest-trpc-native-showcase
npm run smoke:express --workspace nest-trpc-native-showcase
npm run smoke:fastify --workspace nest-trpc-native-showcase
```

For manual review, run the Express app and client in separate terminals:

```bash
npm run start:dev --workspace nest-trpc-native-showcase
npm run client --workspace nest-trpc-native-showcase
npm run client:subscription --workspace nest-trpc-native-showcase
```

For Fastify parity:

```bash
npm run start:fastify --workspace nest-trpc-native-showcase
```

## Focused Sample Matrix

Run the full sample matrix before merging changes that affect documented behavior:

```bash
npm run ci:sample
```

For targeted review, run the focused sample that matches the change:

| Topic | Command |
| --- | --- |
| Query and mutation basics | `npm run test --workspace nest-trpc-native-sample-01-basics` |
| Guards, interceptors, pipes, filters | `npm run test --workspace nest-trpc-native-sample-02-enhancers` |
| Context and request scope | `npm run test --workspace nest-trpc-native-sample-03-context` |
| Zod validation | `npm run test --workspace nest-trpc-native-sample-04-zod` |
| DTO validation | `npm run test --workspace nest-trpc-native-sample-05-class-validator` |
| Subscriptions | `npm run test --workspace nest-trpc-native-sample-06-subscriptions` |
| Express/Fastify parity | `npm run test --workspace nest-trpc-native-sample-07-adapters` |
| Generated `AppRouter` client types | `npm run test --workspace nest-trpc-native-sample-08-autoschema` |
| Async module config and middleware | `npm run test --workspace nest-trpc-native-sample-09-config-middleware` |
| Nested aliases | `npm run test --workspace nest-trpc-native-sample-10-nested-alias` |
| Microservice transport bridge | `npm run test --workspace nest-trpc-native-sample-11-microservice` |

## Docs Review

For docs changes:

```bash
npm run docs:test:typecheck
npm --prefix website run build
```

For README or package metadata changes:

```bash
npm run release:check:readme-links
npm run release:check:pack
```

## What To Look For

- Public examples should use `TrpcModule`, decorators, and generated `AppRouter` types.
- `TrpcRouter` should appear only in testing-oriented guidance.
- Unsupported internals should not be presented as extension points.
- Zod and DTO validation should both remain supported.
- Express and Fastify should require no router-code changes.
- Complexity increases should be intentional and explained.
