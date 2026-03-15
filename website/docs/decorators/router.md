---
sidebar_position: 1
---

# @Router()

The `@Router()` decorator marks a class as a tRPC router. It's the equivalent of `@Controller()` in NestJS but for tRPC procedures.

## Basic Usage

```ts
import { Router } from 'nest-trpc-native';

@Router('cats')
class CatsRouter {
  // procedures go here
}
```

This creates a tRPC router namespace at `cats`, so procedures are accessed as `trpc.cats.list.query()` on the client.

## Root-Level Procedures

Pass an empty string or omit the argument to define flat procedures at the root:

```ts
@Router('')
class HealthRouter {
  @Query()
  ping() {
    return 'pong';
  }
}
```

Client usage: `trpc.ping.query()` (no namespace prefix).

## Registration

Router classes must be registered as providers in a NestJS module:

```ts
@Module({
  imports: [TrpcModule.forRoot({ path: '/trpc' })],
  providers: [CatsRouter, UsersRouter, HealthRouter],
})
export class AppModule {}
```

The `TrpcModule` automatically discovers all classes decorated with `@Router()` via NestJS's `DiscoveryService`.

## Dependency Injection

Routers are standard NestJS providers, so constructor injection works as expected:

```ts
@Router('cats')
class CatsRouter {
  constructor(private readonly catsService: CatsService) {}

  @Query()
  list() {
    return this.catsService.findAll();
  }
}
```
