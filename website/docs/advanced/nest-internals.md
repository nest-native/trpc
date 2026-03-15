---
sidebar_position: 5
---

# Nest Internals Compatibility

`nest-trpc-native` needs NestJS enhancer execution (guards, pipes, interceptors, filters) to behave like native Nest transports. This page explains how the package manages that dependency.

## The Boundary

The required context creation APIs are still internal in NestJS, so this package isolates the wiring in a single file:

```
packages/trpc/context/trpc-enhancer-runtime.factory.ts
```

`TrpcContextCreator` consumes a runtime contract (`TrpcEnhancerRuntime`) and only the factory touches Nest internals.

## Why This Matters

- **Reduces version-coupling** to one file
- **Makes Nest major upgrades** easier to audit and patch
- **Preserves full enhancer support** without exposing complexity to users

## Upgrade Checklist (Nest Major Bump)

1. Verify `createTrpcEnhancerRuntime()` compiles against the target Nest version
2. Run `npm run ci` (coverage + adapter smoke + focused samples)
3. Validate guard/interceptor/pipe/filter behavior in `sample/00-showcase`
4. Publish compatibility notes in changelog/release docs

## Public API Roadmap

Long-term, the ideal path is a public NestJS API for external context creators so integrations like GraphQL and tRPC do not rely on internals.

Tracking issue: [#10 — Decouple TrpcContextCreator from NestJS internals](https://github.com/rodrigobnogueira/nest-trpc-native/issues/10)
