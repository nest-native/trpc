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
const REPORT_CONFIG = 'biome.complexity-report.json';
const COMPLEXITY_RULE = 'lint/complexity/noExcessiveCognitiveComplexity';
const MAX_DIAGNOSTICS = 5000;
// Biome's rule cannot be configured below `maxAllowedComplexity: 1`, so it only
// reports functions scoring 2 or more. Functions at 0 or 1 are absent from the
// report by construction — they are the trivial ones this report never had
// anything to say about.
const MINIMUM_REPORTED_COMPLEXITY = 2;

const outputPath = path.resolve(
  parseArg('--output') ?? process.env.COMPLEXITY_OUTPUT ?? DEFAULT_OUTPUT,
);

const biomeBin = path.join(
  ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'biome.cmd' : 'biome',
);

// The report config lowers the rule to its floor (`maxAllowedComplexity: 1`) at
// warn level, so every non-trivial function is reported and Biome still exits 0.
const biomeOutput = execFileSync(
  biomeBin,
  [
    'lint',
    `--config-path=${REPORT_CONFIG}`,
    '--reporter=json',
    `--max-diagnostics=${MAX_DIAGNOSTICS}`,
    'packages/trpc',
  ],
  {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  },
);

const biomeReport = JSON.parse(biomeOutput);

// Biome truncates past --max-diagnostics; a silent cap would understate the
// report, so refuse to write a partial one.
const notPrinted = biomeReport.summary?.diagnosticsNotPrinted ?? 0;
if (notPrinted > 0) {
  throw new Error(
    `Biome truncated ${notPrinted} diagnostics (--max-diagnostics=${MAX_DIAGNOSTICS}); raise MAX_DIAGNOSTICS in scripts/collect-cognitive-complexity.mjs.`,
  );
}

// Biome reports "checked 0 files" as a success, so a renamed directory or a
// stale glob would silently disable both this report and the gate that shares
// its scope. An empty scope is a configuration bug, not a clean run.
const filesChecked =
  (biomeReport.summary?.changed ?? 0) + (biomeReport.summary?.unchanged ?? 0);
if (filesChecked === 0) {
  throw new Error(
    `Biome checked 0 files — the scope in ${REPORT_CONFIG} no longer matches any source.`,
  );
}

const entries = [];
const sourceFileCache = new Map();

for (const diagnostic of biomeReport.diagnostics ?? []) {
  if (diagnostic.category !== COMPLEXITY_RULE) {
    continue;
  }

  const complexity = extractComplexity(diagnostic.message);
  if (complexity == null || complexity <= 0) {
    continue;
  }

  const filePath = diagnostic.location.path.replace(/\\/g, '/');
  const { line, column } = diagnostic.location.start;
  const sourceFile = getSourceFile(path.join(ROOT, filePath));

  entries.push({
    file: filePath,
    line,
    column,
    ...findNearestFunctionSymbol(sourceFile, line, column),
    complexity,
    message: diagnostic.message,
  });
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
    biome: readPackageVersion('@biomejs/biome'),
    rule: COMPLEXITY_RULE,
    config: REPORT_CONFIG,
  },
  scope: {
    include: ['packages/trpc/**/*.ts'],
    exclude: ['**/test/**', '**/dist/**', '**/*.d.ts'],
    minimumReportedComplexity: MINIMUM_REPORTED_COMPLEXITY,
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
  const match = message.match(/Excessive complexity of (\d+) detected/i);
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

  // Biome scores nested functions in their own right, so the innermost match is
  // often an inline callback. Naming it after the enclosing method keeps the
  // report's rows identifiable ("MysqlScheduleStore.claimDue → callback").
  const isAnonymous = symbol => symbol.startsWith('(anonymous');
  if (!isAnonymous(candidate.symbol)) {
    return {
      symbol: candidate.symbol,
      kind: candidate.kind,
    };
  }

  const named = candidates.slice(1).find(other => !isAnonymous(other.symbol));
  return {
    symbol: named ? `${named.symbol} → callback` : candidate.symbol,
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
  if (
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    const methodName = node.name
      ? propertyNameToText(node.name, sourceFile)
      : '(anonymous method)';
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
