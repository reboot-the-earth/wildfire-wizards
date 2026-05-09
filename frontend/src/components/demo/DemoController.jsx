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
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%]"
          >
            <div className="glass-coal-strong rounded-2xl shadow-coal-lift px-5 py-4 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px scanline" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ember-300">
                  Step {currentStep + 1} / {totalSteps}
                </span>
                <span className="w-1 h-1 rounded-full bg-coal-500" />
                <span className="text-[10px] uppercase tracking-widest text-coal-300 font-semibold">
                  {step.name}
                </span>
              </div>
              <p className="text-sm sm:text-[15px] text-coal-100 leading-relaxed">
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
        className="fixed bottom-0 left-0 right-0 z-50 glass-coal-strong border-t border-white/5"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4 px-4 py-2.5">
          <button
            onClick={onExit}
            className="text-[11px] text-coal-300 hover:text-white transition-colors flex-shrink-0 px-2 py-1 uppercase tracking-widest font-semibold"
          >
            ESC to exit
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className="
                w-9 h-9 rounded-lg flex items-center justify-center
                bg-white/5 border border-white/10
                text-coal-200 hover:text-white hover:bg-white/10
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
                      ? 'w-10 bg-gradient-to-r from-ember-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.45)]'
                      : i < currentStep
                        ? 'w-1.5 bg-ember-300'
                        : 'w-1.5 bg-white/10'}
                  `}
                />
              ))}
            </div>

            <button
              onClick={onNext}
              disabled={isLast}
              className="
                w-9 h-9 rounded-lg flex items-center justify-center
                bg-gradient-to-br from-ember-500 to-red-600 text-white
                hover:shadow-ember-glow
                disabled:opacity-20 disabled:cursor-not-allowed
                transition-all
              "
              aria-label="Next step"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-right flex-shrink-0 w-20">
            <span className="text-xs font-mono text-coal-300 tabular-nums">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
