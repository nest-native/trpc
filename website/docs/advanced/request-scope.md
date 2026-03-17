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

## Performance Trade-offs

### What Happens Under the Hood

When **any** provider in a module is request-scoped (`Scope.REQUEST`), NestJS creates a **new DI sub-tree** for every incoming request. This means:

- Every provider that depends on (or is depended upon by) the scoped provider is also re-instantiated.
- The Nest injector resolves the full dependency chain from scratch each time.
- Singleton services injected alongside request-scoped ones are **not** affected — but the router class itself becomes transient.

### Cost Comparison

| Approach | Instance creation | DI resolution | Memory | Best for |
|----------|-------------------|---------------|--------|----------|
| **Singleton** (default) | Once at startup | Once | Minimal | Stateless services, shared caches |
| **`@TrpcContext()`** | None (decorator extraction) | None | Zero overhead | Per-request data (user, requestId, headers) |
| **`Scope.REQUEST`** | Every request | Full sub-tree | Higher | Per-request **stateful** services |

### When to Use Each

**Use `@TrpcContext()` when you only need to read request data:**

```ts
@Router('users')
class UsersRouter {
  @Query()
  me(@TrpcContext('requestId') requestId: string) {
    return { requestId };
  }
}
```

Zero allocation cost — the decorator simply extracts a value from the context object that `createContext` already built.

**Use `Scope.REQUEST` when you need a stateful service per request:**

```ts
@Injectable({ scope: Scope.REQUEST })
export class AuditTrail {
  private readonly entries: string[] = [];

  record(action: string) {
    this.entries.push(action);
  }

  getEntries() {
    return [...this.entries];
  }
}
```

This is the right choice when the service accumulates state across multiple method calls within the same request — something a decorator parameter cannot do.

### Rules of Thumb

1. **Start with singletons + `@TrpcContext()`** — covers 90%+ of use cases with no performance cost.
2. **Reach for `Scope.REQUEST` only when you need mutable per-request state** (audit trails, request-scoped caches, multi-step transactions).
3. **Keep request-scoped providers in leaf modules** — avoid scoping providers in shared/core modules, as it forces the entire dependency chain to become request-scoped.
4. **Never scope a provider just to access the request object** — use `createContext` + `@TrpcContext()` instead.

:::tip Sample 03
[context-request-scope](https://github.com/rodrigobnogueira/nest-trpc-native/tree/main/sample/03-context-request-scope) demonstrates both patterns side by side: `@TrpcContext('requestId')` for simple extraction and `RequestMetaService` for stateful per-request data.
:::
