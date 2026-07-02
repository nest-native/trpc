---
sidebar_position: 3
---

# @Subscription()

The `@Subscription()` decorator defines a tRPC subscription procedure for real-time data streaming over **Server-Sent Events (SSE)** — tRPC v11's recommended default transport.

## Supported Shape: Async Generators

Subscription handlers must return an async iterable. In practice that means writing the handler as an **async generator** (`async function*`), the pattern used throughout the samples:

```ts
import { Input, Router, Subscription, TrpcContext } from '@nest-native/trpc';
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

Async generators are simple, naturally support backpressure, and work seamlessly with `@Input()` and `@TrpcContext()` decorators. A handler may also return any object implementing `Symbol.asyncIterator`; each yielded value is validated against the `output` schema when one is configured. A non-iterable return value is emitted once and the subscription completes.

## Client Usage

Subscriptions stream over SSE via `httpSubscriptionLink`:

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

## Not Supported: `observable()` Returns

tRPC's legacy `observable()` helper (from `@trpc/server/observable`) is **not supported** as a subscription return value. The subscription wrapper streams async iterables only; an `observable()` return value would be emitted once as a plain object instead of streaming its events.

If you have push-style sources (`EventEmitter`, message queues, RxJS), bridge them into an async generator. For example, with Node's `events.on`:

```ts
import { EventEmitter, on } from 'events';

const emitter = new EventEmitter();

@Router()
class NotificationsRouter {
  @Subscription()
  async *notifications() {
    for await (const [payload] of on(emitter, 'notification')) {
      yield payload;
    }
  }
}
```

## Transport

:::info SSE only
Subscriptions are served over **Server-Sent Events (SSE)** via `httpSubscriptionLink` — tRPC v11's recommended default for subscriptions. WebSocket transport (`wsLink` / `applyWSSHandler`) is **not provided** by `@nest-native/trpc` and is currently a non-goal. See the [tRPC subscriptions docs](https://trpc.io/docs/subscriptions) for background on the transports tRPC itself defines.
:::
