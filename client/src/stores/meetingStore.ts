import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AnswerStyle,
  AppearanceSettings,
  AudioSource,
  ConversationItem,
  UserContext,
} from '../types';

const DEFAULT_INSTRUCTIONS = `Answer naturally as if I am speaking.

Keep answers concise and conversational.

Use my actual experience when relevant.

Never invent experience, projects, technologies, companies, or accomplishments that I did not provide.

For technical questions, give technically accurate answers with practical examples.

Avoid sounding like an AI-generated response.`;

export type CopilotStatus = 'idle' | 'listening' | 'analyzing' | 'generating' | 'ready';

interface MeetingState {
  isListening: boolean;
  isGenerating: boolean;
  copilotStatus: CopilotStatus;
  audioLevel: number;
  isAlwaysOnTop: boolean;
  currentTranscript: string;
  currentQuestion: string | null;
  currentAnswer: string | null;
  conversation: ConversationItem[];
  userContext: UserContext;
  answerStyle: AnswerStyle;
  appearance: AppearanceSettings;
  audioSource: AudioSource;
  selectedCaptureSourceId: string | null;
  selectedMicrophoneDeviceId: string | null;
  error: string | null;
  showSettings: boolean;
  showContext: boolean;

  setListening: (value: boolean) => void;
  setGenerating: (value: boolean) => void;
  setCopilotStatus: (status: CopilotStatus) => void;
  setAudioLevel: (level: number) => void;
  setIsAlwaysOnTop: (value: boolean) => void;
  setTranscript: (text: string) => void;
  setQuestion: (question: string | null) => void;
  setAnswer: (answer: string | null) => void;
  addConversation: (item: ConversationItem) => void;
  clearConversation: () => void;
  setUserContext: (context: Partial<UserContext>) => void;
  setAnswerStyle: (style: AnswerStyle) => void;
  setAppearance: (appearance: Partial<AppearanceSettings>) => void;
  setAudioSource: (source: AudioSource) => void;
  setSelectedCaptureSourceId: (id: string | null) => void;
  setSelectedMicrophoneDeviceId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setShowSettings: (show: boolean) => void;
  setShowContext: (show: boolean) => void;
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set) => ({
      isListening: false,
      isGenerating: false,
      copilotStatus: 'idle',
      audioLevel: 0,
      isAlwaysOnTop: true,
      currentTranscript: '',
      currentQuestion: null,
      currentAnswer: null,
      conversation: [],
      userContext: {
        role: '',
        knowledge: '',
        instructions: DEFAULT_INSTRUCTIONS,
      },
      answerStyle: 'natural',
      appearance: {
        theme: 'dark',
        opacity: 0.95,
        fontSize: 'sm',
      },
      audioSource: 'loopback',
      selectedCaptureSourceId: null,
      selectedMicrophoneDeviceId: null,
      error: null,
      showSettings: false,
      showContext: false,

      setListening: (value) => set({ isListening: value, copilotStatus: value ? 'listening' : 'idle' }),
      setGenerating: (value) => set({ isGenerating: value }),
      setCopilotStatus: (status) => set({ copilotStatus: status }),
      setAudioLevel: (level) => set({ audioLevel: level }),
      setIsAlwaysOnTop: (value) => set({ isAlwaysOnTop: value }),
      setTranscript: (text) => set({ currentTranscript: text }),
      setQuestion: (question) => set({ currentQuestion: question }),
      setAnswer: (answer) => set({ currentAnswer: answer }),
      addConversation: (item) =>
        set((state) => ({
          conversation: [...state.conversation, item].slice(-20),
        })),
      clearConversation: () =>
        set({
          conversation: [],
          currentQuestion: null,
          currentAnswer: null,
          currentTranscript: '',
          audioLevel: 0,
        }),
      setUserContext: (context) =>
        set((state) => ({
          userContext: { ...state.userContext, ...context },
        })),
      setAnswerStyle: (style) => set({ answerStyle: style }),
      setAppearance: (appearance) => {
        if (typeof appearance.opacity === 'number' && window.electron?.setOpacity) {
          window.electron.setOpacity(appearance.opacity);
        }
        set((state) => ({
          appearance: { ...state.appearance, ...appearance },
        }));
      },
      setAudioSource: (source) => set({ audioSource: source }),
      setSelectedCaptureSourceId: (id) => set({ selectedCaptureSourceId: id }),
      setSelectedMicrophoneDeviceId: (id) => set({ selectedMicrophoneDeviceId: id }),
      setError: (error) => set({ error }),
      setShowSettings: (show) => set({ showSettings: show }),
      setShowContext: (show) => set({ showContext: show }),
    }),
    {
      name: 'meeting-copilot-storage',
      partialize: (state) => ({
        userContext: state.userContext,
        answerStyle: state.answerStyle,
        appearance: state.appearance,
        audioSource: state.audioSource,
        selectedCaptureSourceId: state.selectedCaptureSourceId,
        selectedMicrophoneDeviceId: state.selectedMicrophoneDeviceId,
        isAlwaysOnTop: state.isAlwaysOnTop,
      }),
    }
  )
);
