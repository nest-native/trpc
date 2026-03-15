# Sample 05: Validation (class-validator + ValidationPipe)

This sample is a runnable extraction for Nest DTO validation.

It demonstrates:

- class-based DTOs with `class-validator`
- `@UsePipes(new ValidationPipe(...))` on tRPC procedures

## Run

```bash
npm run test --workspace nest-trpc-native-sample-05-class-validator
```

## Key Files

- `src/accounts/create-account.dto.ts`
- `src/accounts/accounts.router.ts`
