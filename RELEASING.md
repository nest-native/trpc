# Releasing

This repository keeps release mechanics intentionally lightweight for `0.x`, but the checks in [AI_CODING_GUIDELINES.md](AI_CODING_GUIDELINES.md) are mandatory.

## Pre-publish

1. Bump `packages/trpc/package.json` to the target version.
2. Update every `sample/*/package.json` `nest-trpc-native` dependency to the exact same version.
3. Run `npm install` to regenerate `package-lock.json`.
4. Run `npm run release:check`.
5. Run `npm run ci`.

## Required Verification

Run this before publishing:

```bash
npm ls nest-trpc-native --workspaces --depth=0
```

That output must show every sample resolving to the target version.

## Publish

Publish the package from the workspace:

```bash
npm publish --workspace nest-trpc-native
```

## Post-publish

1. Confirm the registry version exists:

```bash
npm view nest-trpc-native@<version> version
```

2. Download the published artifact:

```bash
npm pack nest-trpc-native@<version>
```

3. Re-run `npm run ci` with samples pinned to the published version before closing the release.
