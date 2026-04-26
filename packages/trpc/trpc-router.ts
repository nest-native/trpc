import { Inject, Injectable, Logger, OnModuleInit, Type } from '@nestjs/common';
import { PARAMTYPES_METADATA } from '@nestjs/common/constants';
import {
  ApplicationConfig,
  ModuleRef,
  DiscoveryService,
  MetadataScanner,
  ModulesContainer,
  Reflector,
} from '@nestjs/core';
import { ContextIdFactory } from '@nestjs/core/helpers/context-id-factory';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { initTRPC, AnyRouter } from '@trpc/server';
import {
  TRPC_INPUT_METADATA,
  TRPC_MODULE_OPTIONS,
  TRPC_OUTPUT_METADATA,
  TRPC_PROCEDURE_METADATA,
  TRPC_PROCEDURE_TYPE_METADATA,
  TRPC_ROUTER_METADATA,
} from './constants';
import { TrpcContextCreator } from './context/trpc-context-creator';
import { createTrpcEnhancerRuntime } from './context/trpc-enhancer-runtime.factory';
import { ProcedureType } from './enums';
import { generateSchema, RouterInfo } from './generators/schema-generator';
import { TrpcModuleOptions, TrpcRouterMetadata } from './interfaces';
import { trpcRequestStorage } from './trpc-request-storage';

interface RegisteredProcedure {
  routerClassName: string;
  methodName: string;
  procedureName: string;
  path: string;
}

interface RouterBuildState {
  trpc: any;
  routerMap: Record<string, any>;
  registeredAliases: Set<string>;
  namespaceAliases: Set<string>;
  registeredProcedures: Map<string, RegisteredProcedure>;
}

interface RouterProviderContext {
  state: RouterBuildState;
  wrapper: any;
  metatype: Type | Function;
  routerClassName: string;
  alias: string | undefined;
  moduleKey: string;
  procedureMap: Record<string, any>;
  routerInfo: RouterInfo;
  prototype: Record<string, any>;
}

@Injectable()
export class TrpcRouter<
  TRouter extends AnyRouter = AnyRouter,
> implements OnModuleInit {
  private readonly logger = new Logger(TrpcRouter.name);
  private appRouter!: TRouter;
  private readonly contextCreator: TrpcContextCreator;
  private collectedRouterInfos: RouterInfo[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector,
    private readonly applicationConfig: ApplicationConfig,
    private readonly moduleRef: ModuleRef,
    @Inject(TRPC_MODULE_OPTIONS)
    private readonly options: TrpcModuleOptions,
  ) {
    this.contextCreator = new TrpcContextCreator(
      createTrpcEnhancerRuntime(
        this.modulesContainer,
        this.applicationConfig,
      ),
    );
  }

  onModuleInit() {
    this.appRouter = this.buildRouter() as TRouter;

    if (this.options.autoSchemaFile) {
      generateSchema(this.collectedRouterInfos, this.options.autoSchemaFile);
      this.logger.log(
        `Generated AppRouter types at "${this.options.autoSchemaFile}"`,
      );
    }
  }

  getRouter(): TRouter {
    return this.appRouter;
  }

  private resolveModuleKey(metatype: Type | Function): string {
    for (const [key, module] of this.modulesContainer) {
      if (module.hasProvider(metatype as Type)) {
        return key;
      }
    }
    return '';
  }

  private buildRouter(): AnyRouter {
    const state: RouterBuildState = {
      trpc: initTRPC.context<any>().create(),
      routerMap: {},
      registeredAliases: new Set<string>(),
      namespaceAliases: new Set<string>(),
      registeredProcedures: new Map<string, RegisteredProcedure>(),
    };
    this.collectedRouterInfos = [];

    for (const wrapper of this.discoveryService.getProviders()) {
      this.registerRouterProvider(state, wrapper);
    }

    return state.trpc.router(state.routerMap);
  }

  private registerRouterProvider(
    state: RouterBuildState,
    wrapper: any,
  ): void {
    const context = this.createRouterProviderContext(state, wrapper);
    if (!context) {
      return;
    }

    const methodNames = this.metadataScanner.getAllMethodNames(
      context.prototype,
    );
    for (const methodName of methodNames) {
      this.registerRouterMethod(context, methodName);
    }

    this.commitRouterProvider(context);
  }

  private createRouterProviderContext(
    state: RouterBuildState,
    wrapper: any,
  ): RouterProviderContext | undefined {
    const { instance, metatype } = wrapper;
    if (!metatype) {
      return undefined;
    }

    const routerMeta: TrpcRouterMetadata | undefined = this.reflector.get(
      TRPC_ROUTER_METADATA,
      metatype,
    );
    if (!routerMeta) {
      return undefined;
    }

    const prototype =
      instance && typeof instance === 'object'
        ? Object.getPrototypeOf(instance)
        : (metatype as Type).prototype;
    if (!prototype) {
      return undefined;
    }

    const routerClassName = this.getRouterClassName(metatype);
    const alias = this.normalizeRouterAlias(routerMeta.alias, routerClassName);

    return {
      state,
      wrapper,
      metatype,
      routerClassName,
      alias,
      moduleKey: this.resolveModuleKey(metatype),
      procedureMap: {},
      routerInfo: { alias, procedures: [] },
      prototype,
    };
  }

  private registerRouterMethod(
    context: RouterProviderContext,
    methodName: string,
  ): void {
    const methodRef = context.prototype[methodName];
    if (typeof methodRef !== 'function') {
      return;
    }

    const procedureName: string | undefined = Reflect.getMetadata(
      TRPC_PROCEDURE_METADATA,
      methodRef,
    );
    const procedureType: ProcedureType | undefined = Reflect.getMetadata(
      TRPC_PROCEDURE_TYPE_METADATA,
      methodRef,
    );

    if (!procedureName && !procedureType) {
      return;
    }
    this.assertValidProcedureMetadata(
      context.routerClassName,
      methodName,
      procedureName,
      procedureType,
    );

    const resolvedProcedureType = procedureType as ProcedureType;
    const inputSchema = Reflect.getMetadata(TRPC_INPUT_METADATA, methodRef);
    const outputSchema = Reflect.getMetadata(TRPC_OUTPUT_METADATA, methodRef);
    const wrappedHandler = this.createWrappedHandler(context, methodName, methodRef);

    this.assertUniqueProcedurePath(
      context.state.registeredProcedures,
      {
        routerClassName: context.routerClassName,
        methodName,
        procedureName,
        path: this.formatProcedurePath(context.alias, procedureName),
      },
    );

    context.procedureMap[procedureName] = this.createProcedure(
      context.state.trpc.procedure,
      resolvedProcedureType,
      inputSchema,
      outputSchema,
      wrappedHandler,
    );

    this.logger.log(
      `Mapped {${resolvedProcedureType}} "${context.alias ? context.alias + '.' : ''}${procedureName}" procedure`,
    );

    context.routerInfo.procedures.push({
      name: procedureName,
      type: resolvedProcedureType,
      inputSchema,
      outputSchema,
    });
  }

  private createWrappedHandler(
    context: RouterProviderContext,
    methodName: string,
    methodRef: (...args: any[]) => any,
  ): (input: unknown, ctx: unknown) => Promise<unknown> {
    const paramTypes: unknown[] =
      Reflect.getMetadata(PARAMTYPES_METADATA, context.prototype, methodName) ??
      [];

    return this.contextCreator.create({
      callback: methodRef,
      methodName,
      moduleKey: context.moduleKey,
      paramTypes,
      inquirerId: context.wrapper.id,
      resolveContextId: () => this.resolveContextId(context.wrapper),
      resolveInstance: (contextId: { id: number }) =>
        this.resolveRouterInstance(context.wrapper, context.metatype, contextId),
    });
  }

  private createProcedure(
    baseProcedure: any,
    procedureType: ProcedureType,
    inputSchema: any,
    outputSchema: any,
    wrappedHandler: (input: unknown, ctx: unknown) => Promise<unknown>,
  ): any {
    let procedure = baseProcedure;

    if (inputSchema) {
      procedure = procedure.input(inputSchema) as any;
    }
    if (outputSchema && procedureType !== ProcedureType.SUBSCRIPTION) {
      procedure = procedure.output(outputSchema) as any;
    }

    switch (procedureType) {
      case ProcedureType.QUERY:
        return procedure.query(
          async ({ input, ctx }: { input: unknown; ctx: unknown }) => {
            return wrappedHandler(input, ctx);
          },
        );
      case ProcedureType.MUTATION:
        return procedure.mutation(
          async ({ input, ctx }: { input: unknown; ctx: unknown }) => {
            return wrappedHandler(input, ctx);
          },
        );
      case ProcedureType.SUBSCRIPTION:
        return this.createSubscriptionProcedure(
          procedure,
          outputSchema,
          wrappedHandler,
        );
    }
  }

  private createSubscriptionProcedure(
    procedure: any,
    outputSchema: any,
    wrappedHandler: (input: unknown, ctx: unknown) => Promise<unknown>,
  ): any {
    const validateOutput = (value: unknown) =>
      this.validateSubscriptionOutput(outputSchema, value);

    return procedure.subscription(
      async function* ({
        input,
        ctx,
      }: {
        input: unknown;
        ctx: unknown;
      }) {
        const result = await wrappedHandler(input, ctx);
        if (
          result != null &&
          typeof result === 'object' &&
          Symbol.asyncIterator in (result as any)
        ) {
          for await (const chunk of result as AsyncIterable<unknown>) {
            yield await validateOutput(chunk);
          }
        } else {
          yield await validateOutput(result);
        }
      },
    );
  }

  private commitRouterProvider(context: RouterProviderContext): void {
    if (Object.keys(context.procedureMap).length === 0) {
      return;
    }

    if (context.alias) {
      this.assertUniqueAliasPath(
        context.alias,
        context.routerClassName,
        context.state.registeredAliases,
        context.state.namespaceAliases,
      );
      this.assignAliasedRouter(
        context.state.routerMap,
        context.alias,
        context.state.trpc.router(context.procedureMap),
      );
    } else {
      Object.assign(context.state.routerMap, context.procedureMap);
    }

    this.collectedRouterInfos.push(context.routerInfo);
  }

  private getRouterClassName(metatype: Type | Function): string {
    return metatype.name;
  }

  private normalizeRouterAlias(
    alias: string | undefined,
    routerClassName: string,
  ): string | undefined {
    if (alias === undefined) {
      return undefined;
    }

    const segments = alias
      .split('.')
      .map(segment => segment.trim());

    if (segments.some(segment => segment.length === 0)) {
      throw this.createConfigurationError(
        `Invalid tRPC router alias "${alias}" on ${routerClassName}.`,
        'Use @Router() for a root router, or provide a non-empty dotted alias such as @Router("users") or @Router("admin.users").',
      );
    }

    return segments.join('.');
  }

  private assertValidProcedureMetadata(
    routerClassName: string,
    methodName: string,
    procedureName: string | undefined,
    procedureType: ProcedureType | undefined,
  ): asserts procedureName is string {
    if (!procedureName || procedureName.trim().length === 0) {
      throw this.createConfigurationError(
        `Invalid tRPC procedure name on ${routerClassName}.${methodName}.`,
        'Pass a non-empty name to @Query(), @Mutation(), or @Subscription(), or omit the name to use the method name.',
      );
    }

    if (!procedureType) {
      throw this.createConfigurationError(
        `Invalid tRPC procedure metadata on ${routerClassName}.${methodName} for procedure "${procedureName}".`,
        'Apply exactly one procedure decorator: @Query(), @Mutation(), or @Subscription().',
      );
    }
  }

  private formatProcedurePath(
    alias: string | undefined,
    procedureName: string,
  ): string {
    return alias ? `${alias}.${procedureName}` : procedureName;
  }

  private assertUniqueProcedurePath(
    registeredProcedures: Map<string, RegisteredProcedure>,
    candidate: RegisteredProcedure,
  ): void {
    const existing = registeredProcedures.get(candidate.path);
    if (existing) {
      throw this.createConfigurationError(
        `Duplicate tRPC procedure path "${candidate.path}" discovered in ${candidate.routerClassName}.${candidate.methodName}.`,
        `It was already registered by ${existing.routerClassName}.${existing.methodName}. Rename one procedure with @Query("name"), @Mutation("name"), or @Subscription("name"), or change one router alias.`,
      );
    }

    registeredProcedures.set(candidate.path, candidate);
  }

  private assertUniqueAliasPath(
    alias: string,
    routerClassName: string,
    registeredAliases: Set<string>,
    namespaceAliases: Set<string>,
  ): void {
    if (registeredAliases.has(alias)) {
      throw this.createConfigurationError(
        `Duplicate tRPC router alias "${alias}" discovered on ${routerClassName}.`,
        'Use a unique router alias, or merge the procedures into a single router class.',
      );
    }

    const segments = alias.split('.');
    for (let index = 1; index < segments.length; index += 1) {
      const prefix = segments.slice(0, index).join('.');
      if (registeredAliases.has(prefix)) {
        throw this.createConfigurationError(
          `Conflicting tRPC router alias "${alias}" discovered on ${routerClassName}.`,
          `The alias "${prefix}" is already registered as a router. Rename one alias so a path segment is not both a router and a namespace.`,
        );
      }
    }

    if (namespaceAliases.has(alias)) {
      throw this.createConfigurationError(
        `Conflicting tRPC router alias "${alias}" discovered on ${routerClassName}.`,
        'That alias is already used as a namespace for another router. Rename one alias so a path segment is not both a router and a namespace.',
      );
    }

    registeredAliases.add(alias);
    for (let index = 1; index < segments.length; index += 1) {
      namespaceAliases.add(segments.slice(0, index).join('.'));
    }
  }

  private createConfigurationError(message: string, suggestion: string): Error {
    return new Error(`${message} Suggested fix: ${suggestion}`);
  }

  private assignAliasedRouter(
    routerMap: Record<string, any>,
    alias: string,
    router: AnyRouter,
  ): void {
    const segments = alias
      .split('.')
      .map(segment => segment.trim())
      .filter(Boolean);

    let cursor: Record<string, any> = routerMap;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      const next = cursor[segment];

      if (!next || typeof next !== 'object') {
        cursor[segment] = {};
      }

      cursor = cursor[segment] as Record<string, any>;
    }

    const leaf = segments[segments.length - 1];
    cursor[leaf] = router;
  }

  private resolveContextId(wrapper: any): { id: number } {
    const store = trpcRequestStorage.getStore();
    if (!store?.req) {
      return STATIC_CONTEXT;
    }

    if (!store.contextId) {
      store.contextId = ContextIdFactory.getByRequest(store.req);
    }

    if (!store.requestRegistered) {
      const requestProviderValue =
        wrapper?.isDependencyTreeDurable?.() && store.contextId.payload
          ? store.contextId.payload
          : Object.assign(store.req, store.contextId.payload ?? {});
      this.moduleRef.registerRequestByContextId(
        requestProviderValue,
        store.contextId,
      );
      store.requestRegistered = true;
    }

    return store.contextId;
  }

  private async resolveRouterInstance(
    wrapper: any,
    metatype: Type | Function,
    contextId: { id: number },
  ): Promise<any> {
    if (contextId === STATIC_CONTEXT && wrapper?.instance) {
      return wrapper.instance;
    }

    try {
      return await this.moduleRef.resolve(
        metatype as Type<unknown>,
        contextId,
        {
          strict: false,
        },
      );
    } catch {
      return wrapper?.instance;
    }
  }

  private async validateSubscriptionOutput(
    outputSchema: any,
    value: unknown,
  ): Promise<unknown> {
    if (!outputSchema) {
      return value;
    }

    if (typeof outputSchema.parseAsync === 'function') {
      return outputSchema.parseAsync(value);
    }
    if (typeof outputSchema.parse === 'function') {
      return outputSchema.parse(value);
    }
    if (typeof outputSchema.validateSync === 'function') {
      return outputSchema.validateSync(value);
    }
    if (typeof outputSchema.create === 'function') {
      return outputSchema.create(value);
    }
    if (typeof outputSchema.assert === 'function') {
      outputSchema.assert(value);
      return value;
    }
    if (typeof outputSchema === 'function') {
      return outputSchema(value);
    }

    return value;
  }
}

/* istanbul ignore next */
export function __temporaryCognitiveComplexityProbeForCi(
  value: unknown,
): number {
  let score = 0;

  if (typeof value === 'object' && value !== null) {
    if ('router' in value) {
      score += 1;
      if ('procedure' in value) {
        score += 2;
        if ('input' in value) {
          score += 3;
          if ('context' in value) {
            score += 4;
            if ('adapter' in value) {
              score += 5;
            } else {
              score -= 5;
            }
          } else if ('request' in value) {
            score += 6;
          } else {
            score -= 6;
          }
        } else if ('output' in value) {
          score += 7;
        } else {
          score -= 7;
        }
      } else if ('subscription' in value) {
        score += 8;
      } else {
        score -= 8;
      }
    } else if ('module' in value) {
      score += 9;
    } else {
      score -= 9;
    }
  } else if (typeof value === 'string') {
    score += value.length > 10 ? 10 : -10;
  } else {
    score -= 11;
  }

  return score;
}
