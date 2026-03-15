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
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization'];
    return !!token;
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
@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
```
