---
sidebar_position: 10
---

# Security Responsibilities

`nest-trpc-native` provides a Nest-native tRPC transport layer. It does not replace application security design.

## What The Library Provides

The library helps route tRPC calls through Nest patterns:

- Router discovery through decorators.
- Procedure input handling through `@Input()`.
- Context access through `@TrpcContext()`.
- Nest guards, interceptors, pipes, and filters around procedures.
- Express and Fastify adapter support.

These pieces let you apply normal Nest security controls to tRPC procedures.

## What Your Application Must Provide

Applications remain responsible for:

- Authentication policy.
- Authorization rules.
- Rate limiting.
- Production CORS policy.
- CSRF posture for browser clients.
- Request body limits.
- Secret handling.
- Tenant isolation.
- Audit logging.

Do not document an application as secure just because its procedures use tRPC types. Type safety and validation reduce mistakes, but they do not define who can call a procedure or what they may access.

## Authentication And Authorization

Use guards for authentication and authorization decisions:

```ts
@Router('admin')
@UseGuards(AdminGuard)
class AdminRouter {
  @Query()
  dashboard() {
    return { ok: true };
  }
}
```

Class-level guards protect every procedure in the router. Method-level guards are useful when one procedure has stricter requirements.

## Input Validation

Validate every external input that influences persistence, authorization, external calls, file paths, or dynamic query construction.

```ts
import { z } from 'zod';

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
});

@Mutation({ input: UpdateUserSchema })
update(@Input() input: z.infer<typeof UpdateUserSchema>) {
  return this.users.update(input);
}
```

DTO validation with `ValidationPipe` is also supported. Pick one validation style per boundary when possible so reviews stay simple.

## Context Data

Keep context data minimal:

- Prefer stable identifiers over full user records.
- Do not store secrets in context.
- Avoid passing raw tokens to procedure return values or logs.
- Recompute authorization-sensitive data when freshness matters.

If a value needs dependencies or request lifecycle behavior, use a request-scoped provider instead of expanding the context object.

## Transport Settings

Configure transport-level security in the Nest application or deployment layer:

- CORS.
- HTTPS termination.
- proxy trust.
- body size limits.
- compression policy.
- rate limiting.

The correct settings depend on the hosting environment and client type, so this package does not provide a universal production default.

## Review Checklist

For security-sensitive changes, reviewers should ask:

- Which guard protects this procedure?
- Is every external input validated?
- Does context expose only the data procedures need?
- Are errors safe for clients to see?
- Could this procedure leak another tenant's data?
- Are secrets absent from docs, tests, examples, and logs?

Security issues should be reported privately through the repository security advisory flow. See the repository `SECURITY.md` for disclosure guidance.
