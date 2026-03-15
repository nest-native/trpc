import { NestFactory } from '@nestjs/core';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppModule } from '../src/app.module';
import type { AppRouter } from '../src/@generated/server';
import {
  DEFAULT_TRPC_TRACE_HEADER,
  TRPC_REQUEST_ID_HEADER,
} from '../src/common/trpc-context';

async function smoke() {
  process.env.TRPC_PATH = '/rpc';
  process.env.TRPC_TRACE_HEADER = DEFAULT_TRPC_TRACE_HEADER;

  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const requestId = 'req-smoke-1';
    const traceId = 'trace-smoke-1';

    const client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${baseUrl}/rpc`,
          headers: () => ({
            [TRPC_REQUEST_ID_HEADER]: requestId,
            [DEFAULT_TRPC_TRACE_HEADER]: traceId,
          }),
        }),
      ],
    });

    const context = await client.system.context.query();
    if (context.requestId !== requestId) {
      throw new Error('Expected context.requestId to be sourced from request headers');
    }
    if (context.middlewareTraceId !== traceId) {
      throw new Error('Expected context.middlewareTraceId to be sourced from middleware');
    }
    if (context.source !== 'middleware') {
      throw new Error('Expected context.source to be "middleware"');
    }
  } finally {
    await app.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
