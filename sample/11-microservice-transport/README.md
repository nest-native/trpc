# Sample 11: Microservice Transport (TCP)

This sample demonstrates a **tRPC gateway** that delegates domain reads to a NestJS microservice over TCP.

## What It Shows

- `@Router('orders')` at the HTTP/tRPC edge
- Gateway service using `ClientProxy.send(...)`
- Internal microservice using `@MessagePattern('orders.findById')`
- Runtime wiring of transport options (host/port)

## Run

```bash
npm run test --workspace nest-trpc-native-sample-11-microservice
```

## Key Files

- `src/orders/orders.router.ts`
- `src/orders/orders-gateway.service.ts`
- `src/orders/orders-client.provider.ts`
- `src/microservice/orders.microservice.controller.ts`
- `scripts/smoke.ts`

## Notes

- This focused sample uses TCP for a zero-dependency transport.
- The same gateway pattern applies to Redis, NATS, and other Nest transports.
