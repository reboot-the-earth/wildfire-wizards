import { CircleMarker, Popup } from 'react-leaflet';
import { getFacilityStatus } from '../../data/mockFacilities';

function CapacityBar({ available, total }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  const status = getFacilityStatus({ capacity_available: available, capacity_total: total });

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: status.color }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-slate-500">{available} available</span>
        <span className="text-[11px] font-medium" style={{ color: status.color }}>{status.label}</span>
      </div>
    </div>
  );
}

export default function FacilityMarkers({ facilities, onFacilityClick }) {
  if (!facilities?.length) return null;

  return (
    <>
      {facilities.map((facility) => {
        const status = getFacilityStatus(facility);

        return (
          <CircleMarker
            key={facility.id}
            center={[facility.lat, facility.lon]}
            radius={10}
            pathOptions={{
              color: '#ffffff',
              fillColor: status.color,
              fillOpacity: 0.85,
              weight: 2.5,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => onFacilityClick?.(facility),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <h3 className="font-bold text-sm text-slate-800 mb-1">{facility.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{facility.access_road}</p>

                <CapacityBar
                  available={facility.capacity_available}
                  total={facility.capacity_total}
                />

                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-slate-400">Accepts:</span>
                    <span>{facility.accepts.join(', ')}</span>
                  </div>
                  {facility.trailer_access && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Trailer access
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {facility.contact}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
