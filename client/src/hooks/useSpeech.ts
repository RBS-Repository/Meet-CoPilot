import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      // Remove markdown bold/italic/code markers
      .replace(/[*_`#]/g, '')
      // Replace bullet marks with natural pauses
      .replace(/^[-*•]\s+/gm, '')
      // Remove number tags like "1." so it reads naturally
      .replace(/^\d+[\.\)]\s*/gm, '')
      // Trim multiple spaces/newlines
      .replace(/\n+/g, '. ')
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;

    // If already speaking the same text, toggle stop
    if (speakingText === text) {
      synth.cancel();
      setSpeakingText(null);
      setIsPaused(false);
      return;
    }

    synth.cancel();

    const clean = cleanTextForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utteranceRef.current = utterance;

    // Pick a natural English voice if available
    const voices = synth.getVoices();
    const naturalVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural'))) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.rate = 1.05; // Slightly brisk, natural speaking pace
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingText(text);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setSpeakingText(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingText(null);
      setIsPaused(false);
    };

    synth.speak(utterance);
  }, [speakingText]);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
      setIsPaused(false);
    }
  }, []);

  return { speak, stop, speakingText, isPaused };
}
