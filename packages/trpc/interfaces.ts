import { ModuleMetadata } from '@nestjs/common';
import type {
  AnyRouter,
  CombinedDataTransformer,
  DataTransformer,
  TRPCErrorFormatter,
  TRPCErrorShape,
} from '@trpc/server';
import type { HTTPErrorHandler, ResponseMetaFn } from '@trpc/server/http';

export interface TrpcModuleOptions<TContext = any> {
  /**
   * Path to mount the tRPC handler on.
   * @default '/trpc'
   */
  path?: string;

  /**
   * A factory function that creates the tRPC context for each request.
   * Receives the raw request/response objects from the underlying HTTP adapter.
   *
   * @example
   * ```ts
   * TrpcModule.forRoot<MyContext>({
   *   createContext: ({ req }) => ({
   *     userId: req.headers['x-user-id'],
   *   }),
   * })
   * ```
   */
  createContext?: (opts: { req: any; res: any }) => TContext | Promise<TContext>;

  /**
   * Whether to register the module globally.
   * @default false
   */
  isGlobal?: boolean;

  /**
   * Path to the auto-generated TypeScript file that exports the typed `AppRouter`.
   *
   * When set, a `.ts` file is written at this path during module initialisation.
   * Clients can `import type { AppRouter }` from the generated file to get
   * full end-to-end type safety, mirroring `autoSchemaFile` from `@nestjs/graphql`.
   *
   * @example
   * ```ts
   * TrpcModule.forRoot({
   *   autoSchemaFile: join(process.cwd(), 'src/trpc-generated.ts'),
   * })
   * ```
   */
  autoSchemaFile?: string;

  /**
   * A tRPC data transformer (e.g. `superjson`) used to serialize and
   * deserialize payloads, enabling types such as `Date` and `Map` to
   * round-trip between server and client.
   *
   * Passed straight through to `initTRPC.create({ transformer })`.
   * Clients must configure the **same** transformer on their terminating
   * link, e.g. `httpBatchLink({ url, transformer: superjson })`.
   *
   * When set together with `autoSchemaFile`, the generated `AppRouter`
   * type marks the router as transformer-enabled so typed clients are
   * required to configure a link transformer.
   *
   * @see https://trpc.io/docs/server/data-transformers
   *
   * @example
   * ```ts
   * import superjson from 'superjson';
   *
   * TrpcModule.forRoot({ transformer: superjson })
   * ```
   */
  transformer?: DataTransformer | CombinedDataTransformer;

  /**
   * Custom tRPC error formatter used to shape the error payload sent to
   * clients. Passed straight through to `initTRPC.create({ errorFormatter })`.
   *
   * The formatter runs *after* this library maps thrown `HttpException`s
   * to `TRPCError`s, so `error.code` already reflects the mapped tRPC code.
   *
   * @see https://trpc.io/docs/server/error-formatting
   *
   * @example
   * ```ts
   * import { z, ZodError } from 'zod';
   *
   * TrpcModule.forRoot({
   *   errorFormatter: ({ shape, error }) => ({
   *     ...shape,
   *     data: {
   *       ...shape.data,
   *       zodError:
   *         error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
   *           ? z.flattenError(error.cause)
   *           : null,
   *     },
   *   }),
   * })
   * ```
   */
  errorFormatter?: TRPCErrorFormatter<TContext, TRPCErrorShape>;

  /**
   * Hook to set the HTTP status and extra headers of tRPC responses,
   * e.g. `Cache-Control` for public queries. Passed straight through to
   * the tRPC request handler (`responseMeta`).
   *
   * For streamed responses (subscriptions over SSE), the hook runs eagerly
   * (`eagerGeneration: true`) before the first chunk is written, so returned
   * headers are applied to the streaming response as well; a returned
   * `status` cannot rewrite the status of an already-streaming response.
   *
   * @see https://trpc.io/docs/server/caching
   *
   * @example
   * ```ts
   * TrpcModule.forRoot({
   *   responseMeta: ({ type, errors }) =>
   *     type === 'query' && errors.length === 0
   *       ? { headers: { 'cache-control': 'public, max-age=60' } }
   *       : {},
   * })
   * ```
   */
  responseMeta?: ResponseMetaFn<AnyRouter>;

  /**
   * Hook invoked whenever a procedure call fails, before the error
   * response is sent. The standard place for centralized error logging
   * and reporting. Passed straight through to the tRPC request handler
   * (`onError`). `opts.req` is the Fetch API `Request` handed to tRPC.
   *
   * @see https://trpc.io/docs/server/error-handling
   *
   * @example
   * ```ts
   * TrpcModule.forRoot({
   *   onError: ({ error, path }) => {
   *     logger.error(`tRPC error on "${path}": ${error.message}`);
   *   },
   * })
   * ```
   */
  onError?: HTTPErrorHandler<AnyRouter, Request>;
}

export interface TrpcModuleAsyncOptions<TContext = any> extends Pick<
  ModuleMetadata,
  'imports'
> {
  useFactory: (
    ...args: any[]
  ) => TrpcModuleOptions<TContext> | Promise<TrpcModuleOptions<TContext>>;
  inject?: any[];
  extraProviders?: any[];
  isGlobal?: boolean;
}

export interface TrpcRouterMetadata {
  /**
   * Prefix for all procedures in this router.
   * Nested under this key in the merged tRPC router.
   */
  alias?: string;
}
