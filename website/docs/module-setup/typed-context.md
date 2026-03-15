---
sidebar_position: 3
---

# Typed Context

Both `TrpcModule.forRoot()` and `TrpcModule.forRootAsync()` accept an optional generic that types the `createContext` return value. This gives you compile-time safety and autocompletion on your context factory without changing any runtime behavior.

## Usage

```ts
interface AppTrpcContext {
  requestId: string;
  userId?: number;
}

// Static configuration
TrpcModule.forRoot<AppTrpcContext>({
  createContext: ({ req }) => ({
    requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
    userId: extractUserId(req),
  }),
});

// Async configuration
TrpcModule.forRootAsync<AppTrpcContext>({
  useFactory: (config: ConfigService) => ({
    createContext: ({ req }) => ({
      requestId: req.headers['x-request-id'] ?? crypto.randomUUID(),
      // TypeScript error if you forget `userId` or add unknown fields
    }),
  }),
  inject: [ConfigService],
});
```

## How It Works

The generic parameter flows through `TrpcModuleOptions<TContext>` to the `createContext` property:

```ts
export interface TrpcModuleOptions<TContext = any> {
  path?: string;
  autoSchemaFile?: string;
  createContext?: (opts: { req: any; res: any }) => TContext | Promise<TContext>;
}
```

## Backward Compatibility

The generic defaults to `any`, so existing code without the type parameter continues to work unchanged:

```ts
// Still valid — no generic needed
TrpcModule.forRoot({
  createContext: ({ req }) => ({ requestId: '123' }),
});
```
