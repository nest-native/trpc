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

    const ping = await client.ping.query();
    if (ping !== 'pong') {
      throw new Error('Expected ping to return pong');
    }

    const before = await client.admin.users.list.query();
    const created = await client.admin.users.create.mutate();
    const after = await client.admin.users.list.query();
    const roles = await client.admin.roles.list.query();

    if (created.ok !== true) {
      throw new Error('Expected nested users mutation to return ok=true');
    }
    if (before.length !== after.length) {
      throw new Error('Expected nested users query to be stable across requests');
    }
    if (!roles.includes('owner')) {
      throw new Error('Expected nested roles list to include owner');
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
