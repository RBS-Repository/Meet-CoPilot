import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Settings,
  User,
  Minus,
  X,
  Pin,
  PinOff,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  HelpCircle,
  Bot,
  Eye,
} from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';
import { ListeningBar } from './ListeningBar';
import { AnswerControls } from './AnswerControls';
import { ErrorBanner } from './ErrorBanner';
import { ContextPanel } from './ContextPanel';
import { SettingsPanel } from './SettingsPanel';
import { FormattedAnswer } from './FormattedAnswer';
import { useListeningPipeline } from '../hooks/useListeningPipeline';
import { useSpeech } from '../hooks/useSpeech';

const FONT_SIZE_MAP = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };

export function AssistantPanel() {
  const {
    isListening,
    isGenerating,
    copilotStatus,
    currentQuestion,
    currentAnswer,
    conversation,
    isAlwaysOnTop,
    setIsAlwaysOnTop,
    appearance,
    setAppearance,
    setShowSettings,
    setShowContext,
  } = useMeetingStore();

  const { startListening, stopListening, clearAndReset, generateAnswer } =
    useListeningPipeline();

  const { speak, stop: stopSpeech, speakingText } = useSpeech();

  const [manualQuestion, setManualQuestion] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fontSize = FONT_SIZE_MAP[appearance.fontSize];

  // Auto-scroll to bottom when new question or answer arrives
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, currentQuestion, currentAnswer, isGenerating, showScrollBottom]);

  // Handle scroll events to show/hide "Scroll to Bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleRetry = () => {
    if (currentQuestion) {
      generateAnswer(currentQuestion);
    }
  };

  const handleTogglePin = async () => {
    if (window.electron?.toggleAlwaysOnTop) {
      const next = await window.electron.toggleAlwaysOnTop();
      setIsAlwaysOnTop(next);
    }
  };

  const handleManualSubmit = () => {
    const q = manualQuestion.trim();
    if (!q) return;
    generateAnswer(q);
    setManualQuestion('');
  };

  const handleManualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  const handleCopyText = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const OPACITY_STEPS = [1.0, 0.75, 0.5, 0.3];

  const cycleOpacity = () => {
    const current = appearance.opacity ?? 1.0;
    const nextIndex =
      (OPACITY_STEPS.findIndex((s) => Math.abs(s - current) < 0.1) + 1) %
      OPACITY_STEPS.length;
    const nextVal = OPACITY_STEPS[nextIndex];
    setAppearance({ opacity: nextVal });
  };

  const toggleCollapse = (index: number) => {
    setCollapsedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Combine completed past conversation with current active turn
  const hasCurrentTurn = Boolean(currentQuestion || (isGenerating && !currentAnswer));

  return (
    <div className={`flex flex-col h-full ${fontSize} relative`}>
      {/* Title bar — draggable */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/80 select-none shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-900/30">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-100 tracking-tight">Meeting Copilot</span>
        </div>
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {isListening && (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400 tracking-wide mr-1 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
          {/* Quick Transparency Button */}
          <button
            onClick={cycleOpacity}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              (appearance.opacity ?? 1) < 0.95
                ? 'bg-violet-900/40 text-violet-300 border border-violet-700/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
            title={`Window Opacity: ${Math.round((appearance.opacity ?? 1) * 100)}% (Click to toggle see-through mode)`}
          >
            <Eye size={12} />
            <span className="text-[10px] font-mono">{Math.round((appearance.opacity ?? 1) * 100)}%</span>
          </button>
          <button
            onClick={handleTogglePin}
            className={`p-1 rounded transition-colors ${
              isAlwaysOnTop
                ? 'text-violet-400 hover:bg-violet-900/30'
                : 'text-zinc-500 hover:bg-zinc-800'
            }`}
            title={isAlwaysOnTop ? 'Unpin from top' : 'Pin to top'}
          >
            {isAlwaysOnTop ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
          <button
            onClick={() => setShowContext(true)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Context"
          >
            <User size={13} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Settings"
          >
            <Settings size={13} />
          </button>
          <button
            onClick={() => window.electron?.minimize()}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => window.electron?.close()}
            className="p-1 rounded hover:bg-red-900/40 text-zinc-400 hover:text-red-300 transition-colors"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <ErrorBanner onRetry={handleRetry} />

      {/* Copilot Status Indicator */}
      {copilotStatus !== 'idle' && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 border-b border-zinc-800/60 bg-zinc-950/60 shrink-0">
          {copilotStatus === 'listening' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Listening for questions...</span>
            </>
          )}
          {copilotStatus === 'analyzing' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Analyzing speech...</span>
            </>
          )}
          {copilotStatus === 'generating' && (
            <>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">Generating new answer — wait to read</span>
            </>
          )}
          {copilotStatus === 'ready' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Answer ready — read now ✓</span>
            </>
          )}
        </div>
      )}

      <ListeningBar />

      {/* Main scrollable conversation stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 relative"
      >
        {conversation.length === 0 && !hasCurrentTurn && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 text-zinc-600">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
              <Sparkles size={18} />
            </div>
            <p className="text-xs font-medium text-zinc-400 mb-1">Copilot is Ready</p>
            <p className="text-[11px] text-zinc-500 max-w-[260px] leading-relaxed">
              Click <strong className="text-zinc-400 font-semibold">Start Listening</strong> to detect questions automatically, or type any question below.
            </p>
          </div>
        )}

        {/* Previous conversation items */}
        {conversation.map((item, idx) => {
          const isCollapsed = Boolean(collapsedItems[idx]);
          const isLastPastItem = idx === conversation.length - 1 && !hasCurrentTurn;

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isLastPastItem
                  ? 'bg-zinc-900/40 border-zinc-700/60 shadow-lg shadow-black/20'
                  : 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700/60'
              }`}
            >
              {/* Question Header & Content */}
              <div className="p-3 bg-zinc-900/50 border-b border-zinc-800/60">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-violet-400 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      Question {idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyText(item.answer, idx)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                      title="Copy Answer"
                    >
                      {copiedIndex === idx ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                    <button
                      onClick={() => toggleCollapse(idx)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
                      title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </button>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-100 leading-relaxed">
                  "{item.question}"
                </p>
              </div>

              {/* Answer Content (collapsible) */}
              {!isCollapsed && (
                <div className="p-3 bg-zinc-950/40">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Bot size={11} className="text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                      Suggested Answer
                    </span>
                  </div>
                  <FormattedAnswer
                    content={item.answer}
                    isSpeaking={speakingText === item.answer}
                    onSpeakToggle={() => speak(item.answer)}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Active / Current Turn (if generating or question detected) */}
        {hasCurrentTurn && (
          <div className="rounded-xl border border-violet-500/40 bg-zinc-900/40 shadow-xl shadow-violet-950/20 overflow-hidden">
            {/* Active Question */}
            {currentQuestion && (
              <div className="p-3 bg-zinc-900/70 border-b border-zinc-800/80">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle size={12} className="text-violet-400 shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                      Current Question
                    </span>
                  </div>
                </div>
                <p className="text-xs font-medium text-zinc-100 leading-relaxed">
                  "{currentQuestion}"
                </p>
              </div>
            )}

            {/* Active Answer or Loading Dots */}
            <div className="p-3 bg-zinc-950/60">
              <div className="flex items-center gap-1.5 mb-2">
                <Bot size={11} className="text-emerald-400 shrink-0" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                  Suggested Answer
                </span>
              </div>

              {isGenerating && !currentAnswer ? (
                <div className="flex items-center gap-2 text-zinc-400 py-2">
                  <span className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">Crafting your spoken script...</span>
                </div>
              ) : currentAnswer ? (
                <FormattedAnswer
                  content={currentAnswer}
                  isStreaming={isGenerating}
                  isSpeaking={!isGenerating && speakingText === currentAnswer}
                  onSpeakToggle={!isGenerating ? () => speak(currentAnswer) : undefined}
                />
              ) : null}
            </div>

            {/* Active Answer Controls (only when done generating) */}
            {!isGenerating && <AnswerControls />}
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Floating "Scroll to Bottom" button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-5 z-10 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-violet-600 text-white shadow-lg shadow-black/50 hover:bg-violet-500 transition-all animate-fade-in"
        >
          <ArrowDown size={11} />
          Latest
        </button>
      )}

      {/* Manual question input */}
      <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualQuestion}
            onChange={(e) => setManualQuestion(e.target.value)}
            onKeyDown={handleManualKeyDown}
            placeholder="Type or paste question..."
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualQuestion.trim() || isGenerating}
            className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Ask Copilot"
          >
            <Send size={13} />
          </button>
        </div>
      </div>

      {/* Listen / Stop + Clear buttons */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800/80 bg-zinc-950 shrink-0">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
            isListening
              ? 'bg-red-950/70 border border-red-800/60 text-red-300 hover:bg-red-900/50 shadow-md shadow-red-950/30'
              : 'bg-violet-600 border border-violet-500 text-white hover:bg-violet-500 shadow-md shadow-violet-950/40'
          }`}
        >
          {isListening ? 'STOP LISTENING' : 'START LISTENING'}
        </button>
        <button
          onClick={() => {
            stopSpeech();
            clearAndReset();
          }}
          className="px-3 py-2 text-xs rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          title="Clear all questions and answers"
        >
          Clear
        </button>
      </div>

      <ContextPanel />
      <SettingsPanel />
    </div>
  );
}
