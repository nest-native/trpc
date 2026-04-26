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
    expect(content).to.include('nest-trpc-native');
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
      '// nest-trpc-native',
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
  });
});

describe('generateSchemaContent (type-level AppRouter contract)', () => {
  it('should typecheck generated AppRouter with a typed tRPC client', function () {
    this.timeout(15000);
    const tempDir = mkdtempSync(join(process.cwd(), '.tmp-trpc-client-types-'));
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
});
