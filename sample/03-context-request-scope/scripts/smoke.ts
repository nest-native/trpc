import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH, TRPC_REQUEST_ID_HEADER } from '../src/common/trpc-context';

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const requestId = 'context-smoke';
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
          headers: {
            [TRPC_REQUEST_ID_HEADER]: requestId,
          },
        }),
      ],
    });

    const whoami = await client.meta.whoami.query();
    if (whoami.requestId !== requestId) {
      throw new Error('Expected @TrpcContext requestId to match header');
    }

    const meta = await client.meta.requestMeta.query();
    if (!meta.path.includes('/trpc')) {
      throw new Error(`Expected request path to include /trpc, got ${meta.path}`);
    }
    if (meta.requestId !== requestId) {
      throw new Error('Expected request-scoped provider to see same request id');
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
