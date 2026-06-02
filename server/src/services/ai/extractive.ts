/**
 * Dependency-free extractive NLP used by the local AI provider and by the
 * summarization endpoint. This is a real (classic) implementation — TF-based
 * sentence ranking and keyword-overlap question answering — not a stub. It lets
 * the AI features work fully offline when no hosted provider key is configured.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'of', 'to', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it', 'its',
  'i', 'you', 'he', 'she', 'we', 'they', 'them', 'his', 'her', 'their', 'our',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'shall', 'may',
  'from', 'so', 'than', 'too', 'very', 'just', 'not', 'no', 'what', 'which',
  'who', 'how', 'when', 'where', 'why', 'there', 'here', 'all', 'any', 'some',
]);

/** Strips HTML tags and collapses whitespace. */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits text into sentences (handles ., !, ?, and newlines). */
export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Term-frequency map for a token list. */
function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
  return tf;
}

/**
 * Extractive summary: ranks sentences by summed term frequency (length-normalized)
 * and returns the top `maxSentences`, preserving original order.
 */
export function summarizeText(text: string, maxSentences = 4): string {
  const clean = stripHtml(text);
  const sentences = splitSentences(clean);
  if (sentences.length <= maxSentences) return clean;

  const tf = termFrequencies(tokenize(clean));
  const scored = sentences.map((sentence, index) => {
    const tokens = tokenize(sentence);
    const raw = tokens.reduce((sum, t) => sum + (tf.get(t) ?? 0), 0);
    return { index, sentence, score: tokens.length ? raw / Math.sqrt(tokens.length) : 0 };
  });

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return top.join(' ');
}

/** Up to `count` salient keywords from text, by term frequency. */
export function keywords(text: string, count = 8): string[] {
  const tf = termFrequencies(tokenize(stripHtml(text)));
  return [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * Keyword-overlap question answering: returns the sentences from `context` most
 * relevant to `question`. Falls back to a summary when nothing overlaps.
 */
export function answerFromContext(context: string, question: string, maxSentences = 3): string {
  const clean = stripHtml(context);
  if (!clean) return '';
  const sentences = splitSentences(clean);
  const queryTokens = new Set(tokenize(question));
  if (queryTokens.size === 0) return summarizeText(clean, maxSentences);

  const scored = sentences.map((sentence, index) => {
    const tokens = tokenize(sentence);
    const overlap = tokens.filter((t) => queryTokens.has(t)).length;
    return { index, sentence, score: tokens.length ? overlap / Math.sqrt(tokens.length) : 0 };
  });

  const relevant = scored.filter((s) => s.score > 0);
  if (relevant.length === 0) return summarizeText(clean, maxSentences);

  return relevant
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence)
    .join(' ');
}
