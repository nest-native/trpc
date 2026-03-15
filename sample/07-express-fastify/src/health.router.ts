import { Query, Router, TrpcContext } from 'nest-trpc-native';

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
