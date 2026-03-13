import { expect } from 'chai';
import * as TrpcPublicApi from '../index';

describe('Public API entrypoint', () => {
  it('should expose stable top-level exports from package index', () => {
    expect(TrpcPublicApi).to.include.keys(
      'TrpcModule',
      'TrpcRouter',
      'TrpcHttpAdapter',
      'Router',
      'Query',
      'Mutation',
      'Subscription',
      'Input',
      'TrpcContext',
      'ProcedureType',
      'TrpcParamtype',
      'generateSchema',
      'generateSchemaContent',
      'serializeZodSchema',
      'TRPC_MODULE_OPTIONS',
    );
  });
});
