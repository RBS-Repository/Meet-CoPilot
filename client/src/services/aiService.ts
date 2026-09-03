const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

import type {
  AnswerStyle,
  ConversationItem,
  RewriteMode,
  UserContext,
} from '../types';

interface AnswerPayload {
  question: string;
  context: UserContext;
  conversation: ConversationItem[];
  answerStyle: AnswerStyle;
}

interface RewritePayload extends AnswerPayload {
  currentAnswer: string;
  mode: RewriteMode;
}

async function post<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? 'Unable to generate response');
  }

  return data as T;
}

async function streamPost(
  endpoint: string,
  body: unknown,
  onChunk: (accumulated: string, delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? 'Unable to generate response');
  }

  if (!response.body) {
    throw new Error('No response stream received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') break;

        let parsed: any = null;
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          // ignore partial JSON parse errors
          continue;
        }

        if (parsed?.error) {
          throw new Error(parsed.error);
        }

        if (parsed?.text) {
          accumulated += parsed.text;
          onChunk(accumulated, parsed.text);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return accumulated;
}

export async function fetchAnswer(
  payload: AnswerPayload,
  signal?: AbortSignal
): Promise<string> {
  const data = await post<{ answer: string }>('/api/ai/answer', payload, signal);
  return data.answer;
}

export async function streamAnswer(
  payload: AnswerPayload,
  onChunk: (accumulated: string, delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return streamPost('/api/ai/answer/stream', payload, onChunk, signal);
}

export async function fetchRewrite(
  payload: RewritePayload,
  signal?: AbortSignal
): Promise<string> {
  const data = await post<{ answer: string }>('/api/ai/rewrite', payload, signal);
  return data.answer;
}

export async function streamRewrite(
  payload: RewritePayload,
  onChunk: (accumulated: string, delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return streamPost('/api/ai/rewrite/stream', payload, onChunk, signal);
}

