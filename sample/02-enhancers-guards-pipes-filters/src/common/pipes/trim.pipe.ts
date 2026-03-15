import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, _metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    const trimmed: Record<string, unknown> = {};
    for (const [key, current] of Object.entries(value)) {
      trimmed[key] = typeof current === 'string' ? current.trim() : current;
    }
    return trimmed;
  }
}
