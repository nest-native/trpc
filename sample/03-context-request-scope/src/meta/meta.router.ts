import { Query, Router, TrpcContext } from 'nest-trpc-native';
import { RequestMetaService } from './request-meta.service';

@Router('meta')
export class MetaRouter {
  constructor(private readonly requestMetaService: RequestMetaService) {}

  @Query()
  whoami(@TrpcContext('requestId') requestId: string) {
    return { requestId };
  }

  @Query()
  requestMeta(@TrpcContext('requestId') requestId: string) {
    return {
      requestId,
      ...this.requestMetaService.snapshot(),
    };
  }
}
