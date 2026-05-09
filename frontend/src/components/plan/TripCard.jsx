import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPECIES_THEME = {
  horses:        { emoji: '🐴', bg: 'from-violet-50 to-purple-50',    border: 'border-violet-200',    text: 'text-violet-700',    accent: 'bg-violet-500' },
  cattle:        { emoji: '🐄', bg: 'from-orange-50 to-amber-50',     border: 'border-orange-200',    text: 'text-orange-700',    accent: 'bg-orange-500' },
  cattle_calves: { emoji: '🐄', bg: 'from-amber-50 to-yellow-50',     border: 'border-amber-200',     text: 'text-amber-800',     accent: 'bg-amber-500' },
  goats:         { emoji: '🐐', bg: 'from-emerald-50 to-teal-50',     border: 'border-emerald-200',   text: 'text-emerald-700',   accent: 'bg-emerald-500' },
  sheep:         { emoji: '🐑', bg: 'from-cyan-50 to-sky-50',         border: 'border-cyan-200',      text: 'text-cyan-700',      accent: 'bg-cyan-500' },
  poultry:       { emoji: '🐔', bg: 'from-yellow-50 to-amber-50',     border: 'border-yellow-200',    text: 'text-yellow-800',    accent: 'bg-yellow-500' },
};

export default function TripCard({ trip }) {
  const [expanded, setExpanded] = useState(false);
  const t = SPECIES_THEME[trip.species] || SPECIES_THEME.cattle;
  const loads = trip.loads || 0;
  const perLoad = loads > 1 ? Math.round(trip.load_time_est_min / loads) : null;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`
        w-full text-left rounded-xl border bg-gradient-to-br ${t.bg} ${t.border}
        transition-all hover:shadow-md hover:-translate-y-px
        relative overflow-hidden
      `}
    >
      {/* Side accent stripe */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${t.accent}`} />

      <div className="px-3.5 py-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Order badge */}
            <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border ${t.border}`}>
              <span className="text-lg leading-none">{t.emoji}</span>
              <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full ${t.accent} text-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
                {trip.order}
              </span>
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-bold ${t.text} truncate leading-tight`}>
                {trip.animals}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">
                {trip.reason}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="flex items-center gap-1 text-xs font-mono text-slate-700 font-semibold tabular-nums">
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {trip.load_time_est_min}m
            </div>
            {loads > 1 && (
              <span className={`mt-1 text-[9px] font-semibold uppercase tracking-wider ${t.text} bg-white/70 border ${t.border} rounded px-1.5 py-0.5 tabular-nums`}>
                {loads} loads
              </span>
            )}
            {trip.sedation_needed && (
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-violet-700 bg-violet-100 border border-violet-200 rounded px-1.5 py-0.5">
                Sedate
              </span>
            )}
            {trip.can_transport === false && (
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">
                No fit
              </span>
            )}
            <svg
              className={`w-3.5 h-3.5 text-slate-400 mt-1.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-slate-200/60"
            >
              <div className="flex items-start gap-2 text-xs text-slate-700">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="leading-relaxed">
                  {trip.handling}
                </p>
              </div>
              {loads > 1 && perLoad != null && (
                <div className="mt-2 text-[11px] text-slate-500 tabular-nums">
                  Trailer batches: <span className="font-semibold text-slate-700">{loads}</span>
                  {' · '}
                  ~<span className="font-semibold text-slate-700">{perLoad}</span>m per load
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
