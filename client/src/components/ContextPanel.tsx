import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMeetingStore } from '../stores/meetingStore';

export function ContextPanel() {
  const { showContext, setShowContext, userContext, setUserContext } = useMeetingStore();

  return (
    <AnimatePresence>
      {showContext && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="absolute inset-0 z-20 flex flex-col bg-zinc-950/98 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-200">Your Context</h2>
            <button
              onClick={() => setShowContext(false)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            <div>
              <label className="block text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={userContext.role}
                onChange={(e) => setUserContext({ role: e.target.value })}
                placeholder="Full Stack Developer"
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-1.5">
                Knowledge / Experience
              </label>
              <textarea
                value={userContext.knowledge}
                onChange={(e) => setUserContext({ knowledge: e.target.value })}
                placeholder="React, Next.js, TypeScript, Node.js..."
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium tracking-widest text-zinc-500 uppercase mb-1.5">
                AI Instructions
              </label>
              <textarea
                value={userContext.instructions}
                onChange={(e) => setUserContext({ instructions: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
