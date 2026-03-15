import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_TRPC_TRACE_HEADER,
  TRPC_TRACE_HEADER_CONFIG_KEY,
  TRPC_TRACE_REQUEST_KEY,
} from '../trpc-context';

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  [TRPC_TRACE_REQUEST_KEY]?: string;
};

@Injectable()
export class RequestTraceMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: RequestLike, _res: unknown, next: () => void): void {
    const traceHeaderName =
      this.config.get<string>(TRPC_TRACE_HEADER_CONFIG_KEY) ??
      DEFAULT_TRPC_TRACE_HEADER;
    const rawTraceHeader = req.headers[traceHeaderName];
    req[TRPC_TRACE_REQUEST_KEY] =
      typeof rawTraceHeader === 'string'
        ? rawTraceHeader
        : crypto.randomUUID();
    next();
  }
}
