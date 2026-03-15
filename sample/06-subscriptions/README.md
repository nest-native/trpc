# Sample 06: Subscriptions

This sample is a runnable extraction focused on server-side subscriptions and client consumption.

It demonstrates:

- `@Subscription(...)` procedures
- async generator events
- typed client subscription usage (`httpSubscriptionLink`)

## Run

```bash
npm run test --workspace nest-trpc-native-sample-06-subscriptions
```

## Key Files

- `src/events.router.ts`
- `src/events.schema.ts`
- `src/subscription-client.ts`
