import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppTrpcContext } from '../trpc-context';

@Injectable()
export class RequestIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const trpcCtx = context.getArgs()[1] as AppTrpcContext | undefined;
    const requestId = trpcCtx?.requestId;
    return typeof requestId === 'string' && requestId.trim().length >= 8;
  }
}
