# GUIDELINES_NEST_TRPC.md
## Core Philosophy – This library MUST feel native in NestJS projects

Every single decision must follow NestJS philosophy exactly as @nestjs/graphql and @nestjs/websockets do.

### 1. Overall Architecture Assumptions (never break these)
- It is a first-class NestJS integration package, not a thin wrapper around tRPC.
- Everything must be decorator-first, OOP, and heavily use NestJS DI.
- Mirror the exact DX of @nestjs/graphql (code-first approach with autoSchemaFile).
- Current stabilization support line:
  - Node.js `>=22` (`>=22.12` to load NestJS 12 from CommonJS — see section 12)
  - NestJS `^11.0.0 || ^12.0.0` (both majors tested — see section 12)
  - tRPC `11.x`
- Full integration with NestJS enhancer pipeline is NON-NEGOTIABLE:
  - @UseGuards, @UseInterceptors, @UsePipes, @UseFilters must work exactly as on @Controller or @Resolver.
  - Request-scoped providers, async providers, and REQUEST injection must work.
- Adapter-agnostic: zero code changes needed when switching between Express and Fastify.
- Support BOTH validation worlds without forcing one:
  - Zod (for tRPC type inference and frontend magic)
  - class-validator + ValidationPipe + DTOs (for classic NestJS users)

### 2. Public API Assumptions (this is what users will copy-paste)
- Primary onboarding API:
  - TrpcModule.forRoot({ path, autoSchemaFile, createContext? })
  - Decorators (exactly these names and signatures):
    - @Router('namespace'?)          // like @Controller or @Resolver
    - @Query('name', { input?, output? })
    - @Mutation('name', { input?, output? })
    - @Subscription('name', { input?, output? })
    - @TrpcContext('key')            // for context injection
    - @Input()                       // optional helper for Zod schemas
  - Generated AppRouter type must be importable and fully typed for the client.
- Advanced supported testing API:
  - `TrpcRouter` may remain public when it is part of the official in-process testing story via `getRouter().createCaller(...)`.
  - `TrpcRouter` must stay out of installation and quick-start docs; it belongs in testing-focused guidance only.
  - If we ever want `TrpcRouter` to become private, we must first introduce an equally strong official testing abstraction and migrate docs, samples, and tests to it.

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
- Unsupported internal surface includes:
  - deep imports into package internals such as `@nest-native/trpc/dist/...`
  - raw context/runtime helpers
  - raw schema generator helpers
  - transport internals such as `TrpcHttpAdapter`
  - metadata constants and DI tokens intended for package internals
- These internals must not appear in root exports, installation docs, or quick-start examples.
- Keep the package lean — no unnecessary dependencies in the published library package.
- Sample-only dependencies are acceptable when they prove an integration scenario; they must not leak into the published package contract.

### 5. Non-Negotiable Style & Patterns
- Use NestJS naming conventions (@nestjs/common style).
- Prefer constructor injection over module-level providers when possible.
- Always support global, module, and method-level enhancers.
- Tests must cover enhancer pipeline, request scoping, and both adapters.
- Documentation and README should follow Nest-style clarity without claiming official status.
- Documentation must preserve API tiers:
  - onboarding docs center on `TrpcModule`, decorators, and generated `AppRouter`
  - `TrpcRouter` appears only in testing-oriented docs
  - unsupported internals are documented as unsupported, not as hidden power-user APIs

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

### 8. Security Review Requirements (MANDATORY)
- Every PR analysis must include an explicit security pass; security is never implicit.
- Supply-chain checks are NON-NEGOTIABLE:
  - Review every dependency addition/update (including lockfile changes) for legitimacy and necessity.
  - `packages/trpc/package.json` must keep an explicit empty `"dependencies": {}` block.
  - Runtime requirements belong in `peerDependencies`; package-local test/build tools belong in `devDependencies`.
  - Flag unpinned Git/URL dependencies unless there is explicit, documented approval.
  - Inspect install/lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`) for malicious behavior risk.
  - Watch for typosquatting, suspicious package ownership changes, abandoned packages, and sudden lockfile churn.
  - Treat Dependabot PRs as automation assistance, not approval to merge:
    - Keep major updates isolated, with one deliberate exception: the `nest-trpc-peer` group in `.github/dependabot.yml` — the peer/runtime set: `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/microservices`, `@nestjs/platform-express`, `@nestjs/platform-fastify`, `@nestjs/testing`, `@trpc/*`, `reflect-metadata`, `rxjs`, and `zod` — is grouped across major, minor, and patch. The `@nestjs/*` packages peer on each other, so a major that arrives one-package-per-PR leaves its siblings behind and fails `npm ci` with ERESOLVE before a single test runs (NestJS 12 did exactly that, fifteen PRs across the org); the other runtime peers ride in the same group so a framework major is evaluated together with the peers it ships against. Grouped, a major arrives as one PR that can actually be evaluated. Every `@nestjs/*` package the repo declares that peers on `common`/`core` belongs in the group — one left out reproduces the split-major failure.
    - Verify `packages/trpc/package.json` still has `"dependencies": {}` after every dependency PR.
    - Run the same validation expected for a human-authored dependency update.
    - Do not auto-accept lockfile churn without understanding which direct dependency caused it.
- **Strictness scope.** The non-negotiables (100% coverage, cognitive-complexity ≤ 15, zero published runtime deps, isolated major-version review) govern the *core* published package (`packages/trpc`). Non-core code — `sample/*` (including the Angular showcase), the `website/`, and dev tooling — uses lighter rules: their dependency updates (including majors) may merge on green CI without the core's major-isolation ceremony.
- **Audit scope.** The `security:audit` release gate audits the *published* surface — `npm audit --omit=dev --audit-level=high`. Since the package publishes `"dependencies": {}`, this is exactly what consumers install. Advisories confined to dev/peer/build tooling or the docs `website/` are tracked and patched via Dependabot but do not block releases — they cannot reach consumers. Patch them in their own PRs.
- Application security checks are required in PR reviews:
  - Auth/authz bypass risk, privilege escalation, and data exposure in handlers, decorators, and context wiring.
  - Input-validation gaps and injection surfaces (command/template/SQL-like patterns, prototype pollution, path traversal).
  - Unsafe dynamic execution (`eval`, `new Function`) and unsafe deserialization patterns.
  - Secret leakage in code, tests, sample files, logs, and documentation.
  - Transport risks such as insecure CORS/CSRF assumptions, SSRF vectors, and open redirects when relevant.
- Any unresolved high-risk security finding blocks merge until mitigated or explicitly accepted by maintainers.

### 9. Release Version Synchronization (MANDATORY)
- Version drift between `packages/trpc` and `sample/*` is a release blocker.
- When bumping `packages/trpc/package.json` version, update ALL `sample/*/package.json` entries for `"@nest-native/trpc"` in the same change.
- Regenerate `package-lock.json` after version alignment (`npm install`) so resolution state is consistent.
- Never publish if any sample still points to an older package version.
- `npm run release:check` is a release blocker:
  - sample version sync must pass
  - compatibility-table sync must pass: both README compatibility tables, the support policy, installation, and the support line above carry the `engines` floor and the `@nestjs/*` peer range from `packages/trpc/package.json` (`scripts/check-compat-tables.mjs`)
  - README link validation must pass
  - workspace resolution must show the target version everywhere
  - package tarball validation must pass and exclude unintended artifacts such as `.tsbuildinfo`

Required pre-publish checklist:
1. Bump version in `packages/trpc/package.json`.
2. Update `sample/*/package.json` to the exact same `@nest-native/trpc` version.
3. Run `npm install`.
4. Run `npm run release:check`.
5. Run `npm ls @nest-native/trpc --workspaces --depth=0` and verify every sample resolves to the target version.
6. Run full validation: `npm run ci`.

Required post-publish checklist:
1. Tag the release commit on `main`: `git tag v<version> <release-commit-sha> && git push origin v<version>`. Use a lightweight tag named `v<version>` (e.g. `v0.4.3`) pointing at the `chore: release v<version>` commit. Tag pushes bypass `main`'s branch-protection rules and do not require a PR.
2. Confirm registry version exists: `npm view @nest-native/trpc@<version> version`.
3. Download published artifact: `npm pack @nest-native/trpc@<version>`.
4. Re-run `npm run ci` with samples pinned to that published version before closing the release.

### 10. Cognitive Complexity Review
- When changes touch `packages/trpc/**/*.ts`, AI agents should run `npm run complexity:check` and `npm run complexity:report`.
- CI enforces SonarJS' default cognitive-complexity threshold of `15` per package source function.
- Treat the PR complexity report as a review signal for deltas and hotspots, not an automatic refactor mandate.
- Do not reduce complexity by weakening Nest-native architecture, public API clarity, validation behavior, or test coverage.

### 11. Mutation testing (Stryker — occasional targeted audit, local only, never in CI)

Mutation testing here is an **occasional, targeted audit — not a per-PR gate**.
Run it deliberately when you've written or reworked non-trivial logic in a file
and want to know whether its tests actually pin the behavior. It has found real
gaps here (a param-metadata `propertyKey` guard, redundant serializer branches),
so it is worth doing — occasionally and precisely. Plain `npm test` and CI are
unchanged; **CI never runs mutation testing.**

**Run it scoped, never full-package.** The command runner re-runs the whole
suite per mutant, so a full run is slow and a large surface can time out. Scope
to the one file you changed:

- `STRYKER_MUTATE='packages/trpc/generators/zod-serializer.ts' npx stryker run --concurrency 2`
  — low concurrency keeps RAM in check and avoids the CPU oversubscription that
  turns kills into timeouts. Read survivors from
  `reports/stryker-incremental.json` or `reports/mutation/mutation.html`.
- `npm run test:mutation` / `test:mutation:full` remain for incremental / full
  passes; expect them to be slow on a large surface.

**Verify a kill without re-running Stryker — the fast path.** Hand-apply the
surviving mutation to the source, run the plain suite (or just the one spec),
confirm your new test fails, then `git checkout --` to revert. This decouples
the slow "find survivors" step from a fast "prove the kill" step.

**If a run times out, kill the leftovers first** — a killed Stryker command can
leave detached test processes that starve the next run; `pgrep -f stryker`,
`kill -9`, confirm RAM recovered, then retry.

Treat each survivor by the doctrine: add a test that kills it; simplify
redundant code whose mutant is behaviorally equivalent (with a CHANGELOG note);
mark a genuine equivalent with `// Stryker disable next-line <Mutator>:
<reason>`; or, for timing/randomness, assert bounds/progression. Keep CI fast —
that is a deliberate contract.

### 12. Peer majors — NestJS 12 and the recipe for the next one

**The peer-major recipe (applied to NestJS 12 on 2026-09-06).** A new major of a
peer dependency is *widened into*, never *swapped to*:

1. Widen the published range in `packages/trpc/package.json`
   (`"@nestjs/common": "^11.0.0 || ^12.0.0"`, same for `@nestjs/core`).
2. Keep the devDependencies and the lockfile on the older major, so the default
   `npm ci` + suite + samples keep testing that end of the range.
3. Add the new end to the `nestjs-compat` matrix in `.github/workflows/ci.yml`.
   Each entry installs one end of the range on top of the lockfile with
   `--no-save` and runs the suite **and every sample** against it: the
   `11 floor` entry pins `11.0.0` exactly (the reason is written next to the
   pin), the `12` entry floats on `^12.0.0`. Both ends of the range are then
   tested claims, not assumptions. A floor is an install-graph fact, not a
   source fact: `11.0.0` is this package's floor because nothing it uses was
   added by a later 11.x, but `@nestjs/platform-fastify` 11.0.0 and 11.0.1
   shipped peering `^10`, so the entry pins fastify at `11.0.2` separately,
   and `@nestjs/config` (sample 09) has its own version line and its own
   field. Such sibling floors are not peer-range corrections — no consumer can
   reach the versions below them — and the published range changes only if
   the suite actually fails at a floor.
4. Prove what the tree actually is before running anything, because npm makes
   it easy to test a tree you did not ask for. The samples pin the `@nestjs/*`
   set to an exact version, so a root-only install either fails with ERESOLVE
   or nests the old major under each sample and the samples "pass on 12" while
   running on 11 — the leg installs with `--workspaces --include-workspace-root`.
   A downgrade that silently no-ops leaves the lockfile's 11.x in place, which
   a major check accepts, and a peer conflict npm can override is a warning
   plus exit 0 that neither `npm ls` nor `--strict-peer-deps` reports
   afterwards (the previous 12 leg carried exactly that: sample 09's
   `@nestjs/config@^4` peers `^10 || ^11`, npm overrode it, and the run was
   green) — so the leg runs `scripts/check-nestjs-resolution.mjs`, which
   requires the *exact* pinned version from inside every workspace, fails on
   nested copies, and checks every peer range in the NestJS ecosystem — every
   installed package at any depth that is `@nestjs/*` or peers on one, this
   package's own published ranges included — against the tree the suite will
   run on. That final-tree check is the gate; grepping the install log for
   the warning was tried and dropped, because npm also prints it for
   transitional states that end coherent (replacing `@nestjs/*` under a
   package whose peers admit both majors prints dozens in the sibling repos
   for a tree the check then proves clean). The same script runs with no
   argument in `release:check`, against the lockfile.
5. Update the support line here, both README compatibility tables
   (`README.md` and `packages/trpc/README.md` — the one npm shows),
   `website/docs/support-policy.md`, `website/docs/installation.md`, and the
   claims matrix, in the same PR as the code and the leg.
   `scripts/check-compat-tables.mjs` (in `npm run release:check`) fails when
   any of them lags the manifest's `engines` floor or `@nestjs/*` peer range —
   the package README was left on Node `>=20` by the Node 20 sunset and on
   NestJS `11.x` by the first pass of this widening, which is why the check
   exists.

A Dependabot PR that moves the devDependencies and lockfile to the new major is
a separate, deliberate decision (it drops the old major from the default suite);
it is not implied by widening the peer range. **The default major flips on a
trigger, not per PR:** when either NestJS 12 exceeds 50% of `@nestjs/core`'s
weekly downloads or NestJS 11 stops receiving patches, whichever comes first.
Read the split from `https://api.npmjs.org/versions/@nestjs%2Fcore/last-week`
(on 2026-09-12: 11 at 71%, 10 at 19%, 12 at 5%). NestJS has no LTS; the
previous major has received patches for roughly a year after the next one
shipped. Flipping means the `12` matrix entry becomes the default install, the
`11 floor` entry stays, and the standing grouped Dependabot PR for the peer
set is merged. Until then that PR stays open as the signal that the upgrade is
one merge away — a green run is not a reason to merge it.

**NestJS 12 is ESM-only — never deep-import a directory index from `@nestjs/*`.**
`@nestjs/common` and `@nestjs/core` ship an exports map of
`{ ".", "./internal", "./*.js", "./*": "./*.js" }`. A deep import of a *file*
path such as `@nestjs/core/injector/constants` resolves (to
`./injector/constants.js`) and is fine. A deep import of a *directory* such as
`@nestjs/common/interfaces` does not: there is no `interfaces.js`, and ESM does
not resolve a directory index through `./*` — TS2307 at build time,
`ERR_MODULE_NOT_FOUND` at runtime. That one import was the only thing in this
package that broke on 12; it is now a local `type Controller = object` alias
(exactly how Nest 12 defines the type). `packages/trpc/test/nestjs-deep-imports.spec.ts`
enforces the rule: it scans every `.ts` file in the package for
`@nestjs/<pkg>/<subpath>` specifiers and fails unless `<subpath>.js` is a
regular file inside the installed package, on whichever Nest major is
installed. Do not work around it with a deeper path such as
`@nestjs/common/interfaces/controllers/controller.interface` — that is still an
internal path, and the type is plain `object` on 12 anyway.

**The Node floor stays `>=22`; NestJS 12 needs `>=22.12` of it.** This package
publishes CommonJS, and a CommonJS app loads the ESM-only NestJS 12 through
Node's `require(esm)`, which is unflagged on Node `>=22.12` (and `>=20.19`,
below this package's floor). `engines.node` stays `>=22` because it describes
the whole peer range — the NestJS 11 end runs on any Node 22 — but every place
that states the floor (the support line above, both READMEs, the support
policy, installation) carries the `>=22.12` qualifier for 12, so nobody reads
`>=22` as "any Node 22 runs NestJS 12". Raising `engines` to `>=22.12` would
be a floor change for 11 users and is a separate decision.

**Dual CommonJS/ESM publishing is a dated non-goal; revisit in 2027.** Every
community NestJS library that supports 12 today (nestjs-cls, nestjs-pino, the
OpenTelemetry and throttler packages) publishes CommonJS and loads 12 through
`require(esm)` exactly as this package does, and no consumer has asked for ESM
output. An ESM or dual build is a breaking change with a real cost and no
demonstrated benefit, so do not start one "while at it". Revisit when a
consumer cannot load the package, or when those community libraries move.

**NestJS 12 reorders lifecycle hooks.** `onModuleInit`, `onApplicationBootstrap`
and the shutdown hooks now run by component hierarchy level, not by
registration order. Nothing in this package — code, tests, or samples — may
assume a cross-provider lifecycle order, and no test may assert one.
