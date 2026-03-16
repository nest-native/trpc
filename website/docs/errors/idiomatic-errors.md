---
sidebar_position: 2
---

# Idiomatic Error Handling

The most idiomatic approach is: **use Nest exceptions + enhancers first**, and only use `TRPCError` directly when you need transport-specific behavior.

## Recommended Error Flow

1. Throw standard Nest exceptions (`BadRequestException`, `NotFoundException`, etc.).
2. Let pipes/validation reject invalid input.
3. Use exception filters when you need remapping/custom formatting.
4. Throw `TRPCError` directly only for explicit tRPC-level decisions.

## Built-In HTTP Exception Mapping

`nest-trpc-native` maps common `HttpException` statuses to tRPC codes. Examples:

- `400` → `BAD_REQUEST`
- `401` → `UNAUTHORIZED`
- `403` → `FORBIDDEN`
- `404` → `NOT_FOUND`
- `409` → `CONFLICT`
- `422` → `UNPROCESSABLE_CONTENT`
- `429` → `TOO_MANY_REQUESTS`
- `503` → `SERVICE_UNAVAILABLE`

Unmapped statuses fall back to `INTERNAL_SERVER_ERROR`.

## Pattern 1: Throw Nest Exceptions in Domain Logic

```ts
import { NotFoundException } from '@nestjs/common';
import { Query, Router, Input } from 'nest-trpc-native';

@Router('users')
class UsersRouter {
  constructor(private readonly users: UsersService) {}

  @Query()
  async byId(@Input('id') id: number) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}
```

## Pattern 2: Validation Errors via Pipes

For class-validator:

```ts
@Mutation()
@UsePipes(new ValidationPipe({ whitelist: true }))
create(@Input() input: CreateUserDto) {
  return this.users.create(input);
}
```

For Zod:

```ts
@Mutation({ input: z.object({ name: z.string().min(1) }) })
create(@Input() input: { name: string }) {
  return this.users.create(input);
}
```

Both are idiomatic and result in typed tRPC client errors.

## Pattern 3: Remap with Exception Filters

Use filters when your API needs custom semantics:

```ts
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class RemapBadRequestFilter implements ExceptionFilter {
  catch() {
    throw new HttpException('filtered payload', 422);
  }
}
```

```ts
@Mutation()
@UseFilters(RemapBadRequestFilter)
update(@Input() input: UpdateUserDto) {
  return this.users.update(input);
}
```

## Pattern 4: Throw TRPCError Deliberately

Use this for explicit transport semantics:

```ts
import { TRPCError } from '@trpc/server';

if (!isAuthorized) {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message: 'Missing API key',
  });
}
```

## Testing Error Behavior

Add explicit tests for:

- `code` (tRPC error code)
- `message` (client-visible message)
- filter remapping behavior
- guard/pipe/filter interaction order

Reference tests:

- `packages/trpc/test/context/trpc-context-creator.spec.ts`
- `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`
