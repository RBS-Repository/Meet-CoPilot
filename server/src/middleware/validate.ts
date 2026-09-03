import { z } from 'zod';

export const userContextSchema = z.object({
  role: z.string().max(500),
  knowledge: z.string().max(8000),
  instructions: z.string().max(4000),
});

export const conversationItemSchema = z.object({
  question: z.string().max(2000),
  answer: z.string().max(8000),
});

export const answerStyleSchema = z.enum([
  'natural',
  'concise',
  'professional',
  'technical',
  'detailed',
]);

export const answerRequestSchema = z.object({
  question: z.string().min(1).max(2000),
  context: userContextSchema,
  conversation: z.array(conversationItemSchema).max(10),
  answerStyle: answerStyleSchema,
});

export const rewriteModeSchema = z.enum([
  'regenerate',
  'shorter',
  'more_natural',
  'more_technical',
]);

export const rewriteRequestSchema = z.object({
  question: z.string().min(1).max(2000),
  currentAnswer: z.string().min(1).max(8000),
  mode: rewriteModeSchema,
  context: userContextSchema,
  conversation: z.array(conversationItemSchema).max(10),
  answerStyle: answerStyleSchema,
});
