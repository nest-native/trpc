import {
  BadRequestException,
  CallHandler,
  CanActivate,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PipeTransform,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { expect } from 'chai';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import superjson from 'superjson';
import { map, Observable } from 'rxjs';
import { z, ZodError } from 'zod';
import { Input } from '../../decorators/input.decorator';
import { Router } from '../../decorators/router.decorator';
import {
  Mutation,
  Query,
  Subscription,
} from '../../decorators/procedure.decorator';
import { TrpcHttpAdapter } from '../../trpc-http-adapter';
import { TrpcModule } from '../../trpc.module';

@Injectable()
class DenyGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return false;
  }
}

@Injectable()
class TrimNamePipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (value && typeof value === 'object' && 'name' in value) {
      const input = value as { name?: unknown };
      if (typeof input.name === 'string') {
        return { ...input, name: input.name.trim() };
      }
    }

    return value;
  }
}

@Injectable()
class MarkResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map(value => ({
        ...(value as Record<string, unknown>),
        intercepted: true,
      })),
    );
  }
}

@Router('items')
class ItemsRouter {
  @Query()
  list() {
    return [{ id: '1', name: 'Item 1' }];
  }

  @Mutation({ input: z.object({ name: z.string() }) })
  create(input: { name: string }) {
    return { id: '2', name: input.name };
  }

  @Mutation({ input: z.object({ name: z.string() }) })
  @UsePipes(TrimNamePipe)
  @UseInterceptors(MarkResponseInterceptor)
  enhanced(@Input() input: { name: string }) {
    return { name: input.name };
  }

  @Mutation()
  @UseGuards(DenyGuard)
  blocked() {
    return { ok: true };
  }

  @Mutation()
  explode() {
    throw new BadRequestException('invalid payload');
  }

  @Query()
  contextInfo(_input: unknown, ctx: { userAgent?: string }) {
    return ctx.userAgent ?? 'missing';
  }

  @Subscription({ output: z.object({ tick: z.number() }) })
  async *ticks() {
    yield { tick: 1 };
  }
}

describe('TrpcHttpAdapter', () => {
  let app: any;
  let adapter: TrpcHttpAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [
        ItemsRouter,
        DenyGuard,
        TrimNamePipe,
        MarkResponseInterceptor,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    adapter = module.get(TrpcHttpAdapter);
    expect(adapter).to.be.instanceOf(TrpcHttpAdapter);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Express handler', () => {
    let port: number;

    beforeEach(async () => {
      await app.listen(0);
      port = app.getHttpServer().address().port;
    });

    it('should handle GET query requests', async () => {
      const response = await fetch(`http://localhost:${port}/trpc/items.list`, {
        method: 'GET',
      });
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal([{ id: '1', name: 'Item 1' }]);
    });

    it('should handle POST mutation requests', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/items.create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'New Item' }),
        },
      );
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal({ id: '2', name: 'New Item' });
    });

    it('should apply method pipes and interceptors through HTTP requests', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/items.enhanced`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: '  Enhanced Item  ' }),
        },
      );

      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal({
        name: 'Enhanced Item',
        intercepted: true,
      });
    });

    it('should map guard-denied execution to FORBIDDEN/403', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/items.blocked`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      expect(response.status).to.equal(403);
      const body = await response.json();
      expect(body.error.data.code).to.equal('FORBIDDEN');
    });

    it('should map HttpException to BAD_REQUEST/400', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/items.explode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      expect(response.status).to.equal(400);
      const body = await response.json();
      expect(body.error.data.code).to.equal('BAD_REQUEST');
      expect(String(body.error.message)).to.include('invalid payload');
    });

    it('should propagate response headers', async () => {
      const response = await fetch(`http://localhost:${port}/trpc/items.list`, {
        method: 'GET',
      });
      expect(response.headers.get('content-type')).to.include(
        'application/json',
      );
    });

    it('should stream subscription responses over GET', async function () {
      this.timeout(5000);

      const response = await fetch(
        `http://localhost:${port}/trpc/items.ticks?input=${encodeURIComponent(
          JSON.stringify({ count: 1 }),
        )}`,
        {
          method: 'GET',
          headers: { accept: 'text/event-stream' },
        },
      );

      expect(response.status).to.equal(200);
      expect(response.headers.get('content-type')).to.include(
        'text/event-stream',
      );
      expect(response.body).to.not.be.null;

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let ssePayload = '';
      for (let i = 0; i < 5; i++) {
        const chunk = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Timed out waiting for SSE chunk')),
              1500,
            );
          }),
        ]);

        if (chunk.done) {
          break;
        }
        if (chunk.value) {
          ssePayload += decoder.decode(chunk.value, { stream: true });
        }

        if (ssePayload.includes('"tick":1')) {
          break;
        }
        if (ssePayload.includes('serialized-error')) {
          break;
        }
      }

      expect(ssePayload).to.not.include('serialized-error');
      expect(ssePayload).to.include('"tick":1');
      await reader.cancel();
    });
  });

  describe('Fastify handler', () => {
    let fastifyApp: NestFastifyApplication;
    let fastifyPort: number;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [TrpcModule.forRoot({ path: '/trpc' })],
        providers: [
          ItemsRouter,
          DenyGuard,
          TrimNamePipe,
          MarkResponseInterceptor,
        ],
      }).compile();

      fastifyApp = module.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      await fastifyApp.init();
      await fastifyApp.listen(0, '127.0.0.1');
      const address = fastifyApp.getHttpServer().address();
      if (!address || typeof address === 'string') {
        throw new Error('Fastify server did not bind to a TCP port');
      }
      fastifyPort = address.port;
    });

    afterEach(async () => {
      await fastifyApp.close();
    });

    it('should handle GET query requests', async () => {
      const response = await fetch(
        `http://localhost:${fastifyPort}/trpc/items.list`,
        { method: 'GET' },
      );
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal([{ id: '1', name: 'Item 1' }]);
    });

    it('should map guard-denied execution to FORBIDDEN/403', async () => {
      const response = await fetch(
        `http://localhost:${fastifyPort}/trpc/items.blocked`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
      );
      expect(response.status).to.equal(403);
      const body = await response.json();
      expect(body.error.data.code).to.equal('FORBIDDEN');
    });
  });

  describe('with createContext', () => {
    let portWithCtx: number;
    let appWithCtx: any;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          TrpcModule.forRoot({
            path: '/trpc',
            createContext: ({ req }) => ({
              userAgent: req.headers?.['user-agent'] ?? 'unknown',
            }),
          }),
        ],
        providers: [ItemsRouter, DenyGuard],
      }).compile();

      appWithCtx = module.createNestApplication();
      await appWithCtx.init();
      await appWithCtx.listen(0);
      portWithCtx = appWithCtx.getHttpServer().address().port;
    });

    afterEach(async () => {
      await appWithCtx.close();
    });

    it('should invoke createContext and make context available', async () => {
      const response = await fetch(
        `http://localhost:${portWithCtx}/trpc/items.contextInfo`,
        {
          method: 'GET',
          headers: { 'user-agent': 'trpc-test-client' },
        },
      );
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.equal('trpc-test-client');
    });
  });

  describe('edge cases', () => {
    it('should use default path "/trpc" when path is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [TrpcModule.forRoot()],
        providers: [ItemsRouter, DenyGuard],
      }).compile();

      const defaultApp = module.createNestApplication();
      await defaultApp.init();
      await defaultApp.listen(0);

      const port = defaultApp.getHttpServer().address().port;
      const response = await fetch(`http://localhost:${port}/trpc/items.list`, {
        method: 'GET',
      });
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal([{ id: '1', name: 'Item 1' }]);

      await defaultApp.close();
    });

    it('should handle Fastify GET with createContext', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          TrpcModule.forRoot({
            path: '/trpc',
            createContext: ({ req }) => ({
              userAgent: req.headers?.['user-agent'] ?? 'unknown',
            }),
          }),
        ],
        providers: [ItemsRouter, DenyGuard],
      }).compile();

      const fastApp = module.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      await fastApp.init();
      await fastApp.listen(0, '127.0.0.1');
      const address = fastApp.getHttpServer().address();
      if (!address || typeof address === 'string') {
        throw new Error('Fastify server did not bind');
      }

      const response = await fetch(
        `http://localhost:${address.port}/trpc/items.list`,
        { method: 'GET' },
      );
      expect(response.status).to.equal(200);
      const body = await response.json();
      expect(body.result.data).to.deep.equal([{ id: '1', name: 'Item 1' }]);

      await fastApp.close();
    });
  });
});

@Router('cfg')
class ServerConfigRouter {
  @Query()
  now() {
    return { at: new Date('2026-01-02T03:04:05.000Z') };
  }

  @Mutation({ input: z.object({ title: z.string().min(3) }) })
  create(input: { title: string }) {
    return input;
  }

  @Mutation()
  explode() {
    throw new BadRequestException('invalid payload');
  }

  @Subscription({ output: z.object({ tick: z.number() }) })
  async *ticks() {
    yield { tick: 1 };
  }
}

describe('TrpcHttpAdapter (server config passthrough)', () => {
  let onErrorCalls: Array<{ path?: string; code: string }>;

  function createPassthroughModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        TrpcModule.forRoot({
          path: '/trpc',
          transformer: superjson,
          errorFormatter: ({ shape, error }) => ({
            ...shape,
            data: {
              ...shape.data,
              custom: `formatted:${error.code}`,
              zodError:
                error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
                  ? z.flattenError(error.cause)
                  : null,
            },
          }),
          responseMeta: ({ type, errors, eagerGeneration }) => ({
            status:
              type === 'query' && errors.length === 0 && !eagerGeneration
                ? 207
                : undefined,
            headers: {
              'x-response-meta': eagerGeneration ? 'eager' : 'standard',
              'cache-control': 'public, max-age=60',
            },
          }),
          onError: ({ path, error }) => {
            onErrorCalls.push({ path, code: error.code });
          },
        }),
      ],
      providers: [ServerConfigRouter],
    }).compile();
  }

  describe('Express', () => {
    let app: any;
    let port: number;

    beforeEach(async () => {
      onErrorCalls = [];
      const module = await createPassthroughModule();
      app = module.createNestApplication();
      await app.init();
      await app.listen(0);
      port = app.getHttpServer().address().port;
    });

    afterEach(async () => {
      await app.close();
    });

    it('should serialize responses with the configured transformer', async () => {
      const response = await fetch(`http://localhost:${port}/trpc/cfg.now`, {
        method: 'GET',
      });

      const body = await response.json();
      expect(body.result.data.json.at).to.equal('2026-01-02T03:04:05.000Z');
      expect(body.result.data.meta.values).to.deep.equal({ at: ['Date'] });
    });

    it('should apply responseMeta status and headers on the JSON path', async () => {
      const response = await fetch(`http://localhost:${port}/trpc/cfg.now`, {
        method: 'GET',
      });

      expect(response.status).to.equal(207);
      expect(response.headers.get('x-response-meta')).to.equal('standard');
      expect(response.headers.get('cache-control')).to.equal(
        'public, max-age=60',
      );
    });

    it('should apply responseMeta headers before streaming SSE responses', async function () {
      this.timeout(5000);

      const response = await fetch(`http://localhost:${port}/trpc/cfg.ticks`, {
        method: 'GET',
        headers: { accept: 'text/event-stream' },
      });

      expect(response.status).to.equal(200);
      expect(response.headers.get('content-type')).to.include(
        'text/event-stream',
      );
      expect(response.headers.get('x-response-meta')).to.equal('eager');
      // tRPC appends responseMeta headers to its own SSE cache-control
      // ("no-cache, no-transform"), so assert containment on this path.
      expect(response.headers.get('cache-control')).to.include(
        'public, max-age=60',
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let ssePayload = '';
      for (let i = 0; i < 5; i += 1) {
        const chunk = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Timed out waiting for SSE chunk')),
              1500,
            );
          }),
        ]);

        if (chunk.done) {
          break;
        }
        if (chunk.value) {
          ssePayload += decoder.decode(chunk.value, { stream: true });
        }
        if (ssePayload.includes('"tick":1')) {
          break;
        }
      }

      expect(ssePayload).to.include('"tick":1');
      await reader.cancel();
    });

    it('should invoke onError when a procedure fails', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/cfg.explode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );

      expect(response.status).to.equal(400);
      expect(onErrorCalls).to.deep.equal([
        { path: 'cfg.explode', code: 'BAD_REQUEST' },
      ]);
    });

    it('should run errorFormatter after HttpException -> TRPCError mapping', async () => {
      const response = await fetch(
        `http://localhost:${port}/trpc/cfg.explode`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );

      expect(response.status).to.equal(400);
      const body = await response.json();
      const errorShape = body.error.json;
      expect(errorShape.data.code).to.equal('BAD_REQUEST');
      expect(errorShape.data.custom).to.equal('formatted:BAD_REQUEST');
      expect(String(errorShape.message)).to.include('invalid payload');
    });

    it('should expose flattened ZodErrors through the errorFormatter recipe', async () => {
      const response = await fetch(`http://localhost:${port}/trpc/cfg.create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superjson.serialize({ title: 'x' })),
      });

      expect(response.status).to.equal(400);
      const body = await response.json();
      const errorShape = body.error.json;
      expect(errorShape.data.custom).to.equal('formatted:BAD_REQUEST');
      expect(errorShape.data.zodError.fieldErrors.title).to.be.an('array');
      expect(errorShape.data.zodError.fieldErrors.title.join(' ')).to.match(
        /3/,
      );
    });
  });

  describe('Fastify', () => {
    let fastifyApp: NestFastifyApplication;
    let fastifyPort: number;

    beforeEach(async () => {
      onErrorCalls = [];
      const module = await createPassthroughModule();
      fastifyApp = module.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
      );
      await fastifyApp.init();
      await fastifyApp.listen(0, '127.0.0.1');
      const address = fastifyApp.getHttpServer().address();
      if (!address || typeof address === 'string') {
        throw new Error('Fastify server did not bind to a TCP port');
      }
      fastifyPort = address.port;
    });

    afterEach(async () => {
      await fastifyApp.close();
    });

    it('should apply transformer and responseMeta on the JSON path', async () => {
      const response = await fetch(
        `http://localhost:${fastifyPort}/trpc/cfg.now`,
        { method: 'GET' },
      );

      expect(response.status).to.equal(207);
      expect(response.headers.get('x-response-meta')).to.equal('standard');
      const body = await response.json();
      expect(body.result.data.meta.values).to.deep.equal({ at: ['Date'] });
    });
  });
});
