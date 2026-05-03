import { Module } from '@nestjs/common';
import { TrpcModule } from 'nest-trpc-native';
import { join } from 'path';
import { HealthRouter } from './health.router';
import {
  AppTrpcContext,
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from './common/trpc-context';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    TrpcModule.forRootAsync<AppTrpcContext>({
      useFactory: () => ({
        path: TRPC_PATH,
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => {
          const requestId =
            req.headers[TRPC_REQUEST_ID_HEADER] ?? randomUUID();
          return {
            requestId: String(requestId),
          };
        },
      }),
    }),
  ],
  providers: [HealthRouter],
})
export class AppModule {}
