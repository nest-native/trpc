#!/usr/bin/env node

// Proves that the NestJS actually installed is the NestJS this run claims to
// test. Every workspace is checked from inside its own directory, because npm
// nests an older copy under a workspace whenever the hoisted version does not
// satisfy that workspace's own range, and a suite that passes against a mixed
// tree proves nothing about the claimed version.
//
//   node scripts/check-nestjs-resolution.mjs [<framework-spec>] [<name>@<spec> ...]
//
// - <framework-spec> applies to the packages released in lockstep with
//   @nestjs/core (common, core, testing, microservices, platform-express,
//   platform-fastify, websockets). A bare version ("11.0.0") means EXACTLY
//   that version, so a floor leg whose downgrade silently no-oped — leaving
//   the lockfile's 11.x in place — fails instead of passing as "still 11". A
//   range ("^12.0.0") means satisfies. Without it, each package is checked
//   against the range the repo declares for it (root first, then the
//   workspaces; @nestjs/core's range when nothing declares it), which is what
//   the release gate runs against the lockfile.
// - <name>@<spec> pins a package that lives on its own version line
//   (@nestjs/swagger, @nestjs/config), or overrides the framework spec for a
//   lockstep package whose installable floor is not the framework floor
//   (@nestjs/platform-fastify 11.0.0 and 11.0.1 shipped peering ^10, so a
//   floor leg pins it at 11.0.2). Same exact-vs-range rule.
// - Every hoisted package that peers on an @nestjs/* package — pinned or not,
//   @nestjs/* or not, the workspaces' own published peer ranges included —
//   must have that peer satisfied by the hoisted copy. npm does not fail on a
//   peer conflict it can override: it prints `npm warn ERESOLVE overriding
//   peer dependency` and exits 0, and neither `npm ls` nor `--strict-peer-deps`
//   reports it afterwards. This pass turns that warning into a failure.
// - Every checked package must resolve to the hoisted root copy. A nested
//   copy means the tree is mixed, even when its version is right.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';

const FRAMEWORK_PACKAGES = [
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/microservices',
  '@nestjs/platform-express',
  '@nestjs/platform-fastify',
  '@nestjs/testing',
  '@nestjs/websockets',
];
const ALWAYS_CHECKED = ['@nestjs/common', '@nestjs/core'];

const repoRoot = process.cwd();
const rootManifest = readJson(path.join(repoRoot, 'package.json'));
const { frameworkSpec, pins } = parseArguments(process.argv.slice(2));
const failures = [];

console.log(
  `Framework spec: ${frameworkSpec === undefined ? 'the ranges the repo declares' : describe(frameworkSpec)}`,
);
for (const [name, spec] of pins) {
  console.log(`Pinned:         ${name}@${describe(spec)}`);
}
console.log();

for (const workspaceDir of ['.', ...collectWorkspaceDirs()]) {
  const manifestPath = path.join(repoRoot, workspaceDir, 'package.json');
  const declared = declaredNestPackages(manifestPath);
  const checked = new Map();

  for (const name of FRAMEWORK_PACKAGES) {
    const isRootAndInstalled = workspaceDir === '.' && isResolvable(manifestPath, name);

    if (ALWAYS_CHECKED.includes(name) || declared.has(name) || isRootAndInstalled) {
      checked.set(name, frameworkSpec ?? rangeDeclaredByRepo(name));
    }
  }

  for (const [name, spec] of pins) {
    if (workspaceDir === '.' || declared.has(name)) {
      checked.set(name, spec);
    }
  }

  for (const [name, spec] of [...checked].sort()) {
    checkResolution(workspaceDir, manifestPath, name, spec);
  }
}

console.log();
checkPeerCoherence();

if (failures.length > 0) {
  console.error(`\nNestJS resolution check FAILED:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `\nEvery workspace resolves NestJS ${
    frameworkSpec === undefined ? 'as the repo declares it' : describe(frameworkSpec)
  } from the root node_modules, and every peer range on @nestjs/* is satisfied by the hoisted copy.`,
);

function checkResolution(workspaceDir, manifestPath, name, spec) {
  const installed = resolveInstalled(createRequire(manifestPath), name);

  if (installed === undefined) {
    failures.push(`${workspaceDir} cannot resolve ${name}, which was expected at ${describe(spec)}`);
    return;
  }

  const { version, location } = installed;
  const hoistedLocation = path.join('node_modules', name);

  console.log(`${workspaceDir.padEnd(36)} ${name.padEnd(28)} ${version.padEnd(9)} <- ${location}`);

  if (!matches(version, spec)) {
    failures.push(`${workspaceDir} resolves ${name}@${version}; expected ${describe(spec)}`);
  } else if (location !== hoistedLocation) {
    failures.push(
      `${workspaceDir} resolves ${name}@${version} from a nested copy at ${location}; ` +
        `expected the hoisted ${hoistedLocation} — the tree is mixed`,
    );
  }
}

function checkPeerCoherence() {
  for (const packageDir of hoistedPackageDirs()) {
    const manifest = readJson(path.join(packageDir, 'package.json'));
    const peers = Object.entries(manifest.peerDependencies ?? {}).filter(([peer]) =>
      peer.startsWith('@nestjs/'),
    );

    for (const [peer, range] of peers) {
      const optional = manifest.peerDependenciesMeta?.[peer]?.optional === true;
      const installed = resolveInstalled(createRequire(path.join(packageDir, 'package.json')), peer);
      const owner = `${manifest.name}@${manifest.version}`;

      if (installed === undefined) {
        if (!optional) {
          failures.push(`${owner} requires peer ${peer}@${range}, which is not installed`);
        }
        continue;
      }

      const { version, location } = installed;
      const hoistedLocation = path.join('node_modules', peer);
      const satisfied = semver.satisfies(version, range);
      const status = !satisfied ? 'UNSATISFIED' : location !== hoistedLocation ? 'NESTED' : 'ok';

      console.log(`${owner.padEnd(48)} peer ${peer}@${range}`.padEnd(100) + ` ${version} ${status}`);

      if (!satisfied) {
        failures.push(
          `${owner} peers on ${peer}@${range} but ${version} is installed — ` +
            'npm overrode this conflict instead of failing',
        );
      } else if (location !== hoistedLocation) {
        failures.push(
          `${owner} resolves its peer ${peer}@${version} from a nested copy at ${location}; ` +
            `expected the hoisted ${hoistedLocation} — the tree is mixed`,
        );
      }
    }
  }
}

function parseArguments(args) {
  const [first, ...rest] = args;
  const firstIsPin = first !== undefined && first.includes('@', 1);
  const pinArgs = first === undefined || firstIsPin ? args : rest;
  const frameworkSpec = first === undefined || firstIsPin ? undefined : first;

  if (frameworkSpec !== undefined && semver.validRange(frameworkSpec) === null) {
    usage(`"${frameworkSpec}" is not a version or a semver range`);
  }

  const pins = pinArgs.map(arg => {
    const at = arg.lastIndexOf('@');
    const name = arg.slice(0, at);
    const spec = arg.slice(at + 1);

    if (at <= 0 || spec === '' || semver.validRange(spec) === null) {
      usage(`"${arg}" is not <name>@<version-or-range>`);
    }

    return [name, spec];
  });

  return { frameworkSpec, pins };
}

function usage(problem) {
  console.error(problem);
  console.error(
    'Usage: node scripts/check-nestjs-resolution.mjs [<framework-spec>] [<name>@<spec> ...]',
  );
  console.error(
    'Without a framework spec, each package is checked against the range the repo declares for it.',
  );
  process.exit(1);
}

function matches(version, spec) {
  return semver.valid(spec) !== null ? semver.eq(version, spec) : semver.satisfies(version, spec);
}

function describe(spec) {
  return semver.valid(spec) !== null ? `exactly ${spec}` : `${spec}`;
}

function rangeDeclaredByRepo(name) {
  const range = declaredRange(name) ?? declaredRange('@nestjs/core');

  if (range === undefined || semver.validRange(range) === null) {
    usage(`Cannot derive a spec for ${name}: no workspace declares it (or @nestjs/core) with a valid range`);
  }

  return range;
}

function declaredRange(name) {
  for (const workspaceDir of ['.', ...collectWorkspaceDirs()]) {
    const manifest = readJson(path.join(repoRoot, workspaceDir, 'package.json'));
    const range = manifest.devDependencies?.[name] ?? manifest.dependencies?.[name];

    if (range !== undefined) {
      return range;
    }
  }

  return undefined;
}

function declaredNestPackages(manifestPath) {
  const manifest = readJson(manifestPath);

  return new Set(
    Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).filter(name =>
      name.startsWith('@nestjs/'),
    ),
  );
}

function isResolvable(manifestPath, name) {
  return resolveInstalled(createRequire(manifestPath), name) !== undefined;
}

function resolveInstalled(require, name) {
  // `require('<pkg>/package.json')` is not an option: the NestJS 12 exports
  // map routes `./*` to `./*.js`, so walk up from the resolved entry point to
  // the manifest that declares the package instead.
  let entryPoint;

  try {
    entryPoint = require.resolve(name);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return undefined;
    }
    throw error;
  }

  let packageDir = path.dirname(entryPoint);

  for (;;) {
    const manifestPath = path.join(packageDir, 'package.json');

    if (fs.existsSync(manifestPath)) {
      const manifest = readJson(manifestPath);

      if (manifest.name === name) {
        return { version: manifest.version, location: path.relative(repoRoot, packageDir) };
      }
    }

    const parentDir = path.dirname(packageDir);

    if (parentDir === packageDir) {
      throw new Error(`No package.json for ${name} above ${entryPoint}`);
    }

    packageDir = parentDir;
  }
}

function hoistedPackageDirs() {
  const nodeModules = path.join(repoRoot, 'node_modules');
  const dirs = [];

  for (const entry of listDirs(nodeModules)) {
    if (entry.startsWith('.')) {
      continue;
    }

    const entryDir = path.join(nodeModules, entry);

    if (entry.startsWith('@')) {
      for (const scoped of listDirs(entryDir)) {
        dirs.push(path.join(entryDir, scoped));
      }
    } else {
      dirs.push(entryDir);
    }
  }

  return dirs.filter(dir => fs.existsSync(path.join(dir, 'package.json'))).sort();
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  // statSync follows symlinks: workspaces are linked into node_modules and
  // their own published peer ranges are part of what this pass checks.
  return fs.readdirSync(dir).filter(entry => {
    try {
      return fs.statSync(path.join(dir, entry)).isDirectory();
    } catch {
      return false;
    }
  });
}

function collectWorkspaceDirs() {
  return (rootManifest.workspaces ?? [])
    .flatMap(pattern => {
      if (!pattern.endsWith('/*')) {
        return [pattern];
      }

      const baseDir = pattern.slice(0, -2);

      return listDirs(path.join(repoRoot, baseDir)).map(entry => path.join(baseDir, entry));
    })
    .filter(workspaceDir => fs.existsSync(path.join(repoRoot, workspaceDir, 'package.json')))
    .sort();
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}
