export interface AppTrpcContext {
  requestId: string;
}

export const TRPC_PATH = '/trpc';
export const TRPC_REQUEST_ID_HEADER = 'x-request-id';
