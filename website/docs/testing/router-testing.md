---
sidebar_position: 1
---

# Router Testing

This guide shows pragmatic testing layers for `nest-trpc-native` routers.

`TrpcRouter` is a supported advanced testing API. It is appropriate in tests, but it should not replace the main onboarding path centered on `TrpcModule`, decorators, and generated `AppRouter` types.

## Testing Strategy

Use three layers:

1. **In-process router tests** for fast feedback.
2. **HTTP smoke tests** for adapter/runtime behavior.
3. **Client typechecks** for contract drift detection.

## 1) In-Process Router Tests (Fastest)

Create a Nest testing module, resolve `TrpcRouter`, and call procedures with `createCaller()`:

```ts
import { Test } from '@nestjs/testing';
import { TrpcModule, TrpcRouter } from 'nest-trpc-native';

describe('UsersRouter', () => {
  it('creates a user', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [UsersRouter, UsersService],
    }).compile();

    await moduleRef.init();

    const trpcRouter = moduleRef.get(TrpcRouter);
    const caller = trpcRouter.getRouter().createCaller({
      requestId: 'test-request',
    }) as any;

    const created = await caller.users.createWithDto({
      name: 'Neo',
      email: 'neo@example.com',
    });

    expect(created.email).toBe('neo@example.com');
  });
});
```

Why this layer is useful:

- No network sockets.
- Real Nest DI + enhancers.
- Fast enough for most behavior tests.

## 2) HTTP Smoke Tests (Transport Reality)

Boot the app on an ephemeral port and use `@trpc/client` against the real endpoint:

```ts
import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../src/@generated/server';

const app = await NestFactory.create(AppModule, { logger: false });
await app.listen(0, '127.0.0.1');
const baseUrl = await app.getUrl();

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: `${baseUrl}/trpc` })],
});

await client.ping.query();
await app.close();
```

Run both adapters for parity:

- Express (`main.ts`)
- Fastify (`main-fastify.ts`)

## 3) Client Typechecks (Compile-Time Safety)

Generate `AppRouter` and compile a typed client file:

```ts
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './@generated/server';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

void client.users.byId.query({ id: 1 });
```

Then run a dedicated `tsc --noEmit` step in CI.

## What to Assert

For robust coverage, test these scenarios:

- Guard-denied procedures return forbidden errors.
- Pipes/validation transform and reject payloads correctly.
- Filters remap errors as expected.
- Context injection (`@TrpcContext`) and request-scoped providers work.
- Subscription handlers stream and validate outputs.

## Reference Implementations

- `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`
- `sample/00-showcase/scripts/smoke-express.ts`
- `sample/00-showcase/scripts/smoke-fastify.ts`
- `sample/08-autoschema-client-typecheck/src/client.typecheck.ts`
