import { expect } from 'chai';
import { Test, TestingModule } from '@nestjs/testing';
import { TrpcModule } from '../../trpc.module';
import { TrpcRouter } from '../../trpc-router';
import { TRPC_MODULE_OPTIONS } from '../../constants';

describe('TrpcModule', () => {
  describe('forRoot', () => {
    it('should provide TrpcRouter', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [TrpcModule.forRoot({ path: '/trpc' })],
      }).compile();

      const router = module.get(TrpcRouter);
      expect(router).to.be.instanceOf(TrpcRouter);
    });

    it('should use default options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [TrpcModule.forRoot()],
      }).compile();

      const options = module.get(TRPC_MODULE_OPTIONS);
      expect(options).to.deep.equal({});
    });

    it('should provide custom options', async () => {
      const opts = { path: '/api/trpc' };
      const module: TestingModule = await Test.createTestingModule({
        imports: [TrpcModule.forRoot(opts)],
      }).compile();

      const options = module.get(TRPC_MODULE_OPTIONS);
      expect(options).to.deep.equal(opts);
    });
  });

  describe('forRoot (dynamic module shape)', () => {
    it('should not be global by default and export TrpcRouter', () => {
      const dynamicModule = TrpcModule.forRoot();
      expect(dynamicModule.global).to.equal(false);
      expect(dynamicModule.exports).to.deep.equal([TrpcRouter]);
    });

    it('should honor isGlobal: true', () => {
      const dynamicModule = TrpcModule.forRoot({ isGlobal: true });
      expect(dynamicModule.global).to.equal(true);
    });
  });

  describe('forRootAsync (dynamic module shape)', () => {
    const useFactory = () => ({});

    it('should not be global by default and export TrpcRouter', () => {
      const dynamicModule = TrpcModule.forRootAsync({ useFactory });
      expect(dynamicModule.global).to.equal(false);
      expect(dynamicModule.exports).to.deep.equal([TrpcRouter]);
    });

    it('should honor isGlobal: true', () => {
      const dynamicModule = TrpcModule.forRootAsync({
        useFactory,
        isGlobal: true,
      });
      expect(dynamicModule.global).to.equal(true);
    });

    it('should default the options provider inject list to an empty array', () => {
      const dynamicModule = TrpcModule.forRootAsync({ useFactory });
      const optionsProvider = (dynamicModule.providers ?? []).find(
        provider =>
          typeof provider === 'object' &&
          'provide' in provider &&
          provider.provide === TRPC_MODULE_OPTIONS,
      );
      expect(optionsProvider).to.not.equal(undefined);
      expect((optionsProvider as { inject?: unknown[] }).inject).to.deep.equal(
        [],
      );
    });
  });

  describe('forRootAsync', () => {
    it('should provide TrpcRouter with async options', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          TrpcModule.forRootAsync({
            useFactory: () => ({ path: '/trpc' }),
          }),
        ],
      }).compile();

      const router = module.get(TrpcRouter);
      expect(router).to.be.instanceOf(TrpcRouter);

      const options = module.get(TRPC_MODULE_OPTIONS);
      expect(options).to.deep.equal({ path: '/trpc' });
    });
  });
});
