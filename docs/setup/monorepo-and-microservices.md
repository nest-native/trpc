# Monorepo and Microservice Setup Patterns

This guide provides explicit setup patterns for larger NestJS + tRPC systems.

## 1. Monorepo Pattern (Recommended Default)

```text
.
├─ apps/
│  ├─ api-gateway/               # Nest app hosting TrpcModule
│  └─ web-client/                # frontend using @trpc/client
├─ packages/
│  ├─ nest-trpc-native/          # this library (or npm dependency)
│  ├─ api-contract/              # shared types / generated AppRouter exports
│  └─ domain-services/           # shared business logic modules
└─ package.json                  # npm workspaces / pnpm / nx / turborepo
```

Gateway module using `forRootAsync`:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TrpcModule.forRootAsync<AppTrpcContext>({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        path: config.get('TRPC_PATH') ?? '/trpc',
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => ({
          requestId: String(req.headers['x-request-id'] ?? crypto.randomUUID()),
        }),
      }),
    }),
  ],
  providers: [UsersRouter, OrdersRouter],
})
export class AppModule {}
```

## 2. Nest Middleware with tRPC Gateway

Apply middleware in the gateway module the same way as classic HTTP controllers:

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTraceMiddleware).forRoutes(
      { path: 'trpc', method: RequestMethod.ALL },
      { path: 'trpc/(.*)', method: RequestMethod.ALL },
    );
  }
}
```

Reference runnable sample:

- `sample/09-forrootasync-config-middleware`

## 3. Microservice Pattern (tRPC Edge + Nest Transport Internals)

Use tRPC at the edge and delegate heavy domain operations to Nest microservices (TCP, Redis, NATS, etc.).

```ts
@Injectable()
export class OrdersGatewayService {
  constructor(@Inject('ORDERS_CLIENT') private readonly client: ClientProxy) {}

  async findById(id: string) {
    return lastValueFrom(this.client.send('orders.findById', { id }));
  }
}

@Router('orders')
export class OrdersRouter {
  constructor(private readonly orders: OrdersGatewayService) {}

  @Query()
  get(@Input('id') id: string) {
    return this.orders.findById(id);
  }
}
```

Typical gateway wiring:

```ts
{
  provide: 'ORDERS_CLIENT',
  useFactory: () =>
    ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 4001 },
    }),
}
```

This keeps tRPC procedures thin while preserving Nest transport strategies for internal service boundaries.
