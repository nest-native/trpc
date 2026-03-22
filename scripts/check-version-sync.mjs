import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'packages/trpc/package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const targetVersion = packageJson.version;
const sampleRoot = path.join(repoRoot, 'sample');

const mismatches = [];

for (const entry of fs.readdirSync(sampleRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const samplePackagePath = path.join(sampleRoot, entry.name, 'package.json');
  if (!fs.existsSync(samplePackagePath)) {
    continue;
  }

  const samplePackage = JSON.parse(fs.readFileSync(samplePackagePath, 'utf8'));
  const resolvedVersion = samplePackage.dependencies?.['nest-trpc-native'];

  if (resolvedVersion !== targetVersion) {
    mismatches.push({
      sample: entry.name,
      expected: targetVersion,
      actual: resolvedVersion ?? '<missing>',
    });
  }
}

if (mismatches.length > 0) {
  const details = mismatches
    .map(
      mismatch =>
        `- sample/${mismatch.sample}/package.json expected ${mismatch.expected} but found ${mismatch.actual}`,
    )
    .join('\n');
  throw new Error(`Sample version drift detected:\n${details}`);
}

console.log(
  `Version sync OK: all sample workspaces depend on nest-trpc-native@${targetVersion}.`,
);
