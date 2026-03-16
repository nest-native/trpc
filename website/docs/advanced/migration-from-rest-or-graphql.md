---
sidebar_position: 6
---

# Migration from REST or GraphQL

This guide helps you migrate existing NestJS APIs from REST controllers or GraphQL resolvers to `nest-trpc-native` routers.

## Migration Strategy

Use an incremental rollout instead of a big-bang rewrite:

1. Keep existing REST/GraphQL endpoints running.
2. Add `TrpcModule` and create one new router for a non-critical feature.
3. Move shared business logic into services (if not already).
4. Migrate endpoints/resolvers one feature at a time.
5. Keep guards, pipes, interceptors, and filters as-is.
6. Switch clients to typed tRPC procedures gradually.

## Concept Mapping

| REST (Nest) | GraphQL (Nest) | tRPC (`nest-trpc-native`) |
|---|---|---|
| `@Controller('users')` | `@Resolver()` | `@Router('users')` |
| `@Get()`, `@Post()` | `@Query()`, `@Mutation()` | `@Query()`, `@Mutation()` |
| `@Param()`, `@Body()`, `@Query()` | `@Args()` | `@Input()` |
| `@Req()` / custom context | `@Context()` | `@TrpcContext()` |
| DTO + `ValidationPipe` | Input types + pipes | DTO + `ValidationPipe` or Zod input schema |
| Guards/interceptors/filters | Guards/interceptors/filters | Same Nest enhancers |

## REST Controller -> tRPC Router

### Before (REST)

```ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.usersService.byId(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

### After (tRPC)

```ts
import { Input, Mutation, Query, Router } from 'nest-trpc-native';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';

@Router('users')
@UseGuards(AuthGuard)
export class UsersRouter {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  byId(@Input('id') id: string) {
    return this.usersService.byId(id);
  }

  @Mutation()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Input() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

Main change: transport decorators (`@Get`, `@Post`, `@Body`, `@Param`) become procedure decorators (`@Query`, `@Mutation`) and `@Input()`.

## GraphQL Resolver -> tRPC Router

### Before (GraphQL)

```ts
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  user(@Args('id') id: string) {
    return this.usersService.byId(id);
  }

  @Mutation(() => User)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }
}
```

### After (tRPC)

```ts
import { Input, Mutation, Query, Router } from 'nest-trpc-native';

@Router('users')
export class UsersRouter {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  user(@Input('id') id: string) {
    return this.usersService.byId(id);
  }

  @Mutation()
  createUser(@Input() input: CreateUserInput) {
    return this.usersService.create(input);
  }
}
```

Main change: GraphQL schema decorators and return type metadata are replaced by procedure methods with TypeScript-first inference.

## Middleware, Guards, and Interceptors

If you already use Nest enhancers, most code is reused unchanged:

- `@UseGuards(...)` on class/method still works.
- `@UseInterceptors(...)` still wraps execution.
- `@UseFilters(...)` still controls exception remapping.
- `@UsePipes(...)` still applies validation/transforms.

Your migration should focus on replacing transport decorators, not rewriting business logic or enhancer logic.

## Validation Choices (Zod Optional)

Both approaches are supported:

### DTO + class-validator

```ts
@Mutation()
@UsePipes(new ValidationPipe({ whitelist: true }))
create(@Input() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

### Zod schema

```ts
const CreateUserSchema = z.object({ name: z.string().min(1) });

@Mutation({ input: CreateUserSchema })
create(@Input() input: { name: string }) {
  return this.usersService.create(input);
}
```

Choose one style per module for consistency. If your codebase already uses DTOs, keep DTOs. Zod is optional.

## Request/Response Handling Differences

- In tRPC, you generally do not write to `res` manually.
- Return values become typed procedure outputs.
- Request metadata should come from `createContext` and `@TrpcContext()`.
- For cross-cutting concerns (auth, logging, errors), keep using Nest enhancers.

## Recommended Migration Order

1. Start with read-only endpoints (`GET` / GraphQL queries).
2. Migrate one mutation flow with validation.
3. Migrate endpoints that rely on guards/interceptors.
4. Add typed client usage (`AppRouter`) in one consumer.
5. Remove legacy endpoints only after client traffic is switched.

## References

- [Quick Start](../quick-start)
- [Decorators](../decorators/router)
- [Validation (class-validator)](../validation/class-validator)
- [Validation (Zod)](../validation/zod)
- [Router Testing](../testing/router-testing)
