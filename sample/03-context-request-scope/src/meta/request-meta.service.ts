import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

interface RequestLike {
  method?: unknown;
  url?: unknown;
  originalUrl?: unknown;
  headers?: Record<string, unknown> | undefined;
}

@Injectable({ scope: Scope.REQUEST })
export class RequestMetaService {
  constructor(@Inject(REQUEST) private readonly request: RequestLike) {}

  snapshot() {
    const method =
      typeof this.request.method === 'string' ? this.request.method : 'UNKNOWN';
    const path =
      (typeof this.request.originalUrl === 'string'
        ? this.request.originalUrl
        : undefined) ??
      (typeof this.request.url === 'string' ? this.request.url : undefined) ??
      '';
    const userAgent = this.readHeader('user-agent');

    return { method, path, userAgent };
  }

  private readHeader(name: string): string | undefined {
    const raw = this.request.headers?.[name];
    if (typeof raw === 'string') {
      return raw;
    }
    if (Array.isArray(raw)) {
      return raw.join(', ');
    }
    return undefined;
  }
}
