---
sidebar_position: 3
---

# @Subscription()

The `@Subscription()` decorator defines a tRPC subscription procedure for real-time data streaming.

## Both Patterns Work

`nest-trpc-native` supports both tRPC subscription return styles:

- async generators (`async function*`) - recommended default
- `observable()` from `@trpc/server/observable` - fully supported

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

## Observable Pattern (Also Supported)

Use `observable()` when you prefer push-style emission/teardown semantics:

```ts
import { Input, Router, Subscription, TrpcContext } from 'nest-trpc-native';
import { observable } from '@trpc/server/observable';
import { z } from 'zod';

const TickInputSchema = z.object({ count: z.number().optional() });

@Router('cats')
class CatsRouter {
  @Subscription({ input: TickInputSchema })
  ticks(
    @Input('count') count: number | undefined,
    @TrpcContext('requestId') requestId: string,
  ) {
    return observable((emit) => {
      let tick = 0;
      const total = count ?? 3;
      const interval = setInterval(() => {
        tick += 1;
        emit.next({ tick, requestId });
        if (tick >= total) {
          clearInterval(interval);
          emit.complete();
        }
      }, 300);

      return () => clearInterval(interval);
    });
  }
}
```

Use whichever model matches your team style. For new code, async generators are typically easier to read and test.

:::info Transport
Subscriptions use **Server-Sent Events (SSE)** by default in tRPC v11 via `httpSubscriptionLink`. WebSocket transport is also available. See the [tRPC subscriptions docs](https://trpc.io/docs/subscriptions) for transport options.
:::
