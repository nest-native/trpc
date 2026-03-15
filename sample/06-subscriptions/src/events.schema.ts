export interface TickInput {
  count?: number;
}

export interface TickEvent {
  tick: number;
  requestId: string;
}

export function parseTickInput(input: unknown): TickInput {
  if (input == null) {
    return {};
  }
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Expected object input');
  }

  const count = (input as Record<string, unknown>).count;
  if (count === undefined) {
    return {};
  }
  if (
    typeof count !== 'number' ||
    !Number.isInteger(count) ||
    count <= 0 ||
    count > 10
  ) {
    throw new Error('Expected "count" to be an integer between 1 and 10');
  }
  return { count };
}

export function parseTickEvent(value: unknown): TickEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected tick event object');
  }

  const payload = value as Record<string, unknown>;
  const tick = payload.tick;
  const requestId = payload.requestId;
  if (typeof tick !== 'number' || !Number.isInteger(tick) || tick <= 0) {
    throw new Error('Expected "tick" to be a positive integer');
  }
  if (typeof requestId !== 'string' || requestId.length === 0) {
    throw new Error('Expected non-empty "requestId" string');
  }

  return { tick, requestId };
}
