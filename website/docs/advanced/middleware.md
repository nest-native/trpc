---
sidebar_position: 4
---

# Middleware

NestJS middleware applies to tRPC routes the same way it does to HTTP controller routes.

## Setup

Implement `NestModule` and use `MiddlewareConsumer` to apply middleware to the tRPC path:

```ts
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TrpcModule } from 'nest-trpc-native';

@Module({
  imports: [TrpcModule.forRoot({ path: '/trpc' })],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTraceMiddleware).forRoutes(
      { path: 'trpc', method: RequestMethod.ALL },
      { path: 'trpc/(.*)', method: RequestMethod.ALL },
    );
  }
}
```

## Example: Request Tracing Middleware

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestTraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = crypto.randomUUID();
    }
    console.log(`[${req.headers['x-request-id']}] ${req.method} ${req.url}`);
    next();
  }
}
```

## Combining with forRootAsync

Middleware works naturally with async module configuration:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TrpcModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        path: config.get('TRPC_PATH') ?? '/trpc',
      }),
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTraceMiddleware).forRoutes('trpc', 'trpc/(.*)');
  }
}
```

See [`sample/09-forrootasync-config-middleware`](https://github.com/rodrigobnogueira/nest-trpc-native/tree/main/sample/09-forrootasync-config-middleware) for a full runnable example.
