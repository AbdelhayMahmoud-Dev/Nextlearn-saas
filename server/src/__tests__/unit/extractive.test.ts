import { describe, it, expect } from 'vitest';
import {
  answerFromContext,
  keywords,
  stripHtml,
  summarizeText,
} from '../../services/ai/extractive';
import { renderTemplateString } from '../../services/whiteLabel.service';

describe('extractive NLP', () => {
  const article =
    'TypeScript adds static types to JavaScript. Types catch bugs at compile time. ' +
    'Interfaces describe the shape of objects. Generics make code reusable across types. ' +
    'The compiler erases types when emitting JavaScript.';

  it('stripHtml removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world');
  });

  it('summarizeText returns at most the requested number of sentences', () => {
    const summary = summarizeText(article, 2);
    expect(summary.length).toBeGreaterThan(0);
    const sentenceCount = summary.split(/[.!?]/).filter((s) => s.trim()).length;
    expect(sentenceCount).toBeLessThanOrEqual(2);
  });

  it('summarizeText returns the original when it is already short', () => {
    const short = 'One sentence only.';
    expect(summarizeText(short, 4)).toBe(short);
  });

  it('answerFromContext surfaces the relevant sentence', () => {
    const answer = answerFromContext(article, 'What are generics for?', 1);
    expect(answer.toLowerCase()).toContain('generics');
  });

  it('answerFromContext falls back to a summary when nothing overlaps', () => {
    const answer = answerFromContext(article, 'zzz qqq', 2);
    expect(answer.length).toBeGreaterThan(0);
  });

  it('keywords returns salient terms', () => {
    const kw = keywords(article, 5);
    expect(kw).toContain('types');
    expect(kw.length).toBeLessThanOrEqual(5);
  });
});

describe('renderTemplateString', () => {
  it('substitutes known variables and blanks unknown ones', () => {
    expect(renderTemplateString('Hi {{name}} at {{org}}', { name: 'Sam', org: 'Acme' })).toBe(
      'Hi Sam at Acme',
    );
    expect(renderTemplateString('Hi {{missing}}!', {})).toBe('Hi !');
  });
});
