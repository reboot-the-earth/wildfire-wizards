import { motion, AnimatePresence } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';

const URGENCY_STYLES = {
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    label: 'text-amber-700',
    time: 'text-amber-900',
    glow: '',
    border: 'border-b border-amber-200',
  },
  urgent: {
    bg: 'bg-orange-50 border-orange-200',
    label: 'text-orange-700',
    time: 'text-orange-900',
    glow: 'shadow-sm',
    border: 'border-b border-orange-200',
  },
  critical: {
    bg: 'bg-red-50 border-red-300',
    label: 'text-red-700',
    time: 'text-red-900',
    glow: 'shadow-[0_2px_12px_rgba(220,38,38,0.1)]',
    border: 'border-b border-red-300',
  },
};

export default function CountdownBanner({ hoursRemaining, farmName }) {
  const { hours, minutes, seconds, formatted, urgency, secondsLeft } = useCountdown(hoursRemaining);
  const s = URGENCY_STYLES[urgency];
  const isExhausted = secondsLeft <= 0;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        relative z-50 ${s.bg} ${s.glow} ${s.border}
        ${urgency === 'critical' ? 'animate-pulse-critical' : ''}
      `}
    >
      <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2 max-w-screen-2xl mx-auto">
        {/* Left: brand + status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 tracking-widest hidden sm:inline">
              NOHERDLEFT
            </span>
          </div>
          <div className="w-px h-5 bg-slate-200 hidden sm:block" />
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${s.label}`}>
            {isExhausted ? 'EVACUATE IMMEDIATELY' : 'Fire reaches farm in'}
          </span>
        </div>

        {/* Center: countdown (the hero) */}
        {!isExhausted ? (
          <div className="flex items-baseline gap-0.5 font-mono">
            <CountdownDigit value={hours} label="h" urgency={urgency} />
            <span className={`text-lg sm:text-2xl font-bold ${s.time} opacity-30 mx-0.5`}>:</span>
            <CountdownDigit value={String(minutes).padStart(2, '0')} label="m" urgency={urgency} />
            <span className={`text-lg sm:text-2xl font-bold ${s.time} opacity-30 mx-0.5`}>:</span>
            <CountdownDigit value={String(seconds).padStart(2, '0')} label="s" urgency={urgency} />
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-red-800 text-base sm:text-xl font-black uppercase tracking-wider"
          >
            Fire Has Arrived
          </motion.div>
        )}

        {/* Right: farm name */}
        <div className="text-right min-w-0 flex-shrink-0 hidden sm:block">
          {farmName ? (
            <span className="text-xs text-slate-500 truncate">{farmName}</span>
          ) : (
            <span className="text-[10px] text-slate-400">San Diego County</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CountdownDigit({ value, label, urgency }) {
  const s = URGENCY_STYLES[urgency];
  return (
    <div className="flex items-baseline gap-0.5">
      <span className={`text-2xl sm:text-4xl font-black tracking-tight ${s.time}`}>
        {value}
      </span>
      <span className={`text-[10px] sm:text-xs font-semibold ${s.label} opacity-60 uppercase`}>
        {label}
      </span>
    </div>
  );
}
