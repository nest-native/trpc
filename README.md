<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Standalone monorepo for <code>@nestjs/trpc</code> and its official showcase.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@nestjs/trpc"><img src="https://img.shields.io/npm/v/@nestjs/trpc.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/@nestjs/trpc"><img src="https://img.shields.io/npm/l/@nestjs/trpc.svg" alt="Package License" /></a>
  <a href="https://docs.nestjs.com"><img src="https://img.shields.io/badge/docs-nestjs-e0234e.svg" alt="Documentation" /></a>
</p>

## Description

This repository contains:

- `packages/trpc`: the framework package (`@nestjs/trpc`)
- `showcase`: a full-featured sample app (evolved from Sample 37)

## Getting Started

[Showcase Guide](./showcase/README.md)

## Dependency Philosophy

`@nestjs/trpc` is designed as a bridge package with **zero runtime dependencies** in its own `dependencies` block.

- No duplicate NestJS runtime copy is pulled in by this package.
- NestJS and tRPC come from `peerDependencies` so the host app controls versions.
- `zod` support is optional: use it for tRPC-native schema inference, or skip it and use `class-validator` + `ValidationPipe`.

See detailed rationale in [`packages/trpc/README.md`](./packages/trpc/README.md).

## Workspace Commands

```bash
npm install
npm run build
npm run test
npm run ci:showcase
```

## Showcase Commands

```bash
npm run start --workspace @nestjs/trpc-showcase
npm run start:fastify --workspace @nestjs/trpc-showcase
npm run client --workspace @nestjs/trpc-showcase
```
