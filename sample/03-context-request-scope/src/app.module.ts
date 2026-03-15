import { Module } from '@nestjs/common';
import { join } from 'path';
import { TrpcModule } from 'nest-trpc-native';
import {
  AppTrpcContext,
  TRPC_PATH,
  TRPC_REQUEST_ID_HEADER,
} from './common/trpc-context';
import { RequestMetaService } from './meta/request-meta.service';
import { MetaRouter } from './meta/meta.router';

@Module({
  imports: [
    TrpcModule.forRootAsync<AppTrpcContext>({
      useFactory: () => ({
        path: TRPC_PATH,
        autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
        createContext: ({ req }) => {
          const requestId =
            req.headers[TRPC_REQUEST_ID_HEADER] ?? crypto.randomUUID();
          return { requestId: String(requestId) };
        },
      }),
    }),
  ],
  providers: [MetaRouter, RequestMetaService],
})
export class AppModule {}
