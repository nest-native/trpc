import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import {
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from '../src/common/trpc-context';

async function smokeFastify() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: false,
    },
  );

  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const requestId = 'smoke-fastify';
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

    const result = await client.ping.query();
    if (result !== 'pong') {
      throw new Error(`Unexpected ping response: ${String(result)}`);
    }

    const meta = await client.users.requestMeta.query();
    if (meta.requestId !== requestId) {
      throw new Error(
        `Unexpected request-scoped requestId. Expected "${requestId}", got "${meta.requestId}"`,
      );
    }
    if (!meta.path.includes('/trpc')) {
      throw new Error(`Unexpected request-scoped path: ${meta.path}`);
    }
  } finally {
    await app.close();
  }
}

void smokeFastify().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
