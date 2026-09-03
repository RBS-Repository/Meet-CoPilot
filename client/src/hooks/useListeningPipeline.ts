import { useCallback, useRef } from 'react';
import { streamAnswer } from '../services/aiService';
import {
  configureAudioProvider,
  getAudioProvider,
  PcmAudioProcessor,
} from '../services/audioService';
import { questionDetector } from '../services/questionDetector';
import { createTranscriptionProvider } from '../services/transcriptionService';
import { useMeetingStore } from '../stores/meetingStore';

export function useListeningPipeline() {
  const abortRef = useRef<AbortController | null>(null);
  const pcmProcessorRef = useRef<PcmAudioProcessor | null>(null);
  const transcriptionRef = useRef<ReturnType<typeof createTranscriptionProvider> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBufferRef = useRef<string>('');

  const {
    audioSource,
    selectedCaptureSourceId,
    selectedMicrophoneDeviceId,
    userContext,
    answerStyle,
    conversation,
    setListening,
    setTranscript,
    setQuestion,
    setAnswer,
    setGenerating,
    setCopilotStatus,
    setAudioLevel,
    setError,
    addConversation,
  } = useMeetingStore();

  const generateAnswer = useCallback(
    async (question: string) => {
      if (!question || !question.trim()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Archive previous completed turn into history before starting new question
      const { currentQuestion: prevQ, currentAnswer: prevA } = useMeetingStore.getState();
      if (prevQ && prevA && prevQ !== question.trim()) {
        addConversation({ question: prevQ, answer: prevA });
      }

      setGenerating(true);
      setCopilotStatus('generating');
      setError(null);
      setQuestion(question.trim());
      // Clear answer to stream words onto screen in real-time
      setAnswer('');

      try {
        const finalAnswer = await streamAnswer(
          {
            question: question.trim(),
            context: userContext,
            conversation,
            answerStyle,
          },
          (accumulated) => {
            if (!controller.signal.aborted) {
              setAnswer(accumulated);
            }
          },
          controller.signal
        );

        if (!controller.signal.aborted) {
          if (finalAnswer && finalAnswer.trim()) {
            setAnswer(finalAnswer);
            setCopilotStatus('ready');
          } else {
            setError('No answer generated from AI. Please click Retry.');
            setCopilotStatus('listening');
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          setCopilotStatus('listening');
        }
      } finally {
        if (!controller.signal.aborted) {
          setGenerating(false);
        }
      }
    },
    [userContext, conversation, answerStyle, setGenerating, setCopilotStatus, setError, setQuestion, setAnswer, addConversation]
  );

  const startListening = useCallback(async () => {
    try {
      setError(null);
      transcriptBufferRef.current = '';

      configureAudioProvider(audioSource, {
        captureSourceId: selectedCaptureSourceId,
        microphoneDeviceId: selectedMicrophoneDeviceId,
      });

      const provider = getAudioProvider(audioSource);
      const stream = await provider.start();

      const transcription = createTranscriptionProvider();
      transcriptionRef.current = transcription;

      transcription.onError?.((err) => {
        setError(err);
      });

      transcription.onTranscript((text, isFinal) => {
        if (!text) return;

        // Visual indicator that question speech is actively being analyzed
        setCopilotStatus('analyzing');

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
          if (isFinal) {
            transcriptBufferRef.current = transcriptBufferRef.current
              ? `${transcriptBufferRef.current} ${text}`.trim()
              : text;

            // Retain up to ~120 words to capture full scenario questions without loss
            const words = transcriptBufferRef.current.split(/\s+/);
            if (words.length > 120) {
              transcriptBufferRef.current = words.slice(-90).join(' ');
            }

            setTranscript(text);

            // Prioritize the full accumulated buffer to capture complete multi-part questions
            const detected =
              questionDetector.analyze(transcriptBufferRef.current, true) ||
              questionDetector.analyze(text, true);

            if (detected) {
              transcriptBufferRef.current = '';
              generateAnswer(detected.question);
            } else {
              setCopilotStatus('listening');
            }
          } else {
            setTranscript(text);

            const combined = transcriptBufferRef.current
              ? `${transcriptBufferRef.current} ${text}`
              : text;

            const detected =
              questionDetector.analyze(combined, false) ||
              questionDetector.analyze(text, false);

            if (detected) {
              transcriptBufferRef.current = '';
              generateAnswer(detected.question);
            }
          }
        }, isFinal ? 400 : 150);
      });

      const pcmProcessor = new PcmAudioProcessor();
      pcmProcessorRef.current = pcmProcessor;

      await transcription.start((chunk) => {
        transcription.sendAudio(chunk);
      });

      pcmProcessor.start(
        stream,
        (chunk) => {
          transcriptionRef.current?.sendAudio(chunk);
        },
        (volume) => {
          setAudioLevel(volume);
        }
      );

      setListening(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start listening';
      setError(message.includes('Permission') ? 'Audio permission denied' : message);
      setListening(false);
      setAudioLevel(0);
    }
  }, [
    audioSource,
    selectedCaptureSourceId,
    selectedMicrophoneDeviceId,
    setError,
    setListening,
    setTranscript,
    setAudioLevel,
    generateAnswer,
  ]);

  const stopListening = useCallback(async () => {
    pcmProcessorRef.current?.stop();
    pcmProcessorRef.current = null;

    await transcriptionRef.current?.stop();
    transcriptionRef.current = null;

    try {
      const provider = getAudioProvider(audioSource);
      await provider.stop();
    } catch {
      // stream may already be stopped
    }

    abortRef.current?.abort();
    setListening(false);
    setCopilotStatus('idle');
    setAudioLevel(0);
  }, [audioSource, setListening, setCopilotStatus, setAudioLevel]);

  const clearAndReset = useCallback(() => {
    transcriptBufferRef.current = '';
    questionDetector.reset();
    useMeetingStore.getState().clearConversation();
    useMeetingStore.getState().setCopilotStatus('idle');
  }, []);

  return { startListening, stopListening, clearAndReset, generateAnswer };
}
