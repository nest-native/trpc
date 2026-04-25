import tsParser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/*.d.ts',
      '**/*.js',
      'packages/trpc/test/**',
    ],
  },
  {
    files: ['packages/trpc/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      sonarjs,
    },
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 0],
    },
  },
];
