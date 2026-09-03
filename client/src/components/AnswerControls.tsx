import { useState } from 'react';
import { Copy, Check, RefreshCw, Minimize2, ArrowDown, Cpu } from 'lucide-react';
import { streamRewrite } from '../services/aiService';
import { useMeetingStore } from '../stores/meetingStore';
import type { RewriteMode } from '../types';
import { useAbortableRequest } from '../hooks/useAbortableRequest';

export function AnswerControls() {
  const [copied, setCopied] = useState(false);
  const { create } = useAbortableRequest();

  const {
    currentQuestion,
    currentAnswer,
    userContext,
    conversation,
    answerStyle,
    isGenerating,
    setAnswer,
    setGenerating,
    setCopilotStatus,
    setError,
  } = useMeetingStore();

  if (!currentAnswer && !isGenerating) return null;

  const handleRewrite = async (mode: RewriteMode) => {
    if (!currentQuestion || !currentAnswer) return;

    const controller = create();
    setGenerating(true);
    setCopilotStatus('generating');
    setError(null);
    const prevAnswer = currentAnswer;
    setAnswer(''); // Clear answer so rewrite streams in real-time

    try {
      const answer = await streamRewrite(
        {
          question: currentQuestion,
          currentAnswer: prevAnswer,
          mode,
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
        setAnswer(answer);
        setCopilotStatus('ready');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        setAnswer(prevAnswer); // Restore on error
        setCopilotStatus('ready');
      }
    } finally {
      if (!controller.signal.aborted) {
        setGenerating(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!currentAnswer) return;
    await navigator.clipboard.writeText(currentAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass =
    'flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-t border-zinc-800/60">
      <button
        className={btnClass}
        onClick={() => handleRewrite('regenerate')}
        disabled={isGenerating}
      >
        <RefreshCw size={11} className={isGenerating ? 'animate-spin' : ''} />
        Regenerate
      </button>
      <button
        className={btnClass}
        onClick={() => handleRewrite('shorter')}
        disabled={isGenerating}
      >
        <Minimize2 size={11} />
        Shorter
      </button>
      <button
        className={btnClass}
        onClick={() => handleRewrite('more_natural')}
        disabled={isGenerating}
      >
        <ArrowDown size={11} />
        More Natural
      </button>
      <button
        className={btnClass}
        onClick={() => handleRewrite('more_technical')}
        disabled={isGenerating}
      >
        <Cpu size={11} />
        More Technical
      </button>
      <div className="flex-1" />
      <button className={btnClass} onClick={handleCopy} disabled={!currentAnswer}>
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
