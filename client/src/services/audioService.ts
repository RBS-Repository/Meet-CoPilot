import type { AudioInputDevice, CaptureSource } from '../types';

export interface AudioCaptureProvider {
  start(): Promise<MediaStream>;
  stop(): Promise<void>;
}

class LoopbackAudioProvider implements AudioCaptureProvider {
  private stream: MediaStream | null = null;
  private captureSourceId: string | null = null;

  setCaptureSourceId(sourceId: string | null): void {
    this.captureSourceId = sourceId;
  }

  async start(): Promise<MediaStream> {
    let sourceId = this.captureSourceId;

    if (!sourceId && window.electron?.getCaptureSources) {
      const sources = await window.electron.getCaptureSources();
      const screenSource = sources.find((s) => s.type === 'screen') ?? sources[0];
      if (screenSource) {
        sourceId = screenSource.id;
        this.captureSourceId = sourceId;
      }
    }

    if (window.electron?.setCaptureSourceId) {
      await window.electron.setCaptureSourceId(sourceId);
    }

    if (window.electron?.enableLoopbackAudio) {
      await window.electron.enableLoopbackAudio();
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      if (window.electron?.disableLoopbackAudio) {
        await window.electron.disableLoopbackAudio();
      }

      // Stop unused video tracks to save CPU/GPU resources
      stream.getVideoTracks().forEach((track) => {
        track.stop();
        stream.removeTrack(track);
      });

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('No system audio captured. Please select Entire Screen for loopback audio.');
      }

      this.stream = stream;
      return stream;
    } catch (err) {
      if (window.electron?.disableLoopbackAudio) {
        await window.electron.disableLoopbackAudio();
      }
      throw err;
    }
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

class MicrophoneAudioProvider implements AudioCaptureProvider {
  private stream: MediaStream | null = null;
  private deviceId: string | null = null;

  setDeviceId(deviceId: string | null): void {
    this.deviceId = deviceId;
  }

  async start(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: this.deviceId
        ? { deviceId: { exact: this.deviceId } }
        : true,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.stream;
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}

const loopbackProvider = new LoopbackAudioProvider();
const microphoneProvider = new MicrophoneAudioProvider();

const providers: Record<'loopback' | 'microphone', AudioCaptureProvider> = {
  loopback: loopbackProvider,
  microphone: microphoneProvider,
};

export function getAudioProvider(source: 'loopback' | 'microphone'): AudioCaptureProvider {
  return providers[source];
}

export function configureAudioProvider(
  source: 'loopback' | 'microphone',
  options: { captureSourceId?: string | null; microphoneDeviceId?: string | null }
): void {
  if (source === 'loopback') {
    loopbackProvider.setCaptureSourceId(options.captureSourceId ?? null);
  } else {
    microphoneProvider.setDeviceId(options.microphoneDeviceId ?? null);
  }
}

export async function listCaptureSources(): Promise<CaptureSource[]> {
  if (window.electron?.getCaptureSources) {
    return window.electron.getCaptureSources();
  }
  return [];
}

export async function listMicrophoneDevices(): Promise<AudioInputDevice[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === 'audioinput')
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
    }));
}

const TARGET_SAMPLE_RATE = 16000;

export class PcmAudioProcessor {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private onChunk: ((pcm: ArrayBuffer) => void) | null = null;
  private onVolume: ((volume: number) => void) | null = null;

  start(
    stream: MediaStream,
    onChunk: (pcm: ArrayBuffer) => void,
    onVolume?: (volume: number) => void
  ): void {
    this.onChunk = onChunk;
    this.onVolume = onVolume ?? null;
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(stream);

    const bufferSize = 4096;
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    // Muted gain node prevents feedback loop to speakers while keeping ScriptProcessor alive
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;

    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      
      // Calculate RMS for visual audio meter
      if (this.onVolume) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);
        const volume = Math.min(1, Math.round(rms * 100) / 10);
        this.onVolume(volume);
      }

      const resampled = resampleTo16k(input, this.audioContext!.sampleRate);
      const pcm = floatTo16BitPCM(resampled);
      this.onChunk?.(pcm.buffer as ArrayBuffer);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  stop(): void {
    this.gainNode?.disconnect();
    this.processor?.disconnect();
    this.source?.disconnect();
    this.audioContext?.close().catch(() => undefined);
    this.gainNode = null;
    this.processor = null;
    this.source = null;
    this.audioContext = null;
    this.onChunk = null;
    this.onVolume = null;
  }
}

function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;

  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    output[i] = input[srcIndex] ?? 0;
  }

  return output;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
