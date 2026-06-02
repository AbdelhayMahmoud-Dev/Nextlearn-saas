import createDOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import { Request, Response, NextFunction } from 'express';

// JSDOM's DOMWindow satisfies the minimal DOMPurify WindowLike interface at runtime.
// The cast through Parameters<> avoids the structural mismatch with the full DOM Window type.
const DOMPurify = createDOMPurify(
  new JSDOM('').window as unknown as Parameters<typeof createDOMPurify>[0],
);

/**
 * Tiptap-safe HTML tags.
 * This list deliberately excludes script, iframe, object, embed, and
 * any other potentially dangerous elements while keeping everything
 * that Tiptap's editor can produce in lesson content.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'mark', 'span', 'div', 'hr',
  // KaTeX math rendering elements:
  'math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn',
  'msup', 'msub', 'mfrac', 'mspace', 'mtext',
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'target', 'rel', 'colspan', 'rowspan',
  // Tiptap extension attributes:
  'data-type', 'data-language', 'data-syntax',
];

/**
 * Middleware: sanitizes `req.body.content.article` with a Tiptap-safe allow-list.
 *
 * **Apply ONLY on lesson create/update routes — NOT globally.**
 *
 * This resolves Phase 1 T8 tracked debt: the global XSS sanitizer in
 * `security.ts` strips ALL HTML from body strings, which conflicts with
 * Tiptap-generated lesson HTML that must be preserved. This per-route
 * middleware replaces the blanket strip for the lesson content field only,
 * while preserving the global sanitizer for all other fields.
 */
export function sanitizeRichText(req: Request, _res: Response, next: NextFunction): void {
  if (typeof req.body?.content?.article === 'string') {
    req.body.content.article = DOMPurify.sanitize(req.body.content.article, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORCE_BODY: true,
      ALLOW_DATA_ATTR: false,
    });
  }
  next();
}
