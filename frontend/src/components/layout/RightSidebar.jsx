import { motion, AnimatePresence } from 'framer-motion';
import EvacuationPlan from '../plan/EvacuationPlan';

export default function RightSidebar({ isOpen, onToggle, plan, checklist, triageWarning, timeEstimate, planSource }) {
  const hasPlan = plan && plan.length > 0;
  const trailerTripCount = timeEstimate?.total_trips ?? plan?.length ?? 0;

  const sourceBadge =
    planSource === 'live'
      ? { label: 'LIVE', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' }
      : planSource === 'mock'
        ? { label: 'DEMO', cls: 'bg-coal-700/60 text-coal-200 border-white/10' }
        : null;

  return (
    <>
      {/* Mobile toggle */}
      {hasPlan && (
        <button
          onClick={onToggle}
          className="lg:hidden fixed top-14 right-3 z-40 bg-gradient-to-br from-ember-500 to-red-600 rounded-lg p-2.5 shadow-ember-glow"
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
            className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="
              fixed lg:relative z-30 lg:z-auto
              top-0 right-0 h-full
              w-[360px] lg:w-[380px] xl:w-[400px]
              glass-coal-strong
              border-l border-white/5
              flex flex-col
              overflow-hidden
            "
          >
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ember-300">Step 2</span>
                  <span className="w-1 h-1 rounded-full bg-coal-500" />
                  <span className="text-[9px] uppercase tracking-widest text-coal-300 font-semibold">Action Plan</span>
                  {sourceBadge && (
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest border rounded px-1.5 py-0.5 ${sourceBadge.cls}`}>
                      {sourceBadge.label}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5 leading-tight">Evacuation Plan</h2>
                <p className="text-[11px] text-coal-300 mt-0.5">
                  {hasPlan ? `${trailerTripCount} trailer trip${trailerTripCount === 1 ? '' : 's'} · prioritized` : 'Generate a plan to begin'}
                </p>
              </div>
              <button
                onClick={onToggle}
                className="lg:hidden p-1 text-coal-300 hover:text-white"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white/[0.97] text-slate-700 scroll-light">
              {hasPlan ? (
                <EvacuationPlan
                  plan={plan}
                  checklist={checklist}
                  triageWarning={triageWarning}
                  timeEstimate={timeEstimate}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-ember-200/40 blur-2xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-ember-50 to-amber-100 border border-ember-200/60 flex items-center justify-center shadow-md">
          <span className="text-3xl">🐎</span>
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-800 leading-tight">
        Built for the moment <br />everything is on fire.
      </h3>
      <p className="text-[12px] text-slate-500 leading-relaxed mt-2 max-w-[260px]">
        Add your animals and trailer on the left. We turn it into a
        <span className="text-slate-700 font-semibold"> minute-by-minute loading plan</span>{' '}
        with the safest route to a facility that has live capacity.
      </p>

      <div className="mt-6 w-full max-w-[260px] grid grid-cols-3 gap-2">
        <FactTile emoji="🔥" value="2017" label="Lilac Fire" />
        <FactTile emoji="🐴" value="46" label="Lost" tone="bad" />
        <FactTile emoji="🏠" value="0" label="With us" tone="good" />
      </div>

      <div className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live mission • San Diego County
      </div>
    </div>
  );
}

function FactTile({ emoji, value, label, tone = 'neutral' }) {
  const toneCls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'bad'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <div className={`rounded-lg border px-2 py-2 text-center ${toneCls}`}>
      <div className="text-base">{emoji}</div>
      <div className="text-sm font-bold tabular-nums leading-tight mt-0.5">{value}</div>
      <div className="text-[9px] uppercase tracking-widest font-semibold opacity-70">{label}</div>
    </div>
  );
}
