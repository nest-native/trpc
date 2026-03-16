import { Module } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import {
  AppTrpcContext,
  TRPC_API_KEY_HEADER,
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from './common/trpc-context';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { RequestIdGuard } from './common/guards/request-id.guard';
import { ExecutionTimeInterceptor } from './common/interceptors/execution-time.interceptor';
import { TrimPipe } from './common/pipes/trim.pipe';
import { RemapBadRequestFilter } from './common/filters/remap-bad-request.filter';
import { NotesRouter } from './notes/notes.router';
import { NotesService } from './notes/notes.service';

@Module({
  imports: [
    TrpcModule.forRootAsync<AppTrpcContext>({
      useFactory: () => ({
        path: TRPC_PATH,
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => {
          const requestId =
            req.headers[TRPC_REQUEST_ID_HEADER] ?? crypto.randomUUID();
          const rawApiKey = req.headers[TRPC_API_KEY_HEADER];
          return {
            requestId: String(requestId),
            apiKey: typeof rawApiKey === 'string' ? rawApiKey : undefined,
          };
        },
      }),
    }),
  ],
  providers: [
    NotesService,
    NotesRouter,
    ApiKeyGuard,
    RequestIdGuard,
    ExecutionTimeInterceptor,
    RemapBadRequestFilter,
    {
      provide: APP_GUARD,
      useClass: RequestIdGuard,
    },
    {
      provide: APP_PIPE,
      useClass: TrimPipe,
    },
  ],
})
export class AppModule {}
