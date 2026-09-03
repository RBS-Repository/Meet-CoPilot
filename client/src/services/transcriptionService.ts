const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:5000';

export interface TranscriptionProvider {
  start(onAudioChunk: (chunk: ArrayBuffer) => void): Promise<void>;
  stop(): Promise<void>;
  onTranscript(callback: (text: string, isFinal: boolean) => void): void;
  onError?(callback: (error: string) => void): void;
}

export class GeminiWebSocketTranscriptionProvider implements TranscriptionProvider {
  private ws: WebSocket | null = null;
  private transcriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private ready = false;

  onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  async start(_onAudioChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${WS_URL}/api/transcription/ws`);

      this.ws.onopen = () => {
        this.ws?.send('start');
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'ready') {
              this.ready = true;
              resolve();
              return;
            }

            if (msg.type === 'interim' || msg.type === 'final') {
              this.transcriptCallback?.(msg.text, msg.type === 'final');
              return;
            }

            if (msg.type === 'error') {
              this.errorCallback?.(msg.text ?? 'Transcription error');
              if (!this.ready) {
                reject(new Error(msg.text ?? 'Transcription failed'));
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      };

      this.ws.onerror = () => {
        const errMsg = 'Transcription server connection failed';
        this.errorCallback?.(errMsg);
        if (!this.ready) {
          reject(new Error(errMsg));
        }
      };

      this.ws.onclose = () => {
        this.ready = false;
      };
    });
  }

  sendAudio(chunk: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.ready) {
      this.ws.send(chunk);
    }
  }

  async stop(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send('stop');
      this.ws.close();
    }
    this.ws = null;
    this.ready = false;
  }
}

export function createTranscriptionProvider(): GeminiWebSocketTranscriptionProvider {
  return new GeminiWebSocketTranscriptionProvider();
}
