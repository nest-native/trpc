import { Query, Router } from '@nest-native/trpc';

@Router()
export class HealthRouter {
  @Query()
  ping() {
    return 'pong' as const;
  }
}
