import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AnimalSelector from './AnimalSelector';
import TrailerConfig from './TrailerConfig';
import { lookupZipLocal, parseCoords, resolveAddress, resolveZip } from '../../utils/geocode';

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

const LOCATION_MODES = [
  { id: 'address', label: 'Address', icon: '📍' },
  { id: 'zip',     label: 'ZIP',     icon: '#'  },
  { id: 'coords',  label: 'Lat/Lon', icon: '⌖' },
];

export default function FarmInput({ farmData, setFarmData }) {
  const [step, setStep] = useState(0);

  const [locMode, setLocMode] = useState('address');
  const [zipInput, setZipInput] = useState('');
  const [coordsInput, setCoordsInput] = useState('');
  const [geoStatus, setGeoStatus] = useState({ kind: 'idle' });

  useEffect(() => {
    if (!farmData.location) return;
    if (farmData.zip && !zipInput) setZipInput(farmData.zip);
    if (!coordsInput) {
      setCoordsInput(`${farmData.location.lat.toFixed(4)}, ${farmData.location.lon.toFixed(4)}`);
    }
  }, [farmData.location, farmData.zip]);

  const updateField = (field, value) => {
    setFarmData((prev) => ({ ...prev, [field]: value }));
  };

  const setResolvedLocation = (loc, addressText) => {
    setFarmData((prev) => ({
      ...prev,
      location: { lat: loc.lat, lon: loc.lon },
      address: addressText ?? prev.address,
      zip: loc.zip ?? prev.zip,
    }));
  };

  const onZipChange = (raw) => {
    const trimmed = raw.replace(/[^\d]/g, '').slice(0, 5);
    setZipInput(trimmed);
    if (trimmed.length === 5) {
      const local = lookupZipLocal(trimmed);
      if (local) {
        setResolvedLocation(local, local.place);
        setGeoStatus({ kind: 'ok', source: 'local', text: `${local.place}, CA` });
        return;
      }
      setGeoStatus({ kind: 'loading' });
      resolveZip(trimmed).then((res) => {
        if (!res) {
          setGeoStatus({ kind: 'error', text: 'ZIP not found' });
          return;
        }
        setResolvedLocation({ ...res, zip: trimmed }, res.place);
        setGeoStatus({ kind: 'ok', source: res.source, text: res.place });
      });
    } else {
      setGeoStatus({ kind: 'idle' });
    }
  };

  const onCoordsBlur = () => {
    const parsed = parseCoords(coordsInput);
    if (!parsed) {
      if (coordsInput.trim()) setGeoStatus({ kind: 'error', text: 'Use "lat, lon" format' });
      return;
    }
    setResolvedLocation(parsed);
    setGeoStatus({ kind: 'ok', source: 'manual', text: `${parsed.lat.toFixed(4)}, ${parsed.lon.toFixed(4)}` });
  };

  const onAddressGeocode = async () => {
    if (!farmData.address?.trim()) return;
    setGeoStatus({ kind: 'loading' });
    const res = await resolveAddress(farmData.address);
    if (!res) {
      setGeoStatus({ kind: 'error', text: 'Address not found' });
      return;
    }
    setResolvedLocation(res);
    setGeoStatus({ kind: 'ok', source: 'nominatim', text: res.place });
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

            {/* Location-mode tabs */}
            <div>
              <label className="block text-xs text-slate-500 font-medium mb-1.5">Where is the farm?</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {LOCATION_MODES.map((m) => {
                  const active = locMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setLocMode(m.id); setGeoStatus({ kind: 'idle' }); }}
                      className={`
                        flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all
                        ${active
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'}
                      `}
                    >
                      <span className="text-sm leading-none">{m.icon}</span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Address mode */}
            {locMode === 'address' && (
              <div>
                <input
                  type="text"
                  value={farmData.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  onBlur={onAddressGeocode}
                  placeholder="28500 Valley Center Rd, CA"
                  className="
                    w-full bg-slate-50 border border-slate-200 rounded-lg
                    px-3 py-2.5 text-sm text-slate-800
                    placeholder:text-slate-400
                    focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    transition-colors
                  "
                />
                <button
                  onClick={onAddressGeocode}
                  className="mt-2 text-[11px] text-blue-700 hover:underline font-semibold"
                >
                  Find on map →
                </button>
              </div>
            )}

            {/* ZIP mode */}
            {locMode === 'zip' && (
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={zipInput}
                  onChange={(e) => onZipChange(e.target.value)}
                  placeholder="92082"
                  maxLength={5}
                  className="
                    w-full bg-slate-50 border border-slate-200 rounded-lg
                    px-3 py-2.5 text-sm text-slate-800 font-mono tabular-nums tracking-widest
                    placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal
                    focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    transition-colors
                  "
                />
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  San Diego County ZIPs resolve instantly · others use OpenStreetMap.
                </p>
              </div>
            )}

            {/* Coordinates mode */}
            {locMode === 'coords' && (
              <div>
                <input
                  type="text"
                  value={coordsInput}
                  onChange={(e) => setCoordsInput(e.target.value)}
                  onBlur={onCoordsBlur}
                  placeholder="33.22, -117.03"
                  className="
                    w-full bg-slate-50 border border-slate-200 rounded-lg
                    px-3 py-2.5 text-sm text-slate-800 font-mono tabular-nums
                    placeholder:text-slate-400 placeholder:font-sans
                    focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                    transition-colors
                  "
                />
                <p className="mt-1.5 text-[10.5px] text-slate-400">
                  Decimal degrees, lat first. Negative lon for the western hemisphere.
                </p>
              </div>
            )}

            {/* Geocoding status pill */}
            {geoStatus.kind !== 'idle' && (
              <div
                className={`
                  rounded-lg px-3 py-2 text-[11px] flex items-start gap-2
                  ${geoStatus.kind === 'ok'      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                  ${geoStatus.kind === 'loading' ? 'bg-sky-50 text-sky-700 border border-sky-200' : ''}
                  ${geoStatus.kind === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                `}
              >
                {geoStatus.kind === 'loading' && (
                  <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0 mt-px" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                  </svg>
                )}
                {geoStatus.kind === 'ok' && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {geoStatus.kind === 'error' && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-px" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-3a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm0 7a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="min-w-0">
                  <span className="font-semibold">
                    {geoStatus.kind === 'ok' && 'Located'}
                    {geoStatus.kind === 'loading' && 'Looking up…'}
                    {geoStatus.kind === 'error' && 'Could not resolve'}
                  </span>
                  {geoStatus.text && (
                    <span className="ml-1.5 truncate">· {geoStatus.text}</span>
                  )}
                  {geoStatus.kind === 'ok' && farmData.location && (
                    <div className="font-mono tabular-nums text-[10px] text-emerald-600/80 mt-0.5">
                      {farmData.location.lat.toFixed(4)}, {farmData.location.lon.toFixed(4)}
                      {geoStatus.source && (
                        <span className="ml-1.5 opacity-70">· {geoStatus.source}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={!farmData.location}
              className={`
                w-full py-2.5 rounded-lg text-sm font-medium transition-colors
                ${farmData.location
                  ? 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              {farmData.location ? 'Next: Add Animals' : 'Set a location to continue'}
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
