---
sidebar_position: 9
---

# Production Practices

`nest-trpc-native` keeps the router layer close to normal NestJS applications. Production readiness still depends on the surrounding Nest app, deployment platform, and client behavior.

## Keep Router Code Boring

- Put business logic in injectable services.
- Keep router methods small and intention-revealing.
- Use `@Input()` and `@TrpcContext()` for procedure boundaries.
- Use Nest enhancers for cross-cutting behavior instead of custom procedure wrappers.
- Keep Express and Fastify behavior adapter-neutral unless a feature truly requires adapter-specific code.

## Validate Inputs Deliberately

Both validation styles are supported:

- Zod schemas in procedure options.
- DTO classes with `class-validator` and `ValidationPipe`.

Pick the style that fits the application boundary. Avoid accepting unvalidated objects in procedures that mutate state, perform authorization decisions, or call external systems.

## Handle Errors As Public API

Client-visible errors become part of the API contract. Prefer stable error shapes and messages:

- Throw `TRPCError` when you want explicit tRPC codes.
- Throw Nest `HttpException` subclasses when the procedure follows existing Nest service behavior.
- Use exception filters when a domain error needs consistent mapping.

For examples, see [Idiomatic Error Handling](../errors/idiomatic-errors) and [Advanced Error Handling](./error-handling).

## Preserve Request Context Boundaries

Context should contain request-scoped values that procedures need, such as request IDs, authenticated subject IDs, locale, or tenant IDs.

Do not use context as a generic global object. If a value needs lifecycle, caching, cleanup, or dependencies, prefer a request-scoped provider.

See [Typed Context](../module-setup/typed-context) and [Request Scope](./request-scope).

## Review Adapter Parity

If a change touches request handling, headers, status mapping, subscriptions, or context creation, validate both adapters:

```bash
npm run smoke:express --workspace nest-trpc-native-showcase
npm run smoke:fastify --workspace nest-trpc-native-showcase
```

Router classes should not need to change when the app switches between Express and Fastify.

## Watch Complexity And Coverage

Use the package test suite and complexity report as review signals:

```bash
npm run test
npm run complexity:report
```

Run coverage when behavior changes:

```bash
npm run test:cov
```

The complexity report is not a merge gate by itself. It should help reviewers spot code that needs a smaller shape, clearer names, or stronger tests.

## Release Checklist

Before relying on a production claim in docs or release notes, make sure it has executable support:

- A package test, focused sample, or showcase smoke check covers the behavior.
- The claim appears in the [Claims Matrix](../reference/claims-matrix).
- README and package README use the same compatibility and support language.
- New dependencies have a written reason and do not affect the published library runtime dependency contract.
