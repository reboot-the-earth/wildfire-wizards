import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#ca8a04',
  low: '#16a34a',
};

const CURRENT_USER_FARM_ID = 'valley_center_ranch';

/* ─────── YOUR farm — large teal marker, shows help status ─────── */

function createCurrentUserIcon(farm) {
  const needsHelp = farm.needsHelp;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:60px;height:68px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:2px;border-radius:50%;border:3px solid #0d9488;opacity:0.5;animation:fellow-pulse 2s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:8px;border-radius:50%;border:2px solid #0d9488;opacity:0.3;animation:fellow-pulse 2s ease-in-out infinite;animation-delay:0.5s;"></div>
        <div style="
          width:40px;height:40px;border-radius:10px;
          background:linear-gradient(135deg, #0d9488, #0891b2);
          border:3.5px solid white;
          box-shadow:0 4px 20px rgba(13,148,136,0.6), 0 0 0 3px rgba(13,148,136,0.25);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style="position:absolute;bottom:0px;left:50%;transform:translateX(-50%);
          background:linear-gradient(135deg, #0d9488, #0891b2);border-radius:10px;padding:2px 8px;
          font-size:8px;font-weight:900;color:white;white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);letter-spacing:0.8px;text-transform:uppercase;
          line-height:13px;">YOUR FARM</div>
        ${needsHelp ? `<div style="position:absolute;top:-4px;right:-4px;
          background:#dc2626;border-radius:6px;padding:1px 5px;
          font-size:7px;font-weight:900;color:white;white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);letter-spacing:0.5px;
          line-height:12px;animation:fellow-pulse 1.5s ease-in-out infinite;
          border:2px solid white;">SOS</div>` : ''}
      </div>
    `,
    iconSize: [60, 72],
    iconAnchor: [30, 36],
    popupAnchor: [0, -30],
  });
}

/* ─────── Danger farm — shows SOS if needsHelp ─────── */

function createDangerFarmIcon(farm) {
  const riskColor = RISK_COLORS[farm.risk_level] || RISK_COLORS.moderate;
  const sz = 30;
  const needsHelp = farm.needsHelp;

  const bottomLabel = needsHelp
    ? `<div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
        background:#dc2626;border-radius:6px;padding:1px 5px;font-size:7px;font-weight:900;
        color:white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);
        line-height:12px;letter-spacing:0.5px;">SOS · ${farm.estimated_time_to_fire_hours}h</div>`
    : `<div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
        background:${riskColor};border-radius:6px;padding:1px 5px;font-size:8px;font-weight:800;
        color:white;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);text-transform:uppercase;
        line-height:13px;">${farm.estimated_time_to_fire_hours}h</div>`;

  const pulse = needsHelp
    ? `<div style="position:absolute;inset:-4px;border-radius:4px;border:2px solid #dc2626;opacity:0.4;transform:rotate(45deg);animation:fellow-pulse 1.5s ease-in-out infinite;"></div>`
    : '';

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${sz + 8}px;height:${sz + 14}px;display:flex;align-items:center;justify-content:center;">
        ${pulse}
        <div style="
          width:${sz}px;height:${sz}px;
          background:${riskColor};border:3px solid white;
          border-radius:4px;transform:rotate(45deg);
          box-shadow:0 3px 12px ${riskColor}66;
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="${sz * 0.42}" height="${sz * 0.42}" viewBox="0 0 24 24" fill="white" stroke="none"
            style="transform:rotate(-45deg);">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        ${bottomLabel}
      </div>
    `,
    iconSize: [sz + 8, sz + 14],
    iconAnchor: [(sz + 8) / 2, (sz + 14) / 2],
    popupAnchor: [0, -(sz / 2 + 4)],
  });
}

export default function FarmMarkers({ farms, activeFarm }) {
  if (!farms?.length) return null;

  return (
    <>
      {farms.map((farm) => {
        const isCurrentUser = farm.farm_id === CURRENT_USER_FARM_ID;
        const icon = isCurrentUser
          ? createCurrentUserIcon(farm)
          : createDangerFarmIcon(farm);

        return (
          <Marker
            key={farm.farm_id}
            position={[farm.lat, farm.lon]}
            icon={icon}
            zIndexOffset={isCurrentUser ? 1200 : 600}
          >
            <Popup>
              <div className="p-3 min-w-[240px] max-w-[300px]">
                <div className="flex items-center gap-2 mb-2">
                  {isCurrentUser ? (
                    <span className="w-4 h-4 rounded-md flex-shrink-0" style={{ background: farm.needsHelp ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#0d9488,#0891b2)' }} />
                  ) : (
                    <div
                      className="w-3.5 h-3.5 rounded-sm rotate-45 flex-shrink-0"
                      style={{ backgroundColor: RISK_COLORS[farm.risk_level] }}
                    />
                  )}
                  <h3 className="font-bold text-sm text-slate-800">{farm.name}</h3>
                </div>

                {isCurrentUser && (
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2 px-2 py-1 rounded inline-block"
                    style={{
                      background: farm.needsHelp ? '#fef2f215' : '#0d948815',
                      color: farm.needsHelp ? '#dc2626' : '#0d9488',
                    }}>
                    Your Farm — Current User
                  </div>
                )}

                {/* SOS / Help needed banner */}
                {farm.needsHelp && farm.helpMessage && (
                  <div className="mb-2 p-2 rounded-lg border-2 border-red-200" style={{ background: '#fef2f2' }}>
                    <div className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-1">
                      {isCurrentUser ? 'YOU NEED HELP — VISIBLE TO ALL' : 'NEEDS HELP'}
                    </div>
                    <p className="text-xs text-red-700 font-semibold leading-snug">
                      {farm.helpMessage}
                    </p>
                  </div>
                )}

                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 py-1 rounded inline-block"
                  style={{
                    color: RISK_COLORS[farm.risk_level],
                    backgroundColor: `${RISK_COLORS[farm.risk_level]}12`,
                  }}
                >
                  {farm.risk_level} risk — {farm.estimated_time_to_fire_hours}h to fire
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{farm.alert_message}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
