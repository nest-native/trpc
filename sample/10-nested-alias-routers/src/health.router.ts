import { Query, Router } from 'nest-trpc-native';

@Router()
export class HealthRouter {
  @Query()
  ping() {
    return 'pong' as const;
  }
}
