import { useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * Visual styling for each forecast band. Tuned for the "command-center" dark
 * theme: hot core glows red, decay through orange → amber → ochre. Outer bands
 * use dashed strokes so the eye reads them as projections rather than fact.
 */
const PERIMETER_STYLES = {
  current: {
    color: '#ff3b30',
    weight: 2.4,
    fillColor: '#ff3b30',
    fillOpacity: 0.32,
    glow: '0 0 24px rgba(255, 59, 48, 0.85)',
    pulse: true,
  },
  1: { color: '#ff7849', weight: 2,   fillColor: '#ff7849', fillOpacity: 0.20, dashArray: '6 4' },
  2: { color: '#fbbf24', weight: 1.6, fillColor: '#fbbf24', fillOpacity: 0.13, dashArray: '6 4' },
  4: { color: '#eab308', weight: 1.4, fillColor: '#eab308', fillOpacity: 0.08, dashArray: '4 6' },
  6: { color: '#a16207', weight: 1.2, fillColor: '#a16207', fillOpacity: 0.05, dashArray: '3 8' },
};

/**
 * Smooth multi-stop ramp for the heat density layer. Carries from cool sky
 * blue at low density → magenta → orange → white-hot in the densest cores so
 * tightly clustered hotspots clearly visually pop above the perimeter bands.
 */
const HEAT_GRADIENT = {
  0.10: '#3b82f6',
  0.30: '#a855f7',
  0.50: '#f97316',
  0.70: '#ef4444',
  0.90: '#fde047',
  1.00: '#ffffff',
};

function HotspotHeatLayer({ hotspots, fireId }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !hotspots?.length) return;

    const points = hotspots.map((h) => {
      const intensity = Math.min(1, Math.max(0.4, (h.confidence ?? 75) / 100));
      const brightnessBoost = h.brightness ? Math.min(0.4, (h.brightness - 300) / 200) : 0;
      return [h.lat, h.lon, Math.min(1, intensity + brightnessBoost)];
    });

    const heat = L.heatLayer(points, {
      radius: 38,
      blur: 28,
      maxZoom: 13,
      minOpacity: 0.45,
      gradient: HEAT_GRADIENT,
    });

    heat.addTo(map);
    // leaflet.heat uses a canvas that otherwise captures clicks meant for map UI
    // controls (demo button, footer). Visual-only layer — never intercept pointer.
    const canvas = heat._canvas;
    if (canvas) canvas.style.pointerEvents = 'none';
    layerRef.current = heat;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, hotspots, fireId]);

  return null;
}

function makeHotspotIcon(intensity) {
  const size = 18 + Math.round(intensity * 14);
  const inner = 6 + Math.round(intensity * 6);
  return L.divIcon({
    className: 'fire-hotspot-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div class="hotspot-wrap" style="width:${size}px;height:${size}px;">
        <div class="hotspot-pulse"></div>
        <div class="hotspot-core" style="width:${inner}px;height:${inner}px;"></div>
      </div>
    `,
  });
}

export default function FireLayers({ fireData }) {
  const fireId = fireData?.fire_id;

  const projections = useMemo(() => {
    if (!fireData?.projected_perimeters) return [];
    return [...fireData.projected_perimeters].sort((a, b) => b.hours - a.hours);
  }, [fireId, fireData?.projected_perimeters]);

  const currentPerimeter = useMemo(() => fireData?.current_perimeter, [fireId, fireData?.current_perimeter]);
  const hotspots = useMemo(() => fireData?.active_hotspots || [], [fireId, fireData?.active_hotspots]);

  if (!fireData) return null;

  return (
    <>
      {projections.map((proj) => {
        const style = PERIMETER_STYLES[proj.hours] || PERIMETER_STYLES[6];
        return (
          <GeoJSON
            key={`fire-proj-${fireId}-${proj.hours}`}
            data={proj.geometry}
            style={() => ({
              color: style.color,
              weight: style.weight,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              dashArray: style.dashArray || null,
              lineCap: 'round',
              lineJoin: 'round',
            })}
          />
        );
      })}

      {currentPerimeter && (
        <GeoJSON
          key={`fire-current-${fireId}`}
          data={currentPerimeter}
          style={() => ({
            color: PERIMETER_STYLES.current.color,
            weight: PERIMETER_STYLES.current.weight,
            fillColor: PERIMETER_STYLES.current.fillColor,
            fillOpacity: PERIMETER_STYLES.current.fillOpacity,
            className: 'fire-perimeter-active',
            lineCap: 'round',
            lineJoin: 'round',
          })}
        />
      )}

      <HotspotHeatLayer hotspots={hotspots} fireId={fireId} />

      {hotspots.map((h, i) => {
        const intensity = Math.min(1, Math.max(0.4, (h.confidence ?? 75) / 100));
        return (
          <Marker
            key={`hotspot-${fireId}-${i}`}
            position={[h.lat, h.lon]}
            icon={makeHotspotIcon(intensity)}
            interactive={false}
            keyboard={false}
          />
        );
      })}
    </>
  );
}
