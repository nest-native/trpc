---
sidebar_position: 6
---

# Error Handling

This guide focuses on advanced patterns for translating Nest errors into consistent tRPC error semantics.

## Mental Model

`nest-trpc-native` runs through the Nest enhancer pipeline:

- guards
- interceptors
- pipes
- filters

Any uncaught error is converted to a `TRPCError`.

## Default Mapping

When you throw an `HttpException`, the package maps known HTTP status codes to tRPC codes:

- `400` -> `BAD_REQUEST`
- `401` -> `UNAUTHORIZED`
- `403` -> `FORBIDDEN`
- `404` -> `NOT_FOUND`
- `409` -> `CONFLICT`
- `422` -> `UNPROCESSABLE_CONTENT`
- `429` -> `TOO_MANY_REQUESTS`
- `503` -> `SERVICE_UNAVAILABLE`

Unknown statuses fall back to `INTERNAL_SERVER_ERROR`.

## Filter Remapping Pattern

Use a filter when you want to change how a class of errors appears to clients.

```ts
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class RemapBadRequestFilter implements ExceptionFilter {
  catch(_exception: BadRequestException): never {
    // Remap 400 to 422 for clients.
    throw new HttpException('filtered payload', 422);
  }
}
```

```ts
@Mutation()
@UseFilters(RemapBadRequestFilter)
create(@Input() input: CreateUserDto) {
  return this.usersService.create(input);
}
```

## Custom Application Codes (Idiomatic Pattern)

tRPC transport codes are fixed. For app-specific codes, keep a stable transport code and add a domain code in the message.

```ts
import { Catch, ExceptionFilter } from '@nestjs/common';
import { TRPCError } from '@trpc/server';

class DomainRuleException extends Error {
  constructor(
    readonly appCode: 'EMAIL_TAKEN' | 'PLAN_LIMIT_REACHED',
    message: string,
  ) {
    super(message);
  }
}

@Catch(DomainRuleException)
export class DomainRuleFilter implements ExceptionFilter {
  catch(exception: DomainRuleException): never {
    throw new TRPCError({
      code: 'CONFLICT',
      message: `[${exception.appCode}] ${exception.message}`,
      cause: exception,
    });
  }
}
```

```ts
if (await this.usersService.emailExists(input.email)) {
  throw new DomainRuleException('EMAIL_TAKEN', 'Email already exists');
}
```

This keeps client logic predictable:

- transport decision by `error.data.code` (`CONFLICT`)
- domain decision by your app code (`EMAIL_TAKEN`)

## Client Handling Example

```ts
try {
  await trpc.users.create.mutate(input);
} catch (error: any) {
  if (error?.data?.code === 'CONFLICT' && /EMAIL_TAKEN/.test(error.message)) {
    // show "email already exists"
  }
}
```

## Testing Checklist

Test these explicitly:

- remapped status -> expected tRPC code
- message shape from filters
- domain-code prefix parsing
- fallback behavior for unmapped errors

Reference tests:

- `packages/trpc/test/context/trpc-context-creator.spec.ts`
- `packages/trpc/test/router/trpc-router-lifecycle.spec.ts`
