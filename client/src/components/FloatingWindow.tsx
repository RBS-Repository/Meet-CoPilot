import { AssistantPanel } from './AssistantPanel';
import { useMeetingStore } from '../stores/meetingStore';

export function FloatingWindow() {
  const { appearance } = useMeetingStore();

  // Responsive translucent background that dynamically scales with opacity
  const bgOpacity = Math.max(0.15, Math.min(0.98, appearance.opacity));

  return (
    <div
      className="h-full w-full rounded-xl border border-zinc-800/80 shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-md transition-colors"
      style={{
        backgroundColor: `rgba(9, 9, 11, ${bgOpacity})`,
      }}
    >
      <AssistantPanel />
    </div>
  );
}
