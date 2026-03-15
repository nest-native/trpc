import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './@generated/server';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

async function assertTypes() {
  const sum = await client.math.sum.query({ a: 10, b: 32 });
  const _result: number = sum.result;
}

void assertTypes;
