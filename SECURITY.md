# Security Policy

Security reports are taken seriously. Please avoid posting exploit details, secrets, private URLs, or production data in public issues.

## Supported Line

The current stabilization line is documented in [website/docs/support-policy.md](website/docs/support-policy.md). At the time of writing, the supported runtime targets are:

- Node.js `>=20`
- NestJS `11.x`
- tRPC `11.x`

## Reporting a Vulnerability

Use GitHub private vulnerability reporting if it is available for this repository:

https://github.com/rodrigobnogueira/nest-trpc-native/security/advisories/new

If that private report flow is unavailable, open a public issue with only a non-sensitive summary and ask for a private disclosure channel. Do not include proof-of-concept payloads, tokens, stack traces with secrets, private endpoints, or customer/user data in the public issue.

Helpful private report details include:

- affected package version or commit
- affected runtime: Node, NestJS, tRPC, adapter, and validation stack
- minimal reproduction steps
- expected impact
- whether the issue affects code, docs, samples, release tooling, or dependencies
- any known mitigations

## What This Package Controls

`nest-trpc-native` is an integration layer between NestJS and tRPC. Security fixes may involve:

- enhancer wiring: guards, pipes, interceptors, and filters
- request context handling
- request-scoped provider isolation
- validation behavior
- error mapping
- generated schema output paths
- package metadata and supply-chain risk

## What Applications Must Still Configure

Applications remain responsible for their own:

- authentication policy
- authorization model
- rate limiting
- CORS and CSRF posture
- request body limits
- logging policy
- secret management
- transport security

Documentation and samples should avoid implying that this library solves those application-level responsibilities automatically.
