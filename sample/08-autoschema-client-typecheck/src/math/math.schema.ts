export interface SumInput {
  a: number;
  b: number;
}

export interface SumOutput {
  result: number;
}

export function parseSumInput(input: unknown): SumInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Expected object input');
  }

  const payload = input as Record<string, unknown>;
  const a = payload.a;
  const b = payload.b;
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Expected numeric "a" and "b"');
  }

  return { a, b };
}

export function parseSumOutput(value: unknown): SumOutput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected output object');
  }

  const result = (value as Record<string, unknown>).result;
  if (typeof result !== 'number') {
    throw new Error('Expected numeric "result"');
  }

  return { result };
}
