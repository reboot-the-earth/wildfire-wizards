import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import TripCard from './TripCard';
import Checklist from './Checklist';
import TriageWarning from './TriageWarning';

/**
 * Collapse consecutive trailer-load rows that came from the same input animal
 * group into one display card. The backend splits a 60-cattle row into 3 trips
 * of 20 (because the trailer holds 20); the farmer entered "60 cattle" and
 * wants to see one card with a "3 loads" badge, not three near-identical cards.
 *
 * Grouping key: (species, reason, sedation_needed, can_transport). The first
 * trip's animals label keeps any special_needs annotation since the engine
 * only emits special_needs on the first batch of a group.
 */
function groupTrips(plan) {
  const groups = [];
  for (const trip of plan || []) {
    const last = groups[groups.length - 1];
    const sameGroup =
      last &&
      last.species === trip.species &&
      last.reason === trip.reason &&
      last.sedation_needed === trip.sedation_needed &&
      last.can_transport === trip.can_transport;
    if (sameGroup) {
      last.count += trip.count || 0;
      last.load_time_est_min += trip.load_time_est_min || 0;
      last.loads += trip.can_transport === false ? 0 : 1;
      last.last_trip = trip.trip ?? last.last_trip;
      continue;
    }
    groups.push({
      ...trip,
      loads: trip.can_transport === false ? 0 : 1,
      first_trip: trip.trip,
      last_trip: trip.trip,
      order: groups.length + 1,
    });
  }
  return groups.map((g) => {
    if (g.loads > 1 && g.first_trip != null && g.last_trip != null) {
      return { ...g, animals: g.animals.replace(/^\d+\s+/, `${g.count} `) };
    }
    return g;
  });
}

export default function EvacuationPlan({ plan, checklist, triageWarning, timeEstimate }) {
  const [activeTab, setActiveTab] = useState('plan');

  const groupedPlan = useMemo(() => groupTrips(plan), [plan]);

  const totalTrips = timeEstimate?.total_trips ?? plan?.length ?? 0;
  const loadingHrs = timeEstimate?.loading_time_total_min
    ? Math.round((timeEstimate.loading_time_total_min / 60) * 10) / 10
    : 0;
  const totalHrs = timeEstimate?.total_evacuation_hours ?? loadingHrs;

  return (
    <div className="flex flex-col h-full">
      {triageWarning && <TriageWarning message={triageWarning} />}

      {/* Time summary */}
      {timeEstimate && (
        <div className="px-3 py-3 grid grid-cols-3 gap-2">
          <StatTile
            label="Trailer trips"
            value={totalTrips}
            tone="neutral"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            }
          />
          <StatTile
            label="Loading"
            value={`${loadingHrs}h`}
            tone="info"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
          <StatTile
            label="Total"
            value={`${totalHrs}h`}
            tone={totalHrs > 8 ? 'danger' : 'warn'}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border-b border-slate-200 px-1">
        {[
          { id: 'plan', label: 'Loading Plan', count: groupedPlan.length || 0 },
          { id: 'checklist', label: 'Checklist', count: Object.keys(checklist || {}).length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center
                border-b-2 transition-colors flex items-center justify-center gap-1.5
                ${active
                  ? 'border-ember-500 text-ember-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'}
              `}
            >
              {tab.label}
              <span className={`text-[10px] tabular-nums font-semibold rounded-full px-1.5 py-0.5 ${
                active ? 'bg-ember-100 text-ember-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scroll-light">
        {activeTab === 'plan' && (
          <div className="p-3 space-y-2">
            {groupedPlan.map((trip, i) => (
              <motion.div
                key={trip.order ?? i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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

function StatTile({ label, value, tone = 'neutral', icon }) {
  const toneCls = {
    neutral: 'bg-slate-50 border-slate-200 text-slate-800 [&_.label]:text-slate-500 [&_.icon]:text-slate-400',
    info: 'bg-sky-50 border-sky-200 text-sky-800 [&_.label]:text-sky-600 [&_.icon]:text-sky-400',
    warn: 'bg-amber-50 border-amber-200 text-amber-800 [&_.label]:text-amber-600 [&_.icon]:text-amber-500',
    danger: 'bg-red-50 border-red-200 text-red-800 [&_.label]:text-red-600 [&_.icon]:text-red-500',
  }[tone];

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <span className="label text-[9px] uppercase tracking-widest font-bold leading-none">{label}</span>
        <span className="icon">{icon}</span>
      </div>
      <div className="text-lg font-black tabular-nums leading-tight mt-1">{value}</div>
    </div>
  );
}
