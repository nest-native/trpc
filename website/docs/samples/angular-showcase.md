---
sidebar_position: 3
---

# Angular Showcase

`sample/12-angular-fullstack-showcase` is the browser-client showcase for
`nest-trpc-native`. It pairs a NestJS backend with an Angular frontend and uses
the standard `@trpc/client` package to consume the generated `AppRouter` type.

It is intentionally separate from `sample/00-showcase`: the existing showcase
remains the compact backend integration baseline, while this sample focuses on
typed browser-client wiring.

## What It Proves

- A NestJS app can expose tRPC procedures through `TrpcModule.forRootAsync`.
- `autoSchemaFile` can generate an `AppRouter` type for a frontend app.
- Angular can consume the generated router type through `@trpc/client`.
- The browser bundle can import `AppRouter` as a type without importing NestJS
  runtime code.
- CI can validate the browser contract through Angular compilation and a real
  API smoke test.

## Folder Layout

```text
sample/12-angular-fullstack-showcase/
  src/
    app.module.ts
    health.router.ts
    health.schema.ts
    common/trpc-context.ts
    generate-types.ts
    client.typecheck.ts
  scripts/
    smoke-api.ts
  frontend/
    src/app/trpc/trpc.client.ts
    src/app/health/health-api.service.ts
    src/app/app.component.*
    src/environments/environment.ts
```

## Backend Contract

The backend configures `TrpcModule.forRootAsync` with a typed context and
generated router output:

```ts
TrpcModule.forRootAsync<AppTrpcContext>({
  useFactory: () => ({
    path: '/trpc',
    autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
    createContext: ({ req }) => ({
      requestId: String(req.headers['x-request-id'] ?? randomUUID()),
    }),
  }),
});
```

The first router is deliberately small:

```ts
@Router('health')
export class HealthRouter {
  @Query({ output: HealthPingOutputSchema })
  ping() {
    return 'pong' as const;
  }

  @Query({ output: HealthStatusOutputSchema })
  status(@TrpcContext('requestId') requestId: string) {
    return {
      service: 'nest-trpc-native-angular-showcase' as const,
      status: 'ok' as const,
      requestId,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    };
  }
}
```

This is enough for the scaffold PR to prove the end-to-end loop before later
PRs add domain routers, enhancers, errors, auth context, and subscriptions.

## Angular Client

The Angular app wraps the typed tRPC proxy in an injection token:

```ts
import { InjectionToken } from '@angular/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../../src/@generated/server';

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export const TRPC_CLIENT = new InjectionToken<TrpcClient>('TRPC_CLIENT', {
  providedIn: 'root',
  factory: () =>
    createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
        }),
      ],
    }),
});
```

The important boundary is the type-only import:

```ts
import type { AppRouter } from '../../../../src/@generated/server';
```

That keeps server runtime modules out of the browser bundle while preserving
procedure autocompletion and input/output inference.

## Run It

Start the API and Angular app in separate terminals:

```bash
npm run start:api --workspace nest-trpc-native-sample-12-angular-showcase
npm run start:web --workspace nest-trpc-native-sample-12-angular-showcase
```

The API serves tRPC at `http://localhost:3000/trpc`. The Angular dev server
uses `frontend/src/environments/environment.ts` for the API base URL.

## Validate It

Run the full sample check:

```bash
npm run test --workspace nest-trpc-native-sample-12-angular-showcase
```

That command covers:

- generated `AppRouter` creation
- client typecheck through `tsc`
- Angular template/typecheck through `ngc`
- API smoke test through a real HTTP tRPC client
- Angular production build

## Node.js Note

This sample uses Angular 21 and follows Angular's Node.js support range:

```text
^20.19.0 || ^22.12.0 || >=24.0.0
```

That is a sample-local tooling requirement. The core `nest-trpc-native` package
continues to follow the support policy documented for the library itself.

## Current Scope

The scaffold intentionally covers only the smallest useful browser loop:

- one aliased health router
- one typed Angular client
- one Angular service
- one dashboard screen
- typecheck, smoke, and build scripts

Planned follow-up PRs can add the richer application domain:

- project and ticket routers
- auth and role context
- guards, pipes, interceptors, and filters
- validation and error-state UI
- subscriptions and live notifications
