import { createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from './@generated/server';

declare const client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

void client.health.ping.query();

async function assertHealthTypes() {
  const status = await client.health.status.query();

  status.service satisfies 'nest-trpc-native-angular-showcase';
  status.status satisfies 'ok';
  status.requestId satisfies string;
  status.timestamp satisfies string;
  status.uptimeSeconds satisfies number;
}

void assertHealthTypes;
