import { useState } from 'react';
import { motion } from 'framer-motion';
import TripCard from './TripCard';
import Checklist from './Checklist';
import TriageWarning from './TriageWarning';

export default function EvacuationPlan({ plan, checklist, triageWarning, timeEstimate }) {
  const [activeTab, setActiveTab] = useState('plan');

  return (
    <div className="flex flex-col h-full">
      {triageWarning && <TriageWarning message={triageWarning} />}

      {/* Time summary */}
      {timeEstimate && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Trips</div>
              <div className="text-lg font-bold text-slate-800">{timeEstimate.total_trips}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Load Time</div>
              <div className="text-lg font-bold text-slate-800">{Math.round(timeEstimate.loading_time_total_min / 60)}h</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
              <div className="text-lg font-bold text-amber-600">{timeEstimate.total_evacuation_hours}h</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'plan', label: 'Loading Plan' },
          { id: 'checklist', label: 'Checklist' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider text-center
              border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-500'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'plan' && (
          <div className="p-3 space-y-2">
            {plan.map((trip, i) => (
              <motion.div
                key={trip.order}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <TripCard trip={trip} />
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'checklist' && checklist && (
          <Checklist sections={checklist} />
        )}
      </div>
    </div>
  );
}
