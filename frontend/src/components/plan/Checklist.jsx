import { useState } from 'react';
import { motion } from 'framer-motion';

const SECTION_META = {
  immediate: { label: 'Do Right Now', icon: '⚡', priority: 'high' },
  vehicle_prep: { label: 'Vehicle & Trailer', icon: '🚛', priority: 'high' },
  horse_specific: { label: 'Horse Handling', icon: '🐴', priority: 'medium' },
  cattle_specific: { label: 'Cattle Handling', icon: '🐄', priority: 'medium' },
  last_resort: { label: 'If You Cannot Return', icon: '🔴', priority: 'critical' },
};

export default function Checklist({ sections }) {
  const [checked, setChecked] = useState({});
  const [expandedSections, setExpandedSections] = useState({ immediate: true, vehicle_prep: true });

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

  return (
    <div className="py-2">
      {sectionKeys.map((sectionKey) => {
        const meta = SECTION_META[sectionKey] || { label: sectionKey, icon: '📋', priority: 'medium' };
        const items = sections[sectionKey];
        const isExpanded = expandedSections[sectionKey];
        const completedCount = items.filter((item) => checked[item.id]).length;
        const isComplete = completedCount === items.length;

        return (
          <div key={sectionKey} className="border-b border-slate-100 last:border-b-0">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{meta.icon}</span>
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isComplete ? 'text-green-600' : 'text-slate-700'
                }`}>
                  {meta.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono ${
                  isComplete ? 'text-green-600' : 'text-slate-400'
                }`}>
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
              <div className="pb-2 px-3">
                {items.map((item, i) => {
                  const isChecked = checked[item.id];
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => toggleCheck(item.id)}
                      className="w-full flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className={`
                        w-[18px] h-[18px] rounded-[5px] border flex-shrink-0 mt-0.5
                        flex items-center justify-center transition-all
                        ${isChecked
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-slate-300'}
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
