import { GoogleGenAI } from '@google/genai';
import {
  buildRewritePrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from './PromptBuilder.js';
import type {
  AnswerRequest,
  ConversationItem,
  RewriteRequest,
} from './types.js';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];
const TIMEOUT_MS = 15_000;

function trimConversation(conversation: ConversationItem[]): ConversationItem[] {
  return conversation.slice(-4);
}

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateAnswer(request: AnswerRequest): Promise<string> {
    const conversation = trimConversation(request.conversation);
    const userPrompt = buildUserPrompt(
      request.question,
      request.context,
      conversation,
      request.answerStyle
    );

    return this.generate(buildSystemPrompt(), userPrompt);
  }

  async *generateAnswerStream(request: AnswerRequest, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const conversation = trimConversation(request.conversation);
    const userPrompt = buildUserPrompt(
      request.question,
      request.context,
      conversation,
      request.answerStyle
    );

    let lastError: unknown = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: buildSystemPrompt(),
            abortSignal: signal,
          },
        });

        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
        return; // Success!
      } catch (err) {
        lastError = err;
        console.warn(`[AI Service] Model ${model} failed, trying fallback model...`, err instanceof Error ? err.message : err);
      }
    }
    throw lastError ?? new Error('All Gemini model candidates failed');
  }

  async rewriteAnswer(request: RewriteRequest): Promise<string> {
    const conversation = trimConversation(request.conversation);
    const userPrompt = buildRewritePrompt(
      request.question,
      request.currentAnswer,
      request.mode,
      request.context,
      conversation,
      request.answerStyle
    );

    return this.generate(buildSystemPrompt(), userPrompt);
  }

  async *rewriteAnswerStream(request: RewriteRequest, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const conversation = trimConversation(request.conversation);
    const userPrompt = buildRewritePrompt(
      request.question,
      request.currentAnswer,
      request.mode,
      request.context,
      conversation,
      request.answerStyle
    );

    let lastError: unknown = null;
    for (const model of CANDIDATE_MODELS) {
      try {
        const stream = await this.client.models.generateContentStream({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: buildSystemPrompt(),
            abortSignal: signal,
          },
        });

        for await (const chunk of stream) {
          if (chunk.text) {
            yield chunk.text;
          }
        }
        return; // Success!
      } catch (err) {
        lastError = err;
        console.warn(`[AI Service] Rewrite with model ${model} failed, trying fallback...`, err instanceof Error ? err.message : err);
      }
    }
    throw lastError ?? new Error('All Gemini rewrite model candidates failed');
  }

  private async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let lastError: unknown = null;
    try {
      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await this.client.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              abortSignal: controller.signal,
            },
          });

          const text = response.text?.trim();
          if (text) {
            return text;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[AI Service] Non-streaming model ${model} failed, trying fallback...`);
        }
      }
      throw lastError ?? new Error('Empty response from all Gemini models');
    } finally {
      clearTimeout(timeout);
    }
  }
}

let instance: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!instance) {
    instance = new GeminiService();
  }
  return instance;
}
