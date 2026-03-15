---
sidebar_position: 1
---

# Request Scope

`nest-trpc-native` supports NestJS request-scoped providers, giving each tRPC procedure invocation its own provider instance.

## Creating a Request-Scoped Provider

```ts
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST })
export class RequestMetaService {
  public readonly requestId: string;

  constructor(@Inject(REQUEST) request: any) {
    this.requestId = request.headers?.['x-request-id'] ?? crypto.randomUUID();
  }
}
```

## Using in a Router

```ts
@Router('users')
class UsersRouter {
  constructor(private readonly meta: RequestMetaService) {}

  @Query()
  me() {
    return { requestId: this.meta.requestId };
  }
}
```

Each call to `trpc.users.me.query()` gets a fresh `RequestMetaService` instance with the current request's metadata.

## Module Registration

```ts
@Module({
  providers: [UsersRouter, RequestMetaService],
})
export class UsersModule {}
```

:::info Performance
Request-scoped providers create a new instance per request, which has a performance cost. Use them only when you genuinely need per-request state. For most cases, `@TrpcContext()` is a lighter alternative.
:::
