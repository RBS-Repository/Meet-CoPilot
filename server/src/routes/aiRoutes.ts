import { Router } from 'express';
import { getGeminiService } from '../ai/GeminiService.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';
import {
  answerRequestSchema,
  rewriteRequestSchema,
} from '../middleware/validate.js';

const router = Router();

router.post('/answer', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = answerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const answer = await getGeminiService().generateAnswer(parsed.data);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

router.post('/answer/stream', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = answerRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      for await (const chunk of getGeminiService().generateAnswerStream(parsed.data, controller.signal)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamErr) {
      if (!controller.signal.aborted) {
        res.write(`data: ${JSON.stringify({ error: streamErr instanceof Error ? streamErr.message : 'Stream error' })}\n\n`);
        res.end();
      }
    }
  } catch (err) {
    next(err);
  }
});

router.post('/rewrite', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = rewriteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    const answer = await getGeminiService().rewriteAnswer(parsed.data);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

router.post('/rewrite/stream', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = rewriteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      for await (const chunk of getGeminiService().rewriteAnswerStream(parsed.data, controller.signal)) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamErr) {
      if (!controller.signal.aborted) {
        res.write(`data: ${JSON.stringify({ error: streamErr instanceof Error ? streamErr.message : 'Stream error' })}\n\n`);
        res.end();
      }
    }
  } catch (err) {
    next(err);
  }
});

export default router;

