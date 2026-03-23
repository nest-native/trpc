import { expect } from 'chai';
import * as TrpcPublicApi from '../index';

describe('Public API entrypoint', () => {
  it('should expose stable top-level exports from package index', () => {
    const exportNames = [
      'Input',
      'Mutation',
      'ProcedureType',
      'Query',
      'Router',
      'Subscription',
      'TrpcContext',
      'TrpcParamtype',
      'TrpcModule',
      'TrpcRouter',
    ];

    expect(Object.keys(TrpcPublicApi).sort()).to.deep.equal(exportNames.sort());

    for (const exportName of exportNames) {
      expect((TrpcPublicApi as Record<string, unknown>)[exportName]).to.not.equal(
        undefined,
      );
    }
  });
});
