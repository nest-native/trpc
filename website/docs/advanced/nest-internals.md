---
sidebar_position: 5
---

# Nest Internals Compatibility

`@nest-native/trpc` needs NestJS enhancer execution (guards, pipes, interceptors, filters) to behave like native Nest transports. This page explains how the package manages that dependency.

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
2. Keep every `@nestjs/*` deep import pointed at a file, never a directory index — `packages/trpc/test/nestjs-deep-imports.spec.ts` enforces this (see below)
3. Run `npm run ci` (coverage + adapter smoke + focused samples)
4. Validate guard/interceptor/pipe/filter behavior in `sample/00-showcase`
5. Widen the published peer range and add the new major to the `nestjs-compat` CI matrix (one entry per end of the range, the floor pinned exactly with its reason), so both ends of the range are tested
6. Publish compatibility notes in changelog/release docs

## NestJS 12: ESM-only exports map

NestJS 12 ships `@nestjs/common` and `@nestjs/core` as ESM-only packages with an exports map of `{ ".", "./internal", "./*.js", "./*": "./*.js" }`. A deep import of a **file** path such as `@nestjs/core/injector/constants` still resolves (to `./injector/constants.js`). A deep import of a **directory** such as `@nestjs/common/interfaces` does not: there is no `interfaces.js`, and ESM does not resolve a directory index through `./*`. That import was the only thing in this package that broke on 12 — it now uses a local `type Controller = object` alias, which is exactly how Nest 12 defines the type.

`packages/trpc/test/nestjs-deep-imports.spec.ts` scans every `.ts` file in the package for `@nestjs/<pkg>/<subpath>` specifiers and fails if any `<subpath>.js` is not a regular file inside the installed package, on whichever Nest major the current install holds.

## Public API Roadmap

Long-term, the ideal path is a public NestJS API for external context creators so integrations like GraphQL and tRPC do not rely on internals.

Tracking issue: [#10 — Decouple TrpcContextCreator from NestJS internals](https://github.com/nest-native/trpc/issues/10)
