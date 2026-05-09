import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPECIES_COLORS = {
  horses: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  cattle: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  goats: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sheep: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  poultry: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
};

export default function TripCard({ trip }) {
  const [expanded, setExpanded] = useState(false);
  const colors = SPECIES_COLORS[trip.species] || SPECIES_COLORS.cattle;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={`
        w-full text-left rounded-xl border transition-all
        ${colors.bg} ${colors.border}
        hover:shadow-sm
      `}
    >
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center
              text-xs font-bold ${colors.text}
              bg-white/70
            `}>
              {trip.order}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${colors.text} truncate`}>
                {trip.animals}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {trip.reason}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="text-xs text-slate-500 font-mono">
              ~{trip.load_time_est_min}m
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
              className="mt-3 pt-3 border-t border-slate-200/50"
            >
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {trip.handling}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
