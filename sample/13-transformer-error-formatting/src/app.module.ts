import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from '@nest-native/trpc';
import { ZodError, z } from 'zod';
import superjson from 'superjson';
import { reportedErrors } from './common/observability';
import { TRPC_PATH } from './common/trpc-context';
import { TasksRouter } from './tasks/tasks.router';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [
    TrpcModule.forRoot({
      path: TRPC_PATH,
      autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),

      // Serialize/deserialize with superjson so `Date` (and `Map`, `Set`, ...)
      // round-trip between server and client. The client must configure the
      // same transformer on its link (see scripts/smoke.ts).
      transformer: superjson,

      // Canonical tRPC recipe: expose flattened Zod issues to clients.
      // Runs after HttpException -> TRPCError mapping, so `error.code`
      // is already the mapped tRPC code.
      errorFormatter: ({ shape, error }) => ({
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === 'BAD_REQUEST' && error.cause instanceof ZodError
              ? z.flattenError(error.cause)
              : null,
        },
      }),

      // Cache successful queries at the edge; skip streamed (eager) responses.
      responseMeta: ({ type, errors, eagerGeneration }) => ({
        headers:
          type === 'query' && errors.length === 0 && !eagerGeneration
            ? { 'cache-control': 'public, max-age=60' }
            : {},
      }),

      // Centralized error reporting hook.
      onError: ({ path, error }) => {
        reportedErrors.push({ path, code: error.code });
      },
    }),
  ],
  providers: [TasksService, TasksRouter],
})
export class AppModule {}
