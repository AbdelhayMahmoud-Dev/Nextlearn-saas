/** Provider-agnostic contracts for the AI Learning Assistant. */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionRequest {
  /** Conversation so far (excluding the system prompt). */
  messages: ChatMessage[];
  /** Optional system prompt; providers map this to their native field. */
  system?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  /** The assistant's text reply. */
  text: string;
  /** Identifier of the provider that produced the reply. */
  provider: AIProviderName;
  /** Model used, when known. */
  model: string;
  /** Token usage, when reported by the provider. */
  usage?: { inputTokens?: number; outputTokens?: number };
}

export type AIProviderName = 'openai' | 'anthropic' | 'local';

/** A pluggable chat-completion backend. */
export interface AIProvider {
  readonly name: AIProviderName;
  /** Whether this provider is usable (e.g. has a configured API key). */
  isReady(): boolean;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

/** Thrown when a hosted provider call fails; carries an HTTP-ish status. */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
