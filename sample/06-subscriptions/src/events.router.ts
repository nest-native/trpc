import {
  Input,
  Query,
  Router,
  Subscription,
  TrpcContext,
} from 'nest-trpc-native';
import { parseTickEvent, parseTickInput } from './events.schema';

@Router()
export class EventsRouter {
  @Query()
  ping() {
    return 'pong' as const;
  }

  @Subscription({ input: parseTickInput, output: parseTickEvent })
  async *ticks(
    @Input('count') count: number | undefined,
    @TrpcContext('requestId') requestId: string,
  ) {
    const total = count ?? 3;
    for (let tick = 1; tick <= total; tick++) {
      yield { tick, requestId };
    }
  }
}
