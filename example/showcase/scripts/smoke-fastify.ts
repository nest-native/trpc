import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';

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
    const client = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: `${baseUrl}/trpc` })],
    });

    const result = await client.ping.query();
    if (result !== 'pong') {
      throw new Error(`Unexpected ping response: ${String(result)}`);
    }
  } finally {
    await app.close();
  }
}

void smokeFastify().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
