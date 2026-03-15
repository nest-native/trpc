---
sidebar_position: 5
---

# @TrpcContext()

The `@TrpcContext()` decorator injects the tRPC context (or a specific property from it) into a method parameter.

## Full Context

```ts
import { Query, Router, TrpcContext } from 'nest-trpc-native';

@Router('users')
class UsersRouter {
  @Query()
  me(@TrpcContext() ctx: { requestId: string; userId: number }) {
    return { id: ctx.userId, requestId: ctx.requestId };
  }
}
```

## Extracting a Property

Pass a property name to extract a specific value:

```ts
@Query()
me(@TrpcContext('userId') userId: number) {
  return { id: userId };
}
```

## Context Setup

The context object is created by the `createContext` factory in your module configuration:

```ts
TrpcModule.forRoot({
  path: '/trpc',
  createContext: ({ req }) => ({
    requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
    userId: extractUserId(req),
  }),
});
```

See [Typed Context](../module-setup/typed-context) for how to add compile-time type safety to your context factory.
