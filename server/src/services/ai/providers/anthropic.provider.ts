import { env } from '../../../config/env';
import {
  AIProvider,
  AIProviderError,
  CompletionRequest,
  CompletionResult,
} from '../ai.types';

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}

/** Anthropic Messages API provider (REST, no SDK dependency). */
export const anthropicProvider: AIProvider = {
  name: 'anthropic',

  isReady(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY);
  },

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new AIProviderError('Anthropic API key is not configured', 503);
    }

    // Anthropic requires alternating user/assistant turns and a separate system field.
    const messages = request.messages.map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

    let res: globalThis.Response;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.ANTHROPIC_MODEL,
          max_tokens: request.maxOutputTokens ?? env.AI_MAX_OUTPUT_TOKENS,
          temperature: request.temperature ?? env.AI_TEMPERATURE,
          ...(request.system ? { system: request.system } : {}),
          messages,
        }),
      });
    } catch (err) {
      throw new AIProviderError(
        `Failed to reach Anthropic: ${err instanceof Error ? err.message : 'network error'}`,
      );
    }

    const json = (await res.json().catch(() => ({}))) as AnthropicResponse;
    if (!res.ok) {
      throw new AIProviderError(
        json.error?.message ?? `Anthropic request failed (${res.status})`,
        502,
      );
    }

    const text = json.content
      ?.filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('')
      .trim();
    if (!text) throw new AIProviderError('Anthropic returned an empty response', 502);

    return {
      text,
      provider: 'anthropic',
      model: env.ANTHROPIC_MODEL,
      usage: {
        inputTokens: json.usage?.input_tokens,
        outputTokens: json.usage?.output_tokens,
      },
    };
  },
};
