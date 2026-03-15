import { ApplicationConfig } from '@nestjs/core';
import { ExternalExceptionFilterContext } from '@nestjs/core/exceptions/external-exception-filter-context';
import { GuardsConsumer } from '@nestjs/core/guards/guards-consumer';
import { GuardsContextCreator } from '@nestjs/core/guards/guards-context-creator';
import { InterceptorsConsumer } from '@nestjs/core/interceptors/interceptors-consumer';
import { InterceptorsContextCreator } from '@nestjs/core/interceptors/interceptors-context-creator';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { PipesConsumer } from '@nestjs/core/pipes/pipes-consumer';
import { PipesContextCreator } from '@nestjs/core/pipes/pipes-context-creator';
import { TrpcEnhancerRuntime } from './trpc-context-creator';

interface ContainerRefLike {
  getModules: () => ModulesContainer;
}

/**
 * Isolates Nest internal enhancer creator wiring to a single boundary.
 *
 * This keeps TrpcContextCreator focused on orchestration logic and makes
 * future Nest major upgrades cheaper to validate and patch.
 */
export function createTrpcEnhancerRuntime(
  modulesContainer: ModulesContainer,
  applicationConfig: ApplicationConfig,
): TrpcEnhancerRuntime {
  const containerRef: ContainerRefLike = {
    getModules: () => modulesContainer,
  };

  return {
    guardsContextCreator: new GuardsContextCreator(
      containerRef as any,
      applicationConfig,
    ),
    guardsConsumer: new GuardsConsumer(),
    interceptorsContextCreator: new InterceptorsContextCreator(
      containerRef as any,
      applicationConfig,
    ),
    interceptorsConsumer: new InterceptorsConsumer(),
    pipesContextCreator: new PipesContextCreator(
      containerRef as any,
      applicationConfig,
    ),
    pipesConsumer: new PipesConsumer(),
    exceptionFiltersContext: new ExternalExceptionFilterContext(
      containerRef as any,
      applicationConfig,
    ),
  };
}
