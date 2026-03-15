import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH } from '../src/common/trpc-context';

async function expectFailure(run: () => Promise<unknown>) {
  try {
    await run();
    throw new Error('Expected call to fail validation');
  } catch {
    return;
  }
}

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const client = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: `${baseUrl}${TRPC_PATH}` })],
    });

    const created = await client.products.create.mutate({
      name: 'Webcam',
      price: 79,
    });
    if (created.name !== 'Webcam') {
      throw new Error('Unexpected product name');
    }

    await expectFailure(async () => {
      await client.products.create.mutate({ name: '', price: -1 } as any);
    });
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
