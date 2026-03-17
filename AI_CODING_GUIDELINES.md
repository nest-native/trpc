# AI_CODING_GUIDELINES.md
## Core Philosophy – This library MUST feel native in NestJS projects

Every single decision must follow NestJS philosophy exactly as @nestjs/graphql and @nestjs/websockets do.

### 1. Overall Architecture Assumptions (never break these)
- It is a first-class NestJS integration package, not a thin wrapper around tRPC.
- Everything must be decorator-first, OOP, and heavily use NestJS DI.
- Mirror the exact DX of @nestjs/graphql (code-first approach with autoSchemaFile).
- Full integration with NestJS enhancer pipeline is NON-NEGOTIABLE:
  - @UseGuards, @UseInterceptors, @UsePipes, @UseFilters must work exactly as on @Controller or @Resolver.
  - Request-scoped providers, async providers, and REQUEST injection must work.
- Adapter-agnostic: zero code changes needed when switching between Express and Fastify.
- Support BOTH validation worlds without forcing one:
  - Zod (for tRPC type inference and frontend magic)
  - class-validator + ValidationPipe + DTOs (for classic NestJS users)

### 2. Public API Assumptions (this is what users will copy-paste)
- TrpcModule.forRoot({ path, autoSchemaFile, createContext? })
- Decorators (exactly these names and signatures):
  - @Router('namespace'?)          // like @Controller or @Resolver
  - @Query('name', { input?, output? })
  - @Mutation('name', { input?, output? })
  - @Subscription('name', { input?, output? })
  - @TrpcContext('key')            // for context injection
  - @Input()                       // optional helper for Zod schemas
- Generated AppRouter type must be importable and fully typed for the client.

### 3. Sample Folder Rules
- `sample/00-showcase` must demonstrate:
  - Feature modules with routers + services
  - Constructor DI (including request-scoped services)
  - Guards, interceptors, pipes, and filters on procedures
  - Mixed validation (Zod + class-validator DTO in the same router)
  - Context injection via @TrpcContext
  - Express + Fastify mains
  - Client with full type safety + typecheck step
- Focused samples under `sample/01-*`, `sample/02-*`, etc. should isolate one topic with minimal noise.
- Never simplify the full showcase for brevity — richness proves the integration depth.

### 4. Implementation Rules
- All routers are plain classes with decorators (no manual createRouter() calls visible to user).
- Use NestJS metadata reflection and discovery exactly like GraphQL module.
- Exception mapping: BadRequestException → tRPC BAD_REQUEST, etc.
- Context creation must be injectable and support both sync and async.
- Schema generation must produce a clean AppRouter type that works with createTRPCProxyClient.
- Never expose tRPC internals to the user unless they opt-in via advanced config.
- Keep the package lean — no unnecessary dependencies.

### 5. Non-Negotiable Style & Patterns
- Use NestJS naming conventions (@nestjs/common style).
- Prefer constructor injection over module-level providers when possible.
- Always support global, module, and method-level enhancers.
- Tests must cover enhancer pipeline, request scoping, and both adapters.
- Documentation and README should follow Nest-style clarity without claiming official status.

### 6. When in doubt
- Ask yourself: “Would this feel natural in a @nestjs/graphql project?”
- If the answer is no → redesign it until the answer is yes.

Follow these assumptions in EVERY file you generate or modify.
This is not a suggestion — it is the project constitution.

### 7. Differentiation Strategy
- NEVER use @UseMiddlewares — always expose real @UseGuards / @UsePipes / etc.
- Support both Zod AND class-validator in the same router.
- Prefer autoSchemaFile over external CLI.
- Always include @TrpcContext decorator.

### 8. Release Version Synchronization (MANDATORY)
- Version drift between `packages/trpc` and `sample/*` is a release blocker.
- When bumping `packages/trpc/package.json` version, update ALL `sample/*/package.json` entries for `"nest-trpc-native"` in the same change.
- Regenerate `package-lock.json` after version alignment (`npm install`) so resolution state is consistent.
- Never publish if any sample still points to an older package version.

Required pre-publish checklist:
1. Bump version in `packages/trpc/package.json`.
2. Update `sample/*/package.json` to the exact same `nest-trpc-native` version.
3. Run `npm install`.
4. Run `npm ls nest-trpc-native --workspaces --depth=0` and verify every sample resolves to the target version.
5. Run full validation: `npm run ci`.

Required post-publish checklist:
1. Confirm registry version exists: `npm view nest-trpc-native@<version> version`.
2. Download published artifact: `npm pack nest-trpc-native@<version>`.
3. Re-run `npm run ci` with samples pinned to that published version before closing the release.
