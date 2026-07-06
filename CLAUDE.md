# CLAUDE.md

@GUIDELINES_NEST_TRPC.md

The imported guidelines are binding. Two always-on rules:
- Stryker mutation testing is local-only — never wire it into CI.
- Mutation testing is an **occasional, targeted audit — not a per-PR gate**. Run it deliberately when you've reworked a file's logic: scope with `STRYKER_MUTATE` to that one file, `--concurrency 2`, and verify a kill by hand-applying the mutation + running the plain suite (see the guidelines' Mutation testing section).
