import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function neighborIcon(farmer) {
  const { registered, willingToHelp, needsHelp, spare_capacity } = farmer;

  if (needsHelp) {
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:44px;height:52px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:-4px;border-radius:50%;border:2.5px solid #dc2626;opacity:0.4;animation:fellow-pulse 1.5s ease-in-out infinite;"></div>
          <div style="
            width:32px;height:32px;border-radius:50%;
            background:linear-gradient(135deg,#dc2626,#b91c1c);
            border:3px solid white;box-shadow:0 3px 14px #dc262688;
            display:flex;align-items:center;justify-content:center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
            background:#dc2626;border-radius:8px;padding:1px 6px;font-size:8px;font-weight:900;
            color:white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);
            line-height:13px;letter-spacing:0.5px;">SOS</div>
        </div>
      `,
      iconSize: [44, 56],
      iconAnchor: [22, 28],
      popupAnchor: [0, -22],
    });
  }

  if (willingToHelp && registered) {
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:44px;height:52px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:-4px;border-radius:50%;border:2.5px solid #16a34a;opacity:0.35;animation:fellow-pulse 2.5s ease-in-out infinite;"></div>
          <div style="
            width:32px;height:32px;border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#15803d);
            border:3px solid white;box-shadow:0 3px 14px #16a34a88;
            display:flex;align-items:center;justify-content:center;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div style="position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2px solid white;z-index:2;"></div>
          <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
            background:#16a34a;border-radius:8px;padding:1px 5px;font-size:8px;font-weight:900;
            color:white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);
            line-height:13px;">${spare_capacity}</div>
        </div>
      `,
      iconSize: [44, 56],
      iconAnchor: [22, 28],
      popupAnchor: [0, -22],
    });
  }

  const bg = registered ? '#2563eb' : '#6b7280';
  const border = registered ? '3px solid white' : '3px dashed white';
  const badge = registered
    ? `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid white;z-index:2;"></div>`
    : `<div style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;z-index:2;"></div>`;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:44px;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:30px;height:30px;border-radius:50%;background:${bg};
          border:${border};box-shadow:0 2px 12px ${bg}88;
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        ${badge}
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 24],
    popupAnchor: [0, -20],
  });
}

export default function NeighborAwarenessMarkers({ fellowFarmers }) {
  if (!fellowFarmers?.length) return null;

  return (
    <>
      {fellowFarmers.map((f) => (
        <Marker
          key={f.farm_id}
          position={[f.lat, f.lon]}
          icon={neighborIcon(f)}
          zIndexOffset={f.needsHelp ? 1100 : 900}
        >
          <Popup>
            <div className="p-3 min-w-[240px] max-w-[300px]">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  f.needsHelp ? 'bg-red-500' : f.willingToHelp ? 'bg-green-500' : f.registered ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <h3 className="font-bold text-sm text-slate-800">{f.name}</h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Owner: {f.owner} · {f.registered ? 'Registered' : 'NOT registered'}
              </p>

              {/* SOS Banner */}
              {f.needsHelp && (
                <div className="mb-2 p-2 rounded-lg border-2 border-red-200" style={{ background: '#fef2f2' }}>
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-1">
                    NEEDS HELP
                  </div>
                  <p className="text-xs text-red-700 font-semibold leading-snug">
                    {f.sosMessage || f.helpMessage || 'Requesting evacuation assistance'}
                  </p>
                </div>
              )}

              {/* Willing to help */}
              {f.willingToHelp && !f.needsHelp && (
                <div className="mb-2 p-2 rounded-lg border-2 border-green-200" style={{ background: '#f0fdf4' }}>
                  <div className="text-[10px] font-black uppercase tracking-wider text-green-700 mb-1">
                    WILLING TO HELP
                  </div>
                  <p className="text-xs text-green-800 font-semibold leading-snug">
                    {f.helpMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-2">
                {f.registered ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">Registered</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-600">Not on App</span>
                )}
                {f.spare_trailers > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                    {f.spare_trailers} trailer{f.spare_trailers > 1 ? 's' : ''}
                  </span>
                )}
                {f.spare_capacity > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                    {f.spare_capacity} spaces
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-semibold">Accepts:</span> {f.accepts.join(', ')}
              </div>

              {!f.registered && !f.needsHelp && (
                <p className="text-[10px] text-red-500 mt-2 font-medium">
                  Not on our app — please contact them directly to relay the fire warning.
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
