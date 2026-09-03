export type AnswerStyle =
  | 'natural'
  | 'concise'
  | 'professional'
  | 'technical'
  | 'detailed';

export type RewriteMode =
  | 'regenerate'
  | 'shorter'
  | 'more_natural'
  | 'more_technical';

export type AudioSource = 'loopback' | 'microphone';

export type FontSize = 'sm' | 'md' | 'lg';

export interface CaptureSource {
  id: string;
  name: string;
  type: 'screen' | 'window';
}

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export interface UserContext {
  role: string;
  knowledge: string;
  instructions: string;
}

export interface ConversationItem {
  question: string;
  answer: string;
}

export interface DetectedQuestion {
  question: string;
  confidence: number;
}

export interface AppearanceSettings {
  theme: 'dark';
  opacity: number;
  fontSize: FontSize;
}

export interface ElectronAPI {
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  setAlwaysOnTop: (value: boolean) => Promise<void>;
  getAlwaysOnTop: () => Promise<boolean>;
  toggleAlwaysOnTop: () => Promise<boolean>;
  setOpacity: (value: number) => Promise<number>;
  enableLoopbackAudio: () => Promise<void>;
  disableLoopbackAudio: () => Promise<void>;
  isElectron: () => Promise<boolean>;
  getCaptureSources: () => Promise<CaptureSource[]>;
  setCaptureSourceId: (sourceId: string | null) => Promise<void>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
