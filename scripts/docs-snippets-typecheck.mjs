#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, 'website', 'docs');
const OUT_DIR = path.join(ROOT, '.tmp', 'docs-snippets');

const FENCE_RE = /```(?:ts|typescript)([^\n]*)\n([\s\S]*?)```/g;
const SKIP_MARKERS = ['no-doc-check', 'ignore-doc-check'];

const IGNORED_DIAGNOSTIC_CODES = new Set([
  2304, // Cannot find name (many docs snippets are partial by design)
  2307, // Cannot find module (e.g. generated types in docs examples)
  2580, // Cannot find name 'require'
  2582, // Cannot find name 'describe' / test globals
  2593, // Cannot find name 'describe'/'it' in test-style snippets
  1378, // Top-level await when module/target don't allow it in snippet context
  7016, // Missing declaration file for external package used in docs snippet
  2339, // Property does not exist on type (partial class snippets)
  2532, // Object is possibly undefined (partial snippets often omit guards)
  2552, // Cannot find name (often references snippet-local values from prior context)
]);

function findTopLevelDecoratorIndex(lines) {
  let depth = 0;
  let lastTopLevelDecoratorIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (depth === 0 && /^\s*@\w+/.test(line)) {
      lastTopLevelDecoratorIndex = i;
    }

    for (const ch of line) {
      if (ch === '{') {
        depth += 1;
      } else if (ch === '}') {
        depth = Math.max(0, depth - 1);
      }
    }
  }

  return lastTopLevelDecoratorIndex;
}

function normalizeSnippet(code) {
  const lines = code.split('\n');
  const decoratorIndex = findTopLevelDecoratorIndex(lines);
  if (decoratorIndex === -1) {
    return code;
  }

  const beforeDecorator = lines.slice(0, decoratorIndex);
  const fromDecorator = lines.slice(decoratorIndex);
  const candidate = fromDecorator.join('\n');

  if (/^\s*(export\s+)?class\s+\w+/m.test(candidate)) {
    return code;
  }

  const indented = candidate
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n');

  const prefix = beforeDecorator.join('\n').trim();
  const wrapped = `class __DocSnippetClass {\n${indented}\n}`;

  return prefix ? `${prefix}\n\n${wrapped}` : wrapped;
}

function collectMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function safeFileBase(filePath, index) {
  const rel = path.relative(DOCS_DIR, filePath).replace(/\.md$/, '');
  return rel.replace(/[\\/]/g, '__') + `__snippet_${index}`;
}

function cleanOutDir() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function extractSnippetsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const snippets = [];
  let match;
  let index = 0;

  while ((match = FENCE_RE.exec(content)) !== null) {
    const fenceMeta = (match[1] ?? '').trim();
    if (SKIP_MARKERS.some(marker => fenceMeta.includes(marker))) {
      continue;
    }

    index += 1;
    const snippet = match[2].trim();
    if (!snippet) {
      continue;
    }

    snippets.push({
      code: snippet,
      index,
      fenceMeta,
    });
  }

  return snippets;
}

function writeSnippetFiles(markdownFiles) {
  const generatedFiles = [];
  let snippetCount = 0;

  for (const mdFile of markdownFiles) {
    const snippets = extractSnippetsFromFile(mdFile);

    for (const snippet of snippets) {
      const base = safeFileBase(mdFile, snippet.index);
      const outPath = path.join(OUT_DIR, `${base}.ts`);
      const rel = path.relative(ROOT, mdFile);
      const header = [
        `// source: ${rel}`,
        `// snippet: ${snippet.index}`,
        '',
      ].join('\n');

      const normalized = normalizeSnippet(snippet.code);
      const body = `${header}${normalized}\n\nexport {};\n`;
      fs.writeFileSync(outPath, body, 'utf8');

      generatedFiles.push(outPath);
      snippetCount += 1;
    }
  }

  return { generatedFiles, snippetCount };
}

function formatDiagnostic(diagnostic) {
  const file = diagnostic.file;
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  if (!file || diagnostic.start == null) {
    return `TS${diagnostic.code}: ${message}`;
  }

  const pos = file.getLineAndCharacterOfPosition(diagnostic.start);
  const relPath = path.relative(ROOT, file.fileName);
  return `${relPath}:${pos.line + 1}:${pos.character + 1} - TS${diagnostic.code}: ${message}`;
}

function runTypecheck(fileNames) {
  const compilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    strict: false,
    noImplicitAny: false,
    skipLibCheck: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    resolveJsonModule: true,
    types: ['node', 'mocha'],
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
  };

  const program = ts.createProgram(fileNames, compilerOptions);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  const relevantDiagnostics = diagnostics.filter(
    diag => !IGNORED_DIAGNOSTIC_CODES.has(diag.code),
  );

  return relevantDiagnostics;
}

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Docs directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  cleanOutDir();

  const markdownFiles = collectMarkdownFiles(DOCS_DIR);
  const { generatedFiles, snippetCount } = writeSnippetFiles(markdownFiles);

  if (generatedFiles.length === 0) {
    console.log('No TypeScript snippets found in website/docs.');
    process.exit(0);
  }

  const diagnostics = runTypecheck(generatedFiles);

  if (diagnostics.length > 0) {
    console.error(`Docs snippet typecheck failed.`);
    console.error(`Checked ${snippetCount} snippets from ${markdownFiles.length} docs files.`);
    console.error('');

    for (const diagnostic of diagnostics) {
      console.error(formatDiagnostic(diagnostic));
    }

    process.exit(1);
  }

  console.log(
    `Docs snippet typecheck passed (${snippetCount} snippets, ${markdownFiles.length} files).`,
  );
}

main();
