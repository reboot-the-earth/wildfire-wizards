const TRAILER_TYPES = [
  { id: 'stock_trailer', label: 'Stock Trailer', desc: '20 cattle / 4 horses', icon: '🚛' },
  { id: 'horse_trailer', label: 'Horse Trailer', desc: '4 horses / 6 small', icon: '🐴' },
  { id: 'livestock_trailer', label: 'Livestock Trailer', desc: '30 goats / 100 poultry', icon: '🚜' },
  { id: 'flatbed', label: 'Flatbed + Crates', desc: 'Crates only — poultry/small', icon: '📦' },
];

export default function TrailerConfig({ transport, onChange }) {
  const update = (field, value) => {
    onChange({ ...transport, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Trailer count */}
      <div>
        <label className="block text-xs text-slate-500 font-medium mb-2">How many trailers?</label>
        <div className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => update('trailers', n)}
              className={`
                flex-1 py-3 rounded-lg border text-center text-sm font-bold transition-all
                ${transport.trailers === n
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}
              `}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => update('trailers', Math.max(1, (transport.trailers || 1) + 1))}
            className="w-12 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-500 text-sm font-bold transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Trailer type */}
      <div>
        <label className="block text-xs text-slate-500 font-medium mb-2">Trailer type</label>
        <div className="space-y-2">
          {TRAILER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => update('type', type.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all
                ${transport.type === type.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'}
              `}
            >
              <span className="text-lg">{type.icon}</span>
              <div className="min-w-0">
                <div className={`text-sm font-medium ${transport.type === type.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {type.label}
                </div>
                <div className="text-[11px] text-slate-400">{type.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {transport.trailers && transport.type && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Transport Summary</div>
          <div className="text-sm text-slate-700">
            {transport.trailers}x {TRAILER_TYPES.find((t) => t.id === transport.type)?.label}
          </div>
        </div>
      )}
    </div>
  );
}
