import { motion } from 'framer-motion';

export default function TriageWarning({ message }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mt-3 rounded-xl overflow-hidden relative shadow-[0_4px_20px_-4px_rgba(220,38,38,0.35)] border border-red-200"
    >
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 scanline opacity-90" />

      <div className="bg-gradient-to-br from-red-50 to-rose-50/60 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="absolute inset-0 rounded-full bg-red-300 blur-md opacity-50 animate-pulse" />
            <div className="relative w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-800 uppercase tracking-widest">
                Triage Required
              </span>
              <span className="text-[9px] font-mono text-red-600/80 px-1.5 py-0.5 bg-red-100 rounded">
                Not enough time
              </span>
            </div>
            <p className="text-xs text-red-800/90 leading-relaxed mt-1.5">
              {message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
