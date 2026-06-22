/**
 * Audits the *published* supply-chain surface of `@nest-native/trpc`.
 *
 * The package publishes `"dependencies": {}`, so the only third-party code a
 * consumer actually installs is whatever npm pulls in for that empty
 * production closure (plus any peer deps it chooses to add). Auditing the
 * monorepo root instead would flag advisories that live exclusively in the
 * dev/peer/sample tree (e.g. transitive packages reachable only through the
 * Angular showcase or the `@trpc/client` test harness) — none of which can
 * reach a consumer. `npm audit --omit=dev` cannot prune those at the root
 * because npm audits the whole shared-lockfile ideal tree regardless of
 * `--omit`.
 *
 * To audit exactly what consumers install, this script packs the published
 * tarball, installs it into a throwaway project with `--omit=dev`, and runs
 * `npm audit --omit=dev --audit-level=high` against that real production closure.
 * It fails on any high/critical advisory.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const AUDIT_LEVEL = 'high';
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const repoRoot = process.cwd();

const npmCache = fs.mkdtempSync(path.join(os.tmpdir(), 'nest-trpc-native-audit-cache-'));
const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nest-trpc-native-audit-consumer-'));
const npmEnv = { ...process.env, npm_config_cache: npmCache };

function npm(args, options = {}) {
  return execFileSync(npmExecutable, args, {
    encoding: 'utf8',
    env: npmEnv,
    ...options,
  });
}

try {
  // Build then pack the published package so we audit the real tarball contents.
  npm(['run', 'build', '--workspace', '@nest-native/trpc'], { cwd: repoRoot, stdio: 'inherit' });

  const packOutput = npm(['pack', '--json', '--workspace', '@nest-native/trpc'], {
    cwd: repoRoot,
  });
  const [packResult] = JSON.parse(packOutput);
  if (!packResult || typeof packResult.filename !== 'string') {
    throw new Error('npm pack --json did not return the expected JSON payload.');
  }
  // `npm pack --workspace` writes the tarball into the current working
  // directory (the repo root), not the workspace directory.
  const tarballPath = path.join(repoRoot, packResult.filename);
  if (!fs.existsSync(tarballPath)) {
    throw new Error(`Expected packed tarball not found at ${tarballPath}.`);
  }

  // Install only the published tarball as a consumer would in production.
  fs.writeFileSync(
    path.join(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'nest-trpc-native-audit-consumer', version: '0.0.0', private: true }, null, 2)}\n`,
  );
  npm(['install', tarballPath, '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  // Audit the production closure. npm audit exits non-zero when advisories at or
  // above --audit-level are present, which propagates out of execFileSync.
  npm(['audit', '--omit=dev', `--audit-level=${AUDIT_LEVEL}`], {
    cwd: consumerDir,
    stdio: 'inherit',
  });

  fs.rmSync(tarballPath, { force: true });
  console.log(
    `\nProduction supply-chain audit OK: ${packResult.filename} has no ${AUDIT_LEVEL}+ advisories in its installed production closure.`,
  );
} finally {
  fs.rmSync(npmCache, { recursive: true, force: true });
  fs.rmSync(consumerDir, { recursive: true, force: true });
}
