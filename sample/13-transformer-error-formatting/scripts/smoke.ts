import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import { reportedErrors } from '../src/common/observability';
import { TRPC_PATH } from '../src/common/trpc-context';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function smoke() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        // The link transformer must match the server's `transformer` option.
        httpBatchLink({ url: `${baseUrl}${TRPC_PATH}`, transformer: superjson }),
      ],
    });

    // 1. superjson round-trips Date instances end to end.
    const tasks = await client.tasks.list.query();
    assert(tasks[0]?.dueAt instanceof Date, 'Expected dueAt to be a Date');
    assert(
      tasks[0].dueAt.toISOString() === '2026-01-02T03:04:05.000Z',
      'Expected dueAt to keep its value across the wire',
    );

    const dueAt = new Date('2027-03-04T05:06:07.000Z');
    const created = await client.tasks.create.mutate({
      title: 'Write docs',
      dueAt,
    });
    assert(created.dueAt instanceof Date, 'Expected created.dueAt to be a Date');
    assert(
      created.dueAt.getTime() === dueAt.getTime(),
      'Expected mutation input Date to round-trip',
    );

    // 2. errorFormatter exposes the flattened ZodError to clients.
    let zodError: { fieldErrors?: Record<string, string[]> } | undefined;
    try {
      await client.tasks.create.mutate({ title: 'x', dueAt });
    } catch (error) {
      zodError = (error as { data?: { zodError?: typeof zodError } }).data
        ?.zodError;
    }
    assert(
      Array.isArray(zodError?.fieldErrors?.title),
      'Expected flattened ZodError with fieldErrors.title',
    );

    // 3. onError reported the failing call.
    assert(
      reportedErrors.some(
        entry => entry.path === 'tasks.create' && entry.code === 'BAD_REQUEST',
      ),
      'Expected onError to report the failed mutation',
    );

    // 4. responseMeta adds the cache header to successful queries.
    const rawResponse = await fetch(`${baseUrl}${TRPC_PATH}/tasks.list`);
    assert(
      rawResponse.headers.get('cache-control') === 'public, max-age=60',
      'Expected responseMeta cache-control header on queries',
    );
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
