import { Query, Router, TrpcContext } from 'nest-trpc-native';
import { AppTrpcContext } from '../common/trpc-context';

@Router('system')
export class SystemRouter {
  @Query()
  context(@TrpcContext() context: AppTrpcContext) {
    return context;
  }
}
