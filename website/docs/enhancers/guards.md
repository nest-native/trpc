---
sidebar_position: 1
---

# Guards

NestJS guards work with tRPC procedures exactly as they do with HTTP controllers.

## Usage

```ts
import { UseGuards } from '@nestjs/common';
import { Query, Router } from 'nest-trpc-native';

@Router('admin')
@UseGuards(AuthGuard)
class AdminRouter {
  @Query()
  dashboard() {
    return { status: 'ok' };
  }
}
```

## Creating a Guard

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const trpcCtx = context.getArgs()[1] as { apiKey?: string } | undefined;
    return trpcCtx?.apiKey === 'sample-secret';
  }
}
```

## Method-Level Guards

Apply guards to individual procedures:

```ts
@Router('cats')
class CatsRouter {
  @Query()
  list() {
    return []; // public
  }

  @Mutation()
  @UseGuards(AuthGuard)
  create(@Input() input: { name: string }) {
    return { id: '1', ...input }; // protected
  }
}
```

## Global Guards

Global guards registered via `APP_GUARD` apply to all tRPC procedures automatically:

```ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
```

See the runnable example with both global and method-level guards:

- `sample/02-enhancers-guards-pipes-filters/src/app.module.ts`
- `sample/02-enhancers-guards-pipes-filters/src/common/guards/request-id.guard.ts`
