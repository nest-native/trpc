---
sidebar_position: 3
---

# @Subscription()

The `@Subscription()` decorator defines a tRPC subscription procedure for real-time data streaming.

## Async Generators (Recommended)

tRPC v11 recommends **async generators** for subscriptions. This is the pattern used throughout the samples:

```ts
import { Input, Router, Subscription, TrpcContext } from 'nest-trpc-native';
import { z } from 'zod';

const TickInputSchema = z.object({ count: z.number().optional() });
const TickEventSchema = z.object({ tick: z.number(), requestId: z.string() });

@Router()
class EventsRouter {
  @Subscription({ input: TickInputSchema, output: TickEventSchema })
  async *ticks(
    @Input('count') count: number | undefined,
    @TrpcContext('requestId') requestId: string,
  ) {
    const total = count ?? 3;
    for (let tick = 1; tick <= total; tick++) {
      yield { tick, requestId };
    }
  }
}
```

Async generators are simpler, naturally support backpressure, and work seamlessly with `@Input()` and `@TrpcContext()` decorators.

## Client Usage

Subscriptions use SSE by default in tRPC v11:

```ts
import { createTRPCProxyClient, splitLink, httpBatchLink, httpSubscriptionLink } from '@trpc/client';
import type { AppRouter } from './@generated/server';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    splitLink({
      condition: op => op.type === 'subscription',
      true: httpSubscriptionLink({ url: 'http://localhost:3000/trpc' }),
      false: httpBatchLink({ url: 'http://localhost:3000/trpc' }),
    }),
  ],
});

const subscription = client.ticks.subscribe(
  { count: 5 },
  {
    onData: (event) => console.log('Tick:', event.tick),
    onComplete: () => console.log('Done'),
  },
);

// Later: unsubscribe
subscription.unsubscribe();
```

## Observable Pattern (Legacy)

The `observable()` pattern from `@trpc/server/observable` is still supported but no longer the recommended approach in tRPC v11:

```ts
import { Router, Subscription } from 'nest-trpc-native';
import { observable } from '@trpc/server/observable';

@Router('cats')
class CatsRouter {
  @Subscription()
  onCatCreated() {
    return observable((emit) => {
      const interval = setInterval(() => {
        emit.next({ id: crypto.randomUUID(), name: 'New Cat' });
      }, 1000);

      return () => clearInterval(interval);
    });
  }
}
```

:::info Transport
Subscriptions use **Server-Sent Events (SSE)** by default in tRPC v11 via `httpSubscriptionLink`. WebSocket transport is also available. See the [tRPC subscriptions docs](https://trpc.io/docs/subscriptions) for transport options.
:::
