---
sidebar_position: 2
---

# Installation

## Requirements

- Node.js ≥ 20
- NestJS 11.x
- tRPC 11.x

For the supported API tiers and compatibility boundary, see [Support Policy](./support-policy).

## Install the Package

```bash
npm i nest-trpc-native @trpc/server
```

## Peer Dependencies

These are required by any NestJS app and should already be installed:

```bash
npm i @nestjs/common @nestjs/core reflect-metadata rxjs
```

## Optional: Zod

If you want tRPC-style schema validation (`@Query({ input: z.object(...) })`) and auto schema generation:

```bash
npm i zod
```

:::tip Zod is optional
If you prefer Nest-style validation (`class-validator` + `ValidationPipe`), you can use nest-trpc-native without Zod. See [class-validator validation](./validation/class-validator) for details.
:::

## Zero Runtime Dependencies

`nest-trpc-native` has an empty `"dependencies": {}` block by design:

- It never pulls a second NestJS runtime into your app
- Your app controls Nest and tRPC versions through peer dependencies
- All capabilities come from packages you already have: `reflect-metadata`, `@nestjs/common`, `@nestjs/core`, `@trpc/server`, and Node built-ins
