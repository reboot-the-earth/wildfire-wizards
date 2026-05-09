import { useState } from 'react';
import { motion } from 'framer-motion';
import AnimalSelector from './AnimalSelector';
import TrailerConfig from './TrailerConfig';

const SPECIES_OPTIONS = [
  { id: 'horses', label: 'Horses', icon: '🐴', perTrailer: 4 },
  { id: 'cattle', label: 'Cattle', icon: '🐄', perTrailer: 20 },
  { id: 'goats', label: 'Goats', icon: '🐐', perTrailer: 40 },
  { id: 'sheep', label: 'Sheep', icon: '🐑', perTrailer: 40 },
  { id: 'poultry', label: 'Poultry', icon: '🐔', perTrailer: 200 },
];

const SPECIAL_NEEDS = [
  { id: 'pregnant', label: 'Pregnant' },
  { id: 'young', label: 'Young / Nursing' },
  { id: 'senior', label: 'Senior' },
  { id: 'aggressive', label: 'Aggressive' },
  { id: 'injured', label: 'Injured / Sick' },
];

export default function FarmInput({ farmData, setFarmData }) {
  const [step, setStep] = useState(0);

  const updateField = (field, value) => {
    setFarmData((prev) => ({ ...prev, [field]: value }));
  };

  const addAnimal = (speciesId) => {
    setFarmData((prev) => {
      const existing = prev.animals?.find((a) => a.species === speciesId);
      if (existing) return prev;
      return {
        ...prev,
        animals: [...(prev.animals || []), { species: speciesId, count: 1, special_needs: [] }],
      };
    });
  };

  const updateAnimal = (speciesId, field, value) => {
    setFarmData((prev) => ({
      ...prev,
      animals: (prev.animals || []).map((a) =>
        a.species === speciesId ? { ...a, [field]: value } : a
      ),
    }));
  };

  const removeAnimal = (speciesId) => {
    setFarmData((prev) => ({
      ...prev,
      animals: (prev.animals || []).filter((a) => a.species !== speciesId),
    }));
  };

  return (
    <div className="flex flex-col">
      {/* Step indicators */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2">
        {['Location', 'Animals', 'Transport'].map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className="flex items-center gap-1.5 flex-1"
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              transition-colors duration-200
              ${i <= step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}
            `}>
              {i < step ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-[11px] font-medium ${i <= step ? 'text-slate-700' : 'text-slate-400'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-3">
        {/* Step 0: Location */}
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Farm Name</label>
              <input
                type="text"
                value={farmData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Valley Center Ranch"
                className="
                  w-full bg-slate-50 border border-slate-200 rounded-lg
                  px-3 py-2.5 text-sm text-slate-800
                  placeholder:text-slate-400
                  focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                  transition-colors
                "
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Address or Coordinates</label>
              <input
                type="text"
                value={farmData.address || ''}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="28500 Valley Center Rd, CA"
                className="
                  w-full bg-slate-50 border border-slate-200 rounded-lg
                  px-3 py-2.5 text-sm text-slate-800
                  placeholder:text-slate-400
                  focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                  transition-colors
                "
              />
            </div>
            <button
              className="w-full py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              onClick={() => {}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Drop Pin on Map
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            >
              Next: Add Animals
            </button>
          </motion.div>
        )}

        {/* Step 1: Animals */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-slate-400 mb-2">Tap to add species, then set count</p>

            <div className="grid grid-cols-3 gap-2">
              {SPECIES_OPTIONS.map((sp) => {
                const isAdded = farmData.animals?.some((a) => a.species === sp.id);
                return (
                  <button
                    key={sp.id}
                    onClick={() => !isAdded ? addAnimal(sp.id) : removeAnimal(sp.id)}
                    className={`
                      flex flex-col items-center gap-1 py-3 rounded-lg border text-center transition-all
                      ${isAdded
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}
                    `}
                  >
                    <span className="text-xl">{sp.icon}</span>
                    <span className="text-[11px] font-medium">{sp.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimalSelector
              animals={farmData.animals || []}
              speciesOptions={SPECIES_OPTIONS}
              specialNeeds={SPECIAL_NEEDS}
              onUpdateAnimal={updateAnimal}
              onRemoveAnimal={removeAnimal}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500 hover:text-slate-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
              >
                Next: Transport
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Transport */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <TrailerConfig
              transport={farmData.transport || { trailers: 1, type: 'stock_trailer' }}
              onChange={(transport) => updateField('transport', transport)}
            />
            <button
              onClick={() => setStep(1)}
              className="w-full py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500 hover:text-slate-600 transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
