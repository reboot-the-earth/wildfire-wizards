import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const RISK_COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  moderate: '#ca8a04',
  low: '#16a34a',
};

function createFarmIcon(farm, isActive) {
  const riskColor = RISK_COLORS[farm.risk_level] || RISK_COLORS.moderate;
  const size = isActive ? 18 : 14;
  const pulseSize = isActive ? 30 : 0;

  return L.divIcon({
    className: 'farm-marker-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${isActive ? `<div style="
          position: absolute;
          width: ${pulseSize}px;
          height: ${pulseSize}px;
          border-radius: 50%;
          background: transparent;
          border: 2px solid ${riskColor};
          opacity: 0.5;
          animation: farm-pulse 2s ease-in-out infinite;
        "></div>` : ''}
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${riskColor};
          border: 2.5px solid white;
          border-radius: 4px;
          transform: rotate(45deg);
          box-shadow: 0 2px 6px ${riskColor}40;
        "></div>
      </div>
    `,
    iconSize: [size + 8, size + 8],
    iconAnchor: [(size + 8) / 2, (size + 8) / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

export default function FarmMarkers({ farms, activeFarm }) {
  if (!farms?.length) return null;

  return (
    <>
      {farms.map((farm) => {
        const isActive = activeFarm === farm.farm_id;

        return (
          <Marker
            key={farm.farm_id}
            position={[farm.lat, farm.lon]}
            icon={createFarmIcon(farm, isActive)}
            zIndexOffset={isActive ? 1000 : 0}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-sm rotate-45"
                    style={{ backgroundColor: RISK_COLORS[farm.risk_level] }}
                  />
                  <h3 className="font-bold text-sm text-slate-800">{farm.name}</h3>
                </div>
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
