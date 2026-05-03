import { Injectable, inject } from '@angular/core';
import { TRPC_CLIENT, TrpcClient } from '../trpc/trpc.client';

export type HealthStatus = Awaited<
  ReturnType<TrpcClient['health']['status']['query']>
>;

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  private readonly client = inject(TRPC_CLIENT);

  status() {
    return this.client.health.status.query();
  }
}
