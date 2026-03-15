import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';

async function expectFailure(run: () => Promise<unknown>) {
  try {
    await run();
    throw new Error('Expected DTO validation to fail');
  } catch {
    return;
  }
}

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const client = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: `${await app.getUrl()}/trpc` })],
    });

    const created = await client.accounts.create.mutate({
      name: 'Ada',
      email: 'ada@example.com',
    });
    if (created.email !== 'ada@example.com') {
      throw new Error('Expected account to be created');
    }

    await expectFailure(async () => {
      await client.accounts.create.mutate({
        name: '',
        email: 'not-an-email',
      } as any);
    });
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
