import {
  INestApplication,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createTRPCProxyClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from '@trpc/client';
import { expect } from 'chai';
import { EventSource } from 'eventsource';
import { IsString, MinLength } from 'class-validator';
import superjson from 'superjson';
import { z, ZodError } from 'zod';
import { TrpcContext } from '../../decorators/ctx.decorator';
import { Input } from '../../decorators/input.decorator';
import {
  Mutation,
  Query,
  Subscription,
} from '../../decorators/procedure.decorator';
import { Router } from '../../decorators/router.decorator';
import { TrpcModule } from '../../trpc.module';

const TRPC_PATH = '/trpc';
const REQUEST_ID_HEADER = 'x-trpc-test-request-id';

const CreateItemSchema = z.object({
  name: z.string().min(1),
});

class CreateDtoItem {
  @IsString()
  @MinLength(3)
  name!: string;
}

@Router('client')
class ClientE2ERouter {
  @Query({
    output: z.array(z.object({ id: z.string(), name: z.string() })),
  })
  list(@TrpcContext('requestId') requestId: string) {
    return [{ id: requestId, name: 'Item 1' }];
  }

  @Mutation({
    input: CreateItemSchema,
    output: z.object({
      id: z.string(),
      name: z.string(),
      upperName: z.string(),
    }),
  })
  create(
    @Input() input: z.infer<typeof CreateItemSchema>,
    @Input('name') name: string,
    @TrpcContext('requestId') requestId: string,
  ) {
    return {
      id: requestId,
      name: input.name,
      upperName: name.toUpperCase(),
    };
  }

  @Mutation({ input: z.any() })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createDto(@Input() input: CreateDtoItem) {
    return {
      isDtoInstance: input instanceof CreateDtoItem,
      name: input.name,
    };
  }

  @Subscription({
    input: z.object({ count: z.number().int().min(1).max(3) }),
    output: z.object({ tick: z.number() }),
  })
  async *ticks(@Input('count') count: number) {
    for (let tick = 1; tick <= count; tick += 1) {
      yield { tick };
    }
  }
}

type AdapterKind = 'express' | 'fastify';

async function createTestingApp(kind: AdapterKind): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      TrpcModule.forRoot({
        path: TRPC_PATH,
        createContext: ({ req }) => ({
          requestId: req.headers?.[REQUEST_ID_HEADER] ?? 'missing',
        }),
      }),
    ],
    providers: [ClientE2ERouter],
  }).compile();

  const app =
    kind === 'fastify'
      ? moduleRef.createNestApplication<NestFastifyApplication>(
          new FastifyAdapter(),
        )
      : moduleRef.createNestApplication();

  await app.init();
  await app.listen(0, '127.0.0.1');
  return app;
}

function createClient(baseUrl: string, requestId: string) {
  return createTRPCProxyClient<any>({
    links: [
      splitLink({
        condition: operation => operation.type === 'subscription',
        true: httpSubscriptionLink({
          url: `${baseUrl}${TRPC_PATH}`,
          EventSource,
        }),
        false: httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          headers: {
            [REQUEST_ID_HEADER]: requestId,
          },
        }),
      }),
    ],
  });
}

async function expectClientError(
  run: () => Promise<unknown>,
  expectedMessage: RegExp,
) {
  let error: Error | undefined;
  try {
    await run();
  } catch (err) {
    error = err as Error;
  }

  expect(error).to.be.instanceOf(Error);
  expect(String(error?.message)).to.match(expectedMessage);
}

const FIXED_DATE = new Date('2026-01-02T03:04:05.000Z');

@Router('calendar')
class TransformerE2ERouter {
  @Query()
  when() {
    return { at: FIXED_DATE };
  }

  @Mutation({ input: z.object({ dueAt: z.date() }) })
  echoDate(@Input('dueAt') dueAt: Date) {
    return { received: dueAt, isDate: dueAt instanceof Date };
  }

  @Subscription()
  async *pulse() {
    yield { at: FIXED_DATE };
  }
}

async function createTransformerApp(
  kind: AdapterKind,
): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      TrpcModule.forRoot({
        path: TRPC_PATH,
        transformer: superjson,
        errorFormatter: ({ shape, error }) => ({
          ...shape,
          data: {
            ...shape.data,
            zodError:
              error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                ? z.flattenError(error.cause)
                : null,
          },
        }),
      }),
    ],
    providers: [TransformerE2ERouter],
  }).compile();

  const app =
    kind === 'fastify'
      ? moduleRef.createNestApplication<NestFastifyApplication>(
          new FastifyAdapter(),
        )
      : moduleRef.createNestApplication();

  await app.init();
  await app.listen(0, '127.0.0.1');
  return app;
}

function createTransformerClient(baseUrl: string) {
  return createTRPCProxyClient<any>({
    links: [
      splitLink({
        condition: operation => operation.type === 'subscription',
        true: httpSubscriptionLink({
          url: `${baseUrl}${TRPC_PATH}`,
          transformer: superjson,
          EventSource,
        }),
        false: httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          transformer: superjson,
        }),
      }),
    ],
  });
}

describe('real @trpc/client adapter E2E', () => {
  for (const adapterKind of ['express', 'fastify'] as const) {
    describe(adapterKind, () => {
      let app: INestApplication;
      let client: any;
      let requestId: string;

      before(async () => {
        app = await createTestingApp(adapterKind);
        requestId = `client-e2e-${adapterKind}`;
        client = createClient(await app.getUrl(), requestId);
      });

      after(async () => {
        await app?.close();
      });

      it('handles typed queries, mutations, and context extraction', async () => {
        const items = await client.client.list.query();
        expect(items).to.deep.equal([{ id: requestId, name: 'Item 1' }]);

        const created = await client.client.create.mutate({ name: 'Ada' });
        expect(created).to.deep.equal({
          id: requestId,
          name: 'Ada',
          upperName: 'ADA',
        });
      });

      it('reports Zod input errors through the real client', async () => {
        await expectClientError(
          () => client.client.create.mutate({ name: '' }),
          /(too small|minimum|name|string)/i,
        );
      });

      it('runs class-validator DTO validation through ValidationPipe', async () => {
        const valid = await client.client.createDto.mutate({ name: 'Ada' });
        expect(valid).to.deep.equal({ isDtoInstance: true, name: 'Ada' });

        await expectClientError(
          () => client.client.createDto.mutate({ name: 'Al' }),
          /(least|minimal|3|name)/i,
        );
      });

      it('streams subscriptions through the real client', async function () {
        this.timeout(5000);

        const ticks: number[] = [];
        await new Promise<void>((resolve, reject) => {
          client.client.ticks.subscribe(
            { count: 3 },
            {
              onData(event: { tick: number }) {
                ticks.push(event.tick);
              },
              onError(error: unknown) {
                reject(error);
              },
              onComplete() {
                resolve();
              },
            },
          );
        });

        expect(ticks).to.deep.equal([1, 2, 3]);
      });
    });
  }
});

describe('real @trpc/client with superjson transformer E2E', () => {
  for (const adapterKind of ['express', 'fastify'] as const) {
    describe(adapterKind, () => {
      let app: INestApplication;
      let client: any;

      before(async () => {
        app = await createTransformerApp(adapterKind);
        client = createTransformerClient(await app.getUrl());
      });

      after(async () => {
        await app?.close();
      });

      it('round-trips Date instances through queries', async () => {
        const result = await client.calendar.when.query();
        expect(result.at).to.be.instanceOf(Date);
        expect(result.at.toISOString()).to.equal(FIXED_DATE.toISOString());
      });

      it('round-trips Date instances through mutation inputs and outputs', async () => {
        const result = await client.calendar.echoDate.mutate({
          dueAt: FIXED_DATE,
        });
        expect(result.isDate).to.equal(true);
        expect(result.received).to.be.instanceOf(Date);
        expect(result.received.toISOString()).to.equal(
          FIXED_DATE.toISOString(),
        );
      });

      it('round-trips Date instances through SSE subscriptions', async function () {
        this.timeout(5000);

        const events: Array<{ at: Date }> = [];
        await new Promise<void>((resolve, reject) => {
          client.calendar.pulse.subscribe(undefined, {
            onData(event: { at: Date }) {
              events.push(event);
            },
            onError(error: unknown) {
              reject(error);
            },
            onComplete() {
              resolve();
            },
          });
        });

        expect(events).to.have.length(1);
        expect(events[0].at).to.be.instanceOf(Date);
        expect(events[0].at.toISOString()).to.equal(FIXED_DATE.toISOString());
      });

      it('exposes the flattened ZodError shape to the real client', async () => {
        let error: any;
        try {
          await client.calendar.echoDate.mutate({ dueAt: 'not-a-date' });
        } catch (err) {
          error = err;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error?.data?.zodError?.fieldErrors?.dueAt).to.be.an('array');
      });
    });
  }
});
