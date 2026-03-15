# Nest Internals Compatibility Boundary

`nest-trpc-native` needs Nest enhancer execution (guards, pipes, interceptors, filters) to behave like native Nest transports.

Today, the required context creation APIs are still internal in Nest, so this package keeps a narrow boundary for that wiring:

- `packages/trpc/context/trpc-enhancer-runtime.factory.ts`

`TrpcContextCreator` no longer instantiates low-level Nest internals directly. It now consumes a runtime contract (`TrpcEnhancerRuntime`), and only the factory above touches Nest internals.

## Why This Boundary Exists

- Reduces version-coupling surface area to one file.
- Makes Nest major upgrades easier to audit and patch.
- Preserves full enhancer support without exposing complexity to users.

## Upgrade Checklist (Nest major bump)

1. Verify `createTrpcEnhancerRuntime()` compiles against the target Nest version.
2. Run `npm run ci` (coverage + adapter smoke + focused samples).
3. Validate guard/interceptor/pipe/filter behavior in `sample/00-showcase`.
4. Publish compatibility notes in changelog/release docs.

## Public API Roadmap

Long-term, the ideal path is a public Nest API for external context creators so integrations like GraphQL and tRPC do not rely on internals.

Tracking issue in this repo:

- `#10 Decouple TrpcContextCreator from NestJS internals by advocating for a public API`
