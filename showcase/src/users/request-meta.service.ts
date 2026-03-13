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
    const userAgent = this.readHeader('user-agent');
    const method =
      typeof this.request.method === 'string' ? this.request.method : 'UNKNOWN';
    const path =
      (typeof this.request.originalUrl === 'string'
        ? this.request.originalUrl
        : undefined) ??
      (typeof this.request.url === 'string' ? this.request.url : undefined) ??
      '';

    return {
      method,
      path,
      userAgent,
    };
  }

  private readHeader(name: string): string | undefined {
    const rawValue = this.request.headers?.[name];
    if (typeof rawValue === 'string') {
      return rawValue;
    }
    if (Array.isArray(rawValue)) {
      return rawValue.join(', ');
    }
    return undefined;
  }
}
