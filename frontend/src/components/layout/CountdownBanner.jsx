import { motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';

const URGENCY = {
  warning: {
    label: 'Watch',
    accent: 'text-amber-300',
    accentBg: 'from-amber-500/30 via-amber-500/10 to-transparent',
    ring: 'border-amber-400/40',
    chip: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    dot: 'bg-amber-400',
  },
  urgent: {
    label: 'Urgent',
    accent: 'text-ember-300',
    accentBg: 'from-ember-500/35 via-ember-500/10 to-transparent',
    ring: 'border-ember-400/50',
    chip: 'bg-ember-500/15 text-ember-200 border-ember-400/40',
    dot: 'bg-ember-400',
  },
  critical: {
    label: 'Critical',
    accent: 'text-red-300',
    accentBg: 'from-red-500/40 via-red-500/15 to-transparent',
    ring: 'border-red-400/60',
    chip: 'bg-red-500/20 text-red-200 border-red-400/40',
    dot: 'bg-red-400',
  },
};

export default function CountdownBanner({
  hoursRemaining,
  farmName,
  fireName = 'Lilac Fire — Bonsall',
  farmsAtRisk = 3,
  animalsAtRisk = 299,
  windMph = 35,
  planSource = null,
}) {
  const { hours, minutes, seconds, urgency, secondsLeft } = useCountdown(hoursRemaining);
  const u = URGENCY[urgency];
  const isExhausted = secondsLeft <= 0;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="relative z-50 glass-coal-strong border-b border-white/5 overflow-hidden"
    >
      {/* Ambient ember glow tinted by urgency */}
      <div className={`absolute inset-0 bg-gradient-to-b ${u.accentBg} pointer-events-none`} />
      <div className="absolute inset-x-0 bottom-0 h-px scanline opacity-70" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-4">
        {/* ---------- Brand block ---------- */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-ember-500 to-red-600 shadow-ember-glow">
              <span className="text-base">🔥</span>
            </div>
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${u.dot} ring-2 ring-coal-900 animate-pulse`} />
          </div>
          <div className="hidden sm:block min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-[13px] font-black tracking-tight text-white leading-none">WildfireWizards</div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-coal-300 leading-none">Live</span>
              <span className="hidden lg:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded px-1.5 py-0.5 leading-none">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                Open Source
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-sky-300 bg-sky-500/10 border border-sky-400/25 rounded px-1.5 py-0.5 leading-none">
                Replicable
              </span>
            </div>
            <div className="text-[10px] text-coal-300 mt-0.5 truncate">
              Wildfire Livestock Evacuation • San Diego County
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px h-9 bg-white/10" />

        {/* ---------- Fire context ---------- */}
        <div className="hidden md:flex items-center gap-3 min-w-0">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-coal-300 font-semibold">Active Incident</div>
            <div className="text-[12px] text-white font-semibold truncate max-w-[180px]">{fireName}</div>
          </div>
          <div className="text-[10px] flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md border font-mono font-semibold uppercase tracking-wider ${u.chip}`}>
              {u.label}
            </span>
          </div>
        </div>

        {/* ---------- Hero countdown ---------- */}
        <div className="flex-1 flex items-center justify-center">
          {!isExhausted ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[9px] uppercase tracking-widest text-coal-300 font-semibold leading-tight">
                  {farmName ? 'Fire reaches' : 'Time to fire'}
                </div>
                <div className="text-[11px] text-coal-200 truncate max-w-[160px]">
                  {farmName || 'projected impact'}
                </div>
              </div>
              <div className="flex items-end gap-1 font-mono">
                <CountdownChunk value={hours} label="hr" urgency={urgency} />
                <Sep urgency={urgency} />
                <CountdownChunk value={String(minutes).padStart(2, '0')} label="min" urgency={urgency} />
                <Sep urgency={urgency} />
                <CountdownChunk value={String(seconds).padStart(2, '0')} label="sec" urgency={urgency} small />
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600/30 border border-red-400/40"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-base sm:text-xl font-black uppercase tracking-wider text-red-100">
                Fire Has Arrived
              </span>
            </motion.div>
          )}
        </div>

        {/* ---------- Right stats ---------- */}
        <div className="hidden lg:flex items-center gap-3">
          <Stat label="Farms" value={farmsAtRisk} accent="text-sky-200" />
          <Stat label="Animals" value={animalsAtRisk} accent="text-ember-200" />
          <Stat label="Wind" value={`${windMph}mph`} accent="text-coal-100" mono={false} />
          {planSource && (
            <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border ${
              planSource === 'live'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                : 'bg-coal-700/60 text-coal-200 border-white/10'
            }`}>
              {planSource}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CountdownChunk({ value, label, urgency, small = false }) {
  const u = URGENCY[urgency];
  return (
    <div className="flex flex-col items-center leading-none">
      <span
        className={`font-black tabular-nums tracking-tight ${u.accent} drop-shadow-[0_2px_18px_rgba(249,115,22,0.35)] ${
          small ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
        }`}
      >
        {value}
      </span>
      <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-coal-300 mt-1">
        {label}
      </span>
    </div>
  );
}

function Sep({ urgency }) {
  return (
    <span className={`text-2xl sm:text-3xl font-black ${URGENCY[urgency].accent} opacity-30 mb-3 mx-0.5`}>
      :
    </span>
  );
}

function Stat({ label, value, accent = 'text-coal-100', mono = true }) {
  return (
    <div className="flex flex-col items-end">
      <span className={`text-[9px] uppercase tracking-widest text-coal-400 font-semibold leading-none`}>
        {label}
      </span>
      <span className={`${mono ? 'font-mono' : ''} text-sm font-bold ${accent} tabular-nums leading-tight mt-1`}>
        {value}
      </span>
    </div>
  );
}
