import { Marker } from 'react-leaflet';
import L from 'leaflet';

function createWindIcon(direction, speed, gusts) {
  return L.divIcon({
    className: 'wind-overlay',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transform: translateX(-50%);
      ">
        <div style="
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" style="transform: rotate(${direction}deg);" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L8 10h8L12 2z" fill="#2563eb" opacity="0.8"/>
            <path d="M12 22V10" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div style="display: flex; flex-direction: column; line-height: 1;">
            <span style="color: #1e40af; font-size: 12px; font-weight: 700; font-family: 'SF Mono', monospace;">${speed} mph</span>
            <span style="color: #94a3b8; font-size: 9px; font-family: Inter, sans-serif;">gusts ${gusts}</span>
          </div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function WindOverlay({ wind, fireOrigin }) {
  if (!wind) return null;

  const offsetLat = fireOrigin[0] + 0.08;
  const offsetLon = fireOrigin[1] + 0.08;

  return (
    <Marker
      position={[offsetLat, offsetLon]}
      icon={createWindIcon(wind.direction_deg, wind.speed_mph, wind.gusts_mph)}
      interactive={false}
    />
  );
}
