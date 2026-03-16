import { expect } from 'chai';
import { Test, TestingModule } from '@nestjs/testing';
import { DiscoveryService, MetadataScanner, ModulesContainer } from '@nestjs/core';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import * as sinon from 'sinon';
import { z } from 'zod';
import { TrpcModule } from '../../trpc.module';
import { TrpcRouter } from '../../trpc-router';
import { trpcRequestStorage } from '../../trpc-request-storage';
import { Router } from '../../decorators/router.decorator';
import { Query, Mutation } from '../../decorators/procedure.decorator';
import { Injectable } from '@nestjs/common';

@Router('greeting')
class GreetingRouter {
  @Query({ input: z.object({ name: z.string() }) })
  hello(input: { name: string }) {
    return `Hello, ${input.name}!`;
  }

  @Mutation({ input: z.object({ name: z.string() }) })
  create(input: { name: string }) {
    return { id: '1', name: input.name };
  }
}

@Router()
class FlatRouter {
  @Query()
  ping() {
    return 'pong';
  }
}

@Router('typed')
class TypedRouter {
  @Query({
    input: z.object({ id: z.string() }),
    output: z.object({ id: z.string(), label: z.string() }),
  })
  getById(input: { id: string }) {
    return { id: input.id, label: `Item ${input.id}` };
  }
}

@Router('admin.users')
class NestedAliasRouter {
  @Query()
  list() {
    return ['alice', 'bob'];
  }
}

@Injectable()
class PlainService {
  doWork() {
    return 'done';
  }
}

@Router('math')
class MathRouter {
  @Query({ input: z.object({ a: z.number(), b: z.number() }) })
  add(input: { a: number; b: number }) {
    return input.a + input.b;
  }
}

@Router('mixed')
class MixedRouter {
  @Query()
  decorated() {
    return 'ok';
  }

  // Not decorated with @Query/@Mutation/@Subscription — should be skipped
  helperMethod() {
    return 'helper';
  }
}

@Router('nullproto')
class NullPrototypeRouter {
  @Query()
  hidden() {
    return 'hidden';
  }
}

@Router('shape')
class NonFunctionPropertyRouter {
  @Query()
  normal() {
    return 'normal';
  }
}
(NonFunctionPropertyRouter.prototype as any).notAMethod = 'plain-value';

@Router('prototypeFallback')
class PrototypeFallbackRouter {
  @Query()
  value() {
    return 'from-prototype';
  }
}

describe('TrpcRouter', () => {
  let trpcRouter: TrpcRouter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [GreetingRouter, FlatRouter],
    }).compile();

    await module.init();

    trpcRouter = module.get(TrpcRouter);
  });

  it('should build a router from decorated providers', () => {
    const router = trpcRouter.getRouter();
    expect(router).to.not.be.undefined;
    expect(router._def).to.not.be.undefined;
  });

  it('should register nested procedures under the alias key', () => {
    const router = trpcRouter.getRouter();
    const procedures = router._def.procedures;
    expect(procedures).to.have.property('greeting.hello');
    expect(procedures).to.have.property('greeting.create');
  });

  it('should register flat procedures at the root level', () => {
    const router = trpcRouter.getRouter();
    const procedures = router._def.procedures;
    expect(procedures).to.have.property('ping');
  });

  it('should call aliased query handler and return correct output', async () => {
    const router = trpcRouter.getRouter();
    const caller = router.createCaller({});
    const result = await (caller as any).greeting.hello({ name: 'World' });
    expect(result).to.equal('Hello, World!');
  });

  it('should call aliased mutation handler and return correct output', async () => {
    const router = trpcRouter.getRouter();
    const caller = router.createCaller({});
    const result = await (caller as any).greeting.create({ name: 'Alice' });
    expect(result).to.deep.equal({ id: '1', name: 'Alice' });
  });

  it('should call flat query handler and return correct output', async () => {
    const router = trpcRouter.getRouter();
    const caller = router.createCaller({});
    const result = await (caller as any).ping();
    expect(result).to.equal('pong');
  });
});

describe('TrpcRouter (nested aliases)', () => {
  it('should register dotted aliases as nested router objects', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [NestedAliasRouter],
    }).compile();

    await module.init();

    const router = module.get(TrpcRouter).getRouter();
    const procedures = router._def.procedures;
    expect(procedures).to.have.property('admin.users.list');

    const caller = router.createCaller({}) as any;
    const result = await caller.admin.users.list();
    expect(result).to.deep.equal(['alice', 'bob']);
  });
});

describe('TrpcRouter (edge cases)', () => {
  it('should skip providers without @Router metadata', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter, PlainService],
    }).compile();

    await module.init();
    const router = module.get(TrpcRouter).getRouter();
    const procedures = router._def.procedures;

    // PlainService has no @Router decorator, so it should not appear
    expect(procedures).to.have.property('ping');
    expect(procedures).to.not.have.property('doWork');
  });

  it('should still work when resolveModuleKey returns empty string', async () => {
    const testingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot()],
      providers: [MathRouter],
    }).compile();

    const trpcRouter = testingModule.get(TrpcRouter);
    const modules = testingModule.get(ModulesContainer);

    // Stub hasProvider to always return false so resolveModuleKey returns ''
    for (const mod of modules.values()) {
      mod.hasProvider = () => false;
    }

    trpcRouter.onModuleInit();

    const caller = trpcRouter.getRouter().createCaller({});
    const result = await (caller as any).math.add({ a: 1, b: 2 });
    expect(result).to.equal(3);
  });

  it('should register procedures with output schema validation', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [TypedRouter],
    }).compile();

    await module.init();
    const router = module.get(TrpcRouter).getRouter();
    const caller = router.createCaller({});
    const result = await (caller as any).typed.getById({ id: '42' });
    expect(result).to.deep.equal({ id: '42', label: 'Item 42' });
  });

  it('should handle an empty module with no routers gracefully', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
    }).compile();

    await module.init();
    const router = module.get(TrpcRouter).getRouter();
    expect(router._def.procedures).to.deep.equal({});
  });

  it('should skip methods without procedure decorators on a @Router class', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [MixedRouter],
    }).compile();

    await module.init();
    const router = module.get(TrpcRouter).getRouter();
    const procedures = router._def.procedures;

    // Only the decorated method should appear
    expect(procedures).to.have.property('mixed.decorated');
    expect(procedures).to.not.have.property('mixed.helperMethod');
  });

  it('should skip providers with null instance or metatype', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter);
    const discoveryService = module.get(DiscoveryService);

    // Inject a provider wrapper with no instance
    const origGetProviders =
      discoveryService.getProviders.bind(discoveryService);
    discoveryService.getProviders = () => {
      const providers = origGetProviders();
      providers.push({ instance: null, metatype: null } as any);
      return providers;
    };

    trpcRouter.onModuleInit();
    const router = trpcRouter.getRouter();
    // The null-instance provider should have been skipped
    expect(router._def.procedures).to.have.property('ping');
  });

  it('should skip router wrappers whose instance has no prototype', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter);
    const discoveryService = module.get(DiscoveryService);

    const originalGetProviders =
      discoveryService.getProviders.bind(discoveryService);
    discoveryService.getProviders = () => {
      const providers = originalGetProviders();
      providers.push({
        id: 'null-proto-wrapper',
        instance: Object.create(null),
        metatype: NullPrototypeRouter,
      } as any);
      return providers;
    };

    trpcRouter.onModuleInit();
    const router = trpcRouter.getRouter();
    expect(router._def.procedures).to.have.property('ping');
    expect(router._def.procedures).to.not.have.property('nullproto.hidden');
  });

  it('should ignore non-function entries returned by the metadata scanner', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [NonFunctionPropertyRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter);
    const metadataScanner = module.get(MetadataScanner);
    const originalGetAllMethodNames =
      metadataScanner.getAllMethodNames.bind(metadataScanner);

    metadataScanner.getAllMethodNames = (prototype: object) => {
      const methodNames = originalGetAllMethodNames(prototype);
      if (prototype === NonFunctionPropertyRouter.prototype) {
        return [...methodNames, 'notAMethod'];
      }
      return methodNames;
    };

    trpcRouter.onModuleInit();
    const procedures = trpcRouter.getRouter()._def.procedures;
    expect(procedures).to.have.property('shape.normal');
    expect(procedures).to.not.have.property('shape.notAMethod');
  });

  it('should resolve context and router instances across static and request scopes', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter) as any;
    const staticWrapper = { instance: { marker: 'static' } };
    trpcRequestStorage.disable();
    const contextId = trpcRequestStorage.run(
      { req: undefined, res: undefined } as any,
      () => trpcRouter.resolveContextId(staticWrapper),
    );
    expect(contextId).to.equal(STATIC_CONTEXT);

    const staticInstance = await trpcRouter.resolveRouterInstance(
      staticWrapper,
      FlatRouter,
      STATIC_CONTEXT,
    );
    expect(staticInstance).to.equal(staticWrapper.instance);

    const moduleRefResolve = trpcRouter.moduleRef.resolve.bind(trpcRouter.moduleRef);
    trpcRouter.moduleRef.resolve = async () => {
      throw new Error('resolution failed');
    };
    const fallbackInstance = { marker: 'fallback' };
    const resolvedFallback = await trpcRouter.resolveRouterInstance(
      { instance: fallbackInstance },
      FlatRouter,
      { id: 999 },
    );
    expect(resolvedFallback).to.equal(fallbackInstance);
    trpcRouter.moduleRef.resolve = moduleRefResolve;
  });

  it('should support all subscription output validator contracts', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter) as any;

    expect(
      await trpcRouter.validateSubscriptionOutput(
        { parse: (value: unknown) => `parsed:${String(value)}` },
        'x',
      ),
    ).to.equal('parsed:x');

    expect(
      await trpcRouter.validateSubscriptionOutput(
        { validateSync: (value: unknown) => ({ wrapped: value }) },
        'y',
      ),
    ).to.deep.equal({ wrapped: 'y' });

    expect(
      await trpcRouter.validateSubscriptionOutput(
        { create: (value: unknown) => ({ created: value }) },
        'z',
      ),
    ).to.deep.equal({ created: 'z' });

    const assertSpy: Array<unknown> = [];
    expect(
      await trpcRouter.validateSubscriptionOutput(
        {
          assert: (value: unknown) => {
            assertSpy.push(value);
          },
        },
        'asserted',
      ),
    ).to.equal('asserted');
    expect(assertSpy).to.deep.equal(['asserted']);

    expect(
      await trpcRouter.validateSubscriptionOutput(
        (value: unknown) => ({ fn: value }),
        'fn-value',
      ),
    ).to.deep.equal({ fn: 'fn-value' });

    const passthrough = { untouched: true };
    expect(
      await trpcRouter.validateSubscriptionOutput(
        { unsupported: true },
        passthrough,
      ),
    ).to.equal(passthrough);
  });

  it('should fall back to metatype.prototype when wrapper.instance is not an object', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter);
    const discoveryService = module.get(DiscoveryService);

    const originalGetProviders =
      discoveryService.getProviders.bind(discoveryService);
    discoveryService.getProviders = () => {
      const providers = originalGetProviders();
      providers.push({
        id: 'prototype-fallback-wrapper',
        instance: 42,
        metatype: PrototypeFallbackRouter,
      } as any);
      return providers;
    };

    Reflect.deleteMetadata(
      PARAMTYPES_METADATA,
      PrototypeFallbackRouter.prototype,
      'value',
    );

    trpcRouter.onModuleInit();
    const caller = trpcRouter.getRouter().createCaller({}) as any;
    expect(await caller.prototypeFallback.value()).to.equal('from-prototype');
  });

  it('should register durable request payloads by context id', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TrpcModule.forRoot({ path: '/trpc' })],
      providers: [FlatRouter],
    }).compile();

    await module.init();
    const trpcRouter = module.get(TrpcRouter) as any;
    const registerSpy = sinon.spy(
      trpcRouter.moduleRef,
      'registerRequestByContextId',
    );
    const durablePayload = { durable: true };

    trpcRequestStorage.run(
      {
        req: { marker: 'req' },
        res: {},
        contextId: { id: 77, payload: durablePayload },
        requestRegistered: false,
      } as any,
      () => {
        const resolved = trpcRouter.resolveContextId({
          isDependencyTreeDurable: () => true,
        });
        expect(resolved).to.deep.equal({ id: 77, payload: durablePayload });
      },
    );

    expect(registerSpy.calledOnce).to.equal(true);
    expect(registerSpy.firstCall.args[0]).to.equal(durablePayload);
    expect(registerSpy.firstCall.args[1]).to.deep.equal({
      id: 77,
      payload: durablePayload,
    });
    registerSpy.restore();
  });
});
