export interface CreateTodoInput {
  title: string;
}

export function parseCreateTodoInput(input: unknown): CreateTodoInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Expected object input');
  }

  const title = (input as Record<string, unknown>).title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Expected non-empty "title" string');
  }

  return { title: title.trim() };
}
