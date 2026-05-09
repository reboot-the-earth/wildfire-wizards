import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getFacilityStatus, getDestinationRisk } from '../../data/mockFacilities';

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

function facilityIcon(facility) {
  const risk = getDestinationRisk(facility);
  const cap = getFacilityStatus(facility);
  const isFull = cap.level === 'full';

  let bg, svg, bottomLabel, bottomColor;

  if (isFull) {
    bg = '#6b7280';
    svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round">
      <line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>
    </svg>`;
    bottomLabel = 'FULL';
    bottomColor = '#6b7280';
  } else if (risk.risk === 'safe') {
    bg = '#16a34a';
    svg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round">
      <polyline points="4 12 9 17 20 6"/>
    </svg>`;
    bottomLabel = `${facility.capacity_available}`;
    bottomColor = '#16a34a';
  } else if (risk.risk === 'moderate') {
    bg = '#ea580c';
    svg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>`;
    bottomLabel = `${facility.capacity_available}`;
    bottomColor = '#ea580c';
  } else {
    bg = '#dc2626';
    svg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>`;
    bottomLabel = `${facility.capacity_available}`;
    bottomColor = '#dc2626';
  }

  const shape = risk.risk === 'safe'
    ? `border-radius:6px;`
    : risk.risk === 'moderate'
      ? `border-radius:4px;transform:rotate(45deg);`
      : `border-radius:50%;`;

  const svgStyle = risk.risk === 'moderate' ? 'style="transform:rotate(-45deg);"' : '';
  const sz = isFull ? 26 : 30;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:44px;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:${sz}px;height:${sz}px;background:${bg};
          border:3px solid white;box-shadow:0 2px 12px ${bg}55;
          display:flex;align-items:center;justify-content:center;
          ${shape}
        ">
          <div ${svgStyle}>${svg}</div>
        </div>
        <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
          background:white;border-radius:6px;padding:1px 5px;font-size:8px;font-weight:800;
          color:${bottomColor};white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);line-height:13px;
          text-transform:uppercase;">${bottomLabel}</div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 24],
    popupAnchor: [0, -20],
  });
}

export default function FacilityMarkers({ facilities, onFacilityClick }) {
  if (!facilities?.length) return null;

  return (
    <>
      {facilities.map((facility) => {
        const status = getFacilityStatus(facility);
        const risk = getDestinationRisk(facility);

        return (
          <Marker
            key={facility.id}
            position={[facility.lat, facility.lon]}
            icon={facilityIcon(facility)}
            zIndexOffset={500}
            eventHandlers={{
              click: () => onFacilityClick?.(facility),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[240px]">
                <h3 className="font-bold text-sm text-slate-800 mb-1">{facility.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block"
                    style={{ color: risk.color, backgroundColor: `${risk.color}14` }}
                  >
                    {risk.label}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block"
                    style={{ color: status.color, backgroundColor: `${status.color}14` }}
                  >
                    {status.label}
                  </span>
                </div>
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
          </Marker>
        );
      })}
    </>
  );
}
