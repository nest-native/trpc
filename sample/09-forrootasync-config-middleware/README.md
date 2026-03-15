# Sample 09: forRootAsync + ConfigService + Middleware

This sample is a runnable extraction for async module config and explicit Nest middleware integration.

It demonstrates:

- `TrpcModule.forRootAsync()` with `@nestjs/config` and `ConfigService`
- Environment-driven tRPC path configuration
- Custom Nest middleware applied to tRPC routes via `configure()`
- Context enrichment from middleware + request headers

## Run

```bash
npm run test --workspace nest-trpc-native-sample-09-config-middleware
```

## Key Files

- `src/app.module.ts`
- `src/configuration.ts`
- `src/common/middleware/request-trace.middleware.ts`
- `src/system/system.router.ts`
