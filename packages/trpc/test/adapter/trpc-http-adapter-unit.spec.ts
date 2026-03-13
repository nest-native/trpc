import { expect } from 'chai';
import * as sinon from 'sinon';
import { initTRPC } from '@trpc/server';
import { TrpcHttpAdapter } from '../../trpc-http-adapter';
import { TrpcRouter } from '../../trpc-router';

/**
 * Unit tests exercising the response-object fallback chains
 * inside TrpcHttpAdapter's handler function.
 *
 * The integration tests always use Express (which provides res.setHeader + res.send)
 * or Fastify (which provides res.raw). These unit tests cover the remaining fallback
 * branches: res.header(), res.raw.setHeader(), res.end(), and res.raw.end().
 */
describe('TrpcHttpAdapter (unit – response fallbacks)', () => {
  let trpcRouter: any;
  let options: any;
  let httpAdapter: any;

  beforeEach(() => {
    const t = initTRPC.context<any>().create();
    const appRouter = t.router({
      hello: t.procedure.query(() => 'world'),
    });

    trpcRouter = { getRouter: sinon.stub().returns(appRouter) };
    options = { path: '/trpc' };
    httpAdapter = { httpAdapter: { getInstance: () => ({}) } };
  });

  afterEach(() => sinon.restore());

  function createAdapter(): TrpcHttpAdapter {
    return new TrpcHttpAdapter(httpAdapter, trpcRouter as TrpcRouter, options);
  }

  function makeGetRequest(url = '/trpc/hello?input=%7B%7D') {
    return {
      method: 'GET',
      protocol: 'http',
      headers: { host: 'localhost' },
      originalUrl: url,
      body: undefined,
    };
  }

  it('should fall back to res.header() when res.setHeader is missing', done => {
    const headerSpy = sinon.spy();
    const sendSpy = sinon.spy((payload: string) => {
      const parsed = JSON.parse(payload);
      expect(parsed.result.data).to.equal('world');
      expect(headerSpy.called).to.be.true;
      done();
    });

    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        handler(makeGetRequest(), { header: headerSpy, send: sendSpy });
      },
    });

    createAdapter().onModuleInit();
  });

  it('should fall back to res.raw.setHeader() when both setHeader and header are missing', done => {
    const rawSetHeader = sinon.spy();
    const rawEnd = sinon.spy((payload: string) => {
      const parsed = JSON.parse(payload);
      expect(parsed.result.data).to.equal('world');
      expect(rawSetHeader.called).to.be.true;
      done();
    });

    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        handler(makeGetRequest(), {
          raw: { setHeader: rawSetHeader, end: rawEnd },
        });
      },
    });

    createAdapter().onModuleInit();
  });

  it('should fall back to res.end() when res.send is missing', done => {
    const endSpy = sinon.spy((payload: string) => {
      const parsed = JSON.parse(payload);
      expect(parsed.result.data).to.equal('world');
      done();
    });

    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        handler(makeGetRequest(), { setHeader: sinon.spy(), end: endSpy });
      },
    });

    createAdapter().onModuleInit();
  });

  it('should fall back to res.raw.end() when both send and end are missing', done => {
    const rawEnd = sinon.spy((payload: string) => {
      const parsed = JSON.parse(payload);
      expect(parsed.result.data).to.equal('world');
      done();
    });

    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        handler(makeGetRequest(), {
          setHeader: sinon.spy(),
          raw: { end: rawEnd },
        });
      },
    });

    createAdapter().onModuleInit();
  });

  it('should derive https protocol from req.raw.socket.encrypted', done => {
    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        const req = {
          method: 'GET',
          raw: { socket: { encrypted: true } },
          headers: { host: 'example.com' },
          url: '/trpc/hello?input=%7B%7D',
        };
        const res = {
          setHeader: sinon.spy(),
          send: sinon.spy((payload: string) => {
            const parsed = JSON.parse(payload);
            expect(parsed.result.data).to.equal('world');
            done();
          }),
        };
        handler(req, res);
      },
    });

    createAdapter().onModuleInit();
  });

  it('should register via Fastify route() when use() is absent', done => {
    const methods: string[] = [];
    httpAdapter.httpAdapter.getInstance = () => ({
      route: (opts: any) => {
        expect(opts.url).to.equal('/trpc/*');
        expect(opts.handler).to.be.a('function');
        methods.push(opts.method);
        if (methods.length === 2) {
          expect(methods).to.deep.equal(['GET', 'POST']);
          done();
        }
      },
    });

    createAdapter().onModuleInit();
  });

  it('should fall back to localhost when hostname and host header are absent', done => {
    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        const req = {
          method: 'GET',
          protocol: 'http',
          headers: {},
          originalUrl: '/trpc/hello?input=%7B%7D',
        };
        const res = {
          setHeader: sinon.spy(),
          send: sinon.spy((payload: string) => {
            const parsed = JSON.parse(payload);
            expect(parsed.result.data).to.equal('world');
            done();
          }),
        };
        handler(req, res);
      },
    });

    createAdapter().onModuleInit();
  });

  it('should use req.hostname when available', done => {
    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        const req = {
          method: 'GET',
          protocol: 'http',
          hostname: 'myhost.local',
          headers: {},
          originalUrl: '/trpc/hello?input=%7B%7D',
        };
        const res = {
          setHeader: sinon.spy(),
          send: sinon.spy((payload: string) => {
            const parsed = JSON.parse(payload);
            expect(parsed.result.data).to.equal('world');
            done();
          }),
        };
        handler(req, res);
      },
    });

    createAdapter().onModuleInit();
  });

  it('should fall back to all defaults when protocol, hostname, and host are absent', done => {
    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        // No protocol, no hostname, no host header, use url instead of originalUrl
        const req = {
          method: 'GET',
          headers: {},
          url: '/trpc/hello?input=%7B%7D',
        };
        const res = {
          setHeader: sinon.spy(),
          send: sinon.spy((payload: string) => {
            const parsed = JSON.parse(payload);
            expect(parsed.result.data).to.equal('world');
            done();
          }),
        };
        handler(req, res);
      },
    });

    createAdapter().onModuleInit();
  });

  it('should do nothing when httpAdapter is falsy', () => {
    httpAdapter.httpAdapter = undefined as any;
    // Should not throw
    createAdapter().onModuleInit();
  });

  it('should preserve string, Buffer, and typed-array request bodies', async () => {
    const adapter = createAdapter() as any;

    const stringBody = await adapter.resolveBody({ body: 'raw-string' });
    expect(stringBody).to.equal('raw-string');

    const bufferBody = Buffer.from('raw-buffer', 'utf-8');
    const resolvedBuffer = await adapter.resolveBody({ body: bufferBody });
    expect(Buffer.isBuffer(resolvedBuffer)).to.equal(true);
    expect((resolvedBuffer as Buffer).toString('utf-8')).to.equal('raw-buffer');

    const typedArrayBody = new Uint8Array([116, 101, 115, 116]); // "test"
    const resolvedTypedArray = await adapter.resolveBody({ body: typedArrayBody });
    expect(resolvedTypedArray).to.equal(typedArrayBody);
  });

  it('should serialize raw request bodies when parsed body is absent', async () => {
    const adapter = createAdapter() as any;
    const value = await adapter.resolveBody({
      body: undefined,
      raw: { body: '{"from":"raw"}' },
    });
    expect(value).to.equal('{"from":"raw"}');
  });

  it('should return undefined when no request stream is available', async () => {
    const adapter = createAdapter() as any;
    const value = await adapter.resolveBody({ body: undefined, raw: {} });
    expect(value).to.be.undefined;
  });

  it('should return undefined when request stream has no chunks', async () => {
    const adapter = createAdapter() as any;
    const emptyStreamSource = {
      on: sinon.stub(),
      async *[Symbol.asyncIterator]() {},
    };

    const value = await adapter.resolveBody({
      body: undefined,
      raw: emptyStreamSource,
    });
    expect(value).to.be.undefined;
  });

  it('should read raw stream bodies and normalize string chunks', async () => {
    const adapter = createAdapter() as any;
    const streamSource = {
      on: sinon.stub(),
      async *[Symbol.asyncIterator]() {
        yield 'part-one';
        yield Buffer.from('-part-two', 'utf-8');
      },
    };

    const value = await adapter.resolveBody({
      body: undefined,
      raw: streamSource,
    });
    expect(value).to.equal('part-one-part-two');
  });

  it('should treat non-SSE responses as non-streaming when content-type is missing', () => {
    const adapter = createAdapter() as any;
    expect(adapter.isStreamingResponse(new Response('ok'))).to.equal(false);
  });

  it('should detect SSE responses from content-type headers', () => {
    const adapter = createAdapter() as any;
    const sse = new Response('event: ping\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });
    const json = new Response('{"ok":true}', {
      headers: { 'content-type': 'application/json' },
    });

    expect(adapter.isStreamingResponse(sse)).to.equal(true);
    expect(adapter.isStreamingResponse(json)).to.equal(false);
  });

  it('should treat undefined content-type values as non-streaming', () => {
    const adapter = createAdapter() as any;
    const fauxResponse = {
      headers: {
        get: () => undefined,
      },
    };
    expect(adapter.isStreamingResponse(fauxResponse)).to.equal(false);
  });

  it('should convert unexpected handler errors into a 500 tRPC response', done => {
    const adapter = createAdapter() as any;
    adapter.createFetchRequest = () => Promise.reject(new Error('boom'));

    httpAdapter.httpAdapter.getInstance = () => ({
      use: (_path: string, handler: any) => {
        const res: Record<string, any> = {
          setHeader: sinon.spy(),
          send: (payload: string) => {
            const parsed = JSON.parse(payload);
            expect(res.statusCode).to.equal(500);
            expect(parsed.error.code).to.equal(-32603);
            done();
          },
        };
        handler(makeGetRequest(), res);
      },
    });

    adapter.onModuleInit();
  });

  it('should stream chunks via res.raw.write and finish with res.raw.end fallback', async () => {
    const adapter = createAdapter() as any;
    const rawWrite = sinon.spy();
    const rawEnd = sinon.spy();

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([111, 107])); // "ok"
        controller.close();
      },
    });

    await new Promise<void>(resolve => {
      adapter.pipeWebStreamToResponse(
        { on: sinon.stub() },
        {
          raw: {
            write: rawWrite,
            end: () => {
              rawEnd();
              resolve();
            },
          },
        },
        body,
      );
    });

    expect(rawWrite.called).to.equal(true);
    expect(rawEnd.calledOnce).to.equal(true);
  });

  it('should fall back to sendBody when stream chunks cannot be written directly', async () => {
    const adapter = createAdapter() as any;
    const sendSpy = sinon.spy();

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([102, 97, 108, 108, 98, 97, 99, 107]));
        controller.close();
      },
    });

    await new Promise<void>(resolve => {
      adapter.pipeWebStreamToResponse(
        { on: sinon.stub() },
        {
          send: (value: string) => {
            sendSpy(value);
          },
          end: () => {
            resolve();
          },
        },
        body,
      );
    });

    expect(sendSpy.calledOnce).to.equal(true);
    expect(sendSpy.firstCall.args[0]).to.equal('fallback');
  });

  it('should end the response when the stream emits an error', async () => {
    const adapter = createAdapter() as any;
    const endSpy = sinon.spy();

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('stream failed'));
      },
    });

    await new Promise<void>(resolve => {
      adapter.pipeWebStreamToResponse(
        { on: sinon.stub() },
        {
          end: () => {
            endSpy();
            resolve();
          },
        },
        body,
      );
    });

    expect(endSpy.calledOnce).to.equal(true);
  });
});
