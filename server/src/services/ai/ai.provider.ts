import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AIProvider, AIProviderName } from './ai.types';
import { openAIProvider } from './providers/openai.provider';
import { anthropicProvider } from './providers/anthropic.provider';
import { localProvider } from './providers/local.provider';

const REGISTRY: Record<AIProviderName, AIProvider> = {
  openai: openAIProvider,
  anthropic: anthropicProvider,
  local: localProvider,
};

/**
 * Resolves the active AI provider. Honors `AI_PROVIDER`, but transparently
 * falls back to the always-ready local provider when the selected hosted
 * provider has no API key — so the feature never hard-fails on missing creds.
 */
export function getAIProvider(): AIProvider {
  const selected = REGISTRY[env.AI_PROVIDER];
  if (selected.isReady()) return selected;

  if (env.AI_PROVIDER !== 'local') {
    logger.warn(
      { provider: env.AI_PROVIDER },
      'Selected AI provider is not configured; falling back to local provider',
    );
  }
  return localProvider;
}

/** Reports which provider is active and whether hosted providers are configured. */
export function getAIStatus(): {
  active: AIProviderName;
  configured: Record<AIProviderName, boolean>;
} {
  return {
    active: getAIProvider().name,
    configured: {
      openai: openAIProvider.isReady(),
      anthropic: anthropicProvider.isReady(),
      local: true,
    },
  };
}
