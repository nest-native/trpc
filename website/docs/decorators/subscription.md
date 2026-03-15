---
sidebar_position: 3
---

# @Subscription()

The `@Subscription()` decorator defines a tRPC subscription procedure for real-time data streaming.

## Basic Usage

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

## Client Usage

```ts
const subscription = trpc.cats.onCatCreated.subscribe(undefined, {
  onData: (cat) => {
    console.log('New cat:', cat);
  },
});

// Later: unsubscribe
subscription.unsubscribe();
```

## With Input Schema

```ts
@Subscription({ input: z.object({ breed: z.string() }) })
onCatByBreed(@Input() input: { breed: string }) {
  return observable((emit) => {
    // Filter events by breed
    const handler = (cat) => {
      if (cat.breed === input.breed) emit.next(cat);
    };
    eventEmitter.on('cat.created', handler);
    return () => eventEmitter.off('cat.created', handler);
  });
}
```

:::info Transport
Subscriptions require a WebSocket or SSE transport on the client side. See the [tRPC subscriptions docs](https://trpc.io/docs/subscriptions) for transport setup.
:::
