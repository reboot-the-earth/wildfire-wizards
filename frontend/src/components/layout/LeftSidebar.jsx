import { motion, AnimatePresence } from 'framer-motion';
import FarmInput from '../farm/FarmInput';
import { demoFarms } from '../../data/mockFarmProfiles';

export default function LeftSidebar({ isOpen, onToggle, onGeneratePlan, farmData, setFarmData, isGenerating }) {
  const loadDemoFarm = (farm) => {
    setFarmData({
      name: farm.name,
      address: farm.address,
      location: farm.location,
      animals: farm.animals,
      transport: farm.transport,
    });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-14 left-3 z-40 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-md"
        aria-label={isOpen ? 'Close input panel' : 'Open input panel'}
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="lg:hidden fixed inset-0 bg-black/20 z-30"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="
              fixed lg:relative z-30 lg:z-auto
              top-0 left-0 h-full
              w-80 lg:w-80 xl:w-[340px]
              bg-white/95 lg:bg-white
              backdrop-blur-xl lg:backdrop-blur-none
              border-r border-slate-200
              flex flex-col
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-700 tracking-widest uppercase">Your Farm</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Location, animals, transport</p>
              </div>
              <button onClick={onToggle} className="lg:hidden p-1 text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick-load demo farms */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-2">Quick Load</div>
              <div className="flex gap-1.5">
                {demoFarms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => loadDemoFarm(farm)}
                    className={`
                      flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-all text-center leading-tight
                      ${farmData.name === farm.name
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 border-slate-150 text-slate-500 hover:text-slate-600 hover:border-slate-300'}
                    `}
                  >
                    {farm.name.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Farm input form */}
            <div className="flex-1 overflow-y-auto">
              <FarmInput farmData={farmData} setFarmData={setFarmData} />
            </div>

            {/* Generate button */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={onGeneratePlan}
                disabled={isGenerating || !farmData.animals?.length}
                className="
                  w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider
                  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                  text-white
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150
                  shadow-md shadow-blue-600/20
                  relative overflow-hidden
                "
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Building Your Plan...
                  </span>
                ) : (
                  'Generate Evacuation Plan'
                )}
              </button>
              {!farmData.animals?.length && (
                <p className="text-[10px] text-slate-400 text-center mt-2">Add animals to generate a plan</p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
