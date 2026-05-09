import { useState } from 'react';
import { motion } from 'framer-motion';

const SECTION_META = {
  immediate: {
    label: 'Do Right Now',
    icon: '⚡',
    accent: 'border-l-amber-500 bg-amber-50/60',
    chip: 'bg-amber-100 text-amber-700',
  },
  vehicle_prep: {
    label: 'Vehicle & Trailer',
    icon: '🚛',
    accent: 'border-l-sky-500 bg-sky-50/60',
    chip: 'bg-sky-100 text-sky-700',
  },
  horse_specific: {
    label: 'Horse Handling',
    icon: '🐴',
    accent: 'border-l-violet-500 bg-violet-50/40',
    chip: 'bg-violet-100 text-violet-700',
  },
  cattle_specific: {
    label: 'Cattle Handling',
    icon: '🐄',
    accent: 'border-l-orange-500 bg-orange-50/40',
    chip: 'bg-orange-100 text-orange-700',
  },
  small_ruminant_specific: {
    label: 'Goats / Sheep',
    icon: '🐐',
    accent: 'border-l-emerald-500 bg-emerald-50/40',
    chip: 'bg-emerald-100 text-emerald-700',
  },
  poultry_specific: {
    label: 'Poultry',
    icon: '🐔',
    accent: 'border-l-yellow-500 bg-yellow-50/40',
    chip: 'bg-yellow-100 text-yellow-700',
  },
  last_resort: {
    label: 'If You Cannot Return',
    icon: '🔴',
    accent: 'border-l-red-500 bg-red-50/50',
    chip: 'bg-red-100 text-red-700',
  },
};

export default function Checklist({ sections }) {
  const [checked, setChecked] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    immediate: true,
    vehicle_prep: true,
  });

  const toggleCheck = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const sectionKeys = Object.keys(sections).filter(
    (k) => sections[k] && sections[k].length > 0
  );

  const totalItems = sectionKeys.reduce((acc, k) => acc + sections[k].length, 0);
  const totalDone = Object.values(checked).filter(Boolean).length;
  const pct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="py-2">
      {/* Overall progress */}
      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Overall</span>
          <span className="text-[10px] font-mono font-semibold text-slate-600">
            {totalDone}/{totalItems} · {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {sectionKeys.map((sectionKey) => {
        const meta = SECTION_META[sectionKey] || {
          label: sectionKey.replace(/_/g, ' '),
          icon: '📋',
          accent: 'border-l-slate-400 bg-slate-50/60',
          chip: 'bg-slate-100 text-slate-700',
        };
        const items = sections[sectionKey];
        const isExpanded = expandedSections[sectionKey];
        const completedCount = items.filter((item) => checked[item.id]).length;
        const isComplete = completedCount === items.length;

        return (
          <div
            key={sectionKey}
            className={`border-b border-slate-100 last:border-b-0 border-l-4 ${meta.accent.replace(/border-l-\S+/, '')} ${meta.accent.match(/border-l-\S+/)[0]}`}
          >
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{meta.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isComplete ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {meta.label}
                </span>
                {isComplete && (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold rounded-full px-1.5 py-0.5 ${meta.chip}`}>
                  {completedCount}/{items.length}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="pb-2 pl-2 pr-2">
                {items.map((item, i) => {
                  const isChecked = checked[item.id];
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.025 }}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/60 transition-colors text-left"
                    >
                      <div className={`
                        w-[18px] h-[18px] rounded-md border flex-shrink-0 mt-0.5
                        flex items-center justify-center transition-all
                        ${isChecked
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-slate-300 group-hover:border-slate-400'}
                      `}>
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs leading-relaxed transition-colors ${
                        isChecked ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}>
                        {item.text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
