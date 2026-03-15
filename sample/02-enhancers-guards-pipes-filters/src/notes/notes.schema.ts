export interface CreateNoteInput {
  text: string;
}

export interface NoteSearchInput {
  query: string;
}

function expectObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected object input');
  }
  return value as Record<string, unknown>;
}

export function parseNoteSearchInput(input: unknown): NoteSearchInput {
  const payload = expectObject(input);
  const query = payload.query;
  if (typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Expected non-empty "query" string');
  }
  return { query };
}

export function parseCreateNoteInput(input: unknown): CreateNoteInput {
  const payload = expectObject(input);
  const text = payload.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Expected non-empty "text" string');
  }
  return { text };
}
