import type { Server } from 'http';
import { WebSocketServer, type WebSocket } from 'ws';
import { GeminiLiveTranscriptionService } from '../ai/GeminiLiveTranscriptionService.js';

export function setupTranscriptionWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/api/transcription/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let transcriptionService: GeminiLiveTranscriptionService | null = null;

    const cleanup = async () => {
      if (transcriptionService) {
        await transcriptionService.stop().catch(() => undefined);
        transcriptionService = null;
      }
    };

    ws.on('message', async (data, isBinary) => {
      if (!isBinary && data.toString() === 'start') {
        try {
          transcriptionService = new GeminiLiveTranscriptionService();
          await transcriptionService.start((msg) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify(msg));
            }
          });
          ws.send(JSON.stringify({ type: 'ready' }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to start transcription';
          ws.send(JSON.stringify({ type: 'error', text: message }));
        }
        return;
      }

      if (!isBinary && data.toString() === 'stop') {
        await cleanup();
        ws.send(JSON.stringify({ type: 'stopped' }));
        return;
      }

      if (isBinary && transcriptionService) {
        transcriptionService.sendAudio(Buffer.from(data as Buffer));
      }
    });

    ws.on('close', () => {
      cleanup().catch(() => undefined);
    });

    ws.on('error', () => {
      cleanup().catch(() => undefined);
    });
  });
}
