#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import ts from 'typescript';

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
const sourceFileCache = new Map();

for (const result of eslintResults) {
  const filePath = path.relative(ROOT, result.filePath).replace(/\\/g, '/');
  const sourceFile = getSourceFile(result.filePath);

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
      ...findNearestFunctionSymbol(sourceFile, message.line, message.column),
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

function getSourceFile(filePath) {
  const resolved = path.resolve(filePath);
  const cached = sourceFileCache.get(resolved);
  if (cached) {
    return cached;
  }

  const sourceText = fs.readFileSync(resolved, 'utf8');
  const sourceFile = ts.createSourceFile(
    resolved,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  sourceFileCache.set(resolved, sourceFile);
  return sourceFile;
}

function findNearestFunctionSymbol(sourceFile, line, column) {
  const position = sourceFile.getPositionOfLineAndCharacter(
    Math.max(0, line - 1),
    Math.max(0, column - 1),
  );
  const candidates = [];

  visit(sourceFile, []);

  candidates.sort((a, b) => {
    const aWidth = a.end - a.start;
    const bWidth = b.end - b.start;
    return aWidth - bWidth || b.start - a.start;
  });

  const candidate = candidates[0];
  if (!candidate) {
    return {
      symbol: '(unknown function)',
      kind: 'unknown',
    };
  }

  return {
    symbol: candidate.symbol,
    kind: candidate.kind,
  };

  function visit(node, classStack) {
    const nextClassStack = ts.isClassLike(node) && node.name
      ? [...classStack, node.name.text]
      : classStack;

    if (isFunctionLikeNode(node)) {
      const start = node.getStart(sourceFile);
      const end = node.end;
      if (position >= start && position <= end) {
        candidates.push({
          start,
          end,
          ...describeFunctionLike(node, nextClassStack, sourceFile),
        });
      }
    }

    ts.forEachChild(node, child => visit(child, nextClassStack));
  }
}

function isFunctionLikeNode(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node)
  );
}

function describeFunctionLike(node, classStack, sourceFile) {
  if (ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) {
    const methodName = node.name ? propertyNameToText(node.name, sourceFile) : '(anonymous method)';
    const className = classStack.at(-1);
    return {
      symbol: className ? `${className}.${methodName}` : methodName,
      kind: 'method',
    };
  }

  if (ts.isConstructorDeclaration(node)) {
    const className = classStack.at(-1);
    return {
      symbol: className ? `${className}.constructor` : 'constructor',
      kind: 'constructor',
    };
  }

  if (ts.isFunctionDeclaration(node)) {
    return {
      symbol: node.name?.text ?? '(anonymous function)',
      kind: 'function',
    };
  }

  const assignedName = getAssignedFunctionName(node, sourceFile);
  return {
    symbol: assignedName ?? '(anonymous callback)',
    kind: ts.isArrowFunction(node) ? 'arrow-function' : 'function-expression',
  };
}

function propertyNameToText(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) {
    return name.text;
  }
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return name.getText(sourceFile);
}

function getAssignedFunctionName(node, sourceFile) {
  const parent = node.parent;
  if (!parent) {
    return undefined;
  }

  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }

  if (
    ts.isPropertyAssignment(parent) ||
    ts.isPropertyDeclaration(parent) ||
    ts.isBinaryExpression(parent)
  ) {
    const name = ts.isBinaryExpression(parent) ? parent.left : parent.name;
    return name ? propertyNameToText(name, sourceFile) : undefined;
  }

  return undefined;
}
