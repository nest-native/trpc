import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH } from '../src/common/trpc-context';

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const client = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: `${await app.getUrl()}${TRPC_PATH}` })],
    });

    const result = await client.math.sum.query({ a: 2, b: 3 });
    if (result.result !== 5) {
      throw new Error(`Unexpected sum result: ${result.result}`);
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
