import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import {
  DEMO_API_KEY,
  TRPC_API_KEY_HEADER,
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from '../src/common/trpc-context';

async function expectFailure(label: string, run: () => Promise<unknown>) {
  try {
    await run();
    throw new Error(`${label}: expected failure`);
  } catch {
    return;
  }
}

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const authedClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          headers: {
            [TRPC_REQUEST_ID_HEADER]: 'enhancers-smoke',
            [TRPC_API_KEY_HEADER]: DEMO_API_KEY,
          },
        }),
      ],
    });

    const anonClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          headers: {
            [TRPC_REQUEST_ID_HEADER]: 'enhancers-smoke-anon',
          },
        }),
      ],
    });

    const invalidRequestIdClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          headers: {
            [TRPC_REQUEST_ID_HEADER]: 'bad',
            [TRPC_API_KEY_HEADER]: DEMO_API_KEY,
          },
        }),
      ],
    });

    const searchResults = await authedClient.notes.search.query({
      query: '  hello  ',
    });
    if (searchResults.length !== 1) {
      throw new Error(
        'Expected global APP_PIPE trim behavior to allow note lookup by trimmed query',
      );
    }

    await expectFailure('global guard', async () => {
      await invalidRequestIdClient.notes.list.query();
    });

    await expectFailure('guard', async () => {
      await anonClient.notes.create.mutate({ text: 'blocked' });
    });

    const created = await authedClient.notes.create.mutate({ text: 'allowed' });
    if (created.createdByRequestId !== 'enhancers-smoke') {
      throw new Error('Expected request id to flow through @TrpcContext');
    }

    await expectFailure('filter', async () => {
      await authedClient.notes.filteredError.mutate();
    });
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
