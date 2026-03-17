---
sidebar_position: 7
---

# Transport Pattern Parallels

If you already know NestJS GraphQL, WebSocket, or gRPC patterns, `nest-trpc-native` should feel familiar.

This page maps those patterns to the `TrpcModule` + `@Router()` model so teams can migrate without changing their core architecture.

## At a Glance

| Concern | GraphQL Code-First (`23-graphql-code-first`) | GraphQL Schema-First (`12-graphql-schema-first`) | WebSocket (`@nestjs/websockets`) | gRPC (`@nestjs/microservices`) | tRPC (`nest-trpc-native`) |
| --- | --- | --- | --- | --- | --- |
| Transport bootstrap | `GraphQLModule.forRoot(...)` | `GraphQLModule.forRoot(...)` + SDL | `@WebSocketGateway(...)` | Microservice config + gRPC transport | `TrpcModule.forRoot(...)` |
| Endpoint class | `@Resolver()` | `@Resolver()` | `@WebSocketGateway()` + handlers | `@Controller()` + `@GrpcMethod()` | `@Router('namespace')` |
| Operation handler | `@Query()`, `@Mutation()` | SDL operation + resolver method | `@SubscribeMessage('event')` | RPC method handler | `@Query()`, `@Mutation()`, `@Subscription()` |
| Input extraction | `@Args()` | `@Args()` shaped by SDL | `@MessageBody()` | Payload/metadata params | `@Input()` |
| Request metadata | `@Context()` | `@Context()` | `@ConnectedSocket()` / context | Metadata/call context | `@TrpcContext()` |
| Contract source | Decorators + TS metadata | `.graphql` SDL files | Event names + payload contracts | `.proto` service contract | Router procedures + optional Zod schemas + generated `AppRouter` type |
| Cross-cutting concerns | Guards/pipes/interceptors/filters | Guards/pipes/interceptors/filters | Guards/pipes/interceptors/filters | Guards/pipes/interceptors/filters | Guards/pipes/interceptors/filters |
| Business logic location | Injected services | Injected services | Injected services | Injected services | Injected services |

## Core Equivalence

- `@Resolver()` and `@Router()` play the same role: a DI-driven class exposing transport handlers.
- GraphQL fields, WS events, gRPC methods, and tRPC procedures are all thin entry points over Nest services.
- Existing guards, pipes, interceptors, filters, and request-scoped providers continue to be the primary extension model.
- Migration is mostly replacing transport decorators, not rewriting services.

## Code Crosswalk

### GraphQL Resolver -> tRPC Router

```ts
// GraphQL style
@Resolver()
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.users.byId(id);
  }
}

// tRPC style
@Router('users')
export class UsersRouter {
  constructor(private readonly users: UsersService) {}

  @Query()
  user(@Input('id') id: string) {
    return this.users.byId(id);
  }
}
```

### WebSocket Event Handler -> tRPC Subscription

```ts
// WebSocket style
@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('ticks')
  handleTicks(@MessageBody() input: { count?: number }) {
    // emit events over socket
  }
}

// tRPC style (SSE by default in tRPC v11)
@Router()
export class EventsRouter {
  @Subscription()
  async *ticks(@Input('count') count?: number) {
    const total = count ?? 3;
    for (let tick = 1; tick <= total; tick++) {
      yield { tick };
    }
  }
}
```

### gRPC Boundary -> tRPC Edge Router

```ts
@Injectable()
export class OrdersGatewayService {
  constructor(@Inject('ORDERS_CLIENT') private readonly client: ClientProxy) {}

  findById(id: string) {
    return lastValueFrom(this.client.send('orders.findById', { id }));
  }
}

@Router('orders')
export class OrdersRouter {
  constructor(private readonly orders: OrdersGatewayService) {}

  @Query()
  byId(@Input('id') id: string) {
    return this.orders.findById(id);
  }
}
```

This keeps internal transport boundaries (TCP/NATS/Redis/gRPC) while exposing a typed tRPC edge contract.

## Sample Crosswalk

| If this is your familiar model | Start here in this repo | Why |
| --- | --- | --- |
| GraphQL code-first modules/resolvers/services | `sample/00-showcase/src/users/*`, `sample/00-showcase/src/cats/*` | Same class + module + service structure, but with `@Router()` procedures |
| GraphQL schema-first contract-first mindset | `sample/08-autoschema-client-typecheck` | Shows contract generation and client type checks around generated router types |
| WebSocket real-time handlers | `sample/06-subscriptions` | Shows streaming procedures and a runnable subscription client |
| gRPC/microservice gateway patterns | `sample/11-microservice-transport` | Shows tRPC at the edge and `ClientProxy` delegation to internal transport |

## Migration Playbooks

### From GraphQL Code-First

1. Keep modules and services unchanged.
2. Replace resolvers with routers (`@Resolver` -> `@Router`).
3. Replace `@Args()` with `@Input()`.
4. Keep enhancers exactly as-is.

### From GraphQL Schema-First

1. Keep existing SDL as a transition reference.
2. Implement equivalent procedure names in router classes.
3. Move validation/shape rules into DTO + `ValidationPipe` or Zod schemas.
4. Switch clients to generated `AppRouter` typing incrementally.

### From WebSocket

1. Keep event/domain services unchanged.
2. Convert event streams into `@Subscription()` procedures.
3. Use `httpSubscriptionLink` on clients and keep the same guard/interceptor strategy.

### From gRPC

1. Keep internal gRPC/microservice boundaries where they already work.
2. Expose a tRPC edge router that delegates to gateway/application services.
3. Keep exception mapping and policy logic in Nest filters/guards.

## Related Docs

- [Migration from REST or GraphQL](./migration-from-rest-or-graphql)
- [Microservices](./microservices)
- [@Subscription()](../decorators/subscription)
- [Samples Architecture](../samples/architecture)
- [Samples Catalog](../samples/catalog)
