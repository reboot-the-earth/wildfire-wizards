import { motion, AnimatePresence } from 'framer-motion';
import EvacuationPlan from '../plan/EvacuationPlan';

export default function RightSidebar({ isOpen, onToggle, plan, checklist, triageWarning, timeEstimate }) {
  const hasPlan = plan && plan.length > 0;

  return (
    <>
      {/* Mobile toggle */}
      {hasPlan && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed top-14 right-3 z-40 bg-blue-600 border border-blue-500 rounded-lg p-2.5 shadow-md"
          aria-label="View evacuation plan"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>
      )}

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/20 z-30"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="
              fixed lg:relative z-30 lg:z-auto
              top-0 right-0 h-full
              w-[360px] lg:w-[360px] xl:w-[380px]
              bg-white/95 lg:bg-white
              backdrop-blur-xl lg:backdrop-blur-none
              border-l border-slate-200
              flex flex-col
              overflow-hidden
            "
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-700 tracking-widest uppercase">Evacuation Plan</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {hasPlan ? `${plan.length} trips planned` : 'Generate a plan to begin'}
                </p>
              </div>
              <button onClick={onToggle} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {hasPlan ? (
                <EvacuationPlan
                  plan={plan}
                  checklist={checklist}
                  triageWarning={triageWarning}
                  timeEstimate={timeEstimate}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Enter your farm details and generate a plan to see your evacuation steps here.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
