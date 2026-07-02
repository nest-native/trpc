/**
 * In-memory sink for the `onError` hook so the smoke test can assert
 * that server-side error reporting fired. A real application would
 * forward these to its logger or error tracker instead.
 */
export const reportedErrors: Array<{ path?: string; code: string }> = [];
