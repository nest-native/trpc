import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './@generated/server';

// The generated AppRouter is marked as transformer-enabled, so the link
// REQUIRES a `transformer` here — omitting it is a compile-time error.
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({ url: 'http://localhost:3000/trpc', transformer: superjson }),
  ],
});

async function assertTypes() {
  const tasks = await client.tasks.list.query();
  // `dueAt` is inferred as a real `Date`, not a string.
  const _dueAt: Date | undefined = tasks[0]?.dueAt;

  const created = await client.tasks.create.mutate({
    title: 'Write docs',
    dueAt: new Date(),
  });
  const _createdId: number = created.id;
  const _createdDueAt: Date = created.dueAt;
}

void assertTypes;
