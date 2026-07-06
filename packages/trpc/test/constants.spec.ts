import { expect } from 'chai';
import {
  TRPC_INPUT_METADATA,
  TRPC_MODULE_OPTIONS,
  TRPC_OUTPUT_METADATA,
  TRPC_PARAM_ARGS_METADATA,
  TRPC_PROCEDURE_METADATA,
  TRPC_PROCEDURE_TYPE_METADATA,
  TRPC_ROUTER_METADATA,
} from '../constants';

/**
 * The metadata keys are a wire-level contract: decorators write them onto
 * user classes/methods via `Reflect.defineMetadata`, so they are observable
 * to devtools and must stay unique and stable across package versions
 * (e.g. when two copies of the library coexist in one dependency tree).
 */
describe('constants (metadata-key contract)', () => {
  it('should keep the documented metadata key values', () => {
    expect(TRPC_MODULE_OPTIONS).to.equal('TRPC_MODULE_OPTIONS');
    expect(TRPC_ROUTER_METADATA).to.equal('trpc:router');
    expect(TRPC_PROCEDURE_METADATA).to.equal('trpc:procedure');
    expect(TRPC_PROCEDURE_TYPE_METADATA).to.equal('trpc:procedure_type');
    expect(TRPC_INPUT_METADATA).to.equal('trpc:input');
    expect(TRPC_OUTPUT_METADATA).to.equal('trpc:output');
    expect(TRPC_PARAM_ARGS_METADATA).to.equal('__trpcParamArgs__');
  });

  it('should keep all metadata keys unique', () => {
    const keys = [
      TRPC_MODULE_OPTIONS,
      TRPC_ROUTER_METADATA,
      TRPC_PROCEDURE_METADATA,
      TRPC_PROCEDURE_TYPE_METADATA,
      TRPC_INPUT_METADATA,
      TRPC_OUTPUT_METADATA,
      TRPC_PARAM_ARGS_METADATA,
    ];
    expect(new Set(keys).size).to.equal(keys.length);
  });
});
