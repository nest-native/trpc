---
sidebar_position: 2
---

# Interceptors

NestJS interceptors wrap tRPC procedure execution, enabling logging, caching, response transformation, and more.

## Usage

```ts
import { UseInterceptors } from '@nestjs/common';
import { Query, Router } from 'nest-trpc-native';

@Router('cats')
@UseInterceptors(LoggingInterceptor)
class CatsRouter {
  @Query()
  list() {
    return [];
  }
}
```

## Example: Logging Interceptor

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`Procedure took ${Date.now() - now}ms`)),
    );
  }
}
```

## Method-Level Interceptors

```ts
@Router('cats')
class CatsRouter {
  @Query()
  @UseInterceptors(CacheInterceptor)
  list() {
    return [];
  }
}
```

## Response Transformation

Interceptors can transform the response via RxJS operators:

```ts
@Injectable()
export class WrapResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({ data, timestamp: new Date().toISOString() })),
    );
  }
}
```
