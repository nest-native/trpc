---
sidebar_position: 4
---

# Exception Filters

NestJS exception filters catch and transform errors thrown during tRPC procedure execution.

## Usage

```ts
import { UseFilters } from '@nestjs/common';
import { Mutation, Router } from 'nest-trpc-native';

@Router('users')
@UseFilters(RemapBadRequestFilter)
class UsersRouter {
  @Mutation()
  create(@Input() input: { name: string }) {
    // If this throws, the filter handles it
    return this.usersService.create(input);
  }
}
```

## Example: Remap BadRequestException

```ts
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { TRPCError } from '@trpc/server';

@Catch(BadRequestException)
export class RemapBadRequestFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = exception.getResponse();
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        typeof response === 'string'
          ? response
          : (response as any).message ?? 'Bad request',
    });
  }
}
```

## Method-Level Filters

```ts
@Router('users')
class UsersRouter {
  @Mutation()
  @UseFilters(RemapBadRequestFilter)
  create(@Input() input: { name: string }) {
    return this.usersService.create(input);
  }
}
```

:::tip
Exception filters can catch specific exception types using `@Catch(ExceptionType)` and transform them into appropriate tRPC errors.
:::
