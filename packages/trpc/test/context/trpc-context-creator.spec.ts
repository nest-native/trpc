import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { expect } from 'chai';
import 'reflect-metadata';
import { defer, of } from 'rxjs';
import * as sinon from 'sinon';
import { TRPCError } from '@trpc/server';
import { TRPC_PARAM_ARGS_METADATA } from '../../constants';
import { TrpcContextCreator } from '../../context/trpc-context-creator';
import { TrpcParamtype } from '../../enums';

/**
 * Unit tests for TrpcContextCreator focusing on edge-case branches
 * that are not covered by the integration-level lifecycle tests.
 */
describe('TrpcContextCreator (unit)', () => {
  let creator: TrpcContextCreator;

  const createExceptionFiltersContextStub = () => ({
    create: sinon.stub().returns({
      next: async (error: unknown) => {
        throw error;
      },
    }),
  });

  beforeEach(() => {
    // Provide stub creators that return empty arrays (no guards/interceptors/pipes)
    const stubCreator = { create: sinon.stub().returns([]) };
    const stubConsumer = {
      tryActivate: sinon.stub().resolves(true),
      intercept: sinon.stub(),
    };
    creator = new TrpcContextCreator(
      stubCreator as any,
      stubConsumer as any,
      stubCreator as any,
      stubConsumer as any,
      stubCreator as any,
      stubConsumer as any,
      createExceptionFiltersContextStub() as any,
    );
  });

  it('should accept enhancer runtime object in constructor', async () => {
    const runtime = {
      guardsContextCreator: { create: sinon.stub().returns([]) },
      guardsConsumer: { tryActivate: sinon.stub().resolves(true) },
      interceptorsContextCreator: { create: sinon.stub().returns([]) },
      interceptorsConsumer: { intercept: sinon.stub() },
      pipesContextCreator: { create: sinon.stub().returns([]) },
      pipesConsumer: { apply: sinon.stub() },
      exceptionFiltersContext: createExceptionFiltersContextStub(),
    };

    const runtimeCreator = new TrpcContextCreator(runtime as any);
    const instance = {
      handler: sinon.stub().callsFake((a: unknown, b: unknown) => [a, b]),
    };
    const wrapped = runtimeCreator.create(instance, instance.handler, '');
    const result = await wrapped('input', 'ctx');

    expect(result).to.deep.equal(['input', 'ctx']);
  });

  it('should throw when legacy constructor args are incomplete', () => {
    expect(() => {
      new TrpcContextCreator({ create: sinon.stub() } as any);
    }).to.throw('Invalid TrpcContextCreator configuration');
  });

  it('should resolve handler args as [input, ctx] when no param metadata exists', async () => {
    const instance = {
      handler: sinon.stub().callsFake((a: unknown, b: unknown) => [a, b]),
    };
    const wrapped = creator.create(instance, instance.handler, '');
    const result = await wrapped('data', 'ctx');
    expect(result).to.deep.equal(['data', 'ctx']);
  });

  it('should extract a specific field from input via @Input("field")', async () => {
    const handler = sinon.stub().callsFake((val: unknown) => val);
    const instance = { handler };

    // Simulate @Input('name') on parameter index 0
    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.INPUT, data: 'name' }],
      handler,
    );

    const wrapped = creator.create(instance, handler, '');
    const result = await wrapped({ name: 'Alice', age: 30 }, {});
    expect(result).to.equal('Alice');
  });

  it('should extract a specific field from context via @TrpcContext("field")', async () => {
    const handler = sinon.stub().callsFake((val: unknown) => val);
    const instance = { handler };

    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.CONTEXT, data: 'requestId' }],
      handler,
    );

    const wrapped = creator.create(instance, handler, '');
    const result = await wrapped({}, { requestId: 'abc-123' });
    expect(result).to.equal('abc-123');
  });

  it('should return undefined when extracting a field from a non-object input', async () => {
    const handler = sinon.stub().callsFake((val: unknown) => val);
    const instance = { handler };

    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.INPUT, data: 'name' }],
      handler,
    );

    const wrapped = creator.create(instance, handler, '');
    const result = await wrapped(null, {});
    expect(result).to.be.undefined;
  });

  it('should return undefined when extracting a field from a primitive context', async () => {
    const handler = sinon.stub().callsFake((val: unknown) => val);
    const instance = { handler };

    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.CONTEXT, data: 'field' }],
      handler,
    );

    const wrapped = creator.create(instance, handler, '');
    const result = await wrapped({}, 42);
    expect(result).to.be.undefined;
  });

  it('should unwrap observable return values via transformToResult', async () => {
    const handler = sinon.stub().returns(of('obs-value'));
    const instance = { handler };

    const wrapped = creator.create(instance, handler, '');
    const result = await wrapped(undefined, {});
    expect(result).to.equal('obs-value');
  });

  it('should handle interceptors that return observables', async () => {
    const handler = sinon.stub().returns('raw');
    const instance = { handler };

    // Provide an interceptor creator that returns one interceptor
    const interceptorCreator = {
      create: sinon.stub().returns([{}]),
    };
    const interceptorConsumer = {
      intercept: sinon
        .stub()
        .callsFake(
          async (
            _interceptors: any,
            _args: any,
            _instance: any,
            _callback: any,
            next: () => Promise<unknown>,
          ) => {
            // Simulate interceptor wrapping result in Observable
            return of(await next());
          },
        ),
    };

    const creatorWithInterceptor = new TrpcContextCreator(
      { create: sinon.stub().returns([]) } as any,
      { tryActivate: sinon.stub().resolves(true) } as any,
      interceptorCreator as any,
      interceptorConsumer as any,
      { create: sinon.stub().returns([]) } as any,
      {} as any,
      createExceptionFiltersContextStub() as any,
    );

    const wrapped = creatorWithInterceptor.create(instance, handler, '');
    const result = await wrapped(undefined, {});
    expect(result).to.equal('raw');
  });

  it('should return full input/context when metadata entry has no field', async () => {
    class HandlerHost {
      handler(a: any, b: any) {
        return { a, b };
      }
    }

    const host = new HandlerHost();
    const methodRef = host.handler;
    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [
        { index: 0, type: TrpcParamtype.INPUT },
        { index: 1, type: TrpcParamtype.CONTEXT },
      ],
      methodRef,
    );

    const wrapped = creator.create(host, methodRef as any, 'module-key');
    const input = { x: 1 };
    const ctx = { userId: 'u1' };

    const result = await wrapped(input, ctx);
    expect(result).to.deep.equal({ a: input, b: ctx });
  });

  it('should convert guard-denied execution to a TRPC FORBIDDEN error', async () => {
    const guardCreator = { create: sinon.stub().returns([{}]) };
    const guardConsumer = { tryActivate: sinon.stub().resolves(false) };

    const guardAwareCreator = new TrpcContextCreator(
      guardCreator as any,
      guardConsumer as any,
      { create: sinon.stub().returns([]) } as any,
      { intercept: sinon.stub() } as any,
      { create: sinon.stub().returns([]) } as any,
      {} as any,
      createExceptionFiltersContextStub() as any,
    );

    const handler = sinon.stub().returns('ok');
    const wrapped = guardAwareCreator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    expect((error as TRPCError).code).to.equal('FORBIDDEN');
  });

  it('should map HttpException to matching TRPC error code', async () => {
    const handler = sinon
      .stub()
      .throws(new BadRequestException('invalid payload'));
    const wrapped = creator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    const trpcError = error as TRPCError;
    expect(trpcError.code).to.equal('BAD_REQUEST');
    expect(trpcError.message).to.include('invalid payload');
  });

  it('should map unknown errors to INTERNAL_SERVER_ERROR', async () => {
    const handler = sinon
      .stub()
      .throws(new HttpException('db down', HttpStatus.SERVICE_UNAVAILABLE));
    const wrapped = creator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    expect((error as TRPCError).code).to.equal('SERVICE_UNAVAILABLE');
  });

  it('should throw INTERNAL_SERVER_ERROR when resolved callback is not a function', async () => {
    const wrapped = creator.create({
      callback: { not: 'a-function' } as any,
      methodName: 'missingMethod',
      moduleKey: 'module-key',
      resolveInstance: async () => ({} as any),
    } as any);

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    const trpcError = error as TRPCError;
    expect(trpcError.code).to.equal('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).to.include('Unable to resolve tRPC handler');
  });

  it('should skip pipe application when metadata contains only @TrpcContext params', async () => {
    const applySpy = sinon.stub().callsFake((value: unknown) => value);
    const pipesConsumer = { apply: applySpy };
    const pipesCreator = { create: sinon.stub().returns([{}]) };

    const localCreator = new TrpcContextCreator(
      { create: sinon.stub().returns([]) } as any,
      { tryActivate: sinon.stub().resolves(true) } as any,
      { create: sinon.stub().returns([]) } as any,
      { intercept: sinon.stub() } as any,
      pipesCreator as any,
      pipesConsumer as any,
      createExceptionFiltersContextStub() as any,
    );

    const handler = sinon.stub().callsFake((ctxValue: unknown) => ctxValue);
    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.CONTEXT, data: 'requestId' }],
      handler,
    );

    const wrapped = localCreator.create({ handler } as any, handler, '');
    const result = await wrapped({}, { requestId: 'ctx-1' });

    expect(result).to.equal('ctx-1');
    expect(applySpy.called).to.equal(false);
  });

  it('should apply pipes to @Input metadata targets', async () => {
    const pipesConsumer = {
      apply: sinon.stub().callsFake(async (value: unknown) => {
        return String(value).toUpperCase();
      }),
    };
    const localCreator = new TrpcContextCreator(
      { create: sinon.stub().returns([]) } as any,
      { tryActivate: sinon.stub().resolves(true) } as any,
      { create: sinon.stub().returns([]) } as any,
      { intercept: sinon.stub() } as any,
      { create: sinon.stub().returns([{}]) } as any,
      pipesConsumer as any,
      createExceptionFiltersContextStub() as any,
    );

    const handler = sinon.stub().callsFake((name: string) => name);
    Reflect.defineMetadata(
      TRPC_PARAM_ARGS_METADATA,
      [{ index: 0, type: TrpcParamtype.INPUT, data: 'name' }],
      handler,
    );

    const wrapped = localCreator.create({ handler } as any, handler, '');
    const result = await wrapped({ name: 'neo' }, {});

    expect(result).to.equal('NEO');
    expect(pipesConsumer.apply.calledOnce).to.equal(true);
  });

  it('should preserve TRPCError instances thrown by handlers', async () => {
    const thrown = new TRPCError({ code: 'UNAUTHORIZED', message: 'no auth' });
    const handler = sinon.stub().throws(thrown);
    const wrapped = creator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.equal(thrown);
    expect((error as TRPCError).code).to.equal('UNAUTHORIZED');
  });

  it('should map plain Error and non-Error throw values to INTERNAL_SERVER_ERROR', async () => {
    const errorHandler = sinon.stub().throws(new Error('boom'));
    const wrappedError = creator.create(
      { handler: errorHandler } as any,
      errorHandler,
      '',
    );
    let firstError: unknown;
    try {
      await wrappedError({}, {});
    } catch (err) {
      firstError = err;
    }

    expect(firstError).to.be.instanceOf(TRPCError);
    expect((firstError as TRPCError).code).to.equal('INTERNAL_SERVER_ERROR');
    expect((firstError as TRPCError).message).to.equal('boom');

    const literalHandler = sinon.stub().throws(123 as any);
    const wrappedLiteral = creator.create(
      { handler: literalHandler } as any,
      literalHandler,
      '',
    );
    let secondError: unknown;
    try {
      await wrappedLiteral({}, {});
    } catch (err) {
      secondError = err;
    }

    expect(secondError).to.be.instanceOf(TRPCError);
    expect((secondError as TRPCError).code).to.equal('INTERNAL_SERVER_ERROR');
    expect((secondError as TRPCError).message).to.equal('Internal server error');
  });

  it('should fall back to HttpException.message when response has no message field', async () => {
    const exception = new HttpException(
      { reason: 'missing-message-field' },
      HttpStatus.BAD_REQUEST,
    );
    const handler = sinon.stub().throws(exception);
    const wrapped = creator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    expect((error as TRPCError).code).to.equal('BAD_REQUEST');
    expect((error as TRPCError).message).to.equal(exception.message);
  });

  it('should map unmapped HttpException statuses to INTERNAL_SERVER_ERROR', async () => {
    const handler = sinon
      .stub()
      .throws(new HttpException('teapot', HttpStatus.I_AM_A_TEAPOT));
    const wrapped = creator.create({ handler } as any, handler, '');

    let error: unknown;
    try {
      await wrapped({}, {});
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(TRPCError);
    expect((error as TRPCError).code).to.equal('INTERNAL_SERVER_ERROR');
    expect((error as TRPCError).message).to.include('teapot');
  });

  /**
   * Regression: when an interceptor is present in the chain (e.g. ClsModule's
   * default passthrough APP_INTERCEPTOR), an HttpException thrown by the
   * handler used to be silently coerced to INTERNAL_SERVER_ERROR because
   * `return this.transformToResult(result)` was not awaited inside the
   * try/catch — the rejected Promise escaped past `handleException` and the
   * @trpc/server boundary wrapped it as a generic 500.
   *
   * The interceptor must subscribe to a deferred Observable (mirroring real
   * `InterceptorsConsumer.intercept` semantics) for the bug to manifest;
   * a previous test (`should handle interceptors that return observables`)
   * awaits `next()` eagerly and therefore does not exercise the bug.
   */
  describe('HttpException through interceptor chain (regression)', () => {
    const createCreatorWithDeferredInterceptor = () => {
      const interceptorCreator = {
        create: sinon.stub().returns([{}]),
      };
      const interceptorConsumer = {
        intercept: sinon
          .stub()
          .callsFake(
            async (
              _interceptors: any,
              _args: any,
              _instance: any,
              _callback: any,
              next: () => Promise<unknown>,
            ) => {
              // Mirror real Nest InterceptorsConsumer: return an Observable
              // that defers the handler invocation until subscription.
              return defer(() => next());
            },
          ),
      };

      return new TrpcContextCreator(
        { create: sinon.stub().returns([]) } as any,
        { tryActivate: sinon.stub().resolves(true) } as any,
        interceptorCreator as any,
        interceptorConsumer as any,
        { create: sinon.stub().returns([]) } as any,
        {} as any,
        createExceptionFiltersContextStub() as any,
      );
    };

    const captureError = async (
      wrapped: (input: unknown, ctx: unknown) => Promise<unknown>,
    ): Promise<unknown> => {
      try {
        await wrapped({}, {});
        return undefined;
      } catch (err) {
        return err;
      }
    };

    it('should map UnauthorizedException to UNAUTHORIZED through interceptors', async () => {
      const handler = sinon.stub().throws(new UnauthorizedException('nope'));
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const error = await captureError(wrapped);
      expect(error).to.be.instanceOf(TRPCError);
      expect((error as TRPCError).code).to.equal('UNAUTHORIZED');
      expect((error as TRPCError).message).to.include('nope');
    });

    it('should map NotFoundException to NOT_FOUND through interceptors', async () => {
      const handler = sinon.stub().throws(new NotFoundException('absent'));
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const error = await captureError(wrapped);
      expect(error).to.be.instanceOf(TRPCError);
      expect((error as TRPCError).code).to.equal('NOT_FOUND');
    });

    it('should map ForbiddenException to FORBIDDEN through interceptors', async () => {
      const handler = sinon.stub().throws(new ForbiddenException('denied'));
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const error = await captureError(wrapped);
      expect(error).to.be.instanceOf(TRPCError);
      expect((error as TRPCError).code).to.equal('FORBIDDEN');
    });

    it('should map BadRequestException to BAD_REQUEST through interceptors', async () => {
      const handler = sinon.stub().throws(new BadRequestException('invalid'));
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const error = await captureError(wrapped);
      expect(error).to.be.instanceOf(TRPCError);
      expect((error as TRPCError).code).to.equal('BAD_REQUEST');
    });

    it('should still map plain Error to INTERNAL_SERVER_ERROR through interceptors', async () => {
      const handler = sinon.stub().throws(new Error('boom'));
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const error = await captureError(wrapped);
      expect(error).to.be.instanceOf(TRPCError);
      expect((error as TRPCError).code).to.equal('INTERNAL_SERVER_ERROR');
      expect((error as TRPCError).message).to.equal('boom');
    });

    it('should resolve normally through a deferred interceptor when handler succeeds', async () => {
      const handler = sinon.stub().returns('ok');
      const creator = createCreatorWithDeferredInterceptor();
      const wrapped = creator.create({ handler } as any, handler, '');

      const result = await wrapped({}, {});
      expect(result).to.equal('ok');
    });
  });
});
