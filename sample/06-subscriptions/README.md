# Sample 06: Subscriptions

This sample is a runnable extraction focused on server-side subscriptions and client consumption.

It demonstrates:

- `@Subscription(...)` procedures
- async generator events (the supported streaming shape)
- typed client subscription usage over SSE (`httpSubscriptionLink`)

## Run

```bash
npm run test --workspace nest-trpc-native-sample-06-subscriptions
```

## Key Files

- `src/events.router.ts`
- `src/events.schema.ts`
- `src/subscription-client.ts`
