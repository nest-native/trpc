# Changelog

## 0.3.1

- standardize Zod support on `4.x` as the supported optional peer dependency
- simplify Zod serializer/test coverage around a single Zod v4-focused path
- update docs and support policy to explicitly document the Zod v4 contract

## 0.3.0

Stabilization release ahead of 1.0:

- align the documented support contract around Node 20+, NestJS 11.x, and tRPC 11.x
- narrow the root package surface to the supported public API while keeping `TrpcRouter` public for testing
- add release checks for sample version sync, repo README links, and package tarball contents
- stop publishing build metadata such as `tsconfig.build.tsbuildinfo`

## 0.1.0

Initial release — full enhancer support + rich showcase.
