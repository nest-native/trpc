/*
 * nest-trpc-native
 * Copyright(c) 2026 Rodrigo Nogueira
 * MIT Licensed
 */
import 'reflect-metadata';

export { TrpcModule } from './trpc.module';
export { TrpcRouter } from './trpc-router';
export { Router } from './decorators/router.decorator';
export {
  Query,
  Mutation,
  Subscription,
} from './decorators/procedure.decorator';
export { Input } from './decorators/input.decorator';
export { TrpcContext } from './decorators/ctx.decorator';
export { ProcedureType, TrpcParamtype } from './enums';
export type { TrpcModuleOptions, TrpcModuleAsyncOptions } from './interfaces';
