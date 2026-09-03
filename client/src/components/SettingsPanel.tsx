import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';
import type { AnswerStyle, AudioSource, FontSize } from '../types';
import { AudioSourceSelector } from './AudioSourceSelector';

const ANSWER_STYLES: { value: AnswerStyle; label: string }[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'concise', label: 'Concise' },
  { value: 'professional', label: 'Professional' },
  { value: 'technical', label: 'Technical' },
  { value: 'detailed', label: 'Detailed' },
];

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

export function SettingsPanel() {
  const {
    showSettings,
    setShowSettings,
    answerStyle,
    setAnswerStyle,
    audioSource,
    setAudioSource,
    appearance,
    setAppearance,
    userContext,
    setUserContext,
  } = useMeetingStore();

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="absolute inset-0 z-20 flex flex-col bg-zinc-950/98 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-200">Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            <section>
              <h3 className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-3">
                General
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Answer Style</label>
                  <select
                    value={answerStyle}
                    onChange={(e) => setAnswerStyle(e.target.value as AnswerStyle)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    {ANSWER_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">User Role</label>
                  <input
                    type="text"
                    value={userContext.role}
                    onChange={(e) => setUserContext({ role: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Knowledge</label>
                  <textarea
                    value={userContext.knowledge}
                    onChange={(e) => setUserContext({ knowledge: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">AI Instructions</label>
                  <textarea
                    value={userContext.instructions}
                    onChange={(e) => setUserContext({ instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-3">
                Audio
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Audio Input</label>
                  <select
                    value={audioSource}
                    onChange={(e) => setAudioSource(e.target.value as AudioSource)}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="loopback">System Audio (Loopback)</option>
                    <option value="microphone">Microphone</option>
                  </select>
                </div>
                <AudioSourceSelector />
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-3">
                Appearance
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Theme</label>
                  <select
                    value={appearance.theme}
                    disabled
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500"
                  >
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Opacity ({Math.round(appearance.opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={appearance.opacity}
                    onChange={(e) => setAppearance({ opacity: Number(e.target.value) })}
                    className="w-full accent-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Font Size</label>
                  <select
                    value={appearance.fontSize}
                    onChange={(e) => setAppearance({ fontSize: e.target.value as FontSize })}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    {FONT_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
