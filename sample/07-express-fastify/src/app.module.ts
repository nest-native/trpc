import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import {
  AppTrpcContext,
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from './common/trpc-context';
import { HealthRouter } from './health.router';

@Module({
  imports: [
    TrpcModule.forRootAsync<AppTrpcContext>({
      useFactory: () => ({
        path: TRPC_PATH,
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => ({
          requestId: String(
            req.headers[TRPC_REQUEST_ID_HEADER] ?? crypto.randomUUID(),
          ),
        }),
      }),
    }),
  ],
  providers: [HealthRouter],
})
export class AppModule {}
