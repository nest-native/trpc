import { expect } from 'chai';
import { ApplicationConfig, ModulesContainer } from '@nestjs/core';
import { createTrpcEnhancerRuntime } from '../../context/trpc-enhancer-runtime.factory';

describe('createTrpcEnhancerRuntime', () => {
  it('should build all required enhancer runtime components', () => {
    const runtime = createTrpcEnhancerRuntime(
      new ModulesContainer(),
      new ApplicationConfig(),
    );

    expect(runtime.guardsContextCreator).to.have.property('create');
    expect(runtime.guardsConsumer).to.have.property('tryActivate');
    expect(runtime.interceptorsContextCreator).to.have.property('create');
    expect(runtime.interceptorsConsumer).to.have.property('intercept');
    expect(runtime.pipesContextCreator).to.have.property('create');
    expect(runtime.pipesConsumer).to.have.property('apply');
    expect(runtime.exceptionFiltersContext).to.have.property('create');
  });
});
