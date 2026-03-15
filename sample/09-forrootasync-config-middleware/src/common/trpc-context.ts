export const DEFAULT_TRPC_PATH = '/trpc';
export const TRPC_PATH_CONFIG_KEY = 'trpc.path';
export const TRPC_TRACE_HEADER_CONFIG_KEY = 'trpc.traceHeader';

export const TRPC_REQUEST_ID_HEADER = 'x-request-id';
export const DEFAULT_TRPC_TRACE_HEADER = 'x-trace-id';
export const TRPC_TRACE_REQUEST_KEY = '__trpcTraceId';

export interface AppTrpcContext {
  requestId: string;
  middlewareTraceId: string;
  source: 'middleware';
}
