import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HealthApiService, HealthStatus } from './health/health-api.service';

@Component({
  selector: 'showcase-root',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly healthApi = inject(HealthApiService);

  readonly status = signal<HealthStatus | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly statusLabel = computed(() => this.status()?.status ?? 'checking');

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.status.set(await this.healthApi.status());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
    } finally {
      this.loading.set(false);
    }
  }
}
