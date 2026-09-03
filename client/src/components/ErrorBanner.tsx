import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';

interface ErrorBannerProps {
  onRetry?: () => void;
}

export function ErrorBanner({ onRetry }: ErrorBannerProps) {
  const { error, setError } = useMeetingStore();

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-2 px-3 py-2 mx-3 mt-2 text-xs rounded-lg bg-red-950/80 border border-red-800/50 text-red-300"
        >
          <AlertTriangle size={14} className="shrink-0" />
          <span className="flex-1">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2 py-0.5 rounded text-red-200 hover:bg-red-900/50 transition-colors"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => setError(null)}
            className="p-0.5 rounded hover:bg-red-900/50 transition-colors"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
