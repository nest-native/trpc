# CLAUDE.md

@GUIDELINES_NEST_TRPC.md

The imported guidelines are binding. Two always-on rules:
- Stryker mutation testing is local-only — never wire it into CI.
- Pre-PR ritual: `npm run test:mutation` (scope with `STRYKER_MUTATE` to changed files) and report surviving mutants in the PR body.
