import { Query, Router, TrpcContext } from 'nest-trpc-native';
import { HealthPingOutputSchema, HealthStatusOutputSchema } from './health.schema';

@Router('health')
export class HealthRouter {
  @Query({ output: HealthPingOutputSchema })
  ping() {
    return 'pong' as const;
  }

  @Query({ output: HealthStatusOutputSchema })
  status(@TrpcContext('requestId') requestId: string) {
    return {
      service: 'nest-trpc-native-angular-showcase' as const,
      status: 'ok' as const,
      requestId,
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    };
  }
}
