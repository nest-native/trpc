---
sidebar_position: 8
---

# Client Consumption

Use the generated `AppRouter` type with `@trpc/client` so application clients stay aligned with the Nest router contract.

## Generate the Router Type

Enable `autoSchemaFile` in the Nest application:

```ts
TrpcModule.forRoot({
  path: '/trpc',
  autoSchemaFile: 'src/@generated/server.ts',
});
```

The generated file should be treated as build output. Import its type from client code, but do not edit the file by hand.

## Create a Typed Client

Use `createTRPCProxyClient<AppRouter>()` in the consuming app:

```ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/src/@generated/server';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
});
```

Procedure calls now follow the router namespace and procedure names:

```ts
const users = await trpc.users.list.query();
const created = await trpc.users.create.mutate({ name: 'Ada' });
```

## Share Types In A Monorepo

In a monorepo, prefer one shared type export rather than deep imports between apps:

```ts title="packages/api-contract/src/index.ts"
export type { AppRouter } from '../../apps/api/src/@generated/server';
```

```ts title="apps/web/src/trpc.ts"
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@acme/api-contract';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: '/trpc' })],
});
```

Keep that contract package type-only. It should not import Nest modules, providers, or runtime server code into the client bundle.

## Validate Client Drift

Add a typecheck-only client file when router changes should be reviewed from the consumer side:

```ts title="src/client.typecheck.ts"
import { createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from './@generated/server';

declare const trpc: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

void trpc.users.list.query();
void trpc.users.create.mutate({ name: 'Ada' });
```

Run the client typecheck in CI or before release:

```bash
npx tsc --noEmit -p tsconfig.client.json
```

The showcase demonstrates this with:

```bash
npm run typecheck:client --workspace nest-trpc-native-showcase
```

## Runtime Configuration

Client setup is application-owned:

- Resolve the base URL from your deployment environment.
- Add auth headers through `headers` or a custom link.
- Keep secrets on the server; do not export server-only configuration through generated types.
- Use subscriptions only when the server and client deployment path both support streaming.

For schema generation details, see [Schema Generation](./schema-generation). For a runnable client, see the [showcase sample](./samples).

## Angular Applications

Angular applications can use the same generated `AppRouter` type with
`@trpc/client`. The repository's Angular showcase wraps the typed client in an
Angular injection token:

```ts title="frontend/src/app/trpc/trpc.client.ts"
import { InjectionToken } from '@angular/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../../src/@generated/server';

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export const TRPC_CLIENT = new InjectionToken<TrpcClient>('TRPC_CLIENT', {
  providedIn: 'root',
  factory: () =>
    createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
    }),
});
```

Keep the `AppRouter` import type-only so Angular does not bundle NestJS runtime
code. For a runnable Angular app, see [Angular Showcase](./samples/angular-showcase).
