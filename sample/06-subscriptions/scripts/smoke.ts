import { NestFactory } from '@nestjs/core';
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from '@trpc/client';
import { EventSource } from 'eventsource';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { TRPC_PATH } from '../src/common/trpc-context';

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const client = createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: op => op.type === 'subscription',
          true: httpSubscriptionLink({
            url: `${baseUrl}${TRPC_PATH}`,
            EventSource,
          }),
          false: httpBatchLink({
            url: `${baseUrl}${TRPC_PATH}`,
          }),
        }),
      ],
    });

    const ping = await client.ping.query();
    if (ping !== 'pong') {
      throw new Error(`Unexpected ping value: ${String(ping)}`);
    }

    const ticks: number[] = [];
    await new Promise<void>((resolve, reject) => {
      client.ticks.subscribe(
        { count: 3 },
        {
          onData(event) {
            ticks.push(event.tick);
          },
          onError(error) {
            reject(error);
          },
          onComplete() {
            resolve();
          },
        },
      );
    });

    if (ticks.join(',') !== '1,2,3') {
      throw new Error(`Unexpected tick sequence: ${ticks.join(',')}`);
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
