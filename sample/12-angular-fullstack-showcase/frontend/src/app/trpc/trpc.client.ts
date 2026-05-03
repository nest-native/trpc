import { InjectionToken } from '@angular/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../../src/@generated/server';
import { environment } from '../../environments/environment';

const TRPC_PATH = '/trpc';
const REQUEST_ID_HEADER = 'x-request-id';

export type TrpcClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;

export const TRPC_CLIENT = new InjectionToken<TrpcClient>('TRPC_CLIENT', {
  providedIn: 'root',
  factory: () =>
    createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${environment.apiBaseUrl}${TRPC_PATH}`,
          headers: () => ({
            [REQUEST_ID_HEADER]: `angular-${crypto.randomUUID()}`,
          }),
        }),
      ],
    }),
});
