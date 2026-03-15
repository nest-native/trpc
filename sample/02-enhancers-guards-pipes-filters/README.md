# Sample 02: Enhancers (Guards, Interceptors, Pipes, Filters)

This sample is a runnable extraction focused on enhancer compatibility for tRPC procedures.

It demonstrates:

- `@UseGuards` (`ApiKeyGuard`)
- `@UseInterceptors` (`ExecutionTimeInterceptor`)
- `@UsePipes` (`TrimPipe`)
- `@UseFilters` (`RemapBadRequestFilter`)

## Run

```bash
npm run test --workspace nest-trpc-native-sample-02-enhancers
```

## Key Files

- `src/notes/notes.router.ts`
- `src/common/guards/api-key.guard.ts`
- `src/common/interceptors/execution-time.interceptor.ts`
- `src/common/pipes/trim.pipe.ts`
- `src/common/filters/remap-bad-request.filter.ts`
