import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH, TRPC_REQUEST_ID_HEADER } from '../src/common/trpc-context';

async function smokeExpress() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const requestId = 'express-smoke';
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

    const ping = await client.ping.query();
    if (ping !== 'pong') {
      throw new Error('Unexpected ping response for express');
    }

    const whoami = await client.whoami.query();
    if (whoami.requestId !== requestId) {
      throw new Error('Express context did not preserve request id');
    }
  } finally {
    await app.close();
  }
}

void smokeExpress().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
