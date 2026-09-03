import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Server Error]', err.message);

  if (err.name === 'AbortError' || err.message.includes('aborted')) {
    res.status(504).json({ error: 'Request timed out. Please try again.' });
    return;
  }

  if (err.message.includes('API key')) {
    res.status(500).json({ error: 'AI service is not configured.' });
    return;
  }

  if (err.message.includes('429') || err.message.includes('rate')) {
    res.status(429).json({ error: 'Rate limit reached. Please wait a moment.' });
    return;
  }

  res.status(500).json({ error: 'Unable to generate response.' });
}
