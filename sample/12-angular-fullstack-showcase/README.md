# Sample 12: Angular Full-Stack Showcase

Angular browser showcase for `nest-trpc-native` with a NestJS backend and a
typed tRPC client.

This sample intentionally uses Angular with the standard `@trpc/client`
package. It does not require or imply a first-party Angular adapter.

## Architecture

This sample keeps one npm workspace package and places the Angular application
under `frontend/`:

```text
sample/12-angular-fullstack-showcase/
  src/                 NestJS API + tRPC routers
  scripts/             API smoke checks
  frontend/            Angular browser app
  angular.json         Angular build configuration
  package.json         API, client, and Angular scripts
```

The NestJS API owns the router contract and writes generated types to
`src/@generated/server.ts`. The Angular app imports only the `AppRouter` type
from that generated file, then creates a typed `@trpc/client` proxy through an
Angular injection token.

## What It Demonstrates

| Feature | File(s) |
| --- | --- |
| NestJS backend with `TrpcModule.forRootAsync` | `src/app.module.ts` |
| Aliased health router | `src/health.router.ts` |
| Generated `AppRouter` type | `src/generate-types.ts` + `src/@generated/server.ts` |
| Typed Angular tRPC client | `frontend/src/app/trpc/trpc.client.ts` |
| Angular service consuming generated router types | `frontend/src/app/health/health-api.service.ts` |
| API smoke test | `scripts/smoke-api.ts` |
| Compile-time client checks | `src/client.typecheck.ts` |

## Backend Flow

`src/app.module.ts` configures `TrpcModule.forRootAsync` with:

- `path: '/trpc'`
- `autoSchemaFile: src/@generated/server.ts`
- typed context created from the `x-request-id` header

`src/health.router.ts` exposes an aliased `health` router:

- `health.ping.query()` returns `pong`
- `health.status.query()` returns service status, request id, timestamp, and uptime

The router uses Zod output schemas in `src/health.schema.ts`, so the generated
`AppRouter` gives the Angular client precise output types.

## Angular Flow

The Angular app uses standalone components and keeps tRPC wiring small:

- `frontend/src/app/trpc/trpc.client.ts` creates the typed tRPC proxy.
- `frontend/src/app/health/health-api.service.ts` injects the proxy and exposes
  health calls to components.
- `frontend/src/app/app.component.ts` loads status data and renders the first
  dashboard screen.
- `frontend/src/environments/environment.ts` owns the API base URL.

The generated router import is type-only:

```ts
import type { AppRouter } from '../../../../src/@generated/server';
```

That keeps NestJS runtime code out of the browser bundle while preserving
autocompletion and compile-time input/output checks.

## Run

From the repository root:

```bash
npm run start:api --workspace nest-trpc-native-sample-12-angular-showcase
npm run start:web --workspace nest-trpc-native-sample-12-angular-showcase
```

The API runs on `http://localhost:3000/trpc` by default. The Angular dev server
uses the API URL configured in `frontend/src/environments/environment.ts`.

This sample follows Angular 21's Node.js support range:
`^20.19.0 || ^22.12.0 || >=24.0.0`. The core `nest-trpc-native` package keeps
its broader documented Node support line.

## Checks

```bash
npm run typecheck:client --workspace nest-trpc-native-sample-12-angular-showcase
npm run smoke:api --workspace nest-trpc-native-sample-12-angular-showcase
npm run build:web --workspace nest-trpc-native-sample-12-angular-showcase
npm run test --workspace nest-trpc-native-sample-12-angular-showcase
```

The sample test command runs:

1. generated router type creation
2. standalone client typecheck
3. Angular template/typecheck through `ngc`
4. API smoke test through a real HTTP tRPC client
5. Angular production build

## Scope

This first PR keeps the app deliberately small: one health router, one typed
Angular client, and enough scripts to prove the end-to-end loop. Later PRs can
add the project/ticket domain, Nest enhancers, auth context, errors, and
subscriptions.

## Review Notes

- Angular support here means standard `@trpc/client` usage from Angular, not a
  new public adapter API.
- The sample has its own Angular 21 Node.js engine range; it does not narrow
  the core package support policy.
- The demo CORS settings in `src/main.ts` are local-development settings for
  `localhost:4200` and `127.0.0.1:4200`.
- Generated files under `src/@generated` and build output under `dist` are
  intentionally excluded from source control.
