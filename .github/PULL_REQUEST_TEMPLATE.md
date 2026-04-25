## Summary

- Describe the user-facing or maintainer-facing outcome of this PR.
- Call out any package version, compatibility, or release-process changes.
- Link related issues or follow-up PRs.

## Changes

- List the main implementation changes.
- List any docs or sample updates.
- List any public API changes, if applicable.

## Public API / Compatibility

- [ ] No public API change
- [ ] Public API change is intentional and documented
- [ ] Primary onboarding examples still use only `TrpcModule`, decorators, and generated `AppRouter`
- [ ] `TrpcRouter` appears only in testing-oriented guidance, if mentioned
- [ ] Unsupported internals are not exposed in root exports, installation docs, or quick-start docs

## Security Review

- [ ] Reviewed auth/authz bypass risk
- [ ] Reviewed context data exposure risk
- [ ] Reviewed input-validation and injection surfaces
- [ ] Reviewed path traversal, unsafe dynamic execution, and unsafe deserialization risks
- [ ] Reviewed secret leakage in code, tests, samples, docs, and logs
- [ ] Reviewed transport assumptions such as CORS, CSRF, request limits, and redirects where relevant
- [ ] No unresolved high-risk security finding remains

## Dependency Review

- [ ] No dependency or lockfile changes
- [ ] Dependency or lockfile changes are intentional and explained
- [ ] Reviewed lifecycle scripts (`preinstall`, `install`, `postinstall`, `prepare`)
- [ ] Confirmed no unapproved Git/URL dependencies
- [ ] Confirmed package changes preserve `"dependencies": {}` for `packages/trpc`, or documented the maintainer-approved exception

## Validation

- [ ] `git diff --check`
- [ ] `npm run test:cov`
- [ ] `npm run release:check`
- [ ] `npm run ci:docs`
- [ ] `npm run ci:sample`
- [ ] `npm run ci`
- [ ] Not run; explained below

## Validation Notes

- Explain skipped checks, local environment limits, or follow-up validation needs.

## Release Notes

- [ ] No release impact
- [ ] Release impact: update `CHANGELOG.md`
- [ ] Release impact: package + sample versions aligned

## Publishing Checklist

- [ ] Reviewed `RELEASING.md`
- [ ] Package and sample versions are aligned for release PRs
- [ ] If an AI coding agent changed this PR, it was given the repo-specific guidance in `AI_CODING_GUIDELINES.md`
