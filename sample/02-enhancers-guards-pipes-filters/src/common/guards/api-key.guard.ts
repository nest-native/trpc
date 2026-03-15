import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppTrpcContext, DEMO_API_KEY } from '../trpc-context';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const trpcCtx = context.getArgs()[1] as AppTrpcContext | undefined;
    return trpcCtx?.requestId != null && trpcCtx.apiKey === DEMO_API_KEY;
  }
}
