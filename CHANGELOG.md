# Changelog

## 0.4.0

Production-readiness release focused on documentation, verification, and release confidence:

- add contributor, security, issue, and pull request workflows
- publish a Docusaurus documentation site with support policy, public API tiers, claims matrix, samples, testing, production, and benchmark methodology guidance
- refresh README and package discovery content around supported Node, NestJS, tRPC, Zod, samples, and zero-runtime-dependency expectations
- add real `@trpc/client` E2E coverage for Express and Fastify adapters
- split CI into focused package, coverage, docs, Docusaurus, release, showcase, and sample jobs across Node 20 and Node 22 where relevant
- add release checks for README links, sample version synchronization, workspace resolution, and package tarball contents
- enforce SonarJS cognitive complexity for package source functions and publish cognitive complexity PR reports
- update the test runner to support Chai 6's ESM-only package
- add Dependabot automation for npm workspaces, website dependencies, and GitHub Actions updates

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
