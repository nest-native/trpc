// Mutation testing — LOCAL ONLY, on demand. Deliberately not wired into CI.
// See GUIDELINES_NEST_TRPC.md, "Mutation testing".
//
//   npm run test:mutation                       incremental (the pre-PR ritual)
//   npm run test:mutation:full                  every mutant from scratch
//   STRYKER_MUTATE='packages/trpc/generators/**'  scope to the files you changed

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: process.env.STRYKER_MUTATE
    ? process.env.STRYKER_MUTATE.split(',')
    : [
        'packages/trpc/**/*.ts',
        '!packages/trpc/**/*.spec.ts',
        '!packages/trpc/test/**',
      ],
  testRunner: 'command',
  // `test:mutant` = the normal mocha suite plus `--exit`: a mutant that
  // breaks teardown would otherwise leave open handles and turn every kill
  // into a slow timeout.
  commandRunner: { command: 'npm run test:mutant' },
  // Each command-runner mutant spawns a full ts-node/esm + mocha process;
  // default Stryker worker counts oversubscribe the CPU and turn every kill
  // into a timeout.
  concurrency: 4,
  timeoutMS: 15000,
  incremental: true,
  ignorePatterns: [
    'sample',
    'website',
    'docs',
    'coverage',
    'complexity',
    '.tmp',
    '**/dist',
  ],
  reporters: ['clear-text', 'progress', 'html'],
  thresholds: { high: 90, low: 80, break: null },
  tempDirName: '.stryker-tmp',
};
