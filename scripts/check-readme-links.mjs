import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const markdownFiles = [
  'README.md',
  'packages/trpc/README.md',
  'sample/README.md',
];
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const failures = [];

for (const relativeFilePath of markdownFiles) {
  const absoluteFilePath = path.join(repoRoot, relativeFilePath);
  const content = fs.readFileSync(absoluteFilePath, 'utf8');
  const directory = path.dirname(absoluteFilePath);

  for (const match of content.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].trim();

    if (
      rawTarget === '' ||
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('mailto:') ||
      rawTarget.startsWith('#')
    ) {
      continue;
    }

    const normalizedTarget = rawTarget.split('#')[0].split('?')[0];
    const resolvedTarget = path.resolve(directory, normalizedTarget);

    if (!fs.existsSync(resolvedTarget)) {
      failures.push(
        `${relativeFilePath}: missing target "${rawTarget}" resolved to "${path.relative(
          repoRoot,
          resolvedTarget,
        )}"`,
      );
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Broken README links detected:\n${failures.join('\n')}`);
}

console.log('README link validation OK.');
