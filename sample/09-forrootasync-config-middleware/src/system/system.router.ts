import { Query, Router, TrpcContext } from '@nest-native/trpc';
import { AppTrpcContext } from '../common/trpc-context';

@Router('system')
export class SystemRouter {
  @Query()
  context(@TrpcContext() context: AppTrpcContext) {
    return context;
  }
}
