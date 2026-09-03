import { useMeetingStore } from '../stores/meetingStore';

export function ListeningBar() {
  const { isListening, currentTranscript, audioLevel } = useMeetingStore();

  if (!isListening) return null;

  // Render 8 bars for audio level visualizer
  const bars = 8;
  const activeBars = Math.round(audioLevel * bars);

  return (
    <div className="px-4 py-3 border-b border-zinc-800/60">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
          Listening
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </span>
        {/* Audio level bars */}
        <div className="flex items-end gap-[2px] h-3 ml-auto">
          {Array.from({ length: bars }, (_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full transition-all duration-75"
              style={{
                height: i < activeBars ? `${Math.max(4, ((i + 1) / bars) * 12)}px` : '3px',
                backgroundColor: i < activeBars
                  ? i < bars * 0.5 ? '#34d399' : i < bars * 0.8 ? '#fbbf24' : '#f87171'
                  : '#3f3f46',
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed italic min-h-[1.25rem]">
        {currentTranscript ? `"${currentTranscript}"` : 'Waiting for audio...'}
      </p>
    </div>
  );
}
