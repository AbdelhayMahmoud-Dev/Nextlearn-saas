import { ZodError } from 'zod';

const REQUEST_PARTS = new Set(['body', 'query', 'params']);

/**
 * Converts a ZodError into a flat `{ field: messages[] }` map keyed by the
 * actual field name. The leading request-part segment (`body`/`query`/`params`)
 * is stripped so clients receive `{ password: [...] }` rather than
 * `{ body: [...] }`. Issues with no path are grouped under `_root`.
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path =
      issue.path.length > 0 && REQUEST_PARTS.has(String(issue.path[0]))
        ? issue.path.slice(1)
        : issue.path;
    const key = path.length > 0 ? path.join('.') : '_root';
    (fieldErrors[key] ??= []).push(issue.message);
  }

  return fieldErrors;
}
