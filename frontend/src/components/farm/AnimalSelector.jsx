import { motion, AnimatePresence } from 'framer-motion';

export default function AnimalSelector({ animals, speciesOptions, specialNeeds, onUpdateAnimal, onRemoveAnimal }) {
  if (!animals.length) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {animals.map((animal) => {
          const spec = speciesOptions.find((s) => s.id === animal.species);
          if (!spec) return null;

          return (
            <motion.div
              key={animal.species}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{spec.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{spec.label}</span>
                </div>
                <button
                  onClick={() => onRemoveAnimal(animal.species)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Count control */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-slate-500 w-12">Count</span>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => onUpdateAnimal(animal.species, 'count', Math.max(1, animal.count - 1))}
                    className="w-8 h-8 rounded-l-md bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center text-lg font-bold border border-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={animal.count}
                    onChange={(e) => onUpdateAnimal(animal.species, 'count', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 bg-white border-y border-slate-200 text-center text-sm text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => onUpdateAnimal(animal.species, 'count', animal.count + 1)}
                    className="w-8 h-8 rounded-r-md bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center text-lg font-bold border border-slate-200"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  ~{Math.ceil(animal.count / spec.perTrailer)} loads
                </span>
              </div>

              {/* Special needs toggles */}
              <div className="flex flex-wrap gap-1.5">
                {specialNeeds.map((need) => {
                  const isActive = animal.special_needs?.includes(need.id);
                  return (
                    <button
                      key={need.id}
                      onClick={() => {
                        const needs = isActive
                          ? animal.special_needs.filter((n) => n !== need.id)
                          : [...(animal.special_needs || []), need.id];
                        onUpdateAnimal(animal.species, 'special_needs', needs);
                      }}
                      className={`
                        text-[10px] font-medium px-2 py-1 rounded-md border transition-all
                        ${isActive
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-500'}
                      `}
                    >
                      {need.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
