---
sidebar_position: 3
---

# Microservices

Use tRPC at the edge and delegate heavy domain operations to NestJS microservices via TCP, Redis, NATS, or other transports.

## Architecture

```
┌─────────────────────────┐
│   tRPC Gateway (Nest)   │  ← public-facing, TrpcModule
│   @Router('orders')     │
│     @Query() get()      │──→ ClientProxy.send('orders.findById')
└─────────────────────────┘
            │
     TCP / Redis / NATS
            │
┌─────────────────────────┐
│   Orders Microservice   │  ← internal, @nestjs/microservices
│   @MessagePattern(...)  │
└─────────────────────────┘
```

## Gateway Service

```ts
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OrdersGatewayService {
  constructor(@Inject('ORDERS_CLIENT') private readonly client: ClientProxy) {}

  async findById(id: string) {
    return lastValueFrom(this.client.send('orders.findById', { id }));
  }
}
```

## Gateway Router

```ts
import { Input, Query, Router } from 'nest-trpc-native';

@Router('orders')
export class OrdersRouter {
  constructor(private readonly orders: OrdersGatewayService) {}

  @Query()
  get(@Input('id') id: string) {
    return this.orders.findById(id);
  }
}
```

## Client Proxy Wiring

```ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  providers: [
    {
      provide: 'ORDERS_CLIENT',
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: { host: '127.0.0.1', port: 4001 },
        }),
    },
    OrdersGatewayService,
    OrdersRouter,
  ],
})
export class OrdersModule {}
```

This keeps tRPC procedures thin while preserving Nest transport strategies for internal service boundaries.
