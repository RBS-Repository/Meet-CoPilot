import { GoogleGenAI, Modality } from '@google/genai';
import type { TranscriptMessage } from './types.js';

const TRANSCRIBE_MODEL =
  process.env.GEMINI_TRANSCRIBE_MODEL ?? 'gemini-3.5-transcribe-live';

export class GeminiLiveTranscriptionService {
  private client: GoogleGenAI;
  private session: Awaited<
    ReturnType<GoogleGenAI['live']['connect']>
  > | null = null;
  private receiveTask: Promise<void> | null = null;
  private onTranscript: ((msg: TranscriptMessage) => void) | null = null;
  private closed = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async start(onTranscript: (msg: TranscriptMessage) => void): Promise<void> {
    this.onTranscript = onTranscript;
    this.closed = false;

    console.log(`[Transcription] Connecting to Gemini Live with model: ${TRANSCRIBE_MODEL}`);

    this.session = await this.client.live.connect({
      model: TRANSCRIBE_MODEL,
      config: {
        responseModalities: [Modality.TEXT],
        inputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log('[Transcription] Gemini Live session connected successfully');
        },
        onmessage: (message) => {
          if (!this.onTranscript) return;

          const content = message.serverContent;

          // Check inputTranscription
          if (content?.inputTranscription?.text) {
            const isFinished = content.inputTranscription.finished ?? true;
            console.log(`[Transcription] Got input transcription (${isFinished ? 'final' : 'interim'}):`, content.inputTranscription.text);
            this.onTranscript({
              type: isFinished ? 'final' : 'interim',
              text: content.inputTranscription.text,
            });
            return;
          }

          // Check modelTurn or message.text
          const text = message.text || content?.modelTurn?.parts?.map((p: any) => p.text).filter(Boolean).join('');
          if (text) {
            console.log('[Transcription] Got text response:', text);
            this.onTranscript({
              type: 'final',
              text,
            });
          }
        },
        onerror: (error) => {
          if (!this.closed && this.onTranscript) {
            console.error('[Transcription] Gemini Live error:', error);
            this.onTranscript({
              type: 'error',
              text: error?.message ?? 'Transcription error',
            });
          }
        },
        onclose: (event: any) => {
          if (!this.closed) {
            console.log(`[Transcription] Gemini Live session closed. Code: ${event?.code}, Reason: ${event?.reason}`);
          }
        },
      },
    });
  }

  sendAudio(pcmBuffer: Buffer): void {
    if (!this.session || this.closed) return;

    this.session.sendRealtimeInput({
      audio: {
        data: pcmBuffer.toString('base64'),
        mimeType: 'audio/pcm;rate=16000',
      },
    });
  }

  async stop(): Promise<void> {
    this.closed = true;
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    if (this.receiveTask) {
      await this.receiveTask.catch(() => undefined);
      this.receiveTask = null;
    }
    this.onTranscript = null;
  }
}
