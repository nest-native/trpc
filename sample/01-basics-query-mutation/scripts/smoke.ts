import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH } from '../src/common/trpc-context';

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}${TRPC_PATH}`,
        }),
      ],
    });

    const before = await client.todos.list.query();
    await client.todos.create.mutate({ title: 'Ship sample 01' });
    const after = await client.todos.list.query();

    if (after.length !== before.length + 1) {
      throw new Error('Expected todos length to increase by 1');
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
