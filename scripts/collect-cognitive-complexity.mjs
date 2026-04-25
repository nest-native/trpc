#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const ROOT = process.cwd();
const require = createRequire(import.meta.url);
const DEFAULT_OUTPUT = path.join(
  ROOT,
  'complexity',
  'cognitive-complexity-summary.json',
);

const outputPath = path.resolve(
  parseArg('--output') ?? process.env.COMPLEXITY_OUTPUT ?? DEFAULT_OUTPUT,
);

const eslintBin = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
);

const eslintOutput = execFileSync(
  eslintBin,
  [
    '--config',
    'eslint.complexity.config.mjs',
    '--format',
    'json',
    'packages/trpc/**/*.ts',
  ],
  {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  },
);

const eslintResults = JSON.parse(eslintOutput);
const entries = [];

for (const result of eslintResults) {
  const filePath = path.relative(ROOT, result.filePath).replace(/\\/g, '/');

  for (const message of result.messages) {
    if (message.ruleId !== 'sonarjs/cognitive-complexity') {
      continue;
    }

    const complexity = extractComplexity(message.message);
    if (complexity == null || complexity <= 0) {
      continue;
    }

    entries.push({
      file: filePath,
      line: message.line,
      column: message.column,
      complexity,
      message: message.message,
    });
  }
}

entries.sort(
  (a, b) =>
    b.complexity - a.complexity ||
    a.file.localeCompare(b.file) ||
    a.line - b.line ||
    a.column - b.column,
);

const fileTotals = {};
for (const entry of entries) {
  const current = fileTotals[entry.file] ?? {
    file: entry.file,
    totalComplexity: 0,
    functionCount: 0,
    maxComplexity: 0,
  };
  current.totalComplexity += entry.complexity;
  current.functionCount += 1;
  current.maxComplexity = Math.max(current.maxComplexity, entry.complexity);
  fileTotals[entry.file] = current;
}

const files = Object.values(fileTotals).sort(
  (a, b) =>
    b.totalComplexity - a.totalComplexity ||
    b.maxComplexity - a.maxComplexity ||
    a.file.localeCompare(b.file),
);

const summary = {
  generatedAt: new Date().toISOString(),
  tool: {
    eslint: readPackageVersion('eslint'),
    eslintPluginSonarjs: readPackageVersion('eslint-plugin-sonarjs'),
    typescriptEslintParser: readPackageVersion('@typescript-eslint/parser'),
  },
  scope: {
    include: ['packages/trpc/**/*.ts'],
    exclude: ['packages/trpc/test/**', '**/dist/**', '**/*.d.ts', '**/*.js'],
  },
  totals: {
    files: files.length,
    functions: entries.length,
    totalComplexity: entries.reduce(
      (total, entry) => total + entry.complexity,
      0,
    ),
    maxComplexity: entries[0]?.complexity ?? 0,
  },
  files,
  entries,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(
  `Cognitive complexity report written to ${path.relative(ROOT, outputPath)}`,
);

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

function extractComplexity(message) {
  const match = message.match(/Cognitive Complexity from (\d+) to/i);
  return match ? Number(match[1]) : undefined;
}

function readPackageVersion(packageName) {
  const packageJson = fs.readFileSync(
    require.resolve(`${packageName}/package.json`),
    'utf8',
  );
  return JSON.parse(packageJson).version;
}
