import { z } from 'zod';

export const HealthPingOutputSchema = z.literal('pong');

export const HealthStatusOutputSchema = z.object({
  service: z.literal('nest-trpc-native-angular-showcase'),
  status: z.literal('ok'),
  requestId: z.string(),
  timestamp: z.string(),
  uptimeSeconds: z.number(),
});
