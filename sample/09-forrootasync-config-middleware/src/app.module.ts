import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrpcModule } from 'nest-trpc-native';
import { join } from 'path';
import { RequestTraceMiddleware } from './common/middleware/request-trace.middleware';
import {
  AppTrpcContext,
  DEFAULT_TRPC_PATH,
  TRPC_PATH_CONFIG_KEY,
  TRPC_REQUEST_ID_HEADER,
  TRPC_TRACE_REQUEST_KEY,
} from './common/trpc-context';
import configuration from './configuration';
import { SystemRouter } from './system/system.router';

function normalizeRoutePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TrpcModule.forRootAsync<AppTrpcContext>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const path = config.get<string>(TRPC_PATH_CONFIG_KEY) ?? DEFAULT_TRPC_PATH;

        return {
          path,
          autoSchemaFile: join(process.cwd(), 'src/@generated/server.ts'),
          createContext: ({ req }) => {
            const requestId =
              req.headers[TRPC_REQUEST_ID_HEADER] ?? crypto.randomUUID();
            const traceId = (req as Record<string, unknown>)[TRPC_TRACE_REQUEST_KEY];

            return {
              requestId: String(requestId),
              middlewareTraceId:
                typeof traceId === 'string' ? traceId : 'missing-trace',
              source: 'middleware' as const,
            };
          },
        };
      },
    }),
  ],
  providers: [SystemRouter, RequestTraceMiddleware],
})
export class AppModule implements NestModule {
  constructor(private readonly config: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    const trpcPath = this.config.get<string>(TRPC_PATH_CONFIG_KEY) ?? DEFAULT_TRPC_PATH;
    const routePath = normalizeRoutePath(trpcPath);

    consumer.apply(RequestTraceMiddleware).forRoutes(
      { path: routePath, method: RequestMethod.ALL },
      { path: `${routePath}/(.*)`, method: RequestMethod.ALL },
    );
  }
}
