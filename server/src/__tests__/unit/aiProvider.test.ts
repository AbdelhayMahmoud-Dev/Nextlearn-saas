import { describe, it, expect } from 'vitest';
import { localProvider } from '../../services/ai/providers/local.provider';

describe('local AI provider', () => {
  it('is always ready', () => {
    expect(localProvider.isReady()).toBe(true);
  });

  it('grounds answers in the provided system context', async () => {
    const result = await localProvider.complete({
      system: 'Photosynthesis converts sunlight into chemical energy. Chlorophyll absorbs light.',
      messages: [{ role: 'user', content: 'What does chlorophyll do?' }],
    });
    expect(result.provider).toBe('local');
    expect(result.text.toLowerCase()).toContain('chlorophyll');
  });

  it('summarizes when asked', async () => {
    const result = await localProvider.complete({
      system:
        'A binary search halves the search space each step. It requires a sorted array. ' +
        'Its time complexity is logarithmic. It is far faster than a linear scan on large inputs.',
      messages: [{ role: 'user', content: 'Give me a summary of the key points.' }],
    });
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('responds helpfully when no context is supplied', async () => {
    const result = await localProvider.complete({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.text.length).toBeGreaterThan(0);
  });
});
