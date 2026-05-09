import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DemoController({
  isDemoMode,
  currentStep,
  totalSteps,
  step,
  onNext,
  onPrev,
  onExit,
  isFirst,
  isLast,
}) {
  useEffect(() => {
    if (!isDemoMode) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (!isLast) onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) onPrev();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDemoMode, isFirst, isLast, onNext, onPrev, onExit]);

  if (!isDemoMode) return null;

  return (
    <>
      {/* Narration overlay */}
      <AnimatePresence mode="wait">
        {step?.narration && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="
              fixed bottom-24 left-1/2 -translate-x-1/2 z-50
              max-w-xl w-[92%]
            "
          >
            <div className="
              bg-white/95 backdrop-blur-xl
              border border-slate-200
              rounded-2xl shadow-xl
              px-5 py-4
            ">
              <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">
                {step.name}
              </div>
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
                {step.narration}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom control bar */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="
          fixed bottom-0 left-0 right-0 z-50
          bg-white/95 backdrop-blur-xl
          border-t border-slate-200
        "
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 px-4 py-2.5">
          <button
            onClick={onExit}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 px-2 py-1"
          >
            ESC to exit
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className="
                w-8 h-8 rounded-lg flex items-center justify-center
                bg-slate-100 border border-slate-200
                text-slate-500 hover:text-slate-700
                disabled:opacity-20 disabled:cursor-not-allowed
                transition-colors
              "
              aria-label="Previous step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    h-1.5 rounded-full transition-all duration-300
                    ${i === currentStep
                      ? 'w-8 bg-blue-500'
                      : i < currentStep
                        ? 'w-1.5 bg-blue-300'
                        : 'w-1.5 bg-slate-200'}
                  `}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              disabled={isLast}
              className="
                w-8 h-8 rounded-lg flex items-center justify-center
                bg-blue-600 text-white hover:bg-blue-700
                disabled:opacity-20 disabled:cursor-not-allowed
                transition-colors
              "
              aria-label="Next step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-right flex-shrink-0 w-20">
            <span className="text-xs font-mono text-slate-400">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
