import { motion, AnimatePresence } from 'framer-motion';
import FarmInput from '../farm/FarmInput';
import { demoFarms } from '../../data/mockFarmProfiles';

export default function LeftSidebar({ isOpen, onToggle, onGeneratePlan, farmData, setFarmData, isGenerating, pickMode, onTogglePickMode, farmsAtRisk = [] }) {
  const loadDemoFarm = (farm) => {
    setFarmData({
      name: farm.name,
      address: farm.address,
      location: farm.location,
      animals: farm.animals,
      transport: farm.transport,
    });
  };

  const animalSummary = (farmData.animals || []).reduce(
    (acc, a) => acc + (a.count || 0),
    0
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-14 left-3 z-40 glass-coal rounded-lg p-2 shadow-coal-lift"
        aria-label={isOpen ? 'Close input panel' : 'Open input panel'}
      >
        <svg className="w-5 h-5 text-coal-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

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
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="
              fixed lg:relative z-30 lg:z-auto
              top-0 left-0 h-full
              w-80 lg:w-80 xl:w-[360px]
              glass-coal-strong
              flex flex-col
              overflow-hidden
              border-r border-white/5
            "
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ember-300">Step 1</span>
                    <span className="w-1 h-1 rounded-full bg-coal-500" />
                    <span className="text-[9px] uppercase tracking-widest text-coal-300 font-semibold">Your Farm</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5 leading-tight">Tell us what you have</h2>
                  <p className="text-[11px] text-coal-300 mt-0.5">Location · animals · trailer</p>
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

              {/* Live summary chips */}
              <div className="flex gap-1.5 mt-3">
                <SummaryChip label="Name" value={farmData.name ? '✓' : '—'} active={!!farmData.name} />
                <SummaryChip label="Animals" value={animalSummary > 0 ? animalSummary : '—'} active={animalSummary > 0} />
                <SummaryChip label="Trailers" value={farmData.transport?.trailers || '—'} active={!!farmData.transport?.trailers} />
              </div>
            </div>

            {/* Quick-load demo farms */}
            <div className="px-4 py-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] text-coal-300 uppercase tracking-widest font-bold">Quick Load</div>
                <span className="text-[9px] text-coal-400">San Diego County demos</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {demoFarms.map((farm) => {
                  const active = farmData.name === farm.name;
                  return (
                    <button
                      key={farm.id}
                      onClick={() => loadDemoFarm(farm)}
                      className={`
                        py-2 px-1.5 rounded-lg text-[10px] font-semibold border transition-all text-center leading-tight
                        ${active
                          ? 'bg-ember-500/15 border-ember-400/40 text-ember-200 shadow-ember-glow'
                          : 'bg-white/5 border-white/5 text-coal-200 hover:text-white hover:border-white/15'}
                      `}
                    >
                      {farm.name.split(' ').slice(0, 2).join(' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Farm input form (light surface inside dark shell) */}
            <div className="flex-1 overflow-y-auto scroll-light bg-white/[0.97] text-slate-700">
              <FarmInput
                farmData={farmData}
                setFarmData={setFarmData}
                pickMode={pickMode}
                onTogglePickMode={onTogglePickMode}
                farmsAtRisk={farmsAtRisk}
              />
            </div>

            {/* Generate button */}
            <div className="p-4 border-t border-white/5 bg-coal-900/60">
              <button
                onClick={onGeneratePlan}
                disabled={isGenerating || !farmData.animals?.length}
                className="
                  w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider
                  bg-gradient-to-br from-ember-500 to-red-600
                  text-white
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-150
                  shadow-ember-glow hover:shadow-[0_0_0_1px_rgba(249,115,22,0.4),0_12px_44px_-8px_rgba(249,115,22,0.65)]
                  relative overflow-hidden group
                "
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Building Your Plan…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Generate Evacuation Plan</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
              {!farmData.animals?.length ? (
                <p className="text-[10px] text-coal-400 text-center mt-2">Add animals to generate a plan</p>
              ) : (
                <p className="text-[10px] text-coal-400 text-center mt-2 tracking-normal">
                  {animalSummary} {animalSummary === 1 ? 'animal' : 'animals'} · {farmData.transport?.trailers || 1}{' '}
                  trailer{(farmData.transport?.trailers || 1) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SummaryChip({ label, value, active }) {
  return (
    <div className={`flex-1 rounded-md px-2 py-1.5 border text-center transition-colors ${
      active
        ? 'bg-emerald-500/10 border-emerald-400/30'
        : 'bg-white/5 border-white/5'
    }`}>
      <div className={`text-[9px] uppercase tracking-widest font-semibold ${active ? 'text-emerald-300' : 'text-coal-400'}`}>
        {label}
      </div>
      <div className={`text-xs font-bold tabular-nums mt-0.5 ${active ? 'text-emerald-200' : 'text-coal-200'}`}>
        {value}
      </div>
    </div>
  );
}
