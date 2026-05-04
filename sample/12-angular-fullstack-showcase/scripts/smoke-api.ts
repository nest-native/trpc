import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import {
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from '../src/common/trpc-context';

async function smokeApi() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const requestId = 'angular-showcase-smoke';
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

    const ping = await client.health.ping.query();
    if (ping !== 'pong') {
      throw new Error(`Unexpected ping response: ${String(ping)}`);
    }

    const status = await client.health.status.query();
    if (status.requestId !== requestId) {
      throw new Error(
        `Expected requestId "${requestId}", got "${status.requestId}"`,
      );
    }
    if (status.status !== 'ok') {
      throw new Error(`Unexpected health status: ${status.status}`);
    }
  } finally {
    await app.close();
  }
}

void smokeApi().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
