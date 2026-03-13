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

[Overview & Tutorial](https://docs.nestjs.com/recipes/trpc)

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
