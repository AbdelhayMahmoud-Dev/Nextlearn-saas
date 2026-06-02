import { env } from '../../../config/env';
import {
  AIProvider,
  AIProviderError,
  CompletionRequest,
  CompletionResult,
} from '../ai.types';

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

/** OpenAI Chat Completions provider (REST, no SDK dependency). */
export const openAIProvider: AIProvider = {
  name: 'openai',

  isReady(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  },

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (!env.OPENAI_API_KEY) throw new AIProviderError('OpenAI API key is not configured', 503);

    const messages = [
      ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
      ...request.messages,
    ];

    let res: globalThis.Response;
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL,
          messages,
          max_tokens: request.maxOutputTokens ?? env.AI_MAX_OUTPUT_TOKENS,
          temperature: request.temperature ?? env.AI_TEMPERATURE,
        }),
      });
    } catch (err) {
      throw new AIProviderError(
        `Failed to reach OpenAI: ${err instanceof Error ? err.message : 'network error'}`,
      );
    }

    const json = (await res.json().catch(() => ({}))) as OpenAIChatResponse;
    if (!res.ok) {
      throw new AIProviderError(json.error?.message ?? `OpenAI request failed (${res.status})`, 502);
    }

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new AIProviderError('OpenAI returned an empty response', 502);

    return {
      text,
      provider: 'openai',
      model: env.OPENAI_MODEL,
      usage: {
        inputTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
      },
    };
  },
};
