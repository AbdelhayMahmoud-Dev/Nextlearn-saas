import { AIProvider, CompletionRequest, CompletionResult } from '../ai.types';
import { answerFromContext, summarizeText } from '../extractive';

/**
 * Offline provider. Grounds its reply in the supplied system context using
 * extractive QA/summarization, so the assistant is genuinely useful without any
 * external API key. Always ready.
 */
export const localProvider: AIProvider = {
  name: 'local',

  isReady(): boolean {
    return true;
  },

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const lastUser = [...request.messages].reverse().find((m) => m.role === 'user');
    const question = lastUser?.content ?? '';
    const context = request.system ?? '';

    let text: string;
    if (!context.trim()) {
      text =
        'I can help with the material in this course. Open a lesson or ask about a ' +
        'specific topic and I will answer using its content.';
    } else if (/summar|overview|recap|tl;dr|key points?/i.test(question)) {
      text = summarizeText(context, 5);
    } else {
      const answer = answerFromContext(context, question, 3);
      text = answer
        ? answer
        : "I couldn't find that in the current material. Try rephrasing, or ask about a topic covered in this lesson.";
    }

    return { text, provider: 'local', model: 'extractive-v1' };
  },
};
