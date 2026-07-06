import { expect } from 'chai';
import { z } from 'zod';
import { join } from 'path';
import {
  readFileSync,
  existsSync,
  unlinkSync,
  rmdirSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
} from 'fs';
import { execFileSync } from 'child_process';
import { ProcedureType } from '../../enums';
import {
  generateSchemaContent,
  generateSchema,
  RouterInfo,
} from '../../generators/schema-generator';

describe('generateSchemaContent', () => {
  it('should generate a valid AppRouter with aliased sub-routers', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'greeting',
        procedures: [
          {
            name: 'hello',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ name: z.string() }),
          },
          {
            name: 'create',
            type: ProcedureType.MUTATION,
            inputSchema: z.object({ name: z.string() }),
          },
        ],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include("import { initTRPC } from '@trpc/server'");
    expect(content).to.include("import { z } from 'zod'");
    expect(content).to.include('const t = initTRPC.create()');
    expect(content).to.include('greeting: t.router({');
    expect(content).to.include(
      'const schema_greeting_hello_input_0 = z.object({ name: z.string() });',
    );
    expect(content).to.include(
      'hello: t.procedure.input(schema_greeting_hello_input_0).query(() => undefined as unknown)',
    );
    expect(content).to.include(
      'create: t.procedure.input(schema_greeting_create_input_1).mutation(() => undefined as unknown)',
    );
    expect(content).to.include('export type AppRouter = typeof appRouter');
  });

  it('should generate root-level procedures without alias', () => {
    const routers: RouterInfo[] = [
      {
        procedures: [{ name: 'ping', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include(
      'ping: t.procedure.query(() => undefined as unknown)',
    );
    expect(content).to.not.include("import { z } from 'zod'");
  });

  it('should generate procedures with output schemas', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'users',
        procedures: [
          {
            name: 'getById',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ id: z.string() }),
            outputSchema: z.object({ id: z.string(), name: z.string() }),
          },
        ],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include(
      '.input(schema_users_getById_input_0).output(schema_users_getById_output_1).query(() => null as unknown as z.infer<typeof schema_users_getById_output_1>)',
    );
  });

  it('should generate subscription procedures', () => {
    const routers: RouterInfo[] = [
      {
        procedures: [{ name: 'onEvent', type: ProcedureType.SUBSCRIPTION }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include(
      'onEvent: t.procedure.subscription(async function* () { yield undefined as unknown; })',
    );
  });

  it('should generate typed subscriptions without output parser chaining', () => {
    const routers: RouterInfo[] = [
      {
        procedures: [
          {
            name: 'onTypedEvent',
            type: ProcedureType.SUBSCRIPTION,
            outputSchema: z.object({ tick: z.number() }),
          },
        ],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include(
      'onTypedEvent: t.procedure.subscription(async function* () { yield null as unknown as z.infer<typeof schema_root_onTypedEvent_output_0>; })',
    );
    expect(content).to.not.include(
      'onTypedEvent: t.procedure.output(schema_root_onTypedEvent_output_0).subscription',
    );
  });

  it('should merge procedures from multiple routers with the same alias', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'items',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
      {
        alias: 'items',
        procedures: [{ name: 'create', type: ProcedureType.MUTATION }],
      },
    ];

    const content = generateSchemaContent(routers);

    // Both procedures should be under the same "items" sub-router
    expect(content).to.include('items: t.router({');
    expect(content).to.include('list: t.procedure.query');
    expect(content).to.include('create: t.procedure.mutation');
  });

  it('should generate nested router objects for dotted aliases', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'admin.users',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include('admin: {');
    expect(content).to.include('users: t.router({');
    expect(content).to.include(
      'list: t.procedure.query(() => undefined as unknown)',
    );
  });

  it('should generate sibling dotted aliases under the same parent object', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'admin.users',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
      {
        alias: 'admin.roles',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include('admin: {');
    expect(content).to.include('users: t.router({');
    expect(content).to.include('roles: t.router({');
    const listProcedureOccurrences =
      content.match(/list: t\.procedure\.query\(\(\) => undefined as unknown\)/g) ?? [];
    expect(listProcedureOccurrences).to.have.length(2);
  });

  it('should import zod when only some routers/procedures declare schemas', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'mixed',
        procedures: [
          {
            name: 'withSchema',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ id: z.string() }),
          },
          { name: 'withoutSchema', type: ProcedureType.QUERY },
        ],
      },
      {
        alias: 'plain',
        procedures: [{ name: 'noSchema', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include("import { z } from 'zod';");
  });

  it('should replace a conflicting router alias when a dotted alias claims it as a namespace', () => {
    // TrpcRouter rejects this configuration at registration time; when
    // generateSchemaContent is fed it directly, the namespace wins and the
    // generator must not crash.
    const routers: RouterInfo[] = [
      {
        alias: 'pay',
        procedures: [{ name: 'charge', type: ProcedureType.QUERY }],
      },
      {
        alias: 'pay.methods',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.include('pay: {');
    expect(content).to.include('methods: t.router({');
    expect(content).to.not.include('pay: t.router({');
  });

  it('should keep nested and multi-procedure formatting stable without schemas', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'billing',
        procedures: [
          { name: 'invoice', type: ProcedureType.QUERY },
          { name: 'refund', type: ProcedureType.MUTATION },
        ],
      },
      {
        alias: 'admin.users',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
      {
        alias: 'admin.roles',
        procedures: [{ name: 'list', type: ProcedureType.QUERY }],
      },
    ];

    expect(generateSchemaContent(routers)).to.equal(
      [
        '// ------------------------------------------------------',
        '// THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)',
        '// @nest-native/trpc',
        '// ------------------------------------------------------',
        '',
        "import { initTRPC } from '@trpc/server';",
        '',
        'const t = initTRPC.create();',
        '',
        'const appRouter = t.router({',
        '  billing: t.router({',
        '    invoice: t.procedure.query(() => undefined as unknown),',
        '    refund: t.procedure.mutation(() => undefined as unknown),',
        '  }),',
        '  admin: {',
        '    users: t.router({',
        '    list: t.procedure.query(() => undefined as unknown),',
        '  }),',
        '    roles: t.router({',
        '    list: t.procedure.query(() => undefined as unknown),',
        '  })',
        '  }',
        '});',
        '',
        'export type AppRouter = typeof appRouter;',
        '',
      ].join('\n'),
    );
  });

  it('should ignore dotted aliases that normalize to empty segments', () => {
    const routers: RouterInfo[] = [
      {
        alias: ' . ',
        procedures: [{ name: 'lost', type: ProcedureType.QUERY }],
      },
    ];

    const content = generateSchemaContent(routers);

    expect(content).to.not.include(
      'lost: t.procedure.query(() => undefined as unknown)',
    );
    expect(content).to.include('export type AppRouter = typeof appRouter');
  });

  it('should include the auto-generated header', () => {
    const content = generateSchemaContent([]);
    expect(content).to.include('THIS FILE WAS AUTOMATICALLY GENERATED');
    expect(content).to.include('@nest-native/trpc');
  });

  it('should handle empty routers array', () => {
    const content = generateSchemaContent([]);
    expect(content).to.include('const appRouter = t.router({');
    expect(content).to.include('export type AppRouter = typeof appRouter');
  });

  it('should sanitize empty and numeric-leading schema identifiers', () => {
    const routers: RouterInfo[] = [
      {
        alias: '',
        procedures: [
          {
            name: '123start',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ value: z.string() }),
          },
        ],
      },
    ];

    const content = generateSchemaContent(routers);
    expect(content).to.include(
      'const schema_unknown__123start_input_0 = z.object({ value: z.string() });',
    );
    expect(content).to.include(
      '123start: t.procedure.input(schema_unknown__123start_input_0).query(() => undefined as unknown)',
    );
  });

  it('should sanitize non-identifier characters to underscores and keep inner digits unprefixed', () => {
    const routers: RouterInfo[] = [
      {
        alias: 'user-profile',
        procedures: [
          {
            name: 'get',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ id: z.string() }),
          },
        ],
      },
      {
        alias: 'v2',
        procedures: [
          {
            name: 'list',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ limit: z.number() }),
          },
        ],
      },
    ];

    const content = generateSchemaContent(routers);

    // '-' becomes '_' (not stripped)
    expect(content).to.include('const schema_user_profile_get_input_0 =');
    // digits that are not leading get no '_' prefix
    expect(content).to.include('const schema_v2_list_input_1 =');
  });

  it('should emit a bare initTRPC.create() when hasTransformer is false', () => {
    const content = generateSchemaContent(
      [{ procedures: [{ name: 'ping', type: ProcedureType.QUERY }] }],
      { hasTransformer: false },
    );

    expect(content).to.include('const t = initTRPC.create();');
    expect(content).to.not.include('const transformer = {');
  });

  it('should emit a transformer marker when hasTransformer is true', () => {
    const content = generateSchemaContent(
      [{ procedures: [{ name: 'ping', type: ProcedureType.QUERY }] }],
      { hasTransformer: true },
    );

    expect(content).to.include('const transformer = {');
    expect(content).to.include('  serialize: (value: unknown) => value,');
    expect(content).to.include('  deserialize: (value: unknown) => value,');
    expect(content).to.include('const t = initTRPC.create({ transformer });');
    expect(content).to.not.include('const t = initTRPC.create();');
    // The explanatory comments are part of the generated-file contract:
    // they tell users why the marker exists and what their client needs.
    expect(content).to.include(
      '// Type-level marker mirroring the transformer configured on the server.',
    );
    expect(content).to.include(
      '// Clients must configure the matching transformer on their link,',
    );
    expect(content).to.include(
      '// e.g. httpBatchLink({ url, transformer: superjson }).',
    );
  });

  it('should keep generated schema formatting stable', () => {
    const content = generateSchemaContent([
      {
        alias: 'users',
        procedures: [
          {
            name: 'list',
            type: ProcedureType.QUERY,
            inputSchema: z.object({ limit: z.number() }),
            outputSchema: z.array(z.object({ id: z.string() })),
          },
        ],
      },
      {
        procedures: [
          { name: 'ping', type: ProcedureType.QUERY },
          {
            name: 'ticks',
            type: ProcedureType.SUBSCRIPTION,
            outputSchema: z.object({ tick: z.number() }),
          },
        ],
      },
    ]);

    expect(content).to.equal([
      '// ------------------------------------------------------',
      '// THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)',
      '// @nest-native/trpc',
      '// ------------------------------------------------------',
      '',
      "import { initTRPC } from '@trpc/server';",
      "import { z } from 'zod';",
      '',
      'const t = initTRPC.create();',
      '',
      'const schema_users_list_input_0 = z.object({ limit: z.number() });',
      'const schema_users_list_output_1 = z.array(z.object({ id: z.string() }));',
      'const schema_root_ticks_output_2 = z.object({ tick: z.number() });',
      '',
      'const appRouter = t.router({',
      '  users: t.router({',
      '    list: t.procedure.input(schema_users_list_input_0).output(schema_users_list_output_1).query(() => null as unknown as z.infer<typeof schema_users_list_output_1>),',
      '  }),',
      '  ping: t.procedure.query(() => undefined as unknown),',
      '  ticks: t.procedure.subscription(async function* () { yield null as unknown as z.infer<typeof schema_root_ticks_output_2>; })',
      '});',
      '',
      'export type AppRouter = typeof appRouter;',
      '',
    ].join('\n'));
  });
});

describe('generateSchema (file output)', () => {
  const tmpDir = join(__dirname, '__tmp__');
  const tmpFile = join(tmpDir, 'test-generated.ts');

  afterEach(() => {
    if (existsSync(tmpFile)) {
      unlinkSync(tmpFile);
    }
    if (existsSync(tmpDir)) {
      rmdirSync(tmpDir);
    }
  });

  it('should write the generated file to disk', () => {
    const routers: RouterInfo[] = [
      {
        procedures: [{ name: 'health', type: ProcedureType.QUERY }],
      },
    ];

    generateSchema(routers, tmpFile);

    expect(existsSync(tmpFile)).to.be.true;
    const content = readFileSync(tmpFile, 'utf-8');
    expect(content).to.include('export type AppRouter = typeof appRouter');
    expect(content).to.include('health: t.procedure.query');
    expect(content).to.include('const t = initTRPC.create();');
  });

  it('should write the transformer marker when hasTransformer is set', () => {
    const routers: RouterInfo[] = [
      {
        procedures: [{ name: 'health', type: ProcedureType.QUERY }],
      },
    ];

    generateSchema(routers, tmpFile, { hasTransformer: true });

    expect(existsSync(tmpFile)).to.be.true;
    const content = readFileSync(tmpFile, 'utf-8');
    expect(content).to.include('const t = initTRPC.create({ transformer });');
  });
});

describe('generateSchemaContent (type-level AppRouter contract)', () => {
  it('should typecheck generated AppRouter with a typed tRPC client', function () {
    this.timeout(15000);
    const tempDir = mkdtempSync(
      join(process.cwd(), 'packages/trpc/.tmp-trpc-client-types-'),
    );
    const generatedFile = join(tempDir, 'generated.ts');
    const typecheckFile = join(tempDir, 'client.typecheck.ts');

    try {
      generateSchema(
        [
          {
            alias: 'users',
            procedures: [
              {
                name: 'create',
                type: ProcedureType.MUTATION,
                inputSchema: z.object({
                  name: z.string(),
                  email: z.string().email(),
                }),
                outputSchema: z.object({
                  id: z.number(),
                  name: z.string(),
                  email: z.string().email(),
                }),
              },
            ],
          },
          {
            procedures: [
              {
                name: 'ping',
                type: ProcedureType.QUERY,
                outputSchema: z.literal('pong'),
              },
              {
                name: 'ticks',
                type: ProcedureType.SUBSCRIPTION,
                outputSchema: z.object({ tick: z.number() }),
              },
            ],
          },
        ],
        generatedFile,
      );

      writeFileSync(
        typecheckFile,
        [
          "import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';",
          "import type { AppRouter } from './generated';",
          '',
          'type RouterInputs = inferRouterInputs<AppRouter>;',
          'type RouterOutputs = inferRouterOutputs<AppRouter>;',
          '',
          "const _pongLiteral: RouterOutputs['ping'] = 'pong';",
          "const _pongExact: 'pong' = _pongLiteral;",
          '',
          "const _createInput: RouterInputs['users']['create'] = {",
          "    name: 'Neo',",
          "    email: 'neo@example.com',",
          '};',
          '',
          "const _createOutput: RouterOutputs['users']['create'] = {",
          '  id: 1,',
          "  name: 'Neo',",
          "  email: 'neo@example.com',",
          '};',
          'const _createdId: number = _createOutput.id;',
          '',
        ].join('\n'),
      );

      const tscEntry = require.resolve('typescript/bin/tsc');
      try {
        execFileSync(
          process.execPath,
          [
            tscEntry,
            '--noEmit',
            '--strict',
            '--target',
            'ES2021',
            '--module',
            'commonjs',
            '--moduleResolution',
            'node',
            '--ignoreDeprecations',
            '6.0',
            '--skipLibCheck',
            typecheckFile,
          ],
          {
            cwd: process.cwd(),
            stdio: 'pipe',
          },
        );
      } catch (error) {
        const execError = error as Error & {
          stdout?: Buffer;
          stderr?: Buffer;
        };
        const stdout = execError.stdout?.toString('utf-8') ?? '';
        const stderr = execError.stderr?.toString('utf-8') ?? '';
        throw new Error(
          `Typecheck failed.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
        );
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should require a link transformer on typed clients when generated with hasTransformer', function () {
    this.timeout(30000);
    const tempDir = mkdtempSync(
      join(process.cwd(), 'packages/trpc/.tmp-trpc-transformer-types-'),
    );
    const generatedFile = join(tempDir, 'generated.ts');
    const clientWithTransformerFile = join(tempDir, 'client-with.ts');
    const clientMissingTransformerFile = join(tempDir, 'client-missing.ts');

    const runTsc = (entryFile: string): { ok: boolean; output: string } => {
      const tscEntry = require.resolve('typescript/bin/tsc');
      try {
        execFileSync(
          process.execPath,
          [
            tscEntry,
            '--noEmit',
            '--strict',
            '--target',
            'ES2021',
            '--module',
            'commonjs',
            '--moduleResolution',
            'node',
            '--ignoreDeprecations',
            '6.0',
            '--skipLibCheck',
            entryFile,
          ],
          { cwd: process.cwd(), stdio: 'pipe' },
        );
        return { ok: true, output: '' };
      } catch (error) {
        const execError = error as Error & { stdout?: Buffer; stderr?: Buffer };
        return {
          ok: false,
          output:
            (execError.stdout?.toString('utf-8') ?? '') +
            (execError.stderr?.toString('utf-8') ?? ''),
        };
      }
    };

    try {
      generateSchema(
        [
          {
            procedures: [
              {
                name: 'when',
                type: ProcedureType.QUERY,
              },
            ],
          },
        ],
        generatedFile,
        { hasTransformer: true },
      );

      writeFileSync(
        clientWithTransformerFile,
        [
          "import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';",
          "import type { AppRouter } from './generated';",
          '',
          'const transformer = {',
          '  serialize: (value: unknown) => value,',
          '  deserialize: (value: unknown) => value,',
          '};',
          '',
          'export const client = createTRPCProxyClient<AppRouter>({',
          "  links: [httpBatchLink({ url: 'http://localhost:3000/trpc', transformer })],",
          '});',
          '',
        ].join('\n'),
      );

      writeFileSync(
        clientMissingTransformerFile,
        [
          "import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';",
          "import type { AppRouter } from './generated';",
          '',
          'export const client = createTRPCProxyClient<AppRouter>({',
          "  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],",
          '});',
          '',
        ].join('\n'),
      );

      const withTransformer = runTsc(clientWithTransformerFile);
      expect(
        withTransformer.ok,
        `Expected typecheck to pass:\n${withTransformer.output}`,
      ).to.equal(true);

      const missingTransformer = runTsc(clientMissingTransformerFile);
      expect(
        missingTransformer.ok,
        'Expected typecheck to fail when the link transformer is missing',
      ).to.equal(false);
      expect(missingTransformer.output).to.include('transformer');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
