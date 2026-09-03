import React from 'react';
import { Volume2, Square } from 'lucide-react';

interface FormattedAnswerProps {
  content: string;
  isSpeaking?: boolean;
  onSpeakToggle?: () => void;
  isStreaming?: boolean;
}

export function FormattedAnswer({
  content,
  isSpeaking = false,
  onSpeakToggle,
  isStreaming = false,
}: FormattedAnswerProps) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="text-zinc-200 text-xs sm:text-sm leading-relaxed select-text space-y-2.5">
      {/* Speech Audio Bar if speech toggle is provided */}
      {onSpeakToggle && !isStreaming && (
        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-zinc-800/40">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Spoken Script
          </span>
          <button
            onClick={onSpeakToggle}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              isSpeaking
                ? 'bg-violet-600 text-white animate-pulse'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
            }`}
            title={isSpeaking ? 'Stop speech' : 'Read answer aloud'}
          >
            {isSpeaking ? <Square size={10} className="fill-current" /> : <Volume2 size={11} />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>
        </div>
      )}

      {/* Render formatted script */}
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Numbered section header (e.g. "**1. Initial Triage:**" or "1. Metrics:")
        const isNumberedHeader = /^(?:\*\*)?(\d+[\.\)])\s*(.+?)(?:\*\*)?$/.test(trimmed);
        // Bullet points
        const isBullet = /^[-*•]\s+/.test(trimmed);

        if (isNumberedHeader) {
          const match = trimmed.match(/^(?:\*\*)?(\d+[\.\)])\s*(.+?)(?:\*\*)?$/);
          if (match) {
            return (
              <div key={idx} className="pt-1.5 pb-0.5 flex items-start gap-2 text-zinc-100 font-semibold">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-900/60 border border-violet-700/60 text-violet-300 text-[11px] shrink-0 mt-0.5">
                  {match[1].replace(/[\.\)]/, '')}
                </span>
                <span className="text-violet-200 leading-snug">{renderInline(match[2])}</span>
              </div>
            );
          }
        }

        if (isBullet) {
          const bulletText = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
              <span className="text-zinc-200 flex-1 leading-relaxed">{renderInline(bulletText)}</span>
            </div>
          );
        }

        // First paragraph (often the quick verbal opening hook)
        const isOpeningHook = idx === 0 && !isNumberedHeader && !isBullet;
        if (isOpeningHook) {
          return (
            <div
              key={idx}
              className="px-3 py-2 rounded-lg bg-violet-950/30 border border-violet-800/40 text-violet-100 font-medium leading-relaxed"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 block mb-0.5">
                Quick Opener
              </span>
              {renderInline(trimmed)}
            </div>
          );
        }

        return (
          <p key={idx} className="text-zinc-200 leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}

      {isStreaming && (
        <div className="flex items-center gap-1.5 text-violet-400 text-xs font-mono animate-pulse pt-1">
          <span className="w-2 h-4 bg-violet-400 rounded-xs shadow-sm shadow-violet-500/50" />
          <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Streaming live response...</span>
        </div>
      )}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-violet-200 bg-violet-950/40 px-1 py-0.5 rounded">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 font-mono text-[11px] text-emerald-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
