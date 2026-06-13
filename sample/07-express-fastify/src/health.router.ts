import { Query, Router, TrpcContext } from '@nest-native/trpc';

@Router()
export class HealthRouter {
  @Query()
  ping() {
    return 'pong' as const;
  }

  @Query()
  whoami(@TrpcContext('requestId') requestId: string) {
    return { requestId };
  }
}
