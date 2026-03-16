# Sample 10: Nested Alias Routers

This sample demonstrates dotted alias paths with true nested router objects.

- `@Router('admin.users')` -> `trpc.admin.users.*`
- `@Router('admin.roles')` -> `trpc.admin.roles.*`
- root procedures still work alongside nested ones

## Run

```bash
npm run test --workspace nest-trpc-native-sample-10-nested-alias
```

## Key Files

- `src/admin/users.router.ts`
- `src/admin/roles.router.ts`
- `src/health.router.ts`
- `scripts/smoke.ts`
