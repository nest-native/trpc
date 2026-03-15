import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from '@trpc/client';
import { EventSource } from 'eventsource';
import type { AppRouter } from './@generated/server';
import { TRPC_PATH } from './common/trpc-context';

const client = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: op => op.type === 'subscription',
      true: httpSubscriptionLink({
        url: `http://localhost:3000${TRPC_PATH}`,
        EventSource,
      }),
      false: httpBatchLink({
        url: `http://localhost:3000${TRPC_PATH}`,
      }),
    }),
  ],
});

async function run() {
  const ping = await client.ping.query();
  console.log('ping:', ping);

  client.ticks.subscribe(
    { count: 3 },
    {
      onData(data) {
        console.log('tick:', data);
      },
      onError(error) {
        console.error(error);
      },
      onComplete() {
        console.log('completed');
      },
    },
  );
}

void run();
